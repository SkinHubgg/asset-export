/**
 * The Doppler PHASE per paint index — the one field of `skins.json` that CS2's own localisation does
 * not carry, and therefore the one field that had to become our own data before the file could stop
 * being downloaded from `ByMykel/CSGO-API`.
 *
 * WHY THIS EXISTS
 * ---------------
 * `csgo_english.txt` has exactly two Doppler strings — `PaintKit_am_marbleized_Tag` "Doppler" and
 * `PaintKit_am_marbleized_g_Tag` "Gamma Doppler". All 24 phase paint kits share one of those two
 * tags, so localisation alone renders 181 rows of `skins.json` with the SAME name and nothing to
 * separate them. "Phase 1", "Ruby", "Emerald", "Black Pearl" are market convention, not game
 * strings.
 *
 * WHERE THE VALUES COME FROM
 * --------------------------
 * They are not invented here. Valve names the paint kits after the phase:
 *
 *     415  am_ruby_marbleized              -> Ruby
 *     418  am_doppler_phase1               -> Phase 1
 *     568  am_emerald_marbleized           -> Emerald
 *     617  am_blackpearl_marbleized_b      -> Black Pearl     (the `_b` Butterfly re-issue)
 *     852  am_doppler_phase1_widow         -> Phase 1         (the `_widow` Widowmaker re-issue)
 *    1123  am_gamma_doppler_phase4_glock   -> Phase 4         (the `_glock` re-issue)
 *
 * so `phaseFromKitName` reads the phase straight off `paint_kits[i].name` and this table is the
 * CROSS-CHECK, not the source. `assertPhaseTable` fails the build if the two ever disagree — which
 * is what a CS2 rename, or a new Doppler re-issue Valve spells differently, would look like.
 *
 * `am_` IS LOAD-BEARING. Three shipped kits contain a phase token and are NOT Dopplers:
 * `an_emerald_bravo` (196), `an_emerald` (453) and `specialist_emerald_web` (10034). Requiring the
 * `am_` prefix — `am` is Valve's marker for the anodized-multicoloured finish family the Dopplers all
 * belong to — excludes all three and leaves exactly the 24 below, with none missed.
 *
 * Measured against the downloaded `skins.json` of 2026-08-07: 181 rows carry a phase across these 24
 * paint indices, and no index carries two.
 */

/** Phase per paint index. Seeded from `ByMykel/CSGO-API`'s `skins.json` before it stopped being downloaded. */
export const DOPPLER_PHASES: Record<string, string> = {
	// Doppler — the original Knife run
	'415': 'Ruby',
	'416': 'Sapphire',
	'417': 'Black Pearl',
	'418': 'Phase 1',
	'419': 'Phase 2',
	'420': 'Phase 3',
	'421': 'Phase 4',
	// Gamma Doppler
	'568': 'Emerald',
	'569': 'Phase 1',
	'570': 'Phase 2',
	'571': 'Phase 3',
	'572': 'Phase 4',
	// `_b` — the Butterfly Knife re-issue, which shipped only three of the seven
	'617': 'Black Pearl',
	'618': 'Phase 2',
	'619': 'Sapphire',
	// `_widow` — the Talon/Widowmaker re-issue, phases only
	'852': 'Phase 1',
	'853': 'Phase 2',
	'854': 'Phase 3',
	'855': 'Phase 4',
	// `_glock` — Gamma Doppler on the Glock-18
	'1119': 'Emerald',
	'1120': 'Phase 1',
	'1121': 'Phase 2',
	'1122': 'Phase 3',
	'1123': 'Phase 4',
}

/**
 * Longest token first: `phase1` must not be found inside a hypothetical `phase10`, and the two-word
 * labels are matched on the squashed spelling Valve uses (`blackpearl`, not `black_pearl`).
 */
const PHASE_TOKENS: [token: string, phase: string][] = [
	['blackpearl', 'Black Pearl'],
	['sapphire', 'Sapphire'],
	['emerald', 'Emerald'],
	['ruby', 'Ruby'],
	['phase1', 'Phase 1'],
	['phase2', 'Phase 2'],
	['phase3', 'Phase 3'],
	['phase4', 'Phase 4'],
]

/** `am_gamma_doppler_phase3_glock` -> `Phase 3`. Anything without the `am_` prefix -> null. */
export const phaseFromKitName = (kitName: string | undefined): string | null => {
	if (!kitName) return null
	const name = kitName.toLowerCase()
	if (!name.startsWith('am_')) return null
	return PHASE_TOKENS.find(([token]) => name.includes(token))?.[1] ?? null
}

/**
 * Fail loudly rather than silently ship 181 rows with a null phase. Returns the disagreements so the
 * caller can print them; an empty array is the only acceptable result.
 */
export const assertPhaseTable = (paintKits: Record<string, { name?: string }>) => {
	const problems: string[] = []
	const derived = new Map<string, string>()
	for (const [index, kit] of Object.entries(paintKits)) {
		const phase = phaseFromKitName(kit?.name)
		if (phase) derived.set(index, phase)
	}
	for (const [index, phase] of Object.entries(DOPPLER_PHASES)) {
		const got = derived.get(index)
		if (!got) problems.push(`paint ${index}: table says ${phase}, the kit name no longer derives one`)
		else if (got !== phase) problems.push(`paint ${index}: table says ${phase}, kit name derives ${got}`)
	}
	for (const [index, phase] of derived.entries())
		if (!DOPPLER_PHASES[index])
			problems.push(`paint ${index}: kit name derives ${phase}, not in the table (a NEW re-issue?)`)
	return problems
}
