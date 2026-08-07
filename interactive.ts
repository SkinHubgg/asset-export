/**
 * The interactive picker — what `bun run export.ts` does when given no arguments on a terminal.
 *
 * WHY THIS EXISTS. The bare command used to be the single most destructive thing in the repo: it ran
 * all 40 jobs, took hours, wrote ~55 GB, and **deleted the existing output folder first**. Nothing
 * warned. A newcomer's most natural invocation was also the worst one.
 *
 * HOW IT STAYS HONEST — IT RE-EXECS. The picker never calls into the exporter. It resolves a choice
 * into the exact ARGV a person would have typed, prints that command, and then spawns `export.ts`
 * again with those flags. So the interactive path and the flag path are the same path by
 * construction: there is no second implementation of "which jobs run" to drift, and the command it
 * prints is one you can paste into a script.
 *
 * WHAT IT MUST NEVER DO IS HANG. `shouldPrompt` refuses in every non-human situation — any argument
 * at all, a non-TTY stdin (a pipe, a cron job, CI), `CI=true`, or an explicit `--yes`. In those cases
 * the caller falls through to today's behaviour unchanged, so the five root `package.json` scripts
 * and anything scripted keep working exactly as they did.
 *
 * Prompts are `@clack/prompts`, which degrades its box-drawing and checkbox glyphs to ASCII
 * (`[+]` / `[ ]` / `|`) when the terminal cannot do Unicode — it checks `WT_SESSION` among others, so
 * Windows Terminal gets the nice characters and `cmd.exe` gets the readable fallback. Nothing here
 * writes a raw ANSI escape.
 */

import { cancel, confirm, groupMultiselect, intro, isCancel, log, note, outro, select } from '@clack/prompts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every job, grouped for the picker and given a plain-language label.
 *
 * A SIBLING TABLE KEYED BY JOB NAME, which is the shape `SAMPLE_FILTERS` in `export.ts` already
 * uses. `JOBS` is not imported because `export.ts` is a script — importing it runs an export — and
 * because that literal is also read as TEXT by `export-jobs.test.ts`. The cost of a
 * sibling table is drift, and `interactive.test.ts` closes it: it extracts the real `JOBS` and fails
 * if the two lists are not identical in both directions.
 *
 * Sizes are measured on a full 2026-08-07 export, rounded. They are the point of the labels —
 * `glovemodelmats` means nothing to a newcomer, and neither does "this one is 8.7 GB".
 */
export const JOB_GROUPS: Record<string, { group: string; label: string }> = {
	// --- Models & animation -------------------------------------------------------------------
	models: { group: 'Models & animation', label: 'weapon + knife models as GLB, with their textures — 2.4 GB' },
	'models-gloves': { group: 'Models & animation', label: 'the 12 glove models as GLB — 123 MB' },
	'models-agents-ct': { group: 'Models & animation', label: 'the 35 CT operator bodies as GLB — 907 MB' },
	'models-agents-t': { group: 'Models & animation', label: 'the 45 T operator bodies as GLB — 1.1 GB' },
	povclips: { group: 'Models & animation', label: 'first-person idle + inspect animation, 113 clips — 22 MB' },
	keychains: { group: 'Models & animation', label: 'charm (keychain) models as GLB — 143 MB' },
	stattrak: { group: 'Models & animation', label: 'the StatTrak counter model — 1 MB' },
	nametag: { group: 'Models & animation', label: 'the name-tag dataplate model — < 1 MB' },

	// --- Weapon & knife finishes --------------------------------------------------------------
	weapontex: { group: 'Weapon & knife finishes', label: 'every weapon texture the paint kits reference — 4.0 GB' },
	knifetex: { group: 'Weapon & knife finishes', label: 'knife view-model textures — 175 MB' },
	knifecomposite: { group: 'Weapon & knife finishes', label: 'knife composite inputs — 54 MB' },
	weaponcomposite: { group: 'Weapon & knife finishes', label: 'weapon composite inputs — 2.0 GB' },
	weaponcompmats: { group: 'Weapon & knife finishes', label: 'the composite MATERIALS beside them — 2.6 GB' },
	legacycompmats: { group: 'Weapon & knife finishes', label: 'legacy-mesh customization materials — 3.5 GB' },
	paintmats: { group: 'Weapon & knife finishes', label: 'the per-kit .vmat — THE kit -> pattern link — 3.2 GB' },
	compmats: { group: 'Weapon & knife finishes', label: 'the newer .vcompmat recipes (wear + seed inputs) — 15 MB' },
	compinputs: { group: 'Weapon & knife finishes', label: 'shared composite input textures — 3.5 GB' },
	position: { group: 'Weapon & knife finishes', label: 'per-weapon position maps as EXR — 3.5 GB' },
	templates: { group: 'Weapon & knife finishes', label: 'the gs_* paint templates kits instantiate — 36 MB' },
	defaults: { group: 'Weapon & knife finishes', label: 'the engine default textures kits fall back to — 37 MB' },
	compmatdata: { group: 'Weapon & knife finishes', label: 'the 5 loose recipes outside both paint trees — 24 KB' },

	// --- Gloves -------------------------------------------------------------------------------
	glovecompmats: { group: 'Gloves', label: 'the 99 glove finish recipes — 1.3 MB' },
	glovemats: { group: 'Gloves', label: 'glove kit materials + the textile bundles they name — 418 MB' },
	glovetex: { group: 'Gloves', label: "the textile bundles' textures — 61 MB" },
	glovemodeltex: { group: 'Gloves', label: 'per-glove material mask, AO and normal — 292 MB' },
	glovemodelmats: { group: 'Gloves', label: 'the per-glove RENDER materials — 64 MB' },
	glovepaintkitmats: { group: 'Gloves', label: 'the 26 new-generation glove recipes — 470 MB' },
	paintkits: { group: 'Gloves', label: 'the paintkits texture tree (weapons AND gloves) — 8.7 GB' },

	// --- Stickers & charms --------------------------------------------------------------------
	stickertex: { group: 'Stickers & charms', label: 'sticker artwork textures — 8.3 GB' },
	'stickertex-assets': { group: 'Stickers & charms', label: 'the newer sticker asset tree — into the same folder' },
	stickermats: { group: 'Stickers & charms', label: 'sticker materials (holo/foil/glitter params) — 7.3 GB' },
	keychainmats: { group: 'Stickers & charms', label: 'charm materials, incl. the $KeychainSeed rules — 199 MB' },
	keychaintex: { group: 'Stickers & charms', label: 'charm textures — 106 MB' },

	// --- 2D icons -----------------------------------------------------------------------------
	econicons: {
		group: '2D icons',
		label: "Valve's inventory art: music kits, coins, agents, patches — 379 MB",
	},
	skinicons: { group: '2D icons', label: 'the Steam market thumbnail for every skin — 691 MB' },

	// --- Game data & scene --------------------------------------------------------------------
	scripts: { group: 'Game data & scene', label: 'items_game.txt — REQUIRED by the manifest and by --gamedata — 8 MB' },
	localization: { group: 'Game data & scene', label: 'csgo_english.txt — every display name — 5 MB' },
	inventoryimagedata: { group: 'Game data & scene', label: "Valve's own camera + light rig per item — 348 KB" },
	skyboxtex: { group: 'Game data & scene', label: 'skybox textures — 48 KB' },
	skyboxmats: { group: 'Game data & scene', label: 'skybox materials — 994 MB' },
}

/** Group render order. Not alphabetical: most-wanted first. */
const GROUP_ORDER = [
	'Game data & scene',
	'Models & animation',
	'Weapon & knife finishes',
	'Gloves',
	'Stickers & charms',
	'2D icons',
]

/** What a picked option resolves to: the argv to re-exec with, and which script to run it against. */
export type Plan = { script: 'export' | 'gamedata'; argv: string[]; summary: string; heavy?: boolean }

/**
 * The presets, and the argv each one is exactly equivalent to. Kept as data so `interactive.test.ts`
 * can assert the mapping rather than trusting a screenshot.
 */
export const PRESETS: Record<string, Plan> = {
	gamedata: {
		script: 'gamedata',
		argv: [],
		summary: 'Regenerate the seven data/*.json game-data lists from the export already on disk.',
	},
	manifest: {
		script: 'export',
		argv: ['--manifest-only'],
		summary: 'Rebuild manifest.json, data/weapontex-index.json and link-report.txt. Re-extracts nothing.',
	},
	discover: {
		script: 'export',
		argv: ['--discover'],
		summary: "Resolve all 40 jobs' in-VPK filters against your install. Extracts nothing.",
	},
	list: { script: 'export', argv: ['--list'], summary: 'List every VPK the install exposes, plus a shader inventory.' },
	sample: {
		script: 'export',
		argv: ['--sample'],
		summary: 'Run all 40 jobs narrowed to one folder each, into ./out-sample.',
		heavy: true,
	},
	full: {
		script: 'export',
		argv: [],
		summary: 'Run all 40 jobs. WIPES the output folder first.',
		heavy: true,
	},
}

const bail = (): never => {
	cancel('Nothing was exported.')
	process.exit(0)
}

/** `groupMultiselect`'s shape: group title -> options, in `GROUP_ORDER`. */
const jobOptions = (jobNames: string[]) => {
	const grouped: Record<string, { value: string; label: string; hint: string }[]> = {}
	for (const name of jobNames) {
		const info = JOB_GROUPS[name]
		// A job with no entry is a code change that forgot this table. Show it rather than hide it —
		// a silently missing job is the failure this whole sibling-table arrangement risks.
		const group = info?.group ?? 'Ungrouped (add it to JOB_GROUPS in interactive.ts)'
		grouped[group] ??= []
		grouped[group].push({ value: name, label: name, hint: info?.label ?? '?' })
	}
	const ordered: typeof grouped = {}
	for (const g of GROUP_ORDER) if (grouped[g]) ordered[g] = grouped[g]
	for (const g of Object.keys(grouped)) if (!ordered[g]) ordered[g] = grouped[g]
	return ordered
}

export type PromptContext = {
	/** Job names, in `JOBS` order, passed in because `export.ts` cannot be imported. */
	jobNames: string[]
	/** Resolved output folder, or null when it does not exist yet. */
	out: string
	/** Resolved `<install>/game`, or an error message when discovery failed. */
	cs2: string | Error
	/** The Source2Viewer CLI path, and whether it is already built. */
	cli: string
}

/** Ask, then hand back the plan. Exits the process on cancel. */
export const promptForPlan = async (ctx: PromptContext): Promise<Plan> => {
	const outExists = existsSync(join(ctx.out, 'manifest.json'))
	const cliBuilt = existsSync(ctx.cli)

	intro('CS2 asset export')

	note(
		[
			`CS2 install   ${ctx.cs2 instanceof Error ? 'NOT FOUND — pass --cs2 <install path>' : ctx.cs2}`,
			`Output        ${ctx.out}${outExists ? '  (an export is already here)' : '  (empty)'}`,
			`Decompiler    ${cliBuilt ? 'built' : 'NOT BUILT — needs the .NET 10 SDK on first run'}`,
			'',
			'Everything below is also a flag. The command is printed before anything runs, so you',
			'can paste it into a script instead of coming back here.',
		].join('\n'),
		'Where things are',
	)

	if (ctx.cs2 instanceof Error) {
		log.warn('Without a CS2 install only --list and --manifest-only can do anything.')
	}
	if (!cliBuilt) {
		log.warn('The decompiler is built from VRF master on first use. `--manifest-only` needs no toolchain.')
	}

	const choice = await select({
		message: 'What do you want to do?',
		initialValue: outExists ? 'gamedata' : 'discover',
		options: [
			{
				value: 'gamedata',
				label: 'Game data only  (the seven data/*.json lists)',
				hint: 'seconds. The usual answer after a CS2 update. Needs an existing export',
			},
			{
				value: 'discover',
				label: 'Check my install  (--discover)',
				hint: 'extracts nothing. Always safe, and the right first run',
			},
			{
				value: 'jobs',
				label: 'Pick jobs...',
				hint: 'a checklist of all 40. Does NOT wipe the output folder',
			},
			{
				value: 'manifest',
				label: 'Rebuild the manifest  (--manifest-only)',
				hint: 'seconds, no toolchain, re-extracts nothing',
			},
			{
				value: 'sample',
				label: 'Sample export  (--sample)',
				hint: 'every job narrowed. ~4 GB, tens of minutes, writes to ./out-sample',
			},
			{
				value: 'full',
				label: 'FULL export  (all 40 jobs)',
				hint: 'hours, ~55 GB, and it DELETES the output folder first',
			},
			{ value: 'list', label: 'List the VPKs  (--list)', hint: 'inventory only' },
		],
	})
	if (isCancel(choice)) bail()

	let plan: Plan
	if (choice === 'jobs') {
		const picked = await groupMultiselect({
			message: 'Which jobs? (space toggles, a picks a whole group, enter confirms)',
			options: jobOptions(ctx.jobNames),
			required: true,
			// Groups are labels, not selectable units — selecting one selects its children.
			selectableGroups: true,
		})
		if (isCancel(picked)) bail()
		const jobs = (picked as string[]).filter(n => ctx.jobNames.includes(n))
		if (!jobs.length) {
			log.error('No jobs selected.')
			bail()
		}
		plan = {
			script: 'export',
			argv: ['--only', jobs.join(',')],
			summary: `Run ${jobs.length} job(s): ${jobs.join(', ')}`,
			heavy: jobs.length > 6,
		}
	} else {
		plan = PRESETS[choice as string]
	}

	const command =
		plan.script === 'gamedata'
			? `bun run generate-gamedata.ts${plan.argv.length ? ` ${plan.argv.join(' ')}` : ''}`
			: `bun run export.ts${plan.argv.length ? ` ${plan.argv.join(' ')}` : ''}`

	note([plan.summary, '', `Equivalent to:  ${command}`].join('\n'), 'About to run')

	if (choice === 'full') {
		log.warn('A full export takes hours and writes ~55 GB.')
		log.warn(`It DELETES ${ctx.out} before it starts. Anything you put in there by hand is gone.`)
	}
	if (plan.heavy && choice !== 'full') log.warn('This writes several GB and takes a while.')

	const go = await confirm({ message: 'Run it?', initialValue: choice !== 'full' })
	if (isCancel(go) || !go) bail()

	note(
		[
			'When it finishes:',
			'  bun run publish.ts --verify            audit the CDN against this build (read-only)',
			'  bun run publish.ts --upload            print the upload plan, write nothing',
			'  bun run publish.ts --upload --confirm  WRITES. Publish data/ before deploying an API',
			'                                         that reads it, or the API serves stale lists.',
			'',
			'See README.md for the job table and troubleshooting, CDN.md for cache headers.',
		].join('\n'),
		'Next',
	)
	outro(`Running: ${command}`)
	return plan
}

/**
 * Re-exec `export.ts` (or `generate-gamedata.ts`) with the resolved flags and return its exit code.
 *
 * A CHILD PROCESS AND NOT AN IN-PROCESS CALL. `export.ts` reads `--sample` and `--out` at module
 * scope to derive the output folder, so a plan chosen after those constants were evaluated could not
 * change them. Re-execing means the real run sees the flags the ordinary way, which also makes the
 * printed command literally true rather than approximately true.
 */
export const runPlan = async (plan: Plan, here: string) => {
	const script = join(here, plan.script === 'gamedata' ? 'generate-gamedata.ts' : 'export.ts')
	// `--yes` on the child so it can never prompt again, even for the `full` preset whose argv is
	// otherwise empty — an empty argv is exactly what `shouldPrompt` treats as "ask me".
	const child = Bun.spawn([process.execPath, 'run', script, ...plan.argv, '--yes'], {
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
		// An argv array, never a shell string: correct on every platform, and `process.execPath` is
		// already the absolute path to the running bun binary (`bun.exe` on Windows).
		cwd: here,
	})
	return await child.exited
}
