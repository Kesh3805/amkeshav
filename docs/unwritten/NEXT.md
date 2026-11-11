# THE UNWRITTEN — handoff (11 Nov 2026)

Read [`README.md`](README.md) first: every ruling from ChatGPT and Gemini is recorded there, and "The
handoff, measured (4 Nov)" and "The Desk and the Book, measured (11 Nov)" cover the WebGL work.

## State

- **Branch:** `unwritten/chamber-001` in `Kesh3805/amkeshav`. `78a1eef` is the last push; the 11 Nov
  commits are local (Keshav asked for commits, not a push).
- **Cinematic master: FROZEN at hero-006.**
- **FRONTIER folio: built.** It now opens from the Book stance when the live chamber is up (below).
- **WebGL chamber:**
  - **Grade:** Blender's AgX Punchy as a 48³ LUT, plus `finish.py`'s lens, in one post pass.
  - **Veil:** the master−web residual at the Threshold, as an HDR.
  - **Probe:** at 3 m.
  - **Shades:** glowing emitters.
  - **Stances:** Threshold → Desk → Book.
  - **Air:** off the Threshold, a near-flat in-scatter fitted against Cycles at the Desk.
  - **Error, in display codes:** Threshold vs the poster 5.5 (every region within 2.2); Desk vs Cycles
    7.5; Book vs Cycles 16.1, mostly leather gloss.
  - **Lightmaps:** rebaked 11 Nov with the sliver fix (UV overlap 35 % → 0.01 %) and a shared floor
    exposure (no more grey flags in the pool).

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
4. Check:
   - **UV overlap:** `blender -b --factory-startup -P art/unwritten/uvcheck.py -- public/unwritten/chamber.glb`
     (TOTAL should stay near 0.01 %).
   - **Threshold:** `node scripts/unwritten/handoff.mjs <dir>`.
   - **Desk and Book:** `node scripts/unwritten/desk.mjs art/renders/unwritten/web<stance> <stance>`, then
     `STANCE=<stance> blender -b -P art/unwritten/airfit.py -- <hero-WEB_<STANCE>.exr> <web-<stance>.bin> <dir>`
     (absolute paths). The Cycles frames come from `CAMS=WEB_DESK` / `CAMS=WEB_BOOK EXR=1` at 960×540, 256
     spp, about 16 min each; they only need re-rendering if the scene changes.

**Rebuild the veil after every rebake:** it is a residual against that exact bake. The GLB, the
lightmaps, the env HDR and the veil HDR are git-ignored. The bake took 42 min on the CPU on 11 Nov
(75 min on 4 Nov); keep the laptop on the charger.

## Next, in order

1. **Ship decision:** the GLB, lightmaps, probe and veil (about 11 MB: GLB 3.1, lightmaps 7.7) have to reach production
   (git LFS, or a release upload in CI) before the live chamber exists anywhere but locally. Meshopt
   was measured and rejected: larger than Draco even after brotli.
2. **Book stance: the leathers' gloss.** The cover is 19 codes and the blotter 15–24 codes below Cycles
   at the Book. That is the sheen under the near-vertical sun, which an unlit, lightmapped material can't
   carry. Options:
   - a sun-specular term on those two materials only
   - a cover texture (oxide leather grain, the gilt roundel), which would also hold up at 1.4 m
3. **The pool at the Desk** reads 9 codes bright (1.49 vs 1.19 linear). Before the floor fix the clipped
   flags hid this. Likely the floor's gloss in Cycles (Principled's Fresnel takes from the diffuse) or the
   air term over an already-right pool; measure the floor without the air first.
4. **Relay to ChatGPT and Gemini.** The browser was signed out of chatgpt.com on 4 Nov, so the 4 and 11
   Nov measurements are not reviewed. Relay the two README sections once signed in.
5. **Done 11 Nov:**
   - off-Threshold air fitted
   - the sliver bake bug fixed and rebaked
   - grey and flat flags at the pool fixed by the shared floor exposure

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
