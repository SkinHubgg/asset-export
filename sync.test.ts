/**
 * `--sync`'s REPORTING, which is the only part of the update mode that is new code.
 *
 *   bun test sync.test.ts
 *
 * The extraction, the game data, the delta upload and the verification are all pre-existing and
 * tested where they live. What `--sync` adds is a claim about what just happened, and a claim is
 * exactly the kind of thing that goes wrong quietly: every sentence below is one an operator will
 * act on without re-deriving it, so each of them is pinned to the state that must produce it.
 *
 * The four ways a summary could lie, all of which have a test:
 *
 *   1. Calling a run incremental when eight jobs re-extracted in full regardless.
 *   2. Saying "the game did not change" from a run that compared nothing — the cache unwritable, or
 *      a job that rebuilt its whole output because the folder was empty.
 *   3. Collapsing "nothing to extract" into "nothing to upload". They are different questions, and
 *      the case that matters — a previous publish that failed — is exactly where they differ.
 *   4. Reporting "the whole build" as if it were a delta, when `--since` had nothing to compare to.
 */

import { describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
	SYNC_REPORT_ENV,
	type SyncReport,
	extractionWasClean,
	readSyncReport,
	syncFoundNothingToDo,
	syncSummaryLines,
	syncVerdict,
	writeSyncReport,
} from './sync'

/** A quiet, believable run: the cache worked, nothing changed, nothing to upload. */
const clean = (over: Partial<SyncReport> = {}): SyncReport => ({
	cache: 'used',
	jobs: { cached: 32, full: 8, uncached: 0 },
	entries: { written: 0, skipped: 61_204 },
	gameData: 'regenerated',
	publish: { pending: 0, uploaded: 0, bytes: 0, delta: true, dryRun: true },
	...over,
})

const summary = (r: SyncReport) => syncSummaryLines(r).join('\n')

describe('the happy path — nothing changed, and it says so once instead of forty times', () => {
	test('both halves are certain, so this is the "if there are none, skip" case', () => {
		const r = clean()
		expect(extractionWasClean(r)).toBe(true)
		expect(syncFoundNothingToDo(r)).toBe(true)
		expect(syncVerdict(r)).toContain('Nothing changed')
		expect(syncVerdict(r)).toContain('nothing to do')
	})

	test('the summary is a handful of lines, not a wall — and it carries both numbers', () => {
		const lines = syncSummaryLines(clean()).filter(Boolean)
		expect(lines.length).toBeLessThanOrEqual(6)
		expect(summary(clean())).toContain('61,204 unchanged and skipped')
		expect(summary(clean())).toContain('0 entries re-extracted')
	})
})

/**
 * THE LINE THAT KEEPS THE WORD "INCREMENTAL" HONEST.
 *
 * `--vpk_cache` records CRCs only for entries matching `-e`, so it cannot see the PNG texture
 * sidecars `--gltf_export_materials` writes beside each GLB — those eight jobs re-extract in full on
 * every run, ~4.5 GB of the ~55 GB. A summary that omits that is describing a different run.
 */
describe('the eight always-full jobs are never hidden', () => {
	test('the summary states the count whenever it is non-zero', () => {
		expect(summary(clean())).toContain('8 glTF jobs')
		expect(summary(clean())).toContain('re-ran in full regardless')
	})

	test('it says so even on the run where nothing at all changed — the easiest one to gloss over', () => {
		const r = clean()
		expect(syncFoundNothingToDo(r)).toBe(true)
		expect(summary(r)).toContain('glTF jobs')
	})

	test('and it is absent, rather than reading "0", when no such job ran', () => {
		const r = clean({ jobs: { cached: 3, full: 0, uncached: 0 } })
		expect(summary(r)).not.toContain('glTF')
	})
})

describe('a run that compared nothing may not claim the game is unchanged', () => {
	/**
	 * The cache manifest is written INSIDE the CS2 install — `<archive>.manifest.txt`, hardcoded, no
	 * flag to move it — so `C:\Program Files (x86)` without elevation cannot have one. `--sync` then
	 * falls back to a full extraction, which is fine; what is not fine is a summary that then reports
	 * "0 re-extracted" as if it had checked.
	 */
	test('cache unwritable: no claim, and the fallback is stated in the operator\'s terms', () => {
		// The job split as export.ts really records it when the cache never applied: the eight glTF jobs
		// in `full`, the other 32 in `uncached`, nothing in `cached`. The three are a PARTITION for
		// exactly this line's sake — with the 32 falling through, "ALL 40" once read "ALL 8".
		const r = clean({
			cache: 'unwritable',
			jobs: { cached: 0, full: 8, uncached: 32 },
			entries: { written: 0, skipped: 0 },
		})
		expect(extractionWasClean(r)).toBe(false)
		expect(syncFoundNothingToDo(r)).toBe(false)
		expect(summary(r)).toContain('ALL 40 jobs in full')
		expect(summary(r)).toContain('could not be written into the CS2 install')
		expect(summary(r)).not.toContain('unchanged and skipped')
		// And the "no output to be a cache of" line belongs to the cache-was-used story only; here the
		// 32 uncached jobs mean something else entirely and must not borrow that sentence.
		expect(summary(r)).not.toContain('no output to be a cache of')
	})

	test('cache off: same partition, and it counts all 40 rather than only the glTF ones', () => {
		const r = clean({ cache: 'off', jobs: { cached: 0, full: 8, uncached: 32 }, entries: { written: 0, skipped: 0 } })
		expect(summary(r)).toContain('all 40 jobs in full (cache off)')
		expect(extractionWasClean(r)).toBe(false)
	})

	test('zero written AND zero skipped is no evidence, not good news', () => {
		expect(extractionWasClean(clean({ entries: { written: 0, skipped: 0 } }))).toBe(false)
	})

	/**
	 * The cache knows about the GAME and has never heard of the output folder, so a deleted `out/`
	 * would otherwise skip everything and produce an empty export in silence. The exporter runs those
	 * jobs in full; the summary must not then describe the run as quiet.
	 */
	test('a job rebuilt from an empty folder is reported, and disqualifies the "unchanged" claim', () => {
		const r = clean({ jobs: { cached: 30, full: 8, uncached: 2 }, entries: { written: 0, skipped: 900 } })
		expect(extractionWasClean(r)).toBe(false)
		expect(summary(r)).toContain('2 jobs had no output to be a cache of')
	})

	test('anything written at all is a change', () => {
		expect(extractionWasClean(clean({ entries: { written: 1, skipped: 61_203 } }))).toBe(false)
	})
})

/**
 * THE TWO QUESTIONS, AND THE CASE THAT PROVES THEY ARE TWO.
 *
 * "Nothing to extract" and "nothing to upload" have different answers whenever a previous publish
 * died half-way: the game is untouched and the CDN is still stale. Collapsing them would skip the
 * upload in exactly the situation that needs one.
 */
describe('nothing to extract is not nothing to upload', () => {
	const stalled = clean({ publish: { pending: 412, uploaded: 0, bytes: 9_000_000, delta: true, dryRun: true } })

	test('the game is unchanged and there is still work — both facts survive into the verdict', () => {
		expect(extractionWasClean(stalled)).toBe(true)
		expect(syncFoundNothingToDo(stalled)).toBe(false)
		expect(syncVerdict(stalled)).toContain('The game is unchanged')
		expect(syncVerdict(stalled)).toContain('412 files')
		expect(syncVerdict(stalled)).toContain('previous publish did not finish')
	})

	test('the mirror case: entries were re-extracted but no file content actually differs', () => {
		const r = clean({ entries: { written: 88, skipped: 61_116 } })
		expect(syncVerdict(r)).toBe('Nothing to upload — nothing has changed since the last publish.')
		// And it must NOT be the "nothing at all happened" sentence, because something did.
		expect(syncVerdict(r)).not.toContain('Nothing changed.')
	})

	test('a dry run with work says so; a confirmed one reports what it sent', () => {
		expect(syncVerdict(stalled)).toContain('Nothing has been written to the CDN yet.')
		const done = clean({
			entries: { written: 12, skipped: 61_192 },
			publish: { pending: 412, uploaded: 412, bytes: 9_000_000, delta: true, dryRun: false },
		})
		expect(syncVerdict(done)).toContain('Uploaded 412 files')
		expect(syncVerdict(done)).not.toContain('yet')
	})
})

/**
 * `--since` with neither a state file nor credentials shows the WHOLE build and warns. Reporting
 * that as "73,000 files changed" would be a lie told in the operator's own units — and the fix for
 * it (a confirmed run, which compares against the bucket) has to be in the same sentence.
 */
describe('the whole build is never dressed up as a delta', () => {
	const noState = clean({
		entries: { written: 0, skipped: 61_204 },
		publish: { pending: 73_412, uploaded: 0, bytes: 55 * 1024 ** 3, delta: false, dryRun: true },
	})

	test('the verdict names the reason and the remedy, and does not blame a failed publish', () => {
		expect(syncVerdict(noState)).toContain('No delta could be computed')
		expect(syncVerdict(noState)).toContain('WHOLE build')
		expect(syncVerdict(noState)).toContain('compares against the bucket itself')
		expect(syncVerdict(noState)).not.toContain('previous publish did not finish')
	})

	test('and the summary carries the same caveat rather than only the number', () => {
		expect(summary(noState)).toContain('no .publish-state.json and no credentials')
	})
})

describe('the game-data state has three values because two of them are not the same problem', () => {
	test('regenerated and skipped are ordinary; FAILED is shouted', () => {
		expect(summary(clean())).toContain('seven data/*.json lists were regenerated')
		expect(summary(clean({ gameData: 'skipped' }))).toContain('no items_game.txt in this export')
		const failed = summary(clean({ gameData: 'failed' }))
		expect(failed).toContain('FAILED to regenerate')
		// The dangerous state is not "no lists", it is "lists older than the assets beside them".
		expect(failed).toContain('OLDER than the assets')
	})
})

/**
 * The report file is how the menu learns something an exit code cannot carry. Its failure mode has
 * to be an extra question, never a skipped upload — so an absent or corrupt file reads as UNKNOWN.
 */
describe('the report file round-trips, and its absence means unknown', () => {
	const dir = mkdtempSync(join(tmpdir(), 'cs2-sync-report-'))

	test('written where asked, read back identically', () => {
		const path = join(dir, 'ok.json')
		expect(writeSyncReport(clean(), path)).toBe(true)
		expect(readSyncReport(path)).toEqual(clean())
	})

	test('no path means nothing is written — the scripted case, where no menu is waiting', () => {
		const before = process.env[SYNC_REPORT_ENV]
		try {
			delete process.env[SYNC_REPORT_ENV]
			expect(writeSyncReport(clean())).toBe(false)
		} finally {
			if (before !== undefined) process.env[SYNC_REPORT_ENV] = before
		}
	})

	test('a missing, empty or corrupt file is null — and null is not "nothing to do"', () => {
		expect(readSyncReport(join(dir, 'nope.json'))).toBeNull()
		const bad = join(dir, 'bad.json')
		writeFileSync(bad, '{"cache":')
		expect(readSyncReport(bad)).toBeNull()
		const wrong = join(dir, 'wrong.json')
		writeFileSync(wrong, '[]')
		expect(readSyncReport(wrong)).toBeNull()
	})

	test('an unwritable destination is not an exception — a failed report is not a failed run', () => {
		expect(writeSyncReport(clean(), join(dir, 'no', 'such', 'dir', 'x.json'))).toBe(false)
		rmSync(dir, { recursive: true, force: true })
	})
})
