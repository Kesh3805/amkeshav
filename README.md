# amkeshav.me — rebuild

Keshav's personal site, rebuilt from scratch. The previous repository (`Kesh3805/keshav-portfolio`) was used only as a source of verified facts; no components, styles, tokens or motion code were carried over.

## The idea

**Width is the material.** The name is set in Anybody, a variable font with a 50–150 width axis, and the site's motion is built on that axis: things unfold, compress and open like slits and shutters rather than fading in. There is one signal colour, an electric-blue square, and it means one thing at a time:

1. **Punctuation.** The full stop in `KESHAV.` Press the name and the letters behave like rubber blocks: the pressed one narrows and the others widen, so the row's total width stays exactly constant.
2. **Aperture.** On scroll, the full stop grows into a window that shoves the compressing name off the left edge, then irises open onto the work.
3. **Cursor.** At the end, it leaves the name and becomes an insertion point on a new line: *What's next?*

Blue is reserved for identity and interaction. Verdicts and status use shape, hatching and words.

## The homepage

| | Encounter | What it shows |
| --- | --- | --- |
| 01 | Opening | Name, lede, the press interaction, the full-stop window |
| 02.1 | GST platform | Typographic. Responsibility moves across a write/read rule; 3,000ms+ retreats to a footnote and *under 15ms* lands |
| 02.2 | ReviewGraph | Spatial. The real auth-bypass fixture as a 3D graph you turn by pointer or arrow keys. *Base graph* reveals the callee the change removed |
| 02.3 | Temporal Compute | A 200-cell field resolving into 15 wins / 15 ties / 170 losses against EDF |
| 03 | The Commitment | FRONTIER exp-009. One line is a 132 ms verification. You set the saving you expect, lock it, then the measured ~8 ms resolves beneath, with its caveats |
| 04 · 05 | More work, writing | Hover-list project index; publication index |
| 06 | Closing | The square becomes a cursor; contact |

Case studies (`/work/*`) cover what each project does, why it exists, my actual part, how it's built, evidence, tradeoffs and where it stands, plus a maturity ledger checked against each repository. `/research` lists every registered experiment with its verdict, including the ones that failed or never ran.

## Stack

Next.js 16 (App Router, static export) · React 19 · strict TypeScript · GSAP + ScrollTrigger as the only motion owner · React Three Fiber, lazy-loaded for the one 3D scene · Tailwind 4 + CSS Modules · MDX via `next-mdx-remote-client`, with frontmatter validated by Zod · Vitest · Playwright + axe.

Server components by default. Motion lives in bounded client components and is cleaned up through `gsap.matchMedia`. With reduced motion, or without JS, every section is a plain, readable document: no pinning, no hidden content.

## Commands

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # static export to out/ (then flattens prefetch segment files)
pnpm start          # serves out/ on :4310
pnpm test           # unit tests: width conservation, springs, content integrity
pnpm test:e2e       # Playwright + axe on desktop and mobile (needs a build)
```

Capture scripts: `scripts/filmstrip.mjs`, `scripts/record.mjs`, `scripts/record-interactions.mjs`, `scripts/fps.mjs`.

## Content

`content/work/*.mdx`, `content/writing/*.mdx`, `content/research/*.json`. Every number on the site comes from these files, and they come from the project repositories and the earlier verified write-ups. When a fact can't be shown (employer code), the page says so.

See [docs/PROCESS.md](docs/PROCESS.md) for references, decisions and verification evidence.
