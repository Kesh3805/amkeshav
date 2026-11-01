# Inspiration research — 5,659 sites, 167 tools

Research mode only: nothing here is a design or a build. Produced by Claude working with ChatGPT, 1 Nov 2026.

## The files

| File | What it is |
| --- | --- |
| `library.csv` / `library.json` | Every unique site: name, URL, category, region, year, depth, signal, mechanic, tags, all sources, notes. Open the CSV in a spreadsheet. |
| `top-tier.json` | 45 sites scored on two separate axes, interaction originality and transfer to an engineer-researcher's site, each with "the visitor does X, causing Y, which reveals Z". **Start here.** |
| `tools.json` | 167 component libraries, motion/scroll/transition libraries, 3D engines, shader sets, design-tool runtimes and prompt marketplaces. |
| `first-frame-audit.json` | What 72 standout sites actually show on first load, from our own captures. |
| `shots/`, `sheet-*.jpg` | The screenshots behind the audit. |
| `stats.json` | Counts by sweep, category, region and tag. |
| `raw/` | Every sweep's original output, including ChatGPT's two replies verbatim. |

Rebuild with `python scripts/research/merge.py`.

## How it was gathered

**Wave 1, award and creative-dev ecosystem** (8 parallel sweeps): Awwwards (455), FWA, CSSDA, CSS Winner, Orpetron and Webby (681, liveness-checked), Codrops case studies and demos (328) plus its Webzibition gallery (2,038, link-checked), Siteinspire and recent.design (431), niche galleries (542), personal portfolios (211, each checked live), and WebGL/WebGPU (382). ChatGPT added 130 sites, 60 studios, 70 galleries and 74 libraries independently.

**Wave 2, the gaps ChatGPT identified** (4 sweeps): explorables and scientific instruments (288), Japanese, Korean and other non-English scenes (244), games and the lost interactive web (301), and the small web plus museum and archive interfaces (350).

**Depth, honestly stated.** Of 5,659 unique sites:
- 3,226 are *described*: we know specifically what makes them notable.
- 2,433 are *catalogue-only*: a curated gallery listed them, but nobody has described them yet.
- 608 appear in two or more independent sources.
- 550 carry a mechanic sentence.
- 72 standouts were screenshotted and judged by eye.

Nobody personally played all 5,659. Every URL was seen in a source, and most are live-checked.

## What we found

**1. The best sites behave like instruments, simulations, games, places or publications with executable evidence, not like decorated pages** (ChatGPT's synthesis). The top tier is dominated by sites where the computation *is* the presentation: Raft's elections you can sabotage, load balancers you can overload, analyses whose forks you can flip.

**2. Discoverability is not originality.** The 608 multi-source sites are mostly polished agency work. The most original ideas came from places one source lists and juries never see: explorables, the small web, browser games and net art. The two are scored separately in `top-tier.json`.

**3. Spectacle often fails at the first frame.** Of 67 captures (software GL, which is slower than a real GPU):
- **26 showed a strong composition.**
- **30 showed a loader or a blank screen.**
- 5 gated entry, 3 threw GPU errors, and 1 degraded gracefully.

Two award winners no longer exist at all: coastalworld.com now serves a bank, and Prometheus Fuels was redesigned. The strong first frames were the idea-led ones: Zarcero's box office, Making Software, Lynn Fisher, Maggie Appleton, the AI Interface Museum.

**4. Graceful degradation is rare and memorable.**
- *Nothing to Watch* asks your device tier before rendering.
- *Fabian Tjoe-A-On* explains the missing WebGPU and lists the work as text.
- *Henry Heffernan* turns the loader into a fake BIOS boot, so waiting is part of the fiction.

**5. WebGPU has reached award work** (Food for Fish, Samsy, Sztanki, Mingjyun Hung, Shader.se, Holtsetio's soft bodies), usually with no fallback.

**6. Personal sites that last are one idea carried all the way through** (Bruno Simon, Zarcero, Lynn Fisher, XXIIVV, Matuschak), not a stack of effects.

**7. Godly is gone** (it redirects to recent.design). Of the libraries, the ones that go beyond Scrolltide are:
- Planes (shader components: Ferrofluid, Cymatics, Caustics)
- shaders.com (WebGPU, framework-agnostic)
- Paper Shaders
- React Bits and Inspira UI (HTML-in-Canvas)
- GSAP, now free with every plugin
- Theatre.js for camera sequencing
- Spark (Gaussian splats)
- Native CSS scroll-driven animations and the View Transitions API

## ChatGPT's twelve structural patterns

1. Executable argument
2. Single governing fiction
3. Counterfactual agency
4. Progressive physical discovery
5. Evidence as interface state
6. World as navigation
7. Simulation before explanation
8. Scale as comprehension
9. Narrative as controlled disclosure
10. Living instrument
11. Constraint as creative material
12. Playable archive

Its proposed extra taxonomy, for a later pass: governing_mechanic, visitor_agency, state_transition, knowledge_gain, evidence_model, navigation_model, spatial_model, failure_visibility, live_vs_static, fallback_mode.

## Most relevant to Keshav

From `top-tier.json`, the entries scoring 5 on transfer:
- Explorable Multiverse Analyses (pre-registration made interactive)
- The Secret Lives of Data: Raft
- samwho's Load Balancing
- Numbers Every Programmer Should Know by Year
- Tangle
- Nutshell
- Perfetto and speedscope
- Exposing Floating Point
- Maggie Appleton's growth-stage garden
- Red Blob Games
- Making Software
- Nothing to Watch and Fabian Tjoe-A-On, for how to treat hardware honestly

## Known gaps

- Webby's winners gallery needs an account.
- lapa.ninja, land-book, maxibestof, 81-web and Observable either blocked automated reading or render client-side.
- Many catalogue-only entries need a visual pass before they're trusted.
- About a third of the wave-2 mechanic sentences are inferred from titles; each record's `mechanic_basis` says which.
