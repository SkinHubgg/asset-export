/**
 * The menu's contract, in the four places it can silently go wrong.
 *
 *   bun test interactive.test.ts
 *
 * 1. IT MUST NEVER PROMPT WHEN NOTHING IS WATCHING. A prompt in a cron job or a CI step does not
 *    error — it BLOCKS, and looks like a slow export until something times out an hour later. Every
 *    non-human case is enumerated below.
 *
 * 2. THE JOB TABLE MUST NOT DRIFT. The menu's groups and labels are a sibling record keyed by job
 *    name (the shape `SAMPLE_FILTERS` already uses) rather than fields on `JOBS`, because `export.ts`
 *    is a script that runs an export on import and its `JOBS` literal is also read as TEXT by
 *    `export-jobs.test.ts`. The cost of a sibling table is drift, and this closes it in both
 *    directions: a new job with no label would appear in the menu as `?`, and a deleted job would
 *    leave a checkbox that `--only` rejects.
 *
 * 3. EVERY FLAG THE MENU EMITS MUST BE ONE ITS TARGET SCRIPT READS. The menu's entire honesty rests
 *    on re-execing with real flags and printing the command it used. A flag that no longer exists
 *    turns that promise inside out: the printed line still looks authoritative and the run silently
 *    does something else. So every argv below is checked against the parser in the script it is
 *    aimed at, read as text.
 *
 * 4. `--confirm` MUST BE UNREACHABLE WITHOUT A SUCCESSFUL DRY RUN. Upload is the one destructive,
 *    outward-facing operation in the tool. `uploadConfirmPlan` is a pure function of the dry run's
 *    exit code precisely so this can be proved rather than demonstrated.
 */

import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { JOB_GROUPS, PRESETS, type Plan, commandFor, uploadConfirmPlan, uploadDryPlan } from './interactive'
import { R2_ENV, credentialReport, interactiveNeedsTty, shouldPrompt } from './platform'

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

	test('the operations added for the publish/game-data half resolve to their real flags too', () => {
		expect(PRESETS['gamedata-dry']).toMatchObject({ script: 'gamedata', argv: ['--dry-run'] })
		expect(PRESETS['gamedata-compare']).toMatchObject({ script: 'gamedata', argv: ['--compare'] })
		expect(PRESETS.verify).toMatchObject({ script: 'publish', argv: ['--verify'] })
		expect(PRESETS['verify-quick'].argv).toEqual(['--verify', '--quick'])
		expect(PRESETS['verify-deep'].argv).toEqual(['--verify', '--deep'])
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

	/**
	 * Only the publish half asks for `.env`, and only the publish half needs it. Marking an export
	 * plan `needsEnv` would put a `--env-file` into a printed command that has nothing to do with
	 * credentials, which is the kind of noise that teaches people to ignore the printed command.
	 */
	test('exactly the publish plans want the .env, and no export or game-data plan does', () => {
		for (const [name, plan] of Object.entries(PRESETS))
			expect({ [name]: Boolean(plan.needsEnv) }).toEqual({ [name]: plan.script === 'publish' })
		expect(uploadDryPlan([]).needsEnv).toBe(true)
	})
})

/**
 * THE DRIFT GUARD FOR THE FLAGS THEMSELVES.
 *
 * The menu's honesty is "it re-execs with real flags and prints the command". A renamed flag breaks
 * that in the worst possible way — the printed line still looks authoritative, and the run does
 * something else — so every flag the menu can emit is looked up in the parser of the script it is
 * aimed at. The parsers are `flag('x')` / `value('x')` in all three scripts, which is what makes
 * this checkable by reading the source.
 */
describe('every flag the menu emits is read by the script it is sent to', () => {
	const SOURCE: Record<Plan['script'], string> = {
		export: 'export.ts',
		gamedata: 'generate-gamedata.ts',
		publish: 'publish.ts',
	}
	const sourceOf = (script: Plan['script']) => readFileSync(join(import.meta.dir, SOURCE[script]), 'utf8')
	const reads = (src: string, flagName: string) =>
		src.includes(`flag('${flagName}')`) || src.includes(`value('${flagName}'`)

	test('the three target scripts exist under the names the menu spawns', () => {
		for (const file of Object.values(SOURCE))
			expect({ [file]: existsSync(join(import.meta.dir, file)) }).toEqual({ [file]: true })
	})

	test('every preset flag, and both upload plans, resolve to a parser call', () => {
		const plans: [string, Plan][] = [
			...Object.entries(PRESETS),
			['upload-dry', uploadDryPlan(['data'])],
			['upload-confirm', uploadConfirmPlan(0, ['data']) as Plan],
		]
		for (const [name, plan] of plans) {
			const src = sourceOf(plan.script)
			for (const arg of plan.argv) {
				if (!arg.startsWith('--')) continue
				const flagName = arg.slice(2)
				expect({ [`${name}: --${flagName} in ${SOURCE[plan.script]}`]: reads(src, flagName) }).toEqual({
					[`${name}: --${flagName} in ${SOURCE[plan.script]}`]: true,
				})
			}
		}
	})

	/**
	 * `--yes` is the exception and it is deliberate: `runPlan` appends it to every EXPORT re-exec so
	 * the child can never prompt again, and it is read by `shouldPrompt` in platform.ts rather than
	 * by `export.ts`'s own parser. Pinned here so the exception stays an exception.
	 */
	test('--yes is honoured, by platform.ts rather than by export.ts', () => {
		expect(reads(sourceOf('export'), 'yes')).toBe(false)
		expect(readFileSync(join(import.meta.dir, 'platform.ts'), 'utf8')).toContain("args.includes('--yes')")
	})
})

/**
 * UPLOAD IS THE ONE OPERATION THAT WRITES SOMEWHERE OTHER THAN THIS MACHINE.
 *
 * Everything else the menu can do is undone by running it again. This is not: it publishes to a CDN
 * other people's software reads. So the ordering is not a convention, it is a mechanism.
 */
describe('the upload confirm step is unreachable without a successful dry run', () => {
	test('a dry run that FAILED yields no confirm plan at all — the guard, failing', () => {
		expect(uploadConfirmPlan(1, ['data'])).toBeNull()
		expect(uploadConfirmPlan(2, [])).toBeNull()
		// 130 is Ctrl-C. Cancelling the dry run must not be a way to reach the real one either.
		expect(uploadConfirmPlan(130, ['data'])).toBeNull()
	})

	test('a dry run that succeeded yields exactly the same command plus --confirm', () => {
		const dry = uploadDryPlan(['data'])
		const real = uploadConfirmPlan(0, ['data']) as Plan
		expect(dry.argv).toEqual(['--upload', '--prefix', 'data'])
		expect(real.argv).toEqual(['--upload', '--prefix', 'data', '--confirm'])
		// The confirm plan is the dry-run plan plus one flag, never a differently-shaped command:
		// anything else would mean the rehearsal did not rehearse the performance.
		expect(real.argv.slice(0, dry.argv.length)).toEqual(dry.argv)
		expect(real.writes).toBe(true)
	})

	test('the DRY plan never carries --confirm, whatever the prefix', () => {
		for (const prefixes of [[], ['data'], ['models', 'keychains']])
			expect(uploadDryPlan(prefixes).argv).not.toContain('--confirm')
	})

	test('no PRESET can write to the CDN — the writing plan is only ever built by uploadConfirmPlan', () => {
		for (const [name, plan] of Object.entries(PRESETS)) {
			expect({ [name]: plan.argv.includes('--confirm') }).toEqual({ [name]: false })
			expect({ [name]: Boolean(plan.writes) }).toEqual({ [name]: false })
			expect({ [name]: plan.argv.includes('--upload') }).toEqual({ [name]: false })
		}
	})

	test('an empty prefix list means "everything" and emits no --prefix, rather than an empty one', () => {
		// `--prefix ''` would reach publish.ts's `value()` and match nothing, so a whole-build upload
		// would silently become a no-op — the opposite failure from the one being guarded against.
		expect(uploadDryPlan([]).argv).toEqual(['--upload'])
		expect((uploadConfirmPlan(0, []) as Plan).argv).toEqual(['--upload', '--confirm'])
	})
})

/**
 * `bun run menu` is the friendly entry point, and it MUST pass `--interactive` rather than nothing.
 *
 * A bare `bun run export.ts` prompts on a terminal — and on anything else falls through to the
 * default behaviour, which is a FULL EXPORT that deletes the output folder first. So a `menu` script
 * defined as the bare command would be a one-word way to destroy an export from CI or from a
 * non-interactive shell. With `--interactive` the same situation is a one-line error instead.
 */
describe('the package.json entry point cannot become a destructive one', () => {
	const scripts = (JSON.parse(readFileSync(join(import.meta.dir, 'package.json'), 'utf8')) as {
		scripts: Record<string, string>
	}).scripts

	test('`menu` asks for the menu explicitly', () => {
		expect(scripts.menu).toBe('bun run export.ts --interactive')
		expect(shouldPrompt(['--interactive'], true)).toBe(true)
		// The property that makes it safe: no terminal, no run — and no export either.
		expect(shouldPrompt(['--interactive'], false)).toBe(false)
		expect(interactiveNeedsTty(['--interactive'], false)).toBe(true)
	})

	test('the five original scripts are untouched — the flag interface is the contract', () => {
		expect(scripts.discover).toBe('bun run export.ts --discover')
		expect(scripts.export).toBe('bun run export.ts')
		expect(scripts['export:sample']).toBe('bun run export.ts --sample')
		expect(scripts['export:manifest']).toBe('bun run export.ts --manifest-only')
		expect(scripts.gamedata).toBe('bun run generate-gamedata.ts')
		expect(scripts.verify).toBe('bun run publish.ts --verify')
	})
})

describe('the printed command is a real command', () => {
	test('a publish plan gets --env-file only when the file is actually there', () => {
		const plan = uploadDryPlan(['data'])
		expect(commandFor(plan, '/repo/.env')).toBe('bun --env-file=/repo/.env run publish.ts --upload --prefix data')
		// Bun ignores a --env-file pointing at nothing, so an unconditional one would not break —
		// it would just teach the operator a flag that does nothing on their machine.
		expect(commandFor(plan, null)).toBe('bun run publish.ts --upload --prefix data')
	})

	test('export and game-data commands never mention an env file, even when one exists', () => {
		expect(commandFor(PRESETS.discover, '/repo/.env')).toBe('bun run export.ts --discover')
		expect(commandFor(PRESETS.full, '/repo/.env')).toBe('bun run export.ts')
		expect(commandFor(PRESETS['gamedata-dry'], '/repo/.env')).toBe('bun run generate-gamedata.ts --dry-run')
	})
})

/**
 * The settings screen and the pre-upload check both report credentials. Neither may ever hold one.
 */
describe('the credential report names variables, never values', () => {
	test('a value set only in .env is reported as set, and its value never appears', () => {
		const report = credentialReport(import.meta.dir, {})
		expect(Object.keys(report.source).sort()).toEqual([...R2_ENV, 'SKINS_CDN_ORIGIN'].sort())
		for (const value of Object.values(report.source)) expect([null, '.env', 'environment']).toContain(value)
	})

	test('missingForUpload is exactly the names that are absent — the message an operator can act on', () => {
		const report = credentialReport('/definitely/not/a/repo', { R2_ACCOUNT_ID: 'x' })
		expect(report.missingForUpload).toEqual(['R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'])
		expect(report.missingForVerify).toEqual(['SKINS_CDN_ORIGIN'])
		expect(report.fileExists).toBe(false)
	})

	/**
	 * The list the menu reports from and the list the uploader enforces are now the SAME constant.
	 * A menu that says "you are all set" from a list that has drifted from the one `openBucket`
	 * checks is worse than no menu at all — it converts a clear error into a confusing one.
	 */
	test('publish.ts checks the shared R2_ENV rather than a copy of it', () => {
		const src = readFileSync(join(import.meta.dir, 'publish.ts'), 'utf8')
		expect(src).toContain('R2_ENV.filter(name => !process.env[name])')
		expect(src).not.toContain("['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID'")
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
