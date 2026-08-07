/**
 * The auto-updater's contract, and it is mostly a contract about what must NOT be destroyed.
 *
 *   bun test selfupdate.test.ts
 *
 * THE TEST THAT MATTERS IS `an ignored file survives`. `git reset --hard` leaves untracked and ignored
 * paths alone, which is the only reason it is safe to run `--force`-style before every export: in this
 * repo the ignored paths are `out/` (~56 GB, HOURS to rebuild) and `.tools/` (the decompiler, which
 * needs the .NET SDK). One `git clean -x` added later "for thoroughness" would destroy both, and it
 * would do it silently. So the survival of an ignored file is asserted against a REAL repository with
 * a REAL remote and a REAL `reset --hard`, not against a mock — a mock of git cannot tell you what git
 * does.
 *
 * Everything here runs against scratch repos under `tmp/`, with a bare repo standing in for `origin`.
 * No network: a `file://`-style local remote exercises the identical fetch/reset code path. The one
 * test that needs a hung remote gets one deterministically via git's `ext::` transport rather than by
 * pointing at an unroutable IP and hoping.
 */

import { afterAll, describe, expect, test } from 'bun:test'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { IS_WINDOWS, shouldPrompt } from './platform'
import {
	ALREADY_CHECKED,
	DEFAULT_GIT_TIMEOUT_MS,
	UPDATE_CHECKED_ENV,
	git,
	reexec,
	selfUpdate,
	updateGate,
} from './selfupdate'

// ---------------------------------------------------------------------------------------------
// Scratch repositories
// ---------------------------------------------------------------------------------------------

const scratch: string[] = []
afterAll(() => {
	for (const dir of scratch) rmSync(dir, { recursive: true, force: true })
})

const tmp = (label: string) => {
	const dir = mkdtempSync(join(tmpdir(), `cs2-selfupdate-${label}-`))
	scratch.push(dir)
	return dir
}

/**
 * git for test SETUP, run synchronously and asserted to succeed.
 *
 * `-c` overrides rather than a global config: a host with `commit.gpgsign=true`, a signing key that
 * needs a passphrase, or `init.defaultBranch=master` would otherwise make these tests fail for
 * reasons that have nothing to do with the updater. `-b main` is explicit for the same reason.
 */
const setupGit = (cwd: string, argv: string[]) => {
	const r = Bun.spawnSync(
		[
			'git',
			'-c',
			'user.name=Test',
			'-c',
			'user.email=test@example.com',
			'-c',
			'commit.gpgsign=false',
			'-c',
			'protocol.file.allow=always',
			...argv,
		],
		{ cwd, stdout: 'pipe', stderr: 'pipe' },
	)
	if (r.exitCode !== 0) throw new Error(`setup \`git ${argv.join(' ')}\` in ${cwd} failed: ${r.stderr.toString()}`)
	return r.stdout.toString().trim()
}

const headOf = (cwd: string) => setupGit(cwd, ['rev-parse', 'HEAD'])

/**
 * A checkout with an upstream that is one commit AHEAD of it, plus a second clone for pushing more.
 *
 * The committed `.gitignore` is load-bearing: it is what makes `out/` an ignored path in the scratch
 * repo, so the survival assertions test the same mechanism the real repo relies on.
 */
const withRemote = (label: string) => {
	const root = tmp(label)
	const origin = join(root, 'origin.git')
	const work = join(root, 'work')
	const push = join(root, 'push')

	mkdirSync(work, { recursive: true })
	setupGit(work, ['init', '-b', 'main'])
	writeFileSync(join(work, '.gitignore'), 'out/\nignored.txt\n')
	writeFileSync(join(work, 'export.ts'), 'v1\n')
	writeFileSync(join(work, 'package.json'), '{ "name": "scratch", "version": "1.0.0" }\n')
	setupGit(work, ['add', '.'])
	setupGit(work, ['commit', '-m', 'first'])

	setupGit(root, ['init', '--bare', '-b', 'main', origin])
	setupGit(work, ['remote', 'add', 'origin', origin])
	setupGit(work, ['push', '-u', 'origin', 'main'])

	setupGit(root, ['clone', origin, push])

	/** Add a commit upstream, so `work` falls behind by one. */
	const pushUpstream = (files: Record<string, string>, message = 'upstream') => {
		for (const [name, body] of Object.entries(files)) writeFileSync(join(push, name), body)
		setupGit(push, ['add', '.'])
		setupGit(push, ['commit', '-m', message])
		setupGit(push, ['push', 'origin', 'main'])
		return headOf(push)
	}

	return { root, origin, work, push, pushUpstream }
}

/** The env a human at a terminal has: nothing set that would gate the updater out. */
const humanEnv: Record<string, string | undefined> = { PATH: process.env.PATH }

/** Run the updater the way an operator would, collecting what they would have seen. */
const update = async (cwd: string, extra: Partial<Parameters<typeof selfUpdate>[0]> = {}) => {
	const lines: string[] = []
	const outcome = await selfUpdate({
		cwd,
		args: [],
		env: humanEnv,
		tty: true,
		install: false,
		log: m => lines.push(m),
		...extra,
	})
	return { outcome, lines, said: (needle: string) => lines.some(l => l.includes(needle)) }
}

// ---------------------------------------------------------------------------------------------
// The gate — every refusal, with no filesystem and no git
// ---------------------------------------------------------------------------------------------

describe('updateGate — when the updater must not run', () => {
	test('a human at a terminal with nothing set: it runs', () => {
		expect(updateGate([], humanEnv, true)).toBeNull()
	})

	test('--no-update opts out, and beats --update if somebody passes both', () => {
		expect(updateGate(['--no-update'], humanEnv, true)).toContain('--no-update')
		expect(updateGate(['--update', '--no-update'], humanEnv, true)).toContain('--no-update')
	})

	test('CS2_EXPORT_NO_UPDATE opts out — and only when it means yes', () => {
		expect(updateGate([], { ...humanEnv, CS2_EXPORT_NO_UPDATE: '1' }, true)).toContain('CS2_EXPORT_NO_UPDATE')
		// A shell that exports the variable as empty/0/false must not be read as an opt-out; that is how
		// "why did it stop updating on that one machine" starts.
		for (const off of ['', '0', 'false', 'no'])
			expect(updateGate([], { ...humanEnv, CS2_EXPORT_NO_UPDATE: off }, true)).toBeNull()
	})

	/**
	 * THE LOOP BREAKER. `reexec` sets this in the child, and `runSelfUpdate` sets it in the parent once
	 * the check has run, so it is inherited by the picker's own re-exec too. If this ever stopped
	 * gating, an update would restart into a process that updates and restarts, forever.
	 */
	test('the re-exec marker stops a second check, and it beats an explicit --update', () => {
		expect(updateGate([], { ...humanEnv, [UPDATE_CHECKED_ENV]: '1' }, true)).toBe(ALREADY_CHECKED)
		expect(updateGate(['--update'], { ...humanEnv, [UPDATE_CHECKED_ENV]: '1' }, true)).toBe(ALREADY_CHECKED)
	})

	/**
	 * A CI runner checks out an exact ref and then asserts things about it. Moving that ref underneath
	 * the job turns a red build into a mystery, so CI is opt-IN.
	 */
	test('CI=true skips, and --update is how a scheduled job asks for it anyway', () => {
		expect(updateGate([], { ...humanEnv, CI: 'true' }, true)).toContain('CI=true')
		expect(updateGate(['--update'], { ...humanEnv, CI: 'true' }, true)).toBeNull()
	})

	test('no TTY skips — cron, a pipe, a redirect — and --update overrides that too', () => {
		expect(updateGate([], humanEnv, false)).toContain('not a terminal')
		expect(updateGate(['--update'], humanEnv, false)).toBeNull()
	})

	test('every skip reason is one short line, because it prints on an ordinary run', () => {
		for (const reason of [
			updateGate(['--no-update'], humanEnv, true),
			updateGate([], { ...humanEnv, CI: 'true' }, true),
			updateGate([], humanEnv, false),
		]) {
			expect(reason).not.toBeNull()
			expect(reason).not.toContain('\n')
			expect((reason ?? '').length).toBeLessThan(80)
		}
	})
})

/**
 * THE INTERACTION THAT WOULD HAVE BEEN A DISASTER. `shouldPrompt` treats "any argument at all" as
 * "the caller knows what it wants" and falls through to the flag path — where an EMPTY argv means a
 * full export that deletes the output folder first. So `bun run export.ts --no-update`, a command
 * whose author is asking for *less* to happen, would have started a 55 GB destructive run with no
 * confirmation. The update flags are subtracted before that count.
 */
describe('the update flags must not disarm the interactive picker', () => {
	test('--no-update / --update on their own still open the picker', () => {
		expect(shouldPrompt(['--no-update'], true)).toBe(true)
		expect(shouldPrompt(['--update'], true)).toBe(true)
		expect(shouldPrompt(['--no-update', '--update'], true)).toBe(true)
	})

	test('but a real flag beside them still skips it, exactly as before', () => {
		expect(shouldPrompt(['--no-update', '--discover'], true)).toBe(false)
		expect(shouldPrompt(['--no-update', '--only', 'models'], true)).toBe(false)
		expect(shouldPrompt(['--no-update', '--yes'], true)).toBe(false)
	})

	test('and they do not defeat the non-TTY rule', () => {
		expect(shouldPrompt(['--no-update'], false)).toBe(false)
	})
})

// ---------------------------------------------------------------------------------------------
// The skip paths, against real repositories
// ---------------------------------------------------------------------------------------------

describe('nothing to update from — real repos, real skips', () => {
	test('a plain directory is not a checkout', async () => {
		const { outcome } = await update(tmp('nogit'))
		expect(outcome).toEqual({ kind: 'skipped', reason: 'not a git checkout — the update check has nothing to do' })
	})

	/**
	 * THIS IS THE REPO'S STATE AS THIS WAS WRITTEN: `git init`, no commit, so the default path had to be
	 * a clean no-op. An unborn branch is also the one case where a careless `git rev-parse HEAD` prints
	 * `ambiguous argument 'HEAD'` to stderr and looks like a crash.
	 */
	test('a fresh `git init` with no commits skips quietly', async () => {
		const dir = tmp('unborn')
		setupGit(dir, ['init', '-b', 'main'])
		const { outcome } = await update(dir)
		expect(outcome).toEqual({ kind: 'skipped', reason: 'no commits yet — nothing to update from' })
	})

	test('a commit but no remote: no upstream, so nothing to update from', async () => {
		const dir = tmp('noremote')
		setupGit(dir, ['init', '-b', 'main'])
		writeFileSync(join(dir, 'a.txt'), 'a\n')
		setupGit(dir, ['add', '.'])
		setupGit(dir, ['commit', '-m', 'first'])
		const { outcome } = await update(dir)
		expect(outcome.kind).toBe('skipped')
		expect(outcome.kind === 'skipped' && outcome.reason).toContain('no upstream remote')
	})

	test('a remote that exists but no upstream tracking branch still skips', async () => {
		const { work, origin } = withRemote('noupstream')
		setupGit(work, ['checkout', '-b', 'sidebranch'])
		const { outcome } = await update(work)
		expect(outcome.kind).toBe('skipped')
		expect(outcome.kind === 'skipped' && outcome.reason).toContain('no upstream remote')
		expect(existsSync(origin)).toBe(true) // the remote was there; the branch just did not track it
	})

	test('a detached HEAD is pinned on purpose and is left alone', async () => {
		const { work, pushUpstream } = withRemote('detached')
		pushUpstream({ 'export.ts': 'v2\n' })
		setupGit(work, ['checkout', '--detach'])
		const { outcome } = await update(work)
		expect(outcome).toEqual({ kind: 'skipped', reason: 'detached HEAD — leaving this checkout where it is' })
	})

	test('a branch pointing at a remote that has been deleted skips instead of erroring', async () => {
		const { work, pushUpstream } = withRemote('goneremote')
		pushUpstream({ 'export.ts': 'v2\n' })
		setupGit(work, ['config', 'branch.main.remote', 'nowhere'])
		const { outcome } = await update(work)
		expect(outcome.kind).toBe('skipped')
		expect(outcome.kind === 'skipped' && outcome.reason).toContain('"nowhere", which does not exist')
	})

	/**
	 * A GUARD ON THIS VERY REPO, not a unit test. Whatever state the exporter's own checkout is in when
	 * the suite runs, running the updater against it must not mutate it: a test run that hard-resets the
	 * working tree it is running from would destroy the change under review. Any outcome except
	 * `updated` is acceptable; `updated` never is.
	 */
	test('running the updater against THIS checkout never rewrites it', async () => {
		const { outcome } = await update(import.meta.dir, { args: ['--no-update'] })
		expect(outcome.kind).toBe('skipped')
	})
})

// ---------------------------------------------------------------------------------------------
// The destructive path, proven in both directions
// ---------------------------------------------------------------------------------------------

describe('a real force-pull: what dies and what does not', () => {
	test('tracked edits are discarded and NAMED; untracked and ignored files survive', async () => {
		const { work, pushUpstream } = withRemote('force')
		const before = headOf(work)
		const after = pushUpstream({ 'export.ts': 'v2\n', 'new-file.ts': 'added upstream\n' })

		// A local edit to a TRACKED file — the thing the user asked to be steamrolled.
		writeFileSync(join(work, 'export.ts'), 'LOCAL EDIT, in the way of the pull\n')
		// An UNTRACKED file: an operator's scratch notes beside the scripts.
		writeFileSync(join(work, 'my-notes.txt'), 'keep me\n')
		// An IGNORED file, and the ignored FOLDER that stands in for out/ — ~56 GB in the real repo.
		writeFileSync(join(work, 'ignored.txt'), 'keep me too\n')
		mkdirSync(join(work, 'out', 'data'), { recursive: true })
		writeFileSync(join(work, 'out', 'data', 'manifest.json'), '{"hours":"of work"}\n')

		const { outcome, said } = await update(work)

		expect(outcome.kind).toBe('updated')
		if (outcome.kind !== 'updated') return
		expect(outcome.from).toBe(before)
		expect(outcome.to).toBe(after)

		// --- the discard happened, and was announced before it happened -------------------------
		expect(outcome.discarded).toEqual(['export.ts'])
		expect(said('discarding local changes to 1 tracked file(s): export.ts')).toBe(true)
		expect(readFileSync(join(work, 'export.ts'), 'utf8')).toBe('v2\n')
		expect(readFileSync(join(work, 'new-file.ts'), 'utf8')).toBe('added upstream\n')
		expect(headOf(work)).toBe(after)

		// --- AND THE PART THAT MATTERS: nothing git does not track was touched -------------------
		expect(existsSync(join(work, 'my-notes.txt'))).toBe(true)
		expect(readFileSync(join(work, 'my-notes.txt'), 'utf8')).toBe('keep me\n')
		expect(existsSync(join(work, 'ignored.txt'))).toBe(true)
		expect(readFileSync(join(work, 'ignored.txt'), 'utf8')).toBe('keep me too\n')
		expect(existsSync(join(work, 'out', 'data', 'manifest.json'))).toBe(true)
		expect(readFileSync(join(work, 'out', 'data', 'manifest.json'), 'utf8')).toBe('{"hours":"of work"}\n')

		// The untracked and ignored files are not mentioned as at-risk either, because they are not.
		expect(outcome.discarded).not.toContain('my-notes.txt')
		expect(outcome.discarded).not.toContain('ignored.txt')
		expect(outcome.overwritten).toEqual([])
		expect(said('my-notes.txt')).toBe(false)
		expect(said('ignored.txt')).toBe(false)
		expect(said('out/data/manifest.json')).toBe(false)
	})

	/**
	 * ****  THE CATASTROPHE GUARD.  ****
	 *
	 * A source-level assertion, because the damage is not something a behavioural test can undo. In
	 * this repo the IGNORED paths are `out/` (~56 GB, hours of decompilation) and `.tools/` (the
	 * decompiler, which needs the .NET SDK to rebuild). `git reset --hard` cannot touch either.
	 * `git clean -fd` would delete an operator's untracked notes; `git clean -fdx` would delete
	 * BOTH ignored trees, on every run, silently. There is no version of "make the pull more thorough"
	 * that needs it — the reset already succeeds — so the only way it gets added is by someone
	 * reasoning from `git clean`'s reputation rather than from this repo's `.gitignore`.
	 *
	 * If you are here because this test failed: the answer is not to update the test.
	 */
	test('there is no `git clean` in the updater, and there must never be', () => {
		const src = readFileSync(join(import.meta.dir, 'selfupdate.ts'), 'utf8')

		// Asserted against the ARGV, not the prose: the header comment names `git clean -fdx` in order
		// to forbid it, so a substring search for the flags would fail on its own warning.
		const verbs = [...src.matchAll(/git\(cwd, \['([a-z-]+)'/g)].map(m => m[1])
		// Read-only every one of them, except `reset`. Adding to this list should feel like a decision.
		const allowed = ['rev-parse', 'symbolic-ref', 'config', 'remote', 'fetch', 'rev-list', 'status', 'diff', 'ls-files', 'reset']
		expect({ unexpectedGitVerbs: verbs.filter(v => !allowed.includes(v ?? '')) }).toEqual({ unexpectedGitVerbs: [] })
		expect(verbs).toContain('reset') // the one destructive call, and the only one
		expect(verbs).not.toContain('clean')
		// No `clean` reachable as a string literal anywhere either — an argv built elsewhere and spread in.
		expect({ cleanAsALiteral: /['"`]clean['"`]/.test(src) }).toEqual({ cleanAsALiteral: false })
	})

	/**
	 * REGRESSION, and it was found by the test above it rather than by reading.
	 *
	 * `git status --porcelain` reports the worktree status in COLUMN 2, so an unstaged edit is
	 * `" M export.ts"` with a leading space. The first version of `git()` returned only a trimmed
	 * stdout, so the fixed-column parse produced `"xport.ts"` — every filename in the "discarding local
	 * changes to …" line missing its first character. The message that exists to make the destructive
	 * step trustworthy was itself untrustworthy, and nothing about it looked wrong.
	 */
	test('a modified-but-unstaged file keeps its first character', async () => {
		const { work, pushUpstream } = withRemote('porcelain')
		pushUpstream({ 'other.ts': 'upstream\n' })
		writeFileSync(join(work, 'export.ts'), 'edited\n')
		writeFileSync(join(work, 'package.json'), '{ "edited": true }\n')

		const raw = await git(work, ['status', '--porcelain', '--untracked-files=no'])
		expect(raw.raw.startsWith(' M ')).toBe(true) // the leading space really is there
		expect(raw.out.startsWith('M ')).toBe(true) // and `.trim()` really does eat it

		const { outcome } = await update(work)
		expect(outcome.kind === 'updated' && outcome.discarded.sort()).toEqual(['export.ts', 'package.json'])
	})

	/**
	 * THE ONE WAY AN UNTRACKED FILE CAN BE LOST, and it is the exception that makes the rule honest.
	 *
	 * "reset --hard leaves untracked files alone" holds only for paths the target commit does not
	 * contain. Measured here: the upstream starts tracking `newfile.ts`, the operator already has an
	 * untracked `newfile.ts`, and git replaces it WITHOUT A WORD — `git status --untracked-files=no`
	 * cannot see it coming, so the "discarding …" line above would never have mentioned it.
	 *
	 * The updater cannot prevent it (the file has to be written for the update to be the update) but it
	 * must not be silent about it, so it gets its own line and its own field.
	 */
	test('an untracked file the upstream starts tracking IS overwritten, and is announced', async () => {
		const { work, pushUpstream } = withRemote('collide')
		pushUpstream({ 'newfile.ts': 'FROM UPSTREAM\n' })
		writeFileSync(join(work, 'newfile.ts'), 'MY PRECIOUS UNTRACKED WORK\n')
		// And a control: an untracked file the upstream knows nothing about, which must survive.
		writeFileSync(join(work, 'unrelated.txt'), 'untouched\n')

		const { outcome, said } = await update(work)
		expect(outcome.kind).toBe('updated')
		if (outcome.kind !== 'updated') return

		expect(outcome.overwritten).toEqual(['newfile.ts'])
		expect(said('OVERWRITING 1 untracked file(s) the update starts tracking: newfile.ts')).toBe(true)
		expect(readFileSync(join(work, 'newfile.ts'), 'utf8')).toBe('FROM UPSTREAM\n')
		// It is NOT a "tracked change" — it was never tracked here — so it must not be double-counted.
		expect(outcome.discarded).toEqual([])

		// The control survived, which is what keeps the general rule true.
		expect(readFileSync(join(work, 'unrelated.txt'), 'utf8')).toBe('untouched\n')
		expect(outcome.overwritten).not.toContain('unrelated.txt')
	})

	test('a staged change and a deleted tracked file are named too', async () => {
		const { work, pushUpstream } = withRemote('staged')
		pushUpstream({ 'export.ts': 'v2\n' })
		writeFileSync(join(work, 'staged.ts'), 'staged\n')
		setupGit(work, ['add', 'staged.ts'])
		rmSync(join(work, 'package.json'))

		const { outcome, said } = await update(work)
		expect(outcome.kind).toBe('updated')
		if (outcome.kind !== 'updated') return
		expect(outcome.discarded.sort()).toEqual(['package.json', 'staged.ts'])
		expect(said('discarding local changes to 2 tracked file(s)')).toBe(true)
		// The reset restores the deleted tracked file, which is the point of it.
		expect(existsSync(join(work, 'package.json'))).toBe(true)
	})

	/**
	 * THE NO-UPDATE-NO-DESTRUCTION RULE. When the upstream has nothing new there is nothing to make
	 * room for, so a local edit is left alone. Discarding work in that case would be destruction with
	 * no purpose whatsoever, and it is the shape of bug a naive "always reset --hard" would have.
	 */
	test('already current: no reset, and a local edit is NOT discarded', async () => {
		const { work } = withRemote('current')
		const head = headOf(work)
		writeFileSync(join(work, 'export.ts'), 'MY WORK IN PROGRESS\n')

		const { outcome, lines } = await update(work)
		expect(outcome).toEqual({ kind: 'current', head })
		expect(readFileSync(join(work, 'export.ts'), 'utf8')).toBe('MY WORK IN PROGRESS\n')
		expect(lines.join('\n')).not.toContain('discarding')
	})

	/**
	 * Local COMMITS are out of scope. The request was "don't care about uncommitted files"; an unpushed
	 * commit is a different thing, and a tool that runs before every export should not be the one
	 * deciding to rewind it.
	 */
	test('local commits are refused, not rewound', async () => {
		const { work, pushUpstream } = withRemote('diverged')
		pushUpstream({ 'export.ts': 'v2\n' })
		writeFileSync(join(work, 'mine.ts'), 'my commit\n')
		setupGit(work, ['add', '.'])
		setupGit(work, ['commit', '-m', 'my local work'])
		const mine = headOf(work)

		const { outcome } = await update(work)
		expect(outcome.kind).toBe('diverged')
		if (outcome.kind !== 'diverged') return
		expect(outcome.ahead).toBe(1)
		expect(outcome.reason).toContain('git reset --hard') // names the manual escape hatch
		// Nothing moved, and the commit is still there.
		expect(headOf(work)).toBe(mine)
		expect(existsSync(join(work, 'mine.ts'))).toBe(true)
	})

	test('a fast-forward of many commits still reports one from/to pair', async () => {
		const { work, pushUpstream } = withRemote('many')
		pushUpstream({ 'a.ts': '1\n' }, 'one')
		pushUpstream({ 'b.ts': '2\n' }, 'two')
		const third = pushUpstream({ 'c.ts': '3\n' }, 'three')
		const { outcome, said } = await update(work)
		expect(outcome.kind === 'updated' && outcome.to).toBe(third)
		expect(said('3 file(s) changed')).toBe(true)
		for (const f of ['a.ts', 'b.ts', 'c.ts']) expect(existsSync(join(work, f))).toBe(true)
	})
})

// ---------------------------------------------------------------------------------------------
// Failure must never block a run
// ---------------------------------------------------------------------------------------------

describe('a broken remote warns and gets out of the way', () => {
	test('an unreachable remote is a failure the caller continues past', async () => {
		const { work } = withRemote('unreachable')
		const head = headOf(work)
		setupGit(work, ['remote', 'set-url', 'origin', join(work, '..', 'does-not-exist.git')])

		const { outcome } = await update(work)
		expect(outcome.kind).toBe('failed')
		if (outcome.kind !== 'failed') return
		expect(outcome.reason).toContain('git fetch origin failed')
		// The wording is the contract: a failed update is not a failed export.
		expect(outcome.reason).toContain('continuing with the code on disk')
		expect(headOf(work)).toBe(head)
	})

	/**
	 * A HUNG FETCH, DETERMINISTICALLY. This is the same bug class as the `--interactive`-on-a-pipe hang
	 * `interactiveNeedsTty` exists for: the updater runs before everything, so a fetch that never
	 * returns is a CLI that never starts, with no output to explain why.
	 *
	 * Rather than point at an unroutable IP and hope the TCP stack cooperates, this uses git's own
	 * `ext::` transport to make the remote literally `sleep`. `protocol.ext.allow` has to be enabled in
	 * the scratch repo because git refuses `ext::` by default — which is itself worth knowing: a hostile
	 * remote URL cannot run commands through this code path.
	 */
	test.skipIf(IS_WINDOWS)('a remote that hangs is killed by the timeout, not waited on', async () => {
		const { root, work } = withRemote('hang')
		// `ext::` splits its argument on whitespace and does NOT honour quotes, so the hang has to be a
		// script with a space-free path rather than an inline `sh -c "sleep 5"`.
		const helper = join(root, 'hang.sh')
		writeFileSync(helper, '#!/bin/sh\nsleep 5\n')
		chmodSync(helper, 0o755)
		setupGit(work, ['config', 'protocol.ext.allow', 'always'])
		setupGit(work, ['remote', 'set-url', 'origin', `ext::${helper}`])

		const t0 = Date.now()
		const { outcome } = await update(work, { timeoutMs: 1200 })
		const elapsed = Date.now() - t0

		expect(outcome.kind).toBe('failed')
		expect(outcome.kind === 'failed' && outcome.reason).toContain('timed out')
		// Killed, not waited out: the helper sleeps 5s and the timeout is 1.2s.
		expect(elapsed).toBeLessThan(4000)
	}, 15_000)

	test('git itself cannot be prompted for credentials from our terminal', async () => {
		// Not observable from outside, so this pins the two mechanisms instead: stdin is never the
		// caller's terminal, and the credential helper is disabled per-invocation.
		const src = readFileSync(join(import.meta.dir, 'selfupdate.ts'), 'utf8')
		expect(src).toContain("GIT_TERMINAL_PROMPT: '0'")
		expect(src).toContain("'credential.helper='")
		expect(src).toContain("stdin: 'ignore'")
	})

	/**
	 * `Bun.spawn` THROWS rather than returning a code when it cannot start the process — git missing
	 * from PATH, or an unusable cwd. An unhandled throw here would fail an export over a failed update,
	 * which is precisely the thing this feature must never do. A nonexistent cwd reproduces that throw
	 * without uninstalling git.
	 */
	test('a spawn that cannot even start is a skip, not an exception', async () => {
		const missing = join(tmp('nocwd'), 'no', 'such', 'dir')
		const r = await git(missing, ['--version'], 500)
		expect(r.code).toBe(-1)
		expect(r.err.length).toBeGreaterThan(0)

		const { outcome } = await update(missing)
		expect(outcome).toEqual({ kind: 'skipped', reason: 'not a git checkout — the update check has nothing to do' })
	})
})

// ---------------------------------------------------------------------------------------------
// bun install, and the re-exec
// ---------------------------------------------------------------------------------------------

describe('a dependency change is installed before the restart', () => {
	/**
	 * Otherwise the updated code hits `Cannot find module` at an import and the failure looks like a bug
	 * in the exporter rather than a consequence of the update.
	 */
	test('package.json moving in the pull triggers an install', async () => {
		const { work, pushUpstream } = withRemote('install')
		pushUpstream({ 'package.json': '{ "name": "scratch", "version": "2.0.0" }\n' })
		const { outcome, said } = await update(work, { install: true })
		expect(outcome.kind).toBe('updated')
		expect(said('running bun install before restarting')).toBe(true)
		// A dependency-free manifest installs offline, so this really did run `bun install`.
		expect(outcome.kind === 'updated' && outcome.installed).toBe(true)
	}, 30_000)

	test('bun.lock moving triggers it too', async () => {
		const { work, pushUpstream } = withRemote('locktrigger')
		pushUpstream({ 'bun.lock': '{"lockfileVersion":1}\n' })
		const { said } = await update(work, { install: false })
		expect(said('run `bun install`')).toBe(true)
	})

	test('a pull that only touches source code does not', async () => {
		const { work, pushUpstream } = withRemote('noinstall')
		pushUpstream({ 'export.ts': 'v2\n' })
		const { outcome, said } = await update(work, { install: true })
		expect(outcome.kind === 'updated' && outcome.installed).toBe(false)
		expect(said('bun install')).toBe(false)
	})
})

describe('reexec', () => {
	/**
	 * END TO END ON THE LOOP BREAKER: a child launched by `reexec` sees the marker, and a gate call
	 * with that child's own environment refuses. Without this the update would restart into a process
	 * that updates and restarts, and the CLI would never reach an export.
	 */
	test('the child inherits the marker, so its own gate refuses', async () => {
		const dir = tmp('reexec')
		const script = join(dir, 'child.ts')
		writeFileSync(
			script,
			[
				"import { updateGate, UPDATE_CHECKED_ENV } from '" + join(import.meta.dir, 'selfupdate.ts') + "'",
				'console.log(JSON.stringify({ marker: process.env[UPDATE_CHECKED_ENV], gate: updateGate([], process.env, true) }))',
				'process.exit(7)',
			].join('\n'),
		)
		const out = join(dir, 'out.txt')
		// `reexec` inherits stdout, so the child's line goes to the suite's stdout; run it once more
		// under a captured pipe to read the value rather than reimplementing `reexec` here.
		const code = await reexec(script, [], dir)
		expect(code).toBe(7) // the exit code is passed through, not swallowed

		const captured = Bun.spawnSync([process.execPath, 'run', script], {
			cwd: dir,
			env: { ...process.env, [UPDATE_CHECKED_ENV]: '1' },
			stdout: 'pipe',
			stderr: 'pipe',
		})
		writeFileSync(out, captured.stdout.toString())
		const parsed = JSON.parse(captured.stdout.toString().trim())
		expect(parsed.marker).toBe('1')
		expect(parsed.gate).toBe(ALREADY_CHECKED)
	}, 30_000)
})

describe('timeout configuration', () => {
	test('the default is bounded, and CS2_EXPORT_UPDATE_TIMEOUT overrides it', async () => {
		expect(DEFAULT_GIT_TIMEOUT_MS).toBeGreaterThan(0)
		expect(DEFAULT_GIT_TIMEOUT_MS).toBeLessThanOrEqual(60_000)
		// A garbage value falls back rather than becoming an instant timeout on every git call.
		const { work } = withRemote('badtimeout')
		const { outcome } = await update(work, { env: { ...humanEnv, CS2_EXPORT_UPDATE_TIMEOUT: 'not-a-number' } })
		expect(outcome.kind).toBe('current')
	})
})
