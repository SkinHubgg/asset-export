"""Rank Case Hardened seeds by blueness over the AK's ACTUALLY-PAINTED region.

Published community rankings give ground truth (seed 661 is AK-47 Case Hardened Blue Gem #1),
so this tests the seed->placement pipeline numerically instead of by comparing screenshots.
"""
from PIL import Image
import math, sys

BASE = '.tools'
pat  = Image.open(f'{BASE}/ch-tex/materials/models/weapons/customization/paints/antiqued/oiled_psd_9f35e709.png').convert('RGB')
mask = Image.open(f'{BASE}/masks/materials/models/weapons/customization/rif_ak47/rif_ak47_masks_psd_cc08789a.png').convert('RGBA')

N = 192
P = pat.resize((N, N)).load(); PW, PH = N, N
M = mask.resize((N, N)).load()

IA, IM, IQ, IR, NTAB = 16807, 2147483647, 127773, 2836, 32
NDIV = 1 + (IM - 1) // NTAB; AM = 1.0 / IM; RNMX = 1.0 - 1.2e-7

class RNG:
    def __init__(s, seed): s.idum = seed if seed < 0 else -seed; s.iy = 0; s.iv = [0]*NTAB
    def _gen(s):
        s.idum = 1 if -s.idum < 1 else -s.idum
        for j in range(NTAB+7, -1, -1):
            k = s.idum // IQ; s.idum = IA*(s.idum - k*IQ) - IR*k
            if s.idum < 0: s.idum += IM
            if j < NTAB: s.iv[j] = s.idum
        s.iy = s.iv[0]; return s._next()
    def _next(s):
        if s.idum <= 0 or s.iy == 0: return s._gen()
        k = s.idum // IQ; s.idum = IA*(s.idum - k*IQ) - IR*k
        if s.idum < 0: s.idum += IM
        j = s.iy // NDIV; s.iy = s.iv[j]; s.iv[j] = s.idum; return s.iy
    def f(s, lo, hi):
        v = AM * s._next()
        return (RNMX if v > RNMX else v) * (hi - lo) + lo

def xform(rot, scale, ox, oy):
    q = lambda t: math.floor((t + 0.005) * 100) / 100
    v0, v1, v2x, v2y = q(rot), q(scale), q(ox), q(oy)
    r = math.radians(v0); c, s = math.cos(r), math.sin(r)
    v6 = 0.5 / (v1 if v1 else 1); v7, v8 = math.cos(-r), math.sin(-r)
    v9 = v6*v7 - v6*v8; v10 = v9*v8 + v6*v7
    return ((c*v1, -s*v1, (v1*c)*v9 + (v1*-s)*v10 + (v2x - 0.5)),
            (s*v1,  c*v1, (v1*s)*v9 + (v1*c)*v10 + (v2y - 0.5)))

def roll(seed, order):
    r = RNG(seed)
    if order == 'offset_then_rot': ox, oy, rot = r.f(0,1), r.f(0,1), r.f(0,360)
    elif order == 'rot_then_offset': rot, ox, oy = r.f(0,360), r.f(0,1), r.f(0,1)
    elif order == 'offset_no_rot': ox, oy, rot = r.f(0,1), r.f(0,1), 0.0
    return rot, ox, oy

def blueness(seed, order):
    rot, ox, oy = roll(seed, order)
    x0, x1 = xform(rot, 1.0, ox, oy)
    blue = tot = 0
    for y in range(N):
        for x in range(N):
            if M[x, y][0] < 128: continue           # unpainted (wood etc.) — excluded
            u, v = (x + 0.5)/N, (y + 0.5)/N
            su = x0[0]*u + x0[1]*v + x0[2]
            sv = x1[0]*u + x1[1]*v + x1[2]
            R, G, B = P[int((su % 1.0)*(PW-1)), int((sv % 1.0)*(PH-1))]
            tot += 1
            if B == max(R, G, B) and (max(R,G,B) - min(R,G,B)) > 35 and B > 60: blue += 1
    return 100.0 * blue / max(tot, 1)

TOP_BLUE = [661, 670, 955, 179, 387, 151, 321, 592, 828, 168]
POOL = sorted(set(TOP_BLUE + list(range(0, 1000, 37))))
for order in ['offset_then_rot', 'rot_then_offset', 'offset_no_rot']:
    scored = sorted(((blueness(s, order), s) for s in POOL), reverse=True)
    rank = {s: i+1 for i, (_, s) in enumerate(scored)}
    top_ranks = [rank[s] for s in TOP_BLUE]
    print(f'{order:18} n={len(POOL):3}  rank(661)={rank[661]:3}  '
          f'median rank of the 10 known blue gems = {sorted(top_ranks)[len(top_ranks)//2]:3}  '
          f'top5={[s for _, s in scored[:5]]}')
