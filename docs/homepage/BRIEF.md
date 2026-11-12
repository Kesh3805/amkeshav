# Homepage — the engineering folio

ChatGPT's brief, 12 Nov 2026, in the "Creative Reference Breakdown" thread. Keshav saw the cinematic
"Infinite Index" homepage that afternoon and said it "looks like shit"; then: "i am kinda over the
extravagant UI designs can we smthg thats professional and nice". ChatGPT proposed "Quiet Intelligence".
Claude relayed two facts that sharpened it:

- **The 31 Oct homepage was also light and type-led, and Keshav called it slop.** His words: "not
  impressive", "why is ReviewGraph the central theme", "where is the scroll animation".
- **His own verdicts of 1 Nov.** He loved Making Software, Immersive Garden, Non-Objective: Time, Odd
  Works, Nothin' and OXMAN, and rejected Rauno and Teenage Engineering as too playful.

This is the answer, condensed. The cinematic homepage was never committed. Chamber 001 stays frozen at
`/prototype/unwritten/`, as FRONTIER's deep-dive.

**Decision:** an engineering folio, not a minimalist personal portfolio. The work is the visual
identity. Type sets hierarchy, the engineering drawings give character, motion reveals structure. It
must feel authored with every animation off.

## A. Hero

- **Copy:** his verified line, unchanged: "I build backends that have to be right, and run experiments
  that are allowed to be wrong." Nothing invented.
- **Desktop (12 columns):** the statement on four lines across 8 columns, with a subtle weight change
  between its two halves (not a colour). The right 4 columns hold "Two modes of work": Systems / right
  and Experiments / wrong, two registers split by one rule. Below the statement, an index row:
  Selected work ↓, Research ↓, Writing ↓.
- **Phone:** 20 px margins, the statement at 40 px, the registers beneath, the index as a list. Designed
  on its own, not scaled.

## B–C. Type, grid, colour

**Type:** IBM Plex Sans (voice) and JetBrains Mono (annotation). No Anybody, and no Newsreader as
display.

| Element | Desktop | Phone |
|---|---|---|
| Hero | 64 px | 40 px |
| Section | 36 px | 29 px |
| Project title | 27 px | 23 px |
| Body | 16 px | 15 px |
| Supporting | 14 px | 13 px |
| Mono labels | 11 px | 10 px |

**Grid:**

| Breakpoint | Columns | Margins | Gutters |
|---|---|---|---|
| Desktop | 12 | 48 px | 20 px (1,344 px max) |
| Tablet | 8 | 32 px | 16 px |
| Phone | 4 | 20 px | 12 px |

Sections sit 112–136 px apart on desktop and 72–88 px on phone.

**Colour:** ground `#F3F3EE`, ink `#191D1B`, secondary `#70756F` (built as `#676C66`: the original is 4.3:1 on the ground, under WCAG AA's 4.5), rules `#D5D7D0`, and one accent
`#315D8A`. The accent is a technical signal only: never a giant punctuation mark, a gradient, a card
background or a stripe.

## D. Selected work

Four equal previews, 2 × 2: GST, Loams, ReviewGraph, Temporal Compute. No project dominates, and
ReviewGraph is not the centrepiece. Each preview has the same structure:

- number and category
- title
- its verified summary
- the project's own drawing, at one viewport size
- "View case study →"

The previews differ in their drawings, not their components: GST's read model (3,000 ms → under
15 ms), Loams' crates, ReviewGraph's impact graph and Temporal Compute's tally. The other projects stay
reachable through the work index.

## E. Research and writing

- **Research:** FRONTIER featured, with the exp-009 nomogram as research evidence (not a product
  shot). Beside it, the research log: each program's open question, and dated entries with their
  recorded verdicts. No invented status labels.
- **Writing:** all five essays as a ruled list of title, description and date. No cards, no
  thumbnails.

## F. Motion budget

1. Drawings construct their linework on entering view (real SVG strokes only), then labels fade up.
2. Hover: the title takes the accent, the drawing shifts 2 px, the arrow moves. Nothing scales.
3. Sections rise 8–12 px into place. Nothing on screen at load is ever hidden.
4. Navigation state: an accent mark under the section in view.

**Forbidden:** loaders and intros; scroll-jacking and sideways sections; cursor-following 3D;
decorative WebGL; parallax everywhere; infinite loops; animated counters; typewriters; floating cards
and magnetic buttons; gradients, glows and glass; anything that hides content or slows reading.

## G. Case-study pages

Keep the content and the URLs. Then do a consistency pass:

- the homepage's tokens, type, grid and rules
- a standard header
- a drawing or evidence area per project
- consistent spacing and measure
- method, results and limits kept visible

Do not flatten structures that differ for good reason.

## H. Acceptance

Screenshots at 1440 × 900 and 390 × 844 with motion off, plus one desktop and one phone recording
with motion on. The checklist covers:

- **Composition:** a distinctive first screen, and four equally weighted, recognisably different
  drawings.
- **System:** consistent alignment, and the accent used sparingly.
- **Content:** nothing invented.
- **Function:** every URL resolves, nothing overflows at 390 px, reduced motion is respected, and no
  content is hidden behind animation.

**Quality gate:** before showing Keshav, compare it side by side with Making Software, Immersive
Garden, Non-Objective: Time, Odd Works and OXMAN, and ask three questions:

1. Is there a visual idea before you read?
2. Does the motion substantiate it?
3. Is it still authored with the motion removed?
