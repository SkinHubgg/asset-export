#!/usr/bin/env bun
/**
 * Generate the game-data lists commonly fetched at runtime from `Nereziel/cs2-WeaponPaints` and
 * `ByMykel/CSGO-API` — stickers, charms, agents, music kits, collectibles and GLOVES — out of files
 * this repo already exports, so nothing has to be downloaded from an unmaintained mirror.
 *
 *   bun run generate-gamedata.ts              # write out/data/*.json
 *   bun run generate-gamedata.ts --compare    # + diff every file against upstream
 *   bun run generate-gamedata.ts --dry-run    # print the report, write nothing
 *
 *   --out <dir>          CS2_EXPORT_OUT      the export to read and write into  (default ./out)
 *   --icon-origin <url>  SKINS_CDN_ORIGIN    host baked into the `image` URLs   (set this!)
 *
 * `--icon-origin` IS WORTH SETTING BEFORE THE FIRST RUN. It is written verbatim into every `image`
 * field of the generated lists, so leaving it unset bakes a placeholder host into data you then
 * ship — and because that host is reachable, nothing about the result looks broken. The CLI prints
 * the origin it used and warns when it is the placeholder.
 *
 * This is safe to re-run at any time and is the ONLY thing to run after a CS2 update refreshes
 * `out/scripts/scripts/items/items_game.txt` — it touches a handful of small files in `out/data/` and
 * nothing else. It does NOT invoke the exporter, so it can never delete `out/`.
 *
 * THREE SOURCES, ALL THREE ALREADY EXPORTED
 * -----------------------------------------
 *   out/scripts/scripts/items/items_game.txt    Valve's own item schema (33 sections)
 *   out/localization/resource/csgo_english.txt  every display string
 *   out/skinicons/ + out/econicons/             Valve's own pre-rendered inventory icons
 *
 * `items_game.json` USED TO BE DOWNLOADED from `ByMykel/counter-strike-file-tracker`. It no longer
 * is: `readItemsGame` parses the `.txt` the `scripts` job already extracts, and the CLI writes the
 * `.json` for the other tools that read it (`export.ts`'s manifest step, `dump-attachments.ts`).
 * See `parseKeyValues` for the two rules that make the parse byte-equivalent to the file we used to
 * fetch — measured 0 differences over all 33 sections, with the comparison's negative controls in
 * `gamedata.test.ts`.
 *
 * `csgo_english.txt` is UTF-8 with a BOM as the exporter writes it (measured: the first three bytes
 * are EF BB BF), NOT the UTF-16 the VPK holds — the decompiler transcodes it. `readLocalization`
 * sniffs all three anyway, because that is a property of the exporter's decompiler version and not
 * of anything this file controls.
 *
 * WE SHIP MORE THAN UPSTREAM, DELIBERATELY
 * ----------------------------------------
 * `--compare` prints the delta in both directions. Rows upstream has and we do not are a BUG; rows
 * we have and upstream does not are the point — upstream is unmaintained, so its lists lag CS2 by
 * however long ago it stopped being updated. Never trim to match its counts.
 *
 * WHY `image` POINTS AT OUR OWN CDN
 * ---------------------------------
 * Upstream's `image` for all six of these files points at `raw.githubusercontent.com` — at the
 * community repo itself, NOT at Steam. `gloves_en.json` was the worst of them: 94 of its 95 rows
 * hotlinked `raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/main/website/img/skins/*.png`, so
 * every glove thumbnail in the product was served by a third party's repo. Keeping upstream's URL
 * keeps that dependency alive in every consumer's browser.
 *
 * `econicons/`, `stickertex/` and `skinicons/` are already exported AND already live on the CDN
 * (verified 2026-08-07: `econicons/panorama/images/econ/music_kits/valve_cs2_01_png.png`,
 * `econicons/.../keychains/missinglink/kc_missinglink_ava_png.png`,
 * `econicons/.../characters/customplayer_ctm_sas_variantc_png.png` and
 * `stickertex/stickers/dreamhack/dreamhack_snowflake_2_psd_e1edf6d7.png` all 200, and a made-up
 * sibling path 404s). So `image` is a URL on our own host, resolved by CHECKING THE FILE EXISTS on
 * disk first — a path that resolves to nothing is emitted as `''`, the same empty string upstream
 * uses for its own default rows, rather than a URL that 404s in a browser.
 *
 * `image` stays a fully-qualified absolute URL in every row, so no consumer changes: both the web app
 * and the WeaponPaints fork put it straight into an `<img src>`.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { assertPhaseTable, phaseFromKitName } from './phases.data'
import { UserError } from './platform'
import { RARE_SPECIAL_POOLS } from './rare-pools.data'

/**
 * Thrown for anything the operator can fix. Reported as a message, never a stack trace.
 *
 * ONE class for the whole toolchain, from `platform.ts`, re-exported so importers are unaffected.
 * When this was a local class, `export.ts`'s `instanceof UserError` did not match anything raised
 * here — so `--only`ing a job set without `scripts` printed a stack trace rather than the message.
 */
export { UserError }

// ---------------------------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const value = (name: string, env?: string) => {
	const i = args.indexOf(`--${name}`)
	if (i >= 0) {
		const next = args[i + 1]
		if (!next || next.startsWith('--')) throw new UserError(`--${name} needs a value`)
		return next
	}
	return env ? process.env[env] : undefined
}

/**
 * The placeholder host for `image` URLs when `--icon-origin` / `SKINS_CDN_ORIGIN` is not set.
 *
 * It is a PLACEHOLDER and not a default anyone should ship: this string is written verbatim into
 * every `image` field of `skins.json`, `stickers.json` and the rest, so an unset origin produces
 * lists that are wrong in the quietest possible way — the URLs resolve, against a host the operator
 * does not own, and nothing ever looks broken. `main()` warns whenever this value is the one in use.
 *
 * Not made mandatory the way `publish.ts`'s `--origin` is, because this writes only local files and
 * contacts nothing; the cost of getting it wrong is a re-run, not a wrong answer about someone
 * else's CDN.
 */
export const DEFAULT_ICON_ORIGIN = 'https://cdn.skinhub.gg'

// ---------------------------------------------------------------------------------------------
// items_game
// ---------------------------------------------------------------------------------------------

type Kv = Record<string, unknown>

export type ItemsGame = {
	items: Record<string, Kv>
	prefabs: Record<string, Kv>
	sticker_kits: Record<string, Kv>
	keychain_definitions: Record<string, Kv>
	music_definitions: Record<string, Kv>
	/** Paint index -> kit. 1,481 of them, gloves and weapon finishes in one namespace. */
	paint_kits: Record<string, Kv>
	/** Kit NAME -> rarity name (`ancient`, `legendary`, ...). Keyed by name, not index. */
	paint_kits_rarity: Record<string, unknown>
	rarities: Record<string, Kv>
	item_sets: Record<string, Kv>
	client_loot_lists: Record<string, Kv>
	/** Crate SERIES number -> `client_loot_lists` name. The join between a case item and its contents. */
	revolving_loot_lists: Record<string, unknown>
}

const str = (v: unknown) => (typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined)

/** `out/scripts/scripts/items/items_game.txt`, which the exporter's `scripts` job extracts verbatim. */
export const itemsGameTxtPath = (outDir: string) => join(outDir, 'scripts', 'scripts', 'items', 'items_game.txt')

const KEY_ONLY = /^"([^"]*)"$/
const KEY_VALUE = /^"([^"]*)"\s+"(.*)"$/
/**
 * Valve writes every scalar as a quoted string. `ByMykel/counter-strike-file-tracker`'s JSON — the
 * file this used to download, and the reference every consumer here was written against — ran them
 * through JS `Number()`, so `"1"` became `1` and `"1.0"` ALSO became `1`. Matching that exactly is
 * what takes the diff to zero; `export.ts` already documents that it has to read both forms.
 */
const NUMERIC = /^-?(0|[1-9]\d*)(\.\d+)?$/
const coerce = (raw: string): string | number => {
	if (!NUMERIC.test(raw)) return raw
	const n = Number(raw)
	return Number.isFinite(n) ? n : raw
}

/**
 * A KeyValues-1 parser for exactly the dialect `items_game.txt` is written in, and no more.
 *
 * The file is REGULAR to a degree that makes a 40-line parser correct: measured over the shipped 8.4
 * MB there are ZERO `//` comments, ZERO `#base` includes, ZERO `[$PLATFORM]` conditionals and ZERO
 * unquoted tokens. Every line that is not `{` or `}` matches `"key"` or `"key" "value"`. If a future
 * CS2 update introduces any of those, the parser throws on the line rather than guessing.
 *
 * DUPLICATE KEYS MUST DEEP-MERGE, and this is the whole difficulty. CS2 emits the big sections in
 * several passes — `"items" { ... }` appears more than once at the top level — and the game merges
 * them. Taking the last block instead of merging silently loses 98% of the file:
 *
 *     items            2054 merged   ->    22 last-wins
 *     paint_kits       1481          ->   332
 *     sticker_kits    11789          ->  1404
 *     item_sets          97          ->     1
 *     client_loot_lists 2503         ->    30
 *     revolving_loot_lists 471       ->    11
 *     paint_kits_rarity 1480         ->     1
 *
 * A duplicate SCALAR still takes the last value, which is what the game does and what the downloaded
 * JSON did (89 of them, all inside `campaign_definitions`' repeated `"->"` map-link keys and one
 * `prefabs/campaign_prefab/image_inventory`).
 */
export const parseKeyValues = (text: string): Record<string, unknown> => {
	const lines = text.replace(/^﻿/, '').split('\n')
	for (let i = 0; i < lines.length; i++) lines[i] = lines[i].trim()

	const mergeInto = (into: Record<string, unknown>, from: Record<string, unknown>) => {
		for (const [key, value] of Object.entries(from)) {
			const existing = into[key]
			if (existing && typeof existing === 'object' && value && typeof value === 'object')
				mergeInto(existing as Record<string, unknown>, value as Record<string, unknown>)
			else into[key] = value
		}
	}

	// Iterative would be faster; recursion is 8 levels deep here and reads like the file.
	const block = (start: number): [Record<string, unknown>, number] => {
		const obj: Record<string, unknown> = {}
		let i = start
		while (i < lines.length) {
			const line = lines[i]
			if (!line) {
				i++
				continue
			}
			if (line === '}') return [obj, i + 1]
			const kv = KEY_VALUE.exec(line)
			if (kv) {
				obj[kv[1]] = coerce(kv[2])
				i++
				continue
			}
			const keyOnly = KEY_ONLY.exec(line)
			if (!keyOnly) throw new UserError(`items_game.txt line ${i + 1} is not KeyValues this parser handles: ${line}`)
			i++
			while (i < lines.length && !lines[i]) i++
			if (lines[i] !== '{') throw new UserError(`items_game.txt line ${i + 1}: expected "{" after "${keyOnly[1]}"`)
			const [sub, next] = block(i + 1)
			const existing = obj[keyOnly[1]]
			if (existing && typeof existing === 'object') mergeInto(existing as Record<string, unknown>, sub)
			else obj[keyOnly[1]] = sub
			i = next
		}
		return [obj, i]
	}

	let i = 0
	while (i < lines.length && !lines[i]) i++
	const root = KEY_ONLY.exec(lines[i])
	if (!root) throw new UserError(`items_game.txt does not open with a quoted root key (got: ${lines[i]})`)
	i++
	while (i < lines.length && !lines[i]) i++
	if (lines[i] !== '{') throw new UserError('items_game.txt has no "{" after its root key')
	return { [root[1]]: block(i + 1)[0] }
}

const SECTIONS = [
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
] as const

/**
 * Parse the exported `items_game.txt`, or fall back to a pre-existing `data/items_game.json` for an
 * export taken before the `scripts` job was part of it.
 */
export const readItemsGame = (outDir: string): ItemsGame => {
	const txt = itemsGameTxtPath(outDir)
	const json = join(outDir, 'data', 'items_game.json')
	let parsed: { items_game?: unknown } | unknown
	if (existsSync(txt)) parsed = parseKeyValues(readFileSync(txt, 'utf8'))
	else if (existsSync(json)) parsed = JSON.parse(readFileSync(json, 'utf8'))
	else throw new UserError(`${txt} is missing — export the "scripts" job first`)
	// Both the parser and the file it replaced keep the outer `items_game` wrapper; tolerate both.
	const root = ((parsed as { items_game?: unknown })?.items_game ?? parsed) as Partial<ItemsGame>
	for (const section of SECTIONS) {
		if (!root[section] || typeof root[section] !== 'object')
			throw new UserError(`items_game has no "${section}" section`)
	}
	return root as ItemsGame
}

/**
 * An item's `prefab` is a SPACE-SEPARATED list, and each prefab may itself name more prefabs, so
 * classification has to walk the whole graph rather than compare one string. This is what separates
 * "is a collectible" (the chain reaches `collectible`) from "happens to be called a coin".
 */
export const prefabChain = (prefabs: Record<string, Kv>, prefab: string | undefined): string[] => {
	const out: string[] = []
	const seen = new Set<string>()
	const queue = (prefab ?? '').split(/\s+/).filter(Boolean)
	while (queue.length) {
		const name = queue.shift() as string
		if (seen.has(name)) continue
		seen.add(name)
		out.push(name)
		const parent = str(prefabs[name]?.prefab)
		if (parent) queue.push(...parent.split(/\s+/).filter(Boolean))
	}
	return out
}

/** Read a field off an item, falling back to whatever its prefab chain defines — as the game does. */
export const inherited = (prefabs: Record<string, Kv>, item: Kv, key: string): string | undefined => {
	const own = str(item[key])
	if (own) return own
	for (const name of prefabChain(prefabs, str(item.prefab))) {
		const fromPrefab = str(prefabs[name]?.[key])
		if (fromPrefab) return fromPrefab
	}
	return undefined
}

/** Same walk, for the fields that are BLOCKS rather than scalars — `used_by_classes` is the only one. */
export const inheritedObject = (prefabs: Record<string, Kv>, item: Kv, key: string): Kv | undefined => {
	const own = item[key]
	if (own && typeof own === 'object') return own as Kv
	for (const name of prefabChain(prefabs, str(item.prefab))) {
		const fromPrefab = prefabs[name]?.[key]
		if (fromPrefab && typeof fromPrefab === 'object') return fromPrefab as Kv
	}
	return undefined
}

// ---------------------------------------------------------------------------------------------
// Localization
// ---------------------------------------------------------------------------------------------

/**
 * `csgo_english.txt` is a Valve KeyValues file whose `Tokens` block is flat `"key" "value"` pairs.
 * Keys are matched case-INSENSITIVELY because `items_game` does not agree with the localization file
 * on case (`#StickerKit_dh_gologo1` vs the file's own casing varies by era).
 *
 * First definition wins: the file occasionally repeats a key, and the game takes the first.
 */
export const readLocalization = (outDir: string): Map<string, string> => {
	const path = join(outDir, 'localization', 'resource', 'csgo_english.txt')
	if (!existsSync(path)) throw new UserError(`${path} is missing — export the localization job first`)
	const raw = readFileSync(path)
	let text: string
	if (raw[0] === 0xff && raw[1] === 0xfe) text = raw.toString('utf16le')
	else if (raw[0] === 0xfe && raw[1] === 0xff) text = raw.swap16().toString('utf16le')
	else text = raw.toString('utf8').replace(/^﻿/, '')

	const tokens = new Map<string, string>()
	for (const line of text.split('\n')) {
		const match = /^\s*"([^"]+)"\s+"(.*)"\s*$/.exec(line.replace(/\r$/, ''))
		if (!match) continue
		const key = match[1].toLowerCase()
		if (!tokens.has(key)) tokens.set(key, match[2])
	}
	if (tokens.size < 1000) throw new UserError(`csgo_english.txt parsed to only ${tokens.size} tokens — wrong format?`)
	return tokens
}

/** `#StickerKit_dh_gologo1` -> `Shooter`, or undefined when the token is dangling. */
const localize = (tokens: Map<string, string>, token: string | undefined) =>
	token ? tokens.get(token.replace(/^#/, '').toLowerCase()) : undefined

// ---------------------------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------------------------

/**
 * `image_inventory` is an in-game panorama path (`econ/keychains/missinglink/kc_missinglink_ava`).
 * The `econicons` job writes it under `panorama/images/` with the decompiler's `_png` suffix, so the
 * export-relative path is a pure rewrite with no lookup.
 */
export const econIconPath = (imageInventory: string) => `econicons/panorama/images/${imageInventory}_png.png`

/**
 * A sticker kit has no `image_inventory` — the game renders its inventory icon from the sticker
 * material. `sticker_kits[id].sticker_material` names a `.vmat` under `stickermats/stickers/`, whose
 * `Compiled Textures` block binds `g_tSticker0` to the sticker's own artwork. That texture IS the
 * sticker face, which is what an inventory icon shows.
 *
 * The `.vtex` refs the decompiler writes already carry the content hash the exported `.png` uses
 * (`stickers/dreamhack/sticker_dhacksteelseries_csgologo_psd_8299b27c.vtex`), so this too is a pure
 * rewrite — the same one `dump-sticker-index.ts` performs for the renderer.
 */
/**
 * VALVE'S OWN PRE-RENDERED INVENTORY ICONS, and the reason `gloves.json` no longer has to be
 * downloaded.
 *
 * `skinicons/panorama/images/econ/default_generated/` holds 6,804 PNGs named
 * `<item name>_<paint kit name>_<wear tier>_png.png` — `leather_handwraps_handwrap_camo_grey_light`,
 * `sporty_gloves_sporty_hunter_heavy`. That filename is BOTH the artwork and the (item, kit) pairing,
 * which matters because the pairing is nowhere else in the game files: a glove paint kit appears only
 * in `paint_kits` and `paint_kits_rarity`, in NO `item_sets` entry and NO loot list, so nothing in
 * `items_game` says which glove model wears which finish.
 *
 * Measured over the shipped export: all 94 glove kits resolve, every one to exactly ONE glove item
 * (no kit name is a suffix of another item's), and the item the filename names agrees with upstream's
 * hand-maintained `weapon_defindex` on 94 of 94 rows. All 94 ship all three wear tiers.
 */
export const SKIN_ICON_DIR = 'skinicons/panorama/images/econ/default_generated'

/** Least-worn first. Every glove kit ships all three, so `light` is what every row actually gets. */
const WEAR_TIERS = ['light', 'medium', 'heavy'] as const

export const skinIconPath = (item: string, kit: string, wear: string) =>
	`${SKIN_ICON_DIR}/${item}_${kit}_${wear}_png.png`

export const stickerIconPath = (outDir: string, material: string): string | null => {
	const vmat = join(outDir, 'stickermats', 'stickers', `${material}.vmat`)
	if (!existsSync(vmat)) return null
	const text = readFileSync(vmat, 'utf8')
	const ref = /"g_tSticker0"\s+"([^"]+)"/.exec(text)?.[1]
	if (!ref) return null
	const png = ref.replace(/\.vtex$/i, '.png')
	if (png.startsWith('materials/')) return `defaults/${png}`
	if (png.startsWith('stickers/') || png.startsWith('items/')) return `stickertex/${png}`
	return null
}

// ---------------------------------------------------------------------------------------------
// Shapes
//
// Every row keeps upstream's field NAMES and types so both consumers — this web app and the
// WeaponPaints fork — read them unchanged. Added fields are additive only.
// ---------------------------------------------------------------------------------------------

export type StickerRow = {
	id: string
	name: string
	image: string
	rarity: string | null
	description: string | null
	/** `dreamhack/dh_gologo1` — the material name, which is also the CDN path segment. */
	material: string | null
	/** 112 of 11,789 kits are PATCHES, not stickers: their art comes from `patch_material`. */
	is_patch: boolean
	tournament_event_id: number | null
	tournament_team_id: number | null
	tournament_player_id: number | null
}

export type KeychainRow = {
	id: string
	name: string
	image: string
	rarity: string | null
	description: string | null
}

export type MusicRow = {
	id: string
	name: string
	image: string
	/** ALWAYS null: `music_definitions` carries no rarity and neither does the music-kit item. */
	rarity: string | null
	description: string | null
}

export type CollectibleRow = {
	id: string
	name: string
	image: string
	rarity: string | null
	description: string | null
}

export type AgentRow = {
	team: number
	image: string
	model: string
	agent_name: string
	/** Not in upstream. The item definition index, which is what an inventory row actually stores. */
	id: string | null
	rarity: string | null
	description: string | null
}

/**
 * `gloves_en.json`'s shape, kept EXACTLY — the user's WeaponPaints fork reads this file and the web
 * app's `WEAPON_CATEGORIES` matches gloves by `paint_name.includes(weapon.name)`.
 *
 * `paint` is a STRING on the 94 real rows and the NUMBER 0 on the default row, because that is what
 * upstream ships. Reproduced rather than tidied, so these lists stay drop-in replacements for the
 * community ones — the type there is `number | string` too.
 */
export type GloveRow = {
	weapon_defindex: number
	paint: number | string
	image: string
	paint_name: string
}

export type GameData = {
	stickers: StickerRow[]
	keychains: KeychainRow[]
	music: MusicRow[]
	collectibles: CollectibleRow[]
	agents: AgentRow[]
	gloves: GloveRow[]
	skins: SkinRow[]
}

/** One canonical name per category — no `_en` suffix. The same files serve the site and the plugin. */
export const GAMEDATA_FILES = ['stickers', 'keychains', 'music', 'collectibles', 'agents', 'gloves', 'skins'] as const

// ---------------------------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------------------------

type Ctx = {
	game: ItemsGame
	tokens: Map<string, string>
	outDir: string
	iconOrigin: string
}

/** Turn an export-relative path into an absolute URL, but only if the file is really there. */
const imageUrl = (ctx: Ctx, relPath: string | null | undefined) => {
	if (!relPath) return ''
	if (!existsSync(join(ctx.outDir, relPath))) return ''
	return `${ctx.iconOrigin.replace(/\/+$/, '')}/${relPath}`
}

/** `0`/absent/non-numeric -> null. A tournament id of 0 means "no tournament", not "tournament 0". */
const idOrNull = (v: unknown) => {
	const n = Number(str(v))
	return Number.isFinite(n) && n !== 0 ? n : null
}

/**
 * `description_string` occasionally points at a token that is not in `csgo_english.txt`; Valve's own
 * fallback is to render the token, which is useless in a UI. Emit null instead so a consumer can
 * tell "no description" from "a description that says StickerKit_desc_dh_gologo1".
 */
const description = (ctx: Ctx, token: string | undefined) => {
	const value = localize(ctx.tokens, token)
	if (!value) return null
	if (token && value.toLowerCase() === token.replace(/^#/, '').toLowerCase()) return null
	// The KV file escapes newlines and quotes; a consumer rendering the raw string would show a
	// literal `\n`. Valve's own `<i>` markup is left alone — it is part of the string in game too.
	return value.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t')
}

/**
 * `Sticker | Shooter`. The prefix is not in `csgo_english.txt` under any `CSGO_Type_*` token
 * (checked: `CSGO_Type_Sticker`, `CSGO_Type_Patch`, `CSGO_Type_Keychain`, `CSGO_Type_Charm` are all
 * absent), so it is spelled out here to match what both consumers already render.
 */
const buildStickers = (ctx: Ctx) => {
	const rows: StickerRow[] = []
	for (const [id, kit] of Object.entries(ctx.game.sticker_kits)) {
		// id 0 is the "default" placeholder — no art, no name. Upstream drops it and so do we; a
		// sticker id of 0 means "no sticker" everywhere in the plugin and the inspect protobuf.
		if (id === '0') continue
		const stickerMaterial = str(kit.sticker_material)
		const patchMaterial = str(kit.patch_material)
		const material = stickerMaterial ?? patchMaterial ?? null
		const label = localize(ctx.tokens, str(kit.item_name)) ?? str(kit.name) ?? id
		rows.push({
			id,
			name: `${patchMaterial && !stickerMaterial ? 'Patch' : 'Sticker'} | ${label}`,
			image: imageUrl(ctx, material ? stickerIconPath(ctx.outDir, material) : null),
			rarity: str(kit.item_rarity) ?? null,
			description: description(ctx, str(kit.description_string)),
			material,
			is_patch: Boolean(patchMaterial && !stickerMaterial),
			tournament_event_id: idOrNull(kit.tournament_event_id),
			tournament_team_id: idOrNull(kit.tournament_team_id),
			tournament_player_id: idOrNull(kit.tournament_player_id),
		})
	}
	return rows
}

/**
 * 61 of the 143 charm definitions are HIGHLIGHT-REEL variants: they carry `base` + `highlight_reel`
 * and inherit art and rarity from the charm named by `base`. They are real inventory items, so they
 * are kept — following `base` is what upstream's 78-row list is missing.
 */
const buildKeychains = (ctx: Ctx) => {
	const defs = ctx.game.keychain_definitions
	const rows: KeychainRow[] = []
	for (const [id, def] of Object.entries(defs)) {
		const base = str(def.base)
		const parent = base ? Object.values(defs).find(d => str(d.name) === base) : undefined
		const inventory = str(def.image_inventory) ?? (parent ? str(parent.image_inventory) : undefined)
		rows.push({
			id,
			name: `Charm | ${localize(ctx.tokens, str(def.loc_name)) ?? str(def.name) ?? id}`,
			image: imageUrl(ctx, inventory ? econIconPath(inventory) : null),
			rarity: str(def.item_rarity) ?? (parent ? str(parent.item_rarity) : undefined) ?? null,
			description: description(ctx, str(def.loc_description) ?? (parent ? str(parent.loc_description) : undefined)),
		})
	}
	return rows
}

/**
 * Valve's own kits (`valve_*`) are displayed WITHOUT the "Music Kit | " prefix, in game and upstream
 * alike. Three of the 101 definitions are Valve's.
 */
const buildMusic = (ctx: Ctx) => {
	const prefix = localize(ctx.tokens, '#CSGO_Type_MusicKit') ?? 'Music Kit'
	const rows: MusicRow[] = []
	for (const [id, def] of Object.entries(ctx.game.music_definitions)) {
		const name = str(def.name) ?? id
		const label = localize(ctx.tokens, str(def.loc_name)) ?? name
		const inventory = str(def.image_inventory)
		rows.push({
			id,
			name: name.startsWith('valve_') ? label : `${prefix} | ${label}`,
			image: imageUrl(ctx, inventory ? econIconPath(inventory) : null),
			rarity: null,
			description: description(ctx, str(def.loc_description)),
		})
	}
	return rows
}

/**
 * Pins, coins, trophies, map tokens, operation passes and tournament journals — everything the game
 * files call a collectible and everything that behaves like one.
 *
 * The prefab chain alone is not enough. Measured against upstream's 603 ids, `chain includes
 * 'collectible'` reaches 524 of them: operation passes hang off `season_pass` and tournament journals
 * and passes off `fan_shield` / `fan_token`, none of which inherit `collectible`. Those four markers
 * plus "its icon is an `econ/status_icons/` image" cover all 603 with 92 to spare.
 */
const COLLECTIBLE_PREFABS = ['collectible', 'season_pass', 'fan_shield', 'fan_token']

/**
 * A quality that is part of the DISPLAY NAME. `item_quality` is almost always inherited from a
 * prefab rather than set on the item (`commodity_pin` is where the 34 Genuine pins get theirs), and
 * `genuine` is the only non-`normal` quality any collectible resolves to in shipped data. The
 * `qualities` section carries no `loc_key`, so there is no token to localize — hence the literal.
 */
const QUALITY_PREFIX: Record<string, string> = { genuine: 'Genuine' }

const buildCollectibles = (ctx: Ctx) => {
	const { items, prefabs } = ctx.game
	const rows: CollectibleRow[] = []
	for (const [id, item] of Object.entries(items)) {
		const chain = prefabChain(prefabs, str(item.prefab))
		const inventory = inherited(prefabs, item, 'image_inventory')
		const isCollectible =
			COLLECTIBLE_PREFABS.some(p => chain.includes(p)) || Boolean(inventory?.startsWith('econ/status_icons/'))
		if (!isCollectible) continue
		const itemName = inherited(prefabs, item, 'item_name')
		const quality = QUALITY_PREFIX[inherited(prefabs, item, 'item_quality') ?? '']
		const label = localize(ctx.tokens, itemName) ?? str(item.name) ?? id
		rows.push({
			id,
			name: quality ? `${quality} ${label}` : label,
			image: imageUrl(ctx, inventory ? econIconPath(inventory) : null),
			rarity: inherited(prefabs, item, 'item_rarity') ?? null,
			description: description(ctx, inherited(prefabs, item, 'item_description')),
		})
	}
	return rows
}

/**
 * Agents. `used_by_classes` is the team, and it is the ONLY place the team lives — the model path
 * prefix (`tm_`/`ctm_`) agrees with it but is a naming convention, not data.
 *
 * The two leading rows with `model: 'null'` are upstream's, and they are load-bearing: the plugin
 * and the site both use them as "reset to the default agent". They are kept verbatim.
 *
 * DEDUPED ON `team|model`, which is what the plugin actually stores. 141 item definitions resolve to
 * only 79 distinct models: 62 of the untradable `customplayer` definitions (mission and map-based
 * loadout slots) all point at `tm_phoenix/tm_phoenix` or `ctm_sas/ctm_sas` and localize to "Default T
 * Agent". Emitting them would put the same body in an agent picker 33 times. The row kept is the
 * first one with an inventory icon, so a real agent always wins over a placeholder sharing its model.
 */
const TEAM = { terrorists: 2, 'counter-terrorists': 3 } as const

const buildAgents = (ctx: Ctx) => {
	const { items, prefabs } = ctx.game
	const rows: AgentRow[] = [
		{ team: 2, image: '', model: 'null', agent_name: 'Agent | Default', id: null, rarity: null, description: null },
		{ team: 3, image: '', model: 'null', agent_name: 'Agent | Default', id: null, rarity: null, description: null },
	]
	const byModel = new Map<string, AgentRow>()
	for (const [id, item] of Object.entries(items)) {
		if (!prefabChain(prefabs, str(item.prefab)).includes('customplayer')) continue
		const modelPlayer = inherited(prefabs, item, 'model_player')
		if (!modelPlayer) continue
		const classes = (item.used_by_classes ?? {}) as Record<string, unknown>
		const team = Object.entries(TEAM).find(([cls]) => classes[cls])?.[1]
		if (!team) continue
		const inventory = inherited(prefabs, item, 'image_inventory')
		const row: AgentRow = {
			team,
			image: imageUrl(ctx, inventory ? econIconPath(inventory) : null),
			// Upstream stores the path relative to the agent model root, extension stripped.
			model: modelPlayer
				.replace(/^characters\/models\//, '')
				.replace(/^agents\/models\//, '')
				.replace(/\.vmdl$/i, ''),
			agent_name: localize(ctx.tokens, inherited(prefabs, item, 'item_name')) ?? str(item.name) ?? id,
			id,
			rarity: inherited(prefabs, item, 'item_rarity') ?? null,
			description: description(ctx, inherited(prefabs, item, 'item_description')),
		}
		const key = `${row.team}|${row.model}`
		const existing = byModel.get(key)
		if (!existing || (!existing.image && row.image)) byModel.set(key, row)
	}
	rows.push(...byModel.values())
	return rows
}

/**
 * Gloves.
 *
 * The eight paintable glove items are the ones whose prefab chain reaches `hands_paintable` — 4725
 * Broken Fang, 5027 Bloodhound, 5030 Sport, 5031 Driver, 5032 Hand Wraps, 5033 Moto, 5034 Specialist,
 * 5035 Hydra. (`t_gloves` / `ct_gloves` reach `hands` only and are the unpaintable defaults.)
 *
 * The (item, kit) pairing comes from the ICON FILENAME — see `SKIN_ICON_DIR` for why there is nowhere
 * else to get it. A kit that resolves to more than one item would be an ambiguity this cannot
 * silently pick a winner for, so it is reported rather than guessed.
 *
 * `paint_name` is `★ <weapon> | <finish>`:
 *   - `★` is the `unusual` craft class every `hands_paintable` item carries. Panorama draws the star
 *     from the craft class rather than from a string, so there is no token to localise — same reason
 *     `Sticker | ` is spelled out in `buildStickers`.
 *   - `<weapon>` is the item's `item_name` token (`#CSGO_Wearable_v_leather_handwrap` -> "Hand Wraps").
 *   - `<finish>` is the paint kit's `description_TAG`, not its `description_string`. Measured: the tag
 *     matches upstream on 94 of 94 rows and the string on 0 of 94.
 */
const GLOVE_PREFAB = 'hands_paintable'

/**
 * Upstream's first row, kept VERBATIM. The plugin and the site both read it as "no glove equipped /
 * reset to default", so its `0`/`0`/`''` and its un-starred, un-localised label are load-bearing —
 * exactly like the two `model: 'null'` agent rows.
 */
const GLOVE_DEFAULT_ROW: GloveRow = { weapon_defindex: 0, paint: 0, image: '', paint_name: 'Gloves | Default' }

const buildGloves = (ctx: Ctx, problems: string[]) => {
	const { items, prefabs, paint_kits } = ctx.game
	const gloveItems: { name: string; defindex: number; label: string }[] = []
	for (const [id, item] of Object.entries(items)) {
		if (!prefabChain(prefabs, str(item.prefab)).includes(GLOVE_PREFAB)) continue
		const name = str(item.name)
		if (!name) continue
		gloveItems.push({
			name,
			defindex: Number(id),
			label: localize(ctx.tokens, inherited(prefabs, item, 'item_name')) ?? name,
		})
	}

	const rows: GloveRow[] = [GLOVE_DEFAULT_ROW]
	for (const [paint, kit] of Object.entries(paint_kits)) {
		const kitName = str(kit.name)
		if (!kitName) continue
		// Every tier of every matching item, so an ambiguous kit is visible rather than shadowed.
		const matches = gloveItems.filter(item =>
			WEAR_TIERS.some(wear => existsSync(join(ctx.outDir, skinIconPath(item.name, kitName, wear)))),
		)
		if (!matches.length) continue
		if (matches.length > 1) {
			problems.push(`gloves: kit ${paint} (${kitName}) resolves to ${matches.map(m => m.name).join(' + ')}`)
			continue
		}
		const item = matches[0]
		const wear = WEAR_TIERS.find(w => existsSync(join(ctx.outDir, skinIconPath(item.name, kitName, w))))
		const finish = localize(ctx.tokens, str(kit.description_tag))
		if (!finish)
			problems.push(`gloves: kit ${paint} (${kitName}) has no ${str(kit.description_tag)} in csgo_english.txt`)
		rows.push({
			weapon_defindex: item.defindex,
			// A string, as upstream ships it. `Object.entries` hands us the key, which already is one.
			paint,
			image: imageUrl(ctx, wear ? skinIconPath(item.name, kitName, wear) : null),
			paint_name: `★ ${item.label} | ${finish ?? kitName}`,
		})
	}
	// Stable across runs: `paint_kits` is insertion-ordered by the parse, and a CS2 update appends.
	// Sorting by (defindex, paint) instead would silently reorder the whole file on any renumber.
	return rows
}

// ---------------------------------------------------------------------------------------------
// skins.json
//
// The largest of the lists and the last one that was still downloaded. `ByMykel/CSGO-API` is open
// source and `skins.json` is its OUTPUT, so its `services/skins.js` is the specification followed
// here. Two things it needs are not in the game files and are checked in beside this file instead —
// `phases.data.ts` (the Doppler phases) and `rare-pools.data.ts` (the ★ case pools). Both are seeded
// from the last downloaded copy and both are re-verified by `gamedata.test.ts`.
//
// THE ONE FIELD WE DELIBERATELY DO NOT PRODUCE is `special_notes`, on 7 of upstream's 2,126 rows. It
// is editorial commentary they hand-wrote (`utils/specialNotes.json`) — links to Valve announcements
// explaining why the M4A4 Howl became Contraband and why three skins were withdrawn. It is not in the
// game files, no consumer here reads it, and inventing it would be worse than not having it. `--compare`
// prints it as a MISSING FIELD every run, on purpose, so the omission stays visible rather than quiet.
//
// THE ROW SET IS THE ICON SET. One row per (glove-or-weapon item, paint kit), enumerated from the
// `_light` tier of `skinicons/.../default_generated/` exactly as upstream enumerates its own render
// of the same directory. `_medium` and `_heavy` are the same skin at a different wear and would
// triple the file.
// ---------------------------------------------------------------------------------------------

type Named = { id: string; name: string }
type WithImage = Named & { image: string }

export type SkinRow = {
	id: string
	name: string
	description: string | null
	weapon: { id: string; weapon_id: number; name: string | null }
	category: { id: string | null; name: string | null }
	pattern: Named | null
	min_float: number | null
	max_float: number | null
	rarity: { id: string; name: string | null; color: string | null }
	stattrak: boolean
	souvenir?: boolean
	paint_index: string | null
	wears?: Named[]
	collections?: WithImage[]
	crates: WithImage[]
	phase?: string
	team: { id: string; name: string | null }
	legacy_model: boolean
	image: string
	original: { name: string | undefined }
}

/**
 * `skin-<12 hex>`, and it must be BYTE-IDENTICAL to upstream's: the id is the row's identity for
 * every consumer that stored one. Upstream hashes the icon basename with `_light_png.png` stripped,
 * which is exactly `<item name>_<paint kit name>` — SHA-1, hex, first 12 characters. Verified against
 * the shipped file: this reproduces all 2,106 generated ids, zero unmatched.
 */
const skinId = (item: string, kit: string) =>
	`skin-${new Bun.CryptoHasher('sha1').update(`${item}_${kit}`).digest('hex').slice(0, 12)}`

/**
 * Not localised and not in `items_game` — Valve's `colors` section keys these by an internal name the
 * rarity block does not reference. The hex values are the ones both consumers already render.
 */
const RARITY_COLORS: Record<string, string> = {
	rarity_common_weapon: '#b0c3d9',
	rarity_uncommon_weapon: '#5e98d9',
	rarity_rare_weapon: '#4b69ff',
	rarity_mythical_weapon: '#8847ff',
	rarity_legendary_weapon: '#d32ce6',
	rarity_ancient_weapon: '#eb4b4b',
	rarity_contraband_weapon: '#e4ae39',
	/** Gloves, and ONLY gloves — the suffix-less form is what renders "Extraordinary". */
	rarity_ancient: '#eb4b4b',
}

/** The tiers a `client_loot_lists` name can end in. Anything else is not a rarity bucket. */
const LOOT_TIERS = new Set(['common', 'uncommon', 'rare', 'mythical', 'legendary', 'ancient'])

/**
 * Eight skins whose rarity no loot list carries, upstream's list kept as-is. The M4A4 Howl is the
 * famous one — it was pulled from its case, so nothing in `items_game` still points at it.
 */
const RARITY_OVERRIDES: Record<string, string> = {
	'[cu_m4a1_howling]weapon_m4a1': 'contraband',
	'[cu_retribution]weapon_elite': 'rare',
	'[cu_mac10_decay]weapon_mac10': 'mythical',
	'[cu_p90_scorpius]weapon_p90': 'rare',
	'[hy_labrat_mp5]weapon_mp5sd': 'mythical',
	'[cu_xray_p250]weapon_p250': 'mythical',
	'[cu_usp_spitfire]weapon_usp_silencer': 'legendary',
	'[am_nitrogen]weapon_cz75a': 'rare',
}

/**
 * CS2's five wear bands. A skin lists the bands its float range can actually reach, so a kit capped
 * at 0.08 shows Factory New and Minimal Wear only. Both bounds are STRICT, as upstream has them:
 * a range that merely touches a boundary does not include that band.
 */
const WEAR_BANDS: [token: string, min: number, max: number][] = [
	['SFUI_InvTooltip_Wear_Amount_0', 0, 0.07],
	['SFUI_InvTooltip_Wear_Amount_1', 0.07, 0.15],
	['SFUI_InvTooltip_Wear_Amount_2', 0.15, 0.38],
	['SFUI_InvTooltip_Wear_Amount_3', 0.38, 0.45],
	['SFUI_InvTooltip_Wear_Amount_4', 0.45, 1],
]

/** `wear_remap_*` is absent on most kits; the game's own default is 0.06-0.80, not 0-1. */
const DEFAULT_MIN_FLOAT = 0.06
const DEFAULT_MAX_FLOAT = 0.8

/**
 * Category from the PREFAB CHAIN, which upstream does with a hardcoded 60-weapon switch. Measured
 * over the shipped data the chain is unambiguous: no item reaches two of these markers, and the
 * order below only matters because gloves and knives also reach `wearable` / `weapon_base`.
 */
const CATEGORY_BY_PREFAB: [prefab: string, token: string][] = [
	[GLOVE_PREFAB, 'sfui_invpanel_filter_gloves'],
	['melee', 'sfui_invpanel_filter_melee'],
	['equipment', 'loadoutslot_equipment'],
	['rifle', 'csgo_inventory_weapon_category_rifles'],
	['sniper_rifle', 'csgo_inventory_weapon_category_rifles'],
	['smg', 'csgo_inventory_weapon_category_smgs'],
	['shotgun', 'csgo_inventory_weapon_category_heavy'],
	['machinegun', 'csgo_inventory_weapon_category_heavy'],
	['secondary', 'csgo_inventory_weapon_category_pistols'],
]

const TEAM_LABEL: Record<string, string> = {
	both: 'inv_filter_both_teams',
	'counter-terrorists': 'inv_filter_ct',
	terrorists: 'inv_filter_t',
}

/**
 * `description` is the weapon's own blurb followed by the finish's, space-joined — and kept RAW.
 * Upstream ships the KeyValues escapes unexpanded (`\n\n<i>Preceding the blood moon</i>` is a literal
 * backslash-n in the JSON), and every consumer already handles that, so unescaping here — which is
 * what the generated five do — would change 2,126 strings for no one's benefit.
 */
const rawText = (ctx: Ctx, token: string | undefined) => localize(ctx.tokens, token) ?? null

/**
 * The finish's own blurb. The token is `#PaintKit_<kit name>` BY CONVENTION rather than by field: 47
 * glove kits carry no usable `description_string`, and the conventional token resolves for all of
 * them. Falling back to the `_tag` token stripped of its suffix is upstream's second chance, and
 * covers kits whose tag and name disagree.
 */
const finishDescription = (ctx: Ctx, kitName: string, descriptionTag: string | undefined, keys: string[]) => {
	// An EMPTY token is not an answer. 45 kits define `#PaintKit_<name>` as "" — a placeholder Valve
	// never filled in — and treating that as a hit costs 189 rows their whole finish blurb. The
	// `_tag`-stripped form is where those kits' real text lives, usually under the WEAPON finish they
	// share (`sporty` gloves' Blaze resolves to `#PaintKit_aa_flames`).
	// The `_tag` token itself is deliberately NOT a fallback: it is the finish's NAME, and appending
	// "Desert Shamagh" to a weapon blurb is not a description (233 rows).
	for (const token of [`#PaintKit_${kitName}`, (descriptionTag ?? '').replace(/_tag$/i, '')]) {
		const text = rawText(ctx, token)
		if (text) return text
	}
	// Last resort, and it is POSITIONAL. `csgo_english.txt` groups a finish family together — the
	// blurb first, then every variant's `_Tag` name — so a variant with no blurb of its own inherits
	// the nearest preceding non-`_tag` token. `#PaintKit_hy_ak47lam_blue_Tag` reaches
	// `PaintKit_hy_ak47lam` "It has been given a laminate stock." that way, and 188 rows depend on it.
	// This is why `readLocalization` must preserve FILE ORDER, which a Map does.
	const key = (descriptionTag ?? '').replace(/^#/, '').toLowerCase()
	for (let i = keys.indexOf(key); i > 0; i--) {
		if (keys[i].includes('_tag')) continue
		const text = ctx.tokens.get(keys[i])
		if (text) return text
		break
	}
	return null
}

/**
 * The two 2013/2014 promo souvenir packages, whose contents are NOT in the game files.
 *
 * `crate_dhw13_promo` (defindex 4006) and `crate_ems14_promo` (4013) are named by
 * `revolving_loot_lists` but their loot lists were never shipped, so expanding them yields nothing and
 * 103 rows lose a case from their "found in" list. Both dropped from the six launch map collections;
 * this is the same reconstruction `ByMykel/CSGO-API` makes, and it cites
 * `counterstrike.fandom.com/wiki/DreamHack_2013_Souvenir_Package` for it.
 *
 * Unlike `RARE_SPECIAL_POOLS` this is a list of COLLECTIONS, not of skins, so it does not go stale:
 * the collections themselves are read live out of `item_sets`.
 */
/**
 * The X-Ray P250 Package (defindex 4668). Its "loot list" is the item set `set_xraymachine`, which
 * `revolving_loot_lists` does not name at all — the package was a one-off promo and the only thing in
 * it is `[cu_xray_p250]weapon_p250`. Twelve rows depend on it.
 */
const EXTRA_CRATES: { defindex: string; entries: string[] }[] = [
	{ defindex: '4668', entries: ['[cu_xray_p250]weapon_p250'] },
]

const LAUNCH_MAP_SETS = ['set_dust_2', 'set_safehouse', 'set_italy', 'set_lake', 'set_train', 'set_mirage']
const PROMO_CRATES: Record<string, { sets: string[]; extra: string[] }> = {
	// The DreamHack package also held the R8 Revolver | Bone Mask, which is in none of the six sets.
	crate_dhw13_promo: { sets: LAUNCH_MAP_SETS, extra: ['[sp_tape]weapon_revolver'] },
	crate_ems14_promo: { sets: LAUNCH_MAP_SETS, extra: [] },
}

/** `[handwrap_camo_grey]leather_handwraps` — the key every loot list and item set uses. */
const lootKey = (kit: string, item: string) => `[${kit}]${item}`

const buildSkins = (ctx: Ctx, problems: string[]): SkinRow[] => {
	const { items, prefabs, paint_kits, item_sets, client_loot_lists, revolving_loot_lists } = ctx.game

	// ---- items, indexed the three ways the rest of this needs ----
	const itemByName = new Map<string, { defindex: number; item: Kv }>()
	for (const [id, item] of Object.entries(items)) {
		const name = str(item.name)
		if (name && !itemByName.has(name)) itemByName.set(name, { defindex: Number(id), item })
	}
	// Keyed LOWERCASE. One shipped kit is `cu_bizon_Curse` while its icon file, its loot-list entry and
	// upstream's `pattern.id` are all lowercase — a case-sensitive map loses PP-Bizon | Judgement of
	// Anubis and its whole collection. Every join below lowercases for the same reason.
	const kitByName = new Map<string, { paint: string; kit: Kv }>()
	for (const [paint, kit] of Object.entries(paint_kits)) {
		const name = str(kit.name)?.toLowerCase()
		if (name && !kitByName.has(name)) kitByName.set(name, { paint, kit })
	}

	// ---- rarity per [kit]item, off the loot-list name suffix ----
	const rarityByKey = new Map<string, string>(Object.entries(RARITY_OVERRIDES))
	for (const [listName, list] of Object.entries(client_loot_lists)) {
		const tier = listName.split('_').pop()
		if (!tier || !LOOT_TIERS.has(tier) || !list || typeof list !== 'object') continue
		for (const entry of Object.keys(list)) if (entry.startsWith('[')) rarityByKey.set(entry.toLowerCase(), tier)
	}

	// ---- collections per [kit]item, off item_sets ----
	const collectionsByKey = new Map<string, WithImage[]>()
	for (const set of Object.values(item_sets)) {
		const token = str(set.name)
		const members = set.items
		if (!token || !members || typeof members !== 'object') continue
		const slug = token.replace(/^#CSGO_/, '')
		const collection: WithImage = {
			id: `collection-${slug.replace(/_/g, '-')}`,
			name: localize(ctx.tokens, str(set.name_force) ?? token) ?? slug,
			image: imageUrl(ctx, econIconPath(`econ/set_icons/${slug}`)),
		}
		for (const entry of Object.keys(members)) {
			const list = collectionsByKey.get(entry.toLowerCase()) ?? []
			list.push(collection)
			collectionsByKey.set(entry.toLowerCase(), list)
		}
	}

	// ---- crates per [kit]item ----
	// Ordinary grades: expand the crate's loot list, following nested list names. `[..]..` entries are
	// leaves; anything else is a sub-list name, and a name that resolves to nothing is a ★ pool
	// reference — the whole reason `rare-pools.data.ts` exists.
	const expand = (name: string, seen = new Set<string>()): { entries: string[]; pools: string[] } => {
		if (seen.has(name)) return { entries: [], pools: [] }
		seen.add(name)
		const list = client_loot_lists[name]
		if (!list || typeof list !== 'object') return { entries: [], pools: [name] }
		const entries: string[] = []
		const pools: string[] = []
		for (const key of Object.keys(list)) {
			if (key.startsWith('[')) entries.push(key)
			else {
				const sub = expand(key, seen)
				entries.push(...sub.entries)
				pools.push(...sub.pools)
			}
		}
		return { entries, pools }
	}
	/**
	 * The crates are the loot lists `revolving_loot_lists` names — NOT the items whose prefab looks
	 * like a case. That distinction matters: the newest cases carry
	 * `prefab "volatile_pricing_gloves weapon_case_selfopening_collection"`, so a `weapon_case` prefab
	 * test misses them and their whole ★ pool with them (measured: crate 5181 and 386 rows).
	 *
	 * The crate ITEM is then found by name, or by the series number that indexed the list.
	 */
	const cratesByKey = new Map<string, WithImage[]>()
	const seenPools = new Set<string>()
	const itemBySeries = new Map<string, { id: string; item: Kv }>()
	for (const [id, item] of Object.entries(items)) {
		const attributes = item.attributes as Record<string, Kv> | undefined
		const series = attributes?.['set supply crate series']
		const value = series && typeof series === 'object' ? str(series.value) : str(series)
		if (value && !itemBySeries.has(value)) itemBySeries.set(value, { id, item })
	}

	for (const [series, listName] of Object.entries(revolving_loot_lists)) {
		if (typeof listName !== 'string') continue
		const found = itemByName.get(listName)
		const crateItem = found ? { id: String(found.defindex), item: found.item } : itemBySeries.get(series)
		if (!crateItem) continue
		const promo = PROMO_CRATES[listName]
		const { entries, pools } = promo
			? { entries: [...promo.sets.flatMap(set => expand(set).entries), ...promo.extra], pools: [] as string[] }
			: expand(listName)
		// A crate's ★ pool is also reachable through its item set's `unusuals.unique`, and some crates
		// only name it there. Both are read live; only the pool's CONTENTS are checked-in data.
		const tag = ((crateItem.item.tags as Record<string, Kv> | undefined)?.ItemSet as Kv | undefined)?.tag_value
		const unique = str((item_sets[str(tag) ?? '']?.unusuals as Kv | undefined)?.unique)
		for (const pool of new Set([...pools, ...(unique && !client_loot_lists[unique] ? [unique] : [])])) {
			seenPools.add(pool)
			entries.push(...(RARE_SPECIAL_POOLS[pool] ?? []))
		}
		const crate: WithImage = {
			id: `crate-${crateItem.id}`,
			name: localize(ctx.tokens, str(crateItem.item.item_name)) ?? str(crateItem.item.name) ?? crateItem.id,
			image: imageUrl(ctx, econIconPath(str(crateItem.item.image_inventory) ?? '')),
		}
		for (const entry of new Set(entries.map(e => e.toLowerCase()))) {
			const list = cratesByKey.get(entry) ?? []
			if (!list.some(c => c.id === crate.id)) list.push(crate)
			cratesByKey.set(entry, list)
		}
	}
	for (const { defindex, entries } of EXTRA_CRATES) {
		const item = items[defindex]
		if (!item) continue
		const crate: WithImage = {
			id: `crate-${defindex}`,
			name: localize(ctx.tokens, str(item.item_name)) ?? str(item.name) ?? defindex,
			image: imageUrl(ctx, econIconPath(str(item.image_inventory) ?? '')),
		}
		for (const entry of entries) {
			const list = cratesByKey.get(entry.toLowerCase()) ?? []
			if (!list.some(c => c.id === crate.id)) list.push(crate)
			cratesByKey.set(entry.toLowerCase(), list)
		}
	}

	for (const pool of Object.keys(RARE_SPECIAL_POOLS))
		if (!seenPools.has(pool))
			problems.push(`skins: ★ pool "${pool}" is in rare-pools.data.ts but no crate references it`)

	// ---- StatTrak: any skin in a case, or in a collection a case draws from ----
	// An EXACT prefab-token match, not a substring: `weapon_case_souvenir` contains `weapon_case` and
	// souvenir packages must not make their contents StatTrak-able (measured: 401 rows wrong if it does).
	const CASE_PREFABS = new Set(['weapon_case', 'volatile_pricing', 'volatile_pricing_gloves'])
	// Two skins whose case no longer points at them. Both were withdrawn; the StatTrak versions exist.
	const stattrakKeys = new Set(['[cu_m4a1_howling]weapon_m4a1', '[cu_xray_p250]weapon_p250'])
	const caseSets = new Set<string>()
	for (const item of Object.values(items)) {
		if (!(str(item.prefab) ?? '').split(/\s+/).some(p => CASE_PREFABS.has(p))) continue
		const tag = ((item.tags as Record<string, Kv> | undefined)?.ItemSet as Kv | undefined)?.tag_value
		if (str(tag)) caseSets.add(str(tag) as string)
	}
	// The 2021 Dust II collection is a souvenir-only re-release; its members are not StatTrak-able even
	// though a case references the set. Upstream's one exclusion, kept.
	const NO_STATTRAK_SETS = new Set(['#CSGO_set_dust_2_2021'])
	for (const set of Object.values(item_sets)) {
		const token = str(set.name)
		if (!set.is_collection || !token || NO_STATTRAK_SETS.has(token)) continue
		// Matched on the set's `name` FIELD, which is not always its key — the same asymmetry
		// `collectionsByKey` above relies on.
		if (!caseSets.has(token.replace(/^#CSGO_/, ''))) continue
		const members = set.items
		if (members && typeof members === 'object')
			for (const entry of Object.keys(members)) stattrakKeys.add(entry.toLowerCase())
	}

	// ---- the rows ----
	const category = (item: Kv) => {
		const chain = prefabChain(prefabs, str(item.prefab))
		const token = CATEGORY_BY_PREFAB.find(([prefab]) => chain.includes(prefab))?.[1] ?? null
		return { id: token, name: token ? (localize(ctx.tokens, token) ?? null) : null }
	}
	const team = (item: Kv) => {
		const classes = Object.keys((inheritedObject(prefabs, item, 'used_by_classes') ?? {}) as Kv)
		const id = !classes.length || classes.length === 2 ? 'both' : classes[0]
		return { id, name: localize(ctx.tokens, TEAM_LABEL[id] ?? TEAM_LABEL.both) ?? null }
	}
	/** Knives and gloves. Upstream's predicate, and the thing the ★ prefix and the rarity rules key on. */
	const isRareSpecial = (name: string) =>
		!name.includes('weapon_') || name.includes('weapon_knife') || name.includes('weapon_bayonet')

	// Built once: `finishDescription`'s positional fallback needs the localisation file's own order.
	const tokenOrder = [...ctx.tokens.keys()]

	const rows: SkinRow[] = []
	for (const file of readdirSync(join(ctx.outDir, SKIN_ICON_DIR))) {
		// One row per skin, not per wear tier: `_medium` and `_heavy` are the same skin worn in.
		if (!file.endsWith('_light_png.png')) continue
		// A chicken, and the pre-release CS2 icon set. Both are upstream's exclusions and both are
		// still in the shipped export.
		if (file.includes('pet_hen_1_hen') || file.includes('newcs2')) continue
		const base = file.slice(0, -'_light_png.png'.length)
		// Split on the LONGEST item name that prefixes the basename: `weapon_m4a1_silencer` has to win
		// over `weapon_m4a1`, or the kit name would keep a `silencer_` on the front.
		let matched: { name: string; defindex: number; item: Kv } | null = null
		for (const [name, entry] of itemByName)
			if (base.startsWith(`${name}_`) && (!matched || name.length > matched.name.length)) matched = { name, ...entry }
		if (!matched) continue
		const kitName = base.slice(matched.name.length + 1)
		const kitEntry = kitByName.get(kitName.toLowerCase())
		if (!kitEntry) continue
		const { paint, kit } = kitEntry
		const { name: weaponName, defindex, item } = matched

		const finish = localize(ctx.tokens, str(kit.description_tag))
		// Upstream drops a row whose finish has no localisation — the name would read "AK-47 | null".
		if (!finish) continue
		const rare = isRareSpecial(weaponName)
		const key = lootKey(kitName, weaponName)
		const tier = rarityByKey.get(key.toLowerCase())
		// Knives and gloves take a fixed rarity; a gun with no loot-list tier was never released and
		// is dropped, which is what takes 2,182 candidate icons down to upstream's 2,106 rows.
		const rarityId = rare
			? weaponName.includes('weapon_')
				? 'rarity_ancient_weapon'
				: 'rarity_ancient'
			: tier
				? `rarity_${tier}_weapon`
				: null
		if (!rarityId) continue

		const minFloat = Number(str(kit.wear_remap_min) ?? DEFAULT_MIN_FLOAT)
		const maxFloat = Number(str(kit.wear_remap_max) ?? DEFAULT_MAX_FLOAT)
		const weaponLabel = localize(ctx.tokens, inherited(prefabs, item, 'item_name'))
		const phase = phaseFromKitName(kitName)
		rows.push({
			id: skinId(weaponName, kitName),
			name: `${rare ? '★ ' : ''}${weaponLabel} | ${finish}`,
			description: [
				rawText(ctx, inherited(prefabs, item, 'item_description')),
				finishDescription(ctx, kitName, str(kit.description_tag), tokenOrder),
			]
				.filter(Boolean)
				.join(' '),
			weapon: { id: weaponName, weapon_id: defindex, name: weaponLabel ?? null },
			category: category(item),
			pattern: { id: kitName, name: finish },
			min_float: minFloat,
			max_float: maxFloat,
			rarity: {
				id: rarityId,
				name: localize(ctx.tokens, rarityId) ?? null,
				color: RARITY_COLORS[rarityId] ?? null,
			},
			// Every knife, plus any gun that ships in a case or in a case's collection.
			stattrak:
				weaponName.includes('weapon_knife') ||
				weaponName.includes('weapon_bayonet') ||
				stattrakKeys.has(key.toLowerCase()),
			// The Souvenir-O-Matic makes any GUN skin souvenir-able, so this is no longer a
			// souvenir-package lookup. Knives and gloves stay out.
			souvenir: !rare,
			paint_index: paint,
			wears: WEAR_BANDS.filter(([, min, max]) => max > minFloat && min < maxFloat).map(([token]) => ({
				id: token,
				name: localize(ctx.tokens, token) ?? token,
			})),
			collections: collectionsByKey.get(key.toLowerCase()) ?? [],
			crates: cratesByKey.get(key.toLowerCase()) ?? [],
			...(phase ? { phase } : {}),
			team: team(item),
			legacy_model: Boolean(str(kit.use_legacy_model)),
			image: imageUrl(ctx, skinIconPath(weaponName, kitName, 'light')),
			original: { name: weaponName },
		})
	}

	// ---- the 20 vanilla knives ----
	// Not skins: an unpainted knife has no paint kit and no icon in `default_generated`, so it is
	// enumerated from `melee_unusual` instead (measured: exactly the 20 defindexes upstream ships).
	// It keeps upstream's literal id and its narrower field set — no `wears`, `collections` or
	// `souvenir` — because that is what consumers parse today.
	for (const [id, item] of Object.entries(items)) {
		if (!prefabChain(prefabs, str(item.prefab)).includes('melee_unusual')) continue
		const name = str(item.name)
		if (!name) continue
		const token = inherited(prefabs, item, 'item_name')
		const label = localize(ctx.tokens, token)
		rows.push({
			id: `skin-vanilla-${name}`,
			name: `★ ${label}`,
			description: rawText(ctx, inherited(prefabs, item, 'item_description')),
			// Upstream's `weapon.id` here is the localisation TOKEN, lowercased — not the item name.
			weapon: { id: (token ?? name).replace(/^#/, '').toLowerCase(), weapon_id: Number(id), name: label ?? null },
			category: category(item),
			pattern: null,
			min_float: null,
			max_float: null,
			rarity: {
				id: 'rarity_ancient_weapon',
				name: localize(ctx.tokens, 'rarity_ancient_weapon') ?? null,
				color: RARITY_COLORS.rarity_ancient_weapon,
			},
			stattrak: true,
			paint_index: null,
			// `[vanilla]weapon_bayonet` — an entry that exists only in `rare-pools.data.ts`; see its header.
			crates: cratesByKey.get(lootKey('vanilla', name).toLowerCase()) ?? [],
			team: team(item),
			legacy_model: true,
			image: imageUrl(ctx, econIconPath(str(item.image_inventory) ?? '')),
			original: { name },
		})
	}
	return rows
}

// ---------------------------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------------------------

export const generateGameData = (opts: { out: string; iconOrigin?: string }): GameData & { problems: string[] } => {
	const ctx: Ctx = {
		game: readItemsGame(opts.out),
		tokens: readLocalization(opts.out),
		outDir: opts.out,
		iconOrigin: opts.iconOrigin ?? DEFAULT_ICON_ORIGIN,
	}
	// The phase table is the only checked-in data any of this depends on, so it is checked FIRST and
	// its disagreements travel with the rest — a silent null phase on 181 rows is the failure mode.
	const problems = assertPhaseTable(ctx.game.paint_kits as Record<string, { name?: string }>).map(p => `phases: ${p}`)
	return {
		stickers: buildStickers(ctx),
		keychains: buildKeychains(ctx),
		music: buildMusic(ctx),
		collectibles: buildCollectibles(ctx),
		agents: buildAgents(ctx),
		gloves: buildGloves(ctx, problems),
		skins: buildSkins(ctx, problems),
		problems,
	}
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

/**
 * Where each list came from before it was generated. Fetched ONLY by `--compare`, on demand, so this
 * is the one place a community URL still appears — and it is a diagnostic, not a dependency.
 * `skins.json` is `ByMykel/CSGO-API`'s; the other six are `Nereziel/cs2-WeaponPaints`'.
 */
const WEAPONPAINTS = 'https://raw.githubusercontent.com/Nereziel/cs2-WeaponPaints/refs/heads/main/website/data/'
const CSGO_API = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/'

const UPSTREAM: Record<string, string> = {
	stickers: `${WEAPONPAINTS}stickers_en.json`,
	keychains: `${WEAPONPAINTS}keychains_en.json`,
	music: `${WEAPONPAINTS}music_en.json`,
	collectibles: `${WEAPONPAINTS}collectibles_en.json`,
	agents: `${WEAPONPAINTS}agents_en.json`,
	gloves: `${WEAPONPAINTS}gloves_en.json`,
	skins: `${CSGO_API}skins.json`,
}

/**
 * What identifies a row for the diff. Not `id` for all of them: agents have none upstream and gloves
 * have none at all, so their identity is the field the consumer actually keys on.
 */
const IDENTITY: Record<string, (r: Record<string, unknown>) => string> = {
	agents: r => String(r.model),
	gloves: r => `${r.weapon_defindex}|${r.paint}`,
}
/** The display-name field, which differs per file. Compared because it is what a user sees. */
const LABEL: Record<string, string> = { agents: 'agent_name', gloves: 'paint_name' }

const pct = (n: number, of: number) => (of ? `${((100 * n) / of).toFixed(1)}%` : '-')

const report = (data: GameData) => {
	console.log('\n=== Coverage')
	for (const name of GAMEDATA_FILES) {
		const rows = data[name] as Record<string, unknown>[]
		const withImage = rows.filter(r => r.image).length
		const withRarity = rows.filter(r => r.rarity).length
		const withDesc = rows.filter(r => r.description).length
		console.log(
			`    ${name.padEnd(13)} ${String(rows.length).padStart(6)} rows` +
				`   image ${pct(withImage, rows.length).padStart(6)}` +
				`   rarity ${pct(withRarity, rows.length).padStart(6)}` +
				`   description ${pct(withDesc, rows.length).padStart(6)}`,
		)
	}
	const stickers = data.stickers
	console.log(
		`    stickers: event ${pct(stickers.filter(s => s.tournament_event_id).length, stickers.length)}` +
			`  team ${pct(stickers.filter(s => s.tournament_team_id).length, stickers.length)}` +
			`  player ${pct(stickers.filter(s => s.tournament_player_id).length, stickers.length)}` +
			`  patches ${stickers.filter(s => s.is_patch).length}`,
	)
}

const compare = async (data: GameData) => {
	console.log('\n=== Diff against the community lists (upstream is UNMAINTAINED; extra rows are the point)')
	for (const name of GAMEDATA_FILES) {
		const url = UPSTREAM[name]
		const res = await fetch(url)
		if (!res.ok) {
			console.warn(`    ! ${name}: upstream fetch failed (HTTP ${res.status})`)
			continue
		}
		const upstream = (await res.json()) as Record<string, unknown>[]
		const rows = data[name] as Record<string, unknown>[]
		const key = IDENTITY[name] ?? ((r: Record<string, unknown>) => String(r.id))
		const ours = new Set(rows.map(key))
		const theirs = new Set(upstream.map(key))
		const onlyUp = [...theirs].filter(k => !ours.has(k))
		const onlyOurs = [...ours].filter(k => !theirs.has(k))
		const upFields = new Set(upstream.flatMap(r => Object.keys(r)))
		const ourFields = new Set(rows.flatMap(r => Object.keys(r)))
		const missingFields = [...upFields].filter(f => !ourFields.has(f))
		const field = LABEL[name] ?? 'name'
		const nameMismatch = upstream.filter(u => {
			const mine = rows.find(r => key(r) === key(u))
			return mine && mine[field] !== u[field]
		}).length
		console.log(
			`    ${name.padEnd(13)} ours ${String(rows.length).padStart(6)}  upstream ${String(upstream.length).padStart(6)}` +
				`   only-upstream ${String(onlyUp.length).padStart(5)}   only-ours ${String(onlyOurs.length).padStart(5)}` +
				`   name-mismatch ${String(nameMismatch).padStart(5)}`,
		)
		if (missingFields.length) console.log(`      ! MISSING FIELDS upstream has: ${missingFields.join(', ')}`)
		if (onlyUp.length) console.log(`      ! only upstream (a real gap): ${onlyUp.slice(0, 12).join(', ')}`)
	}
}

/**
 * Re-emit `data/items_game.json` from the exported `.txt`. Kept as a file because three other things
 * read it — `export.ts`'s manifest step, `dump-attachments.ts`, and any `--out` run of this script
 * against an export whose `scripts` job predates this change.
 */
export const writeItemsGameJson = (outDir: string) => {
	const txt = itemsGameTxtPath(outDir)
	if (!existsSync(txt)) throw new UserError(`${txt} is missing — export the "scripts" job first`)
	const dest = join(outDir, 'data', 'items_game.json')
	writeFileSync(dest, JSON.stringify(parseKeyValues(readFileSync(txt, 'utf8'))))
	return dest
}

const main = async () => {
	const outDir = value('out', 'CS2_EXPORT_OUT') ?? join(import.meta.dir, 'out')
	const explicitOrigin = value('icon-origin', 'SKINS_CDN_ORIGIN')
	const iconOrigin = explicitOrigin ?? DEFAULT_ICON_ORIGIN
	console.log(`=== Generating game data\n    out    ${outDir}\n    icons  ${iconOrigin}`)
	// Loud, because the result is not: every `image` URL in the generated lists is built on this
	// host, and a placeholder one resolves rather than 404s.
	if (!explicitOrigin)
		console.warn(
			`    ! ${iconOrigin} is a PLACEHOLDER and will be baked into every image URL.\n` +
				'      Pass --icon-origin <url> or set SKINS_CDN_ORIGIN to your own origin.',
		)

	const data = generateGameData({ out: outDir, iconOrigin })
	report(data)

	if (flag('dry-run')) console.log('\n=== --dry-run: nothing written')
	else {
		console.log('\n=== Writing')
		const itemsGame = writeItemsGameJson(outDir)
		console.log(`    data/items_game.json  (${(Bun.file(itemsGame).size / 1024 / 1024).toFixed(1)} MB)`)
		for (const name of GAMEDATA_FILES) {
			const dest = join(outDir, 'data', `${name}.json`)
			writeFileSync(dest, `${JSON.stringify(data[name], null, '\t')}\n`)
			console.log(`    data/${name}.json  (${(Bun.file(dest).size / 1024).toFixed(0)} KB)`)
		}
	}

	if (flag('compare')) await compare(data)

	// Last, so it is the final thing on screen, and non-zero so CI cannot ignore it.
	if (data.problems.length) {
		console.error(`\nx ${data.problems.length} problem(s) — the data changed under us:`)
		for (const problem of data.problems) console.error(`    ${problem}`)
		process.exit(1)
	}
}

if (import.meta.main) {
	try {
		await main()
	} catch (error) {
		if (error instanceof UserError) {
			console.error(`\nx ${error.message}`)
			process.exit(1)
		}
		throw error
	}
}
