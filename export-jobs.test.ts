/**
 * Acceptance test — the CS2 exporter's JOB TABLE.
 *
 *   bun test tools/skin-bench/export-jobs.test.ts
 *
 * Offline and instant: it reads `export.ts` and evaluates the three literals that
 * define what gets exported (`POV_CLIPS`, `JOBS`, `SAMPLE_FILTERS`). It needs no CS2 install, no
 * network and no `out/` folder, because every defect it targets is a defect in the TABLE, and every
 * one of them is silent at runtime — the export succeeds, the numbers just come out wrong.
 *
 * The four silent failures this file exists to make loud:
 *
 *  1. TWO JOBS EXPORTING THE SAME FILES. `-f` is a strict path-prefix match with no way to express
 *     an exclusion, so `agents/models/` sweeps in `agents/models/shared/arms/` — the twelve glove
 *     models `models-gloves` already ships — and re-emits every one of them under a second CDN path.
 *     The agent jobs dodge it by filtering on `ctm_`/`tm_`, which cannot reach a folder called
 *     `shared`. Nothing but this test would notice if someone "simplified" that back to one job.
 *
 *  2. A JOB WITH NO SAMPLE FILTER. `--sample` looks its job up in SAMPLE_FILTERS and, on a miss,
 *     prints one dim "(no sample - skipped)" line and moves on. A new job with no entry is never
 *     exercised by the trial run that exists specifically to exercise new jobs.
 *
 *  3. A SAMPLE FILTER THAT IS NOT A SUBSET OF ITS JOB. The point of `--sample` is to run the real
 *     pipeline over a slice of the real job. A sample that points somewhere else still produces
 *     files, so it still looks like it worked.
 *
 *  4. A CLIP NAME THAT NAMES NOTHING. `--gltf_animation_list` misses do not fail: the CLI prints
 *     "matched no animations for: x", exits 0, and writes a GLB with a skeleton and `animations: []`
 *     — a bind-pose model. Gloves use `tools_preview_pose` and agents use `tools_preview`, which is
 *     exactly the kind of near-miss that survives review. (Whether a name still resolves against a
 *     PATCHED CS2 is `--discover`'s job; this is the guard against a typo.)
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type Job = {
	name: string
	ext: string
	dir: string
	filter: string
	vpk?: string
	gltf?: boolean
	gltfAnimations?: string
	decompile?: boolean
	reflectivity?: boolean
}

const SOURCE = join(import.meta.dir, 'export.ts')

/**
 * Pull the three literals out of export.ts and evaluate them.
 *
 * export.ts is a SCRIPT — it ends in a top-level `await main()` — so it cannot be imported without
 * running an export. Slicing the literals out and evaluating those instead keeps this test to the
 * data, which is the only part of the file it has an opinion about.
 */
const readJobTable = () => {
	const src = readFileSync(SOURCE, 'utf8')
	const slice = (start: string, open: '[' | '{') => {
		const at = src.indexOf(start)
		expect(at, `export.ts no longer declares \`${start}\``).toBeGreaterThan(-1)
		const from = src.indexOf(open, at)
		// Every one of these literals is closed by its bracket alone in column 0.
		const close = src.indexOf(`\n${open === '[' ? ']' : '}'}`, from)
		return src.slice(from, close + 2)
	}
	const body = [
		`const POV_CLIPS = ${slice('const POV_CLIPS', '[')};`,
		`const JOBS = ${slice('const JOBS', '[')};`,
		`const SAMPLE_FILTERS = ${slice('const SAMPLE_FILTERS', '{')};`,
		'return { POV_CLIPS, JOBS, SAMPLE_FILTERS };',
	].join('\n')
	return new Function(body)() as {
		POV_CLIPS: string[]
		JOBS: Job[]
		SAMPLE_FILTERS: Record<string, string>
	}
}

const { POV_CLIPS, JOBS, SAMPLE_FILTERS } = readJobTable()
/** `-f` takes a comma-separated OR-list of prefixes; a job's filter may be one entry or 113. */
const prefixes = (job: Job) => job.filter.split(',').filter(Boolean)

describe('export job table', () => {
	test('the table parsed at all', () => {
		expect(JOBS.length).toBeGreaterThanOrEqual(32)
		expect(POV_CLIPS.length).toBeGreaterThan(0)
		for (const job of JOBS) {
			expect(typeof job.name, `job ${JSON.stringify(job)} has no name`).toBe('string')
			expect(job.filter.length, `${job.name} has an empty filter`).toBeGreaterThan(0)
			expect(job.ext.length, `${job.name} has no ext`).toBeGreaterThan(0)
			expect(job.dir.length, `${job.name} has no dir`).toBeGreaterThan(0)
		}
	})

	test('job names are unique — --only matches by name', () => {
		const seen = new Set<string>()
		for (const job of JOBS) {
			expect(seen.has(job.name), `two jobs are called ${job.name}`).toBe(false)
			seen.add(job.name)
		}
	})

	// Defect 1. models-gloves owns agents/models/shared/arms/ and its GLBs are ~123 MB. Any other
	// vmdl_c job whose prefix reaches that folder ships a second copy of all twelve.
	test('exactly one job exports the glove models', () => {
		const gloveTree = 'agents/models/shared/arms/'
		const reaches = (p: string) => gloveTree.startsWith(p) || p.startsWith(gloveTree)
		const owners = JOBS.filter(j => j.ext === 'vmdl_c' && prefixes(j).some(reaches)).map(j => j.name)
		expect(owners).toEqual(['models-gloves'])
	})

	// The same hazard stated from the agents' side, so the failure names the actual culprit.
	test('the agent jobs cover all 80 bodies and cannot reach the glove tree', () => {
		const agents = JOBS.filter(j => j.name.startsWith('models-agents'))
		expect(agents.map(j => j.name)).toEqual(['models-agents-ct', 'models-agents-t'])
		for (const job of agents) {
			for (const p of prefixes(job)) {
				expect(p.startsWith('agents/models/'), `${job.name} filters outside agents/models/`).toBe(true)
				// `shared` sorts after `ctm_`/`tm_` but the point is that neither is its prefix.
				expect('agents/models/shared/arms/'.startsWith(p), `${job.name} reaches the glove tree`).toBe(false)
			}
		}
	})

	// Defect 4. A wrong clip name costs the skeleton's whole reason for being there.
	test('every model job that needs a skeleton names the clip its own models carry', () => {
		const clipsOf = (name: string) => JOBS.find(j => j.name === name)?.gltfAnimations?.split(',') ?? []
		expect(clipsOf('models-gloves')).toEqual(['tools_preview_pose'])
		// Agents are `tools_preview` — the near-miss with the glove name is the whole point.
		expect(clipsOf('models-agents-ct')[0]).toBe('tools_preview')
		expect(clipsOf('models-agents-t')[0]).toBe('tools_preview')
		expect(clipsOf('models-agents-ct')).toHaveLength(2)
		expect(clipsOf('models-agents-t')).toHaveLength(2)
		// The animated idle is faction-specific, and shipping the wrong side's is invisible.
		expect(clipsOf('models-agents-ct')[1]).toContain('/main_menu/ct/')
		expect(clipsOf('models-agents-t')[1]).toContain('/main_menu/t/')
		// Without a list on `models` there are no joint nodes at all and nothing can be posed.
		expect(clipsOf('models')).toEqual(['inventory_icon'])
	})

	// vnmclip_c ignores --gltf_animation_list entirely (verified: byte-identical output with and
	// without it), so setting it on povclips would read as a selection that is not happening.
	test('povclips selects in the filter, not in gltfAnimations', () => {
		const pov = JOBS.find(j => j.name === 'povclips')
		expect(pov?.ext).toBe('vnmclip_c')
		expect(pov?.gltf).toBe(true)
		expect(pov?.gltfAnimations).toBeUndefined()
		expect(prefixes(pov as Job)).toHaveLength(POV_CLIPS.length)
		for (const p of prefixes(pov as Job)) expect(p.endsWith('.vnmclip_c')).toBe(true)
	})

	// Defect 2.
	test('every job has a --sample filter', () => {
		const without = JOBS.filter(j => !SAMPLE_FILTERS[j.name]).map(j => j.name)
		expect(without).toEqual([])
	})

	test('no sample filter is left behind by a renamed job', () => {
		const names = new Set(JOBS.map(j => j.name))
		expect(Object.keys(SAMPLE_FILTERS).filter(n => !names.has(n))).toEqual([])
	})

	// Defect 3. A sample entry must land inside the job it narrows: every one of its comma parts has
	// to sit under one of the job's prefixes (for a job whose filter is a list of exact paths, that
	// reduces to "the sample names files the job also names").
	test('every sample filter is a subset of its job filter', () => {
		for (const job of JOBS) {
			const sample = SAMPLE_FILTERS[job.name]
			if (!sample) continue
			for (const part of sample.split(',').filter(Boolean)) {
				const inside = prefixes(job).some(p => part.startsWith(p))
				expect(
					inside,
					`sample for ${job.name} is outside its filter:\n  ${part}\n  not under ${job.filter.slice(0, 80)}`,
				).toBe(true)
			}
		}
	})
})

describe('POV clip list', () => {
	const family = (clip: string) => clip.slice(0, clip.lastIndexOf('/'))
	const leaf = (clip: string) => clip.slice(clip.lastIndexOf('/') + 1)

	test('no duplicates', () => {
		expect(new Set(POV_CLIPS).size).toBe(POV_CLIPS.length)
	})

	test('every weapon family has exactly one hold pose and one inspect', () => {
		const byFamily = new Map<string, string[]>()
		for (const clip of POV_CLIPS) {
			if (clip.startsWith('arms/')) continue // the glove inspect has no weapon and no idle
			byFamily.set(family(clip), [...(byFamily.get(family(clip)) ?? []), leaf(clip)])
		}
		expect(byFamily.size).toBe(56)
		for (const [fam, leaves] of byFamily) {
			const idles = leaves.filter(l => /^idle1?_/.test(l))
			const inspects = leaves.filter(l => l.startsWith('lookat01_'))
			expect(idles, `${fam}: want exactly one idle`).toHaveLength(1)
			expect(inspects, `${fam}: want exactly one lookat01`).toHaveLength(1)
			expect(leaves, `${fam}: nothing but those two`).toHaveLength(2)
		}
	})

	test('the alternates that inflate the job fourfold stay out', () => {
		const banned = /^(idle2_|idle_slide_back_|idle_leftempty_|idle_leftrightempty_|idle_from_activity_)|_lgcy$/
		const strays = POV_CLIPS.filter(c => banned.test(leaf(c)))
		expect(strays).toEqual([])
		// lookat01_draw_* / lookat01_transfix_* are graph transitions of the same 4.5 s motion, and
		// lookat02/03 are the rare alternates — 642 clips / 95 MB if you take the lot.
		expect(POV_CLIPS.filter(c => /lookat0[23]_|lookat01_(draw|transfix)/.test(leaf(c)))).toEqual([])
	})

	test('the three fallback families the silenced weapons need are present', () => {
		// The M4A1-S, USP-S and CT default knife ship no clips of their own.
		for (const fam of ['rifle/_default_rifle', 'pistol/_default_pistol', 'knife/_default_knife'])
			expect(
				POV_CLIPS.some(c => family(c) === fam),
				`${fam} missing — its weapons have no clips`,
			).toBe(true)
	})

	test('the glove inspect is in, and it is the loop', () => {
		expect(POV_CLIPS).toContain('arms/inspects/pedestal_gloves_loop')
		// _anim is byte-identical to _loop and _deploy is the 1.97 s draw; shipping either is dead weight.
		expect(POV_CLIPS.filter(c => c.startsWith('arms/'))).toHaveLength(1)
	})
})
