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

import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const IS_WINDOWS = platform() === 'win32'

/** Thrown for anything the operator can fix. Reported as a message, never a stack trace. */
export class UserError extends Error {}

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

/** The message every script should print when the CLI is not where it expects it. */
export const requireCli = (cli: string) => {
	if (existsSync(cli)) return cli
	throw new UserError(
		[
			`No Source2Viewer CLI at ${cli}.`,
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
