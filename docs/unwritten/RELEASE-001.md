# Chamber 001 — release record

**Status: frozen, 12 Nov 2026** (ChatGPT's v1 ruling; see [`README.md`](README.md), "Portfolio v1"). This
file keeps the master, the shipped assets and their measurements together, as ChatGPT asked. The
release commit is recorded here at gate 10.

## Reopening

Only for a demonstrated defect:

- a measured region outside 7 codes
- a broken browser or device
- a failed camera track or folio transition
- a failed fallback

No lighting sweeps.

## Versions

- **Cycles master:** Blender 5.2.3 LTS, seed 1102, `art/unwritten/chamber.py` at its defaults (sun
  24 W/m² at 4°, 5100 K; sky 22, `SKY_HAZE=0`; `FLOOR_LIFT` 2.6; desk lamp 40 W). The hero-006 frame
  is 1920×1080, with EXR.
- **Web build:** `export_web.py` with `BAKE=1 LM_MAX=1024 LM_SAMPLES=192 DRACO=1` (rebaked 11 Nov:
  sliver fix, shared floor exposure); three.js 0.187.0, @react-three/fiber 9.8.2, Next.js 16.4.3.
- **Grade:** Blender's AgX, look Punchy, as a 48³ LUT at EV −0.3, plus `finish.py`'s lens.

## Measured agreement (mean display codes, same framing, Edge on Iris Xe)

| View | Against | Error | Worst region |
|---|---|---|---|
| Threshold | the poster (hero-006) | 5.3 | within 2.6 |
| Desk | Cycles at `WEB_DESK` | 5.5 | within 7 |
| Book | Cycles at `WEB_BOOK` | 6.2 | within 7 |

- **Lightmap UV overlap:** 0.01 % (`art/unwritten/uvcheck.py`).
- **Runtime:** 33–43 fps at 1080p; the heap holds at 41 MB over a 60 s session.

## Manifest

| File | Bytes | SHA-256 |
|---|---:|---|
| `docs/unwritten/hero-006.png` | 3,185,201 | `e9c6534ddc966f8d1857bb3b6880cfb19efb00c65030829e31203fbabd49904c` |
| `public/unwritten/hero-poster.webp` | 88,254 | `4227deb20e9fde4b6567ac5e6da1146cb5f4e3f485fc7912d4297c5b9b5baceb` |
| `art/renders/unwritten/hero006/hero-HERO.exr` | 23,928,806 | `82bc263736d2da1073fb2d9ca08ab9c40b74b930b9458ba70dc2ce50993573c5` |
| `art/renders/unwritten/hero006/hero-DESK.exr` | 23,773,865 | `5d973f5ca73727d6f54b208bd3e0af4d740b2fde1530395bfb1794393f7a6fc4` |
| `public/unwritten/chamber.glb` | 3,170,572 | `4d65d151ae66333f755c7ca4ad47fcc2e1a3498de35772d45fbc808554e42123` |
| `public/unwritten/chamber-camera.json` | 2,072 | `6aae9babf2c5f997fa1eb131a974aafc0d7c1465c6ce75733a80395604cbac0e` |
| `public/unwritten/chamber-env.hdr` | 1,582,363 | `bd13c650408d18ca4c0489289f741f2ef448588ad4dce633b6d809fca7022bde` |
| `public/unwritten/chamber-veil.hdr` | 129,649 | `94849273749b543e337ecc42fd76bb841c2dc9516d0375cfefe7de0b9ac5fdce` |
| `public/unwritten/agx-punchy.png` | 21,562 | `f718f079dbd4e8fddb272d4f48190e9beaac6cc868f063a277b56c6b06c4082b` |
| `public/unwritten/detail/brown_leather-normal.jpg` | 82,171 | `1f26394c8e6391f1be1bdbe1df335a4e784aefa0a3e35b5a31b9970eaedc5001` |
| `public/unwritten/detail/desk_leather.jpg` | 136,656 | `2b78fb1e065590e9025e4a4068c6a49291dcc0a96e09d206a0e2a91be539d1f9` |
| `public/unwritten/detail/folio_oxide.jpg` | 130,618 | `39ece5c0adae89dd381b63dc51c11bfb457e89c940fead0921a926880f99add8` |
| `public/unwritten/lightmaps/` (42 PNGs) | 7,614,868 | `19f9eb0666058088c3c2825d6abba09b814e1df38b18b8c460a76186bc4db980` (hash of the sorted per-file hashes) |

The EXRs (48 MB) and the hero-006 PNG's gate crops live in `art/renders/unwritten/hero006/`, which is
git-ignored. Attach the two EXRs to the v1 GitHub Release at gate 10, so the master survives this
machine. Every other file above is in git (the baked assets through LFS).
