#!/usr/bin/env bun
/**
 * CS2 export publisher — verify, upload and delta-publish `out/` to the asset CDN.
 *
 * The exporter produces ~51 GB across ~73k files; three sites read them straight off one origin
 * (`next.config.ts` rewrites `/skins-cdn/*` there). Everything below exists because that origin
 * was being maintained by hand, and a hand-maintained origin fails QUIETLY: on 2026-08-03 the
 * published `data/weapontex-index.json` predated the exporter learning to walk the composite and
 * position roots, so every HD-mesh weapon bound the legacy texture tree and `uHasPosition` was
 * false everywhere. Nothing 404'd. Nothing threw. 370 kits just rendered wrong.
 *
 *   bun run publish.ts --verify                    # audit the live CDN, exit non-zero if stale
 *   bun run publish.ts --verify --quick            # control files + coverage + a sampled subset
 *   bun run publish.ts --verify --deep             # + every file in the build (needs credentials)
 *   bun run publish.ts --upload                    # DRY RUN — prints the plan, writes nothing
 *   bun run publish.ts --upload --confirm          # actually writes
 *   bun run publish.ts --upload --since --confirm  # only what changed since the last publish
 *   bun run publish.ts --upload --prefix data      # limit to one subtree
 *
 * Uploading is a dry run unless `--confirm` is passed. This writes to a production CDN that three
 * sites consume; the default must never be "write", and the write itself is an operator's call —
 * `--verify` and the dry run are the parts that are always safe to run, need no credentials, and
 * carry no risk. As of 2026-08-04 the write path has never been run against production: it was
 * developed and tested against a local S3 stand-in (see R2_ENDPOINT).
 *
 *   --out <path>        CS2_EXPORT_OUT     the export to publish        (default ./out)
 *   --origin <url>      SKINS_CDN_ORIGIN   public origin to verify      (default cdn.skinhub.gg)
 *   --concurrency <n>                      parallel requests            (default 24 / 8 upload)
 *   --prefix <path>                        limit to one subtree, repeatable via commas
 *
 * Credentials for `--upload` come from the environment and are never printed:
 * R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME. The repo keeps them in
 * apps/api/.env, so `bun --env-file=apps/api/.env run tools/cs2-export/publish.ts …` is the
 * usual invocation.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { JUNK_FILES, PUBLISH_STATE_FILE, WEAPONTEX_INDEX_ROOTS, isControlFile, isStableNamedAsset } from './asset-roots'
import { UserError } from './platform'

/**
 * Thrown for anything the operator can fix. Reported as a message, never a stack trace.
 *
 * ONE class for the whole toolchain, from `platform.ts`, and re-exported here so importers are
 * unaffected. Three scripts used to declare their own, which meant `export.ts`'s `instanceof`
 * check did not recognise one raised by `generate-gamedata.ts` or by this file — so a plain
 * operator error ("export the scripts job first") printed a stack trace instead of one line.
 */
export { UserError }

// ---------------------------------------------------------------------------------------------
// Arguments — same shape as export.ts, duplicated because export.ts runs its own main() on import.
// ---------------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const value = (name: string, env?: string) => {
	const i = args.indexOf(`--${name}`)
	if (i >= 0) {
		const next = args[i + 1]
		if (!next || next.startsWith('--')) throw new UserError(`--${name} needs a value`)
		return next
	}
	return env ? process.env[env] : undefined
}

const HERE = import.meta.dir
export const DEFAULT_ORIGIN = 'https://cdn.skinhub.gg'

const step = (msg: string) => console.log(`\n=== ${msg}`)
const ok = (msg: string) => console.log(`    ${msg}`)
const warn = (msg: string) => console.warn(`    ! ${msg}`)
const bad = (msg: string) => console.error(`    x ${msg}`)

// ---------------------------------------------------------------------------------------------
// Cache policy
//
// Texture filenames are content-hashed by the exporter (…_psd_da5a7179.png), so a texture can be
// cached forever: a changed texture is a changed name. manifest.json and data/ keep the SAME name
// across every export, so they must be revalidated often or a site serves last month's recipe
// against this month's textures.
// ---------------------------------------------------------------------------------------------

export const CACHE_CONTROL_CONTROL = 'public, max-age=60, stale-while-revalidate=300'
export const CACHE_CONTROL_ASSET = 'public, max-age=31536000, immutable'

/**
 * STABLE-NAMED ASSETS: large, cacheable, and NOT content-hashed — so they must never be `immutable`.
 *
 * `immutable` promises the bytes at this URL will never change, so a browser holding one will not
 * revalidate it for a year: no request, no 304, no way to reach it. That is only safe when a changed
 * file means a changed NAME. True of the textures (`…_psd_da5a7179.png`); false of these:
 *
 *   **\/*.glb                  0 of 643 are content-hashed, and it is the second-largest fetch on
 *                              the page — 3.26 MB on an AK-47, 7.12 MB on an M249
 *   models/**\/physics_*.png   103 files on stable names
 *
 * Until this third case existed, `cacheControlFor` treated everything that was not a control file as
 * immutable, so **all 643 GLBs qualified**. Publishing them that way would pin every visitor's copy
 * of `weapon_rif_ak47.glb` for a year — including any re-export and any model fix — with no way to
 * invalidate short of renaming the file. It was dormant only because the R2 path was not yet in use;
 * it would have fired on the first publish.
 *
 * An hour, with a day of `stale-while-revalidate`, keeps them effectively as fast — the edge serves
 * the stale copy instantly and refreshes behind it — while leaving a door to push a fix through.
 */
export const CACHE_CONTROL_STABLE_ASSET = 'public, max-age=3600, stale-while-revalidate=86400'

export const cacheControlFor = (relPath: string) =>
	isControlFile(relPath)
		? CACHE_CONTROL_CONTROL
		: isStableNamedAsset(relPath)
			? CACHE_CONTROL_STABLE_ASSET
			: CACHE_CONTROL_ASSET

const CONTENT_TYPES: Record<string, string> = {
	png: 'image/png',
	exr: 'image/x-exr',
	glb: 'model/gltf-binary',
	json: 'application/json',
	txt: 'text/plain; charset=utf-8',
	vmat: 'text/plain; charset=utf-8',
	vcompmat: 'text/plain; charset=utf-8',
	vfx: 'text/plain; charset=utf-8',
	mks: 'text/plain; charset=utf-8',
}
export const contentTypeFor = (relPath: string) =>
	CONTENT_TYPES[relPath.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'

// ---------------------------------------------------------------------------------------------
// The local build
// ---------------------------------------------------------------------------------------------

/**
 * Top-level folders of an export. Used to tell a HOSTED path in manifest.json ("weapontex/…")
 * apart from an in-VPK reference ("materials/…", "weapons/…"), which is not a file we serve.
 * Derived from the build when there is one; this list is the fallback for verifying a CDN with no
 * local export next to it.
 */
const KNOWN_ROOTS = [
	'compinputs',
	'compmats',
	'data',
	'defaults',
	// The glove finish tree — see the `glove*` jobs in export.ts. Held apart from `compmats`/
	// `paintmats` because the manifest indexes those by basename and the glove and weapon trees
	// both ship a `_shared_paint_generic.vcompmat` with different contents.
	'glovecompmats',
	'glovemats',
	'glovemodelmats',
	'glovemodeltex',
	'glovepaintkitmats',
	'glovetex',
	'keychainmats',
	'keychains',
	'keychaintex',
	'knifecomposite',
	'knifetex',
	'legacycompmats',
	'misc',
	'models',
	'models-gloves',
	'paintkits',
	'paintmats',
	'position',
	'scripts',
	'shaders',
	'skyboxmats',
	'skyboxtex',
	'stattrak',
	'stickermats',
	'stickertex',
	'templates',
	'weaponcompmats',
	'weaponcomposite',
	'weapontex',
]

const walkFiles = (dir: string): string[] => {
	if (!existsSync(dir)) return []
	const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))
	const files = entries.filter(e => !e.isDirectory() && !JUNK_FILES.has(e.name)).map(e => join(dir, e.name))
	const nested = entries.filter(e => e.isDirectory()).flatMap(e => walkFiles(join(dir, e.name)))
	return [...files, ...nested]
}

const relTo = (root: string, path: string) =>
	path
		.slice(root.length)
		.replace(/^[\\/]+/, '')
		.replace(/\\/g, '/')

export type LocalFile = { path: string; rel: string; size: number; mtimeMs: number }

/** Every file of an export that belongs on the CDN, keyed by its origin-relative path. */
export const readLocalBuild = (out: string): Map<string, LocalFile> => {
	const files = new Map<string, LocalFile>()
	for (const path of walkFiles(out)) {
		const rel = relTo(out, path)
		if (rel.startsWith('.')) continue // publisher bookkeeping, never part of the export
		const stat = statSync(path)
		files.set(rel, { path, rel, size: stat.size, mtimeMs: stat.mtimeMs })
	}
	return files
}

const md5OfFile = async (path: string) => {
	const hasher = new Bun.CryptoHasher('md5')
	const file = Bun.file(path)
	if (file.size < 8 * 1024 * 1024) hasher.update(new Uint8Array(await file.arrayBuffer()))
	else for await (const chunk of file.stream()) hasher.update(chunk)
	return hasher.digest('hex')
}

const md5OfBytes = (bytes: Uint8Array) => new Bun.CryptoHasher('md5').update(bytes).digest('hex')

const bytes = (n: number) => {
	if (n < 1024) return `${n} B`
	if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
	if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
	return `${(n / 1024 ** 3).toFixed(2)} GB`
}

/** Runs `work` over `items` with at most `limit` in flight, reporting progress on a single line. */
const pool = async <T, R>(items: T[], limit: number, work: (item: T) => Promise<R>, label?: string) => {
	const results: R[] = new Array(items.length)
	let next = 0
	let done = 0
	const tick = () => {
		if (!label || !process.stdout.isTTY) return
		if (++done % 25 && done !== items.length) return
		process.stdout.write(`\r    ${label} ${done}/${items.length}`)
		if (done === items.length) process.stdout.write('\n')
	}
	const runner = async () => {
		while (next < items.length) {
			const i = next++
			results[i] = await work(items[i])
			tick()
		}
	}
	await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, runner))
	if (label && !process.stdout.isTTY) console.log(`    ${label} ${items.length}/${items.length}`)
	return results
}

// ---------------------------------------------------------------------------------------------
// Reading the CDN
//
// This origin sits behind Cloudflare, which strips ETag and Content-Length from HEAD responses —
// so a HEAD can only tell us "it exists". A one-byte Range request still reports the object's true
// length in Content-Range, which is what makes a size comparison possible with no credentials at
// all. Hash comparison of the small control files is done by downloading them outright.
// ---------------------------------------------------------------------------------------------

export type Probe = { status: number; size: number; error?: string }

const RETRIES = 3

/**
 * 403 IS A THROTTLE, NOT AN ANSWER.
 *
 * Cloudflare rate-limits this origin with 403, which is also the status R2 returns for an object
 * that is not public — so believing it verbatim turns a busy minute into a wall of "missing on the
 * CDN". Measured on a full run: 1,864 of 6,287 probes came back 403 in one burst, and every one of
 * them answered 206 when asked again on its own. A verifier that cries missing at 30% of a healthy
 * origin is a verifier its operator learns to ignore, which is the same ending as not having one.
 *
 * Retried with backoff instead, and only reported once it has held across all of them. A genuinely
 * unreadable object still fails — it just has to say so four times.
 */
const isThrottle = (status: number) => status === 403 || status === 429 || status >= 500

/**
 * The limit is on SUSTAINED VOLUME, not on instantaneous concurrency: 40 parallel probes of one
 * object all answer 206, while a 6,000-file sweep starts 403ing a few thousand in and then keeps it
 * up for the rest of the run. Retrying per-probe cannot dig out of that — the other 23 workers
 * spend the backoff re-arming the same limit — so one throttled probe pauses ALL of them, for
 * longer each time it happens.
 */
let resumeAt = 0
let cooldownMs = 500
const backOff = () => {
	cooldownMs = Math.min(cooldownMs * 2, 8000)
	resumeAt = Date.now() + cooldownMs
}
const awaitTurn = async () => {
	while (Date.now() < resumeAt) await Bun.sleep(Math.min(200, resumeAt - Date.now()))
}

const probeOne = async (origin: string, relPath: string): Promise<Probe> => {
	const url = `${origin}/${relPath.split('/').map(encodeURIComponent).join('/')}`
	for (let attempt = 0; ; attempt++) {
		try {
			await awaitTurn()
			const res = await fetch(url, { headers: { Range: 'bytes=0-0' } })
			await res.body?.cancel()
			if (res.status === 404) return { status: res.status, size: -1 }
			if (isThrottle(res.status)) {
				backOff()
				if (attempt >= RETRIES) return { status: res.status, size: -1 }
				throw new Error(`HTTP ${res.status}`)
			}
			// A clean answer is evidence the limit is lifting — but 24 workers come out of a pause
			// together, so the first success is not proof it has. Decay, don't reset: snapping back to
			// 500 ms let the same wave 403 the rest of a directory before the backoff caught up again.
			cooldownMs = Math.max(500, Math.floor(cooldownMs / 2))
			const range = res.headers.get('content-range')
			const total = range ? Number(range.split('/')[1]) : Number(res.headers.get('content-length') ?? -1)
			return { status: res.status, size: Number.isFinite(total) ? total : -1 }
		} catch (err) {
			if (attempt >= RETRIES) return { status: 0, size: -1, error: (err as Error).message }
			await Bun.sleep(300 * 2 ** attempt)
		}
	}
}

const fetchBytes = async (origin: string, relPath: string) => {
	for (let attempt = 0; ; attempt++) {
		try {
			const res = await fetch(`${origin}/${relPath}`)
			if (res.status === 404) return null
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			return new Uint8Array(await res.arrayBuffer())
		} catch (err) {
			if (attempt >= 2) throw new UserError(`${origin}/${relPath}: ${(err as Error).message}`)
			await Bun.sleep(250 * 2 ** attempt)
		}
	}
}

// ---------------------------------------------------------------------------------------------
// What manifest.json actually references
// ---------------------------------------------------------------------------------------------

/**
 * Every hosted path the manifest points at, found by sweeping the whole document rather than by
 * reading a fixed list of fields — a field added to the manifest later is covered automatically,
 * which is the same drift that made the stale index invisible.
 *
 * A hosted path is a string whose first segment is a folder of the export. That test is what
 * separates `compmat_file: "compmats/weapons/…"` (a file we serve) from `compmat:
 * "weapons/paints/…"` and `pattern_ref: "materials/…"`, which are in-VPK names for the same
 * material and are not served at all.
 */
export const manifestReferences = (manifest: unknown, roots: Set<string>) => {
	const found = new Set<string>()
	const visit = (node: unknown) => {
		if (typeof node === 'string') {
			const first = node.split('/')[0]
			if (node.includes('/') && roots.has(first) && /\.[a-z0-9]{2,9}$/i.test(node)) found.add(node)
			return
		}
		if (Array.isArray(node)) {
			for (const item of node) visit(item)
			return
		}
		if (node && typeof node === 'object') for (const v of Object.values(node)) visit(v)
	}
	visit(manifest)
	return found
}

// ---------------------------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------------------------

type Failure = { kind: 'missing' | 'stale' | 'unreachable' | 'coverage'; path: string; detail: string }

const report = (failures: Failure[], kind: Failure['kind'], heading: string) => {
	const hits = failures.filter(f => f.kind === kind)
	if (!hits.length) return
	bad(`${heading}: ${hits.length}`)
	for (const f of hits.slice(0, 20)) console.error(`        ${f.path}  ${f.detail}`)
	if (hits.length > 20) console.error(`        … and ${hits.length - 20} more`)
}

export type VerifyOptions = { out: string; origin: string; concurrency?: number; quick?: boolean; deep?: boolean }

/**
 * Audits the WHOLE build, not just what the manifest names. Needs credentials, and is worth them:
 * one bucket listing (~73 requests for 73k objects) returns every object's size and ETag, so a
 * complete size + hash comparison costs 73 API calls instead of 73k HTTP probes.
 *
 * R2 sets ETag to the MD5 for a single-part PUT; a multipart upload's ends in "-<parts>" and is
 * not a hash of anything, so those fall back to a size comparison.
 */
const verifyDeep = async (local: Map<string, LocalFile>, failures: Failure[], origin: string) => {
	step('Deep audit (bucket listing)')
	const bucket = await openBucket()
	const objects = await bucket.list()
	ok(`bucket "${bucket.name}": ${objects.size} object(s); build: ${local.size} file(s)`)

	// A bucket that holds almost none of the build is not a half-finished upload, it is the wrong
	// bucket — and saying so once is infinitely more useful than 72,710 identical "missing" lines.
	// Worth guarding: R2_BUCKET_NAME in apps/api/.env is the API's user-content bucket, so the
	// obvious way to run this tool aims it somewhere that is not the asset origin at all.
	const present = [...local.keys()].filter(k => objects.has(k)).length
	if (present < local.size * 0.1) {
		failures.push({
			kind: 'coverage',
			path: `bucket "${bucket.name}"`,
			detail: `holds ${present} of the build's ${local.size} files — this is not the bucket behind ${origin}`,
		})
		bad(`bucket "${bucket.name}" holds ${present}/${local.size} of the build — wrong bucket, not a bad upload`)
		bad("check R2_BUCKET_NAME (apps/api/.env names the API's user-content bucket, not the asset origin)")
		return
	}

	const comparable: LocalFile[] = []
	for (const file of local.values()) {
		const remote = objects.get(file.rel)
		if (!remote) {
			failures.push({ kind: 'missing', path: file.rel, detail: 'in the build, never uploaded' })
			continue
		}
		if (remote.size !== file.size) {
			failures.push({
				kind: 'stale',
				path: file.rel,
				detail: `bucket ${bytes(remote.size)} vs build ${bytes(file.size)}`,
			})
			continue
		}
		if (/^[0-9a-f]{32}$/.test(remote.etag)) comparable.push(file)
	}
	const hashes = await pool(comparable, 8, f => md5OfFile(f.path), 'hashed')
	for (const [i, file] of comparable.entries())
		if (hashes[i] !== objects.get(file.rel)?.etag)
			failures.push({ kind: 'stale', path: file.rel, detail: 'same size, different content' })

	const orphans = [...objects.keys()].filter(k => !local.has(k))
	ok(`${comparable.length} hash-compared, ${local.size - comparable.length} size-compared`)
	if (orphans.length) warn(`${orphans.length} object(s) on the CDN are not in this build (e.g. ${orphans[0]})`)
}

/**
 * Audits the published origin. Returns the failures; the caller decides the exit code.
 *
 * Existence alone is not enough — a stale file is a 200. So this also compares the CDN's copy
 * against the local build: control files by MD5, every other file by byte length (Cloudflare will
 * not give us a remote hash without credentials, and a length mismatch is what catches a
 * truncated or half-replaced upload).
 */
export const verify = async ({ out, origin, concurrency = 24, quick = false, deep = false }: VerifyOptions) => {
	const failures: Failure[] = []
	const local = existsSync(out) ? readLocalBuild(out) : new Map<string, LocalFile>()
	step(`Verifying ${origin}`)
	ok(local.size ? `local build: ${out} (${local.size} files)` : `no local build at ${out} — CDN-only checks`)

	const roots = new Set(local.size ? [...new Set([...local.keys()].map(k => k.split('/')[0]))] : KNOWN_ROOTS)
	const probed = new Map<string, Probe>()
	const probeAll = async (paths: string[], label: string) => {
		const todo = paths.filter(p => !probed.has(p))
		const results = await pool(todo, concurrency, p => probeOne(origin, p), label)
		todo.forEach((p, i) => {
			probed.set(p, results[i])
		})
		return paths.map(p => probed.get(p) as Probe)
	}
	const judge = (path: string, probe: Probe, localSize?: number) => {
		if (probe.status === 0) failures.push({ kind: 'unreachable', path, detail: probe.error ?? 'no response' })
		else if (probe.status === 404) failures.push({ kind: 'missing', path, detail: 'HTTP 404' })
		// Held across every retry. Still more likely a throttle that outlasted the backoff than an
		// absent object (R2 answers those 404), so it is reported as unreachable — "ask again", not
		// "re-upload this". Lower --concurrency if a run produces many.
		else if (isThrottle(probe.status))
			failures.push({ kind: 'unreachable', path, detail: `HTTP ${probe.status} after ${RETRIES + 1} attempts` })
		else if (localSize !== undefined && probe.size >= 0 && probe.size !== localSize)
			failures.push({ kind: 'stale', path, detail: `CDN ${bytes(probe.size)} vs local ${bytes(localSize)}` })
	}

	// ---- 1. control files, compared by hash --------------------------------------------------
	// The recipe. Every one of them keeps its name forever, so a stale copy is invisible at
	// runtime; this is the check that would have caught weapontex-index.json weeks earlier.
	step('Control files (manifest.json, data/)')
	const controlFiles = [...local.keys()].filter(isControlFile).sort()
	if (!controlFiles.length) controlFiles.push('manifest.json', 'data/weapontex-index.json')
	const remoteControl = new Map<string, Uint8Array | null>()
	for (const rel of controlFiles) {
		const remote = await fetchBytes(origin, rel)
		remoteControl.set(rel, remote)
		if (!remote) {
			failures.push({ kind: 'missing', path: rel, detail: 'not on the CDN' })
			bad(`${rel}  MISSING`)
			continue
		}
		const localFile = local.get(rel)
		if (!localFile) {
			ok(`${rel}  ${bytes(remote.byteLength)}  (no local copy to compare)`)
			continue
		}
		const [remoteHash, localHash] = [md5OfBytes(remote), await md5OfFile(localFile.path)]
		if (remoteHash === localHash) {
			ok(`${rel}  ${bytes(remote.byteLength)}  matches local`)
			continue
		}
		failures.push({
			kind: 'stale',
			path: rel,
			detail: `CDN md5 ${remoteHash.slice(0, 12)} (${bytes(remote.byteLength)}) != local ${localHash.slice(0, 12)} (${bytes(localFile.size)})`,
		})
		bad(`${rel}  STALE — CDN ${bytes(remote.byteLength)} vs local ${bytes(localFile.size)}`)
	}

	// ---- 2. the index covers every root the exporter walks -----------------------------------
	// The 2026-08-03 defect, made loud. The published index is compared root by root against
	// WEAPONTEX_INDEX_ROOTS — the same list export.ts walks — and against the build on disk.
	step('weapontex-index.json coverage')
	const indexBytes =
		remoteControl.get('data/weapontex-index.json') ?? (await fetchBytes(origin, 'data/weapontex-index.json'))
	let indexEntries: string[] = []
	if (!indexBytes) {
		failures.push({ kind: 'missing', path: 'data/weapontex-index.json', detail: 'not on the CDN' })
		bad('data/weapontex-index.json is not on the CDN — no weapon binds its texture tree')
	} else {
		indexEntries = JSON.parse(new TextDecoder().decode(indexBytes)) as string[]
		for (const root of WEAPONTEX_INDEX_ROOTS) {
			const published = indexEntries.filter(e => e.startsWith(`${root.dir}/`)).length
			const onDisk = local.size
				? [...local.keys()].filter(
						k => k.startsWith(`${root.dir}/`) && root.exts.some(x => k.toLowerCase().endsWith(x)),
					).length
				: -1
			if (!published) {
				failures.push({
					kind: 'coverage',
					path: `${root.dir}/`,
					detail: `the published index has NO entries under this root (build has ${onDisk < 0 ? '?' : onDisk})`,
				})
				bad(`${root.dir.padEnd(16)} 0 entries — root missing from the published index`)
			} else if (onDisk >= 0 && published !== onDisk) {
				failures.push({
					kind: 'coverage',
					path: `${root.dir}/`,
					detail: `published index lists ${published}, the build has ${onDisk}`,
				})
				bad(`${root.dir.padEnd(16)} ${published} published vs ${onDisk} in the build`)
			} else ok(`${root.dir.padEnd(16)} ${published} entries`)
		}
	}

	// ---- 3. every path the CDN's own manifest references resolves -----------------------------
	step('manifest.json references')
	const manifestBytes = remoteControl.get('manifest.json') ?? (await fetchBytes(origin, 'manifest.json'))
	let references: string[] = []
	if (!manifestBytes) bad('manifest.json is not on the CDN — nothing to check against')
	else {
		const manifest = JSON.parse(new TextDecoder().decode(manifestBytes))
		references = [...manifestReferences(manifest, roots)].sort()
		ok(`${Object.keys(manifest).length} paint kits reference ${references.length} distinct files`)
	}

	// ---- 4. probe everything the viewer will actually request ---------------------------------
	const glbs = [...local.keys()].filter(k => k.toLowerCase().endsWith('.glb'))
	let targets = [...new Set([...references, ...indexEntries, ...glbs])].sort()
	if (quick && targets.length > 300) {
		const stride = Math.ceil(targets.length / 300)
		targets = targets.filter((_, i) => i % stride === 0)
		warn(`--quick: sampling ${targets.length} of the referenced files`)
	}
	step(`Resolving ${targets.length} referenced files on the CDN`)
	const probes = await probeAll(targets, 'probed')
	for (const [i, path] of targets.entries()) judge(path, probes[i], local.get(path)?.size)
	const okCount = probes.filter(p => p.status >= 200 && p.status < 400).length
	ok(`${okCount}/${targets.length} resolved`)

	// ---- 5. cache policy ----------------------------------------------------------------------
	step('Cache policy')
	for (const sample of ['manifest.json', targets.find(t => t.endsWith('.png'))].filter(Boolean) as string[]) {
		const res = await fetch(`${origin}/${sample}`, { headers: { Range: 'bytes=0-0' } })
		await res.body?.cancel()
		const cc = res.headers.get('cache-control')
		const want = cacheControlFor(sample)
		if (cc === want) ok(`${sample}  ${cc}`)
		else warn(`${sample}  cache-control: ${cc ?? '(none)'}   want: ${want}`)
	}

	// ---- 6. every file in the build, when credentials allow it --------------------------------
	// The checks above cover what the viewer LOOKS UP by name. Stickers, keychains and skyboxes
	// are addressed by convention rather than through the manifest, so only a listing catches a
	// gap in those.
	if (deep && local.size) await verifyDeep(local, failures, origin)

	step(failures.length ? `FAILED — ${failures.length} problem(s)` : 'Verified')
	report(failures, 'stale', 'stale on the CDN (published copy differs from the build)')
	report(failures, 'coverage', 'index coverage')
	report(failures, 'missing', 'missing on the CDN')
	report(failures, 'unreachable', 'unreachable')
	if (!failures.length) ok(`${origin} matches the build at ${out}`)
	return failures
}

// ---------------------------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------------------------

type Bucket = {
	put: (key: string, body: Buffer, contentType: string, cacheControl: string) => Promise<void>
	list: () => Promise<Map<string, { size: number; etag: string }>>
	has: (key: string) => Promise<boolean>
	name: string
}

/**
 * S3-compatible client for R2. Credentials come from the environment and are never printed —
 * only the NAMES of missing variables are, which is what an operator needs to fix it.
 *
 * Uses @aws-sdk/client-s3 (the same client apps/api/lib/r2 authenticates with) rather than Bun's
 * built-in S3Client, because Bun's `write()` sends no Cache-Control header and cache policy is
 * half the point of publishing through tooling instead of by hand.
 */
const openBucket = async (): Promise<Bucket> => {
	const required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'] as const
	const missing = required.filter(name => !process.env[name])
	if (missing.length)
		throw new UserError(
			`${missing.join(', ')} not set. The repo keeps them in apps/api/.env — run with ` +
				'`bun --env-file=apps/api/.env run tools/cs2-export/publish.ts …`.',
		)

	let sdk: typeof import('@aws-sdk/client-s3')
	try {
		sdk = await import('@aws-sdk/client-s3')
	} catch {
		throw new UserError('@aws-sdk/client-s3 is not installed. Run `bun install` at the repo root.')
	}
	const name = process.env.R2_BUCKET_NAME as string
	// R2_ENDPOINT points the publisher at a different S3 implementation — a MinIO, or the local
	// stand-in used to exercise the upload path without writing to a production CDN. Such servers
	// are path-style; R2's own endpoint is not, hence the second knob.
	const client = new sdk.S3Client({
		region: 'auto',
		endpoint: process.env.R2_ENDPOINT ?? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		forcePathStyle: process.env.R2_FORCE_PATH_STYLE === '1',
		credentials: {
			accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
			secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
		},
	})

	return {
		name,
		put: async (key, body, contentType, cacheControl) => {
			for (let attempt = 0; ; attempt++) {
				try {
					await client.send(
						new sdk.PutObjectCommand({
							Bucket: name,
							Key: key,
							Body: body,
							ContentType: contentType,
							CacheControl: cacheControl,
						}),
					)
					return
				} catch (err) {
					if (attempt >= 2) throw new UserError(`PUT ${key} failed: ${(err as Error).message}`)
					await Bun.sleep(500 * 2 ** attempt)
				}
			}
		},
		list: async () => {
			const objects = new Map<string, { size: number; etag: string }>()
			let token: string | undefined
			do {
				const page = await client.send(new sdk.ListObjectsV2Command({ Bucket: name, ContinuationToken: token }))
				for (const o of page.Contents ?? [])
					if (o.Key) objects.set(o.Key, { size: o.Size ?? -1, etag: (o.ETag ?? '').replace(/"/g, '') })
				token = page.IsTruncated ? page.NextContinuationToken : undefined
			} while (token)
			return objects
		},
		has: async key => {
			try {
				await client.send(new sdk.HeadObjectCommand({ Bucket: name, Key: key }))
				return true
			} catch {
				return false
			}
		},
	}
}

/**
 * Refuses to publish into a bucket that is not the asset origin.
 *
 * Not hypothetical: R2_BUCKET_NAME in apps/api/.env names the API's user-content bucket, which is
 * exactly what an operator following the credential instructions would end up pointed at — and a
 * confirmed run would then push 51 GB of textures into it. A bucket that already serves this
 * export has a manifest.json; one that has objects but no manifest.json is somebody else's.
 */
const assertPublishTarget = async (bucket: Bucket, plan: LocalFile[]) => {
	if (flag('new-bucket')) return
	if (await bucket.has('manifest.json')) return
	const objects = await bucket.list()
	if (!objects.size && plan.some(f => f.rel === 'manifest.json')) return // genuinely a first publish
	throw new UserError(
		`bucket "${bucket.name}" holds ${objects.size} object(s) and no manifest.json — it does not look ` +
			"like the asset origin. R2_BUCKET_NAME in apps/api/.env is the API's user-content bucket, not " +
			'this one. Set R2_BUCKET_NAME to the assets bucket, or pass --new-bucket if this really is a ' +
			'fresh one.',
	)
}

type PublishState = { origin: string; updated: string; files: Record<string, { size: number; md5: string }> }

const readState = (out: string): PublishState | null => {
	const path = join(out, PUBLISH_STATE_FILE)
	if (!existsSync(path)) return null
	try {
		return JSON.parse(readFileSync(path, 'utf8')) as PublishState
	} catch {
		return null
	}
}

export type UploadOptions = {
	out: string
	origin: string
	confirm?: boolean
	since?: boolean
	prefixes?: string[]
	concurrency?: number
}

/**
 * Publishes the build. DRY RUN unless `confirm` is set — this writes to an origin three
 * production sites read from, so the plan is printed and nothing is sent by default.
 *
 * `since` uploads only what changed. The exporter WIPES out/ on a full run, so every file comes
 * back with a new mtime and mtimes are worthless as a change signal; the comparison is by MD5
 * against the previous run's state file, or — if there is none — against the bucket's own ETags.
 * Hashing the whole 51 GB build takes ~80 s on an M-series Mac, which is the price of not
 * re-uploading 51 GB.
 */
export const upload = async ({
	out,
	origin,
	confirm = false,
	since = false,
	prefixes,
	concurrency = 8,
}: UploadOptions) => {
	if (!existsSync(out)) throw new UserError(`no export at ${out}`)
	const local = readLocalBuild(out)
	if (!local.size) throw new UserError(`${out} holds no files`)

	step(confirm ? 'Publishing' : 'Publishing (DRY RUN — nothing will be written)')
	ok(`build:  ${out}  (${local.size} files, ${bytes([...local.values()].reduce((n, f) => n + f.size, 0))})`)
	ok(`origin: ${origin}`)

	let candidates = [...local.values()]
	if (prefixes?.length) {
		candidates = candidates.filter(f =>
			prefixes.some(p => f.rel === p || f.rel.startsWith(`${p.replace(/\/+$/, '')}/`)),
		)
		ok(`prefix: ${prefixes.join(', ')} — ${candidates.length} file(s)`)
		if (!candidates.length) throw new UserError(`--prefix ${prefixes.join(',')} matched nothing in ${out}`)
	}

	// ---- what actually changed ----------------------------------------------------------------
	const hashes = new Map<string, string>()
	let plan = candidates
	// A dry run must never need credentials — printing what WOULD be published is the safe half of
	// this tool, and asking for keys to do it invites someone to hand them over just to look.
	const canDelta = since && (readState(out) !== null || confirm)
	if (since && !canDelta)
		warn('no .publish-state.json and no credentials in a dry run — showing the full build, not a delta')
	if (canDelta) {
		const state = readState(out)
		step(state ? 'Delta against the last publish' : 'Delta against the bucket')
		let previous: Map<string, { size: number; md5: string | null }>
		if (state) {
			previous = new Map(Object.entries(state.files).map(([k, v]) => [k, { size: v.size, md5: v.md5 }]))
			ok(`${join(out, PUBLISH_STATE_FILE)} — ${previous.size} file(s), published ${state.updated}`)
		} else {
			const bucket = await openBucket()
			const objects = await bucket.list()
			// A multipart upload's ETag is not an MD5 (it ends in "-<parts>"); for those the only
			// credential-free signal is size, so a same-size object is taken as unchanged.
			previous = new Map(
				[...objects].map(([k, v]) => [k, { size: v.size, md5: /^[0-9a-f]{32}$/.test(v.etag) ? v.etag : null }]),
			)
			ok(`bucket listing — ${previous.size} object(s)`)
		}

		const sizeChanged = candidates.filter(f => previous.get(f.rel)?.size !== f.size)
		const sameSize = candidates.filter(f => previous.get(f.rel)?.size === f.size)
		const hashable = sameSize.filter(f => previous.get(f.rel)?.md5)
		if (hashable.length) {
			const computed = await pool(hashable, 8, async f => md5OfFile(f.path), 'hashed')
			hashable.forEach((f, i) => {
				hashes.set(f.rel, computed[i])
			})
		}
		const contentChanged = hashable.filter(f => hashes.get(f.rel) !== previous.get(f.rel)?.md5)
		plan = [...sizeChanged, ...contentChanged].sort((a, b) => (a.rel < b.rel ? -1 : 1))
		ok(`${sizeChanged.length} new or resized, ${contentChanged.length} same-size but different content`)
		ok(`${candidates.length - plan.length} unchanged — not re-uploaded`)
	}

	if (!plan.length) {
		ok('nothing to upload')
		return { uploaded: 0, bytes: 0, skipped: candidates.length }
	}

	// ---- the plan -----------------------------------------------------------------------------
	const totalBytes = plan.reduce((n, f) => n + f.size, 0)
	const byRoot = new Map<string, { n: number; bytes: number }>()
	for (const f of plan) {
		const root = f.rel.includes('/') ? f.rel.split('/')[0] : '(root)'
		const acc = byRoot.get(root) ?? { n: 0, bytes: 0 }
		byRoot.set(root, { n: acc.n + 1, bytes: acc.bytes + f.size })
	}
	step(`${plan.length} file(s), ${bytes(totalBytes)}`)
	for (const [root, acc] of [...byRoot].sort((a, b) => b[1].bytes - a[1].bytes))
		ok(`${root.padEnd(18)} ${String(acc.n).padStart(6)} files  ${bytes(acc.bytes).padStart(10)}`)
	ok(`cache-control: control files "${CACHE_CONTROL_CONTROL}", everything else "${CACHE_CONTROL_ASSET}"`)
	// Sizes AND hashes for the sample, so a dry run shows the exact bytes a PUT would carry. Only
	// the listed files are hashed — hashing 51 GB to print ten lines would be absurd.
	const listed = plan.slice(0, 10)
	const listedHashes = await Promise.all(listed.map(f => hashes.get(f.rel) ?? md5OfFile(f.path)))
	for (const [i, f] of listed.entries())
		ok(`  ${f.rel}  (${bytes(f.size)}, ${contentTypeFor(f.rel)}, md5 ${listedHashes[i].slice(0, 12)})`)
	if (plan.length > 10) ok(`  … and ${plan.length - 10} more`)

	if (!confirm) {
		step('DRY RUN — nothing was written')
		ok("re-run with --confirm to publish this plan. Uploading is yours to run, not the tooling's to decide.")
		return { uploaded: 0, bytes: totalBytes, skipped: candidates.length - plan.length, dryRun: true }
	}

	// ---- write --------------------------------------------------------------------------------
	const bucket = await openBucket()
	await assertPublishTarget(bucket, plan)
	step(`Uploading to bucket "${bucket.name}"`)
	// Files are read into memory to be signed, and the export holds a few 200 MB+ skybox EXRs, so
	// parallelism is capped by BYTES in flight as well as by file count.
	const budget = 256 * 1024 * 1024
	let inFlight = 0
	const sent = { n: 0, bytes: 0 }
	await pool(
		plan,
		concurrency,
		async file => {
			while (inFlight > 0 && inFlight + file.size > budget) await Bun.sleep(25)
			inFlight += file.size
			try {
				const body = Buffer.from(await Bun.file(file.path).arrayBuffer())
				await bucket.put(file.rel, body, contentTypeFor(file.rel), cacheControlFor(file.rel))
				if (!hashes.has(file.rel)) hashes.set(file.rel, md5OfBytes(new Uint8Array(body)))
				sent.n++
				sent.bytes += file.size
			} finally {
				inFlight -= file.size
			}
		},
		'uploaded',
	)
	ok(`${sent.n} file(s), ${bytes(sent.bytes)}`)

	// ---- remember, so the next run can be a delta ----------------------------------------------
	const previous = readState(out)
	const state: PublishState = { origin, updated: new Date().toISOString(), files: previous?.files ?? {} }
	for (const file of candidates) {
		const md5 = hashes.get(file.rel) ?? previous?.files[file.rel]?.md5
		if (md5) state.files[file.rel] = { size: file.size, md5 }
	}
	writeFileSync(join(out, PUBLISH_STATE_FILE), JSON.stringify(state))
	ok(`state: ${join(out, PUBLISH_STATE_FILE)} (${Object.keys(state.files).length} files)`)
	return { uploaded: sent.n, bytes: sent.bytes, skipped: candidates.length - plan.length }
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------

export const resolveOut = () => resolve(value('out', 'CS2_EXPORT_OUT') ?? join(HERE, 'out'))
export const resolveOrigin = () => (value('origin', 'SKINS_CDN_ORIGIN') ?? DEFAULT_ORIGIN).replace(/\/+$/, '')

const main = async () => {
	const out = resolveOut()
	const origin = resolveOrigin()
	const concurrency = Number(value('concurrency') ?? 0) || undefined
	const wantsUpload = flag('upload') || flag('publish')
	if (!wantsUpload && !flag('verify'))
		throw new UserError('nothing to do — pass --verify, --upload (dry run) or --upload --confirm')

	if (wantsUpload)
		await upload({
			out,
			origin,
			confirm: flag('confirm'),
			since: flag('since'),
			prefixes: value('prefix')
				?.split(',')
				.map(p => p.trim())
				.filter(Boolean),
			concurrency,
		})

	if (flag('verify')) {
		const failures = await verify({ out, origin, concurrency, quick: flag('quick'), deep: flag('deep') })
		if (failures.length) process.exit(1)
	}
}

if (import.meta.main) {
	try {
		await main()
	} catch (err) {
		if (err instanceof UserError) {
			console.error(`\nerror: ${err.message}`)
			process.exit(1)
		}
		throw err
	}
}
