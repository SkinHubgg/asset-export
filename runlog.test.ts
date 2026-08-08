/**
 * The run log's contract, in the four places it can silently fail to be useful.
 *
 *   bun test runlog.test.ts
 *
 * 1. IT MUST SURVIVE A HARD KILL. The whole feature exists because a crash on Windows left NOTHING
 *    on disk, so "we write a log at the end" is the one implementation that would reproduce the bug
 *    it is meant to fix. The first test below SIGKILLs a child mid-run — no handler, no unwind, no
 *    flush — and requires the lines written up to that instant to already be in the file.
 *
 * 2. IT MUST NOT LEAK A SECRET. `publish.ts` never prints its R2 credentials, but the AWS SDK and
 *    every subprocess are outside our control, so everything written is scrubbed by value first.
 *    Both directions are pinned: a real secret goes, and a short one is left alone — because
 *    `redact` runs over EVERY line and substituting a 1-character value globally would shred the
 *    file it was protecting.
 *
 * 3. ROTATION MUST DELETE THE RIGHT ONES. Sorted by name (which carries the start time), never by
 *    mtime — an mtime sort ranks a long export that started yesterday above a short run from an hour
 *    ago, i.e. it preferentially deletes exactly the short runs that bracket a crash.
 *
 * 4. THE CHILD MUST JOIN THE PARENT'S LOG. The menu re-execs, so one user action is two processes.
 *    Two files would mean the log naming the crash is not the log naming the choice that caused it.
 */

import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { UserError, parseEnvFile } from './platform'
import {
	LOG_FILE_ENV,
	childEnv,
	logFileName,
	openRunLog,
	redact,
	reportFatal,
	resetRunLogForTests,
	rotateLogs,
	secretValues,
} from './runlog'

const temps: string[] = []
const workdir = () => {
	const dir = mkdtempSync(join(tmpdir(), 'cs2-runlog-'))
	temps.push(dir)
	return dir
}

afterEach(() => {
	resetRunLogForTests()
	for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
})

/**
 * THE TEST THIS FEATURE IS FOR.
 *
 * A child that logs a few lines, tells us it is ready, and then blocks for ever. We SIGKILL it —
 * which runs no handler, no `finally`, no exit hook, and gives the process no chance to flush
 * anything — and then read the file. Everything logged before the kill must already be there.
 *
 * Written this way on purpose: a buffered logger, or one that writes from an exit handler, passes
 * every other test in this file and fails only this one. That is precisely the implementation the
 * owner was hit by, so this is the test that is allowed to be slow and awkward.
 */
describe('a hard kill still leaves the log on disk', () => {
	test('SIGKILL mid-run: every line written before the kill is already in the file', async () => {
		const dir = workdir()
		const script = join(dir, 'victim.ts')
		writeFileSync(
			script,
			[
				`import { openRunLog } from ${JSON.stringify(join(import.meta.dir, 'runlog.ts'))}`,
				`const log = openRunLog('victim', { dir: ${JSON.stringify(join(dir, 'logs'))} })`,
				"log.section('phase one')",
				"log.line('did the first thing')",
				"log.line('did the second thing')",
				"console.error('READY:' + log.path)",
				// Never resolves. The process can only leave by being killed.
				'await new Promise(() => {})',
			].join('\n'),
		)

		const child = Bun.spawn([process.execPath, 'run', script], { stdout: 'pipe', stderr: 'pipe' })
		// Wait for the marker rather than for a timeout: a sleep long enough to be reliable is long
		// enough to be flaky, and the marker proves the writes have been ISSUED.
		let path = ''
		const reader = child.stderr.getReader()
		const decoder = new TextDecoder()
		let seen = ''
		while (!path) {
			const { value, done } = await reader.read()
			if (done) break
			seen += decoder.decode(value, { stream: true })
			path = seen.match(/READY:(.+)/)?.[1]?.trim() ?? ''
		}
		expect(path, `child never reported a log path. stderr:\n${seen}`).toBeTruthy()

		child.kill('SIGKILL')
		await child.exited

		const written = readFileSync(path, 'utf8')
		expect(written).toContain('=== cs2-asset-export run log')
		expect(written).toContain('--- phase one')
		expect(written).toContain('did the first thing')
		expect(written).toContain('did the second thing')
		// And nothing wrote a closing line, which is the point: the file is useful WITHOUT one.
		expect(written).not.toContain('=== exit')
	}, 20000)

	test('the file exists from the moment the log is opened, before anything is logged', () => {
		const dir = join(workdir(), 'logs')
		const log = openRunLog('early', { dir })
		expect(log.path).toBeTruthy()
		expect(existsSync(log.path as string)).toBe(true)
	})
})

describe('redaction — by value, never by pattern', () => {
	test('a real secret is replaced everywhere it appears, and its length is all that survives', () => {
		const secret = 'r2_secret_0123456789abcdef'
		const text = `PUT failed: signature for ${secret} rejected (key=${secret})`
		// The refutation first: without redaction the secret really is in the string we were about
		// to write. A test that only asserts the "after" would pass against a no-op input.
		expect(text).toContain(secret)
		const out = redact(text, [secret])
		expect(out).not.toContain(secret)
		expect(out).toContain(`[redacted ${secret.length} chars]`)
		// Both occurrences, not just the first.
		expect(out.match(/\[redacted/g)).toHaveLength(2)
	})

	test('a SHORT value is left alone — redacting it globally would shred the log', () => {
		// This is the guard failing on purpose: `1` appears in timestamps, sizes, exit codes and
		// paths, so substituting it would corrupt every line in the file.
		const text = '[    1.234s] models 1421 files in 12.1s (exit 1)'
		expect(redact(text, ['1'])).toBe(text)
		expect(redact(text, ['1234567'])).toBe(text) // 7 chars, still under the floor
		expect(redact('x 12345678 y', ['12345678'])).toBe('x [redacted 8 chars] y') // 8 clears it
	})

	test('secretValues reads the R2 keys from the environment AND from the repo .env', () => {
		const dir = workdir()
		writeFileSync(join(dir, '.env'), 'R2_SECRET_ACCESS_KEY=from_the_file_aaaaaaaa\nR2_BUCKET_NAME=some-bucket\n')
		const values = secretValues(dir, { R2_ACCESS_KEY_ID: 'from_the_env_bbbbbbbb' })
		expect(values).toContain('from_the_file_aaaaaaaa')
		expect(values).toContain('from_the_env_bbbbbbbb')
		// The bucket NAME is not a secret — publish.ts already prints it in its mismatch error, and
		// knowing which bucket was targeted is most of the diagnosis.
		expect(values).not.toContain('some-bucket')
	})

	test('every line a log writes goes through redaction, including subprocess stderr', () => {
		const dir = workdir()
		const secret = 'sekrit_aws_key_9999'
		writeFileSync(join(dir, '.env'), `R2_SECRET_ACCESS_KEY=${secret}\n`)
		const log = openRunLog('scrub', { dir: join(dir, 'logs'), here: dir })
		log.line(`token is ${secret}`)
		log.subprocess({ cmd: ['aws', 's3', 'cp'], code: 1, ms: 10, err: `denied for ${secret}` })
		log.failure(new Error(`boom with ${secret}`))
		const written = readFileSync(log.path as string, 'utf8')
		expect(written).not.toContain(secret)
		expect(written).toContain('[redacted')
	})
})

describe('rotation keeps the newest N', () => {
	const stamped = (n: number) => `2026-08-0${1 + (n % 9)}T00-00-0${n % 10}-000-export-${1000 + n}.log`

	test('14 logs, keep 10 — the four oldest by NAME go, and only .log files are touched', () => {
		const dir = workdir()
		const names = Array.from({ length: 14 }, (_, i) => stamped(i)).sort()
		for (const name of names) writeFileSync(join(dir, name), 'x')
		writeFileSync(join(dir, 'notes.txt'), 'not a log')

		const deleted = rotateLogs(dir, 10)
		expect(deleted).toEqual(names.slice(0, 4))
		const left = readdirSync(dir).sort()
		expect(left.filter(n => n.endsWith('.log'))).toEqual(names.slice(4))
		expect(left).toContain('notes.txt')
	})

	test('fewer than the limit deletes nothing, and a missing folder is not an error', () => {
		const dir = workdir()
		writeFileSync(join(dir, stamped(0)), 'x')
		expect(rotateLogs(dir, 10)).toEqual([])
		expect(rotateLogs(join(dir, 'does-not-exist'), 10)).toEqual([])
	})

	test('opening a log rotates the folder down to the limit, counting the new one', () => {
		const dir = join(workdir(), 'logs')
		mkdirSync(dir, { recursive: true })
		for (let i = 0; i < 12; i++) writeFileSync(join(dir, stamped(i)), 'x')
		openRunLog('rotate', { dir, keep: 5 })
		expect(readdirSync(dir).filter(n => n.endsWith('.log'))).toHaveLength(5)
	})

	test('the filename sorts chronologically and carries no character Windows rejects', () => {
		const early = logFileName('export', new Date('2026-08-08T09:01:02.003Z'), 11)
		const later = logFileName('export', new Date('2026-08-08T09:01:02.004Z'), 12)
		expect(early < later).toBe(true)
		for (const ch of [':', '*', '?', '"', '<', '>', '|']) expect(early).not.toContain(ch)
		// Same second, different process — the pid is what keeps a re-exec from overwriting its parent.
		const at = new Date('2026-08-08T09:01:02.003Z')
		expect(logFileName('export', at, 11)).not.toBe(logFileName('export', at, 12))
	})
})

describe('a child joins its parent log instead of starting a new one', () => {
	test('CS2_EXPORT_LOG_FILE is honoured, appended to, and not rotated away', () => {
		const dir = workdir()
		const parent = join(dir, 'parent.log')
		writeFileSync(parent, 'from the parent\n')
		const before = process.env[LOG_FILE_ENV]
		try {
			process.env[LOG_FILE_ENV] = parent
			const log = openRunLog('child', { dir: join(dir, 'unused') })
			log.line('from the child')
			expect(log.path).toBe(parent)
			const written = readFileSync(parent, 'utf8')
			expect(written).toContain('from the parent')
			expect(written).toContain('from the child')
			// It must not have started its own folder — that is the two-files failure.
			expect(existsSync(join(dir, 'unused'))).toBe(false)
		} finally {
			if (before === undefined) delete process.env[LOG_FILE_ENV]
			else process.env[LOG_FILE_ENV] = before
		}
	})

	test('a fresh log advertises itself to children through the environment', () => {
		const dir = join(workdir(), 'logs')
		const log = openRunLog('parent', { dir })
		expect(process.env[LOG_FILE_ENV]).toBe(log.path as string)
	})

	/**
	 * MEASURED ON 2026-08-08, and it is why `childEnv` exists at all.
	 *
	 * `Bun.spawn` snapshots the environment when the PROCESS starts and does not see mutations made
	 * to `process.env` afterwards. Setting the variable and spawning is therefore not enough: the
	 * menu's re-exec got no log path, opened its own file, and one user action came out as two
	 * disconnected logs — invisible until somebody goes looking for a crash in the file that does not
	 * contain it. Both halves are asserted, because the first half is the surprise.
	 */
	test('Bun.spawn ignores a runtime process.env mutation — so childEnv must be passed explicitly', async () => {
		const dir = join(workdir(), 'logs')
		const log = openRunLog('spawner', { dir })
		const read = ['-e', `console.log(process.env[${JSON.stringify(LOG_FILE_ENV)}] ?? 'MISSING')`]

		const inherited = Bun.spawn([process.execPath, ...read], { stdout: 'pipe', stderr: 'ignore' })
		expect((await new Response(inherited.stdout).text()).trim()).toBe('MISSING')

		const explicit = Bun.spawn([process.execPath, ...read], { stdout: 'pipe', stderr: 'ignore', env: childEnv(log) })
		expect((await new Response(explicit.stdout).text()).trim()).toBe(log.path as string)
	})

	test('childEnv keeps the rest of the environment — it augments, it does not replace', () => {
		const log = openRunLog('aug', { dir: join(workdir(), 'logs') })
		const env = childEnv(log)
		expect(env.PATH).toBe(process.env.PATH as string)
		expect(env[LOG_FILE_ENV]).toBe(log.path as string)
	})
})

describe('failures carry the context that makes them actionable', () => {
	test('the job being run, the stack, and a subprocess stderr IN FULL', () => {
		const dir = join(workdir(), 'logs')
		const log = openRunLog('ctx', { dir })
		log.context({ job: 'weapontex', archive: 'C:\\CS2\\game\\csgo\\pak01_dir.vpk' })
		// 3 KB of stderr — the console truncates at 800 characters and both Windows bugs this week
		// were past that. The file gets all of it.
		const stderr = `${'MSBuild error NETSDK1045: The current .NET SDK does not support net10.0.\n'.repeat(40)}FINAL LINE`
		expect(stderr.length).toBeGreaterThan(800)
		log.subprocess({ cmd: ['dotnet', 'publish'], code: 1, ms: 4200, err: stderr, out: 'building...' })
		log.failure(new Error('the build failed'), { attempt: 2 })

		const written = readFileSync(log.path as string, 'utf8')
		expect(written).toContain('job=weapontex')
		expect(written).toContain('pak01_dir.vpk')
		expect(written).toContain('attempt: 2')
		expect(written).toContain('subprocess exit=1 in 4.2s: dotnet publish')
		expect(written).toContain('FINAL LINE') // the last line of a stderr far past 800 chars
		expect(written).toContain('  stack:')
		expect(written).toContain('!!! FAILURE  Error: the build failed')
	})

	test('a successful subprocess costs one line and does not dump its output', () => {
		const dir = join(workdir(), 'logs')
		const log = openRunLog('quiet', { dir })
		log.subprocess({ cmd: ['ls'], code: 0, ms: 5, out: 'MOUNTAINS OF OUTPUT', err: 'a warning' })
		const written = readFileSync(log.path as string, 'utf8')
		expect(written).toContain('subprocess exit=0 in 0.0s: ls')
		expect(written).not.toContain('MOUNTAINS OF OUTPUT')
	})

	test('a UserError is logged with its stack but reported as one line, and it is NOT called a defect', () => {
		const dir = join(workdir(), 'logs')
		const log = openRunLog('user', { dir })
		const said: string[] = []
		const before = console.error
		console.error = (...parts: unknown[]) => said.push(parts.join(' '))
		try {
			expect(reportFatal(new UserError('no CS2 install found'), log)).toBe(1)
		} finally {
			console.error = before
		}
		expect(said.join('\n')).toContain('error: no CS2 install found')
		// The log path is on screen — without it "send me the file" has no referent.
		expect(said.join('\n')).toContain(log.path as string)
		const written = readFileSync(log.path as string, 'utf8')
		expect(written).toContain('kind: UserError')
		expect(written).toContain('UserError: no CS2 install found')
		expect(written).toContain('stack:')
	})

	test('UserError.name is really UserError — an Error subclass does not get one for free', () => {
		// It did not, until 2026-08-08: every operator error serialised as `Error: …`, which in a log
		// file is indistinguishable from the defects this class exists to be told apart from.
		expect(new UserError('x').name).toBe('UserError')
	})
})

describe('.env parsing — the Windows shape', () => {
	test('CRLF does not leave a carriage return on the end of a secret', () => {
		// A \r on a signing key does not throw anywhere. It signs the request with an invisible byte
		// and comes back 403, which reads as "wrong credentials" and sends the operator to Cloudflare.
		const parsed = parseEnvFile('R2_ACCESS_KEY_ID=abc123\r\nR2_SECRET_ACCESS_KEY="s3cr3t"\r\n')
		expect(parsed.R2_ACCESS_KEY_ID).toBe('abc123')
		expect(parsed.R2_SECRET_ACCESS_KEY).toBe('s3cr3t')
	})

	test('comments, blank lines, `export `, quotes and a value containing =', () => {
		const parsed = parseEnvFile(
			['# a comment', '', 'export R2_BUCKET_NAME=assets', "SKINS_CDN_ORIGIN='https://cdn.example.com'", 'A=b=c'].join(
				'\n',
			),
		)
		expect(parsed).toEqual({ R2_BUCKET_NAME: 'assets', SKINS_CDN_ORIGIN: 'https://cdn.example.com', A: 'b=c' })
	})

	test('a line that is not KEY=value is skipped rather than throwing', () => {
		expect(parseEnvFile('this is not an assignment\n=novalue\n9NOT_A_KEY=x\n')).toEqual({})
	})
})
