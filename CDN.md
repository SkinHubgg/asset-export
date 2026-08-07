# CDN.md — cache headers for the asset CDN

**Infrastructure, not code. Nothing in this repo sets these headers today.**

## TL;DR — three changes, in priority order

| # | change | why | urgency |
|---|---|---|---|
| 1 | `manifest.json` + `data/**` -> `Cache-Control: public, max-age=60, stale-while-revalidate=300` | **correctness.** With no header at all, browsers guess a freshness window of ~10% of the file's age. A fresh export then does NOT reliably reach users — the viewer silently binds an old recipe to new textures. | **do this one even on a temp CDN** |
| 2 | make `.glb` / `.exr` / `.json` edge-cacheable | Cloudflare only caches its default extension list, so every visitor pulls a 3.26 MB model and a 0.53 MB EXR straight from the origin, forever. | when on the real CDN |
| 3 | short TTL (or bypass) for non-2xx | a 404 on a `.png` inherits `max-age=14400`, so a texture requested mid-publish stays broken for **4 hours** | when on the real CDN |

**Retracted:** an earlier note claimed the ~108 MB of textures re-download every 4 hours. It does not —
the origin honours `If-Modified-Since` and returns `304` with **0 bytes**. The bandwidth problem was in
the loader and is fixed in code (the unused mesh variant is no longer fetched at all).

**While the CDN is temporary:** only #1 matters, and its symptom is testing-shaped rather than
user-shaped — after uploading a new export, hard-reload (Cmd+Shift+R) or check `manifest.json`'s
`last-modified` in devtools before concluding a change did not land.

---

## 0. First, a correction to the premise

**The ~108 MB does NOT re-download every 4 hours.** The origin sends `Last-Modified` and honours
`If-Modified-Since`, and the edge passes it through:

```
$ curl -sI https://cdn.skinhub.gg/models/weapons/models/ak47/ak47_color_psd_1f318532.png
HTTP/2 200
content-length: 6563582
last-modified: Thu, 06 Aug 2026 17:39:26 GMT
cache-control: max-age=14400
cf-cache-status: EXPIRED

$ curl -o /dev/null -w '%{http_code} %{size_download}\n' \
    -H 'If-Modified-Since: Thu, 06 Aug 2026 17:39:26 GMT' \
    https://cdn.skinhub.gg/models/weapons/models/ak47/ak47_color_psd_1f318532.png
304 0
```

Same for the GLB: `304`, **0 bytes**. So the 4-hour expiry costs ~25 conditional round trips and a
few KB of headers, not 108 MB. `immutable` is worth a **round-trip storm**, not a bandwidth bill.
Do it — but the bandwidth was in the loader, and that half is fixed in code.

Two things here matter **more** than `immutable`; they are §3 and §4.

---

## 1. Where the header comes from — Cloudflare, not this repo

* The origin is a Go file server behind Cloudflare. `http.FileServer` emits `Last-Modified` only —
  no `Cache-Control`, no `ETag`. That matches what `.glb`/`.json`/`.exr` actually return: **no
  cache-control at all.**
* `max-age=14400` appears **only on Cloudflare's default-cacheable extensions** (`.png` yes, `.glb`
  no), and 14400 s is Cloudflare's default zone **Browser Cache TTL**.
* Decisive: a **404 on a `.png` path also carries `cache-control: max-age=14400`** (verified). The
  file server is not stamping a 19-byte `404 page not found` with a cache policy it never sets on
  200s — the edge stamps it on the way out.

**Where to change it, zone `skinhub.gg`:**

| what | where |
|---|---|
| the `14400` | Caching → Configuration → **Browser Cache TTL** |
| `immutable` (not offered by Cache Rules) | Rules → **Transform Rules → Modify Response Header** → *Set static* `Cache-Control` |
| making `.glb`/`.exr`/`.json` edge-cacheable at all | Caching → **Cache Rules** → *Eligible for cache* (see §4) |

**Durable alternative, preferred:** set the headers at the **Go origin** and flip Browser Cache TTL
to **"Respect Existing Headers"**. That keeps the policy in code, and it survives the eventual move
to R2 — which the Transform Rule would not.

`tools/cs2-export/publish.ts:77-80` already encodes the right intent, but only as an S3
`CacheControl` on PUT into R2. **The live origin is not R2, so that code has never taken effect.**

---

## 2. Per asset class

Measured content-hashing over the committed export (`_<hash>.<ext>` filenames):

### SAFE for `public, max-age=31536000, immutable`

100% content-hashed **and** fetched at runtime:

| root | hashed / total |
|---|---|
| `weapontex/` | 1709 / 1720 |
| `defaults/` | 120 / 120 |
| `paintkits/` | 1254 / 1254 |
| `misc/` | 16 / 16 |
| `position/` | 1316 / 1316 |
| `compinputs/` | 1316 / 1316 |
| `glovetex/` | 136 / 136 |
| `glovemodeltex/` | 105 / 105 |
| `keychaintex/` | 110 / 110 |
| `knifetex/` | 71 / 71 |
| `knifecomposite/` | 81 / 81 |
| `weaponcomposite/` | 550 / 550 |
| `stickertex/` | 15414 / 15414 |
| `skyboxtex/` | 1 / 1 |

The 11 apparent exceptions in `weapontex/` are `_seqN_M` animation frames of a hashed base
(`compass_arrow_color_mks_107f39c2_seq0_7.png`) — still content-addressed.

### MUST NOT become immutable

| path | why |
|---|---|
| `manifest.json` | stable name, rewritten by every export |
| `data/**` | stable names (0 / 5 hashed) |
| **`**/*.glb`** | **0 of 643 are content-hashed** — `models/`, `models-gloves/`, `models-agents/`, `keychains/`, `stattrak/`, `nametag/`, `povclips/` |
| `models/**/physics_weapon*.png` | 103 files on stable names |
| `povclips/` | 0 / 113 hashed |

**This is the trap.** The weapon model is the second-largest single fetch (3.26 MB on an AK-47,
7.12 MB on an M249) and it sits on a **stable filename**. A blanket "everything that isn't
manifest.json is immutable" rule would pin every user's copy of `weapon_rif_ak47.glb` for a year —
including pinning the mesh-variant fix this workflow just shipped, and any future re-export.

Not runtime-fetched, but a blanket rule would catch them anyway: `skinicons/`, `econicons/`,
`stickermats/`, `paintmats/`, `compmats/`, `legacycompmats/`, `weaponcompmats/`, `keychainmats/`,
`glove*mats/`, `templates/`, `shaders/`, `scripts/`, `localization/`.

> **Write the rule as an ALLOWLIST by root — never "everything else".** The safe list is 14 roots;
> everything not on it keeps a short TTL until someone has checked it.

### Latent bug in this repo, fix before the R2 move

`tools/cs2-export/publish.ts:79`

```ts
export const cacheControlFor = (relPath: string) =>
	isControlFile(relPath) ? CACHE_CONTROL_CONTROL : CACHE_CONTROL_ASSET
```

with `isControlFile = relPath === 'manifest.json' || relPath.startsWith('data/')`
(`asset-roots.ts:41`). So **every one of the 643 `.glb` files would be published with
`public, max-age=31536000, immutable`.** `tools/cs2-export/README.md` (~line 245) gives the same
advice. Both need a third case for `*.glb` (and for `models/**/physics_*.png`). Dormant only because
the R2 path is not live — it fires the day the assets move.

---

## 3. A live correctness bug, and it is free to fix

`manifest.json` and `data/*.json` carry **no `cache-control` at all**, so the browser applies RFC
9111 **heuristic freshness** — roughly 10% of the `Last-Modified` age — and serves them from disk
cache with **no revalidation and zero network bytes**. Verified: the manifest is 2 days old right
now, giving a silent-staleness window of ~4.8 h that **grows ~2.4 h for every further day the export
sits unpublished**.

Publishing a new export therefore does not reliably reach users. This is the same class of failure as
the 2026-08-03 stale-index incident (`asset-roots.ts:1-13`): nothing errors, the viewer just binds
last week's recipe against this week's textures.

**Fix:**

```
manifest.json, data/**   ->  Cache-Control: public, max-age=60, stale-while-revalidate=300
```

which is exactly `CACHE_CONTROL_CONTROL` in `publish.ts:77`. The app's `useSWRImmutable` hooks are
already correct and will start behaving properly once this lands.

**Related:** a 404 on a `.png` path inherits `max-age=14400`, so a texture requested mid-publish is
**negatively cached for 4 hours**. Add a Cache Rule setting a short TTL (or bypass) for non-2xx.

---

## 4. The biggest infrastructure win: GLB, EXR and JSON are never edge-cached

```
weapon_rif_ak47.glb   cf-cache-status: DYNAMIC
manifest.json         cf-cache-status: DYNAMIC
ak47_color_...png     cf-cache-status: EXPIRED   (i.e. it IS in the edge cache)
```

Cloudflare only caches its default extension list, and `.glb`/`.exr`/`.json` are not on it. On a cold
modal load that is **1 × 3.26 MB GLB + 1 × 0.53 MB EXR + 5 × JSON straight from the self-hosted Go
box, for every visitor, forever.** PNGs go MISS→HIT normally.

**Fix:** Caching → **Cache Rules** → match
`(http.request.uri.path.extension in {"glb" "exr" "json"})` → *Eligible for cache*, Edge TTL from
origin headers (with §3's `max-age=60` on the control files this is safe — the control files stay
fresh, the GLBs get edge-cached).

This is an **origin-egress** win, not a client one, but it is the largest single thing on this page.

---

## 5. Also worth knowing

* **`manifest.json` is 264,718 bytes on the wire**, not 7 MB — it is 6,953,574 B on disk and the edge
  compresses it. The "~7 MB manifest" comments at `WeaponModel.tsx` and `useSkinManifest.ts:6`
  overstate it by 26×, which is why "wait for the manifest before choosing a mesh variant" is cheap.
* **No `ETag` anywhere.** `Last-Modified` alone is enough for the 304s above, but an `ETag` would
  survive a re-export that rewrites identical bytes with a new mtime — which is what the export
  pipeline does. Worth adding at the origin.
* The app's own fetches are clean: no cache-busting query strings (`lib/skins-cdn.ts` is a plain path
  join), no `cache:`/`no-store` overrides, and the `next.config.ts` `/skins-cdn` rewrite is
  transparent — it forwards `If-Modified-Since` and passes `cache-control` and 304s through
  unchanged, so an edge-side fix does reach the browser.

---

## 6. Suggested order

1. **§3** — `max-age=60, stale-while-revalidate=300` on `manifest.json` + `data/**`. Fixes a live
   correctness bug, costs nothing, no risk.
2. **§4** — make `.glb`/`.exr`/`.json` eligible for the edge cache. Largest infrastructure saving.
3. **§2** — `immutable, max-age=31536000` on the 14 allowlisted texture roots. Saves round trips.
4. Short/bypass TTL for non-2xx responses.
5. Fix `publish.ts:79` + `README.md` before anything moves to R2.
