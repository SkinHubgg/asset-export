# sim/ — offline numeric checks on the pattern-seed maths

One script: `bluegem.py`. It is a **recorded negative result**, kept so nobody re-derives it.

> **`composite.py` does not exist and never did.** An earlier version of this file documented it in
> detail — an invocation, and reference brightness/erosion numbers — but the file was never committed
> and is absent from the whole pre-split history, which only ever contained this README and
> `bluegem.py`. Those instructions were for a tool nobody could run. See *The composite simulator*
> below for the numbers it once reported, kept as data, and for why recreating it **here** would be
> the wrong move.

---

## `bluegem.py` — NEGATIVE RESULT, kept deliberately

Tries to validate the seed → placement pipeline against published blue-gem rankings (seed 661 is
AK-47 Case Hardened Blue Gem #1), by scoring how blue each seed's pattern comes out over the AK's
actually-painted texels.

```bash
# 1. the two textures it reads (see "Inputs" below) — ~4 GB, tens of minutes
bun run export.ts --only weapontex

# 2. Pillow is the only dependency, and it is not declared anywhere else in this repo
python3 -m pip install Pillow

# 3. from the repo root, not from sim/
python3 sim/bluegem.py
```

Output, reproduced on 2026-08-08 exactly as first recorded:

```
offset_then_rot    n= 37  rank(661)= 19  median rank of the 10 known blue gems =  19
rot_then_offset    n= 37  rank(661)=  4  median rank of the 10 known blue gems =  23
offset_no_rot      n= 37  rank(661)= 26  median rank of the 10 known blue gems =  16
```

`offset_then_rot` is what ships. Chance is ~19 out of 37. **No draw order reproduces the rankings, so
this test cannot validate placement and no ordering change should be made on its evidence.**
`rot_then_offset` flatters 661 (rank 4) while scoring *worse* across the other nine gems (median 23) —
that is noise, and it is exactly the shape of result that gets mistaken for a finding.

Why it fails: blue-gem rankings describe the visible **receiver and magazine**, whereas this measures
every painted texel in UV space equally, including interior and hidden faces.

To actually settle placement, one of:

1. a reference composite bake to diff against numerically, or
2. restricting the measurement to the receiver's UV island (needs per-triangle UVs from the GLB,
   filtered by object-space position).

### Inputs

Two PNGs, **hardcoded near the top of the script**, both of which the `weapontex` job produces:

| what | path under `out/weapontex/` |
|---|---|
| Case Hardened pattern | `materials/models/weapons/customization/paints/antiqued/oiled_psd_9f35e709.png` |
| AK-47 paint mask | `materials/models/weapons/customization/rif_ak47/rif_ak47_masks_psd_cc08789a.png` |

As committed, the script reads them from `.tools/ch-tex/…` and `.tools/masks/…` — scratch folders from
an ad-hoc extraction, which are gitignored and so **absent from a fresh clone**. Three lines make it
read the real export instead (verified: byte-identical output to the table above):

```python
BASE = 'out/weapontex'
pat  = Image.open(f'{BASE}/materials/models/weapons/customization/paints/antiqued/oiled_psd_9f35e709.png').convert('RGB')
mask = Image.open(f'{BASE}/materials/models/weapons/customization/rif_ak47/rif_ak47_masks_psd_cc08789a.png').convert('RGBA')
```

The seeded RNG in the script is Valve's `ran1` (Numerical Recipes), transcribed to Python — that part
is independent of the placement question and is the one piece here worth reusing.

---

## The composite simulator — recorded, not shipped

The uncommitted `composite.py` reported these, for AK-47 AUTOEXEC, `paint_index` 1449:

| float | eroded | mean brightness |
|---|---|---|
| 0.0 | 1.0% | 0.449 |
| 1.0 | 27.2% | 0.349 |

Kept because they are a measurement someone made against a real build, and the 1.0 row carries the
actual finding: **at maximum wear the artwork is still intact**, which matches the game. Treat them as
a historical note, not as a target — nothing in this repo can currently reproduce them.

**Recreating it here is the wrong move, and that is a recommendation rather than laziness.** Its whole
value was running *the same arithmetic as* `SkinCompositor.ts`, and `SkinCompositor.ts` is in the
viewer repo — this folder is part of an exporter that deliberately
[imports nothing from the repo around it](../README.md#standalone-repo). A Python transcription of
code it cannot see would drift the first time the real compositor changed, silently, and a drifted
oracle is strictly worse than no oracle: it fails runs that are correct and passes ones that are not.

So if the composite simulator is wanted, it belongs **beside `SkinCompositor.ts` in the viewer repo**,
where a test can import the real implementation instead of re-typing it. What belongs *here* is option
1 above — a reference bake this exporter can emit and anything can diff against.
