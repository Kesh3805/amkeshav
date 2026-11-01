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
