# THE UNWRITTEN — handoff (2 Nov 2026, end of session)

Read [`README.md`](README.md) first: every ruling from ChatGPT and Gemini is recorded there.

## State

- Branch `unwritten/chamber-001` in `Kesh3805/amkeshav`. Commit `344d489` is pushed (greybox → section
  test). Everything after it is **uncommitted**:
  - `art/unwritten/bay.py`, `crops.py`
  - kit/chamber/section changes
  - the new docs frames
  - possibly `src/app/prototype/unwritten/` and `public/unwritten/`
- **Concept is frozen** (ChatGPT: "You are no longer proving the concept. You are proving the image.").
  Approved: 16-facet rotunda; envelope-pivot corridor on the lower ring; level 24 mm CAM_HERO inside the
  entrance; oculus shaft; plumb lines.
- **Passed gates** (ChatGPT): brass (Gemini's procedural recipe), the crafted sconce, book corners
  (rounded boards, squares, headcaps). It accepted the chamber propagation onto the kit.
- **Desk:** modelled (`bay.reading_desk`). The second close-up still showed orange, stripy walnut and a
  salmon folio. Fixed after that render (walnut `contrast=0.45`, cooler tint; folio `#5E261F`), but the
  fix is **not yet verified in pixels**.

## Was running when the session ended

`hero-002` (1920×1080, 128 samples, EXR) followed by `finish.py` and `crops.py`. If it finished, these
exist:

- `docs/unwritten/hero-002.png` (finished) and `hero-002-untreated.png`
- `docs/unwritten/hero-002-crops/` (desk, anomaly, pilaster-wall, books, sconce, instrument,
  lighting-comparison, desk-closeup)
- `art/renders/unwritten/hero002/hero-HERO.exr`

If not, re-run:

```bash
cd C:/Users/user/Desktop/amkeshav
CAMS=HERO,DESK EXR=1 EV=-0.3 "C:/Program Files/Blender Foundation/Blender 5.2/blender.exe" -b -P art/unwritten/chamber.py -- "C:/Users/user/Desktop/amkeshav/art/renders/unwritten/hero002" 1920 1080 128
python -I art/unwritten/finish.py art/renders/unwritten/hero002/hero-HERO.png docs/unwritten/hero-002.png
python -I art/unwritten/crops.py docs/unwritten/hero-002.png docs/unwritten/hero-002-crops docs/unwritten/hero-001.png
```

Textures are git-ignored; fetch them first on a fresh clone with `python art/textures/fetch.py`.

## Next, in order

1. Review hero-002 and its crops honestly against ChatGPT's 10 gates (README → realism brief). Report to
   ChatGPT ("Portfolio Aesthetic Directions" thread) and Gemini ("Architectural Spec for Keshav's
   Portfolio"). They can't see each other; relay between them. ChatGPT can read the pushed branch.
2. Known weak spots to check first:
   - walnut colour
   - folio colour
   - the marble floor slabs in the light pool reading as tiles
   - the turning rooms still being fairly plain masonry boxes
   - the haze wash in the centre
3. Commit and push only with Keshav's OK.
4. Only after the hero master passes: WebGL translation (baked GI, PMREM, the poster-to-canvas
   handoff), then the FRONTIER folio interaction.

## Practical notes

- CPU only (no NVIDIA GPU). Draft at 960×540, 24–32 samples (about 1–2 min); finals at 1920×1080, 128
  samples (30+ min). Keep coding while renders run.
- The ChatGPT page has an editable "Writing" canvas. Target the composer with
  `form .ProseMirror[contenteditable="true"]`, or text lands in the canvas. Images can't be attached
  cheaply from scripts, so Keshav attaches renders by hand when pixel review is needed.
