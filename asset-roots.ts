/**
 * The parts of the export that the exporter and the publisher BOTH have to agree on.
 *
 * `writeWeaponTexIndex()` in export.ts walks `WEAPONTEX_INDEX_ROOTS`; `--verify` in publish.ts
 * asserts the index PUBLISHED on the CDN still covers every one of them. They live here so the
 * two cannot drift apart silently, which is exactly what went wrong on 2026-08-03: the exporter
 * already walked the composite and position roots, but the `weapontex-index.json` sitting on the
 * CDN predated that change. Nothing failed — the viewer simply bound the LEGACY texture tree on
 * every HD-mesh weapon, `uHasPosition` was false everywhere, 370 fade-family kits projected
 * through UVs instead of the position map, and knives resolved no zone masks at all.
 *
 * One list plus a coverage assertion in `--verify` is what turns that class of defect back into
 * a loud error.
 */
export const WEAPONTEX_INDEX_ROOTS = [
	{ dir: 'weapontex', exts: ['.png'] },
	{ dir: 'position', exts: ['.exr'] },
	{ dir: 'knifetex', exts: ['.png'] },
	{ dir: 'knifecomposite', exts: ['.png', '.exr'] },
	{ dir: 'weaponcomposite', exts: ['.png', '.exr'] },
	// The GLOVE finish inputs, and the same reasoning one tree over. A glove's textures are named by
	// content hash exactly like a weapon's (`glove_slick_normal_tga_3a809923.png`), so the viewer can
	// only bind them by looking them up — there is nothing to derive a filename from. Left out, a
	// glove resolves no layer mask, no AO/curvature and no textile maps, and the compositor has no
	// choice but to fall back to a flat unpainted glove, which is precisely the state this closes.
	//
	// `paintkits` is here for the same reason and was ALREADY exported without being indexed: it holds
	// both the weapon kits' albedo/normal/roughness and the 26 new-generation glove kits' substrate and
	// surface maps under items/assets/paintkits/volatile_02/.
	{ dir: 'glovetex', exts: ['.png'] },
	{ dir: 'glovemodeltex', exts: ['.png'] },
	{ dir: 'paintkits', exts: ['.png'] },
] as const

/**
 * Files the viewer reads as CONFIGURATION rather than as content: the recipe manifest and
 * everything under data/. They are re-written by every export, they are tiny, and a stale one is
 * invisible at runtime — so `--verify` compares them by hash, and the publisher gives them a short
 * cache TTL. See also `isStableNamedAsset`: "not a control file" does NOT mean "safe to freeze".
 */
export const isControlFile = (relPath: string) => relPath === 'manifest.json' || relPath.startsWith('data/')

/**
 * Content the viewer fetches, on names the exporter does NOT content-hash — so it changes under a
 * fixed URL and can never be published `immutable`. See `cacheControlFor` in `publish.ts` for what
 * that would have cost. Deliberately a small, explicit list rather than "everything not hashed":
 * the safe default here is to under-cache a file, and a wrong guess in the other direction is a
 * year-long pin that no deploy can clear.
 */
export const isStableNamedAsset = (relPath: string) =>
	relPath.endsWith('.glb') || /^models\/.+\/physics_[^/]*\.png$/.test(relPath)

/** Files that exist only because a filesystem put them there. Never indexed, never uploaded. */
export const JUNK_FILES = new Set(['.DS_Store', 'Thumbs.db', 'desktop.ini'])

/** Publisher bookkeeping, written into the output folder. Not part of the export. */
export const PUBLISH_STATE_FILE = '.publish-state.json'
