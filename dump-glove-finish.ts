/**
 * GLOVE FINISHES — the per-region colour table for all 95 glove kits.
 *
 * This is INCREMENT 1 of `csgo_customglove.vfx`: the eight tints, the region index that selects
 * between them, the AO/curvature map and nothing else. It is deliberately not the whole shader —
 * see `gloveFinish.ts` for exactly what is and is not reproduced, and why the tint path separates
 * cleanly from the rest of it.
 *
 * WHY A DUMP SCRIPT AND NOT `export.ts`. The four glove jobs in `export.ts` extract the glove
 * *assets* (recipes, textiles, per-model masks). They do not, and should not, evaluate a recipe:
 * `buildManifest` is written around the WEAPON compositing model — `compmat` + template + mutators,
 * keyed by paint index — and a glove recipe answers a different question with different parameter
 * names in two mutually incompatible families. Same reasoning, and the same output shape, as
 * `dump-sticker-slots.ts` and `dump-attachments.ts`: read the shipped data once, emit the table.
 *
 *   bun run dump-glove-finish.ts
 *
 * Writes `<out>/data/gloveFinish.data.ts`; copy it into your viewer from there.
 *
 * ------------------------------------------------------------------------------------------------
 * WHAT IS BEING READ
 *
 * `items_game` gives every glove paint kit a `composite_material_path`, always a
 * `gloves/paints/[volatile_02/]<kit>.vcompmat`. That document names the material the finish is
 * actually authored in, and it is the ONLY reliable link: six of the 95 kits do not have a `.vmat`
 * of their own name.
 *
 *   sporty_jaguar                  -> gloves/textiles/sporty_jaguar.vmat        (a kit filed under textiles/)
 *   glove_specialist_quilted_white -> …/volatile_02/textiles/<same name>.vmat    (ditto, other family)
 *   glove_driver_dragon_scale_red  -> …/volatile_02/glove_driver_snakeskin_red.vmat  (shares another kit's material)
 *
 * Guessing `gloves/paints/<kit>.vmat` resolves 71 of 95 and silently drops the rest, so the
 * `.vcompmat` indirection is followed even when the direct guess would have worked.
 *
 * ------------------------------------------------------------------------------------------------
 * TWO FAMILIES, ONE SHADER
 *
 * `csgo_customglove.vfx` ships `F_BACKWARDS_COMPATIBILITY` = "Source1 Texture Layout" /
 * "Source2 Height Blending", and the two layouts share almost no parameter names. Both supply eight
 * tints, which is the whole reason this increment covers 95 kits rather than 69:
 *
 *   family 1 (72 kits)  g_vColorTint1..8   g_tLayerMask (RGB slots, A region index)  g_tSurface
 *   family 2 (23 kits)  g_vId1..8Color     g_tTintId (R region index) + g_tLayerId    g_tObjectProperties
 *
 * COLOUR SPACE DIFFERS AND IT IS NOT COSMETIC.
 *
 *   `g_vColorTint1..8` are declared `m_sourceType 0` — raw, no expression — and the SHADER converts
 *   the blended result from gamma to linear (static0: the `<= 0.04045` branch on the weighted sum).
 *   So family 1's tints stay in gamma here and `gloveFinish.ts` blends before converting.
 *
 *   `g_vId1..8Color` are declared `m_sourceType 7` with `Expression(SrgbGammaToLinear(this))`, i.e.
 *   the MATERIAL SYSTEM converts each tint before the shader ever sees it, and the shader blends in
 *   linear. So family 2's tints are converted here, one at a time, and emitted linear.
 *
 *   Reading either as the other's convention shifts every colour on 95 kits in the same direction,
 *   which looks like a plausible "slightly dark" rather than like a bug. `m_sourceType` is the
 *   oracle; it is not guessable from the value.
 *
 * `g_vIdNColor`'s FOURTH component is not padding: it is 0 for an id the kit leaves untinted and 1
 * for an id it paints, and the shader accumulates it as the tint's own coverage (see the `_23647.w`
 * divide in static5). It is emitted.
 *
 * ------------------------------------------------------------------------------------------------
 * FAMILY 2 ALSO NEEDS ITS FOUR SLOT TINTS, and this is not optional
 *
 * The id tint is a RE-TINT of an already-coloured surface, not the colour itself: static5 keeps the
 * substrate/surface colour wherever `g_vIdNColor.w` is 0, and most kits set `.w` on only two or
 * three of the eight ids. `glove_specialist_sunburst_red` paints ids 3, 5 and 8 and leaves five
 * white-with-w-0 — so a renderer that used the id tints alone would draw five eighths of that glove
 * pure white. Three kits (`glove_driver_snakeskin_red`, `…_ostrich_leg_red`,
 * `…_embroidered_flowers_teal`) have no `g_tTintId` at all and are ENTIRELY slot-coloured.
 *
 * The slot colour the game uses is a 4x4 `g_mSurfaceColorAdjust1..4` — brightness, contrast,
 * saturation and tint folded into one matrix by the material system, applied to the textile albedo.
 * Increment 1 has no textile albedo (that is the micro-detail it deliberately omits), so the matrix
 * is evaluated against white, which reduces to `tint * brightness`. Surface is the layer on top, so
 * it wins; where a slot leaves its surface tint at white the substrate tint below shows through and
 * that is used instead. Emitted LINEAR, matching family 2's id tints.
 *
 * ------------------------------------------------------------------------------------------------
 * OUTPUT PATHS
 *
 * Texture references are rewritten from their content path to the export layout, which is
 * `<job dir>/<content path with .vtex -> .png>`:
 *
 *   characters/models/shared/arms/…  -> glovemodeltex/…   (job `glovemodeltex`)
 *   items/assets/paintkits/…         -> paintkits/…       (job `paintkits`, already published)
 *   gloves/…                         -> glovetex/…        (job `glovetex`)
 *   materials/default/…              -> defaults/…        (job `defaults`)
 *
 * Only `paintkits/` is live today. The other three roots must be exported and uploaded before any
 * of this resolves in production — `gloveFinish.ts` degrades to the unpainted glove until they are.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { UserError, cliPath, findCs2Pak, generatedDataDir, requireCli } from './platform'

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
const CLI = cliPath(value('cli', 'SOURCE2VIEWER_CLI'))
const OUT = resolve(value('out', 'CS2_EXPORT_OUT') ?? join(HERE, 'out'))

const cs2Pak = () => findCs2Pak(value('cs2', 'CS2_PATH'))

const run = async (args: string[]) => {
	const proc = Bun.spawn(args, { stdout: 'pipe', stderr: 'pipe' })
	const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
	const code = await proc.exited
	if (code !== 0) throw new Error(`${args[0]} exited ${code}\n${err || out}`)
	return out
}

const walk = (dir: string, ext: string, out: string[] = []) => {
	if (!existsSync(dir)) return out
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) walk(path, ext, out)
		else if (path.endsWith(ext)) out.push(path)
	}
	return out
}

// ---------------------------------------------------------------------------------------------
// The two document formats
// ---------------------------------------------------------------------------------------------

/** A decompiled `.vmat` is a flat `"key"\t"value"` document, including inside `Compiled Textures`. */
const parseVmat = (text: string) => {
	const map = new Map<string, string>()
	for (const line of text.split('\n')) {
		const match = line.match(/^\s*"([^"]+)"\s+"([^"]*)"\s*$/)
		if (match) map.set(match[1], match[2])
	}
	return map
}

const vec = (raw: string | undefined): number[] | null => {
	if (!raw) return null
	const parts = raw.replace(/[[\]]/g, ' ').trim().split(/\s+/).map(Number)
	return parts.every(Number.isFinite) && parts.length >= 3 ? parts : null
}

/**
 * The `.vmat` a `.vcompmat` composites INTO.
 *
 * `m_strSpecificContainerMaterial` is the container the procedure targets, and for family 1 that is
 * the kit's own material. Family 2 targets the shared `workshop/paintkits/templates/glove_compositor.vmat`
 * and names the kit material as the `paint` container's `m_strResourceMaterial` instead. Taking
 * whichever is not a `workshop/paintkits/templates/` path resolves both without branching on family,
 * which matters because the family is only knowable AFTER the material is read.
 */
const kitMaterialOf = (text: string): string | null => {
	const refs = [...text.matchAll(/resource_name:"([^"]+\.vmat)"/g)].map(m => m[1])
	return refs.find(ref => !ref.startsWith('workshop/paintkits/templates/')) ?? null
}

// ---------------------------------------------------------------------------------------------
// Content path -> export path
// ---------------------------------------------------------------------------------------------

const TEXTURE_ROOTS: [prefix: string, dir: string][] = [
	['characters/models/shared/arms/', 'glovemodeltex'],
	['items/assets/paintkits/', 'paintkits'],
	['gloves/', 'glovetex'],
	['materials/default/', 'defaults'],
	// The PATTERNS. 28 of the 55 patterned Source1 kits reuse the WEAPON pattern tree outright —
	// `…/paints/{hydrographic,anodized_multi,spray,anodized_air,antiqued}/` — and those files have
	// been exported and published under `weapontex/` since long before gloves existed. Left off this
	// list `exportPath` returned null for them, which reads as "this kit has no pattern" rather than
	// as a missing root.
	['materials/models/weapons/', 'weapontex'],
]

const exportPath = (contentPath: string): string | null => {
	const root = TEXTURE_ROOTS.find(([prefix]) => contentPath.startsWith(prefix))
	if (!root) return null
	return `${root[1]}/${contentPath.replace(/\.vtex$/, '.png')}`
}

/** sRGB -> linear, the EOTF the shader and the material system both use. */
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)

const round = (n: number) => Number(n.toFixed(6))

/**
 * A textile's MEAN COLOUR, from `data/texture-reflectivity.json` — the `Reflectivity` field of its
 * own `.vtex` header, which Valve computes at compile time and which is already LINEAR for RGB.
 *
 * This is what lets a family-2 slot be the right colour without sampling its textile. The slot
 * colour in the game is `textileAlbedo * colourAdjust(tint, brightness, contrast, saturation)`, and
 * most slots leave the tint at WHITE and let the textile carry the colour outright:
 * `glove_specialist_sunburst_red` tints two of its four slots and leaves the other two white over
 * `plastic_glossy_color` (mean 0.047 linear, near-black) and `ponte_color` (0.087, 0.159, 0.299, a
 * navy fabric). Taking the textile as white rendered both of those regions PURE WHITE — five eighths
 * of that glove, against an icon that is navy and charcoal.
 *
 * The mean is exactly the term this increment can afford: one vec3 per slot, no sampler, and it is
 * the correct answer everywhere the textile is flat. What it cannot reproduce is the textile's
 * VARIATION — a two-tone weave averages to its midpoint — which is the micro-detail the increment
 * is defined not to have.
 */
const meanColour = (table: Record<string, { color?: number[] }>, vtexRef: string | undefined) => {
	if (!vtexRef) return null
	const stem = vtexRef.slice(vtexRef.lastIndexOf('/') + 1).replace(/\.vtex$/, '')
	const entry = table[stem]
	return entry?.color && entry.color.length >= 3 ? entry.color.slice(0, 3) : null
}

// ---------------------------------------------------------------------------------------------
// THE WEAR LAYER — Source1 only
//
// Everything `g_fWearProgress` touches, plus the four textiles it erodes. A Source1 glove's finish
// is four MATERIALS blended by `g_tLayerMask.RGB`, so every one of these is FOUR numbers — one per
// slot — and the shader blends them with the same nested `mix` it blends the textiles with.
//
// The defaults matter as much as the values: a `.vmat` omits any parameter it leaves at the
// shader's default, and 40 of the 72 kits omit at least one of these. `g_fDetailScale` defaulting
// to 0 rather than its declared 4 would collapse every unstated textile to a single texel.
// ---------------------------------------------------------------------------------------------

/** Declared `Default(...)` of each Source1 per-slot scalar, read out of `csgo_customglove.vfx`. */
const SLOT_SCALARS: [param: string, fallback: number][] = [
	['g_fDetailScale', 4],
	['g_fDetailBlackPoint', 0.047],
	['g_fCurvaturePower', 1],
	['g_fCurvatureWearBoost', 0],
	['g_fDamageBleaching', 0],
	['g_fDamageBrightness', 0],
	['g_fDamageSaturation', 0],
	['g_fWearBleaching', 0.25],
	['g_fDetailGrunge', 0],
	['g_fGrimeBrightness', 0],
	['g_fGrimeSaturation', 0],
	['g_fGrungeMax', 1],
	['g_fDamageNormalEdgeWidth', 1],
	// Metalness is not wear, but the ALBEDO reads it: `g_vTextileAlbedoLevels` and its metallic
	// twin are crossfaded by the final metalness, so the last line of the colour output cannot be
	// written without it. Emitted here so the pattern/metalness increment can bind the metalness
	// OUTPUT from the same numbers rather than dumping them a second time.
	['g_fDetailMetalness', 0],
	['g_fDamageMetalness', 0],
	['g_fDamageEdgeMetalness', 0],
]

/**
 * `g_vDamageLevels1..4` — the smoothstep edges the wear mask is pushed through, per slot.
 *
 * NOT ordered: `bloodhound_snakeskin_brass` slot 2 authors (0.669, 0.027), a DESCENDING pair, and
 * GLSL's `smoothstep` is undefined when `edge0 >= edge1`. The renderer evaluates the ramp
 * explicitly for exactly this reason; the pair is emitted as authored.
 */
const damageLevelsOf = (material: Map<string, string>, slot: number): number[] => {
	const raw = material.get(`g_vDamageLevels${slot}`)
	if (!raw) return [0, 0]
	const parts = raw.replace(/[[\]]/g, ' ').trim().split(/\s+/).map(Number)
	return [Number.isFinite(parts[0]) ? round(parts[0]) : 0, Number.isFinite(parts[1]) ? round(parts[1]) : 0]
}

type GloveWear = {
	/** `g_tDetail1..4` — RGBA, LINEAR. (x, y) heights, z the damage mask, w the roughness. */
	detail: (string | null)[]
	/** `g_tGrunge1..4` — RGBA, `SrgbRead(true)`. RGB is the dirt colour, A the wear-mask modulation. */
	grunge: (string | null)[]
	/** `g_tNoise` — RGBA, `SrgbRead(true)`. Drives the cloth sheen's two-way hue mix. */
	noise: string | null
	/** Keyed by the `SLOT_SCALARS` parameter name, four numbers each, in slot order. */
	scalars: Record<string, number[]>
	/** `g_vDamageLevels1..4`, `[lo, hi]` as authored — see `damageLevelsOf`. */
	damageLevels: number[][]
	/** `g_fWearExponent` — Source1's `g_fWearProgress` is `pow(itemFloat, this)`. */
	wearExponent: number
	/** `g_fGrungeTexCoordScale` — authored, and the seed does NOT roll it. */
	grungeScale: number
	/** `g_fGrungeTexCoordRotation` in DEGREES — the seed rolls this over 0..360. */
	grungeRotation: number
	/** `g_fGrungeTexCoordOffset` — the seed rolls both components over 0..1. */
	grungeOffset: number[]
}

// ---------------------------------------------------------------------------------------------
// THE PATTERN LAYER — Source1 only
//
// 55 of the 72 Source1 kits set `F_PATTERN 1`; the other 17 still NAME a `g_tPattern`, and it is
// `materials/default/default_tga_51411dfa` on every one of them. So "does this kit have a pattern"
// is the FEATURE FLAG and never the texture reference — reading it off the reference instead paints
// a flat mid-grey square over seventeen gloves that have no pattern at all.
// ---------------------------------------------------------------------------------------------

/**
 * `g_vPatternTexCoordXform0/1`, evaluated — `[X0.x, X0.y, X0.w, X1.x, X1.y, X1.w]`.
 *
 * The shader never sees the scale/rotation/offset sliders; it sees this pair, and the material
 * system derives it from them with a compiled expression. TRANSCRIBED from that expression
 * (`csgo_customglove.vfx:305-324`), including its 3.14159 — the Source2 declaration a few hundred
 * lines up uses 3.1415927, and they are two different parameters that happen to share a name.
 *
 * WHICH OF THE TWO DECLARATIONS, and it is not guessable: `g_vPatternTexCoordXform0` is declared
 * TWICE, once against `g_vPatternTexCoordScale` (a float2, plus a `g_vPatternTexCoordCenter`) and
 * once against `g_fPatternTexCoordScale` (a scalar, plus `g_bFlipFixup`). Source1's `.vmat`s author
 * the SCALAR — every one of the 55 sets `g_fPatternTexCoordScale` and none sets the float2 — so
 * this is the second form. Feeding a scalar into the first would silently scale v by 1.
 */
const patternXform = (rotation: number, scale: number, offset: number[], flip: boolean) => {
	// NOT `Math.PI`. Valve's expression says 3.14159 and this is a transcription of it; the Source2
	// declaration of the same-named parameter says 3.1415927, which is how one can tell the two
	// apart at all. Substituting the real constant is a different number that is still not the one
	// the game computes.
	// biome-ignore lint/suspicious/noApproximativeNumericConstant: transcribed from the .vfx
	const v0 = ((flip ? -rotation : rotation) * 3.14159) / 180
	const v1 = Math.cos(v0)
	const v2 = Math.sin(v0)
	const v3 = scale
	const v4 = 0.5 / (v3 !== 0 ? v3 : 1)
	const v5 = Math.cos(-v0)
	const v6 = Math.sin(-v0)
	const v7 = v4 * v5 - v4 * v6
	const v8 = v7 * v6 + v4 * v5
	return [
		v1 * v3,
		-v2 * v3,
		v3 * v1 * v7 + v3 * -v2 * v8 + (offset[0] - 0.5),
		v2 * v3,
		v1 * v3,
		v3 * v2 * v7 + v3 * v1 * v8 + (offset[1] - 0.5),
	].map(round)
}

type GlovePattern = {
	/** `g_tPattern`. Source1 reads it RAW — its declaration here is `SrgbRead(false)`. */
	texture: string | null
	/** `g_nPatternMode`: 0 Indexed, 1 Unmasked Indexed, 2 Bitmap, 3 Unmasked Bitmap. */
	mode: number
	/** `g_nPatternReplaceIndex`, ALREADY 0-based — its `Expression(this-1)` is applied here. */
	replaceIndex: number
	/** The four palette TINTS, resolved through `g_vPatternPaletteIndices`. GAMMA, like `tints`. */
	palette: number[][]
	/** `g_vPatternTexCoordXform0/1` as AUTHORED — see `patternXform`. Only a SEEDLESS item shows it. */
	xform: number[]
	/**
	 * `g_fPatternTexCoordScale`, emitted because it is the one placement term the seed leaves alone.
	 *
	 * `gloves/paints/_shared_paint_generic.vcompmat` rolls `g_fPatternTexCoordOffset.xy` and
	 * `g_fPatternTexCoordRotation.x` into `instance_params` and `COPY_MATCHING_KEYS` writes them over
	 * the material; the scale is not in that list. So an econ instance's real transform is
	 * `glovePatternXform( this, rolledRotation, rolledOffset, flip )` and the runtime cannot rebuild
	 * it without this number. (It is also `hypot( xform[0], xform[1] )` — the linear part is a scaled
	 * rotation — and `glove-models.test.ts` checks the two agree, but a table that states a parameter
	 * is worth more than one that hides it inside a matrix.)
	 */
	scale: number
	/** `g_fFlipFixup` = `g_bFlipFixup ? -1 : 1`. Multiplies the pattern's u before the transform. */
	flipFixup: number
	/** `g_fPatternMetalness` — the metalness the pattern imposes wherever it covers. */
	metalness: number
}

// ---------------------------------------------------------------------------------------------
// THE SOURCE2 LAYER — the other 22 kits
//
// `F_BACKWARDS_COMPATIBILITY = 1` ("Source2 Height Blending") is a different shading model, not a
// variant: 1849/2099 lines of GLSL against Source1's 906, and 37 samplers against 21. Its four
// material slots each carry TWO textiles — a SUBSTRATE and a SURFACE, blended by their own height
// maps — plus a damage height, a grime colour and five 4x4 colour-adjust matrices.
//
// The whole thing is affordable for one reason, which is worth stating because it is not obvious
// from the parameter list: `static5` accumulates EVERY per-slot texture and EVERY per-slot scalar
// as `sum( weight_i * x_i )` BEFORE it composites anything. So the four slots collapse to one
// weighted sample per ROLE and one weighted scalar set, and the composition runs exactly once.
// ---------------------------------------------------------------------------------------------

/** The 24 per-slot texture roles, in the order `gloveSource2.ts` indexes its array's layers. */
const SOURCE2_TEXTURES = [
	'g_tSurface',
	'g_tSubstrate',
	'g_tSurfaceProperties',
	'g_tSubstrateProperties',
	'g_tDamage',
	'g_tGrime',
	// Bound for their ROUGHNESS only — `HemiOctAnisoRoughness` puts the normal in (G, A) and the
	// anisotropic roughness pair in (R, B), and the grime coverage is gated on
	// `1 - min(roughness.x, roughness.y)`. Without them a Factory New glove comes out visibly
	// dirtier than the game's, because that gate is what suppresses grime on a rough textile.
	'g_tSurfaceNormal',
	'g_tSubstrateNormal',
]

/** Declared `Default(...)` of each Source2 per-slot scalar, read out of `csgo_customglove.vfx`. */
const SOURCE2_SCALARS: [param: string, fallback: number][] = [
	['g_fDamageUvScale', 4],
	['g_fGrimeUvScale', 4],
	['g_fGrimeTranslucency', 0.5],
	['g_fGrimeRoughnessBrightness', 1],
	// Both have compiled Expressions and NEITHER is the authored number — see `source2Softness`.
	['g_fDamageHeightBlendSoftness', 0.01],
	['g_fDamageBevelBlendSoftness', 0.5],
	['g_fDamageBevelEmboss', 1],
	['g_fDamageBevelMetalness', 0],
	['g_fDamageBevelCloth', 0],
	['g_bDamageBevelBlendToSubstrate', 0],
	['g_bDamageBevelUseTintMask', 0],
	['g_fBurnishingGrime', 0.5],
	['g_fBurnishingCloth', 0],
	['g_fBurnishingMetalness', 0],
	['g_fSubstrateCompositeColorTranslucency', 0.5],
]

/** Declared `Default(...)` of each Source2 per-slot `float2` range. All default to (0, 0). */
const SOURCE2_RANGES = [
	'g_vDamageMinMax',
	'g_vSurfaceGrimeMinMax',
	'g_vSubstrateGrimeMinMax',
	'g_vSurfaceBurnishingMinMax',
	'g_vSubstrateBurnishingMinMax',
]

/** The five colour-adjust matrices, as `[emitted name, tint, prefix, average-colour source]`. */
const SOURCE2_ADJUSTS: [name: string, tint: string, prefix: string, average: string][] = [
	['surface', 'g_vSurfaceColorTint', 'g_fSurfaceColor', 'g_tSurface'],
	['substrate', 'g_vSubstrateColorTint', 'g_fSubstrateColor', 'g_tSubstrate'],
	// The DAMAGE bevel's matrix pivots on the SURFACE's average, not the substrate's, even though
	// the colour it produces is blended toward the substrate. `csgo_customglove.vfx:184`.
	['damage', 'g_vDamageBevelColorTint', 'g_fDamageBevelColor', 'g_tSurface'],
	['surfaceBurnish', 'g_vBurnishingColorTint', 'g_fBurnishingColor', 'g_tSurface'],
	['substrateBurnish', 'g_vBurnishingColorTint', 'g_fBurnishingColor', 'g_tSubstrate'],
]

/** Rec.709 luminance — the vector `csgo_customglove` itself uses everywhere. */
const LUMA = [0.2125, 0.7154, 0.0721]

/**
 * `MatrixColorTint2( tint, 1 )` — and it is NOT a plain per-channel multiply.
 *
 * The tint is LINEARISED AND THEN NORMALISED TO UNIT LUMINANCE, so that it changes a colour's hue
 * without changing how bright it is. Three things force that reading and each of them is checkable:
 *
 *   IT MUST BE THE IDENTITY ON WHITE. Twelve of the 22 Source2 kits leave most of their tints at
 *   (1,1,1) and expect the textile through unchanged. `tint / luminance(tint)` is (1,1,1) there;
 *   a plain multiply also is, but a hue-REPLACEMENT (`luminance(colour) * tint / luminance(tint)`,
 *   the other obvious reading) would render every one of them GREYSCALE.
 *
 *   A PLAIN MULTIPLY IS PROVABLY WRONG ON THE SHIPPED VALUES. `glove_sport_beadwork_diamonds_purple`
 *   tints its leather slot with (0.0667, 0.0353, 0.129), which linearises to (0.0056, 0.0028,
 *   0.0152) — multiplied straight in, that darkens the textile fifteenfold and renders the body of
 *   the glove BLACK against an icon that is mid purple. Normalised it is (1.30, 0.65, 3.55) and the
 *   leather comes out purple at its own brightness.
 *
 *   AND IT AGREES WITH VALVE'S ICONS WHEREVER THE TWO CAN BE COMPARED. `glove_specialist_sunburst_red`
 *   slot 1 is `plastic_glossy` (a 0.047 linear grey) under (0, 0.0235, 0.0824): normalised that is
 *   deep NAVY, which is the icon's back-of-hand, and near-black under a plain multiply. Its slot 4 is
 *   `ponte` under (0.341, 0.0118, 0.0118): normalised, bright RED — the icon's knuckle pads.
 *
 * A tint with no luminance at all keeps its raw linear value; there is nothing to normalise toward
 * and the answer is black either way.
 */
const tintScale = (raw: number[]) => {
	const linear = raw.slice(0, 3).map(toLinear)
	const luminance = linear[0] * LUMA[0] + linear[1] * LUMA[1] + linear[2] * LUMA[2]
	return luminance > 1e-6 ? linear.map(c => c / luminance) : linear
}

/**
 * One `g_m*ColorAdjust<slot>`, as a 3x4 AFFINE — `out.k = dot(row.k.xyz, colour) + row.k.w`.
 *
 * The `.vfx` says
 *
 *   MatrixMultiply( MatrixColorTint2( tint, 1 ),
 *                   MatrixColorCorrect2( float3( contrast, saturation, brightness ),
 *                                        TextureAverageColor( slotTexture ) ) )
 *
 * and those two builders are material-system primitives with no shipped source: the shader receives
 * only the PRODUCT, `m_sourceType 6`. So this is the one term in the Source2 port that is MODELLED
 * rather than transcribed, and it is modelled as the only reading of those four inputs that is (a)
 * affine, which it must be to be a 4x4 at all, (b) the identity at contrast = saturation =
 * brightness = 1 and tint = white, which 12 of the 22 kits rely on, and (c) needs
 * `TextureAverageColor` for something — it is the CONTRAST PIVOT, and it is the only term that
 * could want it:
 *
 *   saturate    s = mix( vec3( dot( c, LUMA ) ), c, saturation )
 *   contrast    k = mix( average, s, contrast )
 *   scale       out = k * brightness * tint
 *
 * The check that this is not merely plausible: with contrast = 1 the average drops out entirely and
 * the expression collapses to `colour * brightness * tint`, which at `colour = average` is exactly
 * the `slotTints` this table has been emitting since increment 1 — the values whose colours were
 * accepted against Valve's icons on all 22 kits. The new path therefore agrees with the old one
 * everywhere the old one was checked, and differs only where a kit authors a brightness, a contrast
 * or a saturation away from 1 (10 of the 22 do).
 *
 * The tint goes through `tintScale` — linearised AND normalised to unit luminance, which is the one
 * part of this that is NOT a guess; see that function. Brightness, contrast and saturation are
 * scalars and are used as authored.
 */
const colorAdjustMatrix = (
	material: Map<string, string>,
	table: Record<string, { color?: number[] }>,
	tintName: string,
	prefix: string,
	averageOf: string,
	slot: number,
): number[] => {
	const tint = tintScale(vec(material.get(`${tintName}${slot}`)) ?? [1, 1, 1])
	const contrast = Number(material.get(`${prefix}Contrast${slot}`) ?? 1)
	const saturation = Number(material.get(`${prefix}Saturation${slot}`) ?? 1)
	const brightness = Number(material.get(`${prefix}Brightness${slot}`) ?? 1)
	const average = meanColour(table, material.get(`${averageOf}${slot}`)) ?? [0, 0, 0]
	const rows: number[] = []
	for (let k = 0; k < 3; k++) {
		const scale = tint[k] * brightness * contrast
		for (let j = 0; j < 3; j++) rows.push(round(scale * ((k === j ? 1 : 0) * saturation + (1 - saturation) * LUMA[j])))
		rows.push(round(tint[k] * brightness * average[k] * (1 - contrast)))
	}
	return rows
}

/**
 * `g_fDamageHeightBlendSoftness` and `g_fDamageBevelBlendSoftness`, WITH their expressions.
 *
 * Both are `m_sourceType 7`, and the bevel's is COMPOUND — `max( this + g_fDamageHeightBlendSoftness,
 * .001 )`, i.e. it reads the other parameter. Read raw, a kit that authors 0 for both (three of the
 * 22 do, per slot) divides by zero in `static5`'s `_23339 / _17371`.
 */
const source2Softness = (material: Map<string, string>, slot: number): [number, number] => {
	const height = Math.max(Number(material.get(`g_fDamageHeightBlendSoftness${slot}`) ?? 0.01), 0.001)
	const bevel = Math.max(Number(material.get(`g_fDamageBevelBlendSoftness${slot}`) ?? 0.5) + height, 0.001)
	return [round(height), round(bevel)]
}

/**
 * `g_vDamageTexCoordXform0/1`, `g_vGrimeTexCoordXform0/1` and Source2's `g_vPatternTexCoordXform0/1`.
 *
 * A DIFFERENT expression from `patternXform` above and not a refactor of it. Source1's spells pi
 * `3.14159`, folds `g_bFlipFixup` into the rotation, and centres on `0.5 / scale`; Source2's spells
 * it `3.1415927`, leaves the flip to the VERTEX shader (which negates u before the transform) and
 * centres on an authored `g_vPatternTexCoordCenter`. The two parameters share a name and nothing
 * else — see `csgo_customglove.vfx:65-86` against `:305-324`.
 *
 * Returns `[X0.x, X0.y, X0.w, X1.x, X1.y, X1.w]`; the damage and grime forms are this with
 * scale = (1, 1) and centre = (0.5, 0.5), which is exactly what their expressions reduce to.
 */
const source2Xform = (rotation: number, scale: number[], centre: number[], offset: number[]) => {
	// NOT `Math.PI`, and not the 3.14159 the Source1 form above spells either. Valve wrote
	// 3.1415927 in this expression and 3.14159 in that one, and the difference between them is
	// exactly how the two same-named parameters can be told apart at all. Substituting the real
	// constant is a third number that the game computes nowhere.
	// biome-ignore lint/suspicious/noApproximativeNumericConstant: transcribed from the .vfx
	const v0 = (rotation * 3.1415927) / 180
	const v1 = Math.cos(v0)
	const v2 = Math.sin(v0)
	return [
		v1 * scale[0],
		-v2 * scale[1],
		centre[0] + offset[0] + v2 * centre[1] - v1 * centre[0],
		v2 * scale[0],
		v1 * scale[1],
		centre[1] + offset[1] - (v2 * centre[0] + v1 * centre[1]),
	].map(round)
}

type GloveSource2Pattern = {
	texture: string | null
	xform: number[]
	/** `g_fFlipFixup` — the VERTEX shader negates u before the transform when `g_bFlipFixup`. */
	flipFixup: number
	/** `g_fSubstratePatternMipBias` — the SUBSTRATE reads the print through a blurrier mip. */
	mipBias: number
	/** `g_bId1..8Pattern` — which of the eight tint ids the print is allowed to cover. */
	ids: number[]
	/** `g_fPatternPaintRespectsTintMask` — 0 lets the print widen the tint mask. */
	respectsTintMask: number
	/** `F_PATTERN_PAINT` — 1 makes the print a straight OVERLAY instead of a re-tint. 7 kits. */
	paintLayer: number
	/** `F_PUFFY_PAINT` — 1 thresholds the print's alpha and embosses it. 3 kits. */
	puffy: number
	/** `g_fPatternTranslucencyThreshold`. */
	threshold: number
	/** `g_fPatternCloth` — the cloth value the overlay imposes. Paint-layer kits only. */
	cloth: number
}

type GloveSource2 = {
	/** 32 export paths in `SOURCE2_TEXTURES` x slot order. */
	textures: (string | null)[]
	/** `g_vUvScale1..4` and `g_vUvOffset1..4`, as `[scaleX, scaleY, offsetX, offsetY]`. */
	uv: number[][]
	/** The five `g_m*ColorAdjust1..4`, each four slots of twelve — see `colorAdjustMatrix`. */
	adjust: Record<string, number[][]>
	/** Keyed by the shader's own parameter name; four numbers each, in slot order. */
	scalars: Record<string, number[]>
	/** The `float2` ranges, four `[min, max]` pairs each. */
	ranges: Record<string, number[][]>
	/** `g_vDamageTexCoordXform0/1` and `g_vGrimeTexCoordXform0/1`, `[a.x, a.y, a.w]` twice. */
	damageXform: number[]
	grimeXform: number[]
	pattern: GloveSource2Pattern | null
}

type GloveFinish = {
	kit: string
	family: 1 | 2
	/** Family 1: gamma, blended then linearised. Family 2: LINEAR, already converted. */
	tints: number[][]
	/** Family 2 only — `g_vIdNColor.w`, the tint's own coverage. */
	tintCoverage: number[] | null
	/** Family 2 only — the four material slots' own colour, LINEAR. */
	slotTints: number[][] | null
	regionTexture: string | null
	slotTexture: string | null
	propertiesTexture: string | null
	normalTexture: string | null
	colorMaskBlur: number
	previewModel: string | null
	/** Family 1 only — everything float and seed drive. Null on family 2, which is not ported yet. */
	wear: GloveWear | null
	/** Family 1 only — the print. Null on the 17 unpatterned kits and on every family-2 kit. */
	pattern: GlovePattern | null
	/**
	 * `g_fDetailMetalness1..4`, blended by `g_tLayerMask.RGB`. Family 1 only.
	 *
	 * Deliberately a copy of `wear.scalars.g_fDetailMetalness` rather than a read of it: metalness
	 * is an OUTPUT of the composite (`F_OUTPUT_MODE 2`) and lands in the material's `metalnessMap`,
	 * where the wear layer is an input to the albedo. They are the same four numbers today and
	 * nothing guarantees they stay in one object, so the renderer's metalness pass does not depend
	 * on the wear increment existing.
	 */
	metalness: number[] | null
	/**
	 * The Source2 substrate/surface/height/damage/grime layer. FAMILY 2 ONLY, null on family 1.
	 *
	 * This is what makes the 22 Source2 kits show their PRINT and respond to FLOAT: their print is
	 * not a `g_tPattern` mode like Source1's, it is the textile itself (Violet Beadwork's diamonds
	 * are `beadwork_diamonds_color`, bound as slot 3's substrate AND surface) plus — on 15 of them —
	 * a real `g_tPattern` re-tint on top.
	 */
	source2: GloveSource2 | null
}

const main = async () => {
	requireCli(CLI)
	const pak = cs2Pak()
	// Before the decompiler, not after it: the table is written at the end of a multi-minute
	// extraction, and a bad `--out` should cost a second rather than the whole run.
	const dataDir = generatedDataDir(OUT)

	const gloves = JSON.parse(readFileSync(join(OUT, 'data/gloves.json'), 'utf8')) as {
		paint: number | string
		paint_name: string
	}[]
	const manifest = JSON.parse(readFileSync(join(OUT, 'manifest.json'), 'utf8')) as Record<string, { kit: string }>
	const reflectivity = JSON.parse(readFileSync(join(OUT, 'data/texture-reflectivity.json'), 'utf8')) as Record<
		string,
		{ color?: number[] }
	>

	const scratch = mkdtempSync(join(tmpdir(), 'glove-finish-'))
	try {
		console.log('extracting glove recipes…')
		// Three filters rather than one: the kit materials live under three unrelated roots and the
		// CLI takes a single prefix.
		for (const filter of ['gloves/', 'items/assets/paintkits/volatile_02/'])
			await run([CLI, '-i', pak, '-o', scratch, '-e', 'vmat_c', '-f', filter, '-d', '--threads', '8'])
		await run([CLI, '-i', pak, '-o', scratch, '-e', 'vcompmat_c', '-f', 'gloves/paints/', '-d', '--threads', '8'])

		const materials = new Map<string, Map<string, string>>()
		for (const file of walk(scratch, '.vmat'))
			materials.set(file.slice(scratch.length + 1).replace(/\\/g, '/'), parseVmat(readFileSync(file, 'utf8')))
		const composites = new Map<string, string>()
		for (const file of walk(scratch, '.vcompmat'))
			composites.set(file.slice(scratch.length + 1).replace(/\\/g, '/'), readFileSync(file, 'utf8'))
		console.log(`  ${materials.size} materials, ${composites.size} composites`)

		const finishes: Record<string, GloveFinish> = {}
		const missing: string[] = []

		for (const glove of gloves) {
			const paint = String(glove.paint ?? '')
			if (!paint || paint === '0') continue
			const kit = manifest[paint]?.kit
			if (!kit) {
				missing.push(`${paint} (${glove.paint_name}): not in manifest`)
				continue
			}
			if (finishes[paint]) continue

			// The kit's own material, via its composite when there is one. `gloves/paints/<kit>` first
			// because that is where 94 of the 99 composites are; `volatile_02/` is the newer tree.
			const composite =
				composites.get(`gloves/paints/${kit}.vcompmat`) ?? composites.get(`gloves/paints/volatile_02/${kit}.vcompmat`)
			const materialPath = composite ? kitMaterialOf(composite) : null
			const material =
				(materialPath ? materials.get(materialPath) : null) ??
				materials.get(`gloves/paints/${kit}.vmat`) ??
				materials.get(`items/assets/paintkits/volatile_02/${kit}.vmat`)
			if (!material) {
				missing.push(`${paint} ${kit}: no material (composite -> ${materialPath ?? 'none'})`)
				continue
			}

			// Told apart by the TEXTURE LAYOUT, which is what `F_BACKWARDS_COMPATIBILITY` actually
			// switches — not by `g_vId1Color`, which the three untinted family-2 kits do not declare
			// at all and which therefore read as family 1 and lost every map they have.
			const family: 1 | 2 = material.has('g_tLayerId') || material.has('g_tObjectProperties') ? 2 : 1
			const tints: number[][] = []
			const coverage: number[] = []
			for (let i = 1; i <= 8; i++) {
				const raw = vec(material.get(family === 2 ? `g_vId${i}Color` : `g_vColorTint${i}`))
				if (!raw) {
					// An absent tint is the shader's own default, not an error: a kit that paints four
					// regions declares four. White is what an unset uniform blends as.
					tints.push([1, 1, 1])
					coverage.push(0)
					continue
				}
				tints.push(family === 2 ? raw.slice(0, 3).map(c => round(toLinear(c))) : raw.slice(0, 3).map(round))
				coverage.push(raw[3] ?? 0)
			}

			const texture = (name: string) => {
				const ref = material.get(name)
				return ref ? exportPath(ref) : null
			}

			/*
			 * SLOT COLOUR = the SURFACE layer's textile mean, times the surface layer's tint.
			 *
			 * Surface rather than substrate because surface is the layer on top: the shader blends the
			 * two by the substrate's height map, which this increment does not read, and with no height
			 * the outer layer is the honest default. The mean comes from the `.vtex` header (see
			 * `meanColour`) — without it a slot with an untinted textile renders white.
			 *
			 * The TINT and nothing else — deliberately not `g_f*ColorBrightness`. That scalar is one
			 * term of the 4x4 `g_mSurfaceColorAdjust` the material system derives, alongside contrast
			 * and saturation, and how the four fold together is not recoverable from the shader (the
			 * matrix arrives pre-multiplied, `m_sourceType 6`). Read as a plain multiplier it is
			 * provably wrong: `glove_driver_snakeskin_red` sets `g_fSubstrateColorBrightness3 = -0.148`,
			 * which would emit a NEGATIVE colour.
			 */
			const slotTints: number[][] = []
			for (let i = 1; i <= 4; i++) {
				// THROUGH `tintScale`, not a plain multiply — the same correction the colour-adjust
				// matrices take, and made in both places so the flat fallback and the Source2 layer do
				// not disagree about what colour a slot is. Straight multiplication rendered
				// `glove_sport_beadwork_diamonds_purple`'s leather black and
				// `glove_specialist_sunburst_red`'s slots 1 and 4 near-black, against icons that are
				// purple, navy and red.
				const tint = tintScale(vec(material.get(`g_vSurfaceColorTint${i}`)) ?? [1, 1, 1])
				const mean = meanColour(reflectivity, material.get(`g_tSurface${i}`)) ?? [1, 1, 1]
				// CLAMPED to an albedo's range, and it is the same number the GPU produces rather than a
				// correction of one: normalising a saturated tint to unit luminance can drive its weakest
				// luminance channel past 1 (`glove_driver_brocade_crane_red` slot 1 lands at 1.185 red),
				// and the 8-bit composite target clamps it there anyway. Made explicit so the table
				// carries a value that IS an albedo and the bench can assert that it is.
				slotTints.push([0, 1, 2].map(c => round(Math.min(1, Math.max(0, tint[c] * mean[c])))))
			}

			/*
			 * THE WEAR LAYER, family 1 only.
			 *
			 * Family 2 has the same idea under different parameter names (`g_tSurface1..4` +
			 * height blending + `g_tGrime1..4`) and 1849 lines of GLSL rather than 906. It is a
			 * separate increment, and emitting a half-filled `wear` for it would make the renderer's
			 * "does this kit have a wear layer" test lie.
			 */
			let wear: GloveWear | null = null
			if (family === 1) {
				const scalars: Record<string, number[]> = {}
				for (const [param, fallback] of SLOT_SCALARS)
					scalars[param] = [1, 2, 3, 4].map(slot => {
						const raw = material.get(`${param}${slot}`)
						const value = raw === undefined ? fallback : Number(raw)
						return round(Number.isFinite(value) ? value : fallback)
					})
				const offset = vec(material.get('g_fGrungeTexCoordOffset')) ?? [0, 0]
				wear = {
					detail: [1, 2, 3, 4].map(slot => texture(`g_tDetail${slot}`)),
					grunge: [1, 2, 3, 4].map(slot => texture(`g_tGrunge${slot}`)),
					noise: texture('g_tNoise'),
					scalars,
					damageLevels: [1, 2, 3, 4].map(slot => damageLevelsOf(material, slot)),
					// Default(1) — and it is an EXPONENT, so a missing one must be 1 and never 0.
					wearExponent: round(Number(material.get('g_fWearExponent') ?? 1)),
					grungeScale: round(Number(material.get('g_fGrungeTexCoordScale') ?? 2.5)),
					grungeRotation: round(Number(material.get('g_fGrungeTexCoordRotation') ?? 0)),
					grungeOffset: [round(offset[0] ?? 0), round(offset[1] ?? 0)],
				}
			}

			/*
			 * THE PATTERN, family 1 only, and gated on `F_PATTERN` rather than on `g_tPattern`.
			 *
			 * `g_vPatternPaletteIndices` names FOUR of the eight tints, 1-based, and the pattern's own
			 * RGB blend between them — so the indices are resolved to the tints themselves here. That
			 * is not just convenience: GLSL ES 1.00 restricts uniform-array indexing to
			 * constant-index-expressions, and `uTints[uPalette[0]]` is not one. Resolving at dump time
			 * removes the dynamic index rather than working around it with an eight-way scan.
			 *
			 * The indices are read as FLOATS because that is how the `.vmat` writes them —
			 * `"[1.000000 7.000000 5.000000 3.000000]"` — and clamped, because an out-of-range index
			 * would reach past the eight tints. Valve's own files stay in 1..8; the clamp is so that a
			 * future one that does not produces the first tint rather than an undefined read.
			 */
			let pattern: GlovePattern | null = null
			if (family === 1 && material.get('F_PATTERN') === '1') {
				const indices = vec(material.get('g_vPatternPaletteIndices')) ?? [1, 1, 1, 1]
				const offset = vec(material.get('g_fPatternTexCoordOffset')) ?? [0, 0]
				const flip = material.get('g_bFlipFixup') === '1'
				// Default(2.5) in the .vfx, and 0 would collapse the pattern to one texel.
				const patternScale = Number(material.get('g_fPatternTexCoordScale') ?? 2.5)
				pattern = {
					texture: texture('g_tPattern'),
					mode: Number(material.get('g_nPatternMode') ?? 0),
					// `Expression(this-1)`. The `.vmat` value is 1-based; the shader's array is not.
					replaceIndex: Math.min(7, Math.max(0, Number(material.get('g_nPatternReplaceIndex') ?? 1) - 1)),
					palette: indices.slice(0, 4).map(i => tints[Math.min(7, Math.max(0, Math.round(i) - 1))]),
					xform: patternXform(Number(material.get('g_fPatternTexCoordRotation') ?? 0), patternScale, offset, flip),
					scale: round(patternScale),
					flipFixup: flip ? -1 : 1,
					metalness: Number(material.get('g_fPatternMetalness') ?? 0),
				}
			}

			/*
			 * THE SOURCE2 LAYER, family 2 only.
			 *
			 * Emitted whole or not at all, like the Source1 wear row and for the same reason: a
			 * half-filled one would make the renderer's "does this kit have a Source2 layer" test lie,
			 * and the fallback (increment 1's flat slot mean) is at least honestly flat.
			 */
			let source2: GloveSource2 | null = null
			if (family === 2) {
				const scalars: Record<string, number[]> = {}
				for (const [param, fallback] of SOURCE2_SCALARS)
					scalars[param] = [1, 2, 3, 4].map(slot => {
						const raw = material.get(`${param}${slot}`)
						const value = raw === undefined ? fallback : Number(raw)
						return round(Number.isFinite(value) ? value : fallback)
					})
				// Both softnesses are compiled expressions and the bevel's READS the height's, so they
				// overwrite the raw reads above rather than being read alongside them.
				const softness = [1, 2, 3, 4].map(slot => source2Softness(material, slot))
				scalars.g_fDamageHeightBlendSoftness = softness.map(s => s[0])
				scalars.g_fDamageBevelBlendSoftness = softness.map(s => s[1])

				const ranges: Record<string, number[][]> = {}
				for (const param of SOURCE2_RANGES)
					ranges[param] = [1, 2, 3, 4].map(slot => {
						const raw = vec(material.get(`${param}${slot}`)) ?? [0, 0]
						return [round(raw[0] ?? 0), round(raw[1] ?? 0)]
					})

				const adjust: Record<string, number[][]> = {}
				for (const [name, tint, prefix, average] of SOURCE2_ADJUSTS)
					adjust[name] = [1, 2, 3, 4].map(slot =>
						colorAdjustMatrix(material, reflectivity, tint, prefix, average, slot),
					)

				source2 = {
					textures: SOURCE2_TEXTURES.flatMap(role => [1, 2, 3, 4].map(slot => texture(`${role}${slot}`))),
					uv: [1, 2, 3, 4].map(slot => {
						const scale = vec(material.get(`g_vUvScale${slot}`)) ?? [4, 4]
						const offset = vec(material.get(`g_vUvOffset${slot}`)) ?? [0, 0]
						return [round(scale[0]), round(scale[1]), round(offset[0] ?? 0), round(offset[1] ?? 0)]
					}),
					adjust,
					scalars,
					ranges,
					damageXform: source2Xform(
						Number(material.get('g_fDamageTexCoordRotation') ?? 0),
						[1, 1],
						[0.5, 0.5],
						vec(material.get('g_vDamageTexCoordOffset')) ?? [0, 0],
					),
					grimeXform: source2Xform(
						Number(material.get('g_fGrimeTexCoordRotation') ?? 0),
						[1, 1],
						[0.5, 0.5],
						vec(material.get('g_vGrimeTexCoordOffset')) ?? [0, 0],
					),
					pattern:
						material.get('F_PATTERN') === '1'
							? {
									texture: texture('g_tPattern'),
									xform: source2Xform(
										Number(material.get('g_fPatternTexCoordRotation') ?? 0),
										vec(material.get('g_vPatternTexCoordScale')) ?? [1, 1],
										vec(material.get('g_vPatternTexCoordCenter')) ?? [0.5, 0.5],
										vec(material.get('g_vPatternTexCoordOffset')) ?? [0, 0],
									),
									flipFixup: material.get('g_bFlipFixup') === '1' ? -1 : 1,
									mipBias: round(Number(material.get('g_fSubstratePatternMipBias') ?? 0)),
									// Default(1) on id 1 and 0 on the other seven — a kit that names none
									// still prints on id 1.
									ids: [1, 2, 3, 4, 5, 6, 7, 8].map(id =>
										Number(material.get(`g_bId${id}Pattern`) ?? (id === 1 ? 1 : 0)),
									),
									respectsTintMask: Number(material.get('g_fPatternPaintRespectsTintMask') ?? 0),
									paintLayer: material.get('F_PATTERN_PAINT') === '1' ? 1 : 0,
									puffy: material.get('F_PUFFY_PAINT') === '1' ? 1 : 0,
									threshold: round(Number(material.get('g_fPatternTranslucencyThreshold') ?? 0.01)),
									cloth: round(Number(material.get('g_fPatternCloth') ?? 0)),
								}
							: null,
				}
			}

			finishes[paint] = {
				kit,
				family,
				tints,
				tintCoverage: family === 2 ? coverage : null,
				slotTints: family === 2 ? slotTints : null,
				regionTexture: family === 2 ? texture('g_tTintId') : texture('g_tLayerMask'),
				slotTexture: family === 2 ? texture('g_tLayerId') : texture('g_tLayerMask'),
				propertiesTexture: family === 2 ? texture('g_tObjectProperties') : texture('g_tSurface'),
				normalTexture: texture('g_tNormal'),
				// Family 2 has no equivalent: its filter radius is exactly one texel of g_tTintId.
				colorMaskBlur: family === 2 ? 0 : Number(material.get('g_fColorMaskBlur') ?? 1),
				previewModel: material.get('PreviewModel') ?? null,
				wear,
				pattern,
				metalness:
					family === 1 ? [1, 2, 3, 4].map(slot => round(Number(material.get(`g_fDetailMetalness${slot}`) ?? 0))) : null,
				source2,
			}
		}

		const kits = Object.keys(finishes).length
		console.log(`  ${kits} kits resolved, ${missing.length} missing`)
		for (const line of missing) console.log(`    ! ${line}`)
		if (missing.length > 0)
			throw new Error(`${missing.length} glove kit(s) unresolved — refusing to write a partial table.`)

		// A kit with neither region map renders as ONE flat colour over the whole glove, which is a
		// plausible-looking wrong answer rather than an obvious one. Fail instead. (`region` alone may
		// legitimately be null: three family-2 kits ship no `g_tTintId` and are coloured entirely by
		// their four slots.)
		const blind = Object.entries(finishes).filter(
			([, f]) => (!f.regionTexture && !f.slotTexture) || !f.propertiesTexture,
		)
		if (blind.length > 0)
			throw new Error(`no region/properties texture for: ${blind.map(([p, f]) => `${p} ${f.kit}`).join(', ')}`)

		/*
		 * A Source1 kit with no textiles would render as the flat tint at every float, which is the
		 * exact symptom this increment exists to remove — and it would do it silently, one kit at a
		 * time. Every one of the 72 declares all four `g_tDetail*` and all four `g_tGrunge*`; if a
		 * Valve update ever ships one that does not, say so here rather than in a screenshot.
		 */
		const wearless = Object.entries(finishes).filter(
			([, f]) => f.family === 1 && (!f.wear || f.wear.detail.some(t => !t) || f.wear.grunge.some(t => !t)),
		)
		if (wearless.length > 0)
			console.log(`  ! ${wearless.length} Source1 kit(s) missing a textile or grunge map — they render flat:`)
		for (const [paint, f] of wearless) console.log(`    ! ${paint} ${f.kit}`)

		/*
		 * The Source2 equivalent, and it is LOUD rather than a warning.
		 *
		 * A family-2 kit that lost one of its 32 maps renders the flat slot mean — which is exactly
		 * what all 22 of them rendered before this layer existed, and is therefore invisible as a
		 * regression. Every one of the 22 declares a full set today; a Valve update that ships one
		 * that does not should stop the dump, not be discovered in a screenshot four weeks later.
		 */
		const halfSource2 = Object.entries(finishes).filter(
			([, f]) => f.family === 2 && (!f.source2 || f.source2.textures.some(t => !t)),
		)
		if (halfSource2.length > 0)
			throw new Error(
				`incomplete Source2 layer on: ${halfSource2
					.map(([p, f]) => `${p} ${f.kit} (${f.source2?.textures.filter(t => !t).length ?? 32} unresolved)`)
					.join(', ')}`,
			)

		const byFamily = [1, 2].map(f => Object.values(finishes).filter(v => v.family === f).length)
		const target = join(dataDir, 'gloveFinish.data.ts')
		writeFileSync(target, emit(finishes, byFamily))
		console.log(`wrote ${target} — ${kits} kits (${byFamily[0]} Source1, ${byFamily[1]} Source2)`)
	} finally {
		rmSync(scratch, { recursive: true, force: true })
	}
}

const emit = (finishes: Record<string, GloveFinish>, byFamily: number[]) => {
	const rows = Object.entries(finishes)
		.sort((a, b) => Number(a[0]) - Number(b[0]))
		.map(([paint, f]) => {
			const tints = f.tints.map(t => `[${t.join(',')}]`).join(',')
			const cov = f.tintCoverage ? `[${f.tintCoverage.join(',')}]` : 'null'
			const slotTints = f.slotTints ? `[${f.slotTints.map(t => `[${t.join(',')}]`).join(',')}]` : 'null'
			const s = (v: string | null) => (v === null ? 'null' : JSON.stringify(v))
			const paths = (v: (string | null)[]) => `[${v.map(s).join(',')}]`
			const wear = f.wear
				? `{ detail: ${paths(f.wear.detail)}, grunge: ${paths(f.wear.grunge)}, noise: ${s(f.wear.noise)}, ` +
					`scalars: { ${Object.entries(f.wear.scalars)
						.map(([k, v]) => `${k}: [${v.join(',')}]`)
						.join(', ')} }, ` +
					`damageLevels: [${f.wear.damageLevels.map(v => `[${v.join(',')}]`).join(',')}], ` +
					`wearExponent: ${f.wear.wearExponent}, grungeScale: ${f.wear.grungeScale}, ` +
					`grungeRotation: ${f.wear.grungeRotation}, grungeOffset: [${f.wear.grungeOffset.join(',')}] }`
				: 'null'
			const nums = (v: number[]) => `[${v.join(',')}]`
			const rows2 = (v: number[][]) => `[${v.map(nums).join(',')}]`
			const record = (v: Record<string, number[]>) =>
				`{ ${Object.entries(v)
					.map(([k, n]) => `${k}: ${nums(n)}`)
					.join(', ')} }`
			const record2 = (v: Record<string, number[][]>) =>
				`{ ${Object.entries(v)
					.map(([k, n]) => `${k}: ${rows2(n)}`)
					.join(', ')} }`
			const s2 = f.source2
			const source2 = s2
				? `{ textures: ${paths(s2.textures)}, uv: ${rows2(s2.uv)}, adjust: ${record2(s2.adjust)}, ` +
					`scalars: ${record(s2.scalars)}, ranges: ${record2(s2.ranges)}, ` +
					`damageXform: ${nums(s2.damageXform)}, grimeXform: ${nums(s2.grimeXform)}, ` +
					`pattern: ${
						s2.pattern
							? `{ texture: ${s(s2.pattern.texture)}, xform: ${nums(s2.pattern.xform)}, ` +
								`flipFixup: ${s2.pattern.flipFixup}, mipBias: ${s2.pattern.mipBias}, ` +
								`ids: ${nums(s2.pattern.ids)}, respectsTintMask: ${s2.pattern.respectsTintMask}, ` +
								`paintLayer: ${s2.pattern.paintLayer}, puffy: ${s2.pattern.puffy}, ` +
								`threshold: ${s2.pattern.threshold}, cloth: ${s2.pattern.cloth} }`
							: 'null'
					} }`
				: 'null'
			const pattern = f.pattern
				? `{ texture: ${s(f.pattern.texture)}, mode: ${f.pattern.mode}, ` +
					`replaceIndex: ${f.pattern.replaceIndex}, ` +
					`palette: [${f.pattern.palette.map(t => `[${t.join(',')}]`).join(',')}], ` +
					`xform: [${f.pattern.xform.join(',')}], scale: ${f.pattern.scale}, ` +
					`flipFixup: ${f.pattern.flipFixup}, ` +
					`metalness: ${f.pattern.metalness} }`
				: 'null'
			return (
				`\t${paint}: { kit: ${JSON.stringify(f.kit)}, family: ${f.family}, tints: [${tints}], ` +
				`tintCoverage: ${cov}, slotTints: ${slotTints}, region: ${s(f.regionTexture)}, ` +
				`slots: ${s(f.slotTexture)}, properties: ${s(f.propertiesTexture)}, ` +
				`normal: ${s(f.normalTexture)}, blur: ${f.colorMaskBlur}, wear: ${wear}, ` +
				`pattern: ${pattern}, metalness: ${f.metalness ? `[${f.metalness.join(',')}]` : 'null'}, ` +
				`source2: ${source2} },`
			)
		})

	return `// GENERATED by dump-glove-finish.ts — do not edit by hand.
//
// One row per glove PAINT INDEX: the eight tints of \`csgo_customglove.vfx\`, the maps that select
// between them, the object AO, and — on the ${byFamily[0]} Source1 kits — the whole wear layer that float and
// seed drive. ${byFamily[0]} kits are the Source1 texture layout and ${byFamily[1]} the Source2 one; see the
// generator's header for why the two carry their tints in different colour spaces, and
// \`gloveFinish.ts\` / \`gloveWear.ts\` for what is done with them.
//
// Texture paths are export-relative, exactly like \`manifest.json\`'s.

export type GloveFinishRow = {
	/** Paint-kit name, for cross-checking against \`manifest.json\`. */
	kit: string
	/**
	 * 1 = Source1 texture layout (\`g_vColorTint*\`, \`g_tLayerMask\`), 2 = Source2 (\`g_vId*Color\`,
	 * \`g_tTintId\` + \`g_tLayerId\`). The two blend their tints in DIFFERENT colour spaces.
	 */
	family: 1 | 2
	/** Eight RGB tints. Family 1 is GAMMA (blend, then linearise); family 2 is already LINEAR. */
	tints: number[][]
	/** Family 2's \`g_vIdNColor.w\` — 1 where the kit paints that id, 0 where it leaves it alone. */
	tintCoverage: number[] | null
	/**
	 * Family 2's four material slots' own colour, LINEAR. The base the id tints re-tint, and the ONLY
	 * colour on the three kits that ship no \`g_tTintId\`.
	 */
	slotTints: number[][] | null
	/**
	 * The region index map. Family 1 reads its ALPHA (\`floor(a*8)\`); family 2 its RED (\`ceil(r*7)\`).
	 * Null on the three family-2 kits with no \`g_tTintId\`.
	 */
	region: string | null
	/** Four-way material-slot weights. Family 1 shares the region map's RGB; family 2 has its own. */
	slots: string | null
	/** Family 1: (curvature, AO, high-touch, durability). Family 2: (AO, curvature, high-touch). */
	properties: string | null
	/** The glove model's own hemi-octahedral normal map. */
	normal: string | null
	/** \`g_fColorMaskBlur\` — family 1's region-filter radius, in 1/1024 uv. 0 on family 2. */
	blur: number
	/**
	 * Everything FLOAT and SEED drive: the four textiles, the four grunge maps, the noise map, and
	 * every per-slot scalar the \`g_fWearProgress\` chain multiplies through.
	 *
	 * FAMILY 1 ONLY, and null is load-bearing — \`gloveWear.ts\` reads it as "this kit has no wear
	 * layer" and falls back to the flat tint. Family 2 (\`g_tSurface1..4\` + height blending +
	 * \`g_tGrime1..4\`, 1849 lines of GLSL against Source1's 906) is a separate increment.
	 */
	wear: GloveWearRow | null
	/**
	 * The PRINT — \`F_PATTERN\`, and everything that places and colours it.
	 *
	 * FAMILY 1 ONLY. Null on the 17 Source1 kits that leave \`F_PATTERN\` at 0 (all of which still
	 * NAME a \`g_tPattern\`, and it is \`materials/default/default_tga\` on every one), and on all 22
	 * Source2 kits, whose pattern is a parallaxed substrate layer under a different set of
	 * parameters — see \`gloveFinish.ts\`.
	 */
	pattern: GlovePatternRow | null
	/**
	 * \`g_fDetailMetalness1..4\`, blended by \`g_tLayerMask.RGB\` with the shader's nested \`mix\`.
	 * FAMILY 1 ONLY — Source2 carries its metalness in \`g_tPatternProperties.r\` instead.
	 *
	 * 34 of the 72 Source1 kits set at least one of them. This is the whole of Source1's metalness
	 * INPUT: \`F_OUTPUT_MODE 2\` blends these four, crossfades the result toward
	 * \`pattern.metalness\` over the pattern's coverage, and writes it — no texture involved.
	 */
	metalness: number[] | null
	/**
	 * The Source2 substrate/surface/height/damage/grime layer — everything the ${byFamily[1]} Source2 kits
	 * need to show their PRINT and to respond to FLOAT. FAMILY 2 ONLY; null on family 1, where
	 * \`wear\` and \`pattern\` carry the same job under a different parameter set.
	 *
	 * Null here is load-bearing exactly as \`wear\` is: \`gloveSource2.ts\` reads it as "this kit has no
	 * Source2 layer" and falls back to the flat slot mean of increment 1.
	 */
	source2: GloveSource2Row | null
}

/**
 * One Source2 kit's substrate/surface layer. See \`GloveFinishRow.source2\`.
 *
 * Every per-slot value is FOUR numbers and every texture role is FOUR paths, because
 * \`csgo_customglove\`'s Source2 layout accumulates all four material slots — textures and scalars
 * alike — by the \`g_tLayerId\` weights BEFORE it composites anything.
 */
export type GloveSource2Row = {
	/**
	 * 32 paths: \`g_tSurface1..4\`, \`g_tSubstrate1..4\`, \`g_tSurfaceProperties1..4\`,
	 * \`g_tSubstrateProperties1..4\`, \`g_tDamage1..4\`, \`g_tGrime1..4\`, \`g_tSurfaceNormal1..4\`,
	 * \`g_tSubstrateNormal1..4\` — the layer order of the renderer's one \`sampler2DArray\`.
	 *
	 * Albedo and grime are \`SrgbRead(true)\` and everything else is linear; the ALPHA of an albedo is
	 * its TINT MASK and is never sRGB. The normals are bound for their ROUGHNESS pair (R, B) only.
	 */
	textures: (string | null)[]
	/** \`g_vUvScale1..4\` / \`g_vUvOffset1..4\` as \`[scaleX, scaleY, offsetX, offsetY]\`. */
	uv: number[][]
	/**
	 * The five \`g_m*ColorAdjust1..4\`, keyed \`surface\` / \`substrate\` / \`damage\` /
	 * \`surfaceBurnish\` / \`substrateBurnish\`; four slots of TWELVE, a 3x4 affine in row-major order
	 * so that \`out.k = dot( row[k].xyz, colour ) + row[k].w\`.
	 */
	adjust: Record<string, number[][]>
	/** Keyed by \`csgo_customglove.vfx\` parameter name; four numbers each, in slot order. */
	scalars: Record<string, number[]>
	/** The per-slot \`float2\` ranges, four \`[min, max]\` pairs each. */
	ranges: Record<string, number[][]>
	/** \`g_vDamageTexCoordXform0/1\` as \`[a0.x, a0.y, a0.w, a1.x, a1.y, a1.w]\`. */
	damageXform: number[]
	/** \`g_vGrimeTexCoordXform0/1\`, same shape. */
	grimeXform: number[]
	/** \`F_PATTERN\` and everything that places and gates the print. Null on the 7 kits without one. */
	pattern: GloveSource2PatternRow | null
}

/** One Source2 kit's print. See \`GloveSource2Row.pattern\`. */
export type GloveSource2PatternRow = {
	/** \`g_tPattern\`. Source2 declares it \`SrgbRead(true)\` — the OPPOSITE of Source1's declaration. */
	texture: string | null
	/** Source2's own \`g_vPatternTexCoordXform0/1\`, \`[X0.x, X0.y, X0.w, X1.x, X1.y, X1.w]\`. */
	xform: number[]
	/** \`g_fFlipFixup\` — the VERTEX shader negates u BEFORE the transform. */
	flipFixup: number
	/** \`g_fSubstratePatternMipBias\` — the substrate reads the print through a blurrier mip. */
	mipBias: number
	/** \`g_bId1..8Pattern\` — which of the eight tint ids the print may cover. */
	ids: number[]
	/** \`g_fPatternPaintRespectsTintMask\` — 0 lets the print widen the textile's own tint mask. */
	respectsTintMask: number
	/** \`F_PATTERN_PAINT\` — 1 makes the print a straight OVERLAY rather than a re-tint. */
	paintLayer: number
	/** \`F_PUFFY_PAINT\` — 1 thresholds the print's alpha and embosses it. */
	puffy: number
	/** \`g_fPatternTranslucencyThreshold\`. */
	threshold: number
	/** \`g_fPatternCloth\` — the cloth value the overlay imposes. Paint-layer kits only. */
	cloth: number
}

/** One Source1 kit's pattern. See \`GloveFinishRow.pattern\`. */
export type GlovePatternRow = {
	/** \`g_tPattern\`. Source1 declares it \`SrgbRead(false)\`, so it is read RAW and linearised here. */
	texture: string | null
	/**
	 * \`g_nPatternMode\` — 0 Indexed, 1 Unmasked Indexed, 2 Bitmap, 3 Unmasked Bitmap.
	 * Under 2 the texture's RGB are BLEND WEIGHTS over \`palette\`; at 2 and above they are the
	 * colour outright. The odd values drop the region mask and cover the whole glove.
	 */
	mode: number
	/** \`g_nPatternReplaceIndex\`, ALREADY 0-based — the \`Expression(this-1)\` is applied at dump. */
	replaceIndex: number
	/** The four tints \`g_vPatternPaletteIndices\` names, resolved. GAMMA, exactly like \`tints\`. */
	palette: number[][]
	/**
	 * \`[X0.x, X0.y, X0.w, X1.x, X1.y, X1.w]\` of \`g_vPatternTexCoordXform0/1\`, as AUTHORED.
	 *
	 * Dead for an econ instance and kept anyway. The seed rolls \`g_fPatternTexCoordOffset\` and
	 * \`g_fPatternTexCoordRotation\` and \`COPY_MATCHING_KEYS instance_params\` writes the rolled values
	 * over the material, so \`glovePatternXform( scale, rolledRotation, rolledOffset, flip )\` replaces
	 * this pair on every item that has a seed. It is what the material shows in Hammer, and what a
	 * NEGATIVE seed — an item with no econ instance behind it — still renders.
	 */
	xform: number[]
	/**
	 * \`g_fPatternTexCoordScale\` — the ONE placement term the seed does not touch.
	 *
	 * It is not in the composite's \`instance_params\` list (only the offset and the rotation are), so
	 * the authored scale stands on every item and \`glovePatternXform\` needs it to rebuild the pair
	 * above. Emitted rather than recovered from \`xform\` — \`hypot( X0.x, X0.y )\` IS this number, and
	 * \`glove-models.test.ts\` asserts the two agree on all 55 kits, but the shader should not have to
	 * know that the linear part is a scaled rotation to find out how big the print is.
	 */
	scale: number
	/** \`g_fFlipFixup\` — \`g_bFlipFixup ? -1 : 1\`, applied to u BEFORE \`xform\`. 20 kits set it. */
	flipFixup: number
	/** \`g_fPatternMetalness\` — what the covered region's metalness is crossfaded toward. */
	metalness: number
}

/**
 * The Source1 wear inputs for one kit.
 *
 * Every scalar is FOUR numbers, one per material slot, blended by \`g_tLayerMask.RGB\` with the same
 * nested \`mix\` the textiles use. \`scalars\` is keyed by the shader's own parameter name so that a
 * reader can be checked against \`csgo_customglove.vfx\` without a translation table in between.
 */
export type GloveWearRow = {
	/** \`g_tDetail1..4\` — RGBA, LINEAR. (x, y) heights, z the damage mask, w the roughness. */
	detail: (string | null)[]
	/** \`g_tGrunge1..4\` — RGBA, \`SrgbRead(true)\`. RGB the dirt colour, A the wear-mask modulation. */
	grunge: (string | null)[]
	/** \`g_tNoise\` — RGBA, \`SrgbRead(true)\`. Drives the cloth sheen's two-way hue mix. */
	noise: string | null
	/** Keyed by \`csgo_customglove.vfx\` parameter name; four numbers each, in slot order. */
	scalars: Record<string, number[]>
	/** \`g_vDamageLevels1..4\`, \`[lo, hi]\` AS AUTHORED — some kits author them descending. */
	damageLevels: number[][]
	/** \`g_fWearExponent\` — Source1's \`g_fWearProgress\` is \`pow(itemFloat, this)\`. */
	wearExponent: number
	/** \`g_fGrungeTexCoordScale\` — authored, and the seed does NOT roll it. */
	grungeScale: number
	/** \`g_fGrungeTexCoordRotation\`, DEGREES. The seed rolls this over 0..360. */
	grungeRotation: number
	/** \`g_fGrungeTexCoordOffset\`. The seed rolls both components over 0..1. */
	grungeOffset: number[]
}

export const GLOVE_FINISHES: Record<number, GloveFinishRow> = {
${rows.join('\n')}
}

/** The finish for a glove paint index, or null for a kit with no recipe (paint 0, the default). */
export const getGloveFinish = (paintIndex: number): GloveFinishRow | null => GLOVE_FINISHES[paintIndex] ?? null
`
}

// One line for anything the operator can fix, a stack trace for anything they cannot — the same
// contract `export.ts` and `publish.ts` hold. A missing CLI or a wrong `--out` is not a crash.
try {
	await main()
} catch (err) {
	if (err instanceof UserError) {
		console.error(`\nerror: ${err.message}`)
		process.exit(1)
	}
	throw err
}
