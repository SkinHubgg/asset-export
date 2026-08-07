import { describe, expect, it } from 'bun:test'
import { isControlFile, isStableNamedAsset } from './asset-roots'
import { CACHE_CONTROL_ASSET, CACHE_CONTROL_CONTROL, CACHE_CONTROL_STABLE_ASSET, cacheControlFor } from './publish'

/**
 * The classification that decides how long a browser may hold a file.
 *
 * Worth pinning because the failure is silent and un-fixable after the fact: `immutable` on a name
 * the exporter reuses pins that URL in every visitor's cache for a year, and no deploy can clear it.
 * The rule was wrong until 2026-08-08 — "not a control file" meant "immutable", so all 643 GLBs
 * qualified — and it never fired only because nothing had been published to R2 yet.
 */
describe('cache policy', () => {
	it('never marks a GLB immutable — 0 of 643 are content-hashed', () => {
		for (const p of [
			'models/weapons/models/ak47/weapon_rif_ak47.glb',
			'models-gloves/agents/models/shared/arms/glove_slick/glove_slick.glb',
			'keychains/models/keychains/keychain_ak47.glb',
			'stattrak/weapon_rif_ak47_stattrak.glb',
			'nametag/nametag_plate.glb',
			'povclips/weapon_rif_ak47_pov.glb',
		]) {
			expect(isStableNamedAsset(p)).toBe(true)
			expect(cacheControlFor(p)).toBe(CACHE_CONTROL_STABLE_ASSET)
			expect(cacheControlFor(p)).not.toContain('immutable')
		}
	})

	it('never marks a physics_ png immutable — 103 files on stable names', () => {
		const p = 'models/weapons/models/ak47/physics_weapon_rif_ak47.png'
		expect(isStableNamedAsset(p)).toBe(true)
		expect(cacheControlFor(p)).toBe(CACHE_CONTROL_STABLE_ASSET)
	})

	it('STILL marks content-hashed textures immutable — the saving this exists to protect', () => {
		for (const p of [
			'weapontex/weapons/models/ak47/ak47_color_psd_da5a7179.png',
			'compmats/some/material_a1b2c3d4.png',
			'skinicons/panorama/images/econ/default_generated/x_light_png.png',
		]) {
			expect(isStableNamedAsset(p)).toBe(false)
			expect(cacheControlFor(p)).toBe(CACHE_CONTROL_ASSET)
		}
	})

	it('control files keep the short TTL, and are checked before the stable-name rule', () => {
		expect(cacheControlFor('manifest.json')).toBe(CACHE_CONTROL_CONTROL)
		expect(cacheControlFor('data/skins.json')).toBe(CACHE_CONTROL_CONTROL)
		// data/ wins even for a .glb under it, so a control file can never be pinned for an hour
		expect(isControlFile('data/x.glb')).toBe(true)
		expect(cacheControlFor('data/x.glb')).toBe(CACHE_CONTROL_CONTROL)
	})

	it('does not catch a physics_ png outside models/, nor a name merely containing .glb', () => {
		expect(isStableNamedAsset('compmats/physics_thing.png')).toBe(false)
		expect(isStableNamedAsset('weapontex/ak47.glb.png')).toBe(false)
	})
})
