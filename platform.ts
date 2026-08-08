/**
 * The cross-platform primitives every script in here shares: where CS2 is, where the decompiler is,
 * and how a filesystem path becomes an export-relative one.
 *
 * THIS EXISTS BECAUSE THE COPIES DRIFTED. `export.ts` grew a careful install search — the Windows
 * registry, `%ProgramFiles(x86)%`, every extra drive listed in `steamapps/libraryfolders.vdf`,
 * `homedir()` rather than `$HOME`, and a `--cs2` / `CS2_PATH` override. The four smaller scripts
 * beside it each grew their own, and each one was worse: `dump-sticker-slots.ts` and
 * `dump-glove-finish.ts` looked in `process.env.HOME` (**unset on Windows**) and then at one
 * hard-coded `C:/Program Files (x86)` path, with no library-folder scan and no override flag at all,
 * so on a Windows box with CS2 on a second drive — the common case — they simply could not find the
 * game, and the error message's advice to "pass the pak path explicitly" named a flag that did not
 * exist.
 *
 * `relSlash` is here for the same reason and it is the sharper edge. Four call sites took a path
 * built by `join()` and split it on a literal `'/'`. That is correct on macOS and Linux and produces
 * a one-element array on Windows, where `join()` emits `\`. Nothing throws: the sticker-slot table
 * comes out empty, the keychain material map is keyed by absolute paths so no lookup hits, and the
 * attachment table's keys — which ARE the viewer's export-relative GLB paths — come out as
 * `models/weapons\models\…\x.glb`. A silently empty generated table is the worst failure shape this
 * codebase has, so the join lives in one tested place.
 */

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const IS_WINDOWS = platform() === 'win32'

/**
 * Thrown for anything the operator can fix. Reported as a message, never a stack trace.
 *
 * `name` IS SET EXPLICITLY. A subclass of `Error` inherits `name === 'Error'` unless it assigns one,
 * so every one of these used to log and serialise as `Error: <message>` — indistinguishable in a log
 * file from the defects this class exists to be distinguished from.
 */
export class UserError extends Error {
	override name = 'UserError'
}

// ---------------------------------------------------------------------------------------------
// Interactive mode gate
// ---------------------------------------------------------------------------------------------

/**
 * The auto-updater's own flags, declared HERE rather than in `selfupdate.ts` so that `shouldPrompt`
 * can subtract them without this module importing the updater. Direction of dependency:
 * `selfupdate.ts` -> `platform.ts`, never back.
 */
export const UPDATE_FLAGS = ['--update', '--no-update'] as const

/**
 * Whether `export.ts` should show its picker instead of exporting.
 *
 * IT LIVES HERE, NOT IN `interactive.ts`, so that deciding NOT to prompt costs nothing: `export.ts`
 * imports this statically and only `await import('./interactive')` — which pulls in
 * `@clack/prompts` — once it has already decided a human is watching.
 *
 * Every `false` below is a case where prompting would HANG something. That is the failure mode this
 * feature has to be immune to, because it is silent: a cron job or a CI step that blocks on a hidden
 * prompt looks like a slow export until it times out.
 *
 * **A TTY IS REQUIRED EVEN FOR `--interactive`**, which was measured rather than assumed: with the
 * flag honoured unconditionally, `bun run export.ts --interactive < /dev/null` hung until it was
 * killed — the prompt library waits on input that can never arrive. So the flag overrides the
 * *heuristics* (a stray `CI=true`, an argument that happens to be present) but not the hard
 * requirement, and `interactiveNeedsTty` below turns the impossible case into a one-line error.
 *
 * `UPDATE_FLAGS` ARE SUBTRACTED BEFORE THE "any flag at all" TEST. `--no-update` / `--update` say
 * nothing about *what to export*, so counting them as arguments would make
 * `bun run export.ts --no-update` skip the picker and run a full export that deletes the output
 * folder — a destructive answer to a question about updating. They are the only flags with this
 * exemption, and `interactive.test.ts` pins it.
 */
export const shouldPrompt = (args: string[], tty = Boolean(process.stdin.isTTY)) => {
	if (!tty) return false // a pipe, a redirect, a cron job, a CI runner — nothing can answer
	if (args.includes('--interactive')) return true // explicit: overrides everything below
	if (args.includes('--yes') || args.includes('-y')) return false // explicit opt-out
	const rest = args.filter(a => !UPDATE_FLAGS.includes(a as (typeof UPDATE_FLAGS)[number]))
	if (rest.length) return false // any flag at all: the caller already knows what it wants
	if (process.env.CI === 'true') return false
	return true
}

/** True when `--interactive` was asked for but there is no terminal to draw it on. */
export const interactiveNeedsTty = (args: string[], tty = Boolean(process.stdin.isTTY)) =>
	args.includes('--interactive') && !tty

// ---------------------------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------------------------

/**
 * A path relative to `root`, forward-slashed — the form the manifest, the CDN and every generated
 * table record. `join()` gives `\` on Windows and `/` everywhere else; consumers of these strings
 * split them on `/`, so the separator has to be normalised exactly once, here.
 */
export const relSlash = (root: string, path: string) =>
	path
		.slice(root.length)
		.replace(/^[\\/]+/, '')
		.replace(/\\/g, '/')

/** Last path segment, whichever separator built the path. Safe on in-VPK paths too. */
export const fileNameOf = (path: string) => path.split(/[\\/]/).pop() ?? path

/** `…/aa_fade.vmat` -> `aa_fade`. Accepts a filesystem path or an in-VPK one. */
export const stemOf = (path: string, ext?: string) => {
	const name = fileNameOf(path)
	if (!ext) return name.replace(/\.[^.]+$/, '')
	return name.endsWith(ext) ? name.slice(0, -ext.length) : name
}

/**
 * `<out>/data` — where the four side generators write their tables. THE ONLY DESTINATION THEY HAVE.
 *
 * THIS EXISTS BECAUSE THEY USED TO WRITE OUTSIDE THE REPOSITORY ENTIRELY. Each of the four built its
 * own destination as `resolve(import.meta.dir, '../..')` plus
 * `apps/web-app/app/profile/[userId]/skins/[UI]/Skin/Modal/SkinPreview/` — two levels ABOVE this
 * folder, i.e. a sibling of the checkout rather than anything in it. From
 * `…/SkinHub/asset-export` that resolves to `…/SkinHub`, which has no `apps/`; from any other clone
 * it resolves to whatever happens to sit two directories up. So the tables went nowhere useful **for
 * everyone, the author included**, and did it in the quietest possible way: two of the four
 * `mkdirSync(…, { recursive: true })`'d the missing tree first and reported `wrote <path>` on a path
 * no one reads, and the other two threw an `ENOENT` naming a directory that appears in no clone.
 * A destination that is never right is indistinguishable from one that is never checked, which is
 * how it survived the split into a standalone repository unnoticed.
 *
 * So there is no flag and no override here. One destination, derived from `--out` / `CS2_EXPORT_OUT`
 * exactly like every other generated artifact, so a `--sample` export's tables land in
 * `out-sample/data/` beside its own. Consumers copy out of `out/data/`; keeping the generators
 * unaware of where they copy it to is the entire point.
 *
 * `out` itself must already exist — creating it would put the tables in a brand-new empty tree next
 * to a typo'd `--out`, which is the failure this replaced.
 */
export const generatedDataDir = (out: string) => {
	if (!existsSync(out))
		throw new UserError(
			[
				`No export at ${out}.`,
				'Generated tables are written to <out>/data/. Run the export first, or point',
				'--out / CS2_EXPORT_OUT at an existing export directory.',
			].join('\n'),
		)
	const dir = join(out, 'data')
	mkdirSync(dir, { recursive: true })
	return dir
}

// ---------------------------------------------------------------------------------------------
// Source2Viewer CLI
// ---------------------------------------------------------------------------------------------

/**
 * Where the decompiler binary lives. Different filename per platform (`.exe` on Windows) and
 * built into `<tools>/cli-build` by `export.ts`'s `ensureCli`, which is the only thing that builds
 * it — every other script requires it to be there already.
 */
export const cliPath = (override?: string, tools?: string) =>
	resolve(
		override ??
			join(
				tools ?? join(import.meta.dir, '.tools'),
				'cli-build',
				IS_WINDOWS ? 'Source2Viewer-CLI.exe' : 'Source2Viewer-CLI',
			),
	)

/**
 * The message every script should print when the CLI is not where it expects it.
 *
 * A ZERO-BYTE FILE IS NOT A CLI. `dotnet publish` creates the apphost before filling it, so a build
 * interrupted at the wrong moment leaves an empty binary that `existsSync` is perfectly happy with —
 * and every later run then dies at the first extraction with the OS's own "not a valid executable".
 * `export.ts` deletes and rebuilds it; the scripts that only consume it say so here instead.
 */
export const requireCli = (cli: string) => {
	if (existsSync(cli) && statSync(cli).size > 0) return cli
	throw new UserError(
		[
			existsSync(cli)
				? `${cli} is empty — an interrupted build left it behind. Delete it and re-run.`
				: `No Source2Viewer CLI at ${cli}.`,
			'Build it once with `bun run export.ts --discover` (needs the .NET 10 SDK), or point',
			'--cli / SOURCE2VIEWER_CLI at an existing Source2Viewer-CLI binary built from VRF master.',
		].join('\n'),
	)
}

// ---------------------------------------------------------------------------------------------
// CS2 install discovery
// ---------------------------------------------------------------------------------------------

/** Windows keeps the Steam install path in the registry; it is not always under Program Files. */
const registrySteamRoot = () => {
	if (!IS_WINDOWS) return null
	try {
		const query = Bun.spawnSync(['reg', 'query', 'HKCU\\Software\\Valve\\Steam', '/v', 'SteamPath'])
		return (
			query.stdout
				.toString()
				.match(/SteamPath\s+REG_SZ\s+(.+)/)?.[1]
				.trim() || null
		)
	} catch {
		return null
	}
}

/** Where Steam itself lives. Steam records extra library drives in steamapps/libraryfolders.vdf. */
export const steamRoots = () => {
	const home = homedir()
	if (IS_WINDOWS) {
		const roots = [join(process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)', 'Steam'), join(home, 'Steam')]
		const fromRegistry = registrySteamRoot()
		return fromRegistry ? [fromRegistry, ...roots] : roots
	}
	if (platform() === 'darwin') return [join(home, 'Library/Application Support/Steam')]
	return [
		join(home, '.steam/steam'),
		join(home, '.local/share/Steam'),
		join(home, '.var/app/com.valvesoftware.Steam/data/Steam'),
	]
}

export const steamLibraries = () => {
	const libraries: string[] = []
	for (const root of steamRoots()) {
		if (!existsSync(root)) continue
		libraries.push(root)
		const vdf = join(root, 'steamapps', 'libraryfolders.vdf')
		if (!existsSync(vdf)) continue
		for (const m of readFileSync(vdf, 'utf8').matchAll(/"path"\s+"([^"]+)"/g))
			libraries.push(m[1].replace(/\\\\/g, '\\'))
	}
	return [...new Set(libraries)]
}

/**
 * Candidate `<install>/game` folders, in search order: an explicit override first (accepting the
 * install root, `game/`, or `game/csgo`), otherwise every Steam library on the machine.
 */
export const cs2GameCandidates = (override?: string) =>
	override
		? [override, join(override, 'game'), dirname(override)]
		: [
				...steamLibraries().map(l => join(l, 'steamapps', 'common', 'Counter-Strike Global Offensive', 'game')),
				join('/Applications', 'Counter-Strike Global Offensive', 'game'),
			]

/**
 * Resolves to `<install>/game` — the folder holding csgo/, csgo_core/ and core/. An explicit
 * override may point at the install root, at game/, or at game/csgo; all three are accepted.
 */
export const findCs2Game = (override?: string) => {
	const candidates = cs2GameCandidates(override)
	for (const c of candidates) if (existsSync(join(c, 'csgo', 'pak01_dir.vpk'))) return resolve(c)
	throw new UserError(
		[
			override
				? `No csgo/pak01_dir.vpk under "${override}".`
				: 'Could not find a CS2 install (no csgo/pak01_dir.vpk under any Steam library).',
			'Looked in:',
			...candidates.map(c => `  ${c}`),
			'',
			'Pass the install explicitly, e.g.:',
			'  --cs2 "D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive"',
			'  CS2_PATH=... bun run <script>',
		].join('\n'),
	)
}

/** The main archive, `<install>/game/csgo/pak01_dir.vpk`. What the four dump scripts read. */
export const findCs2Pak = (override?: string) => join(findCs2Game(override), 'csgo', 'pak01_dir.vpk')

// ---------------------------------------------------------------------------------------------
// Artifacts that survive a run — and must not survive a FAILED one
// ---------------------------------------------------------------------------------------------

/**
 * A JSON object accumulated across runs, or an empty one when what is on disk cannot be trusted.
 *
 * THE SAME SHAPE AS THE POISONED `.tools/vrf-src`, in a second place — and it is worth naming the
 * pattern, because it has now appeared three times in this repo. Something is written, a later run
 * finds it present, and "present" is taken to mean "complete":
 *
 *   1. `.tools/vrf-src` — created before the unpack, so a failed unpack left an empty folder that
 *      satisfied `!existsSync(VRF_SRC)` for ever. Fixed 2026-08-08.
 *   2. `data/texture-reflectivity.json` — merged into on every staged run, and read back with a bare
 *      `JSON.parse(readFileSync(...))`. A run killed part-way through the write (Ctrl-C, a full disk,
 *      Windows closing the console) leaves TRUNCATED JSON, and every later run then dies with
 *      `SyntaxError: JSON Parse error: Unexpected EOF` — naming no file, in a function nobody would
 *      think to look at — until someone deletes it by hand. That is this function.
 *   3. `Source2Viewer-CLI` — `dotnet publish` creates the apphost before filling it, so an
 *      interrupted build leaves a zero-byte executable. See `requireCli`.
 *
 * The rule each fix applies: check for the ARTIFACT, not for the path; and never inherit something
 * a failed run left behind. `writeJsonAtomic` closes the other half — a file written through a
 * temporary and renamed cannot be observed half-written at all.
 */
export const readMergeableJson = <T>(
	dest: string,
	onProblem: (msg: string) => void = console.warn,
): Record<string, T> => {
	if (!existsSync(dest)) return {}
	try {
		const parsed = JSON.parse(readFileSync(dest, 'utf8'))
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not a JSON object')
		return parsed as Record<string, T>
	} catch (err) {
		onProblem(`${dest} is unreadable (${(err as Error).message}) — an earlier run died mid-write. Starting it over.`)
		rmSync(dest, { force: true })
		return {}
	}
}

/** Write via `<dest>.tmp` + rename, so an interrupted run cannot leave a half-written file behind. */
export const writeJsonAtomic = (dest: string, data: unknown) => {
	const tmp = `${dest}.tmp`
	writeFileSync(tmp, JSON.stringify(data))
	renameSync(tmp, dest)
}

// ---------------------------------------------------------------------------------------------
// Credentials — the `.env` beside this file, and which variables it satisfies
// ---------------------------------------------------------------------------------------------

/**
 * The four variables `publish.ts --upload --confirm` cannot write without.
 *
 * DECLARED HERE AND IMPORTED BY BOTH READERS. `publish.ts`'s `openBucket` used to hold its own copy
 * of this list and the menu would have needed a second one; a menu that reports "you are all set"
 * from a list that has drifted from the one the uploader actually checks is worse than no report.
 */
export const R2_ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const

/**
 * The CDN origin `--verify` audits against. Deliberately NOT a secret and deliberately shown in
 * full: a wrong origin is the failure mode `resolveOrigin` exists to prevent, and it can only be
 * spotted by reading it.
 */
export const ORIGIN_ENV = 'SKINS_CDN_ORIGIN'

/**
 * Values that must never reach a log file or the screen. `R2_BUCKET_NAME` is absent on purpose —
 * it is a name, `publish.ts`'s bucket-mismatch error already prints it, and knowing which bucket
 * was targeted is most of the diagnosis. `R2_ACCOUNT_ID` IS here even though it is not a password:
 * it is the hostname half of the endpoint, so it turns up inside SDK error strings, and it names
 * the account to anyone holding the other two.
 */
export const SECRET_ENV = ['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_ACCOUNT_ID'] as const

/**
 * A `.env` file, as a plain map. Enough dotenv for a credentials file and no more: `KEY=value`,
 * `export KEY=value`, `#` comments, and one level of surrounding quotes.
 *
 * SPLITS ON `/\r?\n/`. A `.env` saved by Notepad has CRLF line endings, and splitting on `\n`
 * alone leaves a trailing `\r` on every VALUE — which does not throw anywhere, it just signs an
 * S3 request with a secret key that has an invisible byte on the end and comes back 403. The same
 * `\r` shape has already cost this repo one silent-empty-table bug (see `relSlash`).
 */
export const parseEnvFile = (text: string): Record<string, string> => {
	const found: Record<string, string> = {}
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trim()
		if (!line || line.startsWith('#')) continue
		const eq = line.indexOf('=')
		if (eq < 1) continue
		const key = line.slice(0, eq).trim().replace(/^export\s+/, '')
		if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue
		const value = line.slice(eq + 1).trim()
		const quoted = value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]
		found[key] = quoted ? value.slice(1, -1) : value
	}
	return found
}

/** `<repo>/.env` — the one place credentials go, named in every message about a missing one. */
export const envFilePath = (here: string) => join(here, '.env')

export const readEnvFile = (path: string): Record<string, string> => {
	try {
		return existsSync(path) ? parseEnvFile(readFileSync(path, 'utf8')) : {}
	} catch {
		// An unreadable .env is a reason to say "not found", never a reason to take down the menu.
		return {}
	}
}

/** Where a variable's value came from, or `null`. NEVER the value itself. */
export type EnvSource = 'environment' | '.env' | null

export type CredentialReport = {
	/** The `.env` path that was consulted, whether or not it exists. */
	file: string
	fileExists: boolean
	/** Per variable: where it is set, or null. The value is never carried. */
	source: Record<string, EnvSource>
	/** Names only — exactly what the operator has to add. */
	missingForUpload: string[]
	missingForVerify: string[]
	/** The origin, in full. Not a secret, and unreadable means unverifiable. */
	origin: string | null
}

/**
 * Which credentials are present, for the menu's settings screen and for the message it prints
 * before refusing to offer an upload.
 *
 * REPORTS THE SOURCE, because "it is in .env but this process did not load it" is a different
 * problem from "it is not set", and the two used to be indistinguishable: Bun auto-loads `.env`
 * from the CURRENT WORKING DIRECTORY, so the documented `bun --env-file=.env run publish.ts …`
 * works from the repo root and the identical command run from one folder up silently does not.
 */
export const credentialReport = (here: string, env: Record<string, string | undefined> = process.env) => {
	const file = envFilePath(here)
	const fromFile = readEnvFile(file)
	const sourceOf = (name: string): EnvSource => (env[name] ? 'environment' : fromFile[name] ? '.env' : null)
	const source: Record<string, EnvSource> = {}
	for (const name of [...R2_ENV, ORIGIN_ENV]) source[name] = sourceOf(name)
	return {
		file,
		fileExists: existsSync(file),
		source,
		missingForUpload: R2_ENV.filter(name => !source[name]),
		missingForVerify: source[ORIGIN_ENV] ? [] : [ORIGIN_ENV],
		origin: env[ORIGIN_ENV] || fromFile[ORIGIN_ENV] || null,
	} satisfies CredentialReport
}
