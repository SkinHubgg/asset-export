/**
 * The run log — what actually happened, on disk, after the window has closed.
 *
 * WHY THIS EXISTS. On 2026-08-08 the exporter died part-way through on a Windows machine and there
 * was **no record of it anywhere**. The console had scrolled, the window had been closed, and the
 * only artifact was a screenshot of a truncated `cmd.exe` buffer. Two separate bugs were being
 * guessed at from that screenshot — a missing `unzip` (`Bun.spawn` throws `ENOENT` from the
 * constructor, so the `tar` fallback never ran) and the empty `.tools/vrf-src` that failure left
 * behind — and both would have been one line each in a file like this. A tool whose failures cannot
 * be read after the fact cannot be supported remotely, and remote is the only way this one is used.
 *
 * WHAT IT WRITES, and the shape of each decision:
 *
 * - **One file per top-level invocation**, `logs/<ISO>-<script>-<pid>.log`. The ISO timestamp leads
 *   so a plain alphabetical listing is a chronological one — the newest is the last line of `ls`
 *   and of Explorer's default sort. The pid is the collision breaker: two runs started inside the
 *   same second are not hypothetical when a menu re-execs a child.
 *
 * - **The child appends to the parent's file.** The interactive menu resolves a choice into flags
 *   and re-execs, so one user action is two processes; `CS2_EXPORT_LOG_FILE` is inherited and the
 *   child opens that path in append mode instead of starting its own. Otherwise the log naming the
 *   crash would be a different file from the log naming the menu choice that caused it.
 *
 * - **`console.*` is teed rather than re-plumbed.** Every `step`/`ok`/`warn` in `export.ts` and
 *   `publish.ts` already goes through `console`, so patching the four methods captures all of it
 *   without editing a single call site — and without a second formatting path that can drift from
 *   what the screen showed. `publish.ts`'s progress counter uses `process.stdout.write('\r…')`,
 *   which is deliberately NOT captured: it would be several thousand carriage returns.
 *
 * - **Subprocess stderr goes in whole.** The console prints at most 800 characters of it, which is
 *   where both Windows bugs above were hiding. On disk there is no reason to truncate the thing
 *   most likely to contain the cause.
 *
 * - **Secrets are scrubbed by VALUE**, not by pattern. `publish.ts` reads R2 credentials from the
 *   environment and never prints them, but the AWS SDK is not under our control and a subprocess is
 *   not either, so anything written here has every known secret value replaced first. Values under
 *   8 characters are skipped: a secret that short is not a secret, and substituting it globally
 *   would shred the file it was meant to protect.
 *
 * NOTHING HERE MAY THROW. A logger that can take down the run it is documenting is worse than no
 * logger, so every filesystem call is wrapped and failure degrades to "no log" plus one warning.
 * Writes are `appendFileSync` — synchronous, unbuffered, durable — because the whole point is to
 * survive the process dying in the next instruction.
 */

import { appendFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { arch, platform, release } from 'node:os'
import { join, resolve } from 'node:path'
import { SECRET_ENV, UserError, readEnvFile } from './platform'

/** How many logs to keep. Older ones are deleted whenever a new one is opened. */
export const LOG_KEEP = 10

/** Override the folder. `CS2_EXPORT_LOG_FILE` overrides the individual file, and is set for children. */
export const LOG_DIR_ENV = 'CS2_EXPORT_LOGS'
export const LOG_FILE_ENV = 'CS2_EXPORT_LOG_FILE'

/** `<repo>/logs`. Gitignored — a log holds absolute paths and machine details, and this repo is public. */
export const defaultLogDir = () => resolve(process.env[LOG_DIR_ENV] ?? join(import.meta.dir, 'logs'))

/**
 * `2026-08-08T14-22-05-123-export-8814.log`.
 *
 * Colons are not legal in a Windows filename and dots before the extension confuse enough tools to
 * be worth avoiding, so the ISO string is flattened — but only in ways that preserve sort order.
 */
export const logFileName = (script: string, at = new Date(), pid = process.pid) =>
	`${at.toISOString().replace(/[:.]/g, '-').replace(/-?Z$/, '')}-${script}-${pid}.log`

/**
 * Delete all but the newest `keep` logs, and say which went.
 *
 * Sorts by NAME, not by mtime: the name carries the start time, and mtime is the *last write*, so
 * an mtime sort would rank a long export that started yesterday above a short one that started an
 * hour ago — i.e. it would preferentially delete exactly the short runs that bracket a crash.
 */
export const rotateLogs = (dir: string, keep = LOG_KEEP): string[] => {
	try {
		if (!existsSync(dir)) return []
		const logs = readdirSync(dir)
			.filter(name => name.endsWith('.log'))
			.sort()
		const doomed = logs.slice(0, Math.max(0, logs.length - keep))
		for (const name of doomed) {
			try {
				rmSync(join(dir, name), { force: true })
			} catch {}
		}
		return doomed
	} catch {
		return []
	}
}

/**
 * Every secret value worth scrubbing, from the environment and from the repo `.env` — the second
 * because the parent process of the menu may never have loaded that file, while the child it spawns
 * with `--env-file` certainly has.
 */
export const secretValues = (here: string, env: Record<string, string | undefined> = process.env): string[] => {
	const fromFile = readEnvFile(join(here, '.env'))
	const values = new Set<string>()
	for (const name of SECRET_ENV) {
		for (const value of [env[name], fromFile[name]]) if (value && value.length >= 8) values.add(value)
	}
	return [...values]
}

/**
 * Replace every known secret value with a marker naming nothing but its length.
 *
 * The 8-character floor is a real guard and not a formality — `redact` runs over EVERY line written,
 * so a one-character value would turn the log into confetti. Proven both ways in `runlog.test.ts`.
 */
export const redact = (text: string, secrets: string[]): string => {
	let out = text
	for (const secret of secrets) {
		if (!secret || secret.length < 8) continue
		out = out.split(secret).join(`[redacted ${secret.length} chars]`)
	}
	return out
}

export type RunLog = {
	/** Absolute path of the file being written, or null when logging could not start. */
	path: string | null
	/** One raw line, timestamped. */
	line: (text: string) => void
	/** A labelled block: `--- title`. */
	section: (title: string) => void
	/** An indented `key  value` table. Values are redacted like everything else. */
	table: (rows: Record<string, string | number | boolean | null | undefined>) => void
	/** What the run is doing right now, carried into any later failure. Pass `undefined` to clear. */
	context: (patch: Record<string, string | undefined>) => void
	/** A finished subprocess: always one line, plus its whole stderr when it failed. */
	subprocess: (r: { cmd: string[]; code: number; ms: number; out?: string; err?: string }) => void
	/** An error, with its stack and the current context. Safe to call more than once. */
	failure: (err: unknown, extra?: Record<string, unknown>) => void
	/** Final line. Returns the path so callers can print it. */
	close: (code: number) => string | null
}

const NO_LOG: RunLog = {
	path: null,
	line: () => {},
	section: () => {},
	table: () => {},
	context: () => {},
	subprocess: () => {},
	failure: () => {},
	close: () => null,
}

let active: RunLog = NO_LOG

/**
 * The log the current process is writing, for code too deep to be handed one — `export.ts`'s `run()`
 * is called from a dozen places and threading a parameter through all of them would be a worse
 * change than a module-level accessor. Returns a no-op log when none was opened, so callers never
 * need a null check and a library import never starts a log by accident.
 */
export const currentLog = (): RunLog => active

export type OpenOptions = {
	/** Repo root, for locating `.env`. Defaults to this file's folder. */
	here?: string
	dir?: string
	argv?: string[]
	keep?: number
}

/**
 * Start (or join) the log for this process. Idempotent per process: a second call returns the first.
 */
export const openRunLog = (script: string, opts: OpenOptions = {}): RunLog => {
	if (active !== NO_LOG) return active
	const here = opts.here ?? import.meta.dir
	const argv = opts.argv ?? process.argv.slice(2)
	const secrets = secretValues(here)
	const started = Date.now()
	const context: Record<string, string> = {}
	let broken = false

	// An inherited path means "you are the child of a run that already opened one" — append, and do
	// not rotate, or a child could delete the file its own parent is holding.
	const inherited = process.env[LOG_FILE_ENV]
	const dir = resolve(opts.dir ?? defaultLogDir())
	let path: string | null = null
	try {
		if (inherited) path = inherited
		else {
			mkdirSync(dir, { recursive: true })
			path = join(dir, logFileName(script))
			writeFileSync(path, '')
			rotateLogs(dir, opts.keep ?? LOG_KEEP)
			// Children of this process append here instead of opening their own.
			process.env[LOG_FILE_ENV] = path
		}
	} catch (err) {
		console.warn(`    ! could not open a log in ${dir} (${(err as Error).message}); continuing without one`)
		return NO_LOG
	}

	const raw = (text: string) => {
		if (broken || !path) return
		try {
			appendFileSync(path, `${redact(text, secrets)}\n`)
		} catch {
			// One failed write disables the log for good rather than emitting a warning per line.
			broken = true
		}
	}
	const stamp = () => `[${((Date.now() - started) / 1000).toFixed(3).padStart(9)}s] `
	const line = (text: string) => {
		for (const l of String(text).split('\n')) raw(`${stamp()}${l}`)
	}

	const log: RunLog = {
		path,
		line,
		section: title => {
			raw('')
			line(`--- ${title}`)
		},
		table: rows => {
			for (const [key, value] of Object.entries(rows)) line(`  ${key.padEnd(14)}${value ?? ''}`)
		},
		context: patch => {
			for (const [key, value] of Object.entries(patch)) {
				if (value === undefined) delete context[key]
				else context[key] = value
			}
		},
		subprocess: ({ cmd, code, ms, out, err }) => {
			line(`subprocess exit=${code} in ${(ms / 1000).toFixed(1)}s: ${cmd.join(' ')}`)
			if (code === 0) return
			// The whole thing. The console shows at most 800 characters of this and both Windows
			// bugs this week were past that boundary.
			if (err?.trim()) {
				line(`  stderr (${err.length} bytes, in full):`)
				for (const l of err.trimEnd().split('\n')) raw(`    | ${l}`)
			}
			const tail = (out ?? '').trimEnd().split('\n').slice(-40)
			if (tail.length && tail[0]) {
				line('  stdout (last 40 lines):')
				for (const l of tail) raw(`    | ${l}`)
			}
		},
		failure: (err, extra) => {
			const e = err instanceof Error ? err : new Error(String(err))
			raw('')
			line(`!!! FAILURE  ${e.name}: ${e.message}`)
			if (Object.keys(context).length)
				line(`  context: ${Object.entries(context).map(([k, v]) => `${k}=${v}`).join('  ')}`)
			for (const [key, value] of Object.entries(extra ?? {})) line(`  ${key}: ${String(value)}`)
			if (e.cause) line(`  cause: ${String(e.cause)}`)
			line(e.stack ? `  stack:\n${e.stack}` : '  (no stack)')
		},
		close: code => {
			line(`=== exit ${code} after ${((Date.now() - started) / 1000).toFixed(1)}s`)
			return path
		},
	}

	active = log

	if (!inherited) {
		raw('=== cs2-asset-export run log')
		log.table({
			started: new Date(started).toISOString(),
			script,
			command: `bun run ${script}.ts${argv.length ? ` ${argv.join(' ')}` : ''}`,
			cwd: process.cwd(),
			platform: `${platform()} ${release()} ${arch()}`,
			bun: Bun.version,
			log: path,
		})
	} else {
		log.section(`re-exec: ${script}.ts${argv.length ? ` ${argv.join(' ')}` : ''}`)
	}
	return log
}

/**
 * The environment to spawn a child with, so it appends to THIS run's log instead of opening its own.
 *
 * **`Bun.spawn` DOES NOT SEE RUNTIME MUTATIONS OF `process.env`.** It snapshots the environment when
 * the process starts, so `process.env.X = 'y'` followed by `Bun.spawn([…])` gives the child no `X`
 * at all — measured on 2026-08-08, not assumed, and pinned in `runlog.test.ts`. `openRunLog` sets
 * the variable anyway (it is right for anything that reads `process.env` later in THIS process), but
 * a spawn has to be handed an explicit environment or the menu's re-exec writes a second,
 * disconnected log. That failure is invisible until someone goes looking for a crash in the file
 * that does not contain it, which is the precise problem the shared file exists to prevent.
 */
export const childEnv = (log: RunLog = currentLog()): Record<string, string> => ({
	...(process.env as Record<string, string>),
	...(log.path ? { [LOG_FILE_ENV]: log.path } : {}),
})

/** For tests, and for nothing else: forget the process-wide log so another can be opened. */
export const resetRunLogForTests = () => {
	active = NO_LOG
	delete process.env[LOG_FILE_ENV]
}

/**
 * Mirror `console.log/info/warn/error` into the log. Returns the undo, which is only used by tests.
 *
 * The re-entrancy guard is load-bearing: `raw` warns on the console when it cannot open the file,
 * and without the flag that warning would come straight back in here.
 */
export const teeConsole = (log: RunLog = currentLog()) => {
	if (!log.path) return () => {}
	const original = { log: console.log, info: console.info, warn: console.warn, error: console.error }
	let inside = false
	const patch = (name: keyof typeof original, prefix = '') => {
		console[name] = (...parts: unknown[]) => {
			original[name](...parts)
			if (inside) return
			inside = true
			try {
				log.line(
					prefix +
						parts
							.map(p => (typeof p === 'string' ? p : p instanceof Error ? (p.stack ?? p.message) : Bun.inspect(p)))
							.join(' '),
				)
			} catch {
			} finally {
				inside = false
			}
		}
	}
	patch('log')
	patch('info')
	patch('warn')
	patch('error')
	return () => Object.assign(console, original)
}

/**
 * The line that turns a crash into a bug report. Printed to stderr on every abnormal exit, because
 * "send me the file" only works if the operator was told which file.
 */
export const crashNotice = (log: RunLog = currentLog()) =>
	log.path
		? [
				'',
				'A full log of this run, including the error and any subprocess output, was written to:',
				`  ${log.path}`,
				'Send that file with any bug report — it is far more useful than a screenshot.',
			].join('\n')
		: ''

/**
 * Catch what the top-level `try/catch` cannot: a throw during module evaluation, an
 * `uncaughtException` from a callback, and a promise nobody awaited.
 *
 * INSTALLED BEFORE ARGUMENT PARSING, so a bad `--out` at module scope is logged too — that code
 * runs before `main()` and therefore outside the `try` that has always been at the bottom of
 * `export.ts`. Exits 1 rather than rethrowing so `run.bat` sees a non-zero code and pauses, which
 * is the only thing keeping the error on screen on Windows.
 */
export const installCrashHandlers = (log: RunLog = currentLog()) => {
	const die = (source: string) => (err: unknown) => {
		const e = err instanceof Error ? err : new Error(String(err))
		log.failure(e, { source })
		console.error(`\nerror: ${e.message}`)
		// A few frames on screen, the whole stack in the file. Enough to recognise, not enough to
		// scroll the message off a Windows console.
		const frames = (e.stack ?? '').split('\n').slice(1, 4).join('\n')
		if (frames.trim()) console.error(frames)
		console.error(crashNotice(log))
		log.close(1)
		process.exit(1)
	}
	process.on('uncaughtException', die('uncaughtException'))
	process.on('unhandledRejection', die('unhandledRejection'))
}

/**
 * The one place every script's bottom-level `catch` funnels into, so all three report identically.
 *
 * A `UserError` keeps its one-line screen output — it is a message for the operator, not a defect —
 * but it still goes to the file with its stack, because "which of the fourteen places raised that
 * message" is exactly what a support request needs.
 */
export const reportFatal = (err: unknown, log: RunLog = currentLog()): number => {
	// `instanceof` AND the name, because `UserError` crosses a module boundary in every script here
	// and an `instanceof` that silently stops matching is exactly the bug this class already had once
	// (three scripts declared their own copy, so `export.ts` printed a stack for an operator error).
	const isUser = err instanceof UserError || (err instanceof Error && err.name === 'UserError')
	log.failure(err, { kind: isUser ? 'UserError' : 'unexpected' })
	const message = err instanceof Error ? err.message : String(err)
	console.error(`\nerror: ${message}`)
	if (!isUser) {
		const frames = (err instanceof Error ? (err.stack ?? '') : '').split('\n').slice(1, 4).join('\n')
		if (frames.trim()) console.error(frames)
	}
	console.error(crashNotice(log))
	log.close(1)
	return 1
}
