/**
 * The interactive picker's contract, in the two places it can silently go wrong.
 *
 *   bun test tools/cs2-export/interactive.test.ts
 *
 * 1. IT MUST NEVER PROMPT WHEN NOTHING IS WATCHING. A prompt in a cron job or a CI step does not
 *    error — it BLOCKS, and looks like a slow export until something times out an hour later. Every
 *    non-human case is enumerated below.
 *
 * 2. THE JOB TABLE MUST NOT DRIFT. The picker's groups and labels are a sibling record keyed by job
 *    name (the shape `SAMPLE_FILTERS` already uses) rather than fields on `JOBS`, because `export.ts`
 *    is a script that runs an export on import and its `JOBS` literal is also read as TEXT by
 *    `tools/skin-bench/export-jobs.test.ts`. The cost of a sibling table is drift, and this closes
 *    it in both directions: a new job with no label would appear in the picker as `?`, and a deleted
 *    job would leave a checkbox that `--only` rejects.
 */

import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JOB_GROUPS, PRESETS } from './interactive'
import { interactiveNeedsTty, shouldPrompt } from './platform'

/**
 * Same text-extraction trick `export-jobs.test.ts` uses, and for the same reason: `export.ts` ends
 * in a top-level `await main()`, so importing it runs an export. `POV_CLIPS` has to come along
 * because the `povclips` job's `filter` is built from it — the `JOBS` literal is not self-contained.
 */
const jobNames = (): string[] => {
	const src = readFileSync(join(import.meta.dir, 'export.ts'), 'utf8')
	const literal = (start: string) => {
		const at = src.indexOf(start)
		expect(at, `export.ts no longer declares \`${start}\``).toBeGreaterThan(-1)
		const from = src.indexOf('[', at)
		return src.slice(from, src.indexOf('\n]', from) + 2)
	}
	const jobs = new Function(`const POV_CLIPS = ${literal('const POV_CLIPS')};\nreturn ${literal('const JOBS')};`)() as {
		name: string
	}[]
	return jobs.map(j => j.name)
}

describe('shouldPrompt — the picker must never block automation', () => {
	test('a bare command on a TTY prompts', () => {
		expect(shouldPrompt([], true)).toBe(true)
	})

	test('a bare command WITHOUT a TTY does not — this is the one that hangs cron and CI', () => {
		expect(shouldPrompt([], false)).toBe(false)
	})

	test('any argument at all skips the picker', () => {
		for (const argv of [
			['--discover'],
			['--sample'],
			['--manifest-only'],
			['--only', 'models'],
			['--list'],
			['--dump-shaders'],
			['--publish', '--verify'],
			['--out', '/tmp/x'],
			['--incremental'],
		])
			expect({ argv, prompts: shouldPrompt(argv, true) }).toEqual({ argv, prompts: false })
	})

	test('--yes and -y are the explicit opt-out, even on a TTY', () => {
		expect(shouldPrompt(['--yes'], true)).toBe(false)
		expect(shouldPrompt(['-y'], true)).toBe(false)
	})

	test('CI=true skips it even on a TTY', () => {
		const before = process.env.CI
		try {
			process.env.CI = 'true'
			expect(shouldPrompt([], true)).toBe(false)
		} finally {
			if (before === undefined) delete process.env.CI
			else process.env.CI = before
		}
	})

	test('--interactive overrides the heuristics — an argument, or a stray CI=true', () => {
		expect(shouldPrompt(['--interactive'], true)).toBe(true)
		const before = process.env.CI
		try {
			process.env.CI = 'true'
			expect(shouldPrompt(['--interactive'], true)).toBe(true)
		} finally {
			if (before === undefined) delete process.env.CI
			else process.env.CI = before
		}
	})

	/**
	 * MEASURED, not assumed. With `--interactive` honoured unconditionally,
	 * `bun run export.ts --interactive < /dev/null` hung until it was killed — the prompt library waits
	 * on input that can never arrive. A TTY is therefore a hard requirement even for the explicit flag,
	 * and `export.ts` turns this case into a one-line error naming the flags to use instead.
	 */
	test('--interactive still needs a terminal: it does NOT force a prompt onto a pipe', () => {
		expect(shouldPrompt(['--interactive'], false)).toBe(false)
		expect(interactiveNeedsTty(['--interactive'], false)).toBe(true)
		expect(interactiveNeedsTty(['--interactive'], true)).toBe(false)
		expect(interactiveNeedsTty([], false)).toBe(false) // a bare command just falls through
	})
})

describe('presets map to real flags', () => {
	test('every preset resolves to argv the flag interface already accepts', () => {
		expect(PRESETS.gamedata).toMatchObject({ script: 'gamedata', argv: [] })
		expect(PRESETS.manifest.argv).toEqual(['--manifest-only'])
		expect(PRESETS.discover.argv).toEqual(['--discover'])
		expect(PRESETS.list.argv).toEqual(['--list'])
		expect(PRESETS.sample.argv).toEqual(['--sample'])
		// The full export is the empty argv — which is exactly what `shouldPrompt` reads as "ask me".
		// `runPlan` appends `--yes` for that reason; without it the child would prompt again forever.
		expect(PRESETS.full.argv).toEqual([])
		expect(PRESETS.full.heavy).toBe(true)
	})

	test('the two that write a lot are flagged heavy, the read-only ones are not', () => {
		expect(PRESETS.sample.heavy).toBe(true)
		expect(PRESETS.discover.heavy).toBeUndefined()
		expect(PRESETS.list.heavy).toBeUndefined()
		expect(PRESETS.manifest.heavy).toBeUndefined()
	})

	test('every preset argv is flags-only — no bare words a future parser could mistake for a value', () => {
		for (const [name, plan] of Object.entries(PRESETS))
			for (const arg of plan.argv) expect({ [name]: arg.startsWith('--') }).toEqual({ [name]: true })
	})
})

describe('JOB_GROUPS covers export.ts JOBS exactly', () => {
	const names = jobNames()

	test('the table parsed, and there are 40 jobs', () => {
		expect(names.length).toBe(40)
	})

	test('every job has a group and a non-empty label', () => {
		const missing = names.filter(n => !JOB_GROUPS[n])
		expect({ missingFromJobGroups: missing }).toEqual({ missingFromJobGroups: [] })
		for (const n of names) {
			expect(JOB_GROUPS[n].group.length, `${n} has no group`).toBeGreaterThan(0)
			expect(JOB_GROUPS[n].label.length, `${n} has no label`).toBeGreaterThan(0)
		}
	})

	test('JOB_GROUPS has no entry for a job that no longer exists', () => {
		const stale = Object.keys(JOB_GROUPS).filter(n => !names.includes(n))
		expect({ staleJobGroups: stale }).toEqual({ staleJobGroups: [] })
	})

	test('the groups are few enough to be navigable — 40 flat checkboxes is not usable', () => {
		const groups = new Set(Object.values(JOB_GROUPS).map(g => g.group))
		expect(groups.size).toBeLessThanOrEqual(7)
		expect(groups.size).toBeGreaterThan(1)
		// And no group is so big it defeats the point of grouping.
		for (const g of groups) {
			const size = Object.values(JOB_GROUPS).filter(j => j.group === g).length
			expect({ [g]: size <= 14 }).toEqual({ [g]: true })
		}
	})
})
