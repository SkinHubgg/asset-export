// Reads the per-weapon composite-input materials into data/weapon-composite-params.json and
// data/composite-substrate.json.
//
// Why this matters more than it looks: the pattern/wear/grunge UV transform DIVIDES by
// g_flUvScale1, and that value is a per-WEAPON layer constant, not a paint-kit one. Every paint
// kit in items_game carries the placeholder 1.0, but the real values run 0.361 (P2000) to 1.300
// (M249). Using the placeholder renders a Glock's pattern 2.7x too large and an AK's 1.3x too
// large, which no paint seed can compensate for.
//
//   bun run extract-weapon-params.ts
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileNameOf } from './platform'

const OUT = resolve(process.env.CS2_EXPORT_OUT ?? join(import.meta.dir, 'out'))
const walkAll = (dir: string, out: string[] = []): string[] => {
	if (!existsSync(dir)) return out
	for (const f of readdirSync(dir)) {
		const p = join(dir, f)
		if (statSync(p).isDirectory()) walkAll(p, out)
		else out.push(p)
	}
	return out
}
const walk = (dir: string): string[] => walkAll(dir).filter(p => p.endsWith('_composite_inputs.vmat'))

const params: Record<string, { uvScale1: number | null; weaponLength: number | null }> = {}
for (const file of walk(join(OUT, 'weaponcompmats'))) {
	// Guns are weapon_<stem>_composite_inputs.vmat; knives are <knife_x>_composite_inputs.vmat with
	// no weapon_ prefix, so matching only the prefixed form silently dropped all 20 of them.
	// `fileNameOf`, not `split('/').pop()`: `walkAll` builds these with `join()`, so on Windows the
	// split returns the whole path, the anchored regex matches nothing, and this file writes `{}`.
	const stem = /^(?:weapon_)?([a-z0-9_]+)_composite_inputs\.vmat$/.exec(fileNameOf(file))?.[1]
	if (!stem) continue
	const text = readFileSync(file, 'utf8')
	const read = (key: string) => {
		const m = new RegExp(`"${key}"\\s+"([^"]+)"`).exec(text)
		return m ? Number.parseFloat(m[1]) : null
	}
	const uvScale1 = read('g_flUvScale1')
	const weaponLength = read('g_flWeaponLength1')
	if (uvScale1 === null && weaponLength === null) continue
	params[stem] = { uvScale1, weaponLength }
}

mkdirSync(join(OUT, 'data'), { recursive: true })
writeFileSync(join(OUT, 'data', 'weapon-composite-params.json'), JSON.stringify(params, null, 1))
console.log(`weapon-composite-params.json: ${Object.keys(params).length} weapons`)

/*
 * data/composite-substrate.json — the composite's g_tColor where it is NOT the GLB's.
 *
 * The viewer binds the composite substrate from the GLB's baseColorTexture, which VRF wires from
 * the RENDER material's g_tColor. That is only correct when the weapon's own
 * `*_composite_inputs.vmat` names the same texture — and on ten materials it does not: it names a
 * separate, colour-NEUTRAL `*_substrate_color` map, while the render map carries the weapon's
 * factory colourway (the Glock's coyote frame, the AWP's olive scope, the SCAR-20's tan furniture).
 * Every unpainted texel of those weapons then renders a colour the game never shows under a finish.
 *
 * KEYED BY RENDER MATERIAL NAME, because that is the join the DATA declares: the composite names the
 * material it layers over in `Attributes.layer_name_1`, and the GLB carries the same string as
 * `material.name`. A weapon+mesh-variant key would be a re-derivation that has to be right by hand
 * for each of them — all eight gun materials are HD-only, the two knives sit under the legacy root,
 * and the M249's and Negev's material appears in a second GLB (`*_mag`) under a root named neither
 * `body_hd` nor `body_legacy`. Not by filename either: the Bowie's is
 * `knife_survival_bowie_psd_e7588b32`, with no "substrate" in the name.
 *
 * Emitted ONLY where the two disagree. Everywhere else the composite names the map the GLB already
 * carries, and a consumer that re-fetched it would pull a second copy of an identical 4096².
 * g_tMetalness is deliberately not in here: it disagrees on ZERO shipped materials (the one row that
 * does is test_shape.glb, which is not a weapon), so the GLB's metalnessMap is always right.
 */
const basename = (p: string | null) => (p ? fileNameOf(p) : null)
const readString = (text: string, key: string) => new RegExp(`"${key}"\\s+"([^"]+)"`).exec(text)?.[1] ?? null

// Trees the export uploads TEXTURES under, in resolution preference order. A composite's g_tColor
// path is relative to the game's materials root, so the exported file is <tree>/<that path>.png —
// several trees can hold the same texture (a knife's composite inputs land in both
// weaponcomposite/ and knifecomposite/) and the order below just makes the choice deterministic.
const TEXTURE_TREES = ['weaponcomposite', 'knifecomposite', 'weapontex', 'knifetex', 'position']
const exported = new Set(
	TEXTURE_TREES.flatMap(tree =>
		walkAll(join(OUT, tree)).map(p => relative(OUT, p).replace(/\\/g, '/').replace(/^\.\//, '')),
	),
)
const resolveTexture = (vtexPath: string | null): string | null => {
	if (!vtexPath) return null
	const rel = vtexPath
		.replace(/\\/g, '/')
		.replace(/^\/+/, '')
		.replace(/\.vtex$/i, '.png')
	for (const tree of TEXTURE_TREES) {
		const candidate = `${tree}/${rel}`
		if (exported.has(candidate)) return candidate
	}
	return null
}

// What each composite_inputs material declares, indexed by the render material it layers over.
const compositeColor = new Map<string, string>()
for (const file of [
	...walk(join(OUT, 'weaponcompmats')),
	...walk(join(OUT, 'legacycompmats')),
	...walk(join(OUT, 'knifecomposite')),
]) {
	const text = readFileSync(file, 'utf8')
	// Some layer_name_1 values are mangled by the decompiler's backslash escapes
	// (`weapons\modelsug\materials\weapon_rif_aug.vmat`), but the BASENAME survives intact in every
	// case that matters — and a mangled basename simply fails to match any GLB material below.
	const layer = basename(readString(text, 'layer_name_1'))
	const color = readString(text, 'g_tColor')
	if (!layer || !color) continue
	compositeColor.set(layer.replace(/\.vmat$/i, '').toLowerCase(), color)
}

// The GLB side: what VRF actually wired into baseColorTexture, per material.
const glbColor = new Map<string, string>()
for (const glb of walkAll(join(OUT, 'models')).filter(p => p.endsWith('.glb'))) {
	const buf = new Uint8Array(readFileSync(glb))
	const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
	let offset = 12
	let json: {
		materials?: { name?: string; pbrMetallicRoughness?: { baseColorTexture?: { index: number } } }[]
		textures?: { source: number }[]
		images?: { uri?: string }[]
	} | null = null
	while (offset < buf.length) {
		const length = view.getUint32(offset, true)
		// 0x4e4f534a = 'JSON'; the chunk we want is always the first one in a .glb.
		if (view.getUint32(offset + 4, true) === 0x4e4f534a) {
			json = JSON.parse(new TextDecoder().decode(buf.subarray(offset + 8, offset + 8 + length)))
			break
		}
		offset += 8 + length + ((4 - (length % 4)) % 4)
	}
	for (const material of json?.materials ?? []) {
		const index = material.pbrMetallicRoughness?.baseColorTexture?.index
		const uri = index === undefined ? null : (json?.images?.[json?.textures?.[index]?.source ?? -1]?.uri ?? null)
		if (material.name && uri) glbColor.set(material.name.toLowerCase(), uri)
	}
}

const substrates: Record<string, string> = {}
const unresolved: string[] = []
for (const [material, vtex] of [...compositeColor].sort()) {
	const glb = glbColor.get(material)
	// No GLB ships this material, or the GLB already binds the texture the composite declares.
	if (!glb) continue
	if (basename(glb)!.replace(/\.png$/i, '') === basename(vtex)!.replace(/\.vtex$/i, '')) continue
	const path = resolveTexture(vtex)
	if (!path) {
		unresolved.push(`${material} -> ${vtex}`)
		continue
	}
	substrates[material] = path
}

writeFileSync(join(OUT, 'data', 'composite-substrate.json'), JSON.stringify(substrates, null, 1))
console.log(`composite-substrate.json: ${Object.keys(substrates).length} materials`)
for (const [material, path] of Object.entries(substrates)) console.log(`  ${material.padEnd(24)} ${path}`)
if (unresolved.length) console.log(`  UNRESOLVED (not in the exported texture trees):\n   ${unresolved.join('\n   ')}`)
