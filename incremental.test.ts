/**
 * `--incremental` — proof that the skip can FAIL, not just that it can skip.
 *
 *   bun test tools/cs2-export/incremental.test.ts
 *
 * A caching test that only ever shows "nothing changed, nothing re-exported" is worthless: it passes
 * identically whether the invalidation works or is missing entirely. So all three transitions are
 * exercised against the real decompiler, on the cheapest job in the table (`compmatdata`, 5 files,
 * ~0.2 s):
 *
 *   1. cold  -> all 5 written
 *   2. warm  -> all 5 skipped
 *   3. one recorded CRC corrupted     -> exactly that one rewritten, the other four still skipped
 *   4. the recorded decompiler version bumped -> all 5 rewritten
 *
 * (3) is the "a game patch changed this file" case and (4) is the one that matters most: without it,
 * upgrading VRF would keep outputs produced by the old decompiler, and a stale output is invisible
 * where a slow export is merely annoying.
 *
 * WHERE THE CACHE LIVES IS NOT OUR CHOICE. `--vpk_cache` hardcodes `<archive>.manifest.txt`, i.e. a
 * file INSIDE the CS2 install, with no flag to move it. This test therefore writes there too, and
 * restores whatever it found — including deleting the file if there was none.
 */

import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cliPath, findCs2Pak } from './platform'

const CLI = cliPath()

let pak: string | null = null
try {
	pak = existsSync(CLI) ? findCs2Pak(process.env.CS2_PATH) : null
} catch {
	pak = null
}

/** Needs a CS2 install AND a built decompiler; both are absent in a fresh clone and in CI. */
const runnable = Boolean(pak)
const MANIFEST = pak ? `${pak}.manifest.txt` : ''

let out = ''
let priorManifest: string | null = null

beforeAll(() => {
	if (!runnable) return
	out = mkdtempSync(join(tmpdir(), 'cs2-incremental-'))
	priorManifest = existsSync(MANIFEST) ? readFileSync(MANIFEST, 'utf8') : null
	if (priorManifest !== null) rmSync(MANIFEST)
})

afterAll(() => {
	if (!runnable) return
	if (out) rmSync(out, { recursive: true, force: true })
	// Put the install back exactly as it was: restore a pre-existing manifest, or remove ours.
	if (priorManifest !== null) writeFileSync(MANIFEST, priorManifest)
	else if (existsSync(MANIFEST)) rmSync(MANIFEST)
})

/** One filtered `--vpk_cache` run over `compmatdata/`, returning what it did per entry. */
const extract = async () => {
	const proc = Bun.spawn(
		[CLI, '-i', pak as string, '-o', out, '-e', 'vcompmat_c', '-f', 'compmatdata/', '-d', '--vpk_cache'],
		{ stdout: 'pipe', stderr: 'pipe' },
	)
	const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
	await proc.exited
	return {
		written: (stdout.match(/Dump written to/g) ?? []).length,
		skipped: (stdout.match(/Skipped \(unchanged\)/g) ?? []).length,
		versionReset: /Decompiler version changed/.test(stderr) || /Decompiler version changed/.test(stdout),
	}
}

describe.skipIf(!runnable)('--incremental skips on unchanged CRC and re-exports on changed', () => {
	test('the whole cold -> warm -> invalidated cycle', async () => {
		// 1. COLD. No manifest, so everything is written and nothing is skipped.
		const cold = await extract()
		expect(cold).toMatchObject({ written: 5, skipped: 0 })
		expect(existsSync(MANIFEST)).toBe(true)

		// The manifest records the decompiler version FIRST — this line is the whole invalidation.
		const recorded = readFileSync(MANIFEST, 'utf8')
		expect(recorded.split('\n')[0]).toMatch(/^\/\/ s2v_version=\d+\.\d+\.\d+\.\d+$/)
		expect(recorded).toContain('compmatdata/engrave_trophy.vcompmat_c')

		// 2. WARM. Nothing in the game changed, so nothing is re-extracted.
		expect(await extract()).toMatchObject({ written: 0, skipped: 5 })

		// 3. ONE CRC CHANGED — this is the "a game patch touched this file" case. Exactly one entry
		//    must come back, which also proves the skip is per-entry rather than all-or-nothing.
		const lines = readFileSync(MANIFEST, 'utf8').split('\n')
		const target = lines.findIndex(l => l.includes('engrave_trophy'))
		expect(target).toBeGreaterThan(0)
		lines[target] = lines[target].replace(/^\d+ /, '4294967295 ')
		writeFileSync(MANIFEST, lines.join('\n'))
		expect(await extract()).toMatchObject({ written: 1, skipped: 4 })

		// 4. DECOMPILER VERSION CHANGED. The whole manifest must be discarded, loudly. This is the
		//    check whose absence would be invisible: same source bytes, different decompiler, stale
		//    output that nothing would ever flag.
		const warm = readFileSync(MANIFEST, 'utf8')
		expect(warm).toMatch(/^\/\/ s2v_version=/)
		writeFileSync(MANIFEST, warm.replace(/^\/\/ s2v_version=.*$/m, '// s2v_version=0.0.0.0'))
		const invalidated = await extract()
		expect(invalidated).toMatchObject({ written: 5, skipped: 0 })
		expect(invalidated.versionReset).toBe(true)
	}, 120_000)
})

describe('the guard that keeps --incremental off the glTF jobs', () => {
	/**
	 * `--gltf_export_materials` writes each model's textures as PNG sidecars beside the GLB, but the
	 * cache manifest only records CRCs for entries matching `-e` — the `vmdl_c` / `vnmclip_c` files.
	 * A CS2 patch that retextures an agent without touching its model would leave the model skipped
	 * and 1.68 GB of sidecars stale. `incrementalSafe` in export.ts is `!job.gltf` for that reason.
	 *
	 * EIGHT jobs, not the four model ones — this list is asserted because it is easy to get wrong
	 * (it was, when this test was written: `keychains`, `nametag`, `povclips` and `stattrak` set
	 * `gltf` too, and `export.ts` pushes `--gltf_export_materials` for every job that does). They are
	 * ~4.5 GB of the ~55 GB total, so `--incremental` still covers about 92% of the bytes.
	 */
	test('every gltf job is excluded — all EIGHT of them, not just the four model ones', () => {
		const src = readFileSync(join(import.meta.dir, 'export.ts'), 'utf8')
		const literal = (start: string) => {
			const at = src.indexOf(start)
			const from = src.indexOf('[', at)
			return src.slice(from, src.indexOf('\n]', from) + 2)
		}
		const jobs = new Function(
			`const POV_CLIPS = ${literal('const POV_CLIPS')};\nreturn ${literal('const JOBS')};`,
		)() as { name: string; gltf?: boolean }[]
		const gltf = jobs
			.filter(j => j.gltf)
			.map(j => j.name)
			.sort()
		expect(gltf).toEqual([
			'keychains',
			'models',
			'models-agents-ct',
			'models-agents-t',
			'models-gloves',
			'nametag',
			'povclips',
			'stattrak',
		])
		// And the guard in export.ts is still keyed off `gltf` rather than a hand-written name list,
		// which is what makes a NEW gltf job safe by default.
		expect(src).toContain('const incrementalSafe = (job: Job) => !job.gltf')
	})
})
