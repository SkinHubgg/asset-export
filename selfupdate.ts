/**
 * The auto-updater — what runs before anything else so a run exports with the CURRENT code.
 *
 * WHY IT EXISTS. This tool is handed to operators who clone it once and then run it after every CS2
 * update, for years. Nobody remembers to `git pull` first, so bug fixes shipped here did not reach the
 * people running exports; they reported problems that had already been fixed months earlier. So the
 * ordinary invocation now brings the working copy up to date, and only then starts.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * WHAT IS DESTROYED, EXACTLY. Read this before changing anything below.
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 *
 * The update is `git fetch` + `git reset --hard <upstream>`. That pair:
 *
 *   DISCARDS  local modifications to files git already TRACKS, and staged changes. This is the part
 *             that was asked for — "a pull that doesn't care if there are uncommitted files". Every
 *             such file is LISTED BY NAME before it is discarded, because "doesn't care" was a
 *             request about behaviour, not about silence: a tool that eats an afternoon's work with
 *             no output is not a convenience.
 *
 *   DOES NOT  touch untracked files, and does not touch ignored ones — with ONE measured exception,
 *   TOUCH     below. `reset --hard` writes the paths in the target tree and nothing else, so anything
 *             git does not track is invisible to it. That is not a nicety here, it is the whole
 *             safety margin:
 *
 *   ****  THERE IS NO `git clean` IN THIS FILE AND THERE MUST NEVER BE ONE.  ****
 *
 *             `git clean -fd` would delete an operator's `--cs2` notes and any scratch file beside
 *             the scripts. `git clean -fdx` would additionally delete every IGNORED path — which in
 *             this repo means `out/` (~56 GB and HOURS to rebuild), `out-sample/`, and `.tools/`
 *             (the built decompiler, which needs the .NET SDK to recreate). One `-x` is the entire
 *             distance between "the update was convenient" and "the update destroyed a day".
 *             A reset does not need a clean to succeed. Do not add one to "be thorough".
 *
 *   THE ONE   An untracked file whose path the INCOMING COMMIT STARTS TRACKING is overwritten, because
 *   EXCEPTION that path is in the target tree. Measured on a scratch repo, and git says nothing at all
 *             when it happens. `git status --untracked-files=no` cannot see it either, so it is
 *             detected separately (see `overwritten`) and printed on its own line. Narrow, but it is
 *             the case a person would be angriest about, and "untracked files are safe" would have
 *             been a lie without it.
 *
 *   DOES NOT  discard local COMMITS. If the branch has commits the upstream does not, the update is
 *   DO        SKIPPED with a warning rather than rewound. The request was about *uncommitted* files;
 *             a developer's unpushed commit is a different thing, and silently resetting past it is
 *             not something a tool should decide. The warning names the manual command.
 *
 *   DOES NOT  do anything at all when the upstream is not AHEAD. If HEAD already equals the upstream
 *   DO        commit there is no update to load, so nothing is fetched into the tree and nothing is
 *             discarded. Throwing away edits when there was no update to make room for would be
 *             destruction with no purpose.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 * WHEN IT DOES NOT RUN. Every one of these is a SKIP with one line of explanation, never an error:
 * a failed update must not fail a run. Exporting is this tool's job; updating is a courtesy.
 * ─────────────────────────────────────────────────────────────────────────────────────────────────
 *
 *   --no-update, or CS2_EXPORT_NO_UPDATE=1     explicit opt-out
 *   already checked in this process tree        the re-exec guard, see below
 *   not a git repo                             a zip download, or a vendored copy
 *   no remote / no upstream / unborn branch     nothing to update FROM. True of a fresh `git init`
 *   detached HEAD                              a pinned checkout is pinned on purpose
 *   CI, or no TTY on stdin                     ↓
 *   fetch failed (offline, timeout, auth)      warn, then run the current code anyway
 *
 * THE CI RULE IS THE IMPORTANT ONE. A CI runner checks out an exact ref and then asserts things about
 * it; moving that ref underneath the job turns a red build into a mystery. `CI=true` or a non-TTY
 * stdin therefore skips, matching `shouldPrompt`'s reading of "is a human watching this". `--update`
 * forces past that heuristic for the case where a scheduled job genuinely does want the latest.
 *
 * TWO THINGS THAT MAKE IT ACTUALLY WORK, both learned the hard way in this repo:
 *
 * 1. IT RE-EXECS. The process is already running the OLD code — its modules were loaded before the
 *    reset touched the disk — so pulling and continuing in-process runs exactly the code the update
 *    was meant to replace. `interactive.ts` established this pattern for the picker; this reuses it.
 *    The re-exec happens ONLY when the reset actually moved HEAD, so the common "already current"
 *    path costs one `git fetch` and no second process. `CS2_EXPORT_UPDATE_CHECKED=1` is set in the
 *    child's environment — and, once the check has run, in this process's own environment so that
 *    the picker's own re-exec inherits it — which is what makes an update loop impossible.
 *
 * 2. IT RUNS `bun install` WHEN THE MANIFEST MOVED. If the pull changed `package.json` or `bun.lock`,
 *    the updated code is one import away from a module that is not on disk, and the resulting
 *    `Cannot find module` looks like a bug in the exporter rather than a consequence of the update.
 *
 * EVERY GIT CALL HAS A TIMEOUT AND CANNOT PROMPT. An unreachable remote makes `git fetch` hang until
 * TCP gives up, which for a tool that runs `fetch` before it does anything means the CLI appears to
 * be broken; and a private HTTPS remote makes git ask for a password on stdin (or pop a credential
 * dialog on Windows), which hangs it forever. Both are the same class of bug as the
 * `--interactive`-on-a-pipe hang that `interactiveNeedsTty` exists to prevent, so: a hard timeout on
 * every invocation, `GIT_TERMINAL_PROMPT=0`, and `-c credential.helper=` to disable the OS keychain
 * and Windows Git Credential Manager for these calls only.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'

/** Set once the check has run, in this process and in every child. The re-exec loop breaker. */
export const UPDATE_CHECKED_ENV = 'CS2_EXPORT_UPDATE_CHECKED'

/** How long any single git call may take. A hung fetch must not become a hung CLI. */
export const DEFAULT_GIT_TIMEOUT_MS = 20_000

export type UpdateOutcome =
	/** Deliberately did nothing. `reason` is one line, printed as-is. */
	| { kind: 'skipped'; reason: string }
	/** Wanted to update and could not. Warned; the caller continues with the current code. */
	| { kind: 'failed'; reason: string }
	/** Checked, and the upstream had nothing new. Nothing on disk was touched. */
	| { kind: 'current'; head: string }
	/** The branch has commits the upstream does not, so the reset was refused. */
	| { kind: 'diverged'; reason: string; ahead: number }
	/**
	 * HEAD moved. `discarded` are the tracked files whose local changes are gone; `overwritten` are
	 * untracked files the incoming commit starts tracking, which `reset --hard` replaces (see below —
	 * the single exception to "untracked files are safe").
	 */
	| { kind: 'updated'; from: string; to: string; discarded: string[]; overwritten: string[]; installed: boolean }

export type GitResult = {
	code: number
	/** stdout, trimmed. What every single-value call (`rev-parse`, `config --get`) wants. */
	out: string
	/**
	 * stdout, UNTRIMMED, and it is not redundant.
	 *
	 * `git status --porcelain` puts the worktree status in COLUMN 2, so an unstaged modification is
	 * `" M export.ts"` — with a LEADING SPACE. Trimming that shifts the fixed-column parse by one and
	 * yields `"xport.ts"`, which is how the "discarding local changes to …" line — the one message that
	 * has to be trustworthy, because it is the last thing shown before the work is gone — came to print
	 * mangled filenames. Caught by `selfupdate.test.ts`; column-parsing reads this field.
	 */
	raw: string
	err: string
	timedOut: boolean
}

/**
 * How much longer than the child's own timeout to wait for its output pipes. See `git` below — this
 * is not belt-and-braces, it is the only thing that actually bounds a hung fetch.
 */
const PIPE_GRACE_MS = 1_500

const timedOutResult = (argv: string[], timeoutMs: number): GitResult => ({
	code: -1,
	out: '',
	raw: '',
	err: `git ${argv[0]} exceeded ${timeoutMs} ms`,
	timedOut: true,
})

/**
 * One git invocation, with a timeout and with every interactive path closed.
 *
 * `-c credential.helper=` is per-invocation and does not touch the user's config. It is what stops a
 * private remote from opening a keychain prompt or a GCM window that nothing will ever answer, and
 * `stdin: 'ignore'` means git cannot read a password off the terminal this process is sharing.
 *
 * WHY THERE ARE TWO TIMEOUTS, WHICH IS NOT PARANOIA — IT WAS MEASURED.
 *
 * `Bun.spawn`'s `timeout` kills GIT. It does not kill git's own children, and it does not close the
 * pipes: a transport helper (`git fetch` over ssh, or `ext::`) inherits the stdout/stderr handles and
 * keeps them open after its parent dies, so `new Response(proc.stderr).text()` goes on waiting for
 * EOF from a process nobody is managing any more. A test that made the remote sleep 5s with a 1.2s
 * timeout measured the full 5.4s: git was killed on schedule and this function returned anyway. For a
 * feature that runs before the CLI does anything, that is still a CLI that appears to be broken.
 *
 * So the child timeout is the inner bound and an overall DEADLINE is the real one. On the deadline the
 * pipe reads are abandoned rather than awaited — the orphaned helper exits on its own, and the reads
 * are `.catch`ed so an abandoned promise cannot surface as an unhandled rejection later.
 */
export const git = async (cwd: string, argv: string[], timeoutMs = DEFAULT_GIT_TIMEOUT_MS): Promise<GitResult> => {
	let proc: Bun.Subprocess<'ignore', 'pipe', 'pipe'>
	try {
		proc = Bun.spawn(['git', '-c', 'credential.helper=', ...argv], {
			cwd,
			stdin: 'ignore',
			stdout: 'pipe',
			stderr: 'pipe',
			timeout: timeoutMs,
			// GIT_OPTIONAL_LOCKS=0 so a concurrent git process never makes the update wait on an index lock.
			env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' },
		})
	} catch (e) {
		// git missing from PATH, or an unusable cwd: `spawn` THROWS rather than returning a code. Both
		// are a skip, not a crash — the updater is never allowed to be the thing that fails a run.
		return { code: -1, out: '', raw: '', err: e instanceof Error ? e.message : String(e), timedOut: false }
	}

	const gathered = (async (): Promise<GitResult> => {
		const [out, err, code] = await Promise.all([
			new Response(proc.stdout).text().catch(() => ''),
			new Response(proc.stderr).text().catch(() => ''),
			proc.exited,
		])
		return { code, out: out.trim(), raw: out, err: err.trim(), timedOut: proc.signalCode !== null }
	})()

	let timer: ReturnType<typeof setTimeout> | undefined
	const deadline = new Promise<GitResult>(resolve => {
		timer = setTimeout(() => resolve(timedOutResult(argv, timeoutMs)), timeoutMs + PIPE_GRACE_MS)
	})
	try {
		const result = await Promise.race([gathered, deadline])
		if (result.timedOut) {
			// Best effort. Bun's own timeout has almost certainly done this already; a helper git spawned
			// is out of reach either way, which is why we stop waiting rather than try to reap it.
			try {
				proc.kill('SIGKILL')
			} catch {}
		}
		return result
	} finally {
		clearTimeout(timer)
	}
}

const truthy = (v: string | undefined) => Boolean(v) && v !== '0' && v !== 'false' && v !== 'no'

/**
 * Whether to attempt an update at all, from inputs only — no filesystem, no git, no network. Split
 * out so `selfupdate.test.ts` can enumerate every refusal without a repo, which is the half of this
 * feature that has to be right on machines nobody tested it on.
 *
 * Returns the one-line reason to print, or `null` to proceed.
 */
export const updateGate = (
	args: string[],
	env: Record<string, string | undefined> = process.env,
	tty = Boolean(process.stdin.isTTY),
): string | null => {
	// Order is precedence, and the top two both beat `--update` on purpose: an explicit opt-out is an
	// opt-out, and a forced update in a parent must not be forced again in the child it re-execs.
	if (args.includes('--no-update')) return 'skipping the update check (--no-update)'
	if (truthy(env.CS2_EXPORT_NO_UPDATE)) return 'skipping the update check (CS2_EXPORT_NO_UPDATE)'
	if (truthy(env[UPDATE_CHECKED_ENV])) return ALREADY_CHECKED

	if (args.includes('--update')) return null // explicit: overrides the CI/TTY heuristic below
	// A CI runner checked out an exact ref on purpose. Never move it underneath the job.
	if (truthy(env.CI)) return 'skipping the update check (CI=true; pass --update to force it)'
	if (!tty) return 'skipping the update check (not a terminal; pass --update to force it)'
	return null
}

/**
 * The re-exec guard's reason. Printed by nothing — it is the ONE skip that is not worth a line of
 * output, because it fires on every child of an update and the parent already said what happened.
 */
export const ALREADY_CHECKED = 'the update already ran in this process tree'

/**
 * Everything needed to update, or the one reason there is nothing to do.
 *
 * The refusals are ordered narrowest-first so the message an operator sees names the actual
 * situation: "no commits yet" rather than "no upstream branch", which is technically also true.
 */
type Upstream =
	| { ok: false; skip: string }
	| { ok: true; head: string; branch: string; remote: string; upstream: string }

const resolveUpstream = async (cwd: string, timeoutMs: number): Promise<Upstream> => {
	const inRepo = await git(cwd, ['rev-parse', '--is-inside-work-tree'], timeoutMs)
	// `code === -1` is also "git is not installed", which lands on the same skip and the same message:
	// either way there is no checkout here to update.
	if (inRepo.code !== 0 || inRepo.out !== 'true')
		return { ok: false, skip: 'not a git checkout — the update check has nothing to do' }

	// `--quiet --verify` so an unborn branch (a `git init` with no commit yet, which is this repo
	// today) is a silent non-zero rather than a scary "ambiguous argument 'HEAD'" on stderr.
	const head = await git(cwd, ['rev-parse', '--quiet', '--verify', 'HEAD'], timeoutMs)
	if (head.code !== 0 || !head.out) return { ok: false, skip: 'no commits yet — nothing to update from' }

	// symbolic-ref fails on a detached HEAD, which is the point: a pinned checkout stays pinned.
	const branch = await git(cwd, ['symbolic-ref', '--quiet', '--short', 'HEAD'], timeoutMs)
	if (branch.code !== 0 || !branch.out)
		return { ok: false, skip: 'detached HEAD — leaving this checkout where it is' }

	// The branch's OWN remote, not a hardcoded `origin` — a fork's `main` may track `upstream/main`,
	// and fetching the wrong remote would compare against a stale ref and silently do nothing.
	// A repo with no remotes at all has no `branch.<b>.remote` either, so that case lands here.
	const remote = await git(cwd, ['config', '--get', `branch.${branch.out}.remote`], timeoutMs)
	if (remote.code !== 0 || !remote.out)
		return { ok: false, skip: `branch "${branch.out}" has no upstream remote — nothing to update from` }

	const remotes = await git(cwd, ['remote'], timeoutMs)
	if (!remotes.out.split('\n').includes(remote.out))
		return { ok: false, skip: `branch "${branch.out}" names remote "${remote.out}", which does not exist` }

	const upstream = await git(cwd, ['rev-parse', '--symbolic-full-name', '@{upstream}'], timeoutMs)
	if (upstream.code !== 0 || !upstream.out)
		return { ok: false, skip: `branch "${branch.out}" has no upstream branch` }

	return { ok: true, head: head.out, branch: branch.out, remote: remote.out, upstream: upstream.out }
}

export type SelfUpdateOptions = {
	/** The checkout to update. `import.meta.dir` in normal use. */
	cwd: string
	/** argv after the script name. Read for `--update` / `--no-update`. */
	args: string[]
	env?: Record<string, string | undefined>
	tty?: boolean
	timeoutMs?: number
	/** One line of user-facing output. Injected so the tests can read what an operator would see. */
	log?: (msg: string) => void
	/** Run `bun install` after a pull that moved package.json or bun.lock. Off in tests. */
	install?: boolean
}

/**
 * Bring `cwd` up to date with its upstream. Never throws: every failure is an outcome.
 *
 * The caller re-execs if and only if this returns `kind: 'updated'`.
 */
export const selfUpdate = async (opts: SelfUpdateOptions): Promise<UpdateOutcome> => {
	const { cwd, args, env = process.env, timeoutMs = updateTimeout(env), log = () => {}, install = true } = opts
	const tty = opts.tty ?? Boolean(process.stdin.isTTY)

	const gated = updateGate(args, env, tty)
	if (gated !== null) return { kind: 'skipped', reason: gated }

	const resolved = await resolveUpstream(cwd, timeoutMs)
	if (!resolved.ok) return { kind: 'skipped', reason: resolved.skip }
	const { head, branch, remote, upstream } = resolved

	log(`checking ${remote} for updates to ${branch}...`)
	const fetched = await git(cwd, ['fetch', '--quiet', '--no-tags', remote], timeoutMs)
	if (fetched.code !== 0)
		return {
			kind: 'failed',
			reason: fetched.timedOut
				? `git fetch ${remote} timed out after ${(timeoutMs / 1000).toFixed(0)}s — continuing with the code on disk`
				: `git fetch ${remote} failed (${firstLine(fetched.err) || `exit ${fetched.code}`}) — continuing with the code on disk`,
		}

	const target = await git(cwd, ['rev-parse', upstream], timeoutMs)
	if (target.code !== 0 || !target.out)
		return { kind: 'failed', reason: `could not resolve ${upstream} after fetching — continuing with the code on disk` }
	if (target.out === head) return { kind: 'current', head }

	/**
	 * Local commits the upstream does not have. `rev-list --count <upstream>..HEAD` is the number of
	 * commits `reset --hard` would throw away, so a non-zero answer refuses the reset. Recoverable via
	 * the reflog, but a tool should not be making that call on someone's behalf.
	 */
	const ahead = await git(cwd, ['rev-list', '--count', `${upstream}..HEAD`], timeoutMs)
	const aheadCount = Number.parseInt(ahead.out || '0', 10) || 0
	if (aheadCount > 0)
		return {
			kind: 'diverged',
			ahead: aheadCount,
			reason:
				`${branch} has ${aheadCount} commit(s) ${upstream} does not, so it was NOT reset — ` +
				`your commits are not something an auto-update should discard.\n` +
				`      Run \`git pull --rebase\` yourself, or \`git reset --hard ${upstream}\` to take the remote's version.`,
		}

	/**
	 * What the reset is about to discard, named before it happens.
	 *
	 * `--untracked-files=no` is deliberate: a `reset --hard` does not act on paths outside the target
	 * tree, so listing every untracked and ignored file here would misrepresent what is at risk —
	 * `out/` is ignored and stays exactly where it is. The one untracked case that IS at risk is not
	 * visible to `git status` at all and is found separately, below.
	 */
	const dirty = await git(cwd, ['status', '--porcelain', '--untracked-files=no'], timeoutMs)
	const discarded = dirty.raw
		.split('\n')
		// `raw`, NOT `out`: porcelain v1 is two status columns then a space then the path, and an
		// unstaged edit leaves column 1 blank (`" M export.ts"`). Trimming the output first eats that
		// space and every printed name loses its first character. See `GitResult.raw`.
		.map(line => line.replace(/\r$/, ''))
		.filter(line => line.length > 3)
		// Renames read `old -> new`; the new name is the one on disk, so that is the one worth printing.
		.map(line => line.slice(3).split(' -> ').pop()?.trim() ?? '')
		.filter(Boolean)

	// Which files the pull itself changes — asked before the reset, while both commits are known.
	const changed = await git(cwd, ['diff', '--name-only', head, target.out], timeoutMs)
	const changedFiles = changed.out.split('\n').filter(Boolean)

	/**
	 * THE ONE WAY AN UNTRACKED FILE *CAN* BE LOST, and it was measured rather than assumed.
	 *
	 * "reset --hard does not touch untracked files" is true only for paths the target commit does not
	 * contain. It writes EVERY path in that tree, so if the upstream commit starts tracking a file you
	 * happen to already have as an untracked local one, yours is overwritten — silently, and `git status
	 * --untracked-files=no` cannot see it coming. Verified on a scratch repo: an untracked `newfile.ts`
	 * was replaced by the upstream's version with no warning from git at all.
	 *
	 * It is a narrow case, but it is precisely the case a person would be angriest about, so it gets its
	 * own line. `git ls-files` (whole index, one call — this repo tracks a few dozen files) is what
	 * separates "not tracked here yet" from "tracked and merely modified", which the list above covers.
	 */
	const tracked = new Set((await git(cwd, ['ls-files'], timeoutMs)).out.split('\n').filter(Boolean))
	const overwritten = changedFiles.filter(f => !tracked.has(f) && existsSync(join(cwd, f)))

	if (discarded.length) log(`discarding local changes to ${discarded.length} tracked file(s): ${list(discarded)}`)
	if (overwritten.length)
		log(`OVERWRITING ${overwritten.length} untracked file(s) the update starts tracking: ${list(overwritten)}`)
	log(`updating ${branch} ${short(head)} -> ${short(target.out)} (${changedFiles.length} file(s) changed)`)

	// The only destructive call in this file. No `git clean` follows it — see the header.
	const reset = await git(cwd, ['reset', '--hard', target.out], timeoutMs)
	if (reset.code !== 0)
		return { kind: 'failed', reason: `git reset --hard failed (${firstLine(reset.err)}) — continuing with the code on disk` }

	/**
	 * A dependency change has to be installed BEFORE the re-exec, or the updated code throws
	 * `Cannot find module` at an import — a failure that looks nothing like "the update did this".
	 */
	let installed = false
	const manifestMoved = changedFiles.some(f => f === 'package.json' || f === 'bun.lock' || f === 'bun.lockb')
	if (manifestMoved && install) {
		log('package.json/bun.lock changed — running bun install before restarting')
		const proc = Bun.spawn([process.execPath, 'install'], { cwd, stdin: 'ignore', stdout: 'inherit', stderr: 'inherit' })
		const code = await proc.exited
		installed = code === 0
		if (!installed) log(`bun install exited ${code} — the restart may fail on a missing dependency`)
	} else if (manifestMoved) {
		log('package.json/bun.lock changed — run `bun install`')
	}

	return { kind: 'updated', from: head, to: target.out, discarded, overwritten, installed }
}

const updateTimeout = (env: Record<string, string | undefined>) => {
	const raw = Number.parseInt(env.CS2_EXPORT_UPDATE_TIMEOUT ?? '', 10)
	return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_GIT_TIMEOUT_MS
}

const short = (sha: string) => sha.slice(0, 8)
const firstLine = (s: string) => s.split('\n').find(l => l.trim()) ?? ''

/** Names, capped so one line stays one line. The count is always exact even when the list is not. */
const list = (files: string[], cap = 12) =>
	files.slice(0, cap).join(', ') + (files.length > cap ? `, +${files.length - cap} more` : '')

/**
 * Re-run this script with the same arguments, on the code that was just pulled, and hand back its
 * exit code.
 *
 * WHY NOT JUST CARRY ON. Every module in this process was loaded from the pre-update files. Bun has
 * no way to un-import them, so continuing in-process would run the OLD logic against a NEW checkout
 * — the exact outcome "load the update and only then start" is meant to rule out. `interactive.ts`
 * re-execs for the same class of reason (its flags are read at module scope, so a choice made later
 * cannot change them); this is the same move.
 *
 * The marker env var is what makes it terminate: the child gates out at `updateGate`, so there is
 * exactly one update attempt per process tree no matter how many times a script re-execs itself.
 */
export const reexec = async (script: string, args: string[], cwd: string) => {
	const child = Bun.spawn([process.execPath, 'run', script, ...args], {
		cwd,
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
		// An argv array, never a shell string — correct on every platform, and `process.execPath` is
		// already the absolute path to the running bun binary (`bun.exe` on Windows).
		env: { ...process.env, [UPDATE_CHECKED_ENV]: '1' },
	})
	return await child.exited
}

/**
 * The whole feature, as one call for `export.ts`'s `main` to make first.
 *
 * Returns the exit code to leave with when the process was replaced, or `null` to keep going in
 * this process. Prints at most two lines in the common case and never throws.
 */
export const runSelfUpdate = async (script: string, args: string[], cwd: string): Promise<number | null> => {
	const note = (msg: string) => console.log(`    ${msg}`)
	let outcome: UpdateOutcome
	try {
		outcome = await selfUpdate({ cwd, args, log: note })
	} catch (err) {
		// Belt and braces: the updater is a courtesy and must not be able to fail a run.
		console.warn(`    update check failed (${err instanceof Error ? err.message : String(err)}) — continuing`)
		return null
	}

	// Set for every child from here on, including the interactive picker's own re-exec, so nothing
	// downstream checks a second time.
	process.env[UPDATE_CHECKED_ENV] = '1'

	switch (outcome.kind) {
		case 'skipped':
			// One quiet line. The default path on a fresh `git init` clone, so it must not look alarming.
			if (outcome.reason !== ALREADY_CHECKED) note(outcome.reason)
			return null
		case 'failed':
		case 'diverged':
			console.warn(`    ${outcome.reason}`)
			return null
		case 'current':
			note(`already up to date (${short(outcome.head)})`)
			return null
		case 'updated':
			note('restarting on the updated code')
			return await reexec(script, args, cwd)
	}
}
