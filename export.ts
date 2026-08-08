#!/usr/bin/env bun
/**
 * CS2 asset exporter — the cross-platform port of Export-CS2Assets.ps1.
 *
 * Pulls everything the skin viewer needs out of a local CS2 install into one upload-ready
 * folder: models as GLB, every texture the paint kits reference, the decompiled material
 * recipes, and `manifest.json` — paint_index -> { kit, style, wear range, pattern, recipe }.
 *
 *   bun run export.ts                           # INTERACTIVE picker (see interactive.ts)
 *   bun run export.ts --discover                # confirm every in-VPK path, extract nothing
 *   bun run export.ts --sample                  # one folder per job, into out-sample/
 *   bun run export.ts --yes                     # full export, no prompt (wipes the output folder)
 *   bun run export.ts --only models,weapontex   # one stage at a time
 *   bun run export.ts --incremental             # skip files whose source bytes have not changed
 *   bun run export.ts --manifest-only           # rebuild manifest.json from an existing out/
 *   bun run export.ts --list                    # every VPK the install exposes
 *   bun run export.ts --dump-shaders            # real GLSL via SPIRV-Cross
 *   bun run export.ts --no-update               # do not git-pull first (see selfupdate.ts)
 *
 * The BARE command is a picker, not a full export. It used to be the latter, which made the most
 * natural invocation the most destructive one — hours, ~55 GB, and it deleted the output folder
 * first with no warning. The picker resolves a choice into the exact flags below and re-execs, so
 * nothing scripted is affected: any argument at all, a non-TTY stdin, `CI=true`, or `--yes` all skip
 * it and behave exactly as before.
 *
 * EVERY RUN UPDATES ITSELF FIRST. Before anything else, `selfupdate.ts` fetches and hard-resets this
 * checkout onto its upstream, then re-execs so the export runs the code that was just pulled. It
 * discards local modifications to TRACKED files (and says which), never touches untracked or ignored
 * paths — `out/` is safe — and skips silently when there is nothing to update from, in CI, on a
 * non-TTY, or under `--no-update` / `CS2_EXPORT_NO_UPDATE`. A failed fetch warns and continues.
 *
 * A CS2 update is one command — export, upload only what changed, then prove the CDN serves it:
 *
 *   bun --env-file=<your .env> run export.ts --publish --verify            # dry run
 *   bun --env-file=<your .env> run export.ts --publish --confirm --verify  # publishes
 *
 * Publishing is delegated to publish.ts (which also runs standalone, e.g. `--verify` on its own
 * against the live CDN) and never writes without --confirm. `--all` republishes everything
 * instead of the delta.
 *
 * Runs on macOS, Windows and Linux; the platform is detected, never passed in. Paths are
 * discovered per platform and every one of them can be overridden:
 *
 *   --cs2 <path>     CS2_PATH                 install root, its game/ folder, or game/csgo
 *   --out <path>     CS2_EXPORT_OUT           output folder            (default ./out)
 *   --cli <path>     SOURCE2VIEWER_CLI        Source2Viewer-CLI binary (default ./.tools/cli-build)
 *   --tools <path>   CS2_EXPORT_TOOLS         toolchain cache          (default ./.tools)
 *   --threads <n>                             CLI worker threads       (default CPUs - 2)
 *   --no-update      CS2_EXPORT_NO_UPDATE     do not self-update; --update forces it in CI
 *                    CS2_EXPORT_UPDATE_TIMEOUT  git timeout in ms      (default 20000)
 *
 * Building the CLI requires the .NET 10 SDK: the released Source2Viewer binaries cannot parse
 * CS2's VCS version 71, and without shader parsing no material decompiles to readable text.
 */

import { cpus } from 'node:os'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { WEAPONTEX_INDEX_ROOTS } from './asset-roots'
import {
	IS_WINDOWS,
	UserError,
	cliPath,
	fileNameOf,
	findCs2Game,
	interactiveNeedsTty,
	readMergeableJson,
	relSlash,
	shouldPrompt,
	writeJsonAtomic,
} from './platform'
import { currentLog, installCrashHandlers, openRunLog, reportFatal, teeConsole } from './runlog'
import { runSelfUpdate } from './selfupdate'

// ---------------------------------------------------------------------------------------------
// The run log — FIRST, before anything that can fail
// ---------------------------------------------------------------------------------------------

/**
 * Opened above the argument parsing on purpose. `value()` below throws `UserError` for a flag with
 * no value, and that happens during MODULE EVALUATION — outside the `try` at the bottom of this
 * file, which only wraps `main()`. Until this line existed, such a failure produced a bun stack on a
 * console that on Windows then closed, and nothing on disk. `installCrashHandlers` covers the same
 * window for an uncaught throw or an unawaited rejection.
 *
 * The log is appended to line by line as the run proceeds, never buffered: at any instant everything
 * that has happened is already on disk, so even a `SIGKILL` leaves a usable file. `teeConsole`
 * mirrors every `step`/`ok`/`warn` into it without touching a single call site.
 */
const LOG = openRunLog('export', { here: import.meta.dir })
installCrashHandlers(LOG)
teeConsole(LOG)

// ---------------------------------------------------------------------------------------------
// Arguments
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

// ---------------------------------------------------------------------------------------------
// Locations — every default is overridable, nothing is pinned to one machine.
// ---------------------------------------------------------------------------------------------

const HERE = import.meta.dir
const SAMPLE = flag('sample')
const TOOLS = resolve(value('tools', 'CS2_EXPORT_TOOLS') ?? join(HERE, '.tools'))
const OUT = resolve(value('out', 'CS2_EXPORT_OUT') ?? join(HERE, SAMPLE ? 'out-sample' : 'out'))
const VRF_SRC = join(TOOLS, 'vrf-src')
const CLI = cliPath(value('cli', 'SOURCE2VIEWER_CLI'), TOOLS)
const THREADS = value('threads') ?? String(Math.max(1, cpus().length - 2))

/**
 * `<install>/game` — the folder holding csgo/, csgo_core/ and core/. The search (registry,
 * `%ProgramFiles(x86)%`, `libraryfolders.vdf`, the macOS and Linux roots) lives in `platform.ts`
 * so the four smaller scripts beside this one resolve the install identically.
 */
const findCs2 = () => findCs2Game(value('cs2', 'CS2_PATH'))

// ---------------------------------------------------------------------------------------------
// Jobs — mirrors the PowerShell job table. `ext` is the in-VPK extension; `dir` the output
// folder under out/; `gltf` exports models as GLB.
// ---------------------------------------------------------------------------------------------

type Job = {
	name: string
	ext: string
	dir: string
	filter: string
	vpk?: string
	gltf?: boolean
	/**
	 * Animation clips to bake into the GLB, comma-separated (`--gltf_animation_list`).
	 *
	 * NOT just "also ship some animations". **Without `--gltf_export_animations` VRF writes no
	 * SKELETON either** — the GLB still carries every vertex's `JOINTS_0`/`WEIGHTS_0`, but there are
	 * no joint nodes for them to point at, no `skins`, and no `animations`, so the mesh is frozen in
	 * whatever the bind pose happens to be. For a glove that pose is an A-posed body's hands: arms
	 * hanging, fingers DOWN, the pair a metre apart. It is not a pose anyone authored to be looked at.
	 *
	 * The clip list is deliberately narrow. A glove's vmdl ships three — `tools_preview_pose`,
	 * `inspect_loop` (the 6.2s animated in-game inspect) and `icon_pose` (the flat overlapping pose
	 * the Steam market image is rendered from) — and carrying all three costs +27% on every glove GLB
	 * against +7% for the one the viewer actually poses to. Name what you use.
	 */
	gltfAnimations?: string
	/** Materials are extracted DECOMPILED so the recipe (params + texture slots) is readable. */
	decompile?: boolean
	/**
	 * Also record every texture's AVERAGE COLOUR into data/texture-reflectivity.json. See
	 * `writeTextureReflectivity` — it is one extra CLI pass over the same filter, header-only, and
	 * it is the only place `TextureAverageColor()` can be read from without decoding every mip.
	 */
	reflectivity?: boolean
}

/**
 * The first-person clips the `povclips` job takes, relative to `animation/anims/viewmodel/`.
 *
 * Two per family, the static hold pose then the inspect. 56 families — 23 rifle/SMG/shotgun
 * folders, 9 pistol folders, 21 knife folders and the three `_default_*` fallbacks the M4A1-S,
 * USP-S and CT default knife are pointed at by `viewmodel_inspects.vnmgraph`. The idle is `idle_<w>`
 * where one exists and `idle1_<w>` where it does not (every knife, plus the G3SG1 and M249); the
 * alternates `idle2_*`, `idle_slide_back_*`, `idle_leftempty_*`, `idle_from_activity_*` and
 * `*_lgcy` are all deliberately absent. See the `povclips` job for why only these two.
 */
const POV_CLIPS = [
	'rifle/_default_rifle/idle_rifle',
	'rifle/_default_rifle/lookat01_rifle',
	'rifle/rifle_ak/idle_ak',
	'rifle/rifle_ak/lookat01_ak',
	'rifle/rifle_aug/idle_aug',
	'rifle/rifle_aug/lookat01_aug',
	'rifle/rifle_awp/idle_awp',
	'rifle/rifle_awp/lookat01_awp',
	'rifle/rifle_bizon/idle_bizon',
	'rifle/rifle_bizon/lookat01_bizon',
	'rifle/rifle_famas/idle_famas',
	'rifle/rifle_famas/lookat01_famas',
	'rifle/rifle_g3sg1/idle1_g3sg1',
	'rifle/rifle_g3sg1/lookat01_g3sg1',
	'rifle/rifle_galilar/idle_galilar',
	'rifle/rifle_galilar/lookat01_galilar',
	'rifle/rifle_m249/idle1_m249',
	'rifle/rifle_m249/lookat01_m249',
	'rifle/rifle_m4a4/idle_m4a4',
	'rifle/rifle_m4a4/lookat01_m4a4',
	'rifle/rifle_mac10/idle_mac10',
	'rifle/rifle_mac10/lookat01_mac10',
	'rifle/rifle_mag7/idle_mag7',
	'rifle/rifle_mag7/lookat01_mag7',
	'rifle/rifle_mp5sd/idle_mp5sd',
	'rifle/rifle_mp5sd/lookat01_mp5sd',
	'rifle/rifle_mp7/idle_mp7',
	'rifle/rifle_mp7/lookat01_mp7',
	'rifle/rifle_mp9/idle_mp9',
	'rifle/rifle_mp9/lookat01_mp9',
	'rifle/rifle_negev/idle_negev',
	'rifle/rifle_negev/lookat01_negev',
	'rifle/rifle_nova/idle_nova',
	'rifle/rifle_nova/lookat01_nova',
	'rifle/rifle_p90/idle_p90',
	'rifle/rifle_p90/lookat01_p90',
	'rifle/rifle_sawedoff/idle_sawedoff',
	'rifle/rifle_sawedoff/lookat01_sawedoff',
	'rifle/rifle_scar20/idle_scar20',
	'rifle/rifle_scar20/lookat01_scar20',
	'rifle/rifle_sg556/idle_sg556',
	'rifle/rifle_sg556/lookat01_sg556',
	'rifle/rifle_ssg08/idle_ssg08',
	'rifle/rifle_ssg08/lookat01_ssg08',
	'rifle/rifle_ump45/idle_ump45',
	'rifle/rifle_ump45/lookat01_ump45',
	'rifle/rifle_xm1014/idle_xm1014',
	'rifle/rifle_xm1014/lookat01_xm1014',
	'pistol/_default_pistol/idle_pistol',
	'pistol/_default_pistol/lookat01_pistol',
	'pistol/pistol_cz75a/idle_cz75a',
	'pistol/pistol_cz75a/lookat01_cz75a',
	'pistol/pistol_deagle/idle_deagle',
	'pistol/pistol_deagle/lookat01_deagle',
	'pistol/pistol_elite/idle_elite',
	'pistol/pistol_elite/lookat01_elite',
	'pistol/pistol_fiveseven/idle_fiveseven',
	'pistol/pistol_fiveseven/lookat01_fiveseven',
	'pistol/pistol_glock18/idle_glock',
	'pistol/pistol_glock18/lookat01_glock',
	'pistol/pistol_hkp2000/idle_hkp',
	'pistol/pistol_hkp2000/lookat01_hkp',
	'pistol/pistol_p250/idle_p250',
	'pistol/pistol_p250/lookat01_p250',
	'pistol/pistol_revolver/idle_revolver',
	'pistol/pistol_revolver/lookat01_revolver',
	'pistol/pistol_tec9/idle_tec9',
	'pistol/pistol_tec9/lookat01_tec9',
	'knife/_default_knife/idle_knife',
	'knife/_default_knife/lookat01_knife',
	'knife/knife_bayonet/idle1_bayonet',
	'knife/knife_bayonet/lookat01_bayonet',
	'knife/knife_bowie/idle1_bowie',
	'knife/knife_bowie/lookat01_bowie',
	'knife/knife_butterfly/idle1_butterfly',
	'knife/knife_butterfly/lookat01_butterfly',
	'knife/knife_canis/idle1_canis',
	'knife/knife_canis/lookat01_canis',
	'knife/knife_cord/idle1_cord',
	'knife/knife_cord/lookat01_cord',
	'knife/knife_css/idle1_css',
	'knife/knife_css/lookat01_css',
	'knife/knife_default_t/idle_default_t',
	'knife/knife_default_t/lookat01_default_t',
	'knife/knife_falchion/idle1_falchion',
	'knife/knife_falchion/lookat01_falchion',
	'knife/knife_flip/idle1_flip',
	'knife/knife_flip/lookat01_flip',
	'knife/knife_gut/idle1_gut',
	'knife/knife_gut/lookat01_gut',
	'knife/knife_karambit/idle1_karambit',
	'knife/knife_karambit/lookat01_karambit',
	'knife/knife_kukri/idle1_kukri',
	'knife/knife_kukri/lookat01_kukri',
	'knife/knife_m9/idle1_m9',
	'knife/knife_m9/lookat01_m9',
	'knife/knife_navaja/idle1_navaja',
	'knife/knife_navaja/lookat01_navaja',
	'knife/knife_outdoor/idle1_outdoor',
	'knife/knife_outdoor/lookat01_outdoor',
	'knife/knife_push/idle1_push',
	'knife/knife_push/lookat01_push',
	'knife/knife_skeleton/idle1_skeleton',
	'knife/knife_skeleton/lookat01_skeleton',
	'knife/knife_stiletto/idle1_stiletto',
	'knife/knife_stiletto/lookat01_stiletto',
	'knife/knife_tactical/idle1_tactical',
	'knife/knife_tactical/lookat01_tactical',
	'knife/knife_talon/idle1_talon',
	'knife/knife_talon/lookat01_talon',
	'knife/knife_ursus/idle1_ursus',
	'knife/knife_ursus/lookat01_ursus',
	// The gloves' own inspect — the one clip here that drives the arms rig with no weapon attached.
	'arms/inspects/pedestal_gloves_loop',
]

const JOBS: Job[] = [
	/*
	 * `inventory_icon` does two jobs at once, and the first one is the reason it is not optional.
	 *
	 * EVERY weapon and knife is SKINNED — the AK has a 7-bone rig (weapon/bolt/clip/trigger/...),
	 * weapon_arms.vmdl_c an 82-bone one — and without `--gltf_export_animations` VRF writes NO joint
	 * nodes and NO `skins`, only the vertices' orphaned JOINTS_0/WEIGHTS_0. Measured on the whole
	 * tree: 45 of the 119 GLBs shipped with `skins: []`. Nothing downstream can pose a bolt, fold a
	 * butterfly knife, or hang a gun off the arms rig's `wpn` bone, which is exactly what the
	 * `povclips` job below needs. `weapon_arms.glb` alone goes 587,688 -> 605,100 B for its 82 joints.
	 *
	 * And since the flag has to be on, name the pose worth having. 64 of the 119 models (the 34 guns,
	 * the 22 knives, and a few props) embed exactly two clips, `inventory_icon` and
	 * `inventory_inspect`, both single-keyframe. They are the SAME pose: comparing every channel of
	 * both on all 64, only ssg08 and knife_kukri differ, and only in the root `weapon` node's
	 * translation/rotation — an icon framing nudge, not a moving part. So one clip, and it is the icon
	 * one, because `inventory_icon` is the pose Valve renders `panorama/images/econ/default_generated`
	 * (the Steam market thumbnail) from, with the camera and lights in `items/inventory_image_data`
	 * that the `inventoryimagedata` job below extracts. That makes a bake diffable against the
	 * shipped icon instead of eyeballed. Taking `inventory_inspect` as well costs another 614,280 B
	 * across the tree for those two root offsets.
	 *
	 * Cost of the whole change: GLB bytes 170,204,544 -> 170,960,292 (+755,748, +0.44%). The 925 PNG
	 * sidecars and the 111 `_physics.glb` are byte-identical either way.
	 *
	 * A model with no matching clip is NOT an error: the CLI prints `glTF animation filter matched no
	 * animations for: inventory_icon`, exits 0, and still writes the skeleton — which is the whole
	 * point for `weapon_arms.vmdl_c`, which embeds no clips at all.
	 */
	{
		name: 'models',
		ext: 'vmdl_c',
		dir: 'models',
		filter: 'weapons/models/',
		gltf: true,
		gltfAnimations: 'inventory_icon',
	},
	// `tools_preview_pose` is the pose a glove is MEANT to be looked at in — two flat open hands,
	// fingers up, side by side, one showing the back and one the palm. maps/ui/inspect_gloves.vpk
	// (the game's own glove inspect screen) drives the same skeleton with `inspect_loop`, its animated
	// sibling; the static one is what a still frame wants. Without this the export has no skeleton at
	// all and the pair renders in the body's A-pose bind: fingers down, hands a metre apart.
	{
		name: 'models-gloves',
		ext: 'vmdl_c',
		dir: 'models-gloves',
		filter: 'agents/models/shared/arms/',
		gltf: true,
		gltfAnimations: 'tools_preview_pose',
	},
	/*
	 * PLAYABLE AGENTS — the 80 third-person CT/T operator bodies, in 11 factions.
	 *
	 * TWO jobs, and the split is load-bearing twice over.
	 *
	 * (1) IT IS HOW THE GLOVES ARE EXCLUDED. `-f` is a strict path-prefix match, so a filter can
	 * never subtract a subtree, and `agents/models/` matches 92 vmdl_c: the 80 bodies PLUS the 12
	 * `agents/models/shared/arms/` glove models that `models-gloves` above already ships. Left
	 * unsplit this job would re-emit every glove GLB under a second CDN path. `ctm_` and `tm_` match
	 * 35 and 45 — exactly the 80 bodies — and `shared` begins with an `s`, so neither prefix can
	 * reach it. Disjoint by construction, no exclusion machinery. (`-f` does take a comma-separated
	 * OR-list, so this could be one job — but see (2).)
	 *
	 * (2) THE IDLE IS FACTION-SPECIFIC. A CT model will never play the T loop, and shipping both in
	 * every GLB doubles the animated payload for nothing.
	 *
	 * TWO CLIPS EACH, and both earn their place:
	 *   tools_preview  — the only clip embedded in an agent's own vmdl that is worth having (the
	 *                    other, `eye_test`, is a face-rig diagnostic). ONE keyframe at t=0 driving
	 *                    all 94 bones including the twist and jiggle chains, so a still frame has no
	 *                    rest-pose artefacts anywhere. This is the direct analogue of the glove job's
	 *                    `tools_preview_pose` — the thumbnail pose. +8.1% on ctm_sas.glb.
	 *   <faction>_main_menu_knife_idle — the animated loop, 10.47 s (CT) / 12.67 s (T), 192 channels.
	 *                    Every animated idle in the game poses the hands around a weapon; the knife
	 *                    ones are the least wrong with no prop, and they are the cheapest of the
	 *                    main-menu family. +273,296 B on ctm_sas.glb (+11.7%), +23,931,340 across all
	 *                    80 (+10.4% of GLB bytes, +1.2% of the job). This is the clip that makes an
	 *                    agent card move instead of freeze.
	 *
	 * NAMING IS EXACT AND A MISS IS SILENT. Agents use `tools_preview`, NOT the gloves'
	 * `tools_preview_pose`. Pass the wrong one and the CLI prints "glTF animation filter matched no
	 * animations for: ...", exits 0, writes the skeleton, and ships `animations: []` — a bind-pose
	 * model that looks like it worked. `--discover` will not catch it either: it only checks the
	 * vmdl_c filter. Re-check after a CS2 update with
	 *   Source2Viewer-CLI -i <pak01_dir.vpk> -l -e vnmclip_c -f animation/anims/ui_anims/main_menu/
	 *
	 * DO NOT DROP `gltfAnimations`, and DO NOT WIDEN IT. Without it there is no skeleton at all
	 * (ctm_sas: 5 nodes, 0 skins). Without a *list* VRF follows the vmdl's NmSkeletonList /
	 * AnimGraph2List references and bakes the ENTIRE CS2 animation library — measured 2,062 clips and
	 * a 291,670,644-byte ctm_sas.glb against 2,338,556, i.e. ~23 GB for the set. The list here is not
	 * an optimisation, it is the difference between 2 GB and 23 GB.
	 *
	 * THE MODELS ARE UNDER `agents/`. `characters/models/<agent>/<agent>.vmdl_c` has the same 80
	 * basenames and is a ~4.8 KB stub (one bone named "dummy", placeholder mesh). What DOES live under
	 * characters/models/ is the agents' materials — and `--gltf_export_materials` resolves and writes
	 * them as PNGs beside each GLB, referenced by relative `uri`, so the FOLDER is the shipping unit
	 * exactly as it is for gloves. A separate agentmats/agenttex job would only duplicate that, and
	 * would also re-extract `characters/models/shared/arms/`, which `glovemodeltex`/`glovemodelmats`
	 * already own.
	 *
	 * COST, measured: ct 679 files / 906,545,165 B / 28 s, t 633 files / 1,067,632,331 B / 36 s.
	 * Together 1,312 files / 1,974,177,496 B = 253,342,956 glb + 41,031,760 _physics.glb +
	 * 1,679,802,780 png. The PNGs are 85% of it.
	 *
	 * If that is too much: every agent ships 5 meshes and two of them (`firstperson_default_gloves_arms`,
	 * `firstperson_sleeves`) plus `defusekit` are invisible in a third-person card. Narrowing to
	 * `--gltf_mesh_list thirdperson_body,thirdperson_default_gloves` measures 1,677,467,108 B — 273 MB
	 * and 14% less. Not done here: `firstperson_sleeves` IS the agent's POV sleeve, which is real
	 * product content now that `povclips` below exists, and it would need a new `gltfMeshes` field for
	 * a saving smaller than the `_physics.glb` files nobody has decided to keep either.
	 */
	{
		name: 'models-agents-ct',
		ext: 'vmdl_c',
		dir: 'models-agents',
		filter: 'agents/models/ctm_',
		gltf: true,
		gltfAnimations: 'tools_preview,animation/anims/ui_anims/main_menu/ct/ct_main_menu_knife_idle',
	},
	{
		name: 'models-agents-t',
		ext: 'vmdl_c',
		dir: 'models-agents',
		filter: 'agents/models/tm_',
		gltf: true,
		gltfAnimations: 'tools_preview,animation/anims/ui_anims/main_menu/t/t_main_menu_knife_idle',
	},
	/*
	 * FIRST-PERSON (POV) ANIMATION. 113 clips, and none of them is reachable from any model.
	 *
	 * A viewmodel clip is a standalone `vnmclip_c` under `animation/anims/viewmodel/`, and it drives
	 * TWO rigs at once:
	 *   m_skeleton             animation/skeletons/characters/viewmodel.vnmskel   the arms, 56 joints
	 *   m_secondaryAnimations  animation/skeletons/weapons/<w>.vnmskel            the gun, 3-8 bones
	 * VRF exports both into one GLB as two scene-root skeletons plus the one animation. There is no
	 * v_/w_ model split to find — CS2 has ONE weapon model for both views, the arms are
	 * `weapons/models/shared/arms/weapon_arms.vmdl_c` (already in the `models` job) or, when a glove
	 * is equipped, the glove model (already in `models-gloves`), and `weapon_rif_ak47.vmdl_c` embeds
	 * only third-person/inventory clips. This job is the only route to a POV pose.
	 *
	 * COMPOSITION: viewmodel.vnmskel declares `m_secondarySkeletons = [{ m_attachToBoneID = "wpn" }]`
	 * for every weapon, but VRF writes the two skeletons as sibling roots at identity, so the gun
	 * lands at the origin. Parent the clip's `weapon` node under the arms' `wpn` node AND reset that
	 * node's local transform to identity — its constant rotation is VRF's nmSkelAxisFixup, already
	 * applied once at `root_motion`, and leaving it in double-rotates the gun.
	 *
	 * NO `gltfAnimations` HERE, deliberately. For `vnmclip_c` the exporter never consults
	 * `--gltf_animation_list` and always writes the animation: exporting idle_ak with
	 * `--gltf_export_animations --gltf_animation_list nothing_matches` produces a BYTE-IDENTICAL
	 * 102,292-byte file. The `models-gloves` "name one clip" pattern does not transfer; selection has
	 * to happen in `filter`, which VRF splits on commas and prefix-matches, so the list below IS the
	 * selection. That also means `--discover` verifies every name — a renamed clip shows up as
	 * "112 matches" instead of 113.
	 *
	 * WHY THESE TWO PER WEAPON. `idle_<w>` is ONE keyframe, duration 0.000 s — the static first-person
	 * hold, the analogue of the glove's `tools_preview_pose`. `lookat01_<w>` is the in-game inspect
	 * (4.53 s on the AK); `animation/graphs/viewmodel/viewmodel_inspects.vnmgraph+<w>` names it for
	 * all 65 weapons. The whole tree is 642 clips / 95 MB and the rest is dropped on purpose: draw,
	 * reload and shoot need magazine-swap and shell logic before they look like anything, `idle2_*`
	 * and `lookat02/03` are alternates of the same motion, and `lookat01_draw_*` / `lookat01_transfix_*`
	 * are graph transition variants of identical length.
	 *
	 * The three `_default_*` entries are not filler — the M4A1-S, USP-S and CT default knife ship no
	 * clips of their own and the inspect graphs point them at `_default_rifle`, `_default_pistol` and
	 * `_default_knife`. Knives have no static idle, so they take `idle1_<k>`, a short looping fidget.
	 * The taser is excluded: it has no paint kit, so nothing ever poses it.
	 *
	 * `pedestal_gloves_loop` is the odd one out and worth the 259 KB: it is the game's own glove
	 * inspect, 8.47 s, and the ONLY animation in the export that drives the 56-joint arms rig with no
	 * weapon attached. `pedestal_gloves_anim` is byte-identical to it and `_deploy` is the 1.97 s draw.
	 *
	 * COST: 113 files, 22,339,732 B raw / 6,938,051 B gzipped, 1.8 s. No textures — a clip GLB carries
	 * skeletons and a bone-visualisation stub, nothing else.
	 */
	{
		name: 'povclips',
		ext: 'vnmclip_c',
		dir: 'povclips',
		filter: POV_CLIPS.map(c => `animation/anims/viewmodel/${c}.vnmclip_c`).join(','),
		gltf: true,
	},
	{ name: 'weapontex', ext: 'vtex_c', dir: 'weapontex', filter: 'materials/models/weapons/' },
	// Knives keep their per-weapon textures under v_models/<knife_x>/ instead of customization/,
	// so the customization-only filters miss them entirely. Without these a knife has no AO map,
	// and the AO map's ALPHA is the no-paint mask - which is why knives painted over their
	// handles, guards and pommels. 22 knife folders, ao/color/rough each.
	{ name: 'knifetex', ext: 'vtex_c', dir: 'knifetex', filter: 'materials/models/weapons/v_models/knife_' },
	// A knife's COMPOSITE INPUTS - its paint mask, the genuinely packed cavity/AO/no-paint map, and
	// its object-space position map - live under weapons/models/knife/<x>/materials/composite_inputs/,
	// an entirely different root from materials/models/weapons/. knife_m9_composite_inputs.vmat binds
	// them by hand:
	//   g_tMasks            composite_inputs/knife_m9_bay_masks_psd_*.vtex
	//   g_tAmbientOcclusion composite_inputs/knife_m9_bay_ao_psd_*.vtex
	//   g_tPosition         composite_inputs/knife_m9_bay_pos_pfm_*.vtex
	// Without these a knife has no paint mask (so paint covers the handle), no real cavity map, and
	// no triplanar projection. The v_models/<knife_x>/_ao_ map is a PLAIN GREYSCALE AO and is NOT a
	// substitute - it was the decoy that made every knife render battle-scarred at Factory New.
	{ name: 'knifecomposite', ext: 'vtex_c', dir: 'knifecomposite', filter: 'weapons/models/knife/' },
	// EVERY weapon has a composite_inputs tree, not just knives:
	//   weapons/models/<weapon>/materials/composite_inputs/weapon_<stem>_composite_inputs.vmat
	// It carries the PER-WEAPON g_flUvScale1 and g_flWeaponLength1 - the AK's are 0.772 and 37.287,
	// where the paint kit only ever carries the placeholders 1 and 32. Since the pattern transform
	// divides by uvScale1, using the placeholder renders every pattern 1/0.772 = 1.30x too large on
	// every style that uses that divisor, which is every style except SprayPaint and AnodizedAir.
	// No seed can match the game through a 30% scale error.
	// The same tree also holds the real g_tMasks, the packed map (named _cavity_ here, not _ao_)
	// and the position map.
	{ name: 'weaponcomposite', ext: 'vtex_c', dir: 'weaponcomposite', filter: 'weapons/models/' },
	{ name: 'weaponcompmats', ext: 'vmat_c', dir: 'weaponcompmats', filter: 'weapons/models/', decompile: true },
	// The LEGACY-mesh composite inputs. Every weapon has TWO composite_inputs materials, one per
	// mesh variant, and they carry DIFFERENT scale constants:
	//   customization/rif_ak47/rif_ak47_composite_inputs.vmat        uvScale1 0.549  (body_legacy)
	//   weapons/models/ak47/.../weapon_rif_ak47_composite_inputs.vmat uvScale1 0.772  (body_hd)
	// Same split as the textures. A legacy kit rendered with the HD scale draws its pattern ~40%
	// too large; recovering the scale from the in-game Case Hardened references reads ~0.55.
	{
		name: 'legacycompmats',
		ext: 'vmat_c',
		dir: 'legacycompmats',
		filter: 'materials/models/weapons/customization/',
		decompile: true,
	},
	{
		name: 'paintmats',
		ext: 'vmat_c',
		dir: 'paintmats',
		filter: 'materials/models/weapons/customization/paints/',
		decompile: true,
	},
	{ name: 'compmats', ext: 'vcompmat_c', dir: 'compmats', filter: 'weapons/paints/', decompile: true },
	/*
	 * GLOVE FINISHES. A whole parallel recipe tree that the weapon jobs above cannot reach, because a
	 * glove is not filed under any weapons prefix and does not use the weapon shader.
	 *
	 * A glove kit is `gloves/paints/<kit>.vcompmat` -> `gloves/paints/<kit>.vmat` (73 of the 99) or, for
	 * the Broken Fang era and later, `items/assets/paintkits/volatile_02/<kit>.vmat` plus
	 * `workshop/paintkits/templates/glove_compositor.vmat` (26) — those two are already covered by the
	 * `paintkits` and `templates` jobs. The .vmat is `csgo_customglove.vfx` and names FOUR material
	 * slots, each one a `gloves/textiles/<name>.vmat` bundle (leather01b, metal01, fabric05b, ...)
	 * carrying that slot's substrate, surface, detail, grunge and damage maps, plus a per-glove
	 * `g_tLayerMask` and `g_tSurface` AO from `characters/models/shared/arms/<glove>/materials/`.
	 *
	 * NONE of that was exported, which is why all 95 glove kits sit in `manifest.json` with `params: {}`
	 * and `compmat_file: null`, and why the viewer renders every glove unpainted. These four jobs are
	 * what a glove compositor would read.
	 *
	 * THEY GET THEIR OWN OUTPUT FOLDERS, and that is not tidiness. `buildManifest` indexes `compmats/`
	 * and `paintmats/` BY BASENAME, and `gloves/paints/_shared_paint_generic.vcompmat` collides with
	 * `weapons/paints/legacy/_shared_paint_generic.vcompmat` — two different files (the glove one
	 * matches on `composite_target`, the weapon one on `composite_inputs`). Landing gloves in the shared
	 * folders would make `resolveInclude` return whichever the directory walk happened to reach last,
	 * for every weapon kit that includes it. Separate folders keep this change strictly additive to the
	 * existing manifest.
	 */
	{ name: 'glovecompmats', ext: 'vcompmat_c', dir: 'glovecompmats', filter: 'gloves/paints/', decompile: true },
	// Both `gloves/paints/` (the kit recipes) and `gloves/textiles/` (the layer bundles they name).
	{ name: 'glovemats', ext: 'vmat_c', dir: 'glovemats', filter: 'gloves/', decompile: true },
	{ name: 'glovetex', ext: 'vtex_c', dir: 'glovetex', filter: 'gloves/', reflectivity: true },
	// The per-glove inputs: `<glove>_material_mask` (which of the four slots a texel takes), `<glove>_ao`
	// (bound as `g_tSurface`) and the glove normal. Filtered to `glove_` rather than the whole `arms/`
	// tree, which would also drag in 20 bare-arm skin tones the finish never reads.
	{
		name: 'glovemodeltex',
		ext: 'vtex_c',
		dir: 'glovemodeltex',
		filter: 'characters/models/shared/arms/glove_',
		reflectivity: true,
	},
	/*
	 * The RENDER materials for the same tree — `glove_<x>_{left,right}.vmat`, shader `csgo_character.vfx`,
	 * `composite_target = true`. `glovemodeltex` above is vtex-only, so without this job the textures land
	 * and the document that says WHICH of them the game actually binds does not.
	 *
	 * That document is not a nicety. `characters/models/shared/arms/glove_slick/materials/` ships TWO
	 * normal maps (`glove_slick_normal_tga_3a809923` and `…_6e5dd0b1`) and only one is on the rendered
	 * material; picking by name is a coin flip. The same file also names the roughness that pairs with it
	 * (`glove_specialist_71736f92_rough.png` against `g_tNormal …_71736f92`), which is the real roughness
	 * the viewer currently stands in for with a constant.
	 */
	{
		name: 'glovemodelmats',
		ext: 'vmat_c',
		dir: 'glovemodelmats',
		filter: 'characters/models/shared/arms/glove_',
		decompile: true,
	},
	/*
	 * The NEW-generation glove recipes. 26 of the 95 kits (Broken Fang and later) are not described by
	 * `gloves/paints/<kit>.vmat` at all — their recipe is `items/assets/paintkits/volatile_02/<kit>.vmat`
	 * against the `glove_compositor` template, in the substrate/surface layout rather than the legacy
	 * textile one. The `paintkits` job below covers this tree but is `vtex_c` ONLY, so it takes their
	 * TEXTURES and leaves every recipe behind: 26 kits with pixels and no instructions.
	 *
	 * 53 materials — the 26 kit recipes plus the 27 `volatile_02/textiles/*.vmat` layer bundles they name,
	 * which are to this family what `gloves/textiles/` is to the legacy one.
	 */
	{
		name: 'glovepaintkitmats',
		ext: 'vmat_c',
		dir: 'glovepaintkitmats',
		filter: 'items/assets/paintkits/volatile_02/',
		decompile: true,
	},
	{ name: 'paintkits', ext: 'vtex_c', dir: 'paintkits', filter: 'items/assets/paintkits/', reflectivity: true },
	{ name: 'defaults', ext: 'vtex_c', dir: 'defaults', filter: 'materials/default/' },
	{ name: 'keychains', ext: 'vmdl_c', dir: 'keychains', filter: 'weapons/keychains/', gltf: true },
	/*
	 * THE CHARM MATERIAL THAT IS NOT ON THE CHARM'S MODEL.
	 *
	 * 23 of the 143 keychain ids — the whole Missing Link Community 01 capsule, ids 38..60 — declare
	 * `pedestal_display_model = weapons/keychains/workshop_blanks/kc_missinglink_default.vmdl`, one
	 * shared WORKSHOP BLANK, and carry their entire appearance in a per-id `keychain_material` .vmat
	 * that `items_game` names alongside it. The job above exports models, so it picks up the blank and
	 * nothing else, and all 23 render identically — as the blank, whose own `g_tColor` is a
	 * featureless near-black. That is the "this keychain has no colour" report, and it is 16% of every
	 * charm in the game.
	 *
	 * Two jobs, because the material and its textures live in different trees: the .vmat under
	 * `weapons/keychains/`, the images it binds under `items/assets/keychains/`.
	 */
	{ name: 'keychainmats', ext: 'vmat_c', dir: 'keychainmats', filter: 'weapons/keychains/', decompile: true },
	{ name: 'keychaintex', ext: 'vtex_c', dir: 'keychaintex', filter: 'items/assets/keychains/' },
	// Sticker artwork is split across two roots and BOTH land in stickertex/. The top-level
	// stickers/ tree holds the ~15k plain sticker images; items/assets/stickers/ holds the 465
	// foil/holo variants with their own normal maps, which is what makes a holo shift colour with
	// view angle instead of looking like a decal.
	{ name: 'stickertex', ext: 'vtex_c', dir: 'stickertex', filter: 'stickers/' },
	{ name: 'stickertex-assets', ext: 'vtex_c', dir: 'stickertex', filter: 'items/assets/stickers/' },
	{ name: 'stickermats', ext: 'vmat_c', dir: 'stickermats', filter: 'stickers/', decompile: true },
	{ name: 'stattrak', ext: 'vmdl_c', dir: 'stattrak', filter: 'weapons/models/shared/stattrak/', gltf: true },
	// The nametag dataplate — the module a named weapon wears, a sibling of the StatTrak one and
	// authored the same way (a `nametag` / `nametag_legacy` attachment per mesh variant). ONE model
	// for everything, guns and knives alike, which is where it differs from StatTrak's two.
	//
	// The TEXT is not in any of these files and cannot be: `nametag_default.vcompmat` draws it at
	// composite time onto a copy of `g_tColor`. What the export has to carry is the blank plate plus
	// its roughness, which is exactly what this job takes. See `nametag.ts` for the compositing.
	{ name: 'nametag', ext: 'vmdl_c', dir: 'nametag', filter: 'weapons/models/shared/nametag/', gltf: true },
	// NOTE: the PowerShell exporter's `composite-inputs` job is vmat_c over this same tree and
	// lands in out/compinputs/. Here that content is `legacycompmats` above (it has a live
	// consumer, data/weapon-composite-params-legacy.json) and compinputs holds the tree's
	// TEXTURES instead. Same files, different folder names — the .ps1 is the one that has to move.
	{ name: 'compinputs', ext: 'vtex_c', dir: 'compinputs', filter: 'materials/models/weapons/customization/' },
	// Object-space position maps (35 of them, *_pos_pfm_*). Spraypaint (style 2) projects the
	// pattern TRIPLANAR through pos.yz / pos.xz / pos.yx, so DDPAT-style kits cannot be correct
	// without these. VRF writes them as .exr (float) — three's EXRLoader reads that.
	{ name: 'position', ext: 'vtex_c', dir: 'position', filter: 'materials/models/weapons/customization/' },
	// The gs_*/cu_*/aq_* paint templates a .vcompmat instantiates. These are MATERIALS, not
	// textures: a .vcompmat never states F_PAINT_STYLE, it names the template it instantiates and
	// the template declares the feature. See resolveTemplateStyles(). The template TEXTURES some
	// kits also bind (patina ramps, template normals) are recovered by the reference sweep, which
	// is where the PowerShell exporter puts them too.
	{ name: 'templates', ext: 'vmat_c', dir: 'templates', filter: 'workshop/paintkits/templates/', decompile: true },
	{ name: 'skyboxtex', ext: 'vtex_c', dir: 'skyboxtex', filter: 'materials/skybox/' },
	{ name: 'skyboxmats', ext: 'vmat_c', dir: 'skyboxmats', filter: 'materials/skybox/', decompile: true },
	{ name: 'scripts', ext: 'txt', dir: 'scripts', filter: 'scripts/' },
	/*
	 * THE STRING TABLE. `scripts/items/items_game.txt` — which the job above already extracts — stores
	 * every display name as a token (`#musickit_valve_cs2_01`, `#PaintKit_aa_fade_Tag`). This 4.8 MB
	 * file is the 44k-entry table those tokens index into, and it is what every community
	 * `…_en.json` the pipeline downloads is a reformatted view of. `scripts/` cannot reach it: it
	 * lives under `resource/`.
	 *
	 * Swap the filter to `resource/csgo_` for all 30 shipped languages (155 MB) if i18n ever wants
	 * them; the community lists are English-only, so that is content a third party cannot supply.
	 * Not done by default — the web app is Hebrew-only and CS2 ships no Hebrew.
	 */
	{ name: 'localization', ext: 'txt', dir: 'localization', filter: 'resource/csgo_english.txt' },
	/*
	 * VALVE'S OWN CAMERA AND LIGHT RIG FOR EVERY INVENTORY IMAGE — 32 KB in, 354 KB decompiled, 390
	 * `camera` blocks. One entry per item prefab (`weapon_ak47_prefab`, `melee`, `keychain`,
	 * `sticker`, `musickit_prefab`, `commodity_pin`, …), each carrying
	 *   camera    { angle, fov, znear, zfar, target, target_nudge, orbit_distance }
	 *   light0/1  { color, angle, brightness, orbit_distance }
	 *   lightsun  { color, angle, brightness }   lightfill { … }
	 *   item      { position, angle }
	 * This is the rig `panorama/images/econ/default_generated` was rendered with, and the `models`
	 * job's `inventory_icon` is the matching pose — so a bake can be diffed numerically against the
	 * shipped icon instead of eyeballed against a screenshot. The cheapest file in this table.
	 */
	{
		name: 'inventoryimagedata',
		ext: 'vdata_c',
		dir: 'inventoryimagedata',
		filter: 'items/inventory_image_data.vdata_c',
		decompile: true,
	},
	/*
	 * The five `.vcompmat` recipes that live at the ROOT of `compmatdata/` and therefore fall outside
	 * both `compmats` (`weapons/paints/`) and `glovecompmats` (`gloves/paints/`):
	 * `kc_sticker_display_case`, `kc_ghost_hands`, `kc_template_material`, `engrave_trophy`,
	 * `conjoined_slider_example`. 11 KB decompiled. Its own folder, not `compmats/`, because
	 * `buildManifest` indexes that one BY BASENAME and anything landing there can shadow a kit.
	 */
	{ name: 'compmatdata', ext: 'vcompmat_c', dir: 'compmatdata', filter: 'compmatdata/', decompile: true },
	/*
	 * ECON ICONS — the 2D inventory art for every item class the 3D jobs above do not cover.
	 * 1,861 vtex_c -> 1,861 PNG / 177,555,106 B, 3.1 s. `items_game`'s `image_inventory` field
	 * addresses this tree directly: `econ/music_kits/valve_cs2_01` is this path minus
	 * `panorama/images/` plus `_png`.
	 *
	 *   music_kits/    102   the only source of music-kit art anywhere
	 *   status_icons/  883   pins, coins, medals, map tokens
	 *   characters/    298   agent portraits — the 2D half of the two agent jobs above
	 *   patches/       113   the 112 patch kits (a `sticker_kit` with `patch_material`, not
	 *                        `sticker_material`); the product models patches nowhere today
	 *   keychains/      81   charm icons, paired with the existing `keychains`/`keychaintex` jobs
	 *   tools/         100   name tags, keys, caskets
	 *   weapons/        68   `base_weapons/` — the 20 vanilla knives, which have no paint kit and so
	 *                        no `default_generated` icon at all (see `skinicons`)
	 *   set_icons/     216   collection glyphs
	 *   weapon_cases/  ~340  case and souvenir-package art. ADDED 2026-08-07: `skins.json` is now
	 *                        generated here, and every one of its 5,042 `crates[].image` references
	 *                        resolved to nothing without this line — `items_game` addresses them as
	 *                        `econ/weapon_cases/crate_community_15`, and no job covered that root.
	 *   tournaments/   ~940  the per-map souvenir packages, addressed as
	 *                        `econ/tournaments/bud2025/crate_bud2025_promo_de_nuke`. Added in the same
	 *                        pass and for the same reason: 21 crates, 384 `crates[].image` references.
	 *
	 * Between this and `skinicons` below, the `image` field of every community JSON the pipeline
	 * fetches becomes derivable locally. 18 `vsvg_c` in the same tree are dropped on purpose (the ext
	 * is `vtex_c`): 16 collection glyphs and `local_agent_ct`/`_t`.
	 */
	{
		name: 'econicons',
		ext: 'vtex_c',
		dir: 'econicons',
		filter:
			'panorama/images/econ/music_kits/,panorama/images/econ/status_icons/,' +
			'panorama/images/econ/patches/,panorama/images/econ/keychains/,' +
			'panorama/images/econ/characters/,panorama/images/econ/tools/,' +
			'panorama/images/econ/weapons/,panorama/images/econ/set_icons/,' +
			'panorama/images/econ/weapon_cases/,panorama/images/econ/tournaments/',
	},
	/*
	 * THE STEAM MARKET THUMBNAIL, SHIPPED IN THE VPK. 6,804 vtex_c -> 6,804 PNG / 710,426,131 B in
	 * 45 s. 512x384, transparent background, three wear tiers per skin named
	 * `<item defname>_<paintkit>_{light,medium,heavy}` — CS2 deleted `alternate_icons2.weapon_icons`,
	 * so that concatenation IS the mapping. These are the exact images
	 * `community.akamai.steamstatic.com/economy/image/…` serves, which is the only reason
	 * `data/skins.json` is downloaded for its `image` field.
	 *
	 * The 20 skins that do not resolve here are the vanilla knives; they have no paint kit, and their
	 * icon is `econ/weapons/base_weapons` in the `econicons` job above.
	 *
	 * By far the largest thing in this table, and the one to drop first with `--only` if the upload
	 * budget is tight — nothing else depends on it.
	 */
	{ name: 'skinicons', ext: 'vtex_c', dir: 'skinicons', filter: 'panorama/images/econ/default_generated/' },
]

/**
 * --sample narrows each job to one folder, so the whole pipeline — export, manifest, kit -> pattern
 * linking — can be verified for a few hundred MB instead of ~60 GB. Kept beside the job table
 * rather than inside it so that table stays readable; a job with no entry here is skipped.
 */
const SAMPLE_FILTERS: Record<string, string> = {
	models: 'weapons/models/ak47/',
	'models-gloves': 'agents/models/shared/arms/glove_specialist/',
	// One faction per side, the two smallest: 3 CT models and 7 T models. Enough to exercise both
	// clip lists, which is the only thing that differs between the two agent jobs.
	'models-agents-ct': 'agents/models/ctm_sas/',
	'models-agents-t': 'agents/models/tm_balkan/',
	// The AK's two clips plus the gloves' inspect: one weapon rig, one weapon-less rig, 3 files.
	povclips:
		'animation/anims/viewmodel/rifle/rifle_ak/idle_ak.vnmclip_c,' +
		'animation/anims/viewmodel/rifle/rifle_ak/lookat01_ak.vnmclip_c,' +
		'animation/anims/viewmodel/arms/inspects/pedestal_gloves_loop.vnmclip_c',
	weapontex: 'materials/models/weapons/customization/paints/anodized_air/',
	knifetex: 'materials/models/weapons/v_models/knife_bayonet/',
	knifecomposite: 'weapons/models/knife/knife_m9/materials/composite_inputs/',
	weaponcomposite: 'weapons/models/ak47/materials/composite_inputs/',
	weaponcompmats: 'weapons/models/ak47/materials/composite_inputs/',
	legacycompmats: 'materials/models/weapons/customization/rif_ak47/',
	paintmats: 'materials/models/weapons/customization/paints/vmats/aa_',
	compmats: 'weapons/paints/community/community_33/',
	// One glove end to end: the Sport Gloves' kits, the layer bundles they name, and the one model's
	// own mask/AO. `models-gloves` above already samples `glove_specialist`, so the sample covers a
	// model with a finish and a finish with a model, which is what the linking has to be exercised on.
	glovecompmats: 'gloves/paints/sporty_',
	glovemats: 'gloves/textiles/',
	glovetex: 'gloves/textiles/',
	glovemodeltex: 'characters/models/shared/arms/glove_sporty/',
	glovemodelmats: 'characters/models/shared/arms/glove_sporty/',
	// The whole new-gen family is 53 materials; narrowing it would sample a kit with no layer bundles
	// or bundles with no kit, and the point of the sample is to exercise the link between them.
	glovepaintkitmats: 'items/assets/paintkits/volatile_02/',
	paintkits: 'items/assets/paintkits/community/community_33/',
	defaults: 'materials/default/',
	keychains: 'weapons/keychains/missinglink/',
	keychainmats: 'weapons/keychains/missinglink_community_01/',
	keychaintex: 'items/assets/keychains/missinglink_community_01/',
	stickertex: 'stickers/antwerp2022/',
	'stickertex-assets': 'items/assets/stickers/',
	stickermats: 'stickers/antwerp2022/',
	stattrak: 'weapons/models/shared/stattrak/',
	nametag: 'weapons/models/shared/nametag/',
	compinputs: 'materials/models/weapons/customization/rif_ak47/',
	position: 'materials/models/weapons/customization/rif_ak47/',
	templates: 'workshop/paintkits/templates/',
	skyboxtex: 'materials/skybox/',
	skyboxmats: 'materials/skybox/',
	scripts: 'scripts/items/',
	// These four are single files or already small enough that narrowing them would only test less.
	localization: 'resource/csgo_english.txt',
	inventoryimagedata: 'items/inventory_image_data.vdata_c',
	compmatdata: 'compmatdata/',
	econicons: 'panorama/images/econ/music_kits/',
	// One weapon's three wear tiers across every kit — 207 files, the same slice `weapontex` samples.
	skinicons: 'panorama/images/econ/default_generated/weapon_ak47_',
}

/** The in-VPK path a job extracts from, narrowed when --sample is in effect. */
const filterFor = (job: Job) => (SAMPLE ? SAMPLE_FILTERS[job.name] : job.filter)

// ---------------------------------------------------------------------------------------------
// Shell + filesystem helpers
// ---------------------------------------------------------------------------------------------

/**
 * A MISSING EXECUTABLE MUST COME BACK AS AN EXIT CODE, NOT AS A THROW.
 *
 * `Bun.spawn` throws `ENOENT` when the binary is not on PATH, and it throws from the CONSTRUCTOR —
 * so `.exited` is never awaited and `.code` is never reached. Every "try this tool, fall back to
 * that one" in this file is written as `run(a).code === 0 || run(b).code === 0`, and all of it was
 * dead: the first call escaped as an unhandled error.
 *
 * Reported from Windows 2026-08-08, unpacking the VRF download:
 *
 *     error: Executable not found in $PATH: "unzip"
 *
 * `unzip` does not exist on Windows. The `tar` fallback one line below is exactly right — bsdtar
 * ships with Windows 10+ and reads zips — and it never ran. The same bug sat on the `dotnet
 * --version` probe, where a machine without the SDK would have thrown this instead of printing the
 * install instructions written for that case.
 *
 * 127 is the shell's own convention for "command not found", so callers testing `code !== 0` behave
 * as they always read.
 */
/**
 * Named so the piped stdout/stderr survive into the type. `ReturnType<typeof Bun.spawn>` is the
 * WIDE signature — `stdout` there is `number | ReadableStream | undefined`, because the streams
 * depend on the options — so annotating with it loses what `{ stdout: 'pipe' }` established and
 * `new Response(proc.stdout)` stops typechecking.
 */
const spawnPiped = (cmd: string[]) => Bun.spawn(cmd, { stdout: 'pipe', stderr: 'pipe' })

const run = async (cmd: string[], quiet = false) => {
	const t0 = Date.now()
	let proc: ReturnType<typeof spawnPiped>
	try {
		proc = spawnPiped(cmd)
	} catch (e) {
		const err = e instanceof Error ? e.message : String(e)
		if (!quiet) console.error(err)
		currentLog().subprocess({ cmd, code: 127, ms: Date.now() - t0, err })
		return { code: 127, out: '', err }
	}
	const [out, err] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()])
	const code = await proc.exited
	// The console gets 800 characters; the log gets all of it. Both Windows failures reported on
	// 2026-08-08 — the `unzip` ENOENT and the dotnet build that followed it — had their cause past
	// that boundary, and there was no file to look in.
	if (!quiet && code !== 0) console.error(err.trim().slice(0, 800))
	currentLog().subprocess({ cmd, code, ms: Date.now() - t0, out, err })
	return { code, out, err }
}

const step = (msg: string) => console.log(`\n=== ${msg}`)
const ok = (msg: string) => console.log(`    ${msg}`)
const warn = (msg: string) => console.warn(`    ${msg}`)

/**
 * Every file under `dir`, in PowerShell's `Get-ChildItem -Recurse` order: a directory's own
 * files first, then its subdirectories, both alphabetical. Only matters where two files share a
 * basename and the later one wins, but that is exactly how the pattern index is built.
 */
const walkFiles = (dir: string, keep: (name: string) => boolean = () => true): string[] => {
	if (!existsSync(dir)) return []
	const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))
	const files = entries.filter(e => !e.isDirectory() && keep(e.name)).map(e => join(dir, e.name))
	const nested = entries.filter(e => e.isDirectory()).flatMap(e => walkFiles(join(dir, e.name), keep))
	return [...files, ...nested]
}

const countFiles = (dir: string) => walkFiles(dir).length
/** Path relative to the output folder, forward-slashed — how the manifest records every file. */
const rel = (path: string) => relSlash(OUT, path)
const hasExt = (name: string, ...exts: string[]) => exts.some(e => name.toLowerCase().endsWith(e))

// ---------------------------------------------------------------------------------------------
// Toolchain: build Source2Viewer + ShaderDump from VRF master
// ---------------------------------------------------------------------------------------------

/**
 * True when the decompiler is not just present but plausible.
 *
 * A THIRD INSTANCE OF THE POISONED-ARTIFACT SHAPE. `existsSync(CLI)` alone accepts a ZERO-BYTE file,
 * and `dotnet publish` creates the apphost before it fills it — so a build interrupted at the wrong
 * instant (Ctrl-C, a full disk, the machine sleeping) leaves an empty `Source2Viewer-CLI.exe` that
 * satisfies the guard for ever. Every later run then skips the build and fails at the first
 * extraction with the OS's own "not a valid executable", which names nothing and suggests nothing.
 * Same fix as the `vrf-src` one: check for the artifact, not for the path.
 */
const cliUsable = (path: string) => {
	try {
		return existsSync(path) && statSync(path).size > 0
	} catch {
		return false
	}
}

const ensureCli = async () => {
	if (cliUsable(CLI)) return CLI
	if (existsSync(CLI)) {
		warn(`${CLI} is empty — an earlier build was interrupted. Removing it and building again.`)
		rmSync(CLI, { force: true })
	}
	if (value('cli', 'SOURCE2VIEWER_CLI'))
		throw new UserError(`No Source2Viewer CLI at "${CLI}" (from --cli / SOURCE2VIEWER_CLI).`)
	if ((await run(['dotnet', '--version'], true)).code !== 0) {
		throw new UserError(
			[
				`No Source2Viewer CLI at ${CLI}, and \`dotnet\` is not on PATH so it cannot be built.`,
				'',
				'Either install the .NET 10 SDK (https://dotnet.microsoft.com/download) and re-run,',
				'or point --cli / SOURCE2VIEWER_CLI at an existing Source2Viewer-CLI binary.',
				'The released binaries cannot parse CS2 shaders (VCS 71) — build from master.',
			].join('\n'),
		)
	}

	step('Building Source2Viewer from VRF master')
	mkdirSync(TOOLS, { recursive: true })

	/**
	 * THE GUARD IS "IS THE SOURCE THERE", NOT "DOES THE FOLDER EXIST".
	 *
	 * It used to be `!existsSync(VRF_SRC)`, and the folder is created one line BEFORE the unpack —
	 * so any failure to unpack left an empty `vrf-src/` behind that then satisfied the guard for
	 * ever. Every later run skipped the download in silence and died further along, in `vrfRoot()`,
	 * with a message about `--manifest-only` that had nothing to do with it. Reported from Windows
	 * on 2026-08-08: the run that hit the `unzip` ENOENT poisoned the checkout, and the NEXT run —
	 * with that bug already fixed — still failed, because the empty folder was all it took.
	 *
	 * A half-finished unpack is now cleaned up rather than cached, so a failed run leaves nothing to
	 * inherit and the retry starts clean.
	 */
	if (!findVrfInner()) {
		ok('downloading VRF master ...')
		const zip = join(TOOLS, 'vrf-master.zip')
		const res = await fetch('https://github.com/ValveResourceFormat/ValveResourceFormat/archive/refs/heads/master.zip')
		if (!res.ok) throw new UserError(`Downloading VRF master failed (HTTP ${res.status}).`)
		await Bun.write(zip, await res.arrayBuffer())
		rmSync(VRF_SRC, { recursive: true, force: true })
		mkdirSync(VRF_SRC, { recursive: true })
		// `unzip` is not on Windows; bsdtar (shipped as `tar` since Windows 10) reads zips. Both are
		// attempted because neither is guaranteed: `run` returns 127 for a missing binary rather
		// than throwing, which is what makes this `||` reachable at all.
		const unzipped =
			(await run(['unzip', '-q', '-o', zip, '-d', VRF_SRC], true)).code === 0 ||
			(await run(['tar', '-xf', zip, '-C', VRF_SRC], true)).code === 0
		if (!unzipped || !findVrfInner()) {
			rmSync(VRF_SRC, { recursive: true, force: true })
			throw new UserError(
				[
					`Could not unpack ${zip}.`,
					'',
					'Neither `unzip` nor `tar` produced a ValveResourceFormat folder. `tar` ships with',
					'Windows 10+ and macOS; on a minimal Linux image install one of them.',
					'',
					'The half-unpacked folder has been removed, so re-running is safe.',
				].join('\n'),
			)
		}
	}

	ok('building CLI (needs the .NET 10 SDK) ...')
	const project = join(vrfRoot(), 'CLI/CLI.csproj')
	const buildDir = join(TOOLS, 'cli-build')
	const built = await run(['dotnet', 'publish', project, '-c', 'Release', '-o', buildDir, '--nologo', '-v', 'q'])
	if (built.code !== 0)
		throw new UserError('dotnet publish failed for the CLI. A .NET 10 SDK is required (VRF targets net10.0).')
	if (!IS_WINDOWS) await run(['chmod', '+x', CLI], true)
	ok(`built: ${CLI}`)
	return CLI
}

/** The extracted `ValveResourceFormat-master` folder inside `.tools/vrf-src`, or undefined. */
const findVrfInner = () =>
	(existsSync(VRF_SRC) && readdirSync(VRF_SRC).find(d => d.startsWith('ValveResourceFormat'))) || undefined

const vrfRoot = () => {
	const inner = findVrfInner()
	if (!inner)
		throw new UserError(
			[
				`VRF source not present under ${VRF_SRC}.`,
				'',
				'It is fetched automatically on any run that needs the decompiler. If you are seeing',
				'this, an earlier run failed part-way — delete that folder and run again.',
			].join('\n'),
		)
	return join(VRF_SRC, inner)
}

// ---------------------------------------------------------------------------------------------
// VPK discovery — every *_dir.vpk under the install, not a hardcoded list. The compositor lives
// in csgo_core, which an earlier hardcoded list missed entirely.
// ---------------------------------------------------------------------------------------------

const findArchives = (root: string): string[] => {
	const out: string[] = []
	for (const entry of readdirSync(root, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
		const path = join(root, entry.name)
		if (entry.isDirectory()) out.push(...findArchives(path))
		else if (entry.name.endsWith('_dir.vpk')) out.push(path)
	}
	return out
}

const listEntries = async (cli: string, archive: string, ext: string, filter = '') => {
	const args = [cli, '-i', archive, '-l', '-e', ext]
	if (filter) args.push('-f', filter)
	const { out } = await run(args, true)
	return out
		.split('\n')
		.map(l => l.trim().split(/\s+/)[0])
		.filter(l => l && !/^(Found|Total|Loading)/.test(l))
}

// ---------------------------------------------------------------------------------------------
// Recipe parsing
//
// A paint kit is described either by an old-style .vmat (a flat `"key" "value"` document) or by
// a newer .vcompmat (KV3, CCompositeMaterialEditorDoc). Both decompile to text with a
// VCS-71-capable CLI, and both are read into the same shape.
// ---------------------------------------------------------------------------------------------

/**
 * Insertion-ordered, case-insensitive string map — PowerShell's `[ordered]@{}`, which the
 * reference implementation uses for every recipe map. Re-setting a key keeps its position and its
 * original casing, and lookups ignore case.
 */
class CiMap {
	#entries = new Map<string, [key: string, value: string]>()
	set(key: string, val: string) {
		const existing = this.#entries.get(key.toLowerCase())
		if (existing) existing[1] = val
		else this.#entries.set(key.toLowerCase(), [key, val])
	}
	get(key: string) {
		return this.#entries.get(key.toLowerCase())?.[1]
	}
	has(key: string) {
		return this.#entries.has(key.toLowerCase())
	}
	get size() {
		return this.#entries.size
	}
	entries(): [string, string][] {
		return [...this.#entries.values()].map(([k, v]) => [k, v])
	}
	keys() {
		return this.entries().map(([k]) => k)
	}
	values() {
		return this.entries().map(([, v]) => v)
	}
	toObject(): Record<string, string> {
		return Object.fromEntries(this.entries())
	}
}

/** What one paint kit's material says: named texture slots, scalars, and the seed-roll data. */
class Recipe {
	readonly params = new CiMap()
	readonly textures = new CiMap()
	readonly ranges = new CiMap()
	rollVars: string[] = []
	/**
	 * `m_nResolution` per GENERATED texture — the size of the render target the game composites
	 * into. Keyed by `m_strGenerateTexture_TargetParam`, which across the whole shipped tree takes
	 * exactly two values: `g_tColor` and `g_tMetalness`. Nothing else is generated; a kit's normal
	 * is bound, not composited.
	 */
	readonly resolutions = new CiMap()
	/** Other .vcompmat documents this one pulls its shared recipe from, in declaration order. */
	includes: string[] = []
	/**
	 * Every property a `SET_VALUE` mutator names, whether or not its conditions held. A mutator
	 * that does NOT fire leaves the property at whatever the composite initialised it from, so
	 * these are the names whose final value may come from the paint template rather than from
	 * here — resolved against the template in `buildManifest`.
	 */
	readonly mutatorTargets = new Set<string>()
	/**
	 * Properties whose mutator carries a condition this document cannot settle: name -> the
	 * condition, verbatim. Deliberately NOT folded into `params` — an unevaluable rule does not
	 * get a guessed value, it gets published as a rule.
	 */
	readonly unresolved = new CiMap()
}

/**
 * Maps an `m_vecCompMatIncludes` entry — a CONTENT path such as
 * `weapons/paints/legacy/_shared_paint_generic.vcompmat` — onto the exported file on disk.
 * Passed in rather than derived from OUT so the parser stays independent of the output layout.
 */
type IncludeResolver = (target: string) => string | undefined

/**
 * Strips the resource extension chain so "aa_fade.vmat_c" keys as "aa_fade" — one pass per
 * suffix, in this order, because a compiled resource carries two ("_c" then ".vmat").
 */
const assetKey = (fileName: string) => {
	let key = fileName
	for (const suffix of ['_c', '.vmat', '.vcompmat', '.vtex', '.png', '.tga', '.psd']) {
		if (key.toLowerCase().endsWith(suffix)) key = key.slice(0, -suffix.length)
	}
	return key.toLowerCase()
}

/** Basename without its extension, lowercased — how every exported texture is keyed. */
const baseKey = (path: string) => {
	const name = fileNameOf(path)
	return name.replace(/\.[^.]+$/, '').toLowerCase()
}

/**
 * Reads a resource as printable text. Source 2 keeps referenced file paths as plain ASCII in the
 * RERL block, so collapsing non-printable runs to newlines exposes them from a raw .vmat_c /
 * .vcompmat_c without needing the shader — and works just as well on a decompiled one.
 */
const readPrintable = (path: string) => {
	try {
		const bytes = readFileSync(path).toString('latin1')
		return bytes.replace(/[^\x20-\x7E]+/g, '\n')
	} catch {
		return ''
	}
}

/**
 * Every .vtex a resource references, in declaration order. The root is deliberately unrestricted:
 * a whitelist of materials|items|stickers is the same "only the roots we thought of" assumption
 * that lost the pattern on 174 kits — kit textures also live under gloves/, workshop/, weapons/
 * and even at the materials/ root.
 */
const resourceTextureRefs = (path: string | undefined) => {
	if (!path || !existsSync(path)) return []
	const seen = new Set<string>()
	for (const m of readPrintable(path).matchAll(/[A-Za-z0-9_-]+\/[A-Za-z0-9_/\-.]+?\.vtex/gi)) seen.add(m[0])
	return [...seen]
}

/**
 * The old-style flat material:
 *
 *   "shader"                   "csgo_customweapon.vfx"
 *   "F_PAINT_STYLE"            "5"
 *   "g_flPatternTexCoordScale" "1.8"
 *   "g_vColor0"                "[0.572549 0.521569 0.345098 1.000000]"
 *   "Compiled Textures" { "g_tPattern" "...ancient_pattern_psd_3418d34c.vtex" ... }
 *
 * Those named slots and scalars are exactly what a compositing shader consumes, so pull them out
 * rather than inferring from paths. A raw (non-decompiled) material yields nothing here, which is
 * fine: the path-scraping fallback still runs.
 */
const vmatRecipe = (path?: string) => {
	const recipe = new Recipe()
	if (!path || !existsSync(path)) return recipe
	let text: string
	try {
		text = readFileSync(path, 'utf8')
	} catch {
		return recipe
	}
	for (const [, key, val] of text.matchAll(/"([A-Za-z_][A-Za-z0-9_]*)"\s+"([^"]*)"/g)) {
		if (/^g_t/i.test(key)) recipe.textures.set(key, val)
		else if (/^(g_|F_)/i.test(key) || key.toLowerCase() === 'shader') recipe.params.set(key, val)
	}
	return recipe
}

// ---------------------------------------------------------------------------------------------
// KV3 structure
//
// The .vcompmat is nested, and two of its levels matter: a CONTAINER holds the kit's declared
// values, and a MUTATOR list replays edits over them. Splitting the file on a key name cannot
// tell those apart — a mutator's payload is byte-for-byte shaped like a declaration — so the
// mutator half is walked structurally instead.
// ---------------------------------------------------------------------------------------------

/**
 * Body of the array `<key> = [ … ]`, bracket-matched and quote-aware. Quote-aware matters: KV3
 * localisation strings carry braces (`m_strExposedFriendlyName = "{-310}Use Roughness Texture"`),
 * and counting those as structure walks off the end of the array.
 */
const kvBlock = (text: string, key: string, bracket: '[' | '{') => {
	const at = text.indexOf(key)
	if (at < 0) return null
	const open = text.indexOf(bracket, at)
	if (open < 0) return null
	let depth = 0
	let inString = false
	for (let i = open; i < text.length; i++) {
		const c = text[i]
		if (inString) {
			if (c === '"') inString = false
			continue
		}
		if (c === '"') inString = true
		else if (c === '[' || c === '{') depth++
		else if (c === ']' || c === '}') {
			depth--
			if (depth === 0) return { body: text.slice(open + 1, i), start: at }
		}
	}
	return null
}

const kvArray = (text: string, key: string) => kvBlock(text, key, '[')
const kvObject = (text: string, key: string) => kvBlock(text, key, '{')

/** The top-level `{ … }` elements of an array body, each without its own braces. */
const kvElements = (body: string) => {
	const out: string[] = []
	let depth = 0
	let start = -1
	let inString = false
	for (let i = 0; i < body.length; i++) {
		const c = body[i]
		if (inString) {
			if (c === '"') inString = false
		} else if (c === '"') inString = true
		else if (c === '{' || c === '[') {
			if (depth === 0 && c === '{') start = i + 1
			depth++
		} else if (c === '}' || c === ']') {
			if (--depth === 0 && c === '}' && start >= 0) {
				out.push(body.slice(start, i))
				start = -1
			}
		}
	}
	return out
}

/**
 * Comparable form of a KV3 value. A condition states its operand as a STRING — `"1"`, `"0"`,
 * `"True"` — while the variable it names is a boolean, an int or a float, so both sides are
 * normalised before comparing: booleans collapse to 1/0 (which is also how a boolean loose
 * variable is stored in the recipe), and anything numeric compares numerically so that `0.0`
 * and `0` match.
 */
const kvComparable = (raw: string) => {
	const v = raw.trim().toLowerCase()
	if (v === 'true') return '1'
	if (v === 'false') return '0'
	const n = Number(v)
	return Number.isFinite(n) && v !== '' ? String(n) : v
}

/** One `m_vecConditions` entry. `pass` is `m_bPassWhenTrue`, which defaults to true. */
type MutatorCondition = { kind: string; container: string; varName: string; varValue: string; pass: boolean }

const conditionsOf = (mutator: string): MutatorCondition[] => {
	const conditions = kvArray(mutator, 'm_vecConditions')
	if (!conditions) return []
	return kvElements(conditions.body).map(entry => ({
		kind: entry.match(/m_nMutatorCondition\s*=\s*"COMP_MAT_MUTATOR_CONDITION_([A-Z_0-9]+)"/)?.[1] ?? '',
		container: entry.match(/m_strMutatorConditionContainerName\s*=\s*"([^"]*)"/)?.[1] ?? '',
		varName: entry.match(/m_strMutatorConditionContainerVarName\s*=\s*"([^"]*)"/)?.[1] ?? '',
		varValue: entry.match(/m_strMutatorConditionContainerVarValue\s*=\s*"([^"]*)"/)?.[1] ?? '',
		// The flag sits on the CONDITION, not on the mutator. All 352 negated conditions in the
		// shipped tree are `!=` readings of an equality test — F_GLITTER and F_IRIDESCENCE ("set
		// when the intensity is NOT zero") and F_OVERLAY_MASK's second clause.
		pass: !/m_bPassWhenTrue\s*=\s*false/.test(entry),
	}))
}

/**
 * `true` / `false` / `null` when the document does not carry enough to decide.
 *
 * A condition names a CONTAINER and a variable in it. Every container the shipped tree tests is
 * a `CONTAINER_SOURCE_TYPE_LOOSE_VARIABLES` one declared in this same document — its values are
 * right there — with a single exception noted at the call site.
 */
const evaluateCondition = (cond: MutatorCondition, containers: Map<string, CiMap>) => {
	const vars = containers.get(cond.container.toLowerCase())
	if (!vars) return null
	if (cond.kind === 'INPUT_CONTAINER_VALUE_EXISTS') return vars.has(cond.varName)
	if (cond.kind !== 'INPUT_CONTAINER_VALUE_EQUALS') return null
	const have = vars.get(cond.varName)
	if (have === undefined) return null
	return kvComparable(have) === kvComparable(cond.varValue)
}

/**
 * The declared value of every `CONTAINER_SOURCE_TYPE_LOOSE_VARIABLES` container, keyed by its
 * lowercased alias (`exposed_params`, `econ_instance`, `grunge_wear`). This is what a condition
 * reads. Containers sourced from a material or from the target — `paint`, `target`,
 * `target_instance`, `composite_inputs` — hold no values here and are deliberately absent, which
 * is what makes a condition against one report "cannot decide" rather than "false".
 */
const looseContainers = (declarations: string) => {
	const containers = new Map<string, CiMap>()
	const list = kvArray(declarations, 'm_vecCompositeInputContainers')
	if (!list) return containers
	for (const container of kvElements(list.body)) {
		const alias = container.match(/m_strAlias\s*=\s*"([^"]*)"/)?.[1]
		const vars = kvArray(container, 'm_vecLooseVariables')
		if (!alias || !vars) continue
		const values = containers.get(alias.toLowerCase()) ?? new CiMap()
		for (const variable of kvElements(vars.body)) {
			const name = variable.match(/m_strName\s*=\s*"([^"]*)"/)?.[1]
			if (!name) continue
			const value =
				variable.match(/m_bValueBoolean\s*=\s*([A-Za-z]+)/)?.[1] ??
				variable.match(/m_nValueIntX\s*=\s*(-?[0-9]+)/)?.[1] ??
				variable.match(/m_flValueFloatX\s*=\s*(-?[0-9.eE+-]+)/)?.[1] ??
				variable.match(/m_strTextureRuntimeResourcePath\s*=\s*resource_name:"([^"]*)"/)?.[1]
			if (value !== undefined) values.set(name, value)
		}
		containers.set(alias.toLowerCase(), values)
	}
	return containers
}

/**
 * Replay the document's property mutators over the recipe.
 *
 * A `COMP_MAT_PROPERTY_MUTATOR_SET_VALUE` carries a payload AND an `m_vecConditions` list, and
 * the game applies the payload ONLY when every condition holds. Reading the payload and dropping
 * the conditions — which is what splitting the file on `m_strName` did — bakes each conditional
 * feature in as a constant. Measured over the shipped tree that mis-stated TEN `F_` flags across
 * 303 kits, two of them on features the compositor keys off directly:
 *
 *   F_ROUGHNESS_PER_COLOR  set only when `g_bUseRoughnessByColor == 1`  — 46 kits claimed it,
 *                          and so ran the float4 at 0.6 where the game runs g_flPaintRoughness 0.3
 *   F_USE_ALL_MASKS        cleared only when `g_bUsePaintByNumberMasks == 0` — 37 kits claimed 0
 *
 * Almost every SET_VALUE lives inside a `GENERATE_TEXTURE`'s `m_vecTexGenInstructions` — those
 * are the features the COMPOSITE is compiled with, which is exactly what the viewer re-implements
 * — so the walk recurses into those and into `m_vecConditionalMutators`. The two texture-generation
 * passes (`g_tColor` and `g_tMetalness`) are flattened into one parameter set, as before: no flag
 * in the shipped tree is set to different values by the two passes.
 *
 * `targets` collects every name a SET_VALUE mentions, applied or not, so the caller can resolve a
 * SKIPPED one from the paint template — a skipped mutator leaves the property at whatever the
 * generate step initialised it to, and `m_strGenerateTexture_InitialContainer` is `paint` for all
 * 644 of them.
 */
const applyMutators = (recipe: Recipe, body: string, containers: Map<string, CiMap>, targets: Set<string>) => {
	for (const mutator of kvElements(body)) {
		const command = mutator.match(/m_nMutatorCommandType\s*=\s*"([^"]*)"/)?.[1] ?? ''
		if (command.endsWith('_GENERATE_TEXTURE')) {
			const nested = kvArray(mutator, 'm_vecTexGenInstructions')
			if (nested) applyMutators(recipe, nested.body, containers, targets)
			continue
		}
		if (command.endsWith('_CONDITIONAL_MUTATORS')) {
			const nested = kvArray(mutator, 'm_vecConditionalMutators')
			if (nested) applyMutators(recipe, nested.body, containers, targets)
			continue
		}
		if (!command.endsWith('_SET_VALUE')) continue

		const value = kvObject(mutator, 'm_nSetValue_Value')?.body
		const name = value?.match(/m_strName\s*=\s*"([^"]*)"/)?.[1]
		if (!value || !name || !/^(g_|F_)/i.test(name)) continue
		targets.add(name)

		const conditions = conditionsOf(mutator)
		let verdict: boolean | null = true
		for (const cond of conditions) {
			const held = evaluateCondition(cond, containers)
			// Undecidable beats false: one condition in the whole shipped tree reads
			// `composite_inputs.F_SEPARATE_CHANNEL_INPUTS`, and `composite_inputs` is an attribute of
			// the WEAPON being painted, not of the kit — no .vcompmat can settle it. Record the
			// condition instead of picking an answer. (It occurs only in _shared_paint_generic.vcompmat,
			// whose parameters are never copied across an include, so no kit is affected today.)
			if (held === null) verdict = null
			else if (verdict !== null && !(cond.pass ? held : !held)) verdict = false
		}
		if (verdict === null) {
			recipe.unresolved.set(
				name,
				conditions.map(c => `${c.container}.${c.varName} ${c.pass ? '==' : '!='} ${c.varValue}`).join(' && '),
			)
			continue
		}
		if (!verdict) continue

		const texture = value.match(/m_strTextureRuntimeResourcePath\s*=\s*resource_name:"([^"]*)"/)?.[1]
		if (texture !== undefined) {
			if (texture) recipe.textures.set(name, texture)
			continue
		}
		const boolean = value.match(/m_bValueBoolean\s*=\s*([A-Za-z]+)/)?.[1]
		const scalar =
			value.match(/m_nValueIntX\s*=\s*(-?[0-9]+)/)?.[1] ??
			value.match(/m_flValueFloatX\s*=\s*(-?[0-9.eE+-]+)/)?.[1] ??
			(boolean === undefined ? undefined : kvComparable(boolean))
		if (scalar !== undefined) recipe.params.set(name, scalar)
	}
}

/**
 * The newer .vcompmat, which is KV3 rather than the vmat's `"key" "value"` format. Reading it
 * with the vmat parser yields an empty recipe, and an empty recipe renders g_vColor0..3 as
 * (1,1,1,1) — a pure white weapon. That was 406 of 1481 kits.
 *
 * The recipe lives in m_vecLooseVariables entries shaped like:
 *
 *   { m_strName = "g_flPaintRoughness"
 *     m_nVariableType = "LOOSE_VARIABLE_TYPE_FLOAT1"
 *     m_flValueFloatX = 0.3 }
 *
 *   { m_strName = "g_tPattern"
 *     m_nVariableType = "LOOSE_VARIABLE_TYPE_RESOURCE_TEXTURE"
 *     m_strTextureRuntimeResourcePath = resource_name:"items/assets/paintkits/..._tga_5e17359d.vtex" }
 *
 * Note the `resource_name:` prefix before the quoted path. Values are emitted in the same string
 * shapes vmatRecipe produces, so the manifest writer and the web-side parser need no special
 * casing (vec2 -> "[x y 0.000000 0.000000]", booleans -> "1"/"0").
 */
const compMatRecipe = (path?: string, resolveInclude?: IncludeResolver, seen?: Set<string>) => {
	const recipe = new Recipe()
	if (!path || !existsSync(path)) return recipe
	let text: string
	try {
		text = readFileSync(path, 'utf8')
	} catch {
		return recipe
	}

	// What this document pulls its shared recipe from. Two spellings occur in the wild depending
	// on which Source2Viewer build decompiled the file — `resource_name:"…"` (310 files) and a
	// bare `"…"` (766) — so match the quoted path, not the annotation.
	const includes = text.match(/m_vecCompMatIncludes\s*=\s*\[([^\]]*)\]/)
	if (includes) recipe.includes = [...includes[1].matchAll(/"([^"]+\.vcompmat)"/gi)].map(m => m[1])

	// The ordered list of variables the seed randomises, verbatim. Order matters — it is the
	// PRNG draw order.
	const roll = text.match(/m_vecRandomRollInputVars_InputVarsToRoll\s*=\s*\[([^\]]*)\]/)
	if (roll) recipe.rollVars = [...roll[1].matchAll(/"([^"]+)"/g)].map(m => m[1])

	// The size of each render target the composite generates. Split on the mutator's own key rather
	// than matching across it, so a block that declared no resolution could never borrow the next
	// block's. Measured over the shipped tree: 322 files carry two blocks each (g_tColor and
	// g_tMetalness), every one at 4096, and the remaining 1076 carry none and inherit through the
	// single include below.
	for (const block of text.split(/m_strGenerateTexture_TargetParam\s*=\s*/).slice(1)) {
		const target = block.match(/^"([^"]+)"/)?.[1]
		const resolution = block.match(/m_nResolution\s*=\s*(\d+)/)?.[1]
		if (target && resolution) recipe.resolutions.set(target, resolution)
	}

	// A mutator's payload is shaped exactly like a container's declaration, so the split below
	// cannot tell them apart — it read the payload and threw the mutator's conditions away, which
	// is what baked every conditional feature flag in as a constant. Declarations are read from
	// the container half of the document only; the mutator half is replayed structurally after.
	// (`m_vecCompositeInputContainers` precedes `m_vecPropertyMutators` in all 1072 documents that
	// carry both, and no document carries two of either.)
	const mutators = kvArray(text, 'm_vecPropertyMutators')
	const declarations = mutators ? text.slice(0, mutators.start) : text

	for (const block of declarations.split(/m_strName\s*=\s*/)) {
		const name = block.match(/^"([^"]+)"/)?.[1]
		if (!name || !/^(g_|F_)/i.test(name)) continue

		// Only this variable's own body; 900 chars covers the longest entry (a texture, which
		// carries both the content path and the runtime path).
		const body = block.slice(0, 900)
		const capture = (re: RegExp) => body.match(re)?.[1]

		const texture = capture(/m_strTextureRuntimeResourcePath\s*=\s*resource_name:"([^"]*)"/)
		if (texture !== undefined) {
			if (texture) recipe.textures.set(name, texture)
			continue
		}

		// Declared roll range for this variable, when it is not degenerate. These ARE the
		// seed-roll ranges: CS:GO kept them in items_game as pattern_offset_x_start/end, CS2
		// removed those fields entirely and moved the data here.
		//
		// "Not degenerate" is a per-VARIABLE test, not a per-component one: a vec2 is emitted when
		// EITHER component rolls, and the pinned component rides along as min == max (which is what
		// `randomFloat(v, v)` already expects, and what the web side's own `degenerateRange` builds
		// for a variable with no range at all).
		//
		// Testing X alone dropped the whole range whenever X was pinned and Y rolled, and 22 of the
		// 1398 shipped .vcompmats are exactly that shape — every Doppler and Gamma Doppler phase
		// (418-421, 569-572, 618, 852-855, 1120-1123), aa_flames, am_dragon_glock, am_scales_bravo,
		// cu_tec9_sandstorm, sp_nukestripe_maroon_sg553; 123 weapon x paint items. Their
		// g_vPatternTexCoordOffset.y rolls over [0,1] (the Dopplers), [-1.47,-1.8], [0,0.5] or
		// [0.57,0.67], and with the range dropped `rollSeed` fell back to `degenerateRange` = the
		// AUTHORED value, which in all 22 equals the range's Y MINIMUM. So every Doppler in the
		// viewer sat at the bottom of its own offset range at every seed while the game slides the
		// phase artwork up the blade. Draw COUNT was never affected (the degenerate fallback still
		// consumes both draws), so nothing downstream desynchronised and the bug was Y-only.
		//
		// The 162 .vcompmats where BOTH components are pinned still emit nothing: their range and
		// the degenerate fallback are the same two numbers, and not emitting keeps the manifest
		// (and `param_ranges.length === 0`, which short-circuits kits that roll nothing) unchanged.
		const xMin = capture(/m_flValueFloatX_Min\s*=\s*(-?[0-9.eE+-]+)/)
		const xMax = capture(/m_flValueFloatX_Max\s*=\s*(-?[0-9.eE+-]+)/)
		if (xMin !== undefined && xMax !== undefined) {
			const yMin = capture(/m_flValueFloatY_Min\s*=\s*(-?[0-9.eE+-]+)/)
			const yMax = capture(/m_flValueFloatY_Max\s*=\s*(-?[0-9.eE+-]+)/)
			const both = yMin !== undefined && yMax !== undefined
			// A vec2 whose Y bounds are missing entirely must NOT be emitted as a bare X pair: the
			// consumer reuses range[0..1] for any component the string does not cover, so "x x" on a
			// two-component variable would pin Y to X's bounds instead of to its own authored value.
			// Only the scalar case (no Y declared at all) legitimately emits two numbers, and it is
			// emitted only when X itself rolls.
			if (both ? xMin !== xMax || yMin !== yMax : xMin !== xMax)
				recipe.ranges.set(name, both ? `${xMin} ${xMax} ${yMin} ${yMax}` : `${xMin} ${xMax}`)
		}

		const type = capture(/m_nVariableType\s*=\s*"LOOSE_VARIABLE_TYPE_([A-Z0-9_]+)"/) ?? ''
		const x = capture(/m_flValueFloatX\s*=\s*(-?[0-9.eE+-]+)/)
		const y = capture(/m_flValueFloatY\s*=\s*(-?[0-9.eE+-]+)/) ?? '0.0'
		const z = capture(/m_flValueFloatZ\s*=\s*(-?[0-9.eE+-]+)/) ?? '0.0'
		const w = capture(/m_flValueFloatW\s*=\s*(-?[0-9.eE+-]+)/) ?? '0.0'

		// Longest type prefixes first — FLOAT2/3/4 all start with FLOAT.
		if (type.startsWith('COLOR4')) {
			// Colours are 0-255 integer triples/quads: m_cValueColor4 = [ 58, 58, 103 ]. Emitted
			// normalised in the vmat's own string shape. THIS is where g_vColor0..3 live for
			// .vcompmat kits — skipping the type dropped all four and Earth Mandala rendered its
			// raw mask art instead of its palette.
			const parts = (capture(/m_cValueColor4\s*=\s*\[([^\]]*)\]/) ?? '')
				.split(',')
				.map(p => p.trim())
				.filter(p => /^-?[0-9.]+$/.test(p))
			if (parts.length >= 3) {
				const norm = (n: string) => (Number(n) / 255).toFixed(6)
				const alpha = parts.length >= 4 ? norm(parts[3]) : '1.000000'
				recipe.params.set(name, `[${norm(parts[0])} ${norm(parts[1])} ${norm(parts[2])} ${alpha}]`)
			}
		} else if (type.startsWith('FLOAT4')) {
			// g_vPaintDurability / g_vPaintRoughness / g_vPaintMetalness are per-colour float4s.
			if (x !== undefined) recipe.params.set(name, `[${x} ${y} ${z} ${w}]`)
		} else if (type.startsWith('FLOAT3')) {
			if (x !== undefined) recipe.params.set(name, `[${x} ${y} ${z} 0.000000]`)
		} else if (type.startsWith('FLOAT2')) {
			if (x !== undefined) recipe.params.set(name, `[${x} ${y} 0.000000 0.000000]`)
		} else if (type.startsWith('FLOAT')) {
			if (x !== undefined) recipe.params.set(name, x)
		} else if (type.startsWith('INTEGER')) {
			const int = capture(/m_nValueIntX\s*=\s*(-?[0-9]+)/)
			if (int !== undefined) recipe.params.set(name, int)
		} else if (type.startsWith('BOOLEAN')) {
			const bool = capture(/m_bValueBoolean\s*=\s*([A-Za-z]+)/)
			if (bool !== undefined) recipe.params.set(name, bool === 'true' ? '1' : '0')
		}
	}

	// Now replay the edits the game makes over those declarations, conditions and all. Runs last
	// because a SET_VALUE outranks the declaration it overwrites: no SET_VALUE in the shipped tree
	// is followed by a COPY_MATCHING_KEYS of a container that declares the same name, so "mutator
	// wins" needs no further ordering.
	if (mutators) applyMutators(recipe, mutators.body, looseContainers(declarations), recipe.mutatorTargets)

	if (resolveInclude) mergeIncludes(recipe, path, resolveInclude, seen ?? new Set())
	return recipe
}

/**
 * Fold an included .vcompmat's SEED-ROLL data into the including one.
 *
 * Most kits do not declare a roll list: they `m_vecCompMatIncludes` a shared document and add
 * only what differs from it. Every one of the 1398 shipped .vcompmats does exactly one of the
 * two — 322 declare their own list, the other 1076 include
 * `weapons/paints/legacy/_shared_paint_generic.vcompmat`, and none does both. Not following the
 * include left 1075 kits with `roll_vars: []`, so the web side fell back to a hardcoded
 * pattern-offset + pattern-rotation pair and their WEAR and GRUNGE transforms stayed at the
 * authored scale 1 / offset 0 / rotation 0 instead of the game's randomised ones.
 *
 * ONLY `ranges` and `rollVars` cross the include boundary. Deliberately not `params`, and not
 * `textures`:
 *
 *   - the shared document's mutator list carries `F_SEPARATE_CHANNEL_INPUTS = 1` and
 *     `F_ROUGHNESS_MODE = true` as CONDITIONAL set-values, not as the kit's own declarations.
 *     Copying them would switch those two features on for 1075 kits that never asked for them.
 *   - its `paint` container names `sp_negev_lionfish.vmat` as a placeholder. Copying that would
 *     hand every including kit the Negev's artwork.
 *
 * The rolled variables' base VALUES are not needed either: every one of the eight is in the roll
 * list, and `setPlacement` assigns the rolled result rather than displacing a base.
 *
 * Precedence is "the kit's own declaration wins", which is the conventional reading of an
 * include and the safe direction — but note it is UNTESTED BY THE DATA: no includer declares any
 * of the eight variables the shared document declares, and no includer declares a roll list of
 * its own, so no shipped kit exercises the conflict.
 */
const mergeIncludes = (recipe: Recipe, path: string, resolveInclude: IncludeResolver, seen: Set<string>) => {
	seen.add(path.toLowerCase())
	for (const target of recipe.includes) {
		const included = resolveInclude(target)
		// Cycle guard. Nothing shipped includes transitively today (the shared document includes
		// nothing), so this only has to stay honest, not fast.
		if (!included || seen.has(included.toLowerCase())) continue
		const base = compMatRecipe(included, resolveInclude, seen)
		for (const [name, range] of base.ranges.entries()) if (!recipe.ranges.has(name)) recipe.ranges.set(name, range)
		// Same precedence and same reason as the ranges: the shared document is where 1076 of the
		// 1398 kits get their composite resolution from, and not following the include is why the
		// renderer had to hardcode one. No includer declares a GENERATE_TEXTURE block of its own, so
		// as with the roll list this conflict is never exercised by shipped data.
		for (const [target, res] of base.resolutions.entries())
			if (!recipe.resolutions.has(target)) recipe.resolutions.set(target, res)
		if (!recipe.rollVars.length) recipe.rollVars = base.rollVars
	}
}

/**
 * Of everything a kit references, the one that is actually its artwork. Old-style kits point at
 * materials/.../customization/paints/<style>/<name>.vtex; newer ones at
 * items/assets/paintkits/.../<name>_albedo_texture_*.vtex. Everything else (defaults, shared
 * grunge/wear masks, sticker glitter) is a shared input, not the pattern. '/vmats/' is excluded
 * because the resource also embeds its own path, which contains 'paints/'.
 */
const selectPatternRef = (refs: string[]) =>
	refs.find(r => /items\/assets\/paintkits\/.+_albedo_texture/i.test(r)) ??
	refs.find(r => /customization\/paints\//i.test(r) && !/\/vmats\//i.test(r)) ??
	refs.find(r => /customization\/paints\//i.test(r)) ??
	refs.find(r => /items\/assets\/paintkits\//i.test(r)) ??
	null

// ---------------------------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------------------------

/**
 * WHAT STILL LEAVES OUR INFRASTRUCTURE — NOTHING.
 *
 * This table used to hold three entries and is deliberately EMPTY. It is kept, rather than deleted,
 * so that adding a URL back is a visible act with a comment to answer:
 *
 *   items_game.json  was `ByMykel/counter-strike-file-tracker`. Now parsed out of
 *                    `out/scripts/scripts/items/items_game.txt`, which the `scripts` job already
 *                    extracts. Verified 0 differences over all 33 sections against the file it
 *                    replaces.
 *   gloves.json      was `Nereziel/cs2-WeaponPaints`, whose 94 real rows pointed `image` at
 *                    `raw.githubusercontent.com` — every glove thumbnail in the product was served
 *                    out of a third party's repo, and 22 of those URLs 404 today. Now generated:
 *                    95 rows against 95, identical on every field, `image` on our CDN, 94/94 verified
 *                    200 there.
 *   skins.json       was `ByMykel/CSGO-API`. Now generated: 2,126 rows against 2,126, zero row
 *                    differences and zero field differences across all 18 shared fields.
 *
 * `generate-gamedata.ts` produces the seven `data/*.json` the API serves; this step produces the
 * `items_game.json` those seven and the manifest are built from. Two things the game files do not
 * contain are checked in beside the generator instead of downloaded — `phases.data.ts` (the Doppler
 * phase names) and `rare-pools.data.ts` (which knives and gloves each case can drop). Both are seeded
 * from the last downloaded copy, both are re-verified by `gamedata.test.ts`, and
 * neither is fetched at export time or at runtime.
 */
const DOWNLOADS: Record<string, string> = {}

/**
 * `items_game.json` is written FIRST and from our own export, because `buildManifest` below reads it
 * and so does `dump-attachments.ts`. It is the same parse `generate-gamedata.ts` performs — imported
 * rather than duplicated, so the two can never drift.
 */
const downloadMetadata = async (dataDir: string, allowCached: boolean) => {
	step('Generating + downloading metadata')
	mkdirSync(dataDir, { recursive: true })

	const { writeItemsGameJson } = await import('./generate-gamedata')
	const itemsGame = writeItemsGameJson(OUT)
	ok(`items_game.json  (${(Bun.file(itemsGame).size / 1024 / 1024).toFixed(1)} MB, parsed from items_game.txt)`)

	for (const [name, url] of Object.entries(DOWNLOADS)) {
		const dest = join(dataDir, name)
		if (allowCached && existsSync(dest)) {
			ok(`${name} (cached)`)
			continue
		}
		const res = await fetch(url)
		if (!res.ok) throw new UserError(`Downloading ${name} failed (HTTP ${res.status}) from ${url}`)
		const bytes = await res.arrayBuffer()
		await Bun.write(dest, bytes)
		warn(`${name}  (${(bytes.byteLength / 1024 / 1024).toFixed(1)} MB)  STILL THIRD-PARTY — see the note above`)
	}
}

/**
 * Texture filenames are source-asset names with content hashes (fade_psd_24407e73.png), not kit
 * names, so they cannot be matched to kits directly. Index every exported png across the texture
 * jobs into one basename -> relative-path map; the hash makes basenames unique game-wide, which
 * makes a flat map safe.
 */
const indexPatterns = () => {
	const byName = new Map<string, string>()
	for (const sub of ['weapontex', 'paintkits', 'defaults', 'templates', 'misc']) {
		for (const f of walkFiles(join(OUT, sub), n => hasExt(n, '.png'))) byName.set(baseKey(f), rel(f))
	}
	return byName
}

/**
 * The export jobs are PATH-driven: each names the VPK roots it believes kit textures live under.
 * Anything a kit references from a root nobody listed is silently dropped — the manifest still
 * records the reference, the slot just never gets a file, and the compositor substitutes a
 * constant. That is how MP5-SD Gold Leaf and Zeus Swamp DDPAT ended up with NO PATTERN AT ALL:
 * both bind g_tPattern to gloves/textiles/*.vtex, and no job covers gloves/.
 *
 * Measured over the shipped manifest, 176 references across 174 kits were dropped this way:
 *   164  workshop/paintkits/templates/   163 kits  (copper/brass patina ramps, template normals)
 *     6  weapons/models/<gun>/materials/   6 kits  (per-weapon roughness the kit overrides with)
 *     3  gloves/textiles/                  3 kits  (hye_gold_camo, hy_digicam_forest, soe_alpine_green)
 *     3  singletons                        3 kits  (materials/cs_italy/, a materials/-root tga, a pfm)
 *
 * Rather than add a job per root as each one is discovered, close the class: ask the kit
 * materials themselves what they reference and extract whatever is still missing. New roots in a
 * future CS2 update are then handled without touching this script.
 */
const sweepMissingRefs = async (cli: string | null, pak: string, patternByName: Map<string, string>) => {
	const missing: string[] = []
	const seen = new Set<string>()
	for (const matDir of ['paintmats', 'compmats']) {
		for (const f of walkFiles(join(OUT, matDir))) {
			for (const ref of resourceTextureRefs(f)) {
				if (patternByName.has(assetKey(fileNameOf(ref))) || seen.has(ref)) continue
				seen.add(ref)
				missing.push(ref)
			}
		}
	}
	if (!missing.length) return missing

	const miscDir = join(OUT, 'misc')
	if (cli) {
		step(`Reference sweep: ${missing.length} referenced textures no job exported`)
		mkdirSync(miscDir, { recursive: true })
		// -f takes a comma-separated filter list; batch so the command line stays sane.
		for (let i = 0; i < missing.length; i += 40) {
			const filter = missing.slice(i, i + 40).join(',')
			const r = await run([cli, '-i', pak, '-o', miscDir, '-e', 'vtex_c', '-f', filter, '-d', '--threads', THREADS])
			if (r.code) warn(`reference sweep: CLI exited ${r.code}`)
		}
	}
	// Without a CLI (--manifest-only on a machine with no toolchain), index whatever a previous
	// sweep already produced.
	const swept = walkFiles(miscDir, n => hasExt(n, '.png'))
	for (const f of swept) patternByName.set(baseKey(f), rel(f))
	if (cli) ok(`${swept.length} recovered`)
	return missing
}

/**
 * A .vcompmat never states F_PAINT_STYLE. It names the material the paint layer is instantiated
 * from — m_strSpecificContainerMaterial, e.g. workshop/paintkits/templates/cu_extended_template.vmat
 * — and THAT vmat carries the feature. Kits with their own .vmat report it directly; kits
 * described only by a .vcompmat were falling back to items_game's `style`, which is a DIFFERENT
 * taxonomy and disagrees with the shader on 37 kits.
 *
 * The two loudest were AK-47 Midnight Laminate (1218) and Wintergreen (1283): both instantiate
 * cu_extended_template (F_PAINT_STYLE 6, CustomPaint — "the pattern IS the albedo", which is why
 * they author no g_vColor at all), while items_game calls them style 2 and 5. Run as Hydrographic
 * the colour chain blends four defaulted whites and the AK renders pure white; run as
 * AnodizedMulti it renders bare.
 */
const resolveTemplates = () => {
	const byName = new Map<string, CiMap>()
	for (const f of walkFiles(join(OUT, 'templates'), n => hasExt(n, '.vmat', '.vmat_c'))) {
		const recipe = vmatRecipe(f)
		// "A template with no F_PAINT_STYLE is style 0" is only sound for a template that actually
		// PARSED. A raw-extracted template yields nothing at all, which would silently declare all
		// nineteen of them Solid and mis-style 310 kits. Require the shader line as proof the file
		// was readable; otherwise register no template and let the kit fall back to items_game.
		if (!recipe.params.get('shader')?.toLowerCase().startsWith('csgo_customweapon')) continue
		// No F_PAINT_STYLE line means 0 (Solid) — the shader default, and how so_* expresses it.
		if (!recipe.params.has('F_PAINT_STYLE')) recipe.params.set('F_PAINT_STYLE', '0')
		byName.set(assetKey(fileNameOf(f)), recipe.params)
	}
	return byName
}

/**
 * The paint container a .vcompmat instantiates. Only the SHARED workshop templates matter here —
 * the two documents that name a per-kit vmat instead (`sp_negev_lionfish`, `gs_m4a4_coalition`)
 * are legacy kits whose own .vmat supplies the recipe, so this never runs for them.
 *
 * Read off the raw bytes rather than the KV3 so it works on an undecompiled .vcompmat_c too.
 */
const compMatTemplate = (path: string | undefined, templates: Map<string, CiMap>) => {
	if (!path || !existsSync(path)) return undefined
	const m = readPrintable(path).match(/workshop\/paintkits\/templates\/([A-Za-z0-9_-]+)\.vmat/i)
	return m ? templates.get(m[1].toLowerCase()) : undefined
}

type ManifestEntry = {
	kit: string
	style: unknown
	wear_remap_min: unknown
	wear_remap_max: unknown
	wear_default: unknown
	legacy_model: boolean
	seed: unknown
	compmat: unknown
	vmat: string | null
	compmat_file: string | null
	pattern_ref: string | null
	pattern_file: string | null
	textures: Record<string, string>
	texture_ref_count: number
	shader_textures: Record<string, string>
	params: Record<string, string>
	/**
	 * Feature flags whose value depends on something no .vcompmat can settle: name -> the
	 * condition, verbatim. Empty on every shipped kit — see `applyMutators`.
	 */
	param_conditions: Record<string, string>
	param_ranges: Record<string, string>
	roll_vars: string[]
	/** `m_nResolution` per generated target — `{ g_tColor: 4096, g_tMetalness: 4096 }`. */
	composite_resolution: Record<string, string>
}

/** Valve writes booleans as the string "1" (and JSON-converted items_game as the number 1). */
const toBool = (v: unknown) => v === '1' || v === 1 || v === true

const buildManifest = async (cli: string | null, pak: string) => {
	const dataDir = join(OUT, 'data')
	const itemsGamePath = join(dataDir, 'items_game.json')
	if (!existsSync(itemsGamePath)) throw new UserError(`${itemsGamePath} is missing — run without --manifest-only once.`)
	const itemsGame = JSON.parse(readFileSync(itemsGamePath, 'utf8'))
	const paintKits: Record<string, Record<string, unknown>> | undefined = itemsGame?.items_game?.paint_kits
	if (!paintKits)
		throw new UserError('items_game.json has no items_game.paint_kits block — the upstream format changed.')

	step('Building manifest')
	const patternByName = indexPatterns()

	const indexMaterials = (dir: string, ...exts: string[]) => {
		const byKey = new Map<string, string>()
		for (const f of walkFiles(join(OUT, dir), n => hasExt(n, ...exts))) byKey.set(assetKey(fileNameOf(f)), f)
		return byKey
	}
	const vmatByName = indexMaterials('paintmats', '.vmat', '.vmat_c')
	const compByName = indexMaterials('compmats', '.vcompmat', '.vcompmat_c')
	/** `m_vecCompMatIncludes` names a content path; the compmat index is keyed by basename. */
	const resolveInclude: IncludeResolver = target => compByName.get(assetKey(fileNameOf(target)))

	const missingRefs = await sweepMissingRefs(cli, pak, patternByName)
	const templates = resolveTemplates()

	const manifest: [string, ManifestEntry][] = []
	let matched = 0
	let styleFromTemplate = 0
	let seededFromTemplate = 0

	for (const [index, kit] of Object.entries(paintKits)) {
		const kitName = kit.name
		if (!kitName || typeof kitName !== 'string') continue
		const key = kitName.toLowerCase()

		// A kit is described either by an old-style .vmat or a newer .vcompmat. Read whichever
		// exists; if both, the vcompmat wins for pattern selection via selectPatternRef.
		const vmatPath = vmatByName.get(key)
		const compRel = kit.composite_material_path
		const compPath =
			(typeof compRel === 'string' ? compByName.get(assetKey(fileNameOf(compRel))) : undefined) ?? compByName.get(key)

		let recipe = vmatRecipe(vmatPath)
		if (recipe.textures.size === 0 && compPath) {
			recipe = compMatRecipe(compPath, resolveInclude)
			// Only fall back to the vmat reader if this turns out not to be a KV3 document.
			if (recipe.params.size === 0 && recipe.textures.size === 0) recipe = vmatRecipe(compPath)
		}

		// Seed-roll data lives ONLY in the .vcompmat, and legacy kits have BOTH a .vmat and a
		// .vcompmat. Taking the vmat's textures above meant skipping the compmat entirely and
		// throwing the roll ranges away — AK Case Hardened came out with rotation 0..0 when its own
		// .vcompmat declares 0..360, so the pattern never rotated and the blue/gold landed in the
		// wrong places. Always read the compmat for ranges, whichever parser supplied the params.
		//
		// This is the path all 1075 including kits take — they are legacy kits, so they have a
		// .vmat and the reader above never touched their .vcompmat. `resolveInclude` is what makes
		// the shared roll list and the wear/grunge ranges reach them.
		if (compPath && recipe.ranges.size === 0) {
			const rollOnly = compMatRecipe(compPath, resolveInclude)
			for (const [k, v] of rollOnly.ranges.entries()) recipe.ranges.set(k, v)
			recipe.rollVars = rollOnly.rollVars
		}

		// The composite RESOLUTION lives only in the .vcompmat too, and reaches 1076 of the 1398 kits
		// through that same include, so it takes the same route: read it whenever this kit's own
		// recipe carries none, regardless of which parser supplied the params.
		if (compPath && recipe.resolutions.size === 0) {
			const declared = compMatRecipe(compPath, resolveInclude).resolutions
			for (const [k, v] of declared.entries()) recipe.resolutions.set(k, v)
		}

		const template = compPath ? compMatTemplate(compPath, templates) : undefined

		// A .vcompmat states no F_PAINT_STYLE; the paint template it instantiates does. Only fill
		// it in when the kit's own material did not already say — the vmat is closer to the kit.
		if (!recipe.params.has('F_PAINT_STYLE') && template?.has('F_PAINT_STYLE')) {
			recipe.params.set('F_PAINT_STYLE', template.get('F_PAINT_STYLE') as string)
			styleFromTemplate++
		}

		// The other half of evaluating a mutator's conditions. A SET_VALUE that does NOT fire is
		// not "no value" — the property keeps what the generate step initialised it to, and every
		// GENERATE_TEXTURE in the tree initialises from `paint`, i.e. this template. So the flags a
		// mutator names, but did not set, are resolved here rather than left to a default the
		// viewer would have to invent:
		//
		//   F_ROUGHNESS_TEXTURE      every template declares 1; the mutator clears it to 0 only
		//                            when `g_bUseRoughness == 0`  — 159 kits
		//   F_USE_ALL_MASKS          sp_* templates declare 1; cleared only when the kit turns
		//                            `g_bUsePaintByNumberMasks` off — 37 kits
		//   F_CASE_HARDENING_TRILINEAR  so_case_hardening_template declares 1 — 1 kit (1338)
		//   F_PATINA_AGE             aq_/gs_extended declare 1, but all four kits carrying it do
		//                            set g_bLegacyPatina, so the mutator fires and this never runs
		//
		// A name the template does not declare either (F_GLITTER, F_IRIDESCENCE,
		// F_ROUGHNESS_PER_COLOR under the extended templates) stays absent, which is the shader
		// default — the accurate answer, and the same one as before this ran.
		for (const name of recipe.mutatorTargets) {
			if (recipe.params.has(name) || recipe.textures.has(name)) continue
			const fallback = template?.get(name)
			if (fallback !== undefined) recipe.params.set(name, fallback)
		}

		// …and the INITIAL-VALUE half, which the loop above only reached for names a mutator happened
		// to mention. A FEATURE the paint container declares and NO mutator ever touches is not
		// absent: the container is the material the composite starts from, so the composite is
		// compiled with it. Reading nothing there and letting the viewer fall back to the vfx default
		// silently ran those kits on a different static combo from the game's.
		//
		// Restricted to `F_` deliberately. The F_ keys ARE the combo — each one selects a different
		// compiled program, so getting one wrong changes which arithmetic runs, and the set is small
		// and fully enumerable (19 templates, at most nine keys each). The g_ values a template
		// declares are the same class of truth but a far larger and more delicate surface, and the
		// consumer already carries each one's shader default explicitly; they are left alone.
		//
		// Counted over the shipped tree, this is 310 kits with a workshop paint template and exactly
		// four keys that reach any of them:
		//
		//   F_OVERRIDE_NORMAL = 1          41 kits (cu_/cu_extended). The one with teeth: the consumer
		//                                  reads it, and 26 of the 41 bind a real normal map, so those
		//                                  26 were adding the kit's relief to the weapon's where the
		//                                  game REPLACES it. Includes AK-47 | AUTOEXEC (1449).
		//   F_SEPARATE_CHANNEL_INPUTS = 1  27 kits. Inert here — it is a property of the WEAPON tree,
		//                                  which is where the viewer already takes it from.
		//   F_CASE_HARDENING = 1           24 kits. Inert — the consumer gates the patina on the
		//                                  g_tCaseHardeningColorRamp BINDING, and all 24 bind one.
		//   F_OVERLAY_MASK = 8             19 kits (cu_extended/gs_*). "Dedicated", which needs
		//                                  g_tOverlayMask; none binds one and 18 of the 19 have
		//                                  g_bUseOverlay = 0, so only 1450 can observe it at all.
		//
		// NOT a route to F_USE_ALL_MASKS on the 104 LEGACY spraypaint kits, which is the thing this
		// looks like it should fix and does not. Their `m_strSpecificContainerMaterial` is their OWN
		// vmat (verified verbatim on sp_spray.vcompmat), not workshop/paintkits/templates/sp_template
		// .vmat, and not one of the 1076 legacy paint vmats declares F_USE_ALL_MASKS. The game runs
		// the masks tail on the 37 kits that resolve it here, and on no others.
		for (const [name, value] of template?.entries() ?? []) {
			if (!/^F_/i.test(name) || recipe.params.has(name) || recipe.textures.has(name)) continue
			recipe.params.set(name, value)
			seededFromTemplate++
		}

		const refs: string[] = []
		const seenRef = new Set<string>()
		for (const r of [...recipe.textures.values(), ...resourceTextureRefs(compPath), ...resourceTextureRefs(vmatPath)]) {
			if (!/\.vtex$/i.test(r) || seenRef.has(r.toLowerCase())) continue
			seenRef.add(r.toLowerCase())
			refs.push(r)
		}

		// Map every reference onto an actually-exported png, so the frontend gets real file paths.
		const textures = new CiMap()
		for (const r of refs) {
			const hit = patternByName.get(assetKey(fileNameOf(r)))
			if (hit) textures.set(r, hit)
		}

		// g_tPattern is authoritative when the material decompiled; otherwise fall back to the
		// path heuristic used for raw-extracted binaries.
		const patternRef = recipe.textures.get('g_tPattern') || selectPatternRef(refs)
		const patternFile =
			(patternRef ? patternByName.get(assetKey(fileNameOf(patternRef))) : undefined) ?? patternByName.get(key) ?? null
		if (patternFile) matched++

		// Shader-parameter slot name -> exported file, e.g. g_tPattern / g_tWear / g_tGrunge.
		// This is what the compositing shader binds; `textures` above is keyed by source path.
		const shaderTextures = new CiMap()
		for (const [slot, ref] of recipe.textures.entries()) {
			const hit = patternByName.get(assetKey(fileNameOf(ref)))
			if (hit) shaderTextures.set(slot, hit)
		}

		manifest.push([
			index,
			{
				kit: kitName,
				style: kit.style ?? null,
				wear_remap_min: kit.wear_remap_min ?? null,
				wear_remap_max: kit.wear_remap_max ?? null,
				wear_default: kit.wear_default ?? null,
				legacy_model: toBool(kit.use_legacy_model),
				seed: kit.seed ?? null,
				compmat: compRel ?? null,
				vmat: vmatPath ? rel(vmatPath) : null,
				compmat_file: compPath ? rel(compPath) : null,
				pattern_ref: patternRef ?? null,
				pattern_file: patternFile,
				// Every texture the recipe references, mapped to its exported file. Newer kits carry
				// four (albedo / material_mask / normal_map / roughness); older ones point at the
				// pattern plus shared grunge + wear masks.
				textures: textures.toObject(),
				texture_ref_count: refs.length,
				shader_textures: shaderTextures.toObject(),
				// Scalar recipe values: F_PAINT_STYLE, g_vColor0..3, g_flPatternTexCoordScale,
				// g_flPaintRoughness, g_flWearAmount, ...
				params: recipe.params.toObject(),
				// A flag whose mutator carried a condition this export could not settle is published
				// as the condition, not as a guessed value. Nothing shipped lands here today.
				param_conditions: recipe.unresolved.toObject(),
				// Declared seed-roll ranges per variable ("min max", or "xmin xmax ymin ymax" for
				// vec2), and the ordered list of variables the seed randomises. Together they make
				// pattern placement exact and data-driven.
				param_ranges: recipe.ranges.toObject(),
				roll_vars: recipe.rollVars,
				// The render-target size the GAME composites this kit at, per generated texture. We
				// had hardcoded 2048 for everything; every shipped kit says 4096.
				composite_resolution: recipe.resolutions.toObject(),
			},
		])
	}

	writeLinkReport(dataDir, manifest, { patternByName, vmatByName, matched, missingRefs, styleFromTemplate })

	// GUARD: never overwrite a good manifest with an empty one. A targeted run (e.g. --only
	// scripts) has no texture output, so the linking step legitimately resolves nothing; writing
	// that out would replace a working manifest with zeros and break the frontend for every skin.
	const manifestPath = join(OUT, 'manifest.json')
	if (matched === 0 && existsSync(manifestPath)) {
		warn('manifest NOT written: this run resolved 0 patterns and a manifest already exists.')
		warn('Run a full export (or --manifest-only over a complete out/) to regenerate it.')
		return
	}

	// Serialised entry by entry rather than through one object literal: JSON.stringify reorders
	// integer-like keys, and the manifest is keyed by paint_index.
	const body = manifest
		.map(([index, entry]) => `  ${JSON.stringify(index)}: ${JSON.stringify(entry, null, 2).replaceAll('\n', '\n  ')}`)
		.join(',\n')
	writeFileSync(manifestPath, `{\n${body}\n}\n`)
	ok(`${manifest.length} kits, ${matched} matched to an exported pattern texture`)

	// Recipe coverage. A kit with no params renders with g_vColor0..3 defaulting to (1,1,1,1),
	// i.e. a pure white weapon. Report it explicitly so a regression is visible in the log
	// instead of on the website.
	const entries = manifest.map(([, e]) => e)
	const noParams = entries.filter(e => !Object.keys(e.params).length)
	const noTextures = entries.filter(e => !Object.keys(e.shader_textures).length).length
	ok(
		`recipe coverage: ${entries.length - noParams.length}/${entries.length} kits have params, ` +
			`${entries.length - noTextures} have shader textures`,
	)
	ok(
		`seed-roll coverage: ${entries.filter(e => e.roll_vars.length).length} kits with roll_vars, ` +
			`${entries.filter(e => Object.keys(e.param_ranges).length).length} with param_ranges`,
	)
	ok(`F_PAINT_STYLE resolved from a paint template: ${styleFromTemplate} kits`)
	ok(`F_ features seeded from a paint template: ${seededFromTemplate} (kit, flag) pairs`)
	// Composite resolution. Every shipped kit resolves to 4096 on both generated targets; anything
	// else in this histogram is either a CS2 update or a broken include walk, and both are worth
	// seeing in the log rather than silently rendering at the renderer's fallback.
	const resolutionHistogram = new Map<string, number>()
	for (const e of entries) {
		const seen = Object.entries(e.composite_resolution ?? {})
		const key = seen.length ? seen.map(([k, v]) => `${k}=${v}`).join(' ') : '(none)'
		resolutionHistogram.set(key, (resolutionHistogram.get(key) ?? 0) + 1)
	}
	ok(
		`composite resolution: ${[...resolutionHistogram.entries()]
			.sort((a, b) => b[1] - a[1])
			.map(([k, v]) => `${v} kits ${k}`)
			.join(', ')}`,
	)
	if (noParams.length) {
		warn(`${noParams.length} kits have NO params (these render as WHITE weapons)`)
		const withCompmat = noParams.filter(e => e.compmat_file).length
		if (withCompmat) warn(`  ${withCompmat} of them DO have a .vcompmat - the KV3 parser is not picking them up`)
		else ok('none of them have a .vcompmat, so there is no recipe to read - expected')
	}
	if (!matched) warn('No kit matched a pattern file - check the patterns export.')
}

/**
 * data/link-report.txt — the match rate plus sample basenames and the first unresolved kits, so a
 * bad link rate is diagnosable without another export.
 */
const writeLinkReport = (
	dataDir: string,
	manifest: [string, ManifestEntry][],
	stats: {
		patternByName: Map<string, string>
		vmatByName: Map<string, string>
		matched: number
		missingRefs: string[]
		styleFromTemplate: number
	},
) => {
	const lines: string[] = [
		`paint kits            : ${manifest.length}`,
		`exported pattern pngs : ${stats.patternByName.size}`,
		`exported paint vmats  : ${stats.vmatByName.size}`,
		`kits -> pattern file  : ${stats.matched}`,
		`refs no job exported  : ${stats.missingRefs.length} (recovered into misc/)`,
		`F_PAINT_STYLE from tpl: ${stats.styleFromTemplate}`,
		'',
		'--- first 40 paint vmat basenames (is this the kit-name convention?)',
		...[...stats.vmatByName.keys()].sort().slice(0, 40),
		'',
		'--- first 40 pattern png basenames',
		...[...stats.patternByName.keys()].sort().slice(0, 40),
		'',
		// Per-style match rate. A style at 0% means that finish's recipes are being read wrong,
		// which is invisible in a single overall percentage.
		'--- match rate by finish style (only styles whose textures were exported can score)',
	]

	const byStyle = new Map<string, { total: number; hit: number }>()
	for (const [, e] of manifest) {
		const style = String(e.style)
		const row = byStyle.get(style) ?? { total: 0, hit: 0 }
		row.total++
		if (e.pattern_file) row.hit++
		byStyle.set(style, row)
	}
	const styleOrder = (s: string) => Number(s.replace(/\D/g, '0'))
	for (const [style, { total, hit }] of [...byStyle].sort((a, b) => styleOrder(a[0]) - styleOrder(b[0]))) {
		const pct = String(Math.round((100 * hit) / Math.max(1, total))).padStart(3)
		lines.push(`   style ${style.padEnd(6)} ${String(hit).padStart(5)}/${String(total).padEnd(5)} (${pct}%)`)
	}

	// New-style kits carry four maps. Show the full resolved set for a few, so a partial link
	// (albedo found, normal missing) is visible instead of counting as success.
	lines.push('', '--- NEW-style kits (.vcompmat): full resolved texture set, first 6')
	const newKits = manifest.filter(([, e]) => e.compmat_file).slice(0, 6)
	if (!newKits.length) lines.push('   (none - no kit resolved to an exported .vcompmat)')
	for (const [index, e] of newKits) {
		lines.push(
			`   index ${index}  kit=${e.kit}  refs=${e.texture_ref_count}  resolved=${Object.keys(e.textures).length}`,
		)
		for (const [ref, file] of Object.entries(e.textures)) lines.push(`        ${ref}\n          -> ${file}`)
	}

	lines.push('', '--- 20 kits that DID resolve (proves the vmat -> pattern regex works)')
	for (const [index, e] of manifest.filter(([, e]) => e.pattern_file).slice(0, 20)) {
		lines.push(`  index ${index}  kit=${e.kit}  ref=${e.pattern_ref}  -> ${e.pattern_file}`)
	}
	lines.push('', '--- 20 kits that did NOT resolve to a pattern')
	for (const [index, e] of manifest.filter(([, e]) => !e.pattern_file).slice(0, 20)) {
		lines.push(
			`  index ${index}  kit=${e.kit}  style=${e.style}  vmat=${e.vmat}  ref=${e.pattern_ref}  compmat=${e.compmat}`,
		)
	}

	writeFileSync(join(dataDir, 'link-report.txt'), `${lines.join('\n')}\n`)
	ok(`diagnostics: ${rel(join(dataDir, 'link-report.txt'))}`)
}

/**
 * data/weapontex-index.json — the viewer's only way to find per-weapon inputs whose content-hash
 * filenames cannot be derived: the zone masks, the packed AO/cavity/no-paint map, and the
 * object-space POSITION maps.
 *
 * Position maps must be included even though they live outside weapontex/ and are .exr rather
 * than .png. Leaving them out means findWeaponPositionMap never resolves, and triplanar
 * projection falls back to UV sampling SILENTLY — which is 220 SprayPaint kits and 150
 * AnodizedAirbrushed kits (every Fade and Marble Fade) sampling from the wrong coordinates.
 */
const writeWeaponTexIndex = () => {
	// The roots live in asset-roots.ts because publish.ts --verify asserts the PUBLISHED index
	// still covers every one of them. That check is what makes the failure above loud: on
	// 2026-08-03 this function already walked the composite and position roots while the index on
	// the CDN did not, and nothing said so.
	const entries = WEAPONTEX_INDEX_ROOTS.flatMap(root =>
		walkFiles(join(OUT, root.dir), n => hasExt(n, ...root.exts)),
	).map(rel)
	if (!entries.length) return
	mkdirSync(join(OUT, 'data'), { recursive: true })
	writeFileSync(join(OUT, 'data', 'weapontex-index.json'), JSON.stringify(entries))
	ok(`weapontex-index.json (${entries.length} files, ${entries.filter(e => e.endsWith('.exr')).length} position maps)`)
}

/**
 * data/texture-reflectivity.json — every texture's AVERAGE COLOUR, straight off the .vtex header.
 *
 * `csgo_customglove.vfx` derives twenty 4x4 colour-adjust matrices — g_m{Damage,Substrate,
 * SubstrateBurnishing,Surface,SurfaceBurnishing}ColorAdjust1..4 — from `TextureAverageColor(slot)`,
 * the mean of the bound texture. A renderer that does not have that number either downsamples every
 * layer at load time (four substrates, four surfaces, four damage and four grime maps per glove) or
 * invents one, and inventing it desaturates or blows out the whole burnishing chain.
 *
 * Valve already computed it: the `Reflectivity` field in the VTEX header IS that average — linear
 * for RGB, raw for alpha. Reading it costs one header-only CLI pass per texture root (0.2 s for the
 * whole glove tree; the pass decodes no pixels), which is why this is emitted rather than left to
 * the renderer.
 *
 * Keyed by the source basename, lowercased and without its extension — `camo_wood_psd_2c9738f6` —
 * which is exactly the exported PNG's basename, so a consumer holding a path from
 * weapontex-index.json can look up its colour with no extra mapping. Content hashes make that key
 * unique across the whole game.
 *
 * `size` and `format` ride along because they cost nothing and answer the two questions that follow
 * immediately: whether a set of layers can share one sampler2DArray without resampling, and whether
 * the values above are sRGB-encoded (they are not — Reflectivity is always linear RGB).
 */
const REFLECTIVITY_FILE = 'texture-reflectivity.json'

type TextureFacts = { color: number[]; width: number; height: number; format: string }

const parseTextureFacts = (dump: string) => {
	const facts = new Map<string, TextureFacts>()
	// One record per "[3/137] path/name.vtex_c" header. Split rather than scan line by line: the
	// header order inside a record is not fixed (Format is printed AFTER Reflectivity), and a
	// texture whose header lacks a field must be dropped, not merged into its neighbour's.
	for (const chunk of dump.split(/^\[\d+\/\d+\]\s+/m).slice(1)) {
		const path = chunk.slice(0, chunk.indexOf('\n')).trim()
		const color = chunk.match(/Reflectivity\s*=\s*\(([^)]*)\)/)?.[1]
		if (!path.toLowerCase().endsWith('.vtex_c') || !color) continue
		facts.set(assetKey(fileNameOf(path)), {
			color: color.split(',').map(v => Number(v.trim())),
			width: Number(chunk.match(/Width\s*=\s*(\d+)/)?.[1] ?? 0),
			height: Number(chunk.match(/Height\s*=\s*(\d+)/)?.[1] ?? 0),
			// "20 (VTEX_FORMAT_BC7)" -> "BC7".
			format: chunk.match(/Format\s*=\s*\d+\s*\(VTEX_FORMAT_([A-Z0-9_]+)\)/)?.[1] ?? '',
		})
	}
	return facts
}

const writeTextureReflectivity = async (cli: string, jobs: Job[], archiveFor: (job: Job) => string) => {
	const wanted = jobs.filter(j => j.reflectivity && filterFor(j))
	if (!wanted.length) return
	step('Texture average colours (VTEX Reflectivity)')
	const dest = join(OUT, 'data', REFLECTIVITY_FILE)
	// Merged, never replaced: a staged run (--only glovetex) must not drop the roots it did not
	// re-export. A full run wipes OUT first, so there is nothing stale to merge with.
	const merged = readMergeableJson<TextureFacts>(dest, warn)
	for (const job of wanted) {
		const filter = filterFor(job) as string
		// No -o and no -d: this prints the header block and writes nothing. It is not an extraction.
		const r = await run([cli, '-i', archiveFor(job), '-e', job.ext, '-f', filter, '-b', 'DATA'], true)
		const facts = parseTextureFacts(r.out)
		for (const [key, value] of facts) merged[key] = value
		ok(`${job.name.padEnd(18)} ${String(facts.size).padStart(6)} textures${r.code ? `  (exit ${r.code})` : ''}`)
		if (!facts.size) warn(`${job.name}: no Reflectivity in the dump - the CLI's DATA block format changed.`)
	}
	mkdirSync(join(OUT, 'data'), { recursive: true })
	writeJsonAtomic(dest, merged)
	ok(`${REFLECTIVITY_FILE} (${Object.keys(merged).length} textures)`)
}

// ---------------------------------------------------------------------------------------------
// Shader inventory
//
// Index every compiled shader in EVERY archive under the install root, then export the finish
// compositor from whichever archive turns out to hold it. Retail CS2 does not ship
// csgo_customweapon at all — it comes with the (free) CS2 Workshop Tools DLC, and where that
// puts its archives is not something to guess at. So scan the whole tree and report what is there.
// ---------------------------------------------------------------------------------------------

const shaderInventory = async (cli: string, gameDir: string) => {
	step('Shader inventory')
	const installRoot = resolve(gameDir, '..')
	const archives = findArchives(installRoot)
	ok(`scanning ${archives.length} archive(s) under ${installRoot}`)

	const index: string[] = []
	const compositorHits: { archive: string; rel: string; filter: string }[] = []
	for (const archive of archives) {
		const names = await listEntries(cli, archive, 'vcs')
		if (!names.length) continue
		const relPath = archive.slice(installRoot.length + 1)
		ok(`${relPath} : ${names.length} shaders`)
		index.push(`### ${relPath}  (${names.length} shaders)`, ...names)

		// Surface anything weapon/paint related immediately.
		const related = names.filter(n => /weapon|paint|custom|econ/i.test(n))
		if (related.length) {
			ok(`  weapon/paint-related: ${related.length}`)
			for (const n of related.slice(0, 12)) console.log(`      ${n}`)
		}

		const compositor = names.filter(n => /customweapon/i.test(n))
		if (!compositor.length) continue
		ok(`  *** COMPOSITOR FOUND: ${compositor.length} file(s) in ${relPath}`)
		for (const n of compositor) console.log(`      ${n}`)
		// -f is a path PREFIX match, so a bare 'customweapon' filter would match nothing. Derive
		// the containing directory from the inventory hit.
		const dir = compositor[0].replace(/\\/g, '/').match(/^(.*\/)[^/]+$/)?.[1] ?? ''
		compositorHits.push({ archive, rel: relPath, filter: dir })
	}

	if (index.length) {
		mkdirSync(join(OUT, 'data'), { recursive: true })
		writeFileSync(join(OUT, 'data', 'shader-index.txt'), `${index.join('\n')}\n`)
		ok('wrote data/shader-index.txt')
	}

	if (!compositorHits.length) {
		warn('csgo_customweapon not present in any archive.')
		ok('Expected unless the CS2 Workshop Tools DLC is installed. Retail does not ship the')
		ok('compositor. Install via Steam: CS2 -> Properties -> DLC -> "Counter-Strike 2 Workshop')
		ok('Tools", then re-run --only shaders.')
		return
	}
	const target = join(OUT, 'shaders')
	mkdirSync(target, { recursive: true })
	for (const hit of compositorHits) {
		step(`Exporting compositor  [${hit.rel} :: ${hit.filter}]`)
		const cmd = [cli, '-i', hit.archive, '-o', target, '-e', 'vcs', '-d', '--threads', THREADS]
		if (hit.filter) cmd.push('-f', hit.filter)
		const r = await run(cmd)
		if (r.code) warn(`compositor export exit code ${r.code}`)
	}
	ok(`compositor: ${walkFiles(target, n => n.includes('customweapon')).length} file(s) in out/shaders/`)
}

/** --list: what the install actually exposes, before spending hours extracting from it. */
const listArchives = async (cli: string, gameDir: string) => {
	const archives = findArchives(gameDir)
	step(`Archives (${archives.length})`)
	for (const a of archives) {
		ok(`${a.slice(gameDir.length + 1).padEnd(44)} ${(statSync(a).size / 1024 / 1024).toFixed(1).padStart(8)} MB`)
	}
	step('Shader inventory')
	for (const a of archives) {
		const shaders = await listEntries(cli, a, 'vcs')
		if (!shaders.length) continue
		ok(`${a.slice(gameDir.length + 1)}: ${shaders.length} shaders`)
		for (const h of shaders.filter(s => /customweapon|csgo_weapon/.test(s))) console.log(`        ${h}`)
	}
}

/**
 * --discover: what each job's filter matches, and nothing else. RUN THIS FIRST after a CS2
 * update — it confirms the in-VPK paths before hours are spent extracting from them, and a job
 * reporting 0 matches is a path that moved.
 */
const discoverPaths = async (cli: string, jobs: Job[], archiveFor: (job: Job) => string) => {
	step(`Resolving in-VPK paths for ${jobs.length} job(s)`)
	let missing = 0
	let drifted = 0
	for (const job of jobs) {
		const filter = filterFor(job)
		if (!filter) {
			ok(`${job.name.padEnd(18)} (no sample - skipped)`)
			continue
		}
		const matches = await listEntries(cli, archiveFor(job), job.ext, filter)
		// `-f` takes a comma-separated OR-list, and `povclips` uses 113 exact paths as its selection.
		// A job like that fails PARTIALLY when CS2 renames one clip: the run still succeeds, the file
		// count is just quietly one lower. Report which entry stopped matching, or --discover is only
		// a check on jobs that have a single prefix.
		const parts = filter.split(',').filter(Boolean)
		const unmatched = parts.length > 1 ? parts.filter(p => !matches.some(m => m.startsWith(p))) : []
		ok(`${job.name.padEnd(18)} ${describeFilter(parts).padEnd(48)} ${String(matches.length).padStart(6)} matches`)
		for (const m of matches.slice(0, 6)) console.log(`        ${m}`)
		for (const u of unmatched) console.log(`        MATCHED NOTHING: ${u}`)
		if (!matches.length) missing++
		if (unmatched.length) drifted++
	}
	if (missing) warn(`${missing} job(s) matched nothing - their in-VPK path has moved and needs updating.`)
	if (drifted) warn(`${drifted} job(s) have filter entries that match nothing - listed above.`)
	if (!missing && !drifted) ok('every job resolved')
}

/** A filter is one prefix or 113 of them; the long ones are unreadable printed in full. */
const describeFilter = (parts: string[]) => (parts.length === 1 ? parts[0] : `${parts[0]} (+${parts.length - 1} more)`)

/**
 * --dump-shaders: the compositor's ACTUAL CODE, not just its interface. The CLI's shader handling
 * only reconstructs a .vfx — declarations, combos, render state, zero executable statements. The
 * arithmetic survives only in the VULKAN variant, whose SPIR-V goes through SPIRV-Cross. That API
 * is in the VRF library rather than the CLI, so ShaderDump/ wraps it.
 */
const dumpShaderSource = async (cli: string, gameDir: string) => {
	step('Dumping real shader source (SPIR-V -> GLSL)')
	let vulkan: string | undefined
	for (const a of findArchives(gameDir)) {
		if (!a.endsWith('shaders_vulkan_dir.vpk')) continue
		if ((await listEntries(cli, a, 'vcs')).some(s => s.includes('customweapon'))) {
			vulkan = a
			break
		}
	}
	if (!vulkan)
		throw new UserError('No shaders_vulkan_dir.vpk contains csgo_customweapon (needs the CS2 Workshop Tools DLC).')
	ok(`vulkan archive: ${vulkan.slice(gameDir.length + 1)}`)

	// Extract RAW - no -d, or we get the .vfx interface back instead of the bytecode.
	const raw = join(TOOLS, 'vcs-raw')
	mkdirSync(raw, { recursive: true })
	await run([cli, '-i', vulkan, '-o', raw, '-e', 'vcs', '-f', 'shaders/vfx/'])

	const glslOut = join(OUT, 'shader-src')
	mkdirSync(glslOut, { recursive: true })
	const dumpProj = join(HERE, 'ShaderDump', 'ShaderDump.csproj')
	const combos = value('combos') ?? '12'
	const dotnet = ['dotnet', 'run', '--project', dumpProj, '-c', 'Release', `-p:VrfPath=${vrfRoot()}`]
	for (const f of walkFiles(raw, n => /customweapon.*_ps\.vcs$/.test(n))) {
		ok(`decompiling ${fileNameOf(f)}`)
		const r = await run([...dotnet, '--', f, glslOut, combos])
		console.log(r.out.trim())
	}
}

// ---------------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------------

// ---------------------------------------------------------------------------------------------
// --incremental: re-extract only what the game changed
//
// THE DECOMPILER ALREADY IMPLEMENTS THIS, and correctly. `--vpk_cache` keeps a manifest of every
// entry's CRC32 — the value is in the VPK's own index, so reading it costs no decompression — and
// skips any entry whose CRC still matches. Measured on `compmatdata/`: run 1 writes 5 files, run 2
// prints `Skipped (unchanged)` 5 times; corrupt one recorded CRC and exactly that one entry is
// rewritten. A game patch changes the CRC, so "updated" and "missing" fall out of the same check
// and no timestamps or output hashing are involved.
//
// It also already closes the trap that makes a naive version of this WORSE THAN NO CACHE: the
// manifest's first line is `// s2v_version=<assembly version>`, and a mismatch discards the whole
// file with `Decompiler version changed, cached manifest will be ignored.` Verified by bumping the
// recorded version by hand — all 5 entries came back. Without that, upgrading VRF would silently
// keep outputs produced by the old decompiler, which is invisible rather than merely slow.
//
// SO THIS IS OPT-IN, AND GUARDED, RATHER THAN ON BY DEFAULT. Two things about `--vpk_cache` are not
// what an operator would assume, and both are recorded here because neither is discoverable:
//
// 1. THE MANIFEST IS WRITTEN NEXT TO THE VPK, i.e. INSIDE THE CS2 INSTALL — the path is hardcoded
//    as `<archive>.manifest.txt` with no flag to move it. On a Windows box with CS2 under
//    `C:\Program Files (x86)` that directory is not user-writable, and Steam's "verify integrity of
//    game files" deletes unknown files. Losing the manifest is harmless (the next run is a full
//    one), but crashing on an unwritable directory is not, so writability is checked up front.
//
// 2. IT CANNOT SEE THE glTF TEXTURE SIDECARS. Every `gltf` job gets `--gltf_export_materials`,
//    which resolves each model's textures and writes them as PNGs beside the GLB — but the manifest
//    only ever records the CRCs of entries matching `-e`, i.e. the `vmdl_c`/`vnmclip_c` files. A CS2
//    patch that retextures an agent without touching its model would leave the model skipped and
//    its 1.68 GB of sidecars stale. Those jobs therefore always run in full.
//
//    That is EIGHT jobs, not the four obvious model ones — `keychains`, `nametag`, `povclips` and
//    `stattrak` set `gltf` as well. Together they are ~4.5 GB of the ~55 GB total, so the cache
//    still covers about 92% of the bytes. `incremental.test.ts` asserts the list, because it was
//    wrong the first time it was written down.
// ---------------------------------------------------------------------------------------------

/**
 * Whether a job's outputs are fully described by the CRCs of the entries its own `-e` filter
 * matches. Keyed off `job.gltf` rather than a name list so a NEW gltf job is safe by default.
 */
const incrementalSafe = (job: Job) => !job.gltf

/** Say what `--incremental` decided, before it decides it. A silent cache is an untrustworthy one. */
const reportIncremental = (jobs: Job[], game: string) => {
	step('Incremental mode')
	const unsafe = jobs.filter(j => !incrementalSafe(j))
	ok(`${jobs.length - unsafe.length} of ${jobs.length} job(s) will skip entries whose source CRC is unchanged`)
	if (unsafe.length)
		warn(`always re-run in full (glTF texture sidecars are not CRC-tracked): ${unsafe.map(j => j.name).join(', ')}`)
	ok('the output folder is NOT wiped; pass --force to ignore the cache and re-export everything')
	// The manifest lives beside the archive, in the game install. Fail here rather than mid-export.
	const csgo = join(game, 'csgo')
	try {
		const probe = join(csgo, `.cs2-export-write-probe-${process.pid}`)
		writeFileSync(probe, '')
		rmSync(probe)
	} catch {
		throw new UserError(
			[
				`--incremental needs to write "<archive>.manifest.txt" beside each VPK, and ${csgo} is not writable.`,
				"That path is the decompiler's, not ours — there is no flag to move it.",
				'',
				'Either run with the privileges to write into the CS2 install, or drop --incremental.',
			].join('\n'),
		)
	}
	ok(`cache manifests are written into ${csgo} (Steam's "verify integrity" will delete them; harmless)`)
}

const main = async () => {
	/**
	 * THE AUTO-UPDATE, and it comes before the picker because the picker is part of what gets updated.
	 *
	 * It brings this checkout up to date with its upstream and then RE-EXECS, so the run that follows
	 * is the new code rather than the old code holding a new checkout. Returns null in every other
	 * case — including a failed fetch, which warns and carries on: exporting is the job, updating is a
	 * courtesy. `--no-update` / `CS2_EXPORT_NO_UPDATE` opt out, CI and non-TTY skip by default.
	 *
	 * `selfupdate.ts`'s header spells out exactly what a force-pull destroys and what it leaves alone
	 * (untracked and ignored paths, i.e. `out/` — there is no `git clean` and there must never be).
	 */
	const updated = await runSelfUpdate(import.meta.path, args, HERE)
	if (updated !== null) process.exit(updated)

	/**
	 * THE MENU, and it is the first thing in `main` for one reason: the CS2 lookup below THROWS
	 * when there is no install, and "no install" is precisely the state in which a newcomer most
	 * needs to be shown what their options are. So the menu runs first, reports the install as not
	 * found, and still offers the things that work without one.
	 *
	 * `shouldPrompt` is false for any argument, a non-TTY stdin, `CI=true` and `--yes`, so every
	 * scripted caller falls straight through. `runInteractive` re-execs this file — and `publish.ts`,
	 * and `generate-gamedata.ts` — with real flags; see `interactive.ts` for why that indirection is
	 * the point rather than a wart.
	 */
	if (interactiveNeedsTty(args))
		throw new UserError(
			[
				'--interactive needs a terminal, and stdin is not one (a pipe, a redirect, or a CI runner).',
				'',
				'Drop --interactive and pass the flags directly — the menu only ever produces these:',
				'  export.ts            --discover | --list | --manifest-only | --sample | --only <jobs> | --yes',
				'  generate-gamedata.ts [--dry-run | --compare]',
				'  publish.ts           --verify [--quick|--deep] | --upload [--prefix <p>] [--confirm]',
			].join('\n'),
		)
	if (shouldPrompt(args)) {
		const { runInteractive } = await import('./interactive')
		let cs2: string | Error
		try {
			cs2 = findCs2()
		} catch (err) {
			cs2 = err instanceof Error ? err : new Error(String(err))
		}
		const code = await runInteractive({ jobNames: JOBS.map(j => j.name), out: OUT, cs2, cli: CLI, here: HERE })
		LOG.close(code)
		process.exit(code)
	}

	const game = findCs2()
	step('Locating CS2')
	ok(game)
	const pak = join(game, 'csgo', 'pak01_dir.vpk')

	if (flag('list')) return await listArchives(await ensureCli(), game)
	if (flag('dump-shaders')) return await dumpShaderSource(await ensureCli(), game)

	// ---- job selection ----
	const only = value('only')
		?.split(',')
		.map(s => s.trim().toLowerCase())
		.filter(Boolean)
	const jobs = only ? JOBS.filter(j => only.includes(j.name)) : JOBS
	if (only && !jobs.length)
		throw new UserError(`--only matched no jobs. Valid names: ${JOBS.map(j => j.name).join(', ')}`)
	const archiveFor = (job: Job) => (job.vpk ? join(game, job.vpk) : pak)

	if (flag('discover')) return await discoverPaths(await ensureCli(), jobs, archiveFor)

	const manifestOnly = flag('manifest-only')
	if (manifestOnly && !existsSync(OUT)) throw new UserError(`--manifest-only needs an existing export at ${OUT}`)
	// --manifest-only reuses whatever is on disk, so it must work on a machine with no toolchain.
	const cli = manifestOnly && !cliUsable(CLI) ? null : await ensureCli()

	// `cli` is only ever null under --manifest-only, which skips extraction entirely.
	if (cli && !manifestOnly) {
		const incremental = flag('incremental') && !flag('force')
		if (incremental) reportIncremental(jobs, game)
		// A staged (--only) run must not delete the other stages' output; a full run replaces it.
		// --incremental never wipes: wiping is the opposite of the thing it is for.
		if (!only && !incremental && existsSync(OUT)) {
			step(`Clearing ${OUT}`)
			rmSync(OUT, { recursive: true, force: true })
		}
		step(`Exporting ${jobs.length} job(s)${SAMPLE ? ' (sample)' : ''}${incremental ? ' (incremental)' : ''}`)
		let totalSkipped = 0
		for (const job of jobs) {
			// Carried into any failure that happens below, so a crash names the job it happened in
			// rather than leaving the operator to count `ok` lines in a screenshot.
			currentLog().context({ job: job.name, archive: archiveFor(job) })
			const filter = filterFor(job)
			if (!filter) {
				warn(`${job.name.padEnd(16)} (no sample - skipped)`)
				continue
			}
			const target = join(OUT, job.dir)
			mkdirSync(target, { recursive: true })
			const cmd = [cli, '-i', archiveFor(job), '-o', target, '-e', job.ext, '-f', filter, '--threads', THREADS]
			if (incremental && incrementalSafe(job)) cmd.push('--vpk_cache')
			if (job.decompile !== false) cmd.push('-d')
			if (job.gltf) cmd.push('--gltf_export_format', 'glb', '--gltf_export_materials')
			// BOTH flags. `--gltf_animation_list` alone is inert — it only narrows what
			// `--gltf_export_animations` emits, and that switch is also what makes VRF write the joint
			// nodes and `skins` in the first place. See `Job.gltfAnimations`.
			if (job.gltfAnimations) cmd.push('--gltf_export_animations', '--gltf_animation_list', job.gltfAnimations)
			const t0 = Date.now()
			const r = await run(cmd, true)
			const files = countFiles(target)
			// Under --incremental the file COUNT does not move — the outputs are already there from the
			// last run — so the only visible evidence that the cache did anything is the decompiler's
			// own per-entry `Skipped (unchanged)` line. Counted and reported, because a cache nobody can
			// see is a cache nobody should trust.
			const skipped = incremental ? (r.out.match(/Skipped \(unchanged\)/g)?.length ?? 0) : 0
			ok(
				`${job.name.padEnd(18)} ${String(files).padStart(6)} files   ${((Date.now() - t0) / 1000).toFixed(1)}s` +
					`${skipped ? `   ${skipped} unchanged, skipped` : ''}${r.code ? `  (exit ${r.code})` : ''}`,
			)
			totalSkipped += skipped
			if (!files) warn(`${job.name} produced nothing - re-run with --discover to check its path.`)
		}
		currentLog().context({ job: undefined, archive: undefined })
		if (incremental)
			ok(
				totalSkipped
					? `incremental: ${totalSkipped} source entr${totalSkipped === 1 ? 'y was' : 'ies were'} unchanged and not re-extracted`
					: 'incremental: nothing was skipped — either the game changed, or this is the first cached run',
			)
		await writeTextureReflectivity(cli, jobs, archiveFor)
		await shaderInventory(cli, game)
	}

	await downloadMetadata(join(OUT, 'data'), manifestOnly)
	await buildManifest(cli, pak)
	writeWeaponTexIndex()

	step('Done')
	ok(`output: ${OUT}`)
	if (!flag('publish')) ok('Publish with: bun run publish.ts --upload --since --confirm --verify')
	await publishAndVerify()
}

/**
 * --publish / --verify hand off to publish.ts, so a CS2 update is one command: export, upload
 * only what changed, then prove the origin actually serves it. Uploading stays a dry run unless
 * --confirm is passed, here as well.
 */
const publishAndVerify = async () => {
	if (!flag('publish') && !flag('verify')) return
	const { upload, verify, resolveOrigin } = await import('./publish')
	const origin = resolveOrigin()
	if (flag('publish'))
		await upload({
			out: OUT,
			origin,
			confirm: flag('confirm'),
			since: !flag('all'),
			prefixes: value('prefix')
				?.split(',')
				.map(p => p.trim())
				.filter(Boolean),
		})
	if (flag('verify')) {
		const failures = await verify({ out: OUT, origin, quick: flag('quick'), deep: flag('deep') })
		if (failures.length) process.exit(1)
	}
}

/**
 * NOTHING ESCAPES, AND NOTHING RETHROWS.
 *
 * It used to rethrow anything that was not a `UserError`, which let bun print its own stack — a
 * fine outcome on a terminal that stays open, and the worst one on Windows, where the whole point of
 * `run.bat`'s trailing `pause` is that the exit code is non-zero *and reached*. `reportFatal` prints
 * the message, three frames, and the path of the log holding the rest, then this exits 1 so the
 * batch file pauses and the operator has something to send.
 */
try {
	await main()
	LOG.close(0)
} catch (err) {
	process.exit(reportFatal(err, LOG))
}
