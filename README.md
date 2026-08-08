# CS2 asset export

Pulls everything a 3D CS2 skin viewer needs out of a **local CS2 install** and writes it to one
upload-ready folder: models as GLB, every texture the paint kits reference, the decompiled material
recipes, Valve's own item schema, and a `manifest.json` mapping `paint_index -> { kit, style, wear
range, pattern, recipe }`. Then `publish.ts` pushes that folder to a CDN and proves the CDN serves it.

The finished skin images cannot be exported, because **the game does not contain them.** CS2 stores a
*pattern* texture plus a *recipe* per skin and composites the final look on the GPU every frame. This
exports the ingredients; a viewer composites them at runtime, which is what makes float/wear and
pattern seed real instead of faked.

Runs on **macOS, Windows and Linux** from one implementation — Bun covers all three, the platform is
detected and never passed in. Nothing is downloaded at export time: every byte comes from your own
CS2 install.

---

## Prerequisites

| | |
|---|---|
| **CS2, installed** | Auto-detected. Full export needs ~60 GB free for the output. |
| **[Bun](https://bun.sh)** ≥ 1.2 | The only runtime. `bun install` for the one dependency below. |
| **.NET 10 SDK** | Needed **once**, to build the decompiler. [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download) |
| **Source2Viewer CLI** | Built from [VRF](https://github.com/ValveResourceFormat/ValveResourceFormat) master into `.tools/` on first run and cached. **The released binaries cannot parse CS2's VCS 71 shaders** — it has to be master. |
| **Playwright** | Only for `export-inspect-env.ts` (see below). Declared in `package.json`; `bunx playwright install chromium` fetches the browser. |
| **git** | Optional. Only for the self-update (*Staying up to date*), which skips silently when git is missing or this is not a checkout. |

Where CS2 is looked for, in order, unless `--cs2` / `CS2_PATH` says otherwise:

| platform | search order |
|---|---|
| **Windows** | the `HKCU\Software\Valve\Steam` `SteamPath` registry value, then `%ProgramFiles(x86)%\Steam`, then `%USERPROFILE%\Steam` |
| **macOS** | `~/Library/Application Support/Steam`, then `/Applications/Counter-Strike Global Offensive` |
| **Linux** | `~/.steam/steam`, `~/.local/share/Steam`, the Flatpak data dir |

Every hit is then expanded through that Steam root's `steamapps/libraryfolders.vdf`, so CS2 on a
second drive (`D:\SteamLibrary`, an external volume) is found without configuration.

Everything is overridable, and none of it is pinned to a machine:

| flag | env var | default |
|---|---|---|
| `--cs2 <path>` | `CS2_PATH` | discovered. Accepts the install root, its `game/`, or `game/csgo` |
| `--out <path>` | `CS2_EXPORT_OUT` | `./out` (`./out-sample` under `--sample`) |
| `--cli <path>` | `SOURCE2VIEWER_CLI` | `./.tools/cli-build/Source2Viewer-CLI[.exe]` |
| `--tools <path>` | `CS2_EXPORT_TOOLS` | `./.tools` |
| `--threads <n>` | | CPUs − 2 |
| `--no-update` | `CS2_EXPORT_NO_UPDATE` | off — every run self-updates first. `--update` forces it in CI |
| | `CS2_EXPORT_UPDATE_TIMEOUT` | `20000` ms per git call |
| `--origin <url>` | `SKINS_CDN_ORIGIN` | **no default** — your CDN origin. Required by `publish.ts`; also the host baked into `generate-gamedata.ts`'s image URLs |

---

## Running it

**Run it with no arguments and it asks. You never need to type a command.** `bun run export.ts` on a
terminal opens a menu covering everything this repo can do:

| Menu entry | What it is |
|---|---|
| **Update after a CS2 patch…** | the routine job, as one option — see *Updating after a CS2 patch* below. Pre-selected whenever an export already exists |
| **Check my install** | resolves all 40 jobs' filters, extracts nothing. The right first run |
| **Export assets…** | full, sample, a grouped checklist of all 40 jobs, manifest rebuild, VPK list |
| **Regenerate the game data…** | the seven `data/*.json` lists — write, dry run, or compare with upstream |
| **Verify the CDN…** | read-only audit of the origin against your build; standard, quick or deep |
| **Upload to the CDN…** | dry run first *always*, then an explicit confirm. Narrow it to `data/` or type a prefix |
| **Where things are** | CS2 path, output folder, whether the decompiler is built, which credentials are set. Read-only |

It used to run a full export instead — hours, ~55 GB, and it deleted the output folder first with no
warning. The most natural invocation was the most destructive one. And everything except exporting
used to require a memorised command line, the worst of them being the one that publishes:

```
bun --env-file=.env run publish.ts --upload --prefix data --confirm
```

**The menu loads `.env` from this folder itself**, so credentials just work — it passes `--env-file`
to the publisher for you and you never type that flag. If a variable is missing it says which one, by
name, and that `.env` here is where it goes. It never prints a value, only whether one is set.

**A failure returns you to the menu**, with the exit code and the path to the log. It does not end the
session and it does not dump a stack trace.

The menu **never** appears where something might be waiting on it: any argument at all, `CI=true`, an
explicit `--yes`, or a non-TTY stdin (a pipe, a redirect, cron, CI) all skip it and behave exactly as
they did before. `--interactive` overrides those heuristics but **not** the terminal requirement — asked
for on a pipe it errors in one line rather than hanging, which is what it did before that guard existed.
Under the hood the menu re-execs `export.ts`, `generate-gamedata.ts` or `publish.ts` with real flags,
so the interactive path and the flag path are the same path by construction — and it prints the
equivalent command before running it, so you can paste that into a script instead of coming back.

### Every run writes a log

`logs/<timestamp>-<script>-<pid>.log`, appended **line by line as the run proceeds**, so at any instant
everything that has happened is already on disk: a `SIGKILL`, a Ctrl-C, or Windows closing the console
still leaves a usable file. The newest 10 are kept, the rest deleted.

It records the resolved command, the platform, the CS2 path, every job's outcome and timing, and on
failure the whole error with its stack, the job it was in, and **the full stderr of whatever subprocess
died** — the console truncates that at 800 characters and the cause is usually past it. The path is
printed prominently whenever a run fails, and by `run.bat` too: send that file, not a screenshot.

`logs/` is gitignored, for the same reason as `.env` — this repo is public and a log carries absolute
paths and machine details. Secrets are scrubbed by value before anything is written, but that is the
second line of defence, not the first.

**On Windows there is `run.bat`.** Double-click it, or call it with the same flags. It elevates through
UAC — needed only so `--incremental` can write its cache into the CS2 install — and `run.bat --no-admin`
skips that. See *Cross-platform* below; **it has not been run on Windows.**

**Every run updates itself first.** See *Staying up to date* below. `--no-update` turns it off.

Everything below is what the picker resolves to, and works unchanged. From this folder, identical on
every platform.

```bash
# 1. ALWAYS FIRST. Resolves all 40 jobs' in-VPK filters and extracts nothing. For the jobs whose
#    filter is a LIST (povclips names 113 exact clip paths, econicons 10 prefixes) it names any
#    single entry that stopped matching — a CS2 rename there costs you one file and no error
#    message otherwise. Ends with "every job resolved" when nothing has moved.
bun run export.ts --discover

# 2. Trial run: every job narrowed to one folder each (SAMPLE_FILTERS in export.ts). Exercises the
#    whole pipeline — extract -> manifest -> kit/pattern linking — writing to ./out-sample.
#    Budget several GB and tens of minutes, not "a few hundred MB".
bun run export.ts --sample

# 3. Full export. Hours, ~55 GB, and it WIPES the output folder first. --yes because a bare
#    `bun run export.ts` is the picker.
bun run export.ts --yes

# 3b. AFTER A CS2 PATCH, this is the one — see "Updating after a CS2 patch" below. Re-extracts only
#     what changed, rebuilds the game data, and publishes only the delta. Never wipes, and never
#     uploads without --confirm.
bun --env-file=.env run export.ts --sync

# 4. One stage at a time. Does NOT wipe the output folder, so it is safe against a full export.
bun run export.ts --only models,weapontex
bun run export.ts --only scripts,localization        # names from the Jobs table below

# 5. Rebuild manifest.json + data/weapontex-index.json + link-report.txt from the export already on
#    disk, re-extracting nothing. Seconds, and needs no .NET toolchain at all. This is how you
#    iterate on recipe parsing. Add --sample to target out-sample/.
bun run export.ts --manifest-only

# 6. Regenerate the seven data/*.json game-data lists on their own. A full export and `--sync` both
#    do this for you; run it directly to iterate on the generator, or after a CS2 update has
#    refreshed out/scripts/scripts/items/items_game.txt without a re-export. Never invokes the
#    exporter, so it can never delete out/. Set SKINS_CDN_ORIGIN first: it is baked into every
#    `image` URL these lists carry, and an unset one bakes in a placeholder host that resolves
#    rather than 404s.
bun run generate-gamedata.ts --icon-origin https://cdn.example.com
bun run generate-gamedata.ts --dry-run    # print the coverage report, write nothing
bun run generate-gamedata.ts --compare    # + diff every list against the community repos

# Inventory, no extraction:
bun run export.ts --list                  # every VPK the install exposes, + a shader inventory
```

### Staying up to date — every run pulls first, then restarts

```bash
bun run export.ts --discover              # fetches, resets onto the upstream, re-execs, then runs
bun run export.ts --no-update --discover  # do not touch the checkout
bun run export.ts --update --discover     # force the check in CI or on a pipe
```

This exists because the tool is cloned once and then run after every CS2 update, for years. Nobody
remembers to `git pull` first, so fixes shipped here did not reach the people running exports.

`selfupdate.ts` does `git fetch` + `git reset --hard <upstream>` and then **re-execs**, because the
running process loaded its modules from the pre-update files — pulling and carrying on in-process would
run the old logic against the new checkout, which is the whole thing it is meant to prevent. If the pull
moved `package.json` or `bun.lock` it runs `bun install` before restarting, so the updated code cannot
land on a missing dependency. It restarts **only** when HEAD actually moved; the ordinary
already-current run costs one `git fetch` and no second process.

**What it destroys, exactly:**

| | |
|---|---|
| **discarded** | local modifications to **tracked** files, and staged changes — this is the "force pull" that was asked for. Every one is **listed by name** before it happens: `discarding local changes to 3 tracked file(s): export.ts, …` |
| **untouched** | **untracked and ignored files.** `reset --hard` only writes paths that are in the target tree. `out/` (~56 GB) and `.tools/` (the built decompiler) are ignored and are not at risk. **There is no `git clean` and there must never be one** — `-x` would delete both, on every run, silently. A test asserts the string is absent from the source |
| **the one exception** | an untracked file whose path the **incoming commit starts tracking** — that path *is* in the target tree, so it is overwritten. Measured, and git says nothing when it happens; `git status` cannot see it coming either. It is detected separately and gets its own line: `OVERWRITING 1 untracked file(s) the update starts tracking: …` |
| **refused** | local **commits**. If the branch is ahead of its upstream it warns and does not reset: the request was about *uncommitted* files, and rewinding someone's unpushed commit is not a call a pre-flight step should make |
| **not done at all** | anything, when the upstream has nothing new. No update to load means no reason to discard work |

**When it skips**, each with one line of explanation and never an error — a failed update must never
block an export:

not a git checkout · no commits yet · no remote or no upstream · detached HEAD · local commits ·
`--no-update` / `CS2_EXPORT_NO_UPDATE` · `CI=true` · non-TTY stdin · fetch failed or timed out

The CI rule is the important one: a runner checks out an exact ref and asserts things about it, so
moving that ref underneath the job turns a red build into a mystery. `--update` is how a scheduled job
opts in anyway.

Every git call is bounded by `CS2_EXPORT_UPDATE_TIMEOUT` (20 s) and cannot prompt
(`GIT_TERMINAL_PROMPT=0`, `-c credential.helper=`, stdin never the caller's terminal) — a private remote
asking for a password, or an unreachable one, would otherwise hang the CLI before it did anything, which
is the same failure class as the `--interactive`-on-a-pipe hang. The timeout is enforced twice on
purpose: killing git does not close the pipes a transport helper inherited, which was measured taking
the full 5 s against a 1.2 s limit before an overall deadline was added.

`selfupdate.test.ts` runs all of this against real scratch repositories with a real bare-repo `origin`,
including both directions of the destructive question: a modified tracked file **is** discarded, and an
untracked file, an ignored file and an ignored `out/data/manifest.json` **are still there afterwards**.
The exception above was found by testing rather than by reading, which is the reason to test it.

### Updating after a CS2 patch — `--sync`

**This is the routine job, and it is one option.** CS2 patched, or a handful of files are missing from
the CDN: you do not want to re-export 56 GB and re-upload it, you want the difference. Pick
**Update after a CS2 patch…** in the menu — it is pre-selected once an export exists — or:

```bash
bun --env-file=.env run export.ts --sync            # dry run: nothing leaves this machine
bun --env-file=.env run export.ts --sync --confirm  # publish the delta, then verify the origin
bun run sync                                        # the same, .env auto-loaded from this folder
```

It is four existing things in order, and none of them is new machinery:

1. **Re-extract only what the game changed** — `--incremental` below. It never wipes the output folder.
2. **Regenerate the seven `data/*.json` lists**, which is what a CS2 patch actually changes most often.
3. **Work out what that changed on the CDN** — `publish.ts --upload --since`, a delta against
   `out/.publish-state.json` (or the bucket's own ETags). Uploading still needs `--confirm`.
4. **Verify** the origin really serves what was just published.

**If nothing changed it says so and stops**, in one line rather than forty skipped-job lines:

```
=== Update summary
    extracted     0 entries re-extracted, 61,204 unchanged and skipped (across 32 CRC-cached jobs)
    always full   8 glTF jobs re-ran in full regardless — their texture sidecars are not CRC-tracked
    game data     the seven data/*.json lists were regenerated from this export
    uploaded      0 files — the delta was empty

    Nothing changed. The game is unchanged since the last export and nothing has changed since the
    last publish — there is nothing to do.
```

Four things it is deliberately careful about, because a convenient option that overstates what it did
is worse than four commands:

- **It is never "fully" incremental.** Eight of the forty jobs re-extract every time whatever the game
  did (the reason is under `--incremental` below), ~4.5 GB of ~55 GB. The summary always says so.
- **"Nothing to extract" and "nothing to upload" are different questions.** The publish step runs even
  when the extraction changed nothing — that is exactly the shape of a previous publish that died
  half-way, and the summary reports it as *"the game is unchanged, but N files are not on the CDN"*.
- **A delta of zero is a claim about the last publish, not about the origin.** Only `--verify` speaks
  for the CDN itself, and the wording never pretends otherwise.
- **If the CRC cache cannot be written** — `C:\Program Files (x86)` without elevation — it says so in
  full and falls back to a complete extraction rather than quietly doing one. `run.bat` elevates for
  exactly this; on Windows that is the difference between an update taking minutes and taking hours.

In the menu the upload is a **separate, second confirmation**: the update step above uploads nothing,
prints the plan, and the confirm is unreachable if it failed (`syncUploadConfirmPlan` returns `null`,
pinned by `interactive.test.ts`). And when the delta is empty the confirm is not offered at all — being
asked "upload for real?" about zero files is how a question becomes noise.

`--sync` is not `--update`: that flag already means *force the exporter's own self-update check*, the
pair of `--no-update`.

### `--incremental` — re-extract only what the game changed

```bash
bun run export.ts --incremental                       # skip every entry whose source CRC is unchanged
bun run export.ts --only weapontex --incremental      # per job, same thing
bun run export.ts --incremental --force               # ignore the cache, re-export everything
```

**The decompiler already implements this, and correctly.** `--vpk_cache` keeps a manifest of every VPK
entry's CRC32 — the value is in the archive's own index, so reading it costs no decompression — and
skips any entry whose CRC still matches. A game patch changes the CRC, so "updated" and "missing" fall
out of the same check; no timestamps, no hashing of outputs. `--incremental` turns it on, guards it,
and reports what it decided (`5 unchanged, skipped` per job, plus a total). It **never wipes** the
output folder — wiping is the opposite of what it is for.

It also already closes the trap that would make a naive cache *worse than none*: the manifest's first
line is `// s2v_version=<version>`, and a mismatch discards the whole file
(`Decompiler version changed, cached manifest will be ignored.`). Without that, upgrading VRF would
silently keep outputs from the old decompiler — invisible, where a slow export is merely annoying.

Two things about it are not what you would assume, and neither is discoverable:

- **The manifest is written next to the VPK, i.e. inside your CS2 install** (`<archive>.manifest.txt`).
  The path is hardcoded in the decompiler; there is no flag to move it. Both modes probe that directory
  for writability first rather than crashing mid-export — which matters on Windows, where CS2 under
  `C:\Program Files (x86)` is not user-writable. `--incremental` **refuses**, because you asked for the
  cache by name; `--sync` says so in full and **falls back to a complete extraction**, because you
  asked for a current CDN and that still delivers one. Steam's *verify integrity of game files* deletes
  the manifest; that is harmless, the next run is just a full one.
- **The cache has never heard of your output folder.** It lives in the game install, so it survives
  deleting `out/`, pointing `--out` somewhere new, or a second checkout — and a run against an empty
  output folder would otherwise skip every entry and produce nothing at all, silently. So a job with no
  prior output never skips, whatever the cache says; the summary reports those as
  `N jobs had no output to be a cache of`. It cannot repair a *partly* deleted job — `--force` is the
  answer to that.
- **It cannot see the glTF texture sidecars.** The eight `gltf` jobs get `--gltf_export_materials`,
  which writes each model's textures as PNGs beside the GLB — but the manifest only records CRCs for
  entries matching `-e`, i.e. the models themselves. A patch that retextures an agent without touching
  its model would leave 1.68 GB of sidecars stale. **Those eight jobs therefore always run in full**
  (`models`, `models-gloves`, `models-agents-ct`, `models-agents-t`, `keychains`, `nametag`,
  `povclips`, `stattrak` — ~4.5 GB of the ~55 GB, so the cache still covers ~92% of the bytes).

`incremental.test.ts` proves the skip can fail as well as succeed, against the real decompiler on the
cheapest job: cold → 5 written; warm → 5 skipped; one recorded CRC corrupted → exactly that one
rewritten and the other four still skipped; recorded version bumped → all five rewritten. It restores
the install directory to whatever it found.

**Uploading is already incremental — do not build a second mechanism.** `publish.ts --upload --since`
compares against `out/.publish-state.json`, or failing that against the bucket's own listing (one
listing, ~73 requests for 73k objects, giving every object's size and ETag). R2 sets an object's ETag
to its MD5 for a single-part `PUT`; a multipart upload's ends in `-<parts>` and is not an MD5, so those
fall back to a size comparison. That is all documented in `publish.ts` itself.

Every run also tees its console output to a log beside the script (`discover-log.txt`,
`export-log.txt`, `sample-log.txt`, `manifest-log.txt`), so there is always a file to hand over.

**Not verified by the author of this README** (they need assets, hardware or credentials not on hand):
`bun run export.ts --yes` in full, `--dump-shaders` (needs the free CS2 Workshop Tools DLC, without
which `csgo_customweapon` is not in any `shaders_vulkan_dir.vpk`), `export-inspect-env.ts` (needs
`bunx playwright install chromium`), every `publish.ts` path that writes, and **`run.bat`, which needs
Windows**. Everything else in this file was run on macOS as written — including the self-update, which
was exercised end to end against a scratch clone with a local bare-repo `origin`: it discarded a tracked
edit, left an untracked file and an ignored `out/` alone, re-exec'd, and the restarted process ran code
that only existed in the newer commit. Windows has now had **one partial run** — enough to find a real
bug, not enough to call it supported; see *Cross-platform* below.

### The side generators — optional, and only if you are building a 3D viewer

**Not part of the 40-job export, and you can ignore all of them.** They exist because a handful of
things a 3D viewer needs are *not assets* and so cannot come out of the export at all: an attachment
point, a sticker's legal region, a glove's tint recipe. Each reads `out/` and/or the install and
writes one generated table into `out/data/`, beside the export's own data files. Copy what you want
from there.

They take the same `--cs2` / `CS2_PATH`, `--cli` / `SOURCE2VIEWER_CLI` and `--out` / `CS2_EXPORT_OUT`
overrides as `export.ts`, and they write **only** inside `--out`.

| script | writes into `out/data/` | notes |
|---|---|---|
| `generate-gamedata.ts` | `*.json` (7 lists + `items_game.json`) | The one to re-run after every CS2 update. The only one most people need |
| `extract-weapon-params.ts` | `weapon-composite-params.json`, `composite-substrate.json` | |
| `dump-attachments.ts` | `weaponAttachments.data.ts`, `keychainModels.data.ts` | `--only attachments` / `--only keychains`. VRF's glTF exporter drops `AttachmentList`, so these can only come from the decompiled `.vmdl` |
| `dump-sticker-slots.ts` | `stickerSlots.data.ts` | `StickerMarkup` does not survive decompilation; read from the **raw** `.vmdl_c` DATA block |
| `dump-glove-finish.ts` | `gloveFinish.data.ts` | The 94 glove finish recipes |
| `dump-sticker-index.ts` | `sticker-index.json` | sticker id → its textures and parameters, as a string table plus one numeric row per kit |

The four `dump-*` scripts emit **TypeScript source**, not data to fetch — small enough to read, and
resolvable with no extra runtime request. They are shaped for the viewer this was written for; a
different viewer will want the same facts in a different shape, and the generator is the part worth
reading in that case.

> Until 2026-08-08 those four wrote to a hard-coded path **two directories above the repo**
> (`../../apps/web-app/…`), which exists in no clone — so they silently produced nothing for anyone,
> the author included. They now have exactly one destination, `<out>/data/`, with no flag to aim them
> anywhere else.

### `export-inspect-env.ts` — a one-off, not part of the export

Produces an `environment.hdr` for image-based lighting, and is the only file that uses Playwright. It exports a
CS2 map's baked environment cubemap to a Radiance `.hdr` equirect, and it uses a headless browser
**purely as a BC6H texture decoder**: the compressed cube faces are handed to a real WebGL context via
`EXT_texture_compression_bptc`, drawn to an RGBA32F target and read back as floats. SwiftShader
provides that with no GPU. Correctness is self-checked — the decoded solid-angle mean RGB is printed
against the `.vtex` resource's own `reflectivity` field and they agree to <0.5%.

So: **the cubemaps are decodable.** An older note in this file claimed otherwise; it was wrong, and
`default_cube_pfm_*` was never the asset worth decoding anyway.

---

## What comes out

`out/` — 85,515 files, ~55 GB, gitignored. A fresh clone re-runs the export; the tree is never copied.
41 asset folders plus:

```
out/
  manifest.json     paint_index -> { kit, style, wear_remap_min/max, legacy_model, pattern_file,
                    pattern_ref, params, composite_resolution, roll_vars, param_ranges }
  data/
    items_game.json          Valve's own item schema, parsed from items_game.txt (6.5 MB)
    agents.json         81   ┐
    collectibles.json  715   │
    gloves.json         95   │ the SEVEN generated game-data lists — everything commonly
    keychains.json     143   │ fetched at runtime from two unmaintained community repos
    music.json         101   │
    skins.json        2126   │
    stickers.json    11788   ┘
    texture-reflectivity.json  per-texture average colour, straight off the VTEX header
    weapontex-index.json       filename -> path, for the trees the viewer must look up by name
    link-report.txt / shader-index.txt   diagnostics
```

The largest folders, measured: `paintkits` 8.7 G, `stickertex` 8.3 G, `stickermats` 7.3 G, `weapontex`
4.0 G, `position` / `legacycompmats` / `compinputs` 3.5 G each, `paintmats` 3.2 G, `weaponcompmats`
2.6 G, `models` 2.4 G, `weaponcomposite` 2.0 G, `models-agents` 1.8 G.

Every folder plus `manifest.json` and `data/` goes to the CDN verbatim. Every path inside
`manifest.json` is origin-relative, so the consumer side is one env var.

---

## Publishing

`publish.ts`. Speaks S3, so any S3-compatible bucket works — R2 is what it was written against, and
`R2_ENDPOINT` + `R2_FORCE_PATH_STYLE=1` retarget it anywhere else. Read-only checks need no
credentials and are always safe; **nothing is ever written without `--confirm`.**

**You do not have to type any of this.** `bun run export.ts` → *Verify the CDN…* / *Upload to the
CDN…* does all of it, loads `.env` for you, runs the dry run first and only then offers the confirm —
and the menu prints the equivalent command each time, which is where the ones below come from. Put
the credentials in a `.env` in this folder (it is gitignored); *Where things are* tells you which of
them are set without printing any value.

**`--origin` is required and has no default.** It names *your* public origin. Set it once:

```bash
export SKINS_CDN_ORIGIN=https://cdn.example.com   # or pass --origin <url> every time
```

There used to be a default here, and it was the author's own CDN. That is the wrong shape for a tool
other people run: `--verify` is read-only and therefore the first thing anyone tries, and against an
origin you do not own it does not fail — it prints a full, authoritative-looking audit of somebody
else's CDN against your local build. Every line of it is meaningless and none of it says so. It is
now a one-line error instead.

```bash
# safe, read-only, no credentials
bun run publish.ts --verify                 # audit your CDN; exits non-zero naming what is stale
bun run publish.ts --verify --quick         # control files + index coverage + a sampled subset
bun run publish.ts --upload                 # DRY RUN: prints the plan, writes nothing
bun run publish.ts --upload --prefix data   # dry run, one subtree
```

```bash
# WRITES. Needs R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME. Put them in
# a .env here and the menu passes it for you; on the command line say so yourself with --env-file.
bun --env-file=.env run publish.ts --upload --prefix data --confirm  # the game-data lists + manifest
bun --env-file=.env run publish.ts --upload --since --confirm        # the delta since the last publish
```

After a CS2 patch you usually want the export and this delta together, which is `--sync` — see
*Updating after a CS2 patch* above. It ends in exactly the second command here, plus `--verify`.

**Publish `data/` BEFORE deploying code that depends on it.** Anything reading those seven lists off
the CDN — an API, a viewer — will not fail loudly against a CDN still serving last month's
`skins.json`: a missing key reads `undefined` rather than throwing. The same is true in reverse for
`manifest.json`.

`--verify` exists because **a stale file is a 200.** It checks, in order: the control files
(`manifest.json`, `data/*.json`) by MD5 against the local build; that the published
`weapontex-index.json` has entries under every root the exporter walks, with matching counts (the
roots come from `asset-roots.ts`, which `export.ts` also walks, so they cannot drift); that every path
`manifest.json` references resolves at the right length; and the cache headers. `--deep` adds one
bucket listing and compares the whole build by ETag.

That last part is not theoretical. On 2026-08-03 the published `weapontex-index.json` predated the
exporter learning to walk the composite and position roots. Nothing 404'd and nothing threw — every
HD-mesh weapon just bound the legacy texture tree, `uHasPosition` was false everywhere, 370
fade-family kits projected through UVs instead of the position map, and knives resolved no zone masks
at all. It had been wrong for weeks.

Cache headers are set on every `PUT`, in three classes:

| class | header | why |
|---|---|---|
| `manifest.json`, `data/**` | `max-age=60, stale-while-revalidate=300` | same filename every export, so they must revalidate |
| `**/*.glb`, `models/**/physics_*.png` | `max-age=3600, stale-while-revalidate=86400` | **stable names too, and NOT content-hashed** |
| everything else | `max-age=31536000, immutable` | filenames are content-hashed — a changed texture is a changed name |

The middle row is easy to miss, and this README gave the wrong advice until 2026-08-08: it said
everything that was not a control file could be `immutable`. **0 of the 643 GLBs are
content-hashed**, so that would have pinned every visitor's copy of `weapon_rif_ak47.glb` for a
year — including any re-export or model fix — with no way to invalidate short of renaming the file.
`publish.ts` had the same bug, and it never fired only because nothing had been published to R2 yet.
`publish.test.ts` pins all three classes.

Objects your CDN served before this tooling existed keep whatever headers they were given; setting
these on the PUT only affects new uploads. **See [CDN.md](./CDN.md)** for what the edge in front of
the bucket has to be told, and for two traps that are not obvious on any CDN.

### Before your first `--confirm`

1. `SKINS_CDN_ORIGIN` / `--origin` points at the origin you mean. It is required, so you will not
   get this far without setting it — but setting it to the *wrong* thing is still possible.
2. `--verify` passes, or you know exactly which files it says are stale.
3. `R2_BUCKET_NAME` names the **assets** bucket. If it names a bucket holding objects but no
   `manifest.json`, the publisher refuses rather than pushing 55 GB into somebody else's bucket;
   `--new-bucket` overrides that for a genuinely fresh one. Worth checking twice if the credentials
   came from an `.env` you already had.
4. The dry run's plan is the size you expect — a delta, not the whole build.

As of 2026-08-07 the **write path has never been run against production.** It was developed against a
local S3 stand-in (`R2_ENDPOINT` + `R2_FORCE_PATH_STYLE=1` retargets it). `--verify` is the only part
that has been run live, and it is read-only HTTP.

---

## The two checked-in data tables

`phases.data.ts` (24 paint indices, 181 rows) and `rare-pools.data.ts` (20 pools, 678 entries) are
**source, not cache.** They are checked in because they cannot be derived — not because deriving them
would be slow.

- **`phases.data.ts` — Doppler phase names.** Black Pearl, Phase 1–4, Emerald, Ruby and Sapphire are
  not in CS2's localization. `csgo_english.txt` carries exactly two Doppler strings,
  `PaintKit_am_marbleized_Tag` → "Doppler" and `PaintKit_am_marbleized_g_Tag` → "Gamma Doppler". The
  phase is market convention keyed off the paint index. Lose it and every Doppler is
  named "Doppler" with no way to tell a Ruby from a Sapphire, and nothing errors.
- **`rare-pools.data.ts` — the ★ knife/glove case pools.** Which knives and gloves a case can drop is
  *referenced* by `items_game` and never shipped in it (182 dangling loot-list names). Losing one pool
  silently empties `crates` on up to 60 knife rows.

Both are cross-checked on every run — `assertPhaseTable` verifies the 24 indices against the kit names
actually in `items_game`, so a Valve renumbering fails loudly instead of mislabelling. Do not turn
either back into a download: **`DOWNLOADS` is `{}` and must stay empty.** The only network access
anywhere in this tool is the one-time VRF `master.zip` fetch when building the CLI, `publish.ts`'s
HTTP verify, and `generate-gamedata.ts --compare`, which is a diagnostic.

---

## Troubleshooting

**Start with the log.** `logs/` holds the newest 10 runs, one file each, written as the run proceeds.
The failing run's path is printed on screen, and by `run.bat`. It has the full error and stack, the
job that was running, and the entire stderr of any subprocess that died — which the console truncates
at 800 characters. Attach it to a bug report.

| symptom | cause | fix |
|---|---|---|
| a run died and there is nothing on screen to read | the console scrolled or the window closed | `logs/` — newest file. It is complete up to the instant the process stopped, even under `SIGKILL` |
| `R2_… not set` from `publish.ts` | the credentials are not in the environment of *that* process | put them in `.env` here and use the menu, or pass `--env-file=.env` yourself. Bun only auto-loads `.env` from the **current working directory** |
| `<path> is unreadable … an earlier run died mid-write` | a merge file truncated by an interrupted run | nothing — it says so and starts that file over |
| `<path> is empty — an earlier build was interrupted` | `dotnet publish` left a zero-byte `Source2Viewer-CLI` | nothing — it deletes it and rebuilds |
| `Could not find a CS2 install (no csgo/pak01_dir.vpk under any Steam library)` | CS2 on a drive Steam does not list, or a non-Steam install | `--cs2 "D:/SteamLibrary/steamapps/common/Counter-Strike Global Offensive"` |
| `No Source2Viewer CLI at …, and dotnet is not on PATH` | no .NET SDK | install the **.NET 10** SDK, or point `--cli` at a binary built from VRF **master** |
| `dotnet publish failed for the CLI` | .NET 9 or older | VRF targets `net10.0` |
| `… items_game.txt is missing — export the "scripts" job first` | an `--only` set that excluded `scripts`, or a fresh `--out` | add `scripts` to `--only` |
| `--manifest-only needs an existing export at …` | wrong `--out`, or nothing exported yet | check `--out` / `CS2_EXPORT_OUT` |
| `No kit matched a pattern file` | the `paintmats` / `paintkits` jobs did not run | see `data/link-report.txt`; re-run those jobs |
| `glTF animation filter matched no animations for: …` | **not an error.** Exit code is 0 and the skeleton is still written — which is the point for `weapon_arms.vmdl_c`, which embeds no clips | nothing |
| `no CDN origin — pass --origin or set SKINS_CDN_ORIGIN` | deliberate: there is no default origin, because a default would be somebody else's CDN | `export SKINS_CDN_ORIGIN=https://cdn.example.com`, or `--origin <url>` |
| `Executable not found in $PATH: "unzip"` | fixed 2026-08-08 — `Bun.spawn` threw before the `tar` fallback could run | `bun run export.ts --no-update` will NOT help; pull the fix, or install `unzip` |
| `unreachable … HTTP 403 after 4 attempts` during `--verify` | the edge rate-limited the sweep (measured on Cloudflare). **Not** a missing object — an object store answers those 404 | re-run, or `--concurrency 8` |
| `data/… STALE — CDN … vs local …` | the published control file is not the one this build produced | `bun run publish.ts --upload --prefix data --confirm` |
| `<root>/ 0 entries — root missing from the published index` | the published index predates an exporter change | `--manifest-only` to rebuild, then publish `data/` |
| `exceptions.txt` full of failures | it is the CLI's log and **appends across runs**, never truncated | delete it before a run for a clean signal. `default_cube_pfm_*` (HDR cubemaps) and `perlin_a_z000` (3D noise) always fail and nothing references them |
| `my local change to export.ts is gone` | the self-update discarded it — it names every file first | commit before running, or `--no-update`. `git reflog` recovers a commit; an uncommitted edit is gone |
| `main has N commit(s) origin/main does not, so it was NOT reset` | you have unpushed commits, so the update refused to rewind them | `git pull --rebase` yourself, or `git reset --hard @{upstream}` to take the remote's |
| `git fetch origin timed out … continuing with the code on disk` | offline, or the remote wants credentials it cannot ask for | nothing — the export ran anyway. `--no-update` to stop trying, or raise `CS2_EXPORT_UPDATE_TIMEOUT` |
| `skipping the update check (not a terminal…)` | stdout/stdin is a pipe, cron or CI. Deliberate: a runner's ref must not move underneath it | `--update` if a scheduled job really does want the latest |
| `no commits yet — nothing to update from` | a `git init` with no commit, or no upstream configured | `git push -u origin main` once; until then the check is a no-op |
| `run.bat` flashes and vanishes | it only pauses on failure; on success there is nothing to read | run it from a console, or check the exit code. `--no-pause` disables the pause entirely |
| `run.bat`: `Elevation was declined, so nothing ran` | the UAC prompt was answered No | `run.bat --no-admin` — only the CRC cache (`--incremental`, `--sync`) needs admin, and `--sync` falls back rather than failing |

---

## Jobs

Forty, declared once in `JOBS` in `export.ts` — the only place any of this exists. `--only` takes the
names in column 1. `filter` is the in-VPK path **prefix**; the CLI's `-f` takes a comma-separated
OR-list and **cannot express an exclusion**, which is why two jobs sometimes exist where one would look
tidier. `+n` means the filter is a list of n+1 entries.

| job | ext | filter | out |
|---|---|---|---|
| `models` | `vmdl_c` | `weapons/models/` | `models/` |
| `models-gloves` | `vmdl_c` | `agents/models/shared/arms/` | `models-gloves/` |
| `models-agents-ct` | `vmdl_c` | `agents/models/ctm_` | `models-agents/` |
| `models-agents-t` | `vmdl_c` | `agents/models/tm_` | `models-agents/` |
| `povclips` | `vnmclip_c` | `animation/anims/viewmodel/…` +112 | `povclips/` |
| `weapontex` | `vtex_c` | `materials/models/weapons/` | `weapontex/` |
| `knifetex` | `vtex_c` | `materials/models/weapons/v_models/knife_` | `knifetex/` |
| `knifecomposite` | `vtex_c` | `weapons/models/knife/` | `knifecomposite/` |
| `weaponcomposite` | `vtex_c` | `weapons/models/` | `weaponcomposite/` |
| `weaponcompmats` | `vmat_c` | `weapons/models/` | `weaponcompmats/` |
| `legacycompmats` | `vmat_c` | `materials/models/weapons/customization/` | `legacycompmats/` |
| `paintmats` | `vmat_c` | `materials/models/weapons/customization/paints/` | `paintmats/` |
| `compmats` | `vcompmat_c` | `weapons/paints/` | `compmats/` |
| `glovecompmats` | `vcompmat_c` | `gloves/paints/` | `glovecompmats/` |
| `glovemats` | `vmat_c` | `gloves/` | `glovemats/` |
| `glovetex` | `vtex_c` | `gloves/` | `glovetex/` |
| `glovemodeltex` | `vtex_c` | `characters/models/shared/arms/glove_` | `glovemodeltex/` |
| `glovemodelmats` | `vmat_c` | `characters/models/shared/arms/glove_` | `glovemodelmats/` |
| `glovepaintkitmats` | `vmat_c` | `items/assets/paintkits/volatile_02/` | `glovepaintkitmats/` |
| `paintkits` | `vtex_c` | `items/assets/paintkits/` | `paintkits/` |
| `defaults` | `vtex_c` | `materials/default/` | `defaults/` |
| `keychains` | `vmdl_c` | `weapons/keychains/` | `keychains/` |
| `keychainmats` | `vmat_c` | `weapons/keychains/` | `keychainmats/` |
| `keychaintex` | `vtex_c` | `items/assets/keychains/` | `keychaintex/` |
| `stickertex` | `vtex_c` | `stickers/` | `stickertex/` |
| `stickertex-assets` | `vtex_c` | `items/assets/stickers/` | `stickertex/` |
| `stickermats` | `vmat_c` | `stickers/` | `stickermats/` |
| `stattrak` | `vmdl_c` | `weapons/models/shared/stattrak/` | `stattrak/` |
| `nametag` | `vmdl_c` | `weapons/models/shared/nametag/` | `nametag/` |
| `compinputs` | `vtex_c` | `materials/models/weapons/customization/` | `compinputs/` |
| `position` | `vtex_c` | `materials/models/weapons/customization/` | `position/` |
| `templates` | `vmat_c` | `workshop/paintkits/templates/` | `templates/` |
| `skyboxtex` | `vtex_c` | `materials/skybox/` | `skyboxtex/` |
| `skyboxmats` | `vmat_c` | `materials/skybox/` | `skyboxmats/` |
| `scripts` | `txt` | `scripts/` | `scripts/` |
| `localization` | `txt` | `resource/csgo_english.txt` | `localization/` |
| `inventoryimagedata` | `vdata_c` | `items/inventory_image_data.vdata_c` | `inventoryimagedata/` |
| `compmatdata` | `vcompmat_c` | `compmatdata/` | `compmatdata/` |
| `econicons` | `vtex_c` | `panorama/images/econ/music_kits/` +9 | `econicons/` |
| `skinicons` | `vtex_c` | `panorama/images/econ/default_generated/` | `skinicons/` |

Two gotchas about `-f`: it matches a path **prefix**, not a substring (`-f glove` returns nothing);
and matching files of the right *extension* does not mean the right folder (`characters/models/`
yields 91 `vmdl_c` that are player bodies, not gloves), so jobs can require a keyword before a
candidate path is accepted.

`export-jobs.test.ts` holds this table to four invariants that fail silently if broken: one job per
tree, every job has a `--sample` filter, every sample filter is a subset of its job's, and the clip
names are the right ones.

### Where things live in the VPKs

Confirmed against a real install. The surprises are worth knowing before changing a filter.

| what | path | count | note |
|---|---|---|---|
| weapon + knife models | `weapons/models/` | 119 | **not** `models/weapons/`, which holds only inspect pedestals |
| pattern textures | `materials/models/weapons/customization/paints/` | 1161 | in style subfolders — and the style prefix does **not** predict the folder (`aa_ancient_brown`, an `anodized_air` kit, points into `hydrographic/`) |
| per-kit materials | `…/paints/vmats/` | 1076 | named by kit (`aa_fade.vmat_c`). **This is the kit → pattern link** |
| composite recipes | `weapons/paints/` | 1398 | `vcompmat_c`, `CCompositeMaterialEditorDoc`. Exposes `g_flWearAmount` and `g_nRandomSeed` as external inputs — the two values real float and real seed rendering need |
| glove models | `agents/models/shared/arms/` | 12 | **not** under any weapons prefix. A glove is an *agent* asset, which is why a viewer looking under `weapons/` finds no gloves at all |
| glove finishes | `gloves/paints/` | 99 | 73 point at `gloves/paints/<kit>.vmat`; the 26 under `volatile_02/` point at `items/assets/paintkits/volatile_02/` + `workshop/paintkits/templates/glove_compositor.vmat` |
| glove model inputs | `characters/models/shared/arms/glove_` | 105 `vtex_c` + 23 `vmat_c` | a DIFFERENT root from the models: `characters/`, not `agents/` |
| agent bodies | `agents/models/ctm_` + `tm_` | 35 + 45 | the two prefixes ARE the exclusion mechanism: `agents/models/` matches 92, i.e. these 80 plus the 12 gloves. Neither prefix can reach a folder called `shared` |
| first-person clips | `animation/anims/viewmodel/` | 642 | a clip is a standalone resource, not part of a model |
| display names | `resource/csgo_english.txt` | 1 | 4.8 MB. The `scripts` job filters `scripts/` and cannot reach it |
| inventory render rig | `items/inventory_image_data.vdata_c` | 1 | 390 `camera` blocks — per item prefab, how the shipped icons were framed and lit |

**Kit → pattern cannot be matched by name.** Pattern textures are named after their source asset plus
a content hash (`fade_psd_24407e73.png`), not after the kit (`aa_fade`). Each kit's `.vmat` references
its pattern by path, and that reference is the only link — which is why those files are exported and
why the manifest records `pattern_ref` (what the vmat points at) beside `pattern_file` (the PNG it
resolved to). `data/link-report.txt` reports the match rate and the first unresolved kits.

### Deliberately not exported

Measured against a real install and turned down. Recorded so nobody re-derives them.

| candidate | size | why not |
|---|---|---|
| sticker icons `panorama/images/econ/stickers/` | 22,872 / 4.36 GB | Best coverage anywhere, but two variants per kit and in the newest tournament folders *both* are 512×384 — so the "small" half is the larger one. `-f` cannot exclude a suffix, so taking it means shipping 1.9 GB of redundant variants |
| case / capsule art | 688 / 122.7 MB | Resolves cleanly and is cheap; only worth it if you list containers |
| collectible pedestals | 1,470 / 464.4 MB | Pins and coins do have models, keyed by `attributes["pedestal display model"]` (with spaces, which is why a naive scan reports zero). Only worth it if pins get a 3D view |
| patch materials `patches/` | 271 / 37.4 MB | Patches render **on agents**; pays off only once something puts one there |
| separate `agentmats`/`agenttex` | 1,575 / 1.50 GB | Pure duplication — `--gltf_export_materials` on the agent jobs already writes this tree |
| the other 29 languages | 155.2 MB | only `csgo_english.txt` is exported; add a second `localization` job if you need one |
| music-kit audio | 1,579 / 1.71 GB | `music.json` carries the ids; nothing here plays audio |
| tournament art | 643 / 144.1 MB | nothing referenced it |
| third-person clips `animation/anims/world/` | 1,144 | `idle_*` are single frames; the run/walk cycles are 8-directional blends that mean nothing outside the animgraph, which does not export |
| POV `draw`/`reload`/`shoot` | 642 clips / 95 MB | Need magazine-swap and shell handling before they look like anything |

Two flags are deliberately **off**: `--gltf_textures_adapt` (it splits the packed metallic map, and
consumers read metalness/roughness off the packed ORM the way `GLTFLoader` wires it) and
`--gltf_mesh_list` on the agent jobs (would drop `firstperson_sleeves`, which is real content now that
`povclips` exists, for a saving smaller than the `_physics.glb` files).

---

## Cross-platform

**Proven on macOS. Partially exercised on Windows. Reasoned, not proven, on Linux.** Everything below
was audited by reading and pinned with unit tests that feed Windows-shaped inputs to the
platform-sensitive helpers (`platform.test.ts`), which is the most that can be done from a Mac.

A first real Windows run happened on **2026-08-08** and found one bug that no amount of reading had
(`Bun.spawn` throwing rather than returning a code — see the table below). That is the value of the
exercise, and it is not finished: if you have a Windows box, run `--discover`, then
`--only compmatdata`, then `--incremental` twice, before trusting a full run, and please report what
breaks.

### `run.bat` — **written on macOS, never executed anywhere**

The Windows entry point. Double-click, or pass any `export.ts` flag. It is the one file here that cannot
be tested at all from this machine: there is no `cmd.exe` to run it under, so what follows is a design
statement, not a result. It was structurally audited (every `goto` target resolves, no `::` comment
inside a `( )` block, the PowerShell payload contains no inner double quote for `cmd` to re-split) and
that is the whole of the verification.

| | |
|---|---|
| **why admin** | only the CRC cache — `--incremental` and `--sync`: the decompiler writes its `--vpk_cache` manifest as `<archive>.manifest.txt` **beside the VPK it read**, i.e. inside the CS2 install, and `C:\Program Files (x86)` is not user-writable. The path is hardcoded in the decompiler — there is no flag to move it. `--sync` is the flag most people will type, so this is the difference between an update taking minutes and taking hours |
| **when it isn't needed** | everything else. `--discover`, `--list`, `--manifest-only`, `--sample` and a full export write only into this folder. CS2 on another drive (`D:\SteamLibrary`) needs no admin even for `--incremental` or `--sync`, and unelevated `--sync` degrades to a full extraction rather than refusing. Hence **`run.bat --no-admin`**, because a tool that demands elevation it does not need trains people to click through UAC without reading |
| **elevation probe** | `fltmc`, which requires admin and has no side effects. `net session` is the older trick and gives a false negative when the Server service is stopped |
| **arguments** | **no user argument ever goes on the relaunch command line.** batch → PowerShell → `cmd` each eat a different set of quotes, and `--cs2 "C:\Program Files (x86)\…"` is precisely the input that breaks the usual `-ArgumentList '%*'` one-liner. They are written to a gitignored sibling file that the elevated copy — which has to `cd` to `%~dp0` regardless — reads back. Only the literal `__elevated` and a numeric tag cross UAC |
| **loop breaker** | that same `__elevated` sentinel. The elevated copy jumps past the elevation check entirely, so even a wrong answer from the probe can prompt at most once |
| **`cd`** | `pushd "%~dp0"`, because an elevated shell starts in `system32` — and `pushd` also maps a UNC path to a drive letter, which elevated `cmd` otherwise cannot enter |
| **exit code** | propagated at every hop. Declined UAC → 1223 with a plain message. `WaitForExit`/`ExitCode` can be denied across the integrity boundary, so that case reports "cannot be read from here" rather than inventing a 0 |
| **the window** | pauses **only on failure**, and never under `--no-pause` / `CS2_EXPORT_NO_PAUSE`. An unconditional `pause` would hang a scheduled task — the same "blocks instead of erroring" trap the picker is guarded against |
| **line endings** | CRLF, pinned by `.gitattributes` (`*.bat text eol=crlf`). An LF-only batch file breaks `goto` and multi-line `if ( )` in ways that read as logic errors |

Known limits, stated rather than discovered later: an argument containing a literal `"` inside it will
not survive the re-quoting; and `run.bat` strips its own `--no-admin` / `--no-pause` before calling
`bun` — it must, because `export.ts` reads *any* argument as "skip the picker", so a forwarded flag
would turn a double-click into a full export that wipes `out\`.

**First thing to try on a Windows box:** `run.bat --no-admin --discover`. It extracts nothing.

What was actually wrong, and is fixed:

| | |
|---|---|
| `dump-sticker-slots.ts` | `split('/')` on a `join()`-built path — on Windows every one of the 119 models hit a `continue` and the slot table was written **empty** |
| `dump-attachments.ts` | the same split keyed the material map by absolute paths (no lookup could hit), and the **table keys** — the export-relative GLB paths the viewer matches on — came out as `models/weapons\models\…\x.glb` |
| `extract-weapon-params.ts` | the same split fed an anchored regex, so `weapon-composite-params.json` was written `{}` |
| `dump-sticker-slots.ts`, `dump-glove-finish.ts` | CS2 was undiscoverable: `process.env.HOME` (**unset on Windows**), one hardcoded `C:\Program Files (x86)` path, no `libraryfolders.vdf`, no registry, and no `--cs2` flag at all despite the error message advising one |
| `dump-sticker-slots.ts`, `dump-sticker-index.ts`, `dump-glove-finish.ts` | `dirname(new URL(import.meta.url).pathname)` yields `/C:/…` with a leading slash and `%20` for spaces on Windows. `import.meta.dir` is the portable form |
| `export.ts`'s `run()` | **found by running it on Windows, 2026-08-08.** `Bun.spawn` throws `ENOENT` from the CONSTRUCTOR when a binary is not on `PATH`, so `.exited` is never awaited and the exit code is never reached. Every `run(a).code === 0 \|\| run(b).code === 0` fallback in the file was therefore dead code. It surfaced as `error: Executable not found in $PATH: "unzip"` — one line above the `tar` fallback that is correct and never ran. `run()` now catches the spawn failure and returns **127**, the shell's own "command not found", so callers testing `code !== 0` behave as they read |

All of it is now one module, `platform.ts`, which `export.ts` already had right and the smaller
scripts each had wrong in their own way — plus the `run()` fix above, which is in `export.ts` itself.

**CRLF is not a problem, and this was checked rather than assumed.** The exported `items_game.txt` is
**already 100% CRLF with zero bare LF** (measured: 272,456 / 0) even on macOS, because the decompiler
writes it that way. The KeyValues parser has therefore always been parsing CRLF, and works because it
`.trim()`s every line before any regex sees it — `\r` is whitespace. `platform.test.ts` pins that with
an LF/CRLF equivalence assertion plus a bare-CR negative control, so a future "cleanup" that removes
the apparently-redundant `.trim()` fails loudly instead of on someone's next export.

Also checked and found already correct: no `sh -c`, pipes, backticks, `find`, `xargs` or `rm -rf`
anywhere; `chmod +x` guarded by platform; `unzip` with a `tar` (bsdtar, Windows 10+) fallback —
which was true of the *intent* and false of the behaviour until the `run()` fix above, since the
fallback could not be reached; the
`.exe` suffix on the CLI; `dotnet` spawned as an argv array. Prompts are `@clack/prompts`, which
degrades its box-drawing and checkboxes to ASCII when the terminal cannot do Unicode (it checks
`WT_SESSION`, so Windows Terminal gets the good glyphs and `cmd.exe` the readable fallback) — no raw
ANSI is written anywhere.

---

## Using the output from your own project

This repo imports nothing from anywhere and depends on no consumer. The contract in both directions
is one path:

* **Your build reads the export through `CS2_EXPORT_OUT`**, or through whatever you passed to
  `--out`. Nothing in here writes outside that directory — a test pins it (`platform.test.ts`).
* **Every path inside `manifest.json` is origin-relative**, so pointing your app at a CDN is one
  environment variable on your side. Nothing here needs to know the URL except `publish.ts`.

Upload `out/` verbatim, or copy the parts you use. The four side generators' tables land in
`out/data/` as ordinary files; copy them into your source tree from there.
