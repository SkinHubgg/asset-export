/**
 * Acceptance test — the CS2 game-data lists the API serves, the exporter's own `items_game` parse, and
 * the TWO things in them that cannot be re-derived from the game.
 *
 *   bun test tools/skin-bench/gamedata.test.ts
 *
 * Until 2026-08-07 the API fetched all of these at module-init time from two unmaintained community
 * repos. Then five were generated and three were still downloaded by the exporter. Now NOTHING is
 * downloaded: `generate-gamedata.ts` produces all seven `data/*.json` plus
 * `items_game.json`, out of `items_game.txt`, `csgo_english.txt` and Valve's own exported icons.
 *
 * WHAT THIS FILE EXISTS TO CATCH — every one of these is SILENT at runtime:
 *
 *  1. THE DOPPLER PHASE NAMES BEING DROPPED. Black Pearl, Phase 1-4, Emerald, Ruby and Sapphire are
 *     NOT in CS2's own localization: `csgo_english.txt` carries exactly two Doppler strings,
 *     `PaintKit_am_marbleized_Tag` "Doppler" and `PaintKit_am_marbleized_g_Tag` "Gamma Doppler". The
 *     phase is market convention keyed off the paint index, it is carried on 181 rows of
 *     `skins.json`, and a regenerated `skins.json` that lost it would leave every Doppler in the app
 *     named "Doppler" with no way to tell a Ruby from a Sapphire. Nothing would error.
 *
 *  2. THE ★ CASE POOLS BEING DROPPED. Which knives and gloves a case can drop is REFERENCED by
 *     `items_game` and never shipped in it (182 dangling loot-list names). `rare-pools.data.ts` holds
 *     the 20 pools; losing one silently empties `crates` on up to 60 knife rows.
 *
 *  3. A FIELD QUIETLY VANISHING from a generated list. The builders in `generate-gamedata.ts` are
 *     object literals; deleting a line from one produces a valid JSON file with a missing key, and
 *     `row.rarity` reads `undefined` in a UI rather than throwing.
 *
 *  4. SOMEONE "FIXING" A ROW COUNT DOWN TO MATCH UPSTREAM. We ship 11,788 stickers against their
 *     10,461 and 143 charms against their 78 because their repo stopped being updated, not because
 *     we over-collected. The floors below are upstream's counts: falling under one means a
 *     classification rule broke.
 *
 *  5. AN `image` GOING BACK TO THE COMMUNITY REPO. Upstream's `image` for six of these seven files
 *     points at `raw.githubusercontent.com` — `gloves_en.json` hotlinked every glove thumbnail in the
 *     product from a third party's repo — so copying upstream's field verbatim would keep the
 *     dependency alive in every visitor's browser even though the JSON now comes from our CDN.
 *
 *  6. THE `items_game.txt` PARSE SILENTLY LOSING DATA. Its top-level sections are emitted in several
 *     passes and must DEEP-MERGE; taking the last block instead keeps 22 items out of 2,054 and still
 *     produces valid JSON.
 *
 * Every assertion here is paired with a NEGATIVE CONTROL that runs the same predicate over a
 * deliberately-broken copy of the data and requires it to fail. Twelve probes in the session that
 * produced this file were vacuous; a test that cannot fail is worse than no test.
 */

import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	GAMEDATA_FILES,
	generateGameData,
	itemsGameTxtPath,
	parseKeyValues,
	readItemsGame,
} from './generate-gamedata'
import { assertPhaseTable, DOPPLER_PHASES, phaseFromKitName } from './phases.data'
import { RARE_SPECIAL_POOLS } from './rare-pools.data'

const EXPORT_ROOT = process.env.CS2_EXPORT_OUT || join(import.meta.dir, 'out')
const DATA = join(EXPORT_ROOT, 'data')
/** Committed in the repo as the API's offline fallback — used only so the phase test never skips. */
const COMMITTED_SKINS = join(import.meta.dir, '..', '..', 'apps', 'api', 'data', 'skins', 'api', 'skins.json')

const readJson = <T>(path: string): T => JSON.parse(readFileSync(path, 'utf8')) as T

const REGENERATE = 'bun run generate-gamedata.ts'

/* ------------------------------------------------------------------------------------------------
 * 1. The Doppler phase names
 * --------------------------------------------------------------------------------------------- */

type SkinRow = { id: string; paint_index: string; phase?: string | null; image?: string }

/**
 * The eight phase strings, and the paint indexes that MUST carry each one.
 *
 * These are not a sample. `am_marbleized` (the original Doppler) runs 415-421 and every later
 * re-issue re-uses the same ordering at a different base — 568-572 for the Gamma, 852-855 and
 * 1119-1123 for the knife and glove re-issues — which is why a phase can be asserted by index at
 * all. 415 Ruby / 416 Sapphire / 417 Black Pearl / 418-421 Phase 1-4 is the canonical block.
 */
const PHASE_INDEXES: Record<string, number[]> = {
	Ruby: [415],
	Sapphire: [416, 619],
	'Black Pearl': [417, 617],
	'Phase 1': [418, 569, 852, 1120],
	'Phase 2': [419, 570, 853, 1121],
	'Phase 3': [420, 571, 854, 1122],
	'Phase 4': [421, 572, 855, 1123],
	Emerald: [568, 1119],
}

/** Prefer the export; fall back to the committed copy so this can never silently skip. */
const skinsSource = () => {
	for (const path of [join(DATA, 'skins.json'), COMMITTED_SKINS]) if (existsSync(path)) return path
	return null
}

const phasedRows = (rows: SkinRow[]) => rows.filter(r => typeof r.phase === 'string' && r.phase.length > 0)

const indexesFor = (rows: SkinRow[], phase: string) =>
	new Set(
		phasedRows(rows)
			.filter(r => r.phase === phase)
			.map(r => Number(r.paint_index)),
	)

describe('skins.json — the Doppler phase names, which CS2 does not ship', () => {
	const source = skinsSource()

	test('a source exists at all (this test must never be a no-op)', () => {
		expect(source).not.toBeNull()
	})

	const rows = source ? readJson<SkinRow[]>(source) : []

	test('the `phase` field is present on at least the 181 rows it has always been on', () => {
		// A floor, not an equality: a CS2 update that adds a new Doppler re-issue must not fail this.
		// Dropping the field takes the count to 0, which does.
		expect(phasedRows(rows).length).toBeGreaterThanOrEqual(181)
	})

	test('all eight phase names are present', () => {
		const present = new Set(phasedRows(rows).map(r => r.phase as string))
		expect([...present].sort()).toEqual(Object.keys(PHASE_INDEXES).sort())
	})

	test('each phase sits on its canonical paint indexes', () => {
		const missing: string[] = []
		for (const [phase, indexes] of Object.entries(PHASE_INDEXES)) {
			const found = indexesFor(rows, phase)
			for (const index of indexes) if (!found.has(index)) missing.push(`${phase} @ ${index}`)
		}
		expect(missing).toEqual([])
	})

	test('NEGATIVE CONTROL — the same three assertions fail on a copy with `phase` stripped', () => {
		const stripped: SkinRow[] = rows.map(({ phase, ...rest }) => rest)
		expect(phasedRows(stripped).length).toBe(0)
		expect(new Set(phasedRows(stripped).map(r => r.phase)).size).toBe(0)
		expect(indexesFor(stripped, 'Black Pearl').has(417)).toBe(false)
		// and on a copy where only ONE phase was lost, which is the subtler regression
		const withoutRuby: SkinRow[] = rows.map(r => (r.phase === 'Ruby' ? { ...r, phase: null } : r))
		expect(indexesFor(withoutRuby, 'Ruby').has(415)).toBe(false)
		expect(phasedRows(withoutRuby).length).toBeLessThan(phasedRows(rows).length)
	})

	test('every `image` is on OUR CDN — not Steam, and not a community repo', () => {
		// This assertion is INVERTED from what it was. While `skins.json` was downloaded its images were
		// Steam econ hashes, and the test required them. Now the file is generated and every image is the
		// same Valve icon out of our own export, so a Steam URL here means someone reinstated the
		// download. `skinicons`/`econicons` are on the CDN and every URL was verified 200 there.
		const offCdn = rows.filter(r => r.image && !/^https:\/\/[^/]+\//.test(r.image))
		expect(offCdn.map(r => r.id)).toEqual([])
		const thirdParty = rows.filter(r => r.image && /githubusercontent|steamstatic|steamcdn|akamaihd/.test(r.image))
		expect(thirdParty.map(r => r.id)).toEqual([])
		// NEGATIVE CONTROL — the predicate really does catch a reinstated Steam URL.
		const sabotaged = rows.map((r, k) =>
			k === 0 ? { ...r, image: 'https://community.akamai.steamstatic.com/economy/image/abc' } : r,
		)
		expect(sabotaged.filter(r => r.image && /steamstatic/.test(r.image)).length).toBe(1)
	})
})

/* ------------------------------------------------------------------------------------------------
 * 2. gloves.json
 * --------------------------------------------------------------------------------------------- */

describe('gloves.json — generated by us, with images on our own CDN', () => {
	const path = join(DATA, 'gloves.json')

	test(`exists — regenerate with \`${REGENERATE}\``, () => {
		expect(existsSync(path)).toBe(true)
	})

	if (!existsSync(path)) return
	const rows = readJson<Record<string, unknown>[]>(path)

	test('95 rows minimum, every one carrying all four fields', () => {
		expect(rows.length).toBeGreaterThanOrEqual(95)
		const incomplete = rows.filter(
			r =>
				typeof r.weapon_defindex !== 'number' ||
				r.paint === undefined ||
				typeof r.image !== 'string' ||
				typeof r.paint_name !== 'string',
		)
		expect(incomplete).toEqual([])
	})

	test('NEGATIVE CONTROL — a row missing `paint_name` is caught', () => {
		const broken = rows.map((r, i) => (i === 3 ? { ...r, paint_name: undefined } : r))
		expect(broken.filter(r => typeof r.paint_name !== 'string').length).toBe(1)
	})

	test('the eight paintable glove models, and no others', () => {
		// 4725 Broken Fang, 5027 Bloodhound, 5030 Sport, 5031 Driver, 5032 Hand Wraps, 5033 Moto,
		// 5034 Specialist, 5035 Hydra — plus 0, the default row. `t_gloves`/`ct_gloves` (5028/5029) are
		// the unpaintable defaults and must never appear.
		const found = [...new Set(rows.map(r => r.weapon_defindex as number))].sort((a, b) => a - b)
		expect(found).toEqual([0, 4725, 5027, 5030, 5031, 5032, 5033, 5034, 5035])
	})

	test("the `0/0` default row is kept verbatim — the plugin reads it as 'no glove equipped'", () => {
		expect(rows[0]).toEqual({ weapon_defindex: 0, paint: 0, image: '', paint_name: 'Gloves | Default' })
		// Exactly one imageless row, and it is that one.
		expect(rows.filter(r => !r.image).length).toBe(1)
	})

	test('every real row is `★ <model> | <finish>` and carries a string paint index', () => {
		const real = rows.slice(1)
		expect(real.filter(r => !(r.paint_name as string).startsWith('★ ')).length).toBe(0)
		expect(real.filter(r => !(r.paint_name as string).includes(' | ')).length).toBe(0)
		// A NUMBER here would change the type on 94 rows; upstream ships strings and consumers coerce.
		expect(real.filter(r => typeof r.paint !== 'string').length).toBe(0)
	})

	test('every image is a Valve inventory icon on our CDN, never a community repo', () => {
		const real = rows.filter(r => r.image) as { image: string }[]
		// The bug this file was extended for: 94 of upstream's 95 rows hotlinked
		// raw.githubusercontent.com/Nereziel/cs2-WeaponPaints for their thumbnails.
		expect(real.filter(r => r.image.includes('githubusercontent')).length).toBe(0)
		expect(real.filter(r => !r.image.includes('/skinicons/')).length).toBe(0)
		expect(real.filter(r => !r.image.endsWith('_light_png.png')).length).toBe(0)
		// NEGATIVE CONTROL — the repo check has teeth.
		const sabotaged = real.map((r, i) =>
			i === 0 ? { image: 'https://raw.githubusercontent.com/Nereziel/x/leather_handwraps-10010.png' } : r,
		)
		expect(sabotaged.filter(r => r.image.includes('githubusercontent')).length).toBe(1)
	})
})

/* ------------------------------------------------------------------------------------------------
 * 3. The seven generated lists
 * --------------------------------------------------------------------------------------------- */

/**
 * The CONTRACT. Every key listed must be present on every row of the file — `null` is allowed where
 * the game has no value, `undefined` and "key absent" are not. Both consumers read these files: this
 * web app and the user's WeaponPaints fork.
 */
const REQUIRED: Record<(typeof GAMEDATA_FILES)[number], string[]> = {
	stickers: [
		'id',
		'name',
		'image',
		'rarity',
		'description',
		'material',
		'is_patch',
		'tournament_event_id',
		'tournament_team_id',
		'tournament_player_id',
	],
	keychains: ['id', 'name', 'image', 'rarity', 'description'],
	music: ['id', 'name', 'image', 'rarity', 'description'],
	collectibles: ['id', 'name', 'image', 'rarity', 'description'],
	agents: ['team', 'image', 'model', 'agent_name', 'id', 'rarity', 'description'],
	gloves: ['weapon_defindex', 'paint', 'image', 'paint_name'],
	// `souvenir`, `wears`, `collections` and `phase` are deliberately ABSENT here: the 20 vanilla-knife
	// rows carry none of them and 181 rows carry `phase`, exactly as upstream ships it.
	skins: [
		'id',
		'name',
		'description',
		'weapon',
		'category',
		'pattern',
		'min_float',
		'max_float',
		'rarity',
		'stattrak',
		'paint_index',
		'crates',
		'team',
		'legacy_model',
		'image',
		'original',
	],
}

/** Upstream's row counts as of 2026-08-07. A FLOOR — we ship more, deliberately, and must not trim. */
const UPSTREAM_ROWS: Record<(typeof GAMEDATA_FILES)[number], number> = {
	stickers: 10461,
	keychains: 78,
	music: 95,
	collectibles: 603,
	agents: 65,
	// Gloves are the one list where a floor is also a ceiling in practice: sweeping all 1,481 paint
	// kits for a glove icon finds exactly the 94 upstream hand-maintained, plus the default row.
	gloves: 95,
	skins: 2126,
}

/** How much of each list carried an icon when this landed. A floor, so a broken path map is loud. */
const IMAGE_FLOOR: Record<(typeof GAMEDATA_FILES)[number], number> = {
	stickers: 0.9,
	keychains: 0.95,
	music: 1,
	collectibles: 0.65,
	agents: 0.95,
	// 94 of 95. Only the `0/0` default row is imageless, exactly as upstream ships it.
	gloves: 94 / 95,
	// Every skin row resolves: 2,126 of 2,126. The vanilla knives come from `econicons`, the rest from
	// `skinicons`, and both are exported.
	skins: 1,
}

/** The display-name field, which is not called `name` in every file. */
const LABEL: Record<string, string> = { agents: 'agent_name', gloves: 'paint_name' }

const missingKeys = (rows: Record<string, unknown>[], keys: string[]) => {
	const absent = new Set<string>()
	for (const row of rows) for (const key of keys) if (!(key in row)) absent.add(key)
	return [...absent].sort()
}

for (const name of GAMEDATA_FILES) {
	describe(`${name}.json`, () => {
		const path = join(DATA, `${name}.json`)

		test(`exists — regenerate with \`${REGENERATE}\``, () => {
			expect(existsSync(path)).toBe(true)
		})

		if (!existsSync(path)) return
		const rows = readJson<Record<string, unknown>[]>(path)

		test(`has at least upstream's ${UPSTREAM_ROWS[name]} rows`, () => {
			expect(rows.length).toBeGreaterThanOrEqual(UPSTREAM_ROWS[name])
		})

		test(`every row carries all ${REQUIRED[name].length} fields`, () => {
			expect(missingKeys(rows, REQUIRED[name])).toEqual([])
		})

		test('NEGATIVE CONTROL — the field check fails when one field is deleted', () => {
			const victim = REQUIRED[name][REQUIRED[name].length - 1]
			const broken = rows.map((row, i) => {
				if (i !== 0) return row
				const { [victim]: _dropped, ...rest } = row
				return rest
			})
			expect(missingKeys(broken, REQUIRED[name])).toEqual([victim])
		})

		test('`name` is a non-empty string on every row', () => {
			const field = LABEL[name] ?? 'name'
			expect(rows.filter(r => typeof r[field] !== 'string' || !(r[field] as string).length).length).toBe(0)
		})

		test('no `image` points at the community repo, and non-empty ones are absolute URLs', () => {
			const offRepo = rows.filter(r => typeof r.image === 'string' && r.image.includes('githubusercontent'))
			expect(offRepo.length).toBe(0)
			const notAbsolute = rows.filter(r => typeof r.image === 'string' && r.image && !r.image.startsWith('https://'))
			expect(notAbsolute.length).toBe(0)
		})

		test(`at least ${Math.round(100 * IMAGE_FLOOR[name])}% of rows resolve to an icon`, () => {
			const withImage = rows.filter(r => typeof r.image === 'string' && r.image.length > 0).length
			expect(withImage / rows.length).toBeGreaterThanOrEqual(IMAGE_FLOOR[name])
		})
	})
}

describe('stickers.json — the fields upstream does not carry', () => {
	const path = join(DATA, 'stickers.json')
	if (!existsSync(path)) {
		test('exists', () => expect(existsSync(path)).toBe(true))
	} else {
		const rows = readJson<Record<string, unknown>[]>(path)
		const nonNull = (key: string) => rows.filter(r => r[key] !== null && r[key] !== undefined).length

		test('rarity, description, material and the tournament ids are all populated, not just present', () => {
			// Measured 2026-08-07 over 11,788 rows. Floors, so a broken localization or prefab lookup
			// shows up as a failure rather than as a file full of nulls that still has every key.
			expect(nonNull('rarity') / rows.length).toBeGreaterThanOrEqual(0.99)
			expect(nonNull('description') / rows.length).toBeGreaterThanOrEqual(0.7)
			expect(nonNull('material') / rows.length).toBeGreaterThanOrEqual(0.98)
			expect(nonNull('tournament_event_id') / rows.length).toBeGreaterThanOrEqual(0.85)
			expect(nonNull('tournament_team_id') / rows.length).toBeGreaterThanOrEqual(0.85)
			expect(nonNull('tournament_player_id') / rows.length).toBeGreaterThanOrEqual(0.6)
		})

		test('the 112 patch kits are flagged, and stickers are not', () => {
			const patches = rows.filter(r => r.is_patch === true)
			expect(patches.length).toBeGreaterThanOrEqual(112)
			expect(rows.filter(r => typeof r.is_patch !== 'boolean').length).toBe(0)
			expect(patches.every(r => (r.name as string).startsWith('Patch | '))).toBe(true)
			expect(rows.filter(r => r.is_patch === false).every(r => (r.name as string).startsWith('Sticker | '))).toBe(true)
		})

		test('ids are the raw sticker_kit keys the plugin stores — numeric strings, and never 0', () => {
			expect(rows.filter(r => !/^\d+$/.test(String(r.id))).length).toBe(0)
			expect(rows.filter(r => String(r.id) === '0').length).toBe(0)
		})
	}
})

/* ------------------------------------------------------------------------------------------------
 * 4. The generator, run in-process
 *
 * The tests above read the WRITTEN files, so they only fail once someone re-runs the generator. This
 * block runs the builders directly, so deleting a field from an object literal fails immediately.
 * --------------------------------------------------------------------------------------------- */

describe('generate-gamedata.ts, run in-process', () => {
	const ready = existsSync(itemsGameTxtPath(EXPORT_ROOT)) && existsSync(join(EXPORT_ROOT, 'localization'))

	test('its inputs are exported (items_game.txt + csgo_english.txt + the icon trees)', () => {
		expect(ready).toBe(true)
	})

	if (!ready) return
	const data = generateGameData({ out: EXPORT_ROOT, iconOrigin: 'https://cdn.example.test' })

	test('every builder emits every contracted field', () => {
		for (const name of GAMEDATA_FILES) {
			const rows = data[name] as unknown as Record<string, unknown>[]
			expect({ [name]: missingKeys(rows, REQUIRED[name]) }).toEqual({ [name]: [] })
		}
	})

	test("every builder clears upstream's row count", () => {
		for (const name of GAMEDATA_FILES) {
			expect({ [name]: (data[name] as unknown[]).length >= UPSTREAM_ROWS[name] }).toEqual({ [name]: true })
		}
	})

	test('`--icon-origin` is honoured, so the CDN host is not hardcoded into the data', () => {
		const images = GAMEDATA_FILES.flatMap(name =>
			(data[name] as unknown as { image: string }[]).map(r => r.image).filter(Boolean),
		)
		expect(images.length).toBeGreaterThan(10000)
		expect(images.filter(url => !url.startsWith('https://cdn.example.test/')).length).toBe(0)
	})

	test('an image is only emitted when the file is really in the export', () => {
		// `imageUrl` existence-checks before emitting, so every URL must resolve to a real file. This
		// is the guard against a rewrite rule that looks right and 404s in a browser.
		const broken: string[] = []
		for (const name of GAMEDATA_FILES) {
			for (const row of data[name] as unknown as { image: string }[]) {
				if (!row.image) continue
				const rel = row.image.replace('https://cdn.example.test/', '')
				if (!existsSync(join(EXPORT_ROOT, rel))) broken.push(rel)
			}
		}
		expect(broken.slice(0, 10)).toEqual([])
	})

	test('agents are unique per team+model, so no picker shows the same body twice', () => {
		const keys = data.agents.map(a => `${a.team}|${a.model}`)
		expect(keys.length).toBe(new Set(keys).size)
		// The two default rows both use model 'null' but differ by team, so they do not collide.
		expect(data.agents.filter(a => a.model === 'null').length).toBe(2)
		// NEGATIVE CONTROL: the un-deduped input really does collide, so this assertion has teeth.
		const undeduped = [...keys, '2|tm_phoenix/tm_phoenix']
		expect(undeduped.length).toBeGreaterThan(new Set(undeduped).size)
		expect(data.agents.every(a => a.team === 2 || a.team === 3)).toBe(true)
	})

	test('NEGATIVE CONTROL — the in-process field check catches a dropped literal key', () => {
		const sabotaged = data.keychains.map(({ rarity, ...rest }) => rest) as unknown as Record<string, unknown>[]
		expect(missingKeys(sabotaged, REQUIRED.keychains)).toEqual(['rarity'])
	})
})

/* ------------------------------------------------------------------------------------------------
 * 5. items_game.txt -> items_game.json
 *
 * This parse REPLACED a download from `ByMykel/counter-strike-file-tracker`. It was verified against
 * that file at 0 differences over all 33 sections; what these tests hold is the two properties that
 * made it equal, because either can regress into a valid-looking JSON file that is missing most of
 * the game.
 * --------------------------------------------------------------------------------------------- */

describe('the items_game.txt parse', () => {
	const txt = itemsGameTxtPath(EXPORT_ROOT)

	test('items_game.txt is exported (the `scripts` job)', () => {
		expect(existsSync(txt)).toBe(true)
	})

	if (!existsSync(txt)) return
	const raw = readFileSync(txt, 'utf8')
	const parsed = parseKeyValues(raw) as { items_game: Record<string, Record<string, unknown>> }

	test('33 top-level sections under the items_game wrapper', () => {
		expect(Object.keys(parsed)).toEqual(['items_game'])
		expect(Object.keys(parsed.items_game).length).toBe(33)
	})

	/**
	 * The counts that prove the DEEP MERGE happened. CS2 emits `"items" { … }` and its siblings in
	 * several passes; a parser that lets the last block win keeps only the final pass. These are the
	 * merged sizes — every one of them collapses by 90%+ without the merge.
	 */
	const MERGED_SIZES: Record<string, number> = {
		items: 2054,
		paint_kits: 1481,
		sticker_kits: 11789,
		item_sets: 97,
		client_loot_lists: 2503,
		revolving_loot_lists: 471,
		paint_kits_rarity: 1480,
	}

	test('every repeated section is merged, not overwritten', () => {
		const sizes = Object.fromEntries(
			Object.keys(MERGED_SIZES).map(k => [k, Object.keys(parsed.items_game[k] ?? {}).length]),
		)
		for (const [section, floor] of Object.entries(MERGED_SIZES))
			expect({ [section]: sizes[section] >= floor }).toEqual({ [section]: true })
	})

	test('NEGATIVE CONTROL — the merge is what keeps the data, on a synthetic file and on the real one', () => {
		// Directly on the property: two `"items"` blocks in one file must produce THREE keys, not one.
		// A last-block-wins parser returns `{ c: … }` here, which is the 22-items-out-of-2054 failure in
		// miniature.
		const twoPasses = '"root"\n{\n\t"items"\n\t{\n\t\t"a" "1"\n\t\t"b" "2"\n\t}\n\t"items"\n\t{\n\t\t"c" "3"\n\t}\n}'
		const merged = (parseKeyValues(twoPasses).root as Record<string, Record<string, unknown>>).items
		expect(Object.keys(merged).sort()).toEqual(['a', 'b', 'c'])
		// A duplicate SCALAR still takes the last value, which is what the game does.
		const dupScalar = '"root"\n{\n\t"k" "first"\n\t"k" "second"\n}'
		expect((parseKeyValues(dupScalar).root as Record<string, unknown>).k).toBe('second')
		// And nested blocks merge too, rather than the inner one replacing its sibling.
		const nested =
			'"root"\n{\n\t"s"\n\t{\n\t\t"x"\n\t\t{\n\t\t\t"a" "1"\n\t\t}\n\t}\n\t"s"\n\t{\n\t\t"x"\n\t\t{\n\t\t\t"b" "2"\n\t\t}\n\t}\n}'
		const deep = (parseKeyValues(nested).root as Record<string, Record<string, Record<string, unknown>>>).s.x
		expect(Object.keys(deep).sort()).toEqual(['a', 'b'])
		// The real file really does repeat its sections — otherwise the above proves nothing about it.
		// (`items_game.txt` is CRLF, hence the trim.)
		const topLevelRepeats = raw
			.split('\n')
			.map(l => l.replace(/\r$/, ''))
			.filter(l => /^\t"(items|paint_kits|sticker_kits)"$/.test(l)).length
		expect(topLevelRepeats).toBeGreaterThan(3)
	})

	test('numeric scalars are NUMBERS, as the file this replaced had them', () => {
		// `wear_remap_min` "0.06" must be 0.06 and `"1.0"` must be 1 — JS `Number()` semantics. Leaving
		// them as strings produced 76,572 differences against the downloaded file and would break every
		// `min_float` comparison in the app.
		const kit = parsed.items_game.paint_kits['0'] as Record<string, unknown>
		expect(typeof kit.wear_remap_min).toBe('number')
		expect(kit.wear_remap_min).toBe(0.06)
		const ak = parsed.items_game.paint_kits['975'] as Record<string, unknown>
		expect(ak.wear_remap_max).toBe(1)
		// A name must stay a string even though it is all digits nowhere here — check a real string.
		expect(typeof (parsed.items_game.items['7'] as Record<string, unknown>).name).toBe('string')
	})

	test('NEGATIVE CONTROL — the parser throws on a dialect it does not handle', () => {
		expect(() => parseKeyValues('"root"\n{\n\tunquoted_token\n}')).toThrow()
		expect(() => parseKeyValues('"root"\n{\n\t"key"\n}')).toThrow()
		expect(() => parseKeyValues('no root key')).toThrow()
	})

	test('readItemsGame prefers the txt and exposes every section the builders need', () => {
		const game = readItemsGame(EXPORT_ROOT)
		for (const section of [
			'items',
			'prefabs',
			'sticker_kits',
			'keychain_definitions',
			'music_definitions',
			'paint_kits',
			'paint_kits_rarity',
			'rarities',
			'item_sets',
			'client_loot_lists',
		] as const)
			expect({ [section]: Object.keys(game[section] ?? {}).length > 0 }).toEqual({ [section]: true })
	})
})

/* ------------------------------------------------------------------------------------------------
 * 6. The two checked-in tables
 *
 * Everything else in this pipeline is derived. These two are DATA, because the game files do not
 * contain them, and data is what goes stale. Both are cross-checked against the live export.
 * --------------------------------------------------------------------------------------------- */

describe('phases.data.ts — the Doppler phase table', () => {
	test('24 paint indexes, 8 distinct phases', () => {
		expect(Object.keys(DOPPLER_PHASES).length).toBe(24)
		expect(new Set(Object.values(DOPPLER_PHASES)).size).toBe(8)
	})

	test('the table and the kit NAMES agree — nothing has been renamed under us', () => {
		const game = readItemsGame(EXPORT_ROOT)
		expect(assertPhaseTable(game.paint_kits as Record<string, { name?: string }>)).toEqual([])
	})

	test('`am_` is load-bearing: the three non-Doppler emerald kits are excluded', () => {
		// an_emerald_bravo (196), an_emerald (453) and specialist_emerald_web (10034) all contain a phase
		// token and are not Dopplers. Dropping the prefix test would give them a phase.
		expect(phaseFromKitName('an_emerald_bravo')).toBeNull()
		expect(phaseFromKitName('an_emerald')).toBeNull()
		expect(phaseFromKitName('specialist_emerald_web')).toBeNull()
		// while the real ones resolve
		expect(phaseFromKitName('am_emerald_marbleized')).toBe('Emerald')
		expect(phaseFromKitName('am_gamma_doppler_phase3_glock')).toBe('Phase 3')
		expect(phaseFromKitName('am_blackpearl_marbleized_b')).toBe('Black Pearl')
	})

	test('NEGATIVE CONTROL — assertPhaseTable reports a renamed and a new kit', () => {
		const game = readItemsGame(EXPORT_ROOT)
		const renamed = { ...(game.paint_kits as Record<string, { name?: string }>), '415': { name: 'am_something_else' } }
		expect(assertPhaseTable(renamed).length).toBeGreaterThan(0)
		const added = {
			...(game.paint_kits as Record<string, { name?: string }>),
			'9999': { name: 'am_doppler_phase1_new' },
		}
		expect(assertPhaseTable(added).some(p => p.includes('9999'))).toBe(true)
	})
})

describe('rare-pools.data.ts — which knives and gloves each case can drop', () => {
	const pools = Object.entries(RARE_SPECIAL_POOLS)

	test('20 pools, 678 entries, every entry a `[kit]item` key', () => {
		expect(pools.length).toBe(20)
		const entries = pools.flatMap(([, v]) => v)
		expect(entries.length).toBe(678)
		expect(entries.filter(e => !/^\[[^\]]+\].+$/.test(e))).toEqual([])
	})

	test('the 20 vanilla knives are in there — `items_game` has no `[vanilla]` loot key at all', () => {
		const vanilla = pools.flatMap(([, v]) => v).filter(e => e.startsWith('[vanilla]'))
		expect(vanilla.length).toBeGreaterThanOrEqual(20)
		expect(new Set(vanilla).size).toBeGreaterThanOrEqual(20)
	})

	test('every pool is still referenced by a crate (a rename would orphan one)', () => {
		// `generateGameData` reports an orphan as a problem rather than silently emitting empty crates.
		const data = generateGameData({ out: EXPORT_ROOT, iconOrigin: 'https://cdn.example.test' })
		expect(data.problems.filter(p => p.includes('★ pool'))).toEqual([])
	})
})

/* ------------------------------------------------------------------------------------------------
 * 7. skins.json, the largest list and the last one that was downloaded
 * --------------------------------------------------------------------------------------------- */

describe('skins.json', () => {
	const path = join(DATA, 'skins.json')
	if (!existsSync(path)) {
		test('exists', () => expect(existsSync(path)).toBe(true))
	} else {
		type Row = {
			id: string
			name: string
			paint_index: string | null
			pattern: { id: string } | null
			rarity: { id: string; name: string | null; color: string | null }
			crates: { id: string; image: string }[]
			collections?: { id: string; image: string }[]
			wears?: unknown[]
			souvenir?: boolean
			stattrak: boolean
			image: string
			weapon: { id: string; weapon_id: number }
			category: { id: string | null }
			description: string | null
		}
		const rows = readJson<Row[]>(path)
		const vanilla = rows.filter(r => r.id.startsWith('skin-vanilla-'))
		const painted = rows.filter(r => !r.id.startsWith('skin-vanilla-'))

		test('2126 rows: 2106 painted plus the 20 vanilla knives', () => {
			expect(rows.length).toBeGreaterThanOrEqual(2126)
			expect(vanilla.length).toBe(20)
			expect(painted.length).toBeGreaterThanOrEqual(2106)
		})

		test('ids are unique, and painted ids are the 12-hex form consumers stored', () => {
			expect(new Set(rows.map(r => r.id)).size).toBe(rows.length)
			expect(painted.filter(r => !/^skin-[0-9a-f]{12}$/.test(r.id))).toEqual([])
			expect(vanilla.filter(r => !/^skin-vanilla-weapon_/.test(r.id))).toEqual([])
		})

		test('one row per weapon+paint index — no wear tier leaked in as a duplicate', () => {
			// The row set is the `_light` icons only. Including `_medium`/`_heavy` would triple the file
			// and give every skin three ids.
			const keys = painted.map(r => `${r.weapon.id}|${r.paint_index}`)
			expect(keys.length).toBe(new Set(keys).size)
		})

		test('rarity is populated on every row, with a colour', () => {
			expect(rows.filter(r => !r.rarity?.id).length).toBe(0)
			expect(rows.filter(r => !r.rarity?.name).length).toBe(0)
			expect(rows.filter(r => !r.rarity?.color).length).toBe(0)
			// Gloves take the suffix-LESS id, which is what renders "Extraordinary" instead of "Covert".
			const gloveRows = rows.filter(r => r.category?.id === 'sfui_invpanel_filter_gloves')
			expect(gloveRows.length).toBe(94)
			expect(gloveRows.every(r => r.rarity.id === 'rarity_ancient')).toBe(true)
			expect(gloveRows.every(r => r.rarity.name === 'Extraordinary')).toBe(true)
		})

		test('crates and collections are populated — the join that needed a checked-in pool table', () => {
			// Floors measured 2026-08-07. `crates` empty on every knife and glove row is what a lost
			// rare-pool table looks like, and it throws no error.
			const withCrates = rows.filter(r => r.crates.length > 0).length
			const withCollections = rows.filter(r => (r.collections?.length ?? 0) > 0).length
			// 0.79 measured: the rows with no case are collection-only and souvenir-only skins.
			expect(withCrates / rows.length).toBeGreaterThanOrEqual(0.78)
			expect(withCollections / painted.length).toBeGreaterThanOrEqual(0.65)
			// Every knife and glove row must have at least one case.
			const rare = rows.filter(
				r => r.category?.id === 'sfui_invpanel_filter_gloves' || r.category?.id === 'sfui_invpanel_filter_melee',
			)
			expect(rare.filter(r => r.crates.length === 0).map(r => r.name)).toEqual([])
		})

		test('every image is on our CDN and no third-party host appears anywhere in the file', () => {
			expect(rows.filter(r => !r.image).length).toBe(0)
			const blob = readFileSync(path, 'utf8')
			expect(blob.includes('githubusercontent')).toBe(false)
			expect(blob.includes('steamstatic')).toBe(false)
			expect(blob.includes('akamaihd')).toBe(false)
			// NEGATIVE CONTROL — the same check on the string it is looking for.
			expect(`${blob.slice(0, 100)}githubusercontent`.includes('githubusercontent')).toBe(true)
		})

		test('vanilla knives keep their NARROWER shape, which is what consumers parse', () => {
			for (const row of vanilla) {
				expect(row.pattern).toBeNull()
				expect(row.paint_index).toBeNull()
				expect(row.stattrak).toBe(true)
				expect('wears' in row).toBe(false)
				expect('collections' in row).toBe(false)
				expect('souvenir' in row).toBe(false)
			}
		})

		test('descriptions are the weapon blurb PLUS the finish blurb, on every painted row', () => {
			// 188 rows get their finish text from a positional fallback in `csgo_english.txt`; if that
			// breaks they silently keep only the weapon sentence.
			expect(painted.filter(r => !r.description).length).toBe(0)
			const short = painted.filter(r => (r.description as string).length < 40)
			expect(short.map(r => r.name)).toEqual([])
		})

		test('wears are present on painted rows and never more than the five CS2 bands', () => {
			expect(painted.filter(r => !Array.isArray(r.wears) || !r.wears.length).length).toBe(0)
			expect(painted.filter(r => (r.wears as unknown[]).length > 5).length).toBe(0)
		})
	}
})
