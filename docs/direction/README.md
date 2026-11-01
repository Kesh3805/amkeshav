# Art direction gate — three still frames

This is the visual reboot ChatGPT asked for after its verdict on the first build. Before any more animation, three full-resolution stills have to hold up with nothing moving. Keshav approves or rejects the direction from these frames.

Each plate is rendered in Blender (Cycles) from a scene script in `art/`, built procedurally. There is no stock imagery and there are no fake screenshots. Where a plate encodes data, the counts are the real ones.

| Frame | Scene | What it is |
| --- | --- | --- |
| `1-threshold.png` | `art/threshold.py` | The name as architecture, recognised late: cast-concrete letters ~14 m tall in dawn haze, seen from 0.26 m off the floor with a 20 mm lens. The blue cube, the site's full stop, is the only colour. |
| `2-vault.png` | `art/vault.py` | GST returns read model as a place. A vast records hall stands for the old path, where every bay is read on every request. One bay pulled out and lit is the projection row, fetched by key. |
| `3-field.png` | `art/field.py` | Temporal Compute TC-S1 as a test site: 200 survey fins, one per scenario against EDF — 15 standing (won), 15 leaning (tied), 170 down (lost). Positions are a fixed shuffle; only the counts are data. |

Type overlays live in `art/frames/*.html`; `node art/shoot.mjs` composites them.

## How this came about

The direction came out of a critique round with ChatGPT:

- **Threshold** replaced a fully legible 3D name, which ChatGPT called the "expensive logo reveal" cliché.
- **The Vault** is a severe vault rather than a prop-room archive.
- **The Test Site** uses instrument-like fins rather than anything that reads as gravestones.

Dark mode is planned as the same worlds re-lit (blue hour, tungsten, dusk), not inverted. The scripts already take a `night` mood.

Not decided yet: the scroll choreography between frames. That is the 15–30 s prototype, and it only gets built if these stills are approved.

## Gate status (1 Nov 2026)

Three critique rounds with ChatGPT, judged on the pixels:

| Frame | Round 1 | Round 2 | Now |
| --- | --- | --- | --- |
| Vault | Revise — the lit bay was a clipped white bar | **Pass** | Unchanged |
| Threshold | Revise — flat beige, no light structure | Revise — the left wall was a dead zone; make the counter the focal event | Counter now lit as a glowing doorway. ChatGPT: "very likely ready, pending a direct visual check" |
| Test Site | Reject — dominoes, focus on one fin | Its verdict was of a stale cached image | Elevated system view. Not yet judged: ChatGPT's environment couldn't fetch the new file |

Previews for review: `preview/*-r3.jpg`. Keshav makes the final call.

## Prototype (approved direction → motion gate)

Live at `/prototype/` on the preview (not linked, noindex). Recording: `prototype.mp4` (26 s). Beats: `prototype-beats.png`.

- Each plate has a ray-cast depth map (`art/*.py` with `DEPTH=…`); a WebGL shader (`src/components/prototype/depthStage.ts`) moves a virtual camera with parallax.
- One rule joins the scenes: light comes from a visible source. The K's doorway light contracts into the far end of the vault. The record's light travels outward, and the test site emerges from it.
- Close-up plates (`SHOT=close`) replace extreme zooms: at the vault bay, and among the test-site markers before the rise to the full field.
- ChatGPT's motion review drove the second version. Its verdict on timing and continuity is still pending: it can't load video from GitHub, so it needs `prototype.mp4` attached directly.
- Known artifact: a faint strip of duplicated floor above the cube during the opening push, from depth-edge reprojection.
