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
  - `SUN`, `HAZE`, `HERO_TZ`, `EV`, `SAVE_BLEND`
  - `RAYCHECK=1 CAMS=NONE` traces the oculus ray and reports the wall after its boolean.

`kit.py` holds the shared mesh builder (mitred moulding sweeps, lathe), the classical profiles and the
scanned-PBR materials. `chamber.py` moves onto it next.
