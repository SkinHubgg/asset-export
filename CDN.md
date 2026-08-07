# CDN.md — cache headers for the asset origin

**Infrastructure, not code.** `publish.ts` sets `Cache-Control` on every object it uploads, but an
object store is usually behind an edge, and the edge is what the browser actually talks to. This page
is about the edge.

Everything here was **measured against one real deployment** — an object store behind **Cloudflare** —
in August 2026. The *findings* generalise; the *dashboard paths* do not. Where something is
Cloudflare-specific it says so, and the measurement that produced it is shown so you can repeat it
against your own origin.

## TL;DR — three changes, in priority order

| # | change | why | urgency |
|---|---|---|---|
| 1 | `manifest.json` + `data/**` → `Cache-Control: public, max-age=60, stale-while-revalidate=300` | **correctness.** With no header at all, browsers guess a freshness window of ~10% of the file's age. A fresh export then does NOT reliably reach users — a consumer silently binds an old recipe to new textures. | **do this one even on a throwaway CDN** |
| 2 | make `.glb` / `.exr` / `.json` edge-cacheable | many CDNs cache only a default *extension list*, and these three are usually not on it. Every visitor then pulls a 3.26 MB model and a 0.53 MB EXR from the origin, forever. | when on the real CDN |
| 3 | short TTL (or bypass) for non-2xx | a 404 that inherits the zone's default `max-age` is **negatively cached** — a texture requested mid-publish stays broken for as long as that TTL | when on the real CDN |

**Retracted:** an earlier version of this note claimed ~108 MB of textures re-download every 4 hours.
It does not — see §0. The bandwidth problem was in the consumer's loader, not in the cache policy.

---

## 0. First, a correction to the premise

**Expired does not mean re-downloaded.** An origin that sends `Last-Modified` and honours
`If-Modified-Since` answers `304` with **zero bytes**, and the edge passes that through. Measured
2026-08-06:

```
$ curl -sI https://<your-origin>/models/weapons/models/ak47/ak47_color_psd_1f318532.png
HTTP/2 200
content-length: 6563582
last-modified: Thu, 06 Aug 2026 17:39:26 GMT
cache-control: max-age=14400
cf-cache-status: EXPIRED

$ curl -o /dev/null -w '%{http_code} %{size_download}\n' \
    -H 'If-Modified-Since: Thu, 06 Aug 2026 17:39:26 GMT' \
    https://<your-origin>/models/weapons/models/ak47/ak47_color_psd_1f318532.png
304 0
```

Same for the GLB: `304`, **0 bytes**. So an expiry costs conditional round trips and a few KB of
headers, not the file. `immutable` is worth a **round-trip storm**, not a bandwidth bill. Do it — but
§3 and §4 below matter more.

**Run those two commands against your own origin before doing anything else on this page.** They
take ten seconds and tell you which of the sections below apply to you.

---

## 1. Where the header comes from

On the deployment this was measured on, the header was **not** coming from the origin at all:

* The origin was a plain static file server. `http.FileServer` and its equivalents emit
  `Last-Modified` only — no `Cache-Control`, no `ETag`. That matched what `.glb`/`.json`/`.exr`
  actually returned: **no cache-control at all.**
* `max-age=14400` appeared **only on the CDN's default-cacheable extensions** (`.png` yes, `.glb`
  no). 14400 s is Cloudflare's default zone **Browser Cache TTL**.
* Decisive: a **404 on a `.png` path also carried `cache-control: max-age=14400`** (verified). A file
  server does not stamp a 19-byte `404 page not found` with a policy it never sets on 200s — the edge
  stamped it on the way out.

So: **find out whether your headers come from the origin or from the edge before changing either.**
The 404 probe above is the cheapest way to tell.

**If you are on Cloudflare**, the three knobs are:

| what | where |
|---|---|
| the default browser TTL | Caching → Configuration → **Browser Cache TTL** |
| `immutable` (not offered by Cache Rules) | Rules → **Transform Rules → Modify Response Header** → *Set static* `Cache-Control` |
| making `.glb`/`.exr`/`.json` edge-cacheable at all | Caching → **Cache Rules** → *Eligible for cache* (see §4) |

**Durable alternative, preferred on any CDN:** set the headers at the **origin** and switch the edge
to *respect existing headers*. That keeps the policy in code and survives a move between CDNs, which
a dashboard rule does not.

`publish.ts` already sets the right `Cache-Control` on every `PUT` (§2). **If your objects are served
straight out of the bucket, that is the whole job and you can stop reading after §2.** If there is an
edge in front that overrides or ignores them, the rest of this page is for you.

---

## 2. Per asset class

Measured content-hashing over a real export (`_<hash>.<ext>` filenames):

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

**This is the trap, and it is the one thing on this page you cannot undo.** `immutable` promises the
bytes at a URL will never change, so a browser holding one will not revalidate it for a year: no
request, no 304, no way to reach it. The weapon model is the second-largest single fetch (3.26 MB on
an AK-47, 7.12 MB on an M249) and it sits on a **stable filename**. A blanket "everything that isn't
`manifest.json` is immutable" rule pins every user's copy of `weapon_rif_ak47.glb` for a year —
including any re-export and any model fix — and no deploy, purge or re-upload can clear a browser
cache. Renaming the file is the only escape.

Not runtime-fetched, but a blanket rule would catch them anyway: `skinicons/`, `econicons/`,
`stickermats/`, `paintmats/`, `compmats/`, `legacycompmats/`, `weaponcompmats/`, `keychainmats/`,
`glove*mats/`, `templates/`, `shaders/`, `scripts/`, `localization/`.

> **Write the rule as an ALLOWLIST by root — never "everything else".** The safe list is 14 roots;
> everything not on it keeps a short TTL until someone has checked it.

### This was a live bug here, and it is fixed

`cacheControlFor` in `publish.ts` used to be:

```ts
export const cacheControlFor = (relPath: string) =>
	isControlFile(relPath) ? CACHE_CONTROL_CONTROL : CACHE_CONTROL_ASSET
```

with `isControlFile = relPath === 'manifest.json' || relPath.startsWith('data/')`. So **every one of
the 643 `.glb` files would have been published `public, max-age=31536000, immutable`** on the first
real upload. It was dormant only because nothing had been pushed to the object store yet.

Fixed 2026-08-08: `isStableNamedAsset` in `asset-roots.ts` is the third case, GLBs and
`models/**/physics_*.png` get `max-age=3600, stale-while-revalidate=86400`, and `publish.test.ts`
pins all three classes so it cannot regress. An hour with a day of `stale-while-revalidate` is
effectively as fast — the edge serves the stale copy instantly and refreshes behind it — while
leaving a door open to push a fix through.

---

## 3. A live correctness bug, and it is free to fix

`manifest.json` and `data/*.json` served with **no `cache-control` at all** make the browser apply
RFC 9111 **heuristic freshness** — roughly 10% of the `Last-Modified` age — and serve them from disk
cache with **no revalidation and zero network bytes**. Verified on a manifest that was 2 days old:
a silent-staleness window of **~4.8 h**, growing **~2.4 h for every further day** the export sits
unpublished.

Publishing a new export therefore does not reliably reach users. It is the same class of failure as
the 2026-08-03 stale-index incident (`asset-roots.ts:1-13`): nothing errors, a consumer just binds
last week's recipe against this week's textures.

**Fix:**

```
manifest.json, data/**   ->  Cache-Control: public, max-age=60, stale-while-revalidate=300
```

which is exactly `CACHE_CONTROL_CONTROL` in `publish.ts`. If your edge respects origin headers,
`publish.ts` already sends this and there is nothing to do.

**Related:** a 404 that inherits the zone's default `max-age` is **negatively cached** for that whole
window — on the measured deployment, 4 hours for a `.png`. A texture requested mid-publish stays
broken until it expires. Add a rule setting a short TTL, or bypass, for non-2xx.

---

## 4. The biggest infrastructure win: GLB, EXR and JSON are often never edge-cached

```
weapon_rif_ak47.glb   cf-cache-status: DYNAMIC
manifest.json         cf-cache-status: DYNAMIC
ak47_color_...png     cf-cache-status: EXPIRED   (i.e. it IS in the edge cache)
```

Cloudflare caches only its default extension list, and `.glb`/`.exr`/`.json` are not on it. Other
CDNs have the same shape of default. On a cold model load that is **1 × 3.26 MB GLB + 1 × 0.53 MB
EXR + 5 × JSON straight from the origin, for every visitor, forever.** PNGs go MISS→HIT normally.

**Check yours:** fetch a `.glb` and a `.png` from your origin and compare whatever cache-status
header your CDN sets. If the GLB never reports a hit, this section applies to you.

**Fix, on Cloudflare:** Caching → **Cache Rules** → match
`(http.request.uri.path.extension in {"glb" "exr" "json"})` → *Eligible for cache*, Edge TTL from
origin headers. With §3's `max-age=60` on the control files this is safe — the control files stay
fresh, the GLBs get edge-cached.

This is an **origin-egress** win, not a client one, but it is the largest single item on this page.

---

## 5. Also worth knowing

* **`manifest.json` compresses ~26×.** 6,953,574 B on disk, **264,718 B on the wire** — the edge
  gzips it. Worth knowing before optimising around "the ~7 MB manifest": waiting for it is cheap.
  Make sure your edge does compress `application/json`; that is where the 26× comes from.
* **No `ETag` from a plain file server.** `Last-Modified` alone is enough for the 304s in §0, but an
  `ETag` also survives a re-export that rewrites identical bytes with a new mtime — which is exactly
  what this pipeline does. Worth adding at the origin. Object stores generally set one for free,
  which is another reason to serve from the bucket rather than from a file server.
* **Check the consumer side too**, once the edge is right: cache-busting query strings, `no-store`
  fetch options, or a reverse-proxy rewrite that drops `If-Modified-Since` will each defeat all of
  the above. A rewrite must forward `If-Modified-Since` and pass `cache-control` and 304s through
  unchanged, or an edge-side fix never reaches the browser.

---

## 6. Suggested order

1. **§0** — measure. Two `curl`s. Everything below depends on what they say.
2. **§3** — `max-age=60, stale-while-revalidate=300` on `manifest.json` + `data/**`. Fixes a live
   correctness bug, costs nothing, no risk.
3. **§4** — make `.glb`/`.exr`/`.json` eligible for the edge cache. Largest infrastructure saving.
4. **§2** — `immutable, max-age=31536000` on the allowlisted texture roots. Saves round trips. Never
   on a `.glb`.
5. Short or bypass TTL for non-2xx responses.
