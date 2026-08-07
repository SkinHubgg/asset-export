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
import { existsSync, readFileSync } from 'node:fs'
import { join, resolve, win32 } from 'node:path'
import { parseKeyValues } from './generate-gamedata'
import { cs2GameCandidates, fileNameOf, relSlash, stemOf } from './platform'

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
