/**
 * Per-weapon sticker slot markup — where the game puts each sticker, how big, and how far it may move.
 *
 * SOURCE. Every weapon's `.vmdl_c` carries a `StickerMarkup` array in its DATA block:
 *
 *     StickerMarkup = [
 *       { Index = 0  Mesh = "body_hd"  Offset = [0.148, -0.434]  Scale = 14.100022  Rotation = 0.0
 *         SpecialIdentifier = "Autograph"  Polygons = [ { Vertices = [ … uv pairs … ] } ] },
 *       …
 *     ]
 *
 * That is the `this` in `csgo_weapon.vfx`'s
 * `Expression(exists(ATTRIBUTE[eb878242]) ? ATTRIBUTE[eb878242] : this)` — the slot positions are
 * shipped data, not a table anyone tunes. VRF's reconstructed `.vmdl` drops the block entirely (the
 * same way it drops `AttachmentList` and `KeychainMarkup`), so this reads the RAW `.vmdl_c`.
 *
 * THREE THINGS ONLY THIS SOURCE HAS, and that reading the weapon's `.vmat` instead got wrong:
 *
 *  1. **It is authored PER MESH VARIANT.** The AK's HD markup is `offset [0.148,-0.434] scale 14.10`,
 *     its legacy markup `offset [0.154,-0.438] scale 15.35`. The `.vmat` carries only one set, so
 *     every `legacy_model` kit — Case Hardened among them — placed its stickers at the HD offset and
 *     the HD size, which is a visible, constant misplacement.
 *  2. **`Polygons` is the legal region**, in the sticker uv set: the boundary a drag has to stay
 *     inside. Emitted BOTH as its bounding box (cheap, and the outer bound a clamp can start from)
 *     and as the triangle soup itself, because the box is not the region: on the AK the polygon
 *     covers **25.7%** of its own bounding box (26.5% on the legacy mesh), so three quarters of what
 *     a box clamp allows is somewhere the game would never put a sticker. The soup is emitted ONCE
 *     per model folder + mesh variant — every slot of a variant shares one polygon on all 35
 *     weapons, which the generator asserts rather than assumes.
 *  3. **`SpecialIdentifier`** names the slot the way the game does — `Autograph`, `Team1`, `Team2`,
 *     `Map` — so the UI can label slots rather than number them.
 *
 * A slot index the markup omits does not exist on that weapon: the AK authors four, not five. The
 * PRODUCT ships five anyway, by explicit decision — see `deriveFifthSlot` in `stickerSlots.ts`, which
 * is ours and deliberately NOT game data.
 *
 *   bun run dump-sticker-slots.ts
 *   bun run dump-sticker-slots.ts --cs2 "D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive"
 *
 * Writes `<out>/data/stickerSlots.data.ts`; copy it into your viewer from there. Same overrides as
 * the exporter: `--cs2` / `CS2_PATH` for the install, `--cli` / `SOURCE2VIEWER_CLI` for the
 * decompiler, `--out` / `CS2_EXPORT_OUT` for the export directory it writes into.
 */

import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { UserError, cliPath, findCs2Pak, generatedDataDir, relSlash, requireCli } from './platform'

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

const walk = (dir: string, ext: string, out: string[] = []) => {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) walk(path, ext, out)
		else if (path.endsWith(ext)) out.push(path)
	}
	return out
}

type Slot = {
	index: number
	offset: [number, number]
	scale: number
	rotation: number
	special: string | null
	bounds: [number, number, number, number] | null
	/** `Polygons[].Vertices` flattened: uv pairs, three per triangle. */
	region: number[]
}

/**
 * The DATA block is KV3 text. A real KV3 parser is not needed for four scalars and one flat float
 * list, and would be a dependency to keep working; this walks the array by bracket depth, which is
 * stable against field order and against Valve adding fields.
 */
const parseStickerMarkup = (text: string) => {
	const start = text.indexOf('StickerMarkup =')
	if (start < 0) return []
	const open = text.indexOf('[', start)
	if (open < 0) return []
	let depth = 0
	let end = -1
	for (let i = open; i < text.length; i++) {
		if (text[i] === '[') depth++
		else if (text[i] === ']' && --depth === 0) {
			end = i
			break
		}
	}
	if (end < 0) return []
	const body = text.slice(open + 1, end)

	const entries: string[] = []
	let braces = 0
	let entryStart = -1
	for (let i = 0; i < body.length; i++) {
		if (body[i] === '{') {
			if (braces === 0) entryStart = i + 1
			braces++
		} else if (body[i] === '}') {
			braces--
			if (braces === 0 && entryStart >= 0) {
				entries.push(body.slice(entryStart, i))
				entryStart = -1
			}
		}
	}

	const results: { mesh: string; slot: Slot }[] = []
	for (const entry of entries) {
		const num = (key: string) => {
			const match = entry.match(new RegExp(`${key}\\s*=\\s*(-?[0-9.eE+]+)`))
			return match ? Number.parseFloat(match[1]) : null
		}
		const vec2 = (key: string) => {
			const match = entry.match(new RegExp(`${key}\\s*=\\s*\\[\\s*(-?[0-9.eE+]+)\\s*,\\s*(-?[0-9.eE+]+)`))
			return match ? ([Number.parseFloat(match[1]), Number.parseFloat(match[2])] as [number, number]) : null
		}
		const str = (key: string) => entry.match(new RegExp(`${key}\\s*=\\s*"([^"]*)"`))?.[1] ?? null

		const index = num('Index')
		const offset = vec2('Offset')
		const scale = num('Scale')
		const mesh = str('Mesh')
		if (index === null || index < 0 || !offset || scale === null || !mesh) continue

		// Every `Vertices = [ … ]` in this entry, flattened. They are uv PAIRS, three per triangle.
		let bounds: [number, number, number, number] | null = null
		const region: number[] = []
		for (const match of entry.matchAll(/Vertices\s*=\s*\[([^\]]*)\]/g)) {
			const values = match[1]
				.split(',')
				.map(v => Number.parseFloat(v.trim()))
				.filter(Number.isFinite)
			for (let i = 0; i + 1 < values.length; i += 2) {
				const [u, v] = [values[i], values[i + 1]]
				region.push(u, v)
				bounds = bounds
					? [Math.min(bounds[0], u), Math.min(bounds[1], v), Math.max(bounds[2], u), Math.max(bounds[3], v)]
					: [u, v, u, v]
			}
		}

		results.push({
			mesh,
			slot: {
				index,
				offset,
				scale,
				rotation: num('Rotation') ?? 0,
				special: str('SpecialIdentifier'),
				bounds,
				region,
			},
		})
	}
	return results
}

const round = (value: number) => Math.round(value * 1e6) / 1e6

const main = async () => {
	requireCli(CLI)
	const pak = cs2Pak()
	// Before the decompiler, not after it: the table is written at the end of a multi-minute
	// extraction, and a bad `--out` should cost a second rather than the whole run.
	const dataDir = generatedDataDir(OUT)
	const temp = mkdtempSync(join(tmpdir(), 'cs2-sticker-markup-'))
	try {
		mkdirSync(temp, { recursive: true })
		// RAW, with no -d.
		const extract = Bun.spawn([CLI, '-i', pak, '-o', temp, '-e', 'vmdl_c', '-f', 'weapons/models/'], {
			stdout: 'pipe',
			stderr: 'pipe',
		})
		await extract.exited
		const files = walk(temp, '.vmdl_c')
		console.log(`vmdl_c extracted : ${files.length}`)

		const table: Record<string, { hd: (Slot | null)[]; legacy: (Slot | null)[] }> = {}
		// One legal region per model folder + variant. Every slot of a variant carries the same
		// `Polygons` on all 35 weapons; a disagreement is reported rather than silently resolved,
		// because it would mean the region is per SLOT and this dedupe is wrong.
		const regions: Record<string, { hd: number[] | null; legacy: number[] | null }> = {}
		const regionConflicts: string[] = []
		let withMarkup = 0

		for (const file of files) {
			const dump = Bun.spawn([CLI, '-i', file, '-b', 'DATA'], { stdout: 'pipe', stderr: 'pipe' })
			const text = await new Response(dump.stdout).text()
			await dump.exited
			const markup = parseStickerMarkup(text)
			if (!markup.length) continue
			withMarkup++
			// `relSlash` and not a bare `split('/')`: `walk` builds these with `join()`, which emits `\`
			// on Windows, where splitting on `/` yields one segment and `.at(-2)` is undefined — every
			// model would hit the `continue` below and the table would be written empty.
			const folder = relSlash(temp, file).split('/').at(-2)
			if (!folder) continue
			const entry = table[folder] ?? { hd: [null, null, null, null, null], legacy: [null, null, null, null, null] }
			const regionEntry = regions[folder] ?? { hd: null, legacy: null }
			for (const { mesh, slot } of markup) {
				if (slot.index > 4) continue
				const legacy = /legacy/i.test(mesh)
				const variant = legacy ? entry.legacy : entry.hd
				variant[slot.index] = {
					...slot,
					offset: [round(slot.offset[0]), round(slot.offset[1])],
					scale: round(slot.scale),
					rotation: round(slot.rotation),
					bounds: slot.bounds ? (slot.bounds.map(round) as [number, number, number, number]) : null,
					region: [],
				}
				if (!slot.region.length) continue
				const rounded = slot.region.map(round)
				const existing = legacy ? regionEntry.legacy : regionEntry.hd
				if (!existing) {
					if (legacy) regionEntry.legacy = rounded
					else regionEntry.hd = rounded
				} else if (existing.length !== rounded.length || existing.some((v, i) => v !== rounded[i])) {
					regionConflicts.push(`${folder} ${mesh} slot ${slot.index}`)
				}
			}
			regions[folder] = regionEntry
			table[folder] = entry
		}

		const emitSlot = (slot: Slot | null) =>
			slot
				? `{ offset: [${slot.offset[0]}, ${slot.offset[1]}], scale: ${slot.scale}, rotation: ${slot.rotation}, special: ${
						slot.special ? `'${slot.special}'` : 'null'
					}, bounds: ${slot.bounds ? `[${slot.bounds.join(', ')}]` : 'null'} }`
				: 'null'

		const body = Object.entries(table)
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(
				([folder, variants]) =>
					`\t'${folder}': {\n\t\thd: [${variants.hd.map(emitSlot).join(', ')}],\n\t\tlegacy: [${variants.legacy
						.map(emitSlot)
						.join(', ')}],\n\t},`,
			)
			.join('\n')

		const emitRegion = (values: number[] | null) => (values ? `[${values.join(',')}]` : 'null')
		const regionBody = Object.entries(regions)
			.sort(([a], [b]) => (a < b ? -1 : 1))
			.map(
				([folder, variants]) =>
					`\t'${folder}': { hd: ${emitRegion(variants.hd)}, legacy: ${emitRegion(variants.legacy)} },`,
			)
			.join('\n')
		if (regionConflicts.length) {
			console.warn(`  ! slots in one variant disagree on their Polygons: ${regionConflicts.join(', ')}`)
		}

		const source = `// GENERATED by dump-sticker-slots.ts — do not edit by hand.
//
// Every weapon's StickerMarkup, straight out of its .vmdl_c. See the generator for why this is data
// rather than a tuning table, why it is split by mesh variant, and what \`bounds\` is.

/** One slot's markup, in the weapon's SECOND uv set. */
export type StickerSlotMarkup = {
	/** \`g_vStickerNOffset\` — where the sticker sits when the item does not move it. */
	offset: [number, number]
	/** \`g_vStickerNScale\`. An INVERSE uv scale: larger is a SMALLER sticker. */
	scale: number
	/** \`g_flStickerNRotation\`, in TURNS. */
	rotation: number
	/** The game's own name for the slot — Autograph / Team1 / Team2 / Map / … */
	special: string | null
	/** Bounding box of the slot's legal region, \`[minU, minV, maxU, maxV]\`, or null if unauthored. */
	bounds: [number, number, number, number] | null
}

/** Keyed by MODEL FOLDER, then by mesh variant — both of which the markup is authored per. */
export const STICKER_SLOT_MARKUP: Record<
	string,
	{ hd: (StickerSlotMarkup | null)[]; legacy: (StickerSlotMarkup | null)[] }
> = {
${body}
}

/**
 * The legal region ITSELF — \`StickerMarkup.Polygons[].Vertices\`, flattened to uv pairs, three per
 * TRIANGLE, in the same \`g_vStickerNOffset\` space as \`offset\` and \`bounds\` above.
 *
 * Keyed by model folder and mesh variant rather than by slot because every slot of a variant shares
 * one region on all 35 weapons — the generator checks that rather than assuming it.
 *
 * This is what a drag has to be clamped to. \`bounds\` is only its bounding BOX, and on the AK the
 * region fills 25.7% of that box (26.5% legacy), so clamping to the box lets a sticker sit in three
 * quarters of an area the game does not allow.
 */
export const STICKER_SLOT_REGIONS: Record<string, { hd: number[] | null; legacy: number[] | null }> = {
${regionBody}
}
`
		const target = join(dataDir, 'stickerSlots.data.ts')
		writeFileSync(target, source)
		const slots = Object.values(table).reduce(
			(sum, variants) => sum + variants.hd.filter(Boolean).length + variants.legacy.filter(Boolean).length,
			0,
		)
		console.log(`weapons with StickerMarkup   : ${withMarkup}`)
		console.log(`weapons emitted              : ${Object.keys(table).length}`)
		console.log(`slots emitted (both variants): ${slots}`)
		console.log(`wrote ${target}`)
	} finally {
		rmSync(temp, { recursive: true, force: true })
	}
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
