/**
 * The cross-platform contract, held to Windows-shaped inputs from a machine that is not Windows.
 *
 *   bun test tools/cs2-export/platform.test.ts
 *
 * WHY THESE AND NOT OTHERS. Everything else in the exporter is `join()` + `existsSync()`, which
 * `node:path` already makes portable. The failures that got through were all the same shape — a path
 * BUILT with `join()` and then TAKEN APART with a hard-coded `'/'` — and none of them throws on
 * Windows. They produce an empty table, a map keyed by absolute paths, or export-relative keys with
 * `\` in the middle, all of which look like "no data" rather than "a bug". So each of the four is
 * pinned here by feeding the helper a `C:\…` path directly, which is a thing this machine can do.
 *
 * The CRLF half is a REFUTATION, kept as a test so nobody re-derives it: see the parser block below.
 */

import { describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, win32 } from 'node:path'
import { parseKeyValues } from './generate-gamedata'
import {
	UserError,
	cs2GameCandidates,
	fileNameOf,
	generatedDataDir,
	readMergeableJson,
	relSlash,
	requireCli,
	stemOf,
	writeJsonAtomic,
} from './platform'

/**
 * Resolved HERE rather than imported from `tools/skin-bench/exportOut.ts` on purpose: this directory
 * imports nothing from the repo around it, and its own test must not be the one thing that does.
 * Same env var, same default, so the two agree without a dependency.
 */
const ITEMS_GAME = resolve(
	process.env.CS2_EXPORT_OUT ?? join(import.meta.dir, 'out'),
	'scripts',
	'scripts',
	'items',
	'items_game.txt',
)

describe('relSlash — the export-relative path, on both separators', () => {
	test('a Windows path under a Windows root comes out forward-slashed and root-relative', () => {
		const root = 'C:\\Users\\Bob\\cs2-export\\out'
		const file = 'C:\\Users\\Bob\\cs2-export\\out\\models\\weapons\\models\\ak47\\weapon_rif_ak47.glb'
		expect(relSlash(root, file)).toBe('models/weapons/models/ak47/weapon_rif_ak47.glb')
	})

	test('a POSIX path is unchanged — the macOS behaviour this replaced', () => {
		const root = '/Users/bob/cs2-export/out'
		expect(relSlash(root, `${root}/models/weapons/models/ak47/weapon_rif_ak47.glb`)).toBe(
			'models/weapons/models/ak47/weapon_rif_ak47.glb',
		)
	})

	test('a mixed-separator path (Win32 fs accepts them, so they DO occur) still normalises', () => {
		expect(relSlash('C:\\out', 'C:\\out/models\\ak.glb')).toBe('models/ak.glb')
	})

	test('a trailing separator on the root does not leak a leading slash into the result', () => {
		expect(relSlash('C:\\out\\', 'C:\\out\\models\\ak.glb')).toBe('models/ak.glb')
		expect(relSlash('/out/', '/out/models/ak.glb')).toBe('models/ak.glb')
	})

	/**
	 * BUG 1, as it was written. `dump-sticker-slots.ts` took the model's parent folder with
	 * `file.slice(temp.length + 1).split('/').at(-2)`, then `continue`d when it was falsy — so on
	 * Windows every one of the 119 models was skipped and `stickerSlots.data.ts` was written with an
	 * empty table. No throw, no warning, 35 weapons silently becoming 0.
	 */
	test('BUG REPRO — split("/") loses the folder on Windows; relSlash keeps it', () => {
		const temp = 'C:\\Temp\\cs2-sticker-markup-abc'
		const file = win32.join(temp, 'weapons', 'models', 'ak47', 'weapon_rif_ak47.vmdl_c')
		expect(
			file
				.slice(temp.length + 1)
				.split('/')
				.at(-2),
		).toBeUndefined() // the old expression
		expect(relSlash(temp, file).split('/').at(-2)).toBe('ak47') // the new one
	})

	/**
	 * BUG 3. `dump-attachments.ts` used the same slice as the TABLE KEY (`models/<stem>.glb`), which
	 * is the export-relative GLB path the viewer looks attachments up by. A Windows run emitted
	 * `models/weapons\models\ak47\weapon_rif_ak47.glb` and nothing downstream matched.
	 */
	test('BUG REPRO — the attachment table key must be forward-slashed end to end', () => {
		const temp = 'C:\\Temp\\cs2-attachments-xyz'
		const file = win32.join(temp, 'weapons', 'models', 'ak47', 'weapon_rif_ak47.vmdl')
		expect(`models/${file.slice(temp.length + 1).replace(/\.vmdl$/, '')}.glb`).toContain('\\') // old
		const key = `models/${relSlash(temp, file).replace(/\.vmdl$/, '')}.glb`
		expect(key).toBe('models/weapons/models/ak47/weapon_rif_ak47.glb')
		expect(key).not.toContain('\\')
	})
})

describe('fileNameOf / stemOf — basenames off either separator', () => {
	test('both separators, and an in-VPK path, yield the same basename', () => {
		expect(fileNameOf('C:\\out\\keychainmats\\weapons\\keychains\\kc_lil.vmat')).toBe('kc_lil.vmat')
		expect(fileNameOf('/out/keychainmats/weapons/keychains/kc_lil.vmat')).toBe('kc_lil.vmat')
		expect(fileNameOf('weapons/keychains/kc_lil.vmat')).toBe('kc_lil.vmat')
	})

	test('stemOf strips the named extension, and only the named one', () => {
		expect(stemOf('C:\\a\\b\\aa_fade.vmat', '.vmat')).toBe('aa_fade')
		expect(stemOf('/a/b/aa_fade.vmat', '.vmat')).toBe('aa_fade')
		// A dotted stem must survive: `..._psd_e7588b32.png` is the exporter's naming convention.
		expect(stemOf('/a/knife_survival_bowie_psd_e7588b32.png', '.png')).toBe('knife_survival_bowie_psd_e7588b32')
		// Wrong extension named -> the name is returned whole rather than mangled.
		expect(stemOf('/a/b/aa_fade.vmat', '.vmdl')).toBe('aa_fade.vmat')
		// No extension named -> drop whatever the last one is.
		expect(stemOf('C:\\a\\b\\aa_fade.vmat')).toBe('aa_fade')
	})

	/**
	 * BUG 2. `dump-attachments.ts` keyed its stem -> material map with `file.split('/').pop()`, so on
	 * Windows every key was an ABSOLUTE PATH and none of the two lookups against it could ever hit:
	 * all 143 charms resolved to `null` material.
	 *
	 * BUG 4 is the same expression in `extract-weapon-params.ts`, feeding an anchored regex that then
	 * matched nothing, so `weapon-composite-params.json` was written as `{}`.
	 */
	test('BUG REPRO — split("/").pop() returns the whole path on Windows', () => {
		const file = 'C:\\out\\keychainmats\\weapons\\keychains\\kc_lil.vmat'
		expect(file.split('/').pop()).toBe(file) // the old expression: the key IS the absolute path
		expect(stemOf(file, '.vmat')).toBe('kc_lil') // the new one

		const composite = 'C:\\out\\weaponcompmats\\weapons\\models\\ak47\\weapon_ak47_composite_inputs.vmat'
		const RE = /^(?:weapon_)?([a-z0-9_]+)_composite_inputs\.vmat$/
		expect(RE.exec(composite.split('/').pop() ?? '')).toBeNull() // the old expression: no match
		expect(RE.exec(fileNameOf(composite))?.[1]).toBe('ak47') // the new one
	})
})

describe('CS2 discovery', () => {
	test('an explicit override is accepted as the install root, as game/, or as game/csgo', () => {
		// All three forms have to be tried, because operators pass all three. Order matters: the path
		// AS GIVEN first, so a correct `--cs2 …/game` is not second-guessed into `…/game/game`.
		//
		// The separator in candidates 2 and 3 is whatever `node:path` on the HOST emits — this suite
		// runs on macOS, so it is `/` even for a `D:\…` input. Win32 fs accepts mixed separators, and
		// on a real Windows host `join`/`dirname` are the win32 pair, so both forms resolve. Hence the
		// segment assertions rather than a literal string.
		const root = 'D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive'
		const candidates = cs2GameCandidates(root)
		expect(candidates).toHaveLength(3)
		expect(candidates[0]).toBe(root)
		expect(candidates[1]).toBe(`${root}/game`)
		// The third form is for `--cs2 …/game/csgo`: drop one segment so it lands back on `game`.
		expect(cs2GameCandidates(`${root}/game/csgo`)[2]).toBe(`${root}/game`)
		// Backslashes only resolve where `node:path` IS the win32 module, i.e. on Windows. Asserted
		// against `win32` directly, because a POSIX `dirname` on a `\`-path returns '.'.
		const winRoot = 'D:\\SteamLibrary\\steamapps\\common\\Counter-Strike Global Offensive'
		expect(win32.dirname(`${winRoot}\\game\\csgo`)).toBe(`${winRoot}\\game`)
		expect(win32.join(winRoot, 'game')).toBe(`${winRoot}\\game`)
	})

	test('with no override, every candidate ends at a game/ folder and none is a bare drive letter', () => {
		const candidates = cs2GameCandidates()
		expect(candidates.length).toBeGreaterThan(0)
		for (const c of candidates) {
			expect(c.endsWith('game')).toBe(true)
			// `process.env.HOME` is unset on Windows and `join('', …)` silently yields a RELATIVE path,
			// which is how two scripts came to search `Library/Application Support/…` from the cwd.
			expect(c.startsWith('Library')).toBe(false)
		}
	})
})

/**
 * WHERE THE FOUR SIDE GENERATORS WRITE — and the reason this needs a test at all.
 *
 * `dump-attachments.ts`, `dump-sticker-slots.ts`, `dump-glove-finish.ts` and `dump-sticker-index.ts`
 * each built their own destination as `resolve(import.meta.dir, '../..')` plus a hard-coded
 * `apps/web-app/app/profile/[userId]/skins/[UI]/Skin/Modal/SkinPreview/`. That is two levels ABOVE
 * this folder — a sibling of the checkout, not anything inside it — so it named a directory that
 * exists in NO clone, the author's included. The four then failed in two different quiet ways: two
 * `mkdirSync(…, { recursive: true })`'d the missing tree and reported `wrote <path>` into somewhere
 * nothing reads, and two threw `ENOENT` naming a directory nobody could be expected to create.
 * Neither shape is a signal, which is how it survived the split into a standalone repository.
 *
 * There is deliberately no flag to aim them somewhere else: one destination, `<out>/data/`, off the
 * same `--out` / `CS2_EXPORT_OUT` every other generated artifact uses. Consumers copy from there.
 */
describe('generatedDataDir — the side generators have exactly one destination', () => {
	const scratch = () => mkdtempSync(join(tmpdir(), 'cs2-generated-'))

	test('it is <out>/data, and it is created inside an export that exists', () => {
		const out = scratch()
		try {
			expect(existsSync(join(out, 'data'))).toBe(false)
			expect(generatedDataDir(out)).toBe(join(out, 'data'))
			expect(existsSync(join(out, 'data'))).toBe(true)
		} finally {
			rmSync(out, { recursive: true, force: true })
		}
	})

	test('an export that already has data/ keeps what is in it — generate-gamedata wrote those', () => {
		const out = scratch()
		try {
			mkdirSync(join(out, 'data'), { recursive: true })
			Bun.write(join(out, 'data', 'skins.json'), '[]')
			expect(generatedDataDir(out)).toBe(join(out, 'data'))
			expect(existsSync(join(out, 'data', 'skins.json'))).toBe(true)
		} finally {
			rmSync(out, { recursive: true, force: true })
		}
	})

	/**
	 * THE FAILURE THE OLD CODE DID NOT HAVE. A destination whose parent is missing is a typo'd
	 * `--out` or an export that was never run — and creating it would put the tables in a brand-new
	 * empty tree beside the real one, which is the same invisible ending as writing two directories
	 * up. It has to name the flag, because the flag is the fix.
	 */
	test('a missing export root is a UserError that names the override, and creates nothing', () => {
		const out = join(tmpdir(), `cs2-generated-absent-${Date.now()}`)
		expect(() => generatedDataDir(out)).toThrow(UserError)
		try {
			generatedDataDir(out)
		} catch (err) {
			const message = (err as Error).message
			expect(message).toContain(out)
			expect(message).toContain('--out')
			expect(message).toContain('CS2_EXPORT_OUT')
		}
		expect(existsSync(out)).toBe(false)
	})

	/**
	 * If you are here because this test failed: the answer is not to update the test. Nothing in this
	 * repository may write outside the directory `--out` resolves to. Asserted against the four
	 * sources rather than against behaviour because the old bug needed a CS2 install and a decompiler
	 * to reach at runtime, and a grep needs neither.
	 */
	test('no generator reconstructs a path outside this repo', () => {
		const generators = [
			'dump-attachments.ts',
			'dump-sticker-slots.ts',
			'dump-glove-finish.ts',
			'dump-sticker-index.ts',
		]
		const offenders: string[] = []
		for (const name of generators) {
			const src = readFileSync(join(import.meta.dir, name), 'utf8')
			// `resolve(HERE, '../..')`, `join(HERE, '..', '..', …)`, and the viewer folder by name.
			for (const pattern of [/'\.\.\/\.\.'/, /'\.\.',\s*\n?\s*'\.\.'/, /SkinPreview/, /apps.web-app/])
				if (pattern.test(src)) offenders.push(`${name}: ${pattern.source}`)
		}
		expect({ escapesTheRepo: offenders }).toEqual({ escapesTheRepo: [] })
	})
})

/**
 * THE CRLF QUESTION, ANSWERED — and the answer is that there was never a bug here.
 *
 * `items_game.txt` was thought to be a Windows-only risk on the grounds that the parser splits on
 * `'\n'` and was written against a macOS extraction. It is the reverse: the macOS extraction is
 * ALREADY 100% CRLF (measured below on the real file — 272,456 CRLF, zero bare LF), so the parser has
 * been reading CRLF since it was written, and it works because it `.trim()`s every line before any
 * regex sees it. `\r` is whitespace.
 *
 * These tests exist so that a future "cleanup" that drops the `.trim()` — which looks redundant —
 * fails loudly instead of on someone's next export.
 */
describe('parseKeyValues line endings', () => {
	const FIXTURE = [
		'"items_game"',
		'{',
		'\t"paint_kits"',
		'\t{',
		'\t\t"0"',
		'\t\t{',
		'\t\t\t"name" "default"',
		'\t\t\t"wear_remap_min" "0.06"',
		'\t\t\t"wear_remap_max" "1.0"',
		'\t\t}',
		'\t}',
		'\t"paint_kits"',
		'\t{',
		'\t\t"975"',
		'\t\t{',
		'\t\t\t"name" "cu_ak47_asiimov"',
		'\t\t}',
		'\t}',
		'}',
		'',
	]

	test('CRLF parses identically to LF, including the merge and the numeric coercion', () => {
		const lf = parseKeyValues(FIXTURE.join('\n'))
		const crlf = parseKeyValues(FIXTURE.join('\r\n'))
		expect(crlf).toEqual(lf)
		const kits = (crlf.items_game as Record<string, Record<string, Record<string, unknown>>>).paint_kits
		expect(Object.keys(kits).sort()).toEqual(['0', '975'])
		expect(kits['0'].wear_remap_min).toBe(0.06)
		expect(kits['0'].wear_remap_max).toBe(1)
		expect(kits['975'].name).toBe('cu_ak47_asiimov')
	})

	test('a UTF-8 BOM in front of either form is stripped, not treated as part of the root key', () => {
		expect(parseKeyValues(`\uFEFF${FIXTURE.join('\r\n')}`)).toEqual(parseKeyValues(FIXTURE.join('\n')))
	})

	test('NEGATIVE CONTROL — bare CR is NOT supported, and says so instead of mis-parsing', () => {
		// Classic-Mac line endings would make the whole file one line. The parser must reject that
		// rather than return a plausible-looking partial tree.
		expect(() => parseKeyValues(FIXTURE.join('\r'))).toThrow()
	})

	// Skipped rather than failed when `out/` is absent: the tree is ~55 GB and gitignored, so a fresh
	// clone and an agent's worktree both legitimately lack it.
	test.skipIf(!existsSync(ITEMS_GAME))('MEASURED — the exported items_game.txt really is CRLF', () => {
		// This is the fact the refutation rests on. The parser trims either way, so the assertion is
		// "one consistent style throughout, and today that style is CRLF".
		const raw = readFileSync(ITEMS_GAME, 'latin1')
		const crlf = (raw.match(/\r\n/g) ?? []).length
		const bareLf = (raw.match(/(?<!\r)\n/g) ?? []).length
		expect(crlf + bareLf).toBeGreaterThan(100_000)
		expect(Math.min(crlf, bareLf)).toBe(0) // one style throughout, whichever it is
		expect(crlf).toBeGreaterThan(0) // today: CRLF. Flip this line if a decompiler change makes it LF.
	})
})

/**
 * THE POISONED-ARTIFACT PATTERN, which has now bitten this repo three times in one week.
 *
 * Something is written; a later run finds it present; and "present" is taken to mean "complete".
 *
 *   1. `.tools/vrf-src` — the folder was created BEFORE the unpack, so a failed unpack left an empty
 *      one that satisfied `!existsSync(VRF_SRC)` for ever. Every subsequent run skipped the download
 *      in silence and died somewhere unrelated. Reported from Windows, 2026-08-08.
 *   2. `data/texture-reflectivity.json` — merged into on every staged run and read back with a bare
 *      `JSON.parse(readFileSync(…))`. A run killed mid-write leaves truncated JSON and every later
 *      run throws `SyntaxError` naming no file, in a function nobody would think to look at.
 *   3. `Source2Viewer-CLI` — `dotnet publish` creates the apphost before filling it, so an
 *      interrupted build leaves a ZERO-BYTE executable that `existsSync` is perfectly happy with.
 *
 * 2 and 3 are pinned below. Each test first shows the artifact in its poisoned state, because a test
 * that only asserts the recovery would pass against a function that never had a problem to recover
 * from.
 */
describe('a failed run must not leave state a later run inherits', () => {
	const scratch = () => {
		const dir = mkdtempSync(join(tmpdir(), 'cs2-poison-'))
		return dir
	}

	test('TRUNCATED merge JSON is discarded and deleted, not thrown from', () => {
		const dir = scratch()
		try {
			const dest = join(dir, 'texture-reflectivity.json')
			// Exactly what a `writeFileSync` interrupted part-way through leaves behind.
			writeFileSync(dest, '{"a":{"reflectivity":[0.1,0.2,0.3]},"b":{"refle')
			// The refutation: this is what the old code did, and it is why every later run failed.
			expect(() => JSON.parse(readFileSync(dest, 'utf8'))).toThrow()

			const said: string[] = []
			expect(readMergeableJson(dest, m => said.push(m))).toEqual({})
			expect(said.join('\n')).toContain('an earlier run died mid-write')
			expect(said.join('\n')).toContain(dest)
			// And it is GONE, so the next run starts clean rather than re-reading the same rubble.
			expect(existsSync(dest)).toBe(false)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	test('a valid merge file is returned untouched — recovery must not become data loss', () => {
		const dir = scratch()
		try {
			const dest = join(dir, 'ok.json')
			writeFileSync(dest, JSON.stringify({ a: { format: 'BC7' } }))
			expect(readMergeableJson(dest)).toEqual({ a: { format: 'BC7' } })
			expect(existsSync(dest)).toBe(true)
			// A missing file is simply an empty merge, not a problem.
			expect(readMergeableJson(join(dir, 'nope.json'))).toEqual({})
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	test('a JSON ARRAY where an object was expected is rejected too', () => {
		const dir = scratch()
		try {
			const dest = join(dir, 'array.json')
			writeFileSync(dest, '[1,2,3]')
			// `JSON.parse` succeeds here, so the parse alone is not the guard — the shape check is.
			expect(readMergeableJson(dest, () => {})).toEqual({})
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	test('writeJsonAtomic leaves no .tmp behind, and replaces the previous contents', () => {
		const dir = scratch()
		try {
			const dest = join(dir, 'out.json')
			writeJsonAtomic(dest, { first: 1 })
			writeJsonAtomic(dest, { second: 2 })
			expect(JSON.parse(readFileSync(dest, 'utf8'))).toEqual({ second: 2 })
			expect(existsSync(`${dest}.tmp`)).toBe(false)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})

	test('a ZERO-BYTE decompiler is not a decompiler — requireCli says so instead of accepting it', () => {
		const dir = scratch()
		try {
			const cli = join(dir, 'Source2Viewer-CLI')
			writeFileSync(cli, '')
			// The refutation: the old guard was `existsSync` alone, and it is satisfied right now.
			expect(existsSync(cli)).toBe(true)
			expect(() => requireCli(cli)).toThrow(/is empty/)
			// Non-empty is accepted, so the guard has not just become "always fail".
			writeFileSync(cli, 'MZ...')
			expect(requireCli(cli)).toBe(cli)
			// And a path that is not there at all keeps its own, different message.
			expect(() => requireCli(join(dir, 'absent'))).toThrow(/No Source2Viewer CLI/)
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	})
})
