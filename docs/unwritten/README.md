# THE UNWRITTEN — Chamber 001, "The Rotunda of Reversal"

A three-way working record: ChatGPT (creative direction and production contract), Gemini (independent
second opinion, brought in 2 Nov 2026 with full context relayed by Claude), Claude (relay, build,
verification). ChatGPT and Gemini can't see each other; every exchange below went through Claude.

## The concept

An impossible classical library. Keshav chose Transcendence (feeling), an infinite classical library
(world), "overpowered" as understanding + creating + impossible efficiency, and a visit remembered for
the world, the mind and the work together. Palette: Obsidian `#141512`, Vellum `#EAE2D4`, Brass
`#AC8960`, Abyss `#273B43`, Oxide `#874B43`.

Prototype 001 is one chamber: a rotunda (26.4 m across, dome crown at 24 m, oculus 4.4 m) with one
architectural impossibility, a suspended brass instrument, a reading desk and one book that opens into
FRONTIER exp-009 (92.9 % modelled charged-unit saving vs 6.4 % measured wall-clock; ≈120.5 ms fixed +
0.05 ms per case, from `results/exp-009/README.md` in the FRONTIER repo).

## Rulings so far

ChatGPT's production contract v1.0 is the baseline. These rulings supersede it where they conflict.

| | Question | Gemini's position | Ruling (ChatGPT) |
| --- | --- | --- | --- |
| A | Lens / verticals | Pitch 0°, vertical lens shift; converging verticals read as a 3D viewport | **Approved.** Compare 19 / 24 / 28 mm; choose by pixels |
| B | Exploration | Orbit-around-the-desk is the product-configurator cliché | **Replaced** by three stances, Threshold → Desk → Book, on authored tracks with ±10 cm parallax |
| C | First paint | Capture the poster from WebGL so the handoff can't pop | **Hybrid.** WebGL-captured poster, screenshot comparison, masked handoff if needed, Cycles fallback |
| D | The folio | A scrolling MDX overlay recreates the rejected "md file rendered" | **Approved.** The book stays in frame; real DOM text on the page plane via CSS 3D; flat reading mode for deep links, mobile and reduced motion |
| E | Materials | Baked lightmaps make brass and obsidian look like plastic | **Approved.** Bake diffuse GI on stone/wood/vellum; Blender HDR → PMREM for reflections; RectAreaLight has no shadows, budget for it |

Also agreed: plumb lines are essential proof of local gravity (one on the desk, others on the anomaly,
each hanging along its own surface normal); a subtle Abyss bounce from below, never obviously blue; the
exp-009 nomogram, using only real `VerifierReceipt`s (schema 0.2 in `crates/frontier-core/src/evidence.rs`);
audio deferred until the visuals pass.

The anomaly's form went to a render test: smooth (contract) vs stepped (Gemini: three rigid
0° / 90° / 180° segments joined by mitred landings), on the upper vs the lower ring. Sheet:
[`greybox/round1-variants.png`](greybox/round1-variants.png).

**Round 1 ruling (ChatGPT, agreed by Gemini):** stepped, on the lower ring (z = 6.15), CAM_A moved
inside the entrance to (−1.0, −12.4, 1.78), level with vertical shift, 24 mm. The instrument moves up and
left to (−4.6, −1.8, 9.2), out of the anomaly's silhouette; Gemini had proposed (−1.75, −3.10, 5.10) at
1.85 m. Plumb lines must read before the eye reaches the full inversion. From Gemini's additions, round 2
adds a twin reading desk standing on the vertical segment and 2.8 m landing blocks; stair-hall bastions
with doorways and 2700 K spill light are deferred until the massing passes.

## Greybox findings (Claude, from the renders)

- The contract's CAM_A at x = −2.0 is outside the 3.4 m entrance; a pilaster 1.3 m away fills the left
  ~40 % of the frame. `A_IN` moves it to x = −1.0, inside the opening, with the same target.
- Level camera + shift keeps every pilaster vertical; it reads as architecture rather than a viewport.
- At 19–24 mm the smooth twist on the upper ring reads as a decorative bridge crossing in front of the
  gallery: the "scroll" failure the contract's own gate warns about.

## Round 3 and the first lit frame

Round 3 (ruled by ChatGPT, from Gemini's diagnosis) replaced per-segment rolling with an **envelope pivot**:
one level corridor 1.5 m wide and 2.2 m tall on the lower ring, whose walking surface is the floor, then
the outer wall, then the ceiling. Two thick-walled stone rooms sit at the turns, with an upright doorway in
the first and a sideways one in the second. Books stand in each segment's own gravity; the sister desk sits
on the wall segment; plumb lines hang on all three segments and on the desk. The instrument moved to
(−4.3, −2.2, 6.4).

Keshav called the clay frames "cartoonish", so the next frame was lit:
[`hero-001.png`](hero-001.png). It uses Gemini's one-brutal-source rig: a sun through the oculus as a
textured shaft in haze that thins with height, warm practicals, and each corridor segment lit from its own
ceiling. Keshav and ChatGPT both judged it a good 3D concept, not a photograph. ChatGPT then wrote a
realism brief: **keep the concept, perfect one section first.**

## Realism pass: one bay to production standard

Keshav authorised six Poly Haven CC0 sets (`art/textures/fetch.py`; images are git-ignored). The bay in
[`section/`](section/) is the reference for everything that follows:

- reeded limestone pilasters with swept attic bases and capitals
- coursed ashlar
- a walnut case with lipped shelves and a cornice
- a gallery with turned balusters and a brass rail
- a brass sconce with a frosted glass shade
- books built as bound volumes (boards, page block, rounded spine, raised bands, gilt), shelved as distinct
  collections with leaners and stacks

Gate check (ChatGPT's brief):

- Pass: stone, leather (grain tiled at 6–13 cm), walnut, shelf variety.
- Fail: brass shows the plate scan's rivets, and the sconce arm is faceted.

### Section pass 2: brass, sconce, books (ChatGPT's gate before hero-002)

- **Brass** is now Gemini's procedural recipe, with no scan. It darkens to oil-rubbed bronze in crevices
  (local AO), has stretched handling-wear roughness, radial anisotropy 0.65 so brushed highlights wrap
  turned parts, and Voronoi tooling scratches.
- **The sconce** is turned hardware: an ogee rose, a continuous swan-neck arm (Bézier tube with
  parallel-transport frames, tapering), a collar, cup and bobeche, and a frosted shade. It sits proud of
  the reeds.
- **Books** have rounded fore-edge corners on the boards, 3 mm squares over the text block, and rolled
  headcaps at head and tail.

### Propagation: the chamber on the kit

`bay.py` writes the pilaster, case, books and sconce once, in a bay's local frame. The rotunda's bays are
now flat facets of a 16-sided wall (apothem 11.65 m), so the case fronts meet the gallery walkways. Each bay
has:

- a giant-order reeded pilaster
- three walnut cases of bound volumes
- an ashlar facet

Every bay and tier has its own random stream (Gemini's "twin-bay syndrome"). The inverted niches hang
their books from the shelf above. The entrance bay is a masonry arch of 13 voussoirs with a projecting
keystone. Bays behind the hero camera (θ 100–260°) use simple books to keep CPU renders tractable.

### Desk, folio and plumb lines (ChatGPT: verify the desk before hero-002)

- **The reading desk** (`bay.reading_desk`) is a library table:
  - a 50 mm walnut top with a moulded thumbnail edge
  - a dark-green tooled leather inset with a gilt fillet
  - a recessed frieze with two drawers a side and turned brass knobs
  - four turned baluster legs on cast brass sabots (Gemini), joined by an H-stretcher
- **The folio** (`bay.folio`) is the FRONTIER volume lying closed: rounded fore-edge boards, 3 mm squares,
  a rounded spine with five raised bands, and a gilt double rule with a central ring. There is no baked
  title, by the contract; the title lives in HTML.
- **The plumb lines** (`bay.plumb`) are turned brass stands: a weighted foot, a column with a finial, an arm,
  a fine line, and a turned bob hanging along the surface's own "down".
- **The desk lamp** is turned brass on the desk, and the desk light is a spot inside its shade.
- **Light:** the sun is reduced from 36 to 22 W/m², which was washing the walnut out under the shaft.

`crops.py` cuts the brief's gate crops (desk, anomaly, pilaster-wall, books, sconce, instrument) from a hero
frame at 100 %, and builds a matched hero-001 / hero-002 lighting comparison. `EXR=1` writes a 32-bit
scene-linear EXR next to each PNG.

### hero-002, hero-003 and the final art pass (3 Nov)

- **hero-002** was the first frame that read as a photograph of a real place.
- **hero-003** adds:
  - pilasters square to each corner's bisector (code review)
  - books kept under the cornices
  - quoins and nine-voussoir arches on the turning rooms (room two's springs sideways; gate 3 now passes
    in Claude's read)
  - quieter walnut

  It is the poster of `/prototype/unwritten/`.
- **Final art pass, approved by ChatGPT:**
  - sun 30 W/m², with haze still height-thinned
  - a honed French limestone floor (Gemini): 900 × 600 mm flags in running bond, each dished 1.5–3.5 mm,
    over a dusty joint bed
  - folio `#3E1712` oxblood
  - desk inset: finer, matter, darker-green leather
- **ChatGPT's guards:**
  - the shaft anchors the frame but must not become the brightest narrative event
  - folio and inset must separate clearly in hue, finish and texture
- **Freeze condition:**
  - the shaft anchors without washing out
  - the floor no longer reads as pale tile
  - the folio reads oxblood
  - the inset reads as leather
  - no new material imbalance

  Then freeze the cinematic master and move to WebGL translation.

### hero-004: not frozen (3 Nov)

[`hero-004.png`](hero-004.png), crops in [`hero-004-crops/`](hero-004-crops/). Claude's read against the
freeze condition:

- The shaft doesn't wash out (pool max 180/255, nothing clipped), but it's the brightest event and the
  pool is a hard disc: a stage follow-spot.
- The floor still reads as tile: every flag in the pool is the same pale beige, with near-black joints.
- The folio is marginal: oxblood in the wide shot, brick under direct sun.
- The inset reads as felt.
- A new imbalance at full resolution: the turning rooms are pale untextured boxes, and their 220 W
  interiors turn the doorways into lightboxes.

**ChatGPT's ruling for hero-005.** No redesign and no new effects; change only these variables:

- **Shaft:** sun angle 0.6° → 1.2°. Break the pool only with real structural members; none cross the
  open oculus, so no invented glazing.
- **Floor:** four limestone tints with correlated drift, not independent picks (no checkerboard), and dusty
  joints.
- **Inset:** grain at 9 cm, a stronger normal, and roughness 0.30–0.62 so the grain shows in the sheen.
- **Rooms:**
  - a darker weathered sandstone of their own
  - room lights cut to 70 W and moved under each room's own ceiling, so the interior falls off
  - in the sideways room, a shelf of books standing along that room's "up" (+T), and a plumb line hanging
    along −T
- **Folio:** unchanged until the new light is seen.
- **Process:** matched crops of the anomaly and the pool (`BORDERS=` region renders) come before any full
  hero render.

**Freeze gate for hero-005:**

- the pool no longer reads as a follow-spot
- the floor reads as monumental stone
- the inset shows leather grain and sheen
- the rooms show masonry depth
- the sideways gravity is readable at 960×540
- no new imbalance at 1920×1080

### hero-005: not frozen (3 Nov)

[`hero-005.png`](hero-005.png), crops in [`hero-005-crops/`](hero-005-crops/). Claude's read against the
gate:

- **Pass:** inset leather, room masonry, sideways gravity.
- **Partial:** the floor reads as stone inside the pool and as black outside it.
- **Minor:** the upper half and the left are very dark.
- **Fail:** the pool is still a follow-spot, with no bounce on the desk underside, stretcher, legs or
  nearby floor. Measured pool centre against 1 m outside the edge: about 120:1 (display luminance,
  sRGB-decoded). The floor albedo, about 0.11 linear, returns almost nothing.

**ChatGPT's ruling for hero-006:**

- Fix the receiving side first: the floor must take part in the light so the pool lights the room, not
  just itself. Raise the floor albedo in and just beyond the pool, slightly less rough where plausible,
  and keep it stone, not gloss.
- Tame the shaft only as far as that needs; don't trade a good shaft for a floor that is still a void.
- **Target:** pool centre against 1 m outside the edge at about 12:1, acceptable 10–14:1. Above about
  15:1 it stays theatrical.

`FLOOR_LIFT` scales every flag's albedo; `SHAFTS=strength@angle,...` sweeps the sun inside `BORDERS`
crops; `DESK_W` sets the desk practical.

**The sweep** (ratio measured 1.2 m beyond the half-max edge):

- **Sun 24 W/m² at 4°:** softens the rim into a real penumbra, but the ratio holds at 137:1.
- **Sun 14@8:** reaches 16:1 only by smearing the pool flat. Rejected.
- **Floor ×2.2 and ×3.2:** 106:1 and 90:1. The surround flags read as stone, but the interior drifts
  toward pale tile.
- **Conclusion:** one source in a dark-walled rotunda caps out at about 80–100:1.

**ChatGPT's revised ruling:**

- 12:1 was too rigid. The ratio is a diagnostic: 10–20:1 preferred, 20–40:1 conditional on a soft
  boundary and a legible floor, above 40:1 review rather than reject.
- The desk's 2750 K practical is the sanctioned second source; take the lowest setting (90 W before
  160 W) that passes.
- Keep the sun at 24 W/m² at 4°.
- `FLOOR_LIFT` 2.6 stays an experiment: keep the flag variation and avoid the pale tile.
- If neither lamp setting passes, look to diffuse light from the oculus, not more lamp.
- "A photographed impossible place, not numerical compliance with a contrast target."

**What hero-006 uses:**

- **Desk lamp:** 90 W and 160 W measured the same (100:1 and 102:1). The shade aims the cone at the
  leather, so it stays at 40 W.
- **Oculus sky fill:** the real omission. A clear sky gives about 15% of the sun's irradiance as diffuse
  light; through a 4.4 m oculus 24 m up, that needs about 100× the old sky strength.
- **Sky sweep:** SKY 12/30/60 gives 23:1, 9:1 and 5:1, but from 30 up the sky lights the haze into a
  grey-blue veil over the anomaly.
- **Haze:** `SKY_HAZE=0` keeps the world out of volume scatter, so the haze stays the sun's shaft. With it,
  SKY 22 measures 25:1 with no veil.
- **hero-006 settings:** sun 24 W/m² at 4°, 5100 K; `FLOOR_LIFT` 2.6; SKY 22 with `SKY_HAZE=0`; desk
  lamp 40 W.

### hero-006: FROZEN as the cinematic master (3 Nov)

[`hero-006.png`](hero-006.png), crops in [`hero-006-crops/`](hero-006-crops/), all gates PASS:

- the pool is now a real penumbra over legible stone (26:1 on the full frame)
- the sky fill reveals the lower cases and both gallery tiers
- the floor in the desk's shadow is 2.2× brighter, and the legs and stretcher separate from the floor

ChatGPT approved the freeze on Claude's pixel review: "The cinematic master is the visual authority. The
browser implementation must approach it, not redefine it." No hero-007 and no more lighting sweeps unless
the browser exposes a concrete defect.

**WebGL next, in order:**

1. Archive the master: untreated render, EXR, finished PNG and settings.
2. Poster from hero-006.
3. Bake diffuse against the optimized WebGL geometry and its own lightmap UVs, not the cinematic scene.
   Don't double-count: baked meshes get no runtime lights. Brass and glass reflections come separately
   (PMREM).
4. Meshopt, keeping silhouettes and moulding profiles.
5. Validate the handoff: the WebGL first frame against the poster at the same framing, exposure and
   viewport, on desktop, mobile, reduced motion and the fallback.

### The handoff, measured (4 Nov)

Claude compared the WebGL frame with the poster on the real GPU (Edge, D3D11), region by region.

- **Grade.** three's `AgXToneMapping` is not Blender's AgX: three uses 16.5 stops in Rec.2020 and no
  look; Blender uses 25 stops in E-Gamut through a LUT, with Punchy as a shadow tone curve. So
  `art/unwritten/agx_lut.py` exports Blender's own OCIO pipeline (view AgX, look "AgX - Punchy") as a
  48³ LUT (`public/unwritten/agx-punchy.png`, 21 KB). The scene now renders scene-linear into a
  half-float target, and one pass applies the LUT at EV −0.3 plus `finish.py`'s vignette, CA and grain,
  placed on the poster's frame. Against hero-006's EXR, the LUT is within 0.42 codes of Blender's own
  PNG (p99 1.3). The mean error between poster and WebGL halved (24.6 → 12.4 codes).
- **Probe.** The PANO probe now sits at z = 3 m (`PANO_Z`), so the desk no longer fills its lower
  hemisphere.
- **Meshopt: rejected.** It is larger than Draco even after brotli (4.9 vs 4.4 MB), because UVs
  outside 0–1 can't be quantised. Draco stays.
- **Haze in the bake: no.** A 256 px A/B (`LM_HAZE`) moved surfaces by under 5 %, and the pool by
  −9 %. The haze's real effect is in-camera: rendered without haze, the master's pool drops from 68 to
  40 codes and the desk from 59 to 22. A bake can't carry that veil, because it is view-dependent.
- **Shelves: mostly air, partly a bake defect.** Rendered in Cycles, the WebGL build's own blend
  matches the master (shelves 22.5 vs 22.4, pool 68.4 vs 68.5). But the WebGL bookcases came out 4+
  stops dark while the stone stayed within about a stop. A pass breakdown of the master on those pixels
  (42 % of the frame) settled it:
  - the haze's in-scatter is 60 % of their light, glossy 13 %, diffuse 11 %; neither of the first two
    can be baked
  - the bake also ran 2–3× low on the books. A spine is a few texels, the UV packer had shrunk the
    island gap to 0 px, and the black, neighbour-facing book sides bled in. The sides are culled now,
    and the shelf maps get twice the texels (book lightmaps up 4×).
  - Two dead ends, measured and kept honest: haze in the bake (no effect) and the exporter's flat
    albedo estimates (Cycles' own albedo bake agreed within 4 %; it now replaces them anyway).
- **Pilaster lines.** Arris faces narrower than a texel own no texel, so they drew as dashed,
  sky-bright lines. `fix_slivers` re-points such faces at their largest neighbour's lightmap UVs.
- **Sconces.** The frosted shades are unlit warm emitters in the browser. three's transmission cost a
  pass and left them dull, and the veil then smeared their missing glow into soft squares.
- **The veil** (`art/unwritten/veil.py`) is the residual: master scene-linear light minus WebGL
  scene-linear light at the Threshold (captured with `?dump` on the dev server), low-passed into a
  240×135 Radiance HDR on the poster's frame. The grade adds it before the view transform at the
  Threshold and fades it out over the first 2.5 m of a stance flight, while the shaft cone fades in.
  Residuals brighter than 0.2 (linear luminance) are capped, so lamps aren't smeared into it. With the
  veil and the full bake, every region of the WebGL frame is within 2 codes of the poster (mean error 6.0, from
  24.6 at the start of the day).

**Stances (ruling B) are built.** When the live chamber is up, the book hotspot flies the camera
Threshold → Desk → Book on one eased Catmull-Rom track:

- position, direction, horizontal FOV and lens shift all move along that track
- the Desk stays level, and only the Book (a three-quarter view, 1.4 m away, 27° down) pitches
- the folio then rises from where the camera actually sees the book, and closing flies back
- the title fades while the camera is away from the Threshold

Without WebGL (the poster, narrow screens, reduced motion), the folio opens exactly as before.

### The Desk and the Book, measured (11 Nov)

`chamber.py` has two more cameras, `WEB_DESK` and `WEB_BOOK`, which are the web's Desk and Book stances.
`scripts/unwritten/desk.mjs` captures the web at those poses (dev only: `?stance=desk|book`). It saves
the graded frame and the linear frame with the shaft and the air term, plus the view distance.
`art/unwritten/airfit.py` puts both through Blender's own view and compares them region by region. It
also bins the light the web still lacks by view distance.

- **The air term was the wrong shape.** At the Desk the camera stands at the edge of the sun shaft, so
  every view ray crosses lit haze. The needed in-scatter is about 0.09 (linear) at 3 m and at 15 m
  alike, but the old term rose over 12 m. Fitted: `AIR` (0.111, 0.087, 0.078) with `AIR_LENGTH` 1 m.
  The Desk frame went from 23.7 to 8.5 codes off. Shelves, the far floor, the desk apron and the pool
  are each within 4 codes; the blotter and the book are still about 12 codes low (surface light, not
  air). The Threshold is unchanged, since the veil carries it.
- **The Book exposed a bake bug.** In Cycles the sun lights the cover directly: sunlit oxblood, 0.27
  linear. In the web it was 0.012, 22× too dark. Baked in the master scene, the cover gets D = 5.96, in
  line with the desk beside it, but the export's lightmap gave it 0.85. The cause is `fix_slivers`. It
  re-points each corner of a sub-texel face to its largest neighbour's UV, separately. A 4 mm board edge
  joins the cover (one UV island) to the board's underside (another), so its "collapsed" face stretched
  across the map. It ran before the bake, so the bake wrote edge light over the cover. On the folio's
  map, 67 % of the texels were claimed twice.
- **It was everywhere.** `art/unwritten/uvcheck.py` counts lightmap texels that more than one face
  claims. On the 4 Nov GLB that was 35 % of all lightmap texels: the desk leather 100 %, the shelves'
  walnut 98 %, the shell limestone 86 %, the shelf bindings 35–47 %. This is very likely most of the
  "books 2–3× low" defect from 4 Nov. Fix: a sliver now maps into ONE neighbour's island (the largest
  non-sliver face sharing an edge with it), and the fix runs after the bake, so it only changes where
  slivers sample. Overlap after the fix: 0.01 % (481 texels, all on the unbaked brass).
- **Grey flags in the pool.** Each floor batch (one per flag material) set its own lightmap exposure from
  its 97th-percentile texel. The sun's pool is a few % of each batch, so four batches clipped inside it
  (`limestone_3` at E/π 0.42, where the pool needs about 4). Those flags read grey among cream ones.
  The floor maps now share one exposure, from the 99.9th percentile of all of them (`LM_PCT_FLOOR`).

**Rebaked with both fixes (42 min).** The veil was rebuilt against the new bake. Display codes against
Cycles or the poster:

| Frame | Before | After | Notes |
|---|---|---|---|
| Threshold vs poster | 6.0 | 5.5 | every region within 2.2 codes |
| Desk vs Cycles | 8.5 | 7.5 | the book on the desk −12.5 → −3.2; the pool now uniform cream, +9 |
| Book vs Cycles | 20.3 | 16.1 | the cover −54 → −19 (sunlit oxblood now) |

- **What is left at the Book is gloss.** The cover is −19 codes and the blotter −15 to −24. Cycles shows
  a leather sheen under the near-vertical sun, which an unlit, lightmapped material cannot carry.
- **Performance.** The flight takes 2.8 s with no screenshots, the same as before; the new bake runs at
  40–42 fps against 37.

**Surfaces: the sun's gloss and the grazing loss.** `chamber.py PASSES=1` writes Cycles' diffuse, glossy
and volume passes, and `art/unwritten/passfit.py` sets them against the web frame.

- **What the bake was missing.** Gloss is large on the leathers: 0.12–0.16 linear on the blotter and
  the cover, more than their diffuse. The real haze grows with distance (0.02 at 1.3 m, 0.03 at 3 m,
  0.08 at 15 m). So the flat air fitted earlier that day had been standing in for the missing gloss.
- **What the web now adds** (`withSurface` in ChamberScene) to every baked material:
  - GGX gloss from the sun alone, gated by how sunlit the texel's lightmap is
  - the room's gloss: the probe sampled along the reflection at the material's roughness, times the
    split-sum DFG, occluded by the bake (the lightmap's irradiance over the probe's at that normal)
  - Principled's grazing diffuse loss, measured on a Cycles plane:
    g = 1 − min(0.6, 0.17 / r) · (1 − N·V)⁴
- **The air was refitted** with those terms in place: `AIR` (0.095, 0.074, 0.066), `AIR_LENGTH` 3 m.
  The Desk and the Book each asked for the same value at 3 m, independently.
- **Gloss alone, before the air refit** (web without air vs Cycles diffuse + glossy): the Book cover
  0.282 vs 0.255 (was 0.122), the blotters about 0.22 vs 0.21–0.25, and the Desk book 0.221 vs 0.235.

| Frame (display codes) | Before the rebake | Rebake | + surfaces and air |
|---|---|---|---|
| Threshold vs poster | 6.0 | 5.5 | 5.3 |
| Desk vs Cycles | 8.5 | 7.5 | 5.6 |
| Book vs Cycles | 20.3 | 16.1 | 6.9 |

- **Worst region at either stance:** 7.2 codes (the Book cover, +7.2; the Desk pool, +5.9). Before the
  probe gloss, the shaded walnut apron was −13; it is now +4.5.
- **The veil is smaller:** mean 0.039 → 0.035, so the scene carries more light itself at the Threshold.
- **Cost:** within run-to-run noise. The flight runs at 33–43 fps; with gloss on and off, 30–43 and
  35–43 fps over three alternating runs.
- **Dev switch:** `?gloss=0` turns the sun term off for A/B comparisons.
- **The metals in the sun.** The unbaked brass and gilt had only a 0.6 W/m² stand-in key. With a bake,
  that key is now the real sun (24 W/m², 5100 K, the oculus's angle). Its direct light on those
  materials is masked to the column of sun the oculus admits (`inSunColumn`), since there is no shadow
  map. The folio's gilt ring now catches the gold glint Cycles shows. The Book went from 6.9 to 6.3
  codes; the Desk is 5.5 and the Threshold 5.3.

## Build

Blender 5.2, headless, seed 1102. Fetch the textures once with `python art/textures/fetch.py`.

```bash
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P art/unwritten/section.py -- <out-dir> 1280 720 64
"C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P art/unwritten/chamber.py -- <out-dir> 1920 1080 128
python art/unwritten/finish.py <in.png> <out.png>   # vignette, corner CA, shadow grain
```

- `section.py`: `CAMS` (SECTION, BOOKS, PILASTER), `EV`.
- `chamber.py`:
  - `LOOK=hero|clay`
  - `CAMS` (HERO, A, A_LEVEL, A_IN, A_IN24, A_IN28, B, C)
  - `SUN` (24), `SUN_ANGLE` (4°), `SUN_K` (5100), `HAZE`, `HERO_TZ`, `EV`, `EXR`, `SAVE_BLEND`
  - `SKY` (22): oculus sky fill. `SKY_HAZE` (0): whether the sky lights the haze.
  - `FLOOR_LIFT` (2.6): albedo scale for every floor flag. `DESK_W` (40): desk practical.
  - `BORDERS=name:x0,y0,x1,y1;...` renders only those regions of the HERO frame (matched gate crops).
    Inside it, `SKIES=a,b,...` and `SHAFTS=strength@angle,...` sweep the sky and the sun without
    rebuilding the scene.
  - `RAYCHECK=1 CAMS=NONE` traces the oculus ray and reports the wall after its boolean.

`kit.py` holds the shared mesh builder (mitred moulding sweeps, lathe), the classical profiles and the
scanned-PBR materials. `chamber.py` moves onto it next.
