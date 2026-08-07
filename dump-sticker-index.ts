/**
 * Builds the sticker index a viewer renders from.
 *
 * The chain the game uses, and therefore the chain this walks:
 *
 *   items_game.sticker_kits[<sticker_id>].sticker_material     e.g. "antwerp2022/astr_holo"
 *     -> out/stickermats/stickers/<sticker_material>.vmat      the decompiled csgo_weapon_sticker.vfx material
 *       -> "Compiled Textures" { g_tSticker0 = "...vtex", ... }
 *         -> out/stickertex/... | out/defaults/...             the PNG the browser actually fetches
 *
 * `sticker_id` is the SAME id space the WeaponPaints plugin stores and the inspect protobuf carries,
 * so the index is keyed by it directly and needs no name matching.
 *
 * OUTPUT SHAPE. 11,789 kits x ten texture paths would be ~4 MB of repeated strings, and only ~15
 * distinct textures are shared by nearly every plain sticker. So the file is a string table plus one
 * fixed-length numeric row per kit — about 8x smaller, and the reader is three lines.
 *
 * Nothing in it is a Valve TEXTURE — it is only a listing of paths — so a consumer is free to serve
 * it from its own origin rather than the CDN, and re-generating it costs no re-upload. It is written
 * to `<out>/data/sticker-index.json` beside the other generated lists; copy it from there.
 *
 *   bun run dump-sticker-index.ts
 *   bun run dump-sticker-index.ts --out ./out-sample
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { UserError, generatedDataDir } from './platform'

const args = process.argv.slice(2)
const value = (name: string, env?: string) => {
	const i = args.indexOf(`--${name}`)
	if (i >= 0) {
		const next = args[i + 1]
		if (!next || next.startsWith('--')) throw new Error(`--${name} needs a value`)
		return next
	}
	return env ? process.env[env] : undefined
}

const HERE = import.meta.dir
const OUT = resolve(value('out', 'CS2_EXPORT_OUT') ?? join(HERE, 'out'))

/* ------------------------------------------------------------------------------------------------
 * Valve KeyValues — the .vmat VRF writes is flat quoted pairs plus one nested block, so this needs
 * only the two forms it actually emits rather than a general KV parser.
 * --------------------------------------------------------------------------------------------- */

type Kv = Record<string, string | Record<string, string>>

const parseVmat = (text: string): Kv => {
	const root: Kv = {}
	let block: Record<string, string> | null = null
	for (const raw of text.split('\n')) {
		const line = raw.trim()
		if (!line || line.startsWith('//')) continue
		if (line === '}') {
			block = null
			continue
		}
		const pair = line.match(/^"([^"]+)"\s+"(.*)"$/)
		if (pair) {
			const [, key, value] = pair
			if (block) block[key] = value
			else root[key] = value
			continue
		}
		// A bare quoted name on its own line opens a block; the `{` is on the next line.
		const open = line.match(/^"([^"]+)"$/)
		if (open && open[1] !== 'Layer0') {
			block = {}
			root[open[1]] = block
		}
	}
	return root
}

const num = (kv: Kv, key: string, fallback: number) => {
	const value = kv[key]
	if (typeof value !== 'string') return fallback
	const parsed = Number.parseFloat(value)
	return Number.isFinite(parsed) ? parsed : fallback
}

const bool = (kv: Kv, key: string, fallback = false) => {
	const value = kv[key]
	if (typeof value !== 'string') return fallback
	return value.trim() !== '0'
}

/** `"[1.000000 0.862745 0.500000 0.000000]"` -> `[1, 0.862745, 0.5]`. */
const vec = (kv: Kv, key: string, fallback: number[]) => {
	const value = kv[key]
	if (typeof value !== 'string') return fallback
	const parts = value.replace(/[[\]]/g, '').trim().split(/\s+/).map(Number)
	return parts.every(Number.isFinite) && parts.length >= fallback.length ? parts.slice(0, fallback.length) : fallback
}

/**
 * A `Compiled Textures` entry is an in-VPK `.vtex` path. The exporter writes `stickers/...` under
 * `stickertex/` and everything under `materials/` under `defaults/`, keeping the rest of the path
 * and swapping the extension — so the export-root-relative URL is a pure rewrite, with no lookup.
 */
const vtexToExportPath = (vtex: string): string | null => {
	if (!vtex) return null
	const png = vtex.replace(/\.vtex$/i, '.png')
	if (png.startsWith('materials/')) return `defaults/${png}`
	if (png.startsWith('stickers/') || png.startsWith('items/')) return `stickertex/${png}`
	// Anything else is a path shape the exporter has not been taught; surfacing it is better than
	// silently binding a 404.
	return null
}

/* ------------------------------------------------------------------------------------------------
 * The index
 * --------------------------------------------------------------------------------------------- */

/** Texture slots, in the order the row stores them. */
export const STICKER_TEXTURE_SLOTS = [
	'g_tSticker0',
	'g_tNormalRoughnessSticker0',
	'g_tSfxMaskSticker0',
	'g_tHoloSpectrumSticker0',
	'g_tGlitterNormalSticker0',
	'g_tStickerScratches',
] as const

/**
 * One kit, as stored: six texture-table indices (-1 = unbound) then the parameters, in this order.
 * Kept as a flat array so the JSON is compact — the consumer that reads it names the columns, and
 * `STICKER_TEXTURE_SLOTS` above is the column order it has to agree with.
 */
export type StickerRow = number[]

export type StickerIndexFile = {
	/** Every distinct texture path, export-root-relative. */
	textures: string[]
	/** `sticker_id` -> row. */
	kits: Record<string, StickerRow>
	/** For diagnostics only. */
	generated: string
	kitCount: number
}

const build = () => {
	const itemsGame = JSON.parse(readFileSync(join(OUT, 'data', 'items_game.json'), 'utf8'))
	const kits: Record<string, { name?: string; sticker_material?: string }> =
		itemsGame?.items_game?.sticker_kits ?? itemsGame?.sticker_kits ?? {}
	const ids = Object.keys(kits)
	if (!ids.length) throw new Error('items_game.json has no sticker_kits')

	const textures: string[] = []
	const textureIndex = new Map<string, number>()
	const intern = (path: string | null) => {
		if (!path) return -1
		const existing = textureIndex.get(path)
		if (existing !== undefined) return existing
		const next = textures.length
		textures.push(path)
		textureIndex.set(path, next)
		return next
	}

	const rows: Record<string, StickerRow> = {}
	const missingVmat: string[] = []
	const missingTexture = new Set<string>()

	for (const id of ids) {
		const material = kits[id]?.sticker_material
		if (!material) continue
		const vmatPath = join(OUT, 'stickermats', 'stickers', `${material}.vmat`)
		if (!existsSync(vmatPath)) {
			missingVmat.push(`${id} ${material}`)
			continue
		}
		const kv = parseVmat(readFileSync(vmatPath, 'utf8'))
		const compiled = (kv['Compiled Textures'] as Record<string, string>) ?? {}

		// A path the exporter never fetched is DROPPED rather than recorded: binding it would 404 at
		// render time, where the failure is invisible. Two stickers reference a
		// `materials/stickers/glitter_pattern/` tree no export job covers; they fall back to the shared
		// glitter normal, which every plain sticker uses anyway.
		const slots = STICKER_TEXTURE_SLOTS.map(slot => {
			const path = vtexToExportPath(compiled[slot] ?? '')
			if (path && !existsSync(join(OUT, path))) {
				missingTexture.add(path)
				return -1
			}
			return intern(path)
		})

		const tint = vec(kv, 'g_vColorTintSticker0', [1, 1, 1])
		const wearBias = vec(kv, 'g_vWearBiasSticker0', [1, 1])

		rows[id] = [
			...slots,
			// flags
			bool(kv, 'g_bHolographicSticker0') ? 1 : 0,
			bool(kv, 'g_bGlitterSticker0') ? 1 : 0,
			bool(kv, 'g_bMetallicSticker0') ? 1 : 0,
			bool(kv, 'g_bPaperBackingSticker0') ? 1 : 0,
			bool(kv, 'g_bSelfIllumSticker0') ? 1 : 0,
			bool(kv, 'g_bPreserveRoughnessSticker0') ? 1 : 0,
			bool(kv, 'g_bAutomaticPBRColorFittingSticker0', true) ? 1 : 0,
			bool(kv, 'g_bLegacyTintMultiplySticker0') ? 1 : 0,
			bool(kv, 'g_bClampSpectrumVSticker0', true) ? 1 : 0,
			// scalars
			num(kv, 'g_flColorBoostSticker0', 1),
			num(kv, 'g_flSfxColorBoostSticker0', 1),
			num(kv, 'g_flGlitterScaleSticker0', 1),
			num(kv, 'g_fWearScratchesSticker0', 1),
			wearBias[0],
			wearBias[1],
			// `Expression(1-this)`: the SHADER receives 1 - authored, so the conversion happens here
			// rather than in the renderer, where it would be one more thing to remember.
			1 - num(kv, 'g_flTintSaturateSticker0', 1),
			// `Expression(SrgbGammaToLinear(this))`: tints arrive linearised.
			srgbToLinear(tint[0]),
			srgbToLinear(tint[1]),
			srgbToLinear(tint[2]),
		]
	}

	return { rows, textures, missingVmat, missingTexture: [...missingTexture], kitIds: ids }
}

/** Valve's `SrgbGammaToLinear`, i.e. the sRGB EOTF. */
const srgbToLinear = (value: number) =>
	Math.round((value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * 1e6) / 1e6

const main = () => {
	// Before `build()` walks 11,789 kits through the material tree, so a bad `--out` is a one-line
	// error rather than a wasted pass.
	const dataDir = generatedDataDir(OUT)
	const { rows, textures, missingVmat, missingTexture, kitIds } = build()
	const file: StickerIndexFile = {
		textures,
		kits: rows,
		generated: new Date().toISOString(),
		kitCount: Object.keys(rows).length,
	}
	const target = join(dataDir, 'sticker-index.json')
	writeFileSync(target, JSON.stringify(file))
	const bytes = readFileSync(target).length

	console.log(`sticker_kits          : ${kitIds.length}`)
	console.log(`resolved              : ${file.kitCount}`)
	console.log(`distinct textures     : ${textures.length}`)
	console.log(`missing .vmat         : ${missingVmat.length}`)
	console.log(`missing texture files : ${missingTexture.length}`)
	for (const entry of missingVmat.slice(0, 10)) console.log(`   no vmat: ${entry}`)
	for (const entry of missingTexture.slice(0, 10)) console.log(`   no file: ${entry}`)
	console.log(`wrote ${target} (${(bytes / 1024).toFixed(0)} KB)`)
}

// One line for anything the operator can fix, a stack trace for anything they cannot — the same
// contract `export.ts` and `publish.ts` hold. A wrong `--out` is not a crash.
try {
	main()
} catch (err) {
	if (err instanceof UserError) {
		console.error(`\nerror: ${(err as Error).message}`)
		process.exit(1)
	}
	throw err
}
