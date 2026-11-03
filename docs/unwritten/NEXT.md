# THE UNWRITTEN — handoff (4 Nov 2026)

Read [`README.md`](README.md) first: every ruling from ChatGPT and Gemini is recorded there.

## State

- **Branch:** `unwritten/chamber-001` in `Kesh3805/amkeshav`. `f1167ec` (hero-004) is the last push;
  everything after it is uncommitted until Keshav OKs a commit.
- **Cinematic master: FROZEN at hero-006** ([`hero-006.png`](hero-006.png), crops, EXR in
  `art/renders/unwritten/hero006/`).
  - Settings: sun 24 W/m² at 4°, 5100 K; `FLOOR_LIFT` 2.6; SKY 22 with `SKY_HAZE=0`. These are the
    `chamber.py` defaults now.
  - No hero-007 and no more lighting sweeps unless the browser exposes a concrete defect.
- **Poster:** `public/unwritten/hero-poster.webp` is hero-006 (88 KB).
- **FRONTIER folio: built.**
  - `src/components/unwritten/folio/`: a true alignment-chart nomogram (collinearity unit-tested), the
    "COST MODEL REFUTED" stamp, and a split provenance colophon.
  - Opens from the book hotspot, with CSS-3D lift and rack-focus.
  - Flat mode: `/prototype/unwritten/frontier/`, the `#frontier` link, and narrow screens via the "Open
    the FRONTIER volume" link.
  - Data comes from `scripts/research/exp009-nomogram.py ../frontier` →
    `content/research/data/frontier-exp009.json`.

## WebGL translation (in progress)

Rebuild and bake:

```bash
WEB=1 SAVE_BLEND=<dir>/chamber.blend CAMS=NONE blender -b -P art/unwritten/chamber.py -- <dir> 960 540 8
BAKE=1 LM_MAX=1024 LM_SAMPLES=192 DRACO=1 blender -b <dir>/chamber.blend -P art/unwritten/export_web.py -- <dir>/chamber.glb
```

Copy `chamber.glb`, `chamber-camera.json` and `lightmaps/` into `public/unwritten/` (the GLB and the
lightmaps are git-ignored). The bake takes about 26 min on the CPU.

- **Bake** (`art/unwritten/bake_web.py`):
  - Cycles DIFFUSE (direct + indirect) on UV1, per batched web mesh.
  - Encode: sRGB PNG, with a per-map auto EV at the 97th percentile.
  - Island-masked denoise (`LM_BLUR`).
  - Texel boosts: desk and folio ×4. The floor gets a planar top-down UV at full resolution, because
    per-flag islands made the pool blocky.
  - Rotunda book boxes lose their back and bottom faces before UV (they bled black into the spines).
- **Runtime** (`ChamberScene.tsx`):
  - Baked meshes become unlit `MeshBasicMaterial` + lightMap, so nothing is double-counted.
  - AgX at the master's EV −0.3.
  - The `chamber-env.hdr` probe (CAMS=PANO, 1024×512) goes through PMREM to the scene environment, for the
    unbaked metals.
  - An additive cone carries the haze shaft.
- **Verified on the real GPU** (Edge, D3D11, Iris Xe, `?tier=high`): live in 6–17 s, framing identical to
  the poster.

## Next, in order

1. **Planar-floor bake: done (4 Nov).** The pool is a continuous soft ellipse over dark stone, and the
   book spines carry their colour.
   - The floor slab bottoms had to go first: they face the sky under the floor and overwrote the tops.
   - A few worn flags at the pool's rim still read a touch flat.
2. **Handoff match:**
   - three's base AgX vs Blender's AgX Punchy, plus `finish.py`'s grade
   - books still darker than the poster
   - masonry map (EV dominated by the shaft)
3. **Probe height:** move the PANO probe up (z ≈ 3 m) so the desk doesn't fill its lower hemisphere.
4. **Size:** Meshopt in place of Draco, keeping silhouettes. Decide whether to ship the GLB and the
   lightmaps (about 12 MB together).
5. **Later:** the three camera stances (Threshold → Desk → Book), then the folio on the real Book stance.

## Practical notes

- CPU only, so keep the laptop on the charger: on battery Windows throttles Blender to about 1 core.
- `BORDERS=name:x0,y0,x1,y1;...` with `SKIES=` / `SHAFTS=` renders gate crops without a full frame.
- **ChatGPT:**
  - Composer: `form .ProseMirror[contenteditable="true"]`. Check `document.title` first.
  - "This response couldn't load": read the reply from `/backend-api/conversation/<id>` with the session
    token from `/api/auth/session`.
- **Gemini** (Flash-Lite) sometimes truncates its replies.
- **Images can't be attached:** chatgpt.com's CSP blocks fetching from localhost and popups replace the
  tab, so relay the review as text.
- **Built-in browser pane:** its canvas doesn't draw (300×150), so check WebGL with Playwright on Edge:
  `channel: "msedge"`, `--use-angle=d3d11`.
