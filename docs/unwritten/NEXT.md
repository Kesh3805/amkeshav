# THE UNWRITTEN — handoff (4 Nov 2026, evening)

Read [`README.md`](README.md) first: every ruling from ChatGPT and Gemini is recorded there, and "The
handoff, measured (4 Nov)" covers today.

## State

- **Branch:** `unwritten/chamber-001` in `Kesh3805/amkeshav`. `78a1eef` is the last push; today's work is
  uncommitted until Keshav OKs a commit.
- **Cinematic master: FROZEN at hero-006.**
- **FRONTIER folio: built.** It now opens from the Book stance when the live chamber is up (below).
- **WebGL chamber:**
  - **Grade:** Blender's AgX Punchy as a 48³ LUT, plus `finish.py`'s lens, in one post pass.
  - **Veil:** the master−web residual at the Threshold, as an HDR.
  - **Probe:** at 3 m.
  - **Shades:** glowing emitters.
  - **Stances:** Threshold → Desk → Book.
  - **Mean error vs the poster:** 6.0 codes, down from 24.6; every region is within 2 codes.

## Rebuild the web assets

```bash
WEB=1 SAVE_BLEND=<dir>/chamber.blend CAMS=NONE blender -b -P art/unwritten/chamber.py -- <dir> 960 540 8
BAKE=1 LM_MAX=1024 LM_SAMPLES=192 DRACO=1 blender -b <dir>/chamber.blend -P art/unwritten/export_web.py -- <dir>/chamber.glb
CAMS=PANO EXR=1 blender -b -P art/unwritten/chamber.py -- <pano dir> 1024 512 256   # then EXR → .hdr (Blender save_render, HDR)
blender -b -P art/unwritten/agx_lut.py -- lut.bin 48   # → public/unwritten/agx-punchy.png (only if the look changes)
```

Then:

1. Copy `chamber.glb`, `chamber-camera.json` and `lightmaps/` into `public/unwritten/`.
2. With `pnpm dev` running, capture the web frame: `node scripts/unwritten/dump.mjs <web.bin>` (`?dump` is dev only).
3. Build the veil:
   `blender -b -P art/unwritten/veil.py -- art/renders/unwritten/hero006/hero-HERO.exr <web.bin> public/unwritten/chamber-veil.hdr`

**Rebuild the veil after every rebake:** it is a residual against that exact bake. The GLB, the
lightmaps, the env HDR and the veil HDR are git-ignored. The bake takes about 75 min on the CPU (4 Nov, with the albedo pass and the larger shelf maps), so
keep the laptop on the charger.

## Next, in order

1. **Ship decision:** the GLB, lightmaps, probe and veil (about 11 MB: GLB 3.1, lightmaps 7.7) have to reach production
   (git LFS, or a release upload in CI) before the live chamber exists anywhere but locally. Meshopt
   was measured and rejected: larger than Draco even after brotli.
2. **Off-Threshold haze: fitted (11 Nov).** `chamber.py` now has `WEB_DESK` and `WEB_BOOK` cameras
   (the web's stances); `art/unwritten/airfit.py` compares Cycles with the web frame there. At the Desk
   the needed in-scatter is flat with distance (the camera stands at the shaft's edge), so `AIR` is now
   (0.111, 0.087, 0.078) with `AIR_LENGTH` 1 m: the Desk frame went from 23.7 to 8.5 codes off. The Book
   check exposed a **bake bug** (the cover baked at 1/7 of its light): see README, "The Desk and the Book,
   measured (11 Nov)".
3. **Book stance polish.** The folio's cover is a flat slab at close range. A cover texture (oxide
   leather, the gilt roundel) would hold up at 1.4 m.
4. **Relay to ChatGPT and Gemini.** The browser was signed out of chatgpt.com on 4 Nov, so today's
   measurements were not reviewed. Relay the README section once signed in.
5. A few worn flags at the pool's rim still read a touch flat.

## Practical notes

- `BORDERS=name:x0,y0,x1,y1;...` with `SKIES=` / `SHAFTS=` renders gate crops without a full frame.
- Capture helpers in `scripts/unwritten/` (Edge D3D11 via Playwright; `BASE=` the dev server, default
  :3300 from `.claude/launch.json`): `handoff.mjs` (poster vs WebGL), `stance.mjs` (the flight),
  `dump.mjs` (linear Threshold frame), `desk.mjs <out> [desk|book]` (a stance's graded frame + linear frame
  with depth, for `art/unwritten/airfit.py`), `meshes.mjs` and `hide.mjs` (dev-only mesh list and
  hide-by-prefix).
- **ChatGPT:**
  - Composer: `form .ProseMirror[contenteditable="true"]`.
  - "This response couldn't load": read the reply from `/backend-api/conversation/<id>` with the session
    token from `/api/auth/session`.
  - Images can't be attached (CSP), so relay as text.
- The built-in browser pane's canvas doesn't draw, so check WebGL with Playwright on Edge.
