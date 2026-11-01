# Still test — the Drawing Set

The gate from [`../direction.md`](../direction.md): static pages judged with nothing moving, before any motion or build. Sources are in `art/stills/` (HTML and SVG drawn by `draw.js`). `node art/stills/shoot.mjs` renders them, and `python art/stills/board.py` makes the boards.

**Start with the boards:**
- `board-covers.jpg`: Cover A (index of drawings) and Cover B (flagship-led), each in three type pairings, first frame at 1440×900.
- `board-phone.jpg`: both covers and both sheets at 390 px.
- `board-grey.jpg`: GST and FRONTIER in greyscale.

**Type pairings:**
1. Newsreader + IBM Plex Mono
2. Inter Tight (name) + Source Serif 4 + Geist Mono
3. IBM Plex Sans Condensed (name) + IBM Plex Serif + IBM Plex Mono

**Checks the gate asks for, as built:**
- **No hover:** every callout is shown open.
- **No legend:** each evidence label sits beside its claim.
- **Phone:** the drawings have their own narrow layouts, not shrunken desktop ones.
- **Greyscale:** the one accent colour marks only the refuted claim, and the strike-through and the "REFUTED" label still read in grey.

**What is real and what is illustrative:**
- The dashboard cells on the GST sheet are illustrative.
- Everything numeric traces to `content/` or to FRONTIER's `results/exp-009/README.md`.
- The FRONTIER bars are to scale: charge units on top, measured milliseconds below.
- The case positions inside the measured bar are spread evenly over the fitted per-case cost (≈ 0.05 ms each), so that part is schematic.

**Known gaps:**
- The Loams drawing is pending until Keshav names a subsystem he can attribute.
- The ReviewGraph and Temporal Compute sheets exist only as cover miniatures.
