#!/usr/bin/env bun
/**
 * Generates the viewer's two keychain tables from CS2's own data.
 *
 *   bun run tools/cs2-export/dump-attachments.ts
 *   bun run tools/cs2-export/dump-attachments.ts --only attachments   # leave the keychain table alone
 *
 * Neither table can come out of `export.ts`, because neither survives the asset export:
 *
 *  1. **The keychain ANCHOR.** Every gun's `.vmdl` carries an `AttachmentList` with a `keychain` and
 *     a `keychain_legacy` entry — the exact point the game hangs a charm from, one per mesh variant.
 *     VRF's glTF exporter drops attachments entirely (the shipped GLBs have no `extras`, no skins and
 *     two mesh nodes), so the only way to get them is to decompile `weapons/models/**.vmdl_c` and
 *     read them out. `stattrak`/`stattrak_legacy` sit in the same list and are emitted too — A4 needs
 *     them and they cost nothing here.
 *
 *  2. **The keychain MODEL per id.** `items_game`'s `keychain_definitions` maps a keychain id to a
 *     `pedestal_display_model` vmdl path, which is the GLB the `keychains` export job wrote. The
 *     tournament "highlight reel" charms carry no model of their own and inherit one through `base`.
 *
 * Both outputs are committed source, in the same spirit as `weaponModels.ts`: small, reviewable,
 * and resolvable with no extra runtime fetch. Re-run this when Valve ships new charms or retools a
 * weapon.
 *
 * Requires a local CS2 install and the Source2Viewer CLI that `export.ts` builds — same locations,
 * same overrides (`--cs2` / `CS2_PATH`, `--cli` / `SOURCE2VIEWER_CLI`).
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { cliPath, findCs2Pak, relSlash, requireCli, stemOf } from './platform'

const args = process.argv.slice(2)
const value = (name: string, env?: string) => {
	const i = args.indexOf(`--${name}`)
	if (i >= 0 && args[i + 1] && !args[i + 1].startsWith('--')) return args[i + 1]
	return env ? process.env[env] : undefined
}

/**
 * `--only attachments` / `--only keychains` — WHICH of the two tables this run is allowed to write.
 *
 * It writes two generated files with two different input trees, and the keychain one needs an
 * `out/keychaintex` complete enough to resolve every charm's four texture slots. A run made to
 * refresh the ATTACHMENTS table on a partial export therefore rewrites the keychain table too, from
 * inputs it does not have, and silently drops override slots it could not resolve — measured:
 * −412/+170 lines, every `normal`/`metalness`/`ao` gone. Nothing failed and nothing warned, which is
 * the same shape of quiet miss `publish.ts` exists for.
 *
 * Default is still both, so an operator with a full export is unaffected; `--only attachments` is
 * what a targeted change (a new attachment name) should use.
 */
const ONLY =
	value('only')
		?.split(',')
		.map(s => s.trim()) ?? null
const writes = (table: 'attachments' | 'keychains') => !ONLY || ONLY.includes(table)

const HERE = import.meta.dir
const REPO = resolve(HERE, '../..')
const VIEWER = join(REPO, 'apps/web-app/app/profile/[userId]/skins/[UI]/Skin/Modal/SkinPreview')
const OUT = resolve(value('out', 'CS2_EXPORT_OUT') ?? join(HERE, 'out'))
const CLI = cliPath(value('cli', 'SOURCE2VIEWER_CLI'))

const cs2Pak = () => findCs2Pak(value('cs2', 'CS2_PATH'))

const walk = (dir: string, ext: string, out: string[] = []) => {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) walk(path, ext, out)
		else if (entry.endsWith(ext)) out.push(path)
	}
	return out
}

// ---------------------------------------------------------------------------------------------
// 1. Attachments, out of the decompiled .vmdl
// ---------------------------------------------------------------------------------------------

/**
 * `_class = "Attachment"` blocks. Every one in CS2's weapon models is written by the decompiler in
 * this exact field order, so a targeted regex beats pulling in a KV3 parser for four fields.
 */
const ATTACHMENT_RE =
	/_class = "Attachment"\s*\n\s*name = "([^"]+)"\s*\n\s*ignore_rotation = (\w+)\s*\n\s*parent_bone = "([^"]*)"\s*\n\s*relative_origin = \[ ([^\]]*) \]\s*\n\s*relative_angles = \[ ([^\]]*) \]/g
/** `_class = "Bone"` blocks. The capture on the indent is what reconstructs the parent chain. */
const BONE_RE =
	/_class = "Bone"\s*\n(\s*)name = "([^"]+)"\s*\n\s*origin = \[ ([^\]]*) \]\s*\n\s*angles = \[ ([^\]]*) \]/g

const WANTED = new Set([
	'keychain',
	'keychain_legacy',
	'stattrak',
	'stattrak_legacy',
	// The nametag dataplate hangs off the SAME list, authored per mesh variant exactly as the other
	// two are — so it costs nothing here and there is nowhere else to get it: VRF's glTF exporter
	// drops `AttachmentList` wholesale, which is the whole reason this file exists.
	'nametag',
	'nametag_legacy',
])

type Attachment = { origin: [number, number, number]; angles: [number, number, number] }

const parseVmdl = (text: string) => {
	const bones = [...text.matchAll(BONE_RE)].map(m => ({
		name: m[2],
		indent: m[1].length,
		origin: m[3].split(',').map(Number),
		angles: m[4].split(',').map(Number),
	}))
	const parentOf = (i: number) => {
		for (let j = i - 1; j >= 0; j--) if (bones[j].indent < bones[i].indent) return j
		return -1
	}
	/**
	 * The bone's rest position in MODEL space. Every weapon's chain from `weapon_offset` up to the
	 * root is pure translation (the only non-zero rest angle in the whole weapon tree is the Shadow
	 * Daggers' `weapon_r`, which is not an attachment parent), so summing the origins is exact —
	 * asserted below rather than assumed.
	 */
	const modelSpace = (boneName: string) => {
		let i = bones.findIndex(b => b.name === boneName)
		if (i < 0) return null
		const out: [number, number, number] = [0, 0, 0]
		let rotated = false
		for (; i >= 0; i = parentOf(i)) {
			out[0] += bones[i].origin[0]
			out[1] += bones[i].origin[1]
			out[2] += bones[i].origin[2]
			if (bones[i].angles.some(a => Math.abs(a) > 1e-3)) rotated = true
		}
		return { origin: out, rotated }
	}

	const found: Record<string, Attachment> = {}
	const rotatedParents: string[] = []
	for (const m of text.matchAll(ATTACHMENT_RE)) {
		const name = m[1]
		if (!WANTED.has(name)) continue
		const base = modelSpace(m[3])
		if (!base) continue
		if (base.rotated) rotatedParents.push(`${name} (parent ${m[3]})`)
		const rel = m[4].split(',').map(Number)
		const ang = m[5].split(',').map(Number)
		found[name] = {
			origin: [base.origin[0] + rel[0], base.origin[1] + rel[1], base.origin[2] + rel[2]],
			angles: [ang[0] ?? 0, ang[1] ?? 0, ang[2] ?? 0],
		}
	}
	return { found, rotatedParents, modelSpace }
}

// ---------------------------------------------------------------------------------------------
// 1b. The charm's legal REGION, out of the RAW .vmdl_c
// ---------------------------------------------------------------------------------------------

/**
 * `KeychainMarkup` — where the game will let a charm sit.
 *
 * It is a list of planar QUADS (`Corners`, four points of three floats) tiling the weapon's surface,
 * each attached to a named bone and flagged for one mesh variant. VRF's reconstructed `.vmdl` drops
 * the block, exactly as it drops `AttachmentList` and `StickerMarkup`, so this reads the RAW
 * `.vmdl_c` DATA block.
 *
 * `Corners` ARE ALREADY MODEL SPACE — unlike `Attachment.relative_origin`, which is relative to
 * `parent_bone` and does need the rest chain composed onto it. The first version of this composed the
 * chain onto the corners as well, and that is a displacement of the whole region by the bone's rest
 * origin: on the AK by (2.97, −0.19, 2.98) inches, which lifted 13 of its 54 quads clear off the top
 * of the gun. MEASURED, over all 8632 corners of all 36 weapons, as the fraction that land inside
 * that weapon's own exported mesh bounding box (+0.75" slack):
 *
 *     corners composed with the bone chain   38.5%      (M4A4 0%, SCAR-20 0%, C4 4%, tec9 4%)
 *     corners read as authored              100.0%      every weapon, every corner
 *
 * `BoneName` therefore says which bone the patch FOLLOWS when the model animates, not what frame it
 * is written in. The lookup below is kept only to skip a patch on a bone this model does not have.
 *
 * Emitted BOTH as the bounding box of those quads and as the quads themselves, per mesh variant, in
 * Source model space.
 *
 * THE BOX ALONE WAS NOT A REGION. That is what the first version of this shipped, on the argument
 * that six numbers beat ~2100 quads of payload — and it is the identical mistake the sticker clamp
 * made against `StickerMarkup.Polygons`, where the AK's real region turned out to fill 25.7% of its
 * own box. Measured the same way here (see the `fill` column this prints), the charm quads fill a
 * few percent of their box on most guns: the box spans the whole weapon while the quads are a thin
 * strip along one flank. So the box let a dragged charm sit in a volume many times the legal one,
 * which is exactly the "I can still move the keychain to placements it shouldn't be" report.
 *
 * Each quad is emitted as ORIGIN + TWO EDGE VECTORS (9 numbers) rather than four corners (12),
 * rounded to 1e-3 inch, which is what the clamp wants (it needs a plane and two in-plane axes, not
 * four points).
 *
 * THAT USED TO CLAIM TO BE LOSSLESS — "the quads are planar parallelograms by construction" — AND IT
 * IS NOT. The claim is retracted and the error is now MEASURED and printed instead: `skew` below is
 * `|c3 - (c1 + c2 - c0)|` over the quad's own size, and it reaches tens of percent on real weapons
 * even with the corners read correctly. So a charm may still be clamped a little outside the
 * authored patch, bounded by that number, and the honest payload if that ever matters is all four
 * corners or the two triangles. What the claim was hiding was worse and is fixed: the second edge
 * was read off corner 3, which is the DIAGONAL, and that error was 200% of the quad rather than
 * tens of percent — see `parseKeychainMarkup`.
 */
const KEYCHAIN_MARKUP_BONE = /BoneName = "([^"]+)"/
const KEYCHAIN_MARKUP_LEGACY = /LegacyModel = true/
const KEYCHAIN_MARKUP_CORNERS = /Corners\s*=\s*\[([^\]]*)\]/

type Box = [number, number, number, number, number, number]

const kv3Block = (text: string, key: string) => {
	const start = text.indexOf(`${key} =`)
	if (start < 0) return null
	const open = text.indexOf('[', start)
	if (open < 0) return null
	let depth = 0
	for (let i = open; i < text.length; i++) {
		if (text[i] === '[') depth++
		else if (text[i] === ']' && --depth === 0) return text.slice(open + 1, i)
	}
	return null
}

const kv3Entries = (body: string) => {
	const out: string[] = []
	let braces = 0
	let start = -1
	for (let i = 0; i < body.length; i++) {
		if (body[i] === '{') {
			if (braces === 0) start = i + 1
			braces++
		} else if (body[i] === '}') {
			braces--
			if (braces === 0 && start >= 0) {
				out.push(body.slice(start, i))
				start = -1
			}
		}
	}
	return out
}

/** One quad as the clamp wants it: a corner and the two edges leaving it. */
type Patch = { origin: number[]; edgeU: number[]; edgeV: number[] }

const parseKeychainMarkup = (text: string, modelSpace: (bone: string) => { origin: number[] } | null) => {
	const empty = {
		hd: null as Box | null,
		legacy: null as Box | null,
		hdPatches: [] as Patch[],
		legacyPatches: [] as Patch[],
		quads: 0,
		missingBones: [] as string[],
		worstSkew: 0,
	}
	const body = kv3Block(text, 'KeychainMarkup')
	if (!body) return empty
	const boxes: { hd: Box | null; legacy: Box | null } = { hd: null, legacy: null }
	const patches: { hd: Patch[]; legacy: Patch[] } = { hd: [], legacy: [] }
	const missingBones: string[] = []
	let quads = 0
	/** Worst `|c3 - (c1 + c2 - c0)|` over this model's quads, as a fraction of the quad's own size. */
	let worstSkew = 0
	for (const entry of kv3Entries(body)) {
		const corners = entry.match(KEYCHAIN_MARKUP_CORNERS)?.[1]
		if (!corners) continue
		const bone = entry.match(KEYCHAIN_MARKUP_BONE)?.[1] ?? ''
		const base = modelSpace(bone)
		if (!base) {
			if (!missingBones.includes(bone)) missingBones.push(bone)
			continue
		}
		const values = corners
			.split(',')
			.map(v => Number.parseFloat(v.trim()))
			.filter(Number.isFinite)
		const legacy = KEYCHAIN_MARKUP_LEGACY.test(entry)
		const key = legacy ? 'legacy' : 'hd'
		quads++
		const points: number[][] = []
		for (let i = 0; i + 2 < values.length; i += 3) {
			// As authored: see the block comment — composing `base.origin` here is what displaced the
			// whole region off the weapon.
			const point = [values[i], values[i + 1], values[i + 2]]
			points.push(point)
			const box = boxes[key]
			boxes[key] = box
				? ([
						Math.min(box[0], point[0]),
						Math.min(box[1], point[1]),
						Math.min(box[2], point[2]),
						Math.max(box[3], point[0]),
						Math.max(box[4], point[1]),
						Math.max(box[5], point[2]),
					] as Box)
				: ([point[0], point[1], point[2], point[0], point[1], point[2]] as Box)
		}
		/*
		 * `Corners` IS A 2x2 GRID, NOT A RING — corner 0 is (0,0), corner 1 is (1,0), corner 2 is (0,1)
		 * and corner 3 is the one DIAGONALLY OPPOSITE corner 0. So the two edges leaving corner 0 are
		 * corner 1 and CORNER 2, and corner 3 is the corner this payload reconstructs.
		 *
		 * IT USED TO READ `points[3]` HERE, on a comment that called `Corners` a ring, and that one
		 * index is a user-visible defect: reading the DIAGONAL as an edge shears every quad into a
		 * parallelogram reaching one full edge length past the surface Valve authored. MEASURED against
		 * the raw corners of all 154 quads on the SCAR-20 and the AK-47, closing the quad the two ways:
		 *
		 *     read as a RING   closes better on   2 of 154 quads, worst residual 202.4% of the quad
		 *     read as a GRID   closes better on 152 of 154 quads, worst residual  96.2%
		 *
		 * and over ALL 55 weapons, 2158 quads: RING better on 43 (2.0%), GRID better on 2115 (98.0%).
		 *
		 * A residual of 200% of a patch's own size is exactly what mistaking a diagonal for an edge
		 * looks like. Downstream, `clampKeychainOffset` then parked a dragged charm faithfully on the
		 * fabricated half: on the SCAR-20 that is 2.6 inches past the end of the top-rail patch and
		 * 5.1 inches past the end of the stock patch, and the charm hangs in open air touching nothing.
		 * 380 of the 2141 shipped quads across all 69 weapon+variant pairs put their reconstructed
		 * corner OUTSIDE the box of the four corners Valve actually wrote, which is the same defect
		 * visible without a game install at all.
		 *
		 * A degenerate quad (a repeated corner) carries no surface and is dropped rather than shipped as
		 * a zero-area patch the clamp would have to special-case.
		 */
		if (points.length < 4) continue
		const edgeU = [0, 1, 2].map(a => points[1][a] - points[0][a])
		const edgeV = [0, 1, 2].map(a => points[2][a] - points[0][a])
		// How far the reconstructed corner misses the authored one, as a fraction of the quad's own
		// size. Reported per weapon below: `origin + two edges` is LOSSY even read correctly, because
		// the authored quads are not exact parallelograms, and that has to be visible rather than
		// claimed away — see the block comment at the top of this section.
		const skew =
			Math.hypot(...[0, 1, 2].map(a => points[0][a] + edgeU[a] + edgeV[a] - points[3][a])) /
			Math.max(1e-6, Math.hypot(...edgeU), Math.hypot(...edgeV))
		worstSkew = Math.max(worstSkew, skew)
		const lengthU = Math.hypot(...edgeU)
		const lengthV = Math.hypot(...edgeV)
		if (lengthU < 1e-4 || lengthV < 1e-4) continue
		patches[key].push({ origin: points[0], edgeU, edgeV })
	}
	return { ...boxes, hdPatches: patches.hd, legacyPatches: patches.legacy, quads, missingBones, worstSkew }
}

/** Sum of quad areas over the largest cross-section of the box — the "is the box a lie" number. */
const patchFill = (patches: Patch[], box: Box | null) => {
	if (!box || !patches.length) return null
	const area = patches.reduce((sum, p) => {
		const cross = [
			p.edgeU[1] * p.edgeV[2] - p.edgeU[2] * p.edgeV[1],
			p.edgeU[2] * p.edgeV[0] - p.edgeU[0] * p.edgeV[2],
			p.edgeU[0] * p.edgeV[1] - p.edgeU[1] * p.edgeV[0],
		]
		return sum + Math.hypot(...cross)
	}, 0)
	const size = [box[3] - box[0], box[4] - box[1], box[5] - box[2]]
	const faces = [size[0] * size[1], size[0] * size[2], size[1] * size[2]]
	const face = Math.max(...faces)
	return face > 0 ? area / face : null
}

// ---------------------------------------------------------------------------------------------
// 2. Keychain id -> GLB, out of items_game
// ---------------------------------------------------------------------------------------------

const keychainModels = () => {
	const itemsGame = join(OUT, 'data', 'items_game.json')
	if (!existsSync(itemsGame)) throw new Error(`No ${itemsGame} — run \`bun run export.ts\` first.`)
	const definitions = JSON.parse(readFileSync(itemsGame, 'utf8')).items_game.keychain_definitions as Record<
		string,
		{ name: string; base?: string; pedestal_display_model?: string }
	>
	const byName = new Map(Object.values(definitions).map(d => [d.name, d]))
	// The 61 tournament highlight-reel charms carry no model and point at their capsule's base charm
	// through `base`; the chain is one deep today, and the depth cap only stops a malformed cycle.
	const model = (definition: { base?: string; pedestal_display_model?: string }, depth = 0): string | null => {
		if (definition.pedestal_display_model) return definition.pedestal_display_model
		const base = definition.base ? byName.get(definition.base) : undefined
		return base && depth < 8 ? model(base, depth + 1) : null
	}

	const rows: [id: number, name: string, path: string][] = []
	const unresolved: string[] = []
	for (const [id, definition] of Object.entries(definitions)) {
		const vmdl = model(definition)
		if (!vmdl) {
			unresolved.push(`${id} ${definition.name}`)
			continue
		}
		// The `keychains` export job wrote this tree verbatim under out/keychains/, as GLB.
		rows.push([Number(id), definition.name, `keychains/${vmdl.replace(/\.vmdl$/, '.glb')}`])
	}
	rows.sort((a, b) => a[0] - b[0])
	return { rows, unresolved, definitions }
}

/**
 * `keychain_material` — the per-id material that is NOT on the charm's model.
 *
 * 23 ids (38..60, the Missing Link Community 01 capsule) share one workshop-blank `.vmdl` and carry
 * their whole appearance here instead. Rendering the blank's own material for all 23 is what "this
 * keychain has no colour" is: the blank's `g_tColor` is a featureless near-black, so every one of
 * them comes out an unlit dark lump, and blue once the viewer's selection tint lands on it.
 *
 * The `.vmat` is `csgo_weapon.vfx` exactly like the blank's own, so the fix is a straight texture
 * swap — no new shader path. Only the four slots three's PBR material can carry are emitted;
 * `g_tTintMask`, `g_tDetail` and the glitter maps have no binding in the viewer today and shipping
 * dead URLs would only cost a fetch.
 */
type MaterialOverride = { color: string; normal: string | null; metalness: string | null; ao: string | null }

const keychainMaterialOverrides = (definitions: Record<string, { name: string; keychain_material?: string }>) => {
	const rows: [id: number, name: string, override: MaterialOverride][] = []
	const missing: string[] = []
	// The `keychaintex` job writes `items/assets/...` verbatim under out/keychaintex/, so the compiled
	// name in the .vmat maps to the exported PNG by swapping the extension.
	const texturePath = (compiled: string | undefined) =>
		compiled?.startsWith('items/assets/keychains/') ? `keychaintex/${compiled.replace(/\.vtex$/, '.png')}` : null
	for (const [id, definition] of Object.entries(definitions)) {
		if (!definition.keychain_material) continue
		const vmat = join(OUT, 'keychainmats', definition.keychain_material)
		if (!existsSync(vmat)) {
			missing.push(`${id} ${definition.name} (${definition.keychain_material})`)
			continue
		}
		const text = readFileSync(vmat, 'utf8')
		const block = text.slice(text.indexOf('"Compiled Textures"'))
		const slot = (name: string) => block.match(new RegExp(`"${name}"\\s+"([^"]+)"`))?.[1]
		const color = texturePath(slot('g_tColor'))
		if (!color) {
			missing.push(`${id} ${definition.name} (no g_tColor under items/assets/keychains/)`)
			continue
		}
		rows.push([
			Number(id),
			definition.name,
			{
				color,
				normal: texturePath(slot('g_tNormal')),
				metalness: texturePath(slot('g_tMetalness')),
				ao: texturePath(slot('g_tAmbientOcclusion')),
			},
		])
	}
	rows.sort((a, b) => a[0] - b[0])
	return { rows, missing }
}

/**
 * THE SEED IS A COLOUR, and this is where that comes out of the game rather than out of a guess.
 *
 * `keychainMaterialOverrides` above reads only the `"Compiled Textures"` block of a charm's `.vmat`
 * and stops. Directly below it in every one of those files sits a `DynamicParams` block, and that is
 * where the charm's template lives: CS2 registers the stored seed as the material-expression variable
 * `$KeychainSeed`, and each charm's own material turns it into `g_fHueShift` / `g_fSaturation` /
 * `g_fBrightness` / `g_fContrast`. `$KeychainSeed` appears 142 times across 81 `.vmat`s and is the
 * most-used dynamic variable in the shipped game; nothing else about a charm varies with the seed —
 * all 62 charm `.vmdl`s contain zero `MaterialGroup` nodes, so it selects no asset.
 *
 * Every charm is covered, not only the 23 with a `keychain_material`: the other 120 get their body
 * material from the `.vmdl`, whose stem is the `.vmat`'s, so the two join on the file name.
 *
 * THE EXPRESSIONS SHIP VERBATIM. They are evaluated at render time by `keychainSeedAdjust`, because
 * two of them (`frac($KeychainSeed*5)`, and the Banana's `($KeychainSeed<=.5)` step) are
 * discontinuous, and any sampled table would smear exactly the boundary the artist authored.
 */
const KEYCHAIN_SEED_PARAMS: Record<string, string> = {
	g_fHueShift: 'hue',
	g_fSaturation: 'saturation',
	g_fBrightness: 'brightness',
	g_fContrast: 'contrast',
}

type KeychainDefinitions = Record<
	string,
	{ name: string; base?: string; keychain_material?: string; pedestal_display_model?: string }
>

/**
 * id -> the `.vmat` that paints it. The 23 ids with a `keychain_material` name theirs outright; the
 * rest take their body material from the `.vmdl`, whose stem is the `.vmat`'s; the highlight-reel
 * charms declare nothing and resolve through `base`.
 */
const keychainMaterialFiles = (definitions: KeychainDefinitions) => {
	const root = join(OUT, 'keychainmats')
	const byStem = new Map<string, string>()
	// `stemOf` and not `split('/').pop()`: `walk` builds these with `join()`, which emits `\` on
	// Windows, where splitting on `/` returns the WHOLE PATH — the map would be keyed by absolute
	// paths and not one of the two lookups below could ever hit. The lookup KEYS are in-VPK paths
	// out of items_game and are always forward-slashed; `stemOf` handles both.
	if (existsSync(root)) for (const file of walk(root, '.vmat')) byStem.set(stemOf(file, '.vmat'), file)
	const byName = new Map(Object.entries(definitions).map(([id, d]) => [d.name, id]))
	const materialOf = (id: string, depth = 0): string | null => {
		const definition = definitions[id]
		if (!definition || depth > 4) return null
		if (definition.keychain_material) {
			const direct = join(root, definition.keychain_material)
			if (existsSync(direct)) return direct
			return byStem.get(stemOf(definition.keychain_material, '.vmat')) ?? null
		}
		if (definition.pedestal_display_model) return byStem.get(stemOf(definition.pedestal_display_model, '.vmdl')) ?? null
		return definition.base && byName.has(definition.base) ? materialOf(byName.get(definition.base)!, depth + 1) : null
	}
	return materialOf
}

/**
 * THE `.vmat`'s OWN STATIC ADJUST — the four numbers a charm's material sets for itself, minus the
 * ones its `DynamicParams` replaces.
 *
 * A charm material declares `g_fHueShift` / `g_fSaturation` / `g_fBrightness` / `g_fContrast` as
 * plain values in its top-level block, and a `DynamicParams` expression for one of them OVERRIDES
 * that value rather than adding to it. Reading only the expressions therefore loses every charm that
 * tunes its own colour without a seed: `kc_wpn_ak_jelly` (the Die-cast AK) drives only `g_fHueShift`
 * from the seed and ships `g_fSaturation 1.798` / `g_fBrightness 1.087` statically, so dropping them
 * rendered it washed out and dim against the game.
 *
 * Neutral values (hue 0, the other three 1) are dropped as well, so what ships is exactly the part
 * that changes the picture and is not already accounted for.
 */
const keychainStaticParams = (
	definitions: KeychainDefinitions,
	seedRows: [id: number, params: Record<string, string>][],
) => {
	const materialOf = keychainMaterialFiles(definitions)
	const driven = new Map(seedRows.map(([id, params]) => [id, new Set(Object.keys(params))]))
	const NEUTRAL: Record<string, number> = { hue: 0, saturation: 1, brightness: 1, contrast: 1 }
	const rows: [id: number, params: Record<string, number>][] = []
	for (const id of Object.keys(definitions)) {
		const file = materialOf(id)
		if (!file || !existsSync(file)) continue
		const text = readFileSync(file, 'utf8')
		const dynamic = text.indexOf('"DynamicParams"')
		// Everything ABOVE the DynamicParams block is the static declaration.
		const statics = dynamic < 0 ? text : text.slice(0, dynamic)
		const already = driven.get(Number(id)) ?? new Set<string>()
		const params: Record<string, number> = {}
		for (const match of statics.matchAll(/"(g_f[A-Za-z]+)"\s+"(-?[\d.]+)"/g)) {
			const key = KEYCHAIN_SEED_PARAMS[match[1]]
			if (!key || already.has(key)) continue
			const value = Number(match[2])
			if (!Number.isFinite(value) || value === NEUTRAL[key]) continue
			params[key] = value
		}
		if (Object.keys(params).length) rows.push([Number(id), params])
	}
	rows.sort((a, b) => a[0] - b[0])
	return rows
}

const keychainSeedExpressions = (definitions: KeychainDefinitions) => {
	const materialOf = keychainMaterialFiles(definitions)
	const rows: [id: number, params: Record<string, string>][] = []
	const silent: string[] = []
	for (const id of Object.keys(definitions)) {
		const file = materialOf(id)
		if (!file || !existsSync(file)) continue
		const text = readFileSync(file, 'utf8')
		const start = text.indexOf('"DynamicParams"')
		if (start < 0) {
			silent.push(`${id} ${definitions[id].name}`)
			continue
		}
		const open = text.indexOf('{', start)
		let depth = 0
		let end = -1
		for (let i = open; i < text.length; i++) {
			if (text[i] === '{') depth++
			else if (text[i] === '}' && --depth === 0) {
				end = i
				break
			}
		}
		const params: Record<string, string> = {}
		for (const match of text.slice(open + 1, end).matchAll(/"([A-Za-z_0-9]+)"\s+"((?:[^"\\]|\\.)*)"/g)) {
			const key = KEYCHAIN_SEED_PARAMS[match[1]]
			if (key) params[key] = match[2].replace(/\\[nt]/g, ' ').trim()
		}
		if (Object.keys(params).length) rows.push([Number(id), params])
		// Charms whose DynamicParams drive only a glitter scale, a detail-texture rotation, a
		// pearlescence period or a liquid level are LEFT OUT rather than given a neutral row: the render
		// path treats a missing id as "the seed does not change this charm's colour", which is true.
		else silent.push(`${id} ${definitions[id].name}`)
	}
	rows.sort((a, b) => a[0] - b[0])
	return { rows, silent }
}

// ---------------------------------------------------------------------------------------------

const main = async () => {
	requireCli(CLI)
	const pak = cs2Pak()
	console.log(`cli:  ${CLI}`)
	console.log(`pak:  ${pak}`)

	const temp = mkdtempSync(join(tmpdir(), 'cs2-attachments-'))
	try {
		mkdirSync(temp, { recursive: true })
		const proc = Bun.spawn(
			[CLI, '-i', pak, '-o', temp, '-e', 'vmdl_c', '-f', 'weapons/models/', '-d', '--threads', '6'],
			{ stdout: 'pipe', stderr: 'pipe' },
		)
		await proc.exited
		const vmdls = walk(temp, '.vmdl')
		console.log(`vmdl: ${vmdls.length} decompiled`)

		// The RAW resources as well: `KeychainMarkup` does not survive decompilation, so the charm's
		// legal region has to come out of the .vmdl_c DATA block. Same tree, same stems, so the two
		// passes join on the stem with no path mapping.
		const rawTemp = mkdtempSync(join(tmpdir(), 'cs2-attachments-raw-'))
		const rawProc = Bun.spawn(
			[CLI, '-i', pak, '-o', rawTemp, '-e', 'vmdl_c', '-f', 'weapons/models/', '--threads', '6'],
			{ stdout: 'pipe', stderr: 'pipe' },
		)
		await rawProc.exited
		const rawByStem = new Map<string, string>()
		for (const raw of walk(rawTemp, '.vmdl_c')) rawByStem.set(relSlash(rawTemp, raw).replace(/\.vmdl_c$/, ''), raw)

		// Keyed by the export-relative GLB path, which is what `getWeaponModelPath` returns — so the
		// econ-id aliases (sfui_wpnhud_knifekaram -> weapon_knife_karambit) resolve for free.
		const table = new Map<string, Record<string, Attachment>>()
		const regions = new Map<
			string,
			{ hd: Box | null; legacy: Box | null; hdPatches: Patch[]; legacyPatches: Patch[]; worstSkew: number }
		>()
		for (const file of vmdls) {
			// `relSlash`, not a raw slice: this stem goes STRAIGHT INTO THE TABLE KEY below as
			// `models/<stem>.glb`, which is the export-relative path `getWeaponModelPath` returns. A
			// Windows run would key every row `models/weapons\models\…\x.glb` and the viewer would
			// match none of them — a silently empty attachment table, not an error.
			const stem = relSlash(temp, file).replace(/\.vmdl$/, '')
			const { found, rotatedParents, modelSpace } = parseVmdl(readFileSync(file, 'utf8'))
			if (rotatedParents.length) console.warn(`  ! ${stem}: rotated parent bone for ${rotatedParents.join(', ')}`)
			if (!Object.keys(found).length) continue
			table.set(`models/${stem}.glb`, found)
			const raw = rawByStem.get(stem)
			if (!raw) continue
			const dump = Bun.spawn([CLI, '-i', raw, '-b', 'DATA'], { stdout: 'pipe', stderr: 'pipe' })
			const dataText = await new Response(dump.stdout).text()
			await dump.exited
			const markup = parseKeychainMarkup(dataText, modelSpace)
			if (markup.missingBones.length) {
				console.warn(`  ! ${stem}: KeychainMarkup on unknown bone(s) ${markup.missingBones.join(', ')} — quads skipped`)
			}
			if (markup.hd || markup.legacy)
				regions.set(`models/${stem}.glb`, {
					hd: markup.hd,
					legacy: markup.legacy,
					hdPatches: markup.hdPatches,
					legacyPatches: markup.legacyPatches,
					worstSkew: markup.worstSkew,
				})
		}
		rmSync(rawTemp, { recursive: true, force: true })
		console.log(`keychain regions: ${regions.size} weapons`)

		// THE NUMBER THAT CONDEMNS THE BOX. Same measurement the sticker region needed: quad area over
		// the box's largest face. Anything far below 1 means the box stands for a region it is not.
		let totalPatches = 0
		let worstSkew = 0
		let worstSkewAt = ''
		for (const [path, region] of [...regions].sort()) {
			totalPatches += region.hdPatches.length + region.legacyPatches.length
			if (region.worstSkew > worstSkew) {
				worstSkew = region.worstSkew
				worstSkewAt = path
			}
			const hd = patchFill(region.hdPatches, region.hd)
			const legacy = patchFill(region.legacyPatches, region.legacy)
			const pct = (v: number | null) => (v === null ? '  —  ' : `${(v * 100).toFixed(1)}%`.padStart(6))
			console.log(
				`  ${path.replace(/^models\/weapons\/models\//, '').padEnd(46)}` +
					` quads hd ${String(region.hdPatches.length).padStart(3)} fill ${pct(hd)}` +
					` | legacy ${String(region.legacyPatches.length).padStart(3)} fill ${pct(legacy)}` +
					` | skew ${`${(region.worstSkew * 100).toFixed(1)}%`.padStart(6)}`,
			)
		}
		// HOW LOSSY `origin + two edges` STILL IS, now that the edges are right. See the block comment
		// above `parseKeychainMarkup`: a non-zero worst skew is how far the reconstructed fourth corner
		// misses the one Valve authored, and it is the bound on how far outside the authored patch a
		// clamped charm can still land.
		console.log(
			`keychain quads: ${totalPatches} total | worst reconstructed-corner skew ${(worstSkew * 100).toFixed(1)}% of quad, on ${worstSkewAt || 'none'}`,
		)

		const models = readFileSync(join(VIEWER, 'weaponModels.ts'), 'utf8')
		const weaponPaths = [...models.matchAll(/\bweapon_[a-z0-9_]+: '(models\/[^']+\.glb)'/g)].map(m => m[1])
		const rows = weaponPaths.filter(path => table.has(path)).sort()
		const missing = weaponPaths.filter(path => !table.has(path))
		console.log(`weapons in weaponModels.ts: ${weaponPaths.length}, with attachments: ${rows.length}`)
		console.log(`  with keychain: ${rows.filter(p => table.get(p)?.keychain).length}`)
		console.log(`  with stattrak: ${rows.filter(p => table.get(p)?.stattrak).length}`)
		console.log(`  with nametag: ${rows.filter(p => table.get(p)?.nametag).length}`)
		console.log(`  with nametag_legacy: ${rows.filter(p => table.get(p)?.nametag_legacy).length}`)
		if (missing.length) console.warn(`  ! no attachment block: ${missing.join(', ')}`)

		const vec = (v: [number, number, number]) => `[${v.map(n => Number(n.toFixed(6))).join(', ')}]`
		const attachment = (a: Attachment | undefined) =>
			a ? `{ origin: ${vec(a.origin)}, angles: ${vec(a.angles)} }` : 'null'
		const box = (b: Box | null | undefined) => (b ? `[${b.map(n => Number(n.toFixed(4))).join(', ')}]` : 'null')
		// Flat, 9 numbers per quad — origin, edge u, edge v — so the shipped table is one number array
		// per variant rather than 2100 object literals.
		const patchList = (list: Patch[] | undefined) =>
			list?.length
				? `[${list
						.flatMap(p => [...p.origin, ...p.edgeU, ...p.edgeV])
						.map(n => Number(n.toFixed(3)))
						.join(',')}]`
				: 'null'
		const body = rows
			.map(path => {
				const a = table.get(path) as Record<string, Attachment>
				const region = regions.get(path)
				return [
					`\t'${path}': {`,
					`\t\tkeychain: ${attachment(a.keychain)},`,
					`\t\tkeychainLegacy: ${attachment(a.keychain_legacy)},`,
					`\t\tstattrak: ${attachment(a.stattrak)},`,
					`\t\tstattrakLegacy: ${attachment(a.stattrak_legacy)},`,
					`\t\tnametag: ${attachment(a.nametag)},`,
					`\t\tnametagLegacy: ${attachment(a.nametag_legacy)},`,
					`\t\tkeychainRegion: ${box(region?.hd)},`,
					`\t\tkeychainRegionLegacy: ${box(region?.legacy)},`,
					`\t\tkeychainPatches: ${patchList(region?.hdPatches)},`,
					`\t\tkeychainPatchesLegacy: ${patchList(region?.legacyPatches)},`,
					'\t},',
				].join('\n')
			})
			.join('\n')

		const attachmentsFile = join(VIEWER, 'weaponAttachments.data.ts')
		if (writes('attachments'))
			writeFileSync(
				attachmentsFile,
				`// GENERATED by tools/cs2-export/dump-attachments.ts — do not edit by hand.
//
// Every weapon's \`keychain\` / \`keychain_legacy\` / \`stattrak\` / \`stattrak_legacy\` / \`nametag\` /
// \`nametag_legacy\` attachment, read
// out of the decompiled .vmdl and composed with its bone chain into MODEL space. Source units:
// inches, +x toward the muzzle, +y to the weapon's left, +z up. \`angles\` is a Source QAngle in
// degrees — [pitch (about y), yaw (about z), roll (about x)]. See weaponAttachments.ts for the
// conversion into the GLB's own space and for how the convention was pinned down.
//
// \`keychainRegion\` / \`keychainRegionLegacy\` are the bounding box of that variant's
// \`KeychainMarkup\` quads — the surface patches the game will let a charm sit on — in the same model
// space, as [minX, minY, minZ, maxX, maxY, maxZ]. They are a coarse pre-filter ONLY: the box is many
// times the area of the quads it bounds, which is why the quads ship too.
//
// \`keychainPatches\` / \`keychainPatchesLegacy\` are those quads, flat, NINE numbers each —
// [originX, originY, originZ, edgeUx, edgeUy, edgeUz, edgeVx, edgeVy, edgeVz] — so a quad is
// \`origin + u*edgeU + v*edgeV\` for u, v in [0, 1]. Same model space, inches.
//
// Keyed by the export-relative GLB path, i.e. by what \`getWeaponModelPath\` returns.

import type { WeaponAttachments } from './weaponAttachments'

export const WEAPON_ATTACHMENTS: Record<string, WeaponAttachments> = {
${body}
}
`,
			)
		console.log(writes('attachments') ? `wrote ${attachmentsFile}` : `skipped ${attachmentsFile} (--only)`)

		if (!writes('keychains')) {
			console.log('skipped keychainModels.data.ts (--only)')
			return
		}

		const { rows: keychainRows, unresolved, definitions } = keychainModels()
		if (unresolved.length) console.warn(`  ! keychain ids with no model: ${unresolved.join(', ')}`)
		const { rows: overrideRows, missing: missingOverrides } = keychainMaterialOverrides(definitions)
		const { rows: seedRows, silent: silentSeeds } = keychainSeedExpressions(definitions)
		const staticRows = keychainStaticParams(definitions, seedRows)
		console.log(`keychain seed expressions: ${seedRows.length} ids drive a colour from $KeychainSeed`)
		console.log(`keychain static adjust: ${staticRows.length} ids carry a live non-neutral .vmat value`)
		if (silentSeeds.length) console.log(`  seed does NOT change colour for: ${silentSeeds.join(', ')}`)
		if (missingOverrides.length) console.warn(`  ! keychain_material not exported: ${missingOverrides.join(', ')}`)
		const keychainFile = join(VIEWER, 'keychainModels.data.ts')
		const overrideLiteral = ({ color, normal, metalness, ao }: MaterialOverride) =>
			`{ color: '${color}', normal: ${normal ? `'${normal}'` : 'null'}, metalness: ${
				metalness ? `'${metalness}'` : 'null'
			}, ao: ${ao ? `'${ao}'` : 'null'} }`
		writeFileSync(
			keychainFile,
			`// GENERATED by tools/cs2-export/dump-attachments.ts — do not edit by hand.
//
// keychain id -> the GLB the \`keychains\` export job wrote for its \`pedestal_display_model\`, for
// every id in items_game's \`keychain_definitions\`. The tournament highlight-reel charms declare no
// model of their own and resolve through \`base\`, so many ids share one GLB.

export const KEYCHAIN_MODEL_PATHS: Record<number, string> = {
${keychainRows.map(([id, name, path]) => `\t${id}: '${path}', // ${name}`).join('\n')}
}

/** The four texture slots a charm's per-id material override binds, export-relative. */
export type KeychainMaterialOverride = {
	color: string
	normal: string | null
	metalness: string | null
	ao: string | null
}

/**
 * keychain id -> the per-id \`keychain_material\`, for the ids whose model is a SHARED BLANK.
 *
 * ${overrideRows.length} ids resolve to one workshop-blank .vmdl and differ only in this material, so without it
 * they all render identically — as the blank, whose own \`g_tColor\` is a featureless near-black. The
 * shader is \`csgo_weapon.vfx\` either way, so binding these four maps over the blank's is the whole
 * of the fix.
 */
export const KEYCHAIN_MATERIAL_OVERRIDES: Record<number, KeychainMaterialOverride> = {
${overrideRows.map(([id, name, override]) => `\t${id}: ${overrideLiteral(override)}, // ${name}`).join('\n')}
}

/**
 * The four \`csgo_weapon.vfx\` colour-adjust parameters a charm's own material drives FROM ITS SEED,
 * per keychain id, as the expressions \`items_game\`'s material authors wrote.
 *
 * A charm's "Charm Template" is not a texture index and not a model variant: CS2 registers it as the
 * material-expression variable \`$KeychainSeed\`, and each charm's \`.vmat\` \`DynamicParams\` block turns
 * it into hue / saturation / brightness / contrast. \`$KeychainSeed\` is the most-used dynamic variable
 * in the shipped game (142 uses across 81 materials) and all 62 charm \`.vmdl\`s carry zero
 * \`MaterialGroup\` nodes, so nothing else about a charm varies with it.
 *
 * ${seedRows.length} of the ${keychainRows.length} ids are here. The ${silentSeeds.length} that are not drive something a PBR material
 * has no equivalent for — a detail-texture rotation, a glitter scale, a pearlescence period, a liquid
 * level, or \`$sticker_rarity_color\` instead of the seed at all — and are OMITTED rather than given a
 * neutral row, so \`keychainSeedAdjust\` can say "this charm's colour does not respond to its template"
 * instead of inventing a mapping.
 *
 * \`t\` is \`pattern / 100000\`; see the note in keychainModels.ts for why that divisor is inferred
 * rather than read.
 */
export type KeychainSeedExpressions = {
	/** Degrees, added to the albedo's hue. */
	hue?: string
	saturation?: string
	brightness?: string
	contrast?: string
}

export const KEYCHAIN_SEED_EXPRESSIONS: Record<number, KeychainSeedExpressions> = {
${seedRows
	.map(
		([id, params]) =>
			`\t${id}: { ${Object.entries(params)
				.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
				.join(', ')} },`,
	)
	.join('\n')}
}

/** The four values a charm's material adjusts its albedo by, as numbers rather than as expressions. */
export type KeychainSeedExpressionValues = { hue: number; saturation: number; brightness: number; contrast: number }

/**
 * THE \`.vmat\`'s OWN STATIC ADJUST — the part of a charm's colour that has nothing to do with its seed.
 *
 * Every charm material carries \`g_fHueShift\` / \`g_fSaturation\` / \`g_fBrightness\` / \`g_fContrast\` as
 * plain numbers in its top-level block, and a \`DynamicParams\` expression for one of them REPLACES that
 * number rather than adding to it. Reading only the expressions loses every charm whose material tunes
 * its own colour without a seed: \`kc_wpn_ak_jelly\` (the Die-cast AK, id 18) drives only \`g_fHueShift\`
 * from the seed and ships \`g_fSaturation 1.798\` / \`g_fBrightness 1.087\` statically, so dropping them
 * rendered it washed out and dim against the game.
 *
 * ${staticRows.length} of the ${keychainRows.length} ids carry at least one live non-neutral static. Values that are neutral
 * (hue 0, the other three 1) or already driven by an expression are dropped here, so what is left is
 * exactly the part that changes the picture and is not already accounted for.
 *
 * Ids absent here have nothing to add; \`KEYCHAIN_SEED_NEUTRAL\` is the floor.
 */
export const KEYCHAIN_STATIC_ADJUST: Record<number, Partial<KeychainSeedExpressionValues>> = {
${staticRows
	.map(
		([id, params]) =>
			`\t${id}: { ${Object.entries(params)
				.map(([key, value]) => `${key}: ${value}`)
				.join(', ')} },`,
	)
	.join('\n')}
}
`,
		)
		console.log(
			`wrote ${keychainFile} (${keychainRows.length} ids, ${new Set(keychainRows.map(r => r[2])).size} models, ${
				overrideRows.length
			} material overrides)`,
		)
	} finally {
		rmSync(temp, { recursive: true, force: true })
	}
}

await main()
