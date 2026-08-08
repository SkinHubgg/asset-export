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

/**
 * `--sync` — the post-patch update — is `--incremental` plus a publish, so it inherits everything
 * above and adds three invariants of its own. All three are asserted against the SOURCE, for the
 * same reason the job list above is: `export.ts` runs an export on import, so it cannot be exercised
 * in-process. They are here rather than in a menu test because every one of them is about the cache.
 */
describe('what --sync adds to the cache, and what it must never take away', () => {
	const src = readFileSync(join(import.meta.dir, 'export.ts'), 'utf8')

	/**
	 * THE CACHE HAS NEVER HEARD OF THE OUTPUT FOLDER. Its manifest lives beside the VPK, INSIDE the
	 * CS2 install, so it outlives `rm -rf out/`, a new `--out`, and a second checkout — and a run
	 * against an empty output folder would then skip every entry and produce nothing, in silence.
	 *
	 * Reproduced on 2026-08-08 rather than imagined: a three-job run that had succeeded once, re-run
	 * against a freshly deleted output folder, extracted ZERO files and then failed three steps later
	 * complaining that a job it had just reported as successful had produced no `items_game.txt`.
	 */
	test('a job with no prior output cannot skip, however unchanged the game is', () => {
		expect(src).toContain('const hadOutput = countFiles(target) > 0')
		expect(src).toContain('const cached = useCache && incrementalSafe(job) && (hadOutput || noManifestYet)')
	})

	/**
	 * The escape hatch on that guard, and it is the difference between one full pass and two. A
	 * manifest that does not exist cannot cause a wrong skip — there is nothing in it to skip against
	 * — but refusing the cache there also refuses to WRITE it. Measured without this line: a
	 * first-ever `--sync` extracted everything and recorded nothing, the second extracted everything
	 * again and recorded it, and only the third was fast.
	 */
	test('...but a MISSING manifest is not a reason to refuse the cache, only to populate it', () => {
		expect(src).toContain('const noManifestYet = !hadManifest.get(archiveFor(job))')
		// The path is the decompiler's, hardcoded; the test at the top of this file writes to the same
		// one. If that ever moves, both break together, which is the point of spelling it out twice.
		expect(src).toContain('hadManifest.set(archive, existsSync(`${archive}.manifest.txt`))')
	})

	/**
	 * And the snapshot is taken ONCE, before the loop, because inside it the answer changes underfoot:
	 * the first cached job creates the manifest, and every job after it then looks like "a manifest
	 * already exists". Measured from cold on a three-job run — job one populated it, jobs two and
	 * three were excluded, and warming up took two full passes instead of one.
	 */
	test('the manifest snapshot is taken before the loop, not per job', () => {
		const snapshot = src.indexOf('const hadManifest = new Map<string, boolean>()')
		const loop = src.indexOf('for (const job of jobs) {', src.indexOf('let totalSkipped = 0'))
		expect(snapshot).toBeGreaterThan(-1)
		expect(loop).toBeGreaterThan(snapshot)
	})

	/**
	 * WIPING IS THE OPPOSITE OF WHAT AN UPDATE IS FOR, and `--force` is the combination worth pinning:
	 * it turns the cache off, so without an explicit `!SYNC` the wipe branch would catch
	 * `--sync --force` and a flag meaning "ignore the cache" would silently also mean "delete 56 GB".
	 */
	test('--sync never wipes the output folder, not even with --force', () => {
		expect(src).toContain('if (!only && !wantsIncremental && !SYNC && existsSync(OUT))')
	})

	/**
	 * An unwritable CS2 install (Program Files, no elevation) is a REFUSAL for the flag that asked for
	 * the cache by name, and a LOUD FALLBACK for the mode that only asked for a current CDN. What
	 * neither may be is a quiet full extraction.
	 */
	test('the unwritable-cache path degrades for --sync and still throws for --incremental', () => {
		expect(src).toContain('const useCache = wantsIncremental && reportIncremental(jobs, game, SYNC)')
		expect(src).toContain('if (!degrade)')
		expect(src).toContain('SO THIS RUN WILL BE A FULL EXTRACTION')
	})
})
