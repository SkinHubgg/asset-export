/**
 * `--sync` — what an operator actually does after a CS2 patch, as one option instead of four
 * commands and a memory of which order they go in.
 *
 * IT IS COMPOSITION, NOT NEW MACHINERY. Every part already existed and none of it is reimplemented
 * here: `--incremental` re-extracts only the entries whose CRC32 the game changed (the decompiler's
 * own `--vpk_cache`, never wiping the output folder), the seven game-data lists regenerate at the
 * end of any export whose inputs are present, and `publish.ts --upload --since` uploads only the
 * delta and `--verify` proves the origin serves it. `--sync` runs those four in order.
 *
 * WHAT THIS FILE IS FOR IS THE SEAM BETWEEN THEM — the reporting. Four honest steps in a row can
 * still add up to a dishonest summary, and the three ways that happens are all worth naming:
 *
 *  1. "INCREMENTAL" DOES NOT MEAN "EVERYTHING WAS CACHED". Eight of the forty jobs re-extract in
 *     full every single time, because `--vpk_cache` records CRCs only for the entries matching `-e`
 *     and cannot see the PNG texture sidecars `--gltf_export_materials` writes beside each GLB. So
 *     the summary always states that count. A run reported as incremental that quietly re-did 4.5 GB
 *     is the kind of half-truth that makes people stop reading summaries.
 *
 *  2. "NOTHING TO EXTRACT" IS NOT "NOTHING TO UPLOAD". They are different questions with different
 *     answers, and collapsing them hides the exact case worth catching: a previous publish that
 *     failed part-way leaves the game unchanged and the CDN stale. The publish step therefore runs
 *     even when the extraction changed nothing, and the two facts get their own fields and their own
 *     sentences.
 *
 *  3. A DELTA OF ZERO IS A CLAIM ABOUT THE LAST PUBLISH, NOT ABOUT THE ORIGIN. `--since` compares
 *     against `.publish-state.json` (or, with credentials, the bucket's ETags). "Nothing has changed
 *     since the last publish" is what that supports; "the CDN is correct" is not, and only `--verify`
 *     can say it. The wording below is careful about which one it is making.
 *
 * A REPORT FILE, BECAUSE THE MENU RE-EXECS. `interactive.ts` never calls into the exporter — it
 * spawns it with real flags and sees an exit code and nothing else, which is what keeps the menu and
 * the command line the same path. An exit code cannot carry "and there were 0 files to upload", so
 * when `CS2_EXPORT_SYNC_REPORT` names a path the exporter drops this small JSON there and the menu
 * reads it. Unset — every scripted invocation — nothing is written and nothing changes. Passing a
 * path to a child through the environment is the same arrangement `CS2_EXPORT_LOG_FILE` already uses.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'

/** Names the file `export.ts --sync` writes its outcome to. Set by the menu; unset everywhere else. */
export const SYNC_REPORT_ENV = 'CS2_EXPORT_SYNC_REPORT'

/**
 * Why the CRC cache did or did not apply.
 *
 * `unwritable` is its own state rather than a flavour of `off` because it changes what the summary
 * is ALLOWED to say. The manifest's path is hardcoded by the decompiler as `<archive>.manifest.txt`
 * — inside the CS2 install — so under `C:\Program Files (x86)` it needs elevation. Without it every
 * job re-extracts, which means the run has no evidence about what the game changed, and the summary
 * must not offer any.
 */
export type SyncCache = 'used' | 'unwritable' | 'off'

export type SyncReport = {
	cache: SyncCache
	/**
	 * How the jobs that ran split three ways. A PARTITION, not two buckets and a leftover: their sum
	 * is what the summary calls "all N jobs", so a job in no bucket makes that sentence wrong.
	 *
	 *   cached    the cache applied — entries whose CRC32 was unchanged were not re-extracted
	 *   full      a glTF job, which can never be cached (its PNG texture sidecars are not CRC-tracked)
	 *   uncached  everything else. When `cache` is `used` that means exactly one thing — the job's
	 *             output folder was empty, so the cache had nothing to be a cache OF and skipping
	 *             would have produced silence instead of files. When the cache is `off` or
	 *             `unwritable` it is simply every non-glTF job, and the summary says so differently.
	 */
	jobs: { cached: number; full: number; uncached: number }
	/** Per-ENTRY counts from the decompiler itself, summed over the cached jobs only. */
	entries: { written: number; skipped: number }
	/**
	 * What happened to the seven `data/*.json` lists — worth its own field because they are the files
	 * a CS2 patch changes most often and the ones consumers read first.
	 *
	 * `failed` IS NOT `skipped`. Skipped means the export held no `items_game.txt` to build them from
	 * (`--only <one job>`), so `data/` is as old as the assets beside it and consistent with them.
	 * Failed means the assets moved and the lists did not, which is the one state where publishing
	 * makes things worse than not publishing — so it gets said, loudly, in both the summary and the
	 * menu, rather than being folded into a boolean.
	 */
	gameData: 'regenerated' | 'skipped' | 'failed'
	/** null when the publish step did not run (it always does under --sync; this is for reuse). */
	publish: null | {
		/** Files the publisher would send, or did. */
		pending: number
		uploaded: number
		bytes: number
		/**
		 * Whether `pending` is really a DELTA. False when `--since` had neither a state file nor
		 * credentials, in which case the publisher shows the whole build and says so — reporting that
		 * as "73,000 files changed" would be a lie told in the operator's own units.
		 */
		delta: boolean
		dryRun: boolean
	}
}

/** Bytes, human-sized. A six-line copy rather than an import: this module stays a leaf. */
const bytes = (n: number) => {
	if (n < 1024) return `${n} B`
	if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
	if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
	return `${(n / 1024 ** 3).toFixed(2)} GB`
}

const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`

/**
 * Whether the extraction half is entitled to say "the game did not change".
 *
 * Four conditions, and only the first is obvious. The cache has to have been USED, or nothing was
 * compared. Something must have been SKIPPED: a run where both counts are zero compared nothing — an
 * empty filter, a `--only` matching a job with no entries — and "0 written" there means "no
 * evidence", not "no change". And no job may have been rebuilt from an empty folder, because that
 * job wrote its entire output and simply was not counted entry by entry.
 */
export const extractionWasClean = (r: SyncReport) =>
	r.cache === 'used' && r.entries.written === 0 && r.entries.skipped > 0 && r.jobs.uncached === 0

/** Whether the publish half found work. `null` (no publish step) counts as "unknown", not as "no". */
export const publishHasWork = (r: SyncReport) => (r.publish ? r.publish.pending > 0 : true)

/**
 * True only when BOTH halves are certain there is nothing left to do — the owner's "if there are
 * none, skip". Deliberately conservative: anything unknown is not nothing.
 */
export const syncFoundNothingToDo = (r: SyncReport) => extractionWasClean(r) && r.publish?.pending === 0

/**
 * The one-line verdict. Every branch is a different pair of answers to the two questions, because
 * the whole point is that they are two questions.
 */
export const syncVerdict = (r: SyncReport): string => {
	const p = r.publish
	if (!p) return 'Extraction finished. Nothing was published — this run did not include the publish step.'

	if (p.uploaded > 0) return `Uploaded ${plural(p.uploaded, 'file')}, ${bytes(p.bytes)}. The CDN now has this build.`

	if (p.pending === 0) {
		if (extractionWasClean(r))
			return 'Nothing changed. The game is unchanged since the last export and nothing has changed since the last publish — there is nothing to do.'
		return 'Nothing to upload — nothing has changed since the last publish.'
	}

	// There IS work. Which work it is decides what the operator should look at next, so the branches
	// stay separate rather than sharing one sentence with a clause bolted on.
	const size = `${plural(p.pending, 'file')}, ${bytes(p.bytes)}`
	if (!p.delta)
		return (
			`No delta could be computed — no .publish-state.json and no credentials — so that plan is the ` +
			`WHOLE build, ${size}, not a list of changes. A confirmed run compares against the bucket itself ` +
			'and sends only what differs.'
		)
	const tail = p.dryRun ? ' Nothing has been written to the CDN yet.' : ''
	if (extractionWasClean(r))
		return `The game is unchanged, but ${size} are not on the CDN. That usually means a previous publish did not finish.${tail}`
	return `${size} to upload.${tail}`
}

/**
 * The summary block. Facts first, one line each, then the verdict — so the thing an operator has to
 * read is four lines rather than forty job lines they have to add up themselves.
 */
export const syncSummaryLines = (r: SyncReport): string[] => {
	const lines: string[] = []
	const allJobs = r.jobs.cached + r.jobs.full + r.jobs.uncached

	if (r.cache === 'used')
		lines.push(
			`extracted     ${plural(r.entries.written, 'entry', 'entries')} re-extracted, ` +
				`${r.entries.skipped.toLocaleString('en-US')} unchanged and skipped ` +
				`(across ${plural(r.jobs.cached, 'CRC-cached job')})`,
		)
	else if (r.cache === 'unwritable')
		lines.push(
			`extracted     ALL ${plural(allJobs, 'job')} in full — the CRC cache could not be ` +
				'written into the CS2 install, so nothing was compared',
		)
	else lines.push(`extracted     all ${plural(allJobs, 'job')} in full (cache off)`)

	// ALWAYS printed when it applies, including on the happiest run. This is the line that stops the
	// word "incremental" from implying more than it delivers.
	if (r.cache === 'used' && r.jobs.full)
		lines.push(
			`always full   ${plural(r.jobs.full, 'glTF job')} re-ran in full regardless — their texture ` +
				'sidecars are not CRC-tracked, so the cache can never cover them',
		)

	if (r.cache === 'used' && r.jobs.uncached)
		lines.push(
			`rebuilt       ${plural(r.jobs.uncached, 'job')} had no output to be a cache of and ran in full — ` +
				'a first export here, or a folder that had been deleted',
		)

	lines.push(
		r.gameData === 'regenerated'
			? 'game data     the seven data/*.json lists were regenerated from this export'
			: r.gameData === 'skipped'
				? 'game data     not regenerated — no items_game.txt in this export (the `scripts` job holds it)'
				: 'game data     FAILED to regenerate — data/*.json is now OLDER than the assets beside it',
	)

	const p = r.publish
	if (p) {
		if (p.uploaded > 0) lines.push(`uploaded      ${plural(p.uploaded, 'file')}, ${bytes(p.bytes)}`)
		else if (p.pending === 0) lines.push('uploaded      0 files — the delta was empty')
		else
			lines.push(
				`pending       ${plural(p.pending, 'file')}, ${bytes(p.bytes)}` +
					`${p.dryRun ? ' — DRY RUN, nothing was written' : ''}`,
			)
		if (!p.delta)
			lines.push(
				'note          no .publish-state.json and no credentials, so this is the whole build rather ' +
					'than a delta; a confirmed run compares against the bucket itself',
			)
	}

	lines.push('')
	lines.push(syncVerdict(r))
	return lines
}

/** Write the report where the menu asked for it. Never throws — a failed report is not a failed run. */
export const writeSyncReport = (report: SyncReport, path = process.env[SYNC_REPORT_ENV]) => {
	if (!path) return false
	try {
		writeFileSync(path, JSON.stringify(report))
		return true
	} catch {
		return false
	}
}

/**
 * Read a report back, or null. **Null means "unknown", never "nothing to do"** — the menu treats it
 * that way, so a report that failed to appear degrades to offering the upload rather than silently
 * suppressing it.
 */
export const readSyncReport = (path: string): SyncReport | null => {
	try {
		if (!existsSync(path)) return null
		const parsed = JSON.parse(readFileSync(path, 'utf8')) as SyncReport
		if (!parsed || typeof parsed !== 'object' || typeof parsed.cache !== 'string') return null
		return parsed
	} catch {
		return null
	}
}
