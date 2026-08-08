/**
 * The menu — what `bun run export.ts` does when given no arguments on a terminal, and now the only
 * thing anybody needs to know how to type.
 *
 * WHY THIS EXISTS. The bare command used to be the single most destructive thing in the repo: it ran
 * all 40 jobs, took hours, wrote ~55 GB, and **deleted the existing output folder first**. Nothing
 * warned. A newcomer's most natural invocation was also the worst one.
 *
 * WHY IT COVERS EVERYTHING AND NOT JUST EXPORTING. Half the tool used to be reachable only through
 * a memorised command line, and the half that mattered most was publishing:
 *
 *     bun --env-file=.env run publish.ts --upload --prefix data --confirm
 *
 * Six tokens, four of which are load-bearing, one of which writes to a production CDN. Nobody should
 * have to hold that in their head, and an operator who half-remembers it is worse off than one who
 * never knew it. So every operation the tool can perform is a menu entry: check, export, game data,
 * verify, upload, and a read-only screen that answers "why did that fail" before it has to be asked.
 *
 * HOW IT STAYS HONEST — IT RE-EXECS. The menu never calls into the exporter or the publisher. It
 * resolves a choice into the exact ARGV a person would have typed, prints that command, and spawns
 * the script with those flags. So the interactive path and the flag path are the same path by
 * construction: there is no second implementation of "what runs" to drift, and the command it prints
 * is one you can paste into a script. `--env-file` is part of that printed command whenever a `.env`
 * is there, which is how credentials "just work" without the menu ever reading a secret itself.
 *
 * WHAT IT MUST NEVER DO IS HANG. `shouldPrompt` refuses in every non-human situation — any argument
 * at all, a non-TTY stdin (a pipe, a cron job, CI), `CI=true`, or an explicit `--yes`. In those cases
 * the caller falls through to today's behaviour unchanged, so the root `package.json` scripts and
 * anything scripted keep working exactly as they did.
 *
 * A FAILED OPERATION RETURNS HERE, it does not end the session. The menu is a loop: an operation
 * that exits non-zero is reported with its exit code and the path to its log, and the menu comes
 * back. Only `Quit` leaves.
 *
 * Prompts are `@clack/prompts`, which degrades its box-drawing and checkbox glyphs to ASCII
 * (`[+]` / `[ ]` / `|`) when the terminal cannot do Unicode — it checks `WT_SESSION` among others, so
 * Windows Terminal gets the nice characters and `cmd.exe` gets the readable fallback. Nothing here
 * writes a raw ANSI escape.
 */

import { confirm, groupMultiselect, intro, isCancel, log, note, outro, select, text } from '@clack/prompts'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ORIGIN_ENV, R2_ENV, credentialReport, envFilePath } from './platform'
import { childEnv, currentLog, defaultLogDir } from './runlog'

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
export type Plan = {
	script: 'export' | 'gamedata' | 'publish'
	argv: string[]
	summary: string
	/** Writes several GB and/or takes a long time. Gets a warning and a defensive default. */
	heavy?: boolean
	/**
	 * Spawn with `--env-file=<repo>/.env` when that file exists, so R2 credentials load without the
	 * operator having to know the flag. The menu itself never reads a value out of it.
	 */
	needsEnv?: boolean
	/** WRITES to the CDN. Reachable only through a successful dry run plus an explicit confirm. */
	writes?: boolean
}

const SCRIPT_FILE: Record<Plan['script'], string> = {
	export: 'export.ts',
	gamedata: 'generate-gamedata.ts',
	publish: 'publish.ts',
}

/**
 * The presets, and the argv each one is exactly equivalent to. Kept as data so `interactive.test.ts`
 * can assert the mapping rather than trusting a screenshot.
 */
export const PRESETS: Record<string, Plan> = {
	// ---- export.ts ----------------------------------------------------------------------------
	discover: {
		script: 'export',
		argv: ['--discover'],
		summary: "Resolve all 40 jobs' in-VPK filters against your install. Extracts nothing.",
	},
	list: { script: 'export', argv: ['--list'], summary: 'List every VPK the install exposes, plus a shader inventory.' },
	manifest: {
		script: 'export',
		argv: ['--manifest-only'],
		summary: 'Rebuild manifest.json, data/weapontex-index.json and link-report.txt. Re-extracts nothing.',
	},
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

	// ---- generate-gamedata.ts ------------------------------------------------------------------
	gamedata: {
		script: 'gamedata',
		argv: [],
		summary: 'Regenerate the seven data/*.json game-data lists from the export already on disk.',
	},
	'gamedata-dry': {
		script: 'gamedata',
		argv: ['--dry-run'],
		summary: 'Build the seven lists and print the report. Writes nothing.',
	},
	'gamedata-compare': {
		script: 'gamedata',
		argv: ['--compare'],
		summary: 'Regenerate the lists, then diff every one against the upstream copy it replaced.',
	},

	// ---- publish.ts, read-only half ------------------------------------------------------------
	verify: {
		script: 'publish',
		argv: ['--verify'],
		summary: 'Audit the CDN against this build: every manifest entry, sampled. Reads only.',
		needsEnv: true,
	},
	'verify-quick': {
		script: 'publish',
		argv: ['--verify', '--quick'],
		summary: 'The fast audit — control files and a sample of assets. Reads only.',
		needsEnv: true,
	},
	'verify-deep': {
		script: 'publish',
		argv: ['--verify', '--deep'],
		summary: 'Check EVERY file on the origin, not a sample. Slow. Reads only.',
		needsEnv: true,
		heavy: true,
	},
}

/**
 * The upload pair. Two functions rather than two presets because the prefix is chosen at runtime,
 * and — more importantly — because the confirm half must be *derived from the dry run's outcome*
 * instead of merely following it in a script.
 */
export const uploadDryPlan = (prefixes: string[]): Plan => ({
	script: 'publish',
	argv: ['--upload', ...(prefixes.length ? ['--prefix', prefixes.join(',')] : [])],
	summary: prefixes.length
		? `Print exactly which files under ${prefixes.join(', ')} would be uploaded. Writes NOTHING.`
		: 'Print exactly which files would be uploaded. Writes NOTHING.',
	needsEnv: true,
})

/**
 * The real upload — **or null when the dry run did not succeed**.
 *
 * THE GUARD IS THE POINT. Upload is the one destructive, outward-facing operation in the tool, and
 * the ordering "dry run, then confirm" is worth nothing if the confirm is offered anyway after the
 * dry run failed: a dry run that exits non-zero has failed to enumerate the work — a missing export,
 * an unreadable bucket, a credential typo — so what a confirmed run would then do is unknown, and
 * "unknown" is not something to answer yes to. Returning null makes the confirm step *unreachable*
 * rather than merely discouraged, and being a pure function of the exit code it is provable in a
 * test instead of demonstrable in a screenshot.
 */
export const uploadConfirmPlan = (dryRunExit: number, prefixes: string[]): Plan | null => {
	if (dryRunExit !== 0) return null
	const dry = uploadDryPlan(prefixes)
	return {
		...dry,
		argv: [...dry.argv, '--confirm'],
		summary: prefixes.length
			? `UPLOAD ${prefixes.join(', ')} to the CDN. This writes.`
			: 'UPLOAD the whole build to the CDN. This writes.',
		writes: true,
		heavy: !prefixes.length,
	}
}

/**
 * The command the plan is equivalent to, as a copy-pasteable line.
 *
 * `--env-file` appears only when the file is really there, because this string's whole value is that
 * it is true. Bun ignores a `--env-file` pointing at nothing, so an unconditional one would not
 * break — it would just teach people a flag that does nothing on their machine.
 */
export const commandFor = (plan: Plan, envFile?: string | null) => {
	const env = plan.needsEnv && envFile ? `--env-file=${envFile} ` : ''
	return `bun ${env}run ${SCRIPT_FILE[plan.script]}${plan.argv.length ? ` ${plan.argv.join(' ')}` : ''}`
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
	/** Repo root — where `.env`, the scripts and `logs/` live. */
	here: string
}

/** `null` means "the operator cancelled out of this submenu"; the caller redraws the main menu. */
type Choice<T> = T | null

const back = <T>(value: T | symbol): Choice<T> => (isCancel(value) ? null : (value as T))

// ---------------------------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------------------------

const exportMenu = async (ctx: PromptContext): Promise<Choice<Plan>> => {
	const pick = back(
		await select({
			message: 'Export what?',
			options: [
				{ value: 'discover', label: 'Just check my install first  (--discover)', hint: 'extracts nothing' },
				{
					value: 'jobs',
					label: 'Pick individual jobs...',
					hint: 'a checklist of all 40. Does NOT wipe the output folder',
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
				{ value: 'manifest', label: 'Rebuild the manifest  (--manifest-only)', hint: 'seconds, no toolchain' },
				{ value: 'list', label: 'List the VPKs  (--list)', hint: 'inventory only' },
				{ value: 'back', label: 'Back' },
			],
		}),
	)
	if (!pick || pick === 'back') return null
	if (pick !== 'jobs') return PRESETS[pick]

	const picked = back(
		await groupMultiselect({
			message: 'Which jobs? (space toggles, a picks a whole group, enter confirms)',
			options: jobOptions(ctx.jobNames),
			required: true,
			// Groups are labels, not selectable units — selecting one selects its children.
			selectableGroups: true,
		}),
	)
	if (!picked) return null
	const jobs = (picked as string[]).filter(n => ctx.jobNames.includes(n))
	if (!jobs.length) {
		log.error('No jobs selected.')
		return null
	}
	return {
		script: 'export',
		argv: ['--only', jobs.join(',')],
		summary: `Run ${jobs.length} job(s): ${jobs.join(', ')}`,
		heavy: jobs.length > 6,
	}
}

const gamedataMenu = async (): Promise<Choice<Plan>> => {
	const pick = back(
		await select({
			message: 'Game data — the seven data/*.json lists, rebuilt from the export on disk.',
			options: [
				{ value: 'gamedata', label: 'Regenerate and write them', hint: 'seconds. The usual answer after a CS2 update' },
				{ value: 'gamedata-dry', label: 'Dry run  (--dry-run)', hint: 'build them, print the report, write nothing' },
				{ value: 'gamedata-compare', label: 'Write, then compare with upstream  (--compare)', hint: 'downloads to diff' },
				{ value: 'back', label: 'Back' },
			],
		}),
	)
	return !pick || pick === 'back' ? null : PRESETS[pick]
}

const verifyMenu = async (): Promise<Choice<Plan>> => {
	const pick = back(
		await select({
			message: 'Verify — audits the CDN against the build in your output folder. Read-only.',
			options: [
				{ value: 'verify', label: 'Standard  (--verify)', hint: 'control files in full, assets sampled' },
				{ value: 'verify-quick', label: 'Quick  (--verify --quick)', hint: 'the fastest useful check' },
				{ value: 'verify-deep', label: 'Deep  (--verify --deep)', hint: 'EVERY file on the origin. Slow' },
				{ value: 'back', label: 'Back' },
			],
		}),
	)
	return !pick || pick === 'back' ? null : PRESETS[pick]
}

/** Which prefix to narrow the upload to. `data` is the common answer and is offered first. */
const uploadPrefixes = async (): Promise<Choice<string[]>> => {
	const pick = back(
		await select({
			message: 'Upload what?',
			initialValue: 'data',
			options: [
				{
					value: 'data',
					label: 'data/ only',
					hint: 'the seven JSON lists + items_game.json. Megabytes. What a CS2 update usually needs',
				},
				{ value: 'all', label: 'Everything', hint: 'the whole build. Tens of GB on a first publish' },
				{ value: 'custom', label: 'A prefix I type...', hint: 'e.g. models,keychains' },
				{ value: 'back', label: 'Back' },
			],
		}),
	)
	if (!pick || pick === 'back') return null
	if (pick === 'all') return []
	if (pick === 'data') return ['data']
	const typed = back(
		await text({
			message: 'Prefix(es), comma-separated — matched against paths relative to the output folder.',
			placeholder: 'models,keychains',
			validate: v => (v?.trim() ? undefined : 'Type a prefix, or press escape to go back.'),
		}),
	)
	if (typed === null) return null
	return String(typed)
		.split(',')
		.map(p => p.trim())
		.filter(Boolean)
}

/**
 * Paths, toolchain and credentials, read-only.
 *
 * IT ANSWERS "WHY DID THAT FAIL" BEFORE IT IS ASKED, which is the entire reason it is a menu entry
 * rather than a paragraph in the README. Every line here has been the cause of a support message:
 * a CS2 install on a second drive, a decompiler that was never built, an `.env` in the wrong folder.
 *
 * NO SECRET IS PRINTED — only whether each variable is set, and *where from*, because "it is in
 * .env but this process did not load it" and "it is not set" need different fixes. The origin IS
 * printed in full: it is not a secret, and a wrong one is the failure `resolveOrigin` exists to
 * catch, which can only be spotted by reading it.
 */
const settingsScreen = (ctx: PromptContext) => {
	const creds = credentialReport(ctx.here)
	const outExists = existsSync(join(ctx.out, 'manifest.json'))
	const logDir = defaultLogDir()
	const mark = (name: string) => {
		const source = creds.source[name]
		return source ? `set (from ${source})` : 'NOT SET'
	}
	note(
		[
			`CS2 install    ${ctx.cs2 instanceof Error ? 'NOT FOUND — pick "Check my install" for the search path' : ctx.cs2}`,
			`Output         ${ctx.out}${outExists ? '   (an export is here)' : '   (nothing exported yet)'}`,
			`Decompiler     ${existsSync(ctx.cli) ? `built — ${ctx.cli}` : 'NOT BUILT (built on first use, needs .NET 10)'}`,
			`Logs           ${logDir}${currentLog().path ? `\n               this run: ${currentLog().path}` : ''}`,
			'',
			`Credentials    ${creds.fileExists ? creds.file : `${creds.file}  — NOT PRESENT`}`,
			...R2_ENV.map(name => `  ${name.padEnd(22)}${mark(name)}`),
			`  ${ORIGIN_ENV.padEnd(22)}${creds.origin ? creds.origin : 'NOT SET'}`,
			'',
			creds.missingForUpload.length
				? `Uploading needs ${creds.missingForUpload.join(', ')} — add them to ${creds.file}`
				: 'Uploading has everything it needs.',
			creds.missingForVerify.length
				? `Verifying needs ${ORIGIN_ENV} (your CDN origin) — add it to ${creds.file}`
				: 'Verifying has everything it needs.',
			'',
			'Values are never shown, only whether each one is set. Nothing on this screen changes anything.',
		].join('\n'),
		'Where things are',
	)
}

// ---------------------------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------------------------

/**
 * Announce a plan the same way every time — the summary, the equivalent command, the warnings — and
 * take the go/no-go. Returns false when the operator backs out.
 */
const announce = async (plan: Plan, ctx: PromptContext, extraWarnings: string[] = []) => {
	const envFile = existsSync(envFilePath(ctx.here)) ? envFilePath(ctx.here) : null
	note([plan.summary, '', `Equivalent to:  ${commandFor(plan, envFile)}`].join('\n'), 'About to run')
	for (const warning of extraWarnings) log.warn(warning)
	if (plan.heavy && !plan.writes) log.warn('This writes several GB and takes a while.')
	const go = await confirm({ message: plan.writes ? 'Upload for real?' : 'Run it?', initialValue: !plan.writes })
	return !isCancel(go) && go === true
}

/**
 * Re-exec a script with the resolved flags and return its exit code.
 *
 * A CHILD PROCESS AND NOT AN IN-PROCESS CALL. `export.ts` reads `--sample` and `--out` at module
 * scope to derive the output folder, so a plan chosen after those constants were evaluated could not
 * change them. Re-execing means the real run sees the flags the ordinary way, which also makes the
 * printed command literally true rather than approximately true. The child inherits
 * `CS2_EXPORT_LOG_FILE`, so its output lands in the same log as the menu choice that caused it.
 */
export const runPlan = async (plan: Plan, here: string) => {
	const envFile = plan.needsEnv && existsSync(envFilePath(here)) ? envFilePath(here) : null
	// `--yes` on the child so it can never prompt again, even for the `full` preset whose argv is
	// otherwise empty — an empty argv is exactly what `shouldPrompt` treats as "ask me". Only
	// export.ts reads it; publish.ts and generate-gamedata.ts ignore unknown flags.
	const yes = plan.script === 'export' ? ['--yes'] : []
	const argv = [
		process.execPath,
		...(envFile ? [`--env-file=${envFile}`] : []),
		'run',
		join(here, SCRIPT_FILE[plan.script]),
		...plan.argv,
		...yes,
	]
	currentLog().line(`menu: running ${argv.slice(1).join(' ')}`)
	const child = Bun.spawn(argv, {
		stdin: 'inherit',
		stdout: 'inherit',
		stderr: 'inherit',
		// An argv array, never a shell string: correct on every platform, and `process.execPath` is
		// already the absolute path to the running bun binary (`bun.exe` on Windows).
		cwd: here,
		// EXPLICIT, because `Bun.spawn` snapshots the environment at process start and does not see
		// `process.env` mutations made since — so the log path this process opened would not reach the
		// child, and one user action would end up split across two log files. See `childEnv`.
		env: childEnv(),
	})
	const code = await child.exited
	currentLog().line(`menu: ${SCRIPT_FILE[plan.script]} exited ${code}`)
	return code
}

/** Report an operation's outcome and keep the session alive. */
const reportOutcome = (plan: Plan, code: number) => {
	if (code === 0) {
		log.success(`${SCRIPT_FILE[plan.script]} finished.`)
		return
	}
	log.error(`${SCRIPT_FILE[plan.script]} exited with code ${code}. Nothing else has been run.`)
	const path = currentLog().path
	if (path) log.info(`The full log, including any subprocess output, is at:\n${path}`)
}

/**
 * The upload flow, which is the only one with a shape of its own.
 *
 * DRY RUN FIRST, ALWAYS, AND WITHOUT ASKING. There is no menu path that reaches `--confirm` without
 * one having just run and succeeded — see `uploadConfirmPlan`. The credential check comes before
 * even that, because a missing variable should be a sentence naming the variable, not a stack from
 * inside the S3 client.
 */
const uploadFlow = async (ctx: PromptContext) => {
	const creds = credentialReport(ctx.here)
	if (creds.missingForUpload.length || creds.missingForVerify.length) {
		const missing = [...new Set([...creds.missingForUpload, ...creds.missingForVerify])]
		log.error(
			[
				`Not set: ${missing.join(', ')}`,
				'',
				`They go in ${creds.file}${creds.fileExists ? '' : ', which does not exist yet'} — one KEY=value per line:`,
				...missing.map(name => `  ${name}=...`),
				'',
				'That file is gitignored. This menu passes it to the publisher for you; you never need',
				'the --env-file flag yourself.',
			].join('\n'),
		)
		return
	}

	const prefixes = await uploadPrefixes()
	if (prefixes === null) return

	const dry = uploadDryPlan(prefixes)
	// Accurate, and worth being accurate about: without `--since` the dry run never calls
	// `openBucket`, so it reads the local build and prints the plan without touching the network at
	// all. Saying "it contacts the bucket" would be a small lie in the one place people are deciding
	// how much to trust the tool.
	if (
		!(await announce(dry, ctx, [
			'This is the DRY RUN: it reads your build and prints the plan. It contacts nothing and writes nothing.',
		]))
	)
		return
	const dryCode = await runPlan(dry, ctx.here)
	reportOutcome(dry, dryCode)

	const real = uploadConfirmPlan(dryCode, prefixes)
	if (!real) {
		log.warn('The dry run did not succeed, so the real upload is not offered. Fix the above and try again.')
		return
	}

	log.warn('Everything above this line was a rehearsal. The next step WRITES to the CDN.')
	if (
		!(await announce(real, ctx, [
			`Target origin: ${creds.origin}`,
			prefixes.length
				? `Only paths under ${prefixes.join(', ')} are sent.`
				: 'The WHOLE build is sent — tens of GB on a first publish.',
			'publish.ts refuses a bucket that holds objects but no manifest.json, so a bucket borrowed',
			'from another project is caught before anything is written.',
		]))
	) {
		log.info('Nothing was uploaded.')
		return
	}
	reportOutcome(real, await runPlan(real, ctx.here))
}

/**
 * Draw the menu until the operator quits. Returns the process exit code.
 *
 * ALWAYS ZERO. A failed operation has already been reported with its own exit code and its log path,
 * and the session continued past it — exiting non-zero at the end would be claiming the *menu*
 * failed, and on Windows it would make `run.bat` pause over a session that ended normally.
 */
export const runInteractive = async (ctx: PromptContext): Promise<number> => {
	const outExists = existsSync(join(ctx.out, 'manifest.json'))
	const cliBuilt = existsSync(ctx.cli)

	intro('CS2 asset export')
	note(
		[
			`CS2 install   ${ctx.cs2 instanceof Error ? 'NOT FOUND — pass --cs2 <install path>' : ctx.cs2}`,
			`Output        ${ctx.out}${outExists ? '  (an export is already here)' : '  (empty)'}`,
			`Decompiler    ${cliBuilt ? 'built' : 'NOT BUILT — needs the .NET 10 SDK on first run'}`,
			currentLog().path ? `Log           ${currentLog().path}` : '',
			'',
			'Everything below is also a flag. The command is printed before anything runs, so you',
			'can paste it into a script instead of coming back here.',
		]
			.filter(Boolean)
			.join('\n'),
		'Where things are',
	)
	if (ctx.cs2 instanceof Error) log.warn('Without a CS2 install only "List the VPKs" and "Rebuild the manifest" work.')
	if (!cliBuilt)
		log.warn('The decompiler is built from VRF master on first use. Rebuilding the manifest needs no toolchain.')

	for (;;) {
		const choice = await select({
			message: 'What do you want to do?',
			initialValue: outExists ? 'gamedata' : 'discover',
			options: [
				{
					value: 'discover',
					label: 'Check my install',
					hint: 'resolves all 40 job filters, extracts nothing. Always safe, and the right first run',
				},
				{ value: 'export', label: 'Export assets...', hint: 'full, a sample, or a checklist of individual jobs' },
				{ value: 'gamedata', label: 'Regenerate the game data...', hint: 'the seven data/*.json lists. Seconds' },
				{ value: 'verify', label: 'Verify the CDN...', hint: 'read-only audit of the origin against this build' },
				{ value: 'upload', label: 'Upload to the CDN...', hint: 'dry run first, always. Then an explicit confirm' },
				{ value: 'settings', label: 'Where things are', hint: 'paths, toolchain, credentials. Changes nothing' },
				{ value: 'quit', label: 'Quit' },
			],
		})
		// Escape / Ctrl-C at the TOP level means "I am done" — the submenus treat it as "go back".
		if (isCancel(choice) || choice === 'quit') {
			outro('Nothing else to do.')
			return 0
		}

		let plan: Choice<Plan> = null
		switch (choice) {
			case 'discover':
				plan = PRESETS.discover
				break
			case 'export':
				plan = await exportMenu(ctx)
				break
			case 'gamedata':
				plan = await gamedataMenu()
				break
			case 'verify':
				plan = await verifyMenu()
				break
			case 'upload':
				await uploadFlow(ctx)
				continue
			case 'settings':
				settingsScreen(ctx)
				continue
		}
		if (!plan) continue

		const isFull = plan.script === 'export' && !plan.argv.length
		const warnings = isFull
			? [
					'A full export takes hours and writes ~55 GB.',
					`It DELETES ${ctx.out} before it starts. Anything you put in there by hand is gone.`,
				]
			: []
		// The full export is the one option whose default answer is "no".
		if (isFull) {
			note(
				[plan.summary, '', `Equivalent to:  ${commandFor(plan)}`].join('\n'),
				'About to run',
			)
			for (const warning of warnings) log.warn(warning)
			const sure = await confirm({ message: 'Wipe the output folder and run the full export?', initialValue: false })
			if (isCancel(sure) || !sure) {
				log.info('Nothing was exported.')
				continue
			}
		} else if (!(await announce(plan, ctx))) {
			continue
		}

		reportOutcome(plan, await runPlan(plan, ctx.here))
	}
}
