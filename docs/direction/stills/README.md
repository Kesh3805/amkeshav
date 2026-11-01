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

## Round 2, after ChatGPT's judgement (1 Nov 2026)

**Verdict:** keep the Drawing Set; **Cover B, type pairing 1**; don't revive the Index. The gate stayed open on two points, both fixed:
- **FRONTIER mixed two units.** 92.9% is a cut in *charge*, and 6.4% is a cut in *wall time*.
  - Striking out 92.9% implied it was false; it was correct within the charge model.
  - The labels now read "92.9% less charged" (modelled) and "6.4% less time" (measured).
  - The redline now marks what was actually refuted: the assumption that charge tracks time.
  - The fan is labelled as schematic, placed by the fitted timing.
  - The revision row names exp-009's object, and notes that its own registered predictions held.
- **The GST phone layout depended on its text.** It is redrawn as before and after side by side, with one representative path each, the repetition stated ("× every cell", "× every source, per cell"), and the same two sources at the foot of both columns.

ChatGPT's single biggest weakness, which shaped both fixes: "The visual language currently looks more authoritative than the evidence distinctions it communicates."

## Round 3: gate passed (1 Nov 2026)

ChatGPT re-checked the committed images. **Still gate: PASS** for Cover B / type 1, the GST sheet (desktop and phone) and the FRONTIER sheet (desktop and phone), including greyscale and the Making Software comparison.

One correction was applied before Keshav saw it: the FRONTIER headline "The saving was real in the model, and only there" overstated the case, because 6.4% of wall time *was* saved. It now reads **"The large saving existed only in the charge model."** The phone sheet's assumption label was also given slightly larger type.

**Still to come from Keshav:** his judgement of the pixels. Motion is prototyped only after he approves.
