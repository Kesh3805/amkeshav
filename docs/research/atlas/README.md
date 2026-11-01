# Creative Direction Atlas

ChatGPT asked for a visual taste calibration: 40 visually exceptional sites inspected properly on real hardware, reduced to 12 finalists for Keshav to judge.
- Midway through, Keshav added: *clean and premium too, not just unique and special*. So 8 sites known for restraint and finish were added.
- After ChatGPT's cross-check, 7 more were captured, for 55 in total.

Research mode only: no concepts, no build.

**Start with `finalists-board.jpg`**, then `finalists/` (each finalist's first frame beside its best moments), then `clips/` (sped-up recordings).

## How each site was captured

`scripts/research/atlas-capture.mjs` runs on this machine's real GPU through Edge (Intel Iris Xe, D3D11 WebGL; no WebGPU adapter is available). Each site gets:
- a first frame at 4 s and a settled frame at 12 s;
- an attempt to pass any gate, declining cookies;
- a pointer sweep, a drag and four scroll steps;
- a two-second arrow-key hold;
- an iPhone 13 view, before and after scrolling;
- a desktop recording.

`sheet-<id>.jpg` shows all of these at once. Sites that stalled were retried with 20 s of extra wait.

## What we found

1. **Even on a real GPU, several of the 40 never showed their work to us.**
   - Fabian Tjoe-A-On froze at 069. It did better on 1 Nov in software GL, where it showed its no-WebGPU fallback instead.
   - Mathis Biabiany crept to 83 after 80 s; Voyage Azarien never loaded.
   - Cagdas Cecen failed with HTTP/2 errors.
   - Daiki Fujita and Messenger draw their Enter button inside the canvas. Our automation (and likely a screen reader) cannot find it, but a person can, so these are "interaction not traversed", not failures.
2. **Clean and premium sites have one thing in common: the first frame is already the design.** Exo Ape, Rauno, Making Software, Teenage Engineering, Linear and Kenta Toshikura all show their composition at 4 s. The spectacle sites mostly show a counter.
3. **The best sites marry premium and unique by giving the visitor's hand a material to work on**, rather than a film to watch:
   - plaster relief rising under the cursor (Immersive Garden);
   - a helmet wiped away to reveal the person (Lando Norris);
   - a globe of live stations you tune by dragging (Radio Garden).
4. **A committed fiction solves the loader problem.** Shader's CRT boot and Henry Heffernan's BIOS screen make waiting part of the story.
5. **The minimal-engineer template (Paco, Emil Kowalski) is the floor for "clean", not the ceiling.** It is perfectly finished and forgettable. Rauno shows that the same restraint can still be bold.

## The 12 finalists (version 2)

| # | Site | The governing idea |
| --- | --- | --- |
| 1 | Immersive Garden | Your cursor raises a white plaster relief out of a quiet page. |
| 2 | Making Software | A technical manual: one blueprint drawing language on white. |
| 3 | Non-Objective: Time | Hundreds of hand-drawn clocks, each a different idea of time. |
| 4 | Teenage Engineering | One object under a spotlight; its long shadow becomes a dry joke. |
| 5 | OXMAN | A research lab with authority: claim, team, specimen, number. |
| 6 | Rauno Freiberg | A sideways strip of exact white cards; Swiss restraint with one yellow. |
| 7 | Radio Garden | Two colours; the globe made of live stations is the whole interface. |
| 8 | Kenta Toshikura | Black and white; every project seen through one circular portal. |
| 9 | Henry Heffernan | An engineer's portfolio as a computer on a desk that you actually use. |
| 10 | Igloo Inc. | One material, ice, held through the whole scroll film. |
| 11 | Nothin' | A giant black wordmark on white, broken by one sculpted figure. |
| 12 | Odd Works | An exact grid carrying genuinely playful objects. |

Alternates: Shader, Non-Objective, Are.na, Exo Ape, Linear, Wodniack, Carter Ogunsola, Symphony of Vines, Ciechanowski, d/dt.

### How version 1 became version 2

ChatGPT cross-checked version 1 (`finalists-board-v1.jpg`). Its main point: a site can look expensive because its *subject* is expensive. Only design craft, and an idea that survives being applied to an engineer's real work, should decide this list. So we added a fifth axis, **subject independence**: does the quality survive once the celebrity, product, commissioned art or brand is removed?
- **Cut:**
  - Lando Norris (the reveal depends on a famous face);
  - Oryzo (an expensive product; Making Software already carries the drawing idea);
  - Shopify Renaissance (campaign budget);
  - Shader (a nostalgic company fiction would be costume on a person; Claude partly disagrees and keeps it as first alternate);
  - d/dt (a blank first frame breaks our own rule).
- **Added from ChatGPT's suggestions after capturing them:** Non-Objective: Time and OXMAN. Odd Works, Igloo and Nothin' came up from the shortlist.
- **ChatGPT's four standards:** Making Software for intellectual craft, Immersive Garden for tactile wonder, Teenage Engineering for confidence and personality, Radio Garden for conceptual originality.
- **Its closing principle:** *premium does not mean quiet everywhere, and unique does not mean strange everywhere.* For every site, `judgements.json` records what was visually compelling, what was derivative and what would translate to an individual engineer. The clichés are catalogued in `cliches.md`.

## Keshav's verdicts

Given on 1 Nov 2026 and recorded in `verdicts.json`.
- **Loved:** Immersive Garden, Making Software, Non-Objective: Time, Rauno, Nothin', Odd Works.
- **Not chosen:** Teenage Engineering, OXMAN, Radio Garden, Kenta Toshikura, Henry Heffernan, Igloo.
- **Rejected as a category:** "too playful".

**The pattern:**
- Every loved site sits on a light ground and is led by type, drawing or graphic form.
- None of the dark or cinematic picks was chosen.
- Where there is motion, it is one sculptural element answering the cursor on a quiet page.

**The tension to confirm:** he loved Nothin' and Odd Works yet rejected "too playful". The likely reading is graphic form yes, jokey tone no.

## Files

| File | What it is |
| --- | --- |
| `sites.json` | The 48 sites and why each was picked. |
| `<id>/` | Frames and a capture log per site. Recordings are gitignored. |
| `sheet-<id>.jpg` | Contact sheet per site. |
| `judgements.json` | Scores (visual, interaction, clean/premium, first frame, subject independence) and notes. |
| `finalists.json`, `finalists-board.jpg`, `finalists/`, `clips/` | The 12 finalists. |
| `cliches.md` | What to avoid, with the sites where each was seen. |
