# Process notes

## References actually inspected

Scrolltide's component prompts and source are paid, so I didn't see any code. What I studied were the public preview videos, frame by frame (contact sheets built in the browser):

- **Scroll Index.** One project at a time, full-bleed, with a huge name across the middle and a thumbnail strip marking your place. This informed the first version of the work stage, later replaced (see below).
- **Image Tunnel.** Images on the walls of a corridor receding to a vanishing point. Studied for depth; not used.
- **Zoom Reveal.** An inline pill image between two words that grows into a full frame while the words are pushed aside. **Direct influence** on the full-stop window, which grows from the punctuation and shoves the name off-screen.
- **Showcase Card** and **Expanded Cards / Hover List.** Rows that open and reveal a description, with captions laid out once rather than reflowing. This shaped the project index rows.
- **Mesh Flow.** A pointer-weighted field. It informed the feel of the pressable name (local deformation, global conservation), not its look.

Planes (free components, docs read): **Scroll Stage**, whose idea of progress as position, with reduced motion flattening transforms but keeping position, is how every pinned section here degrades. **Cinematic Text**, whose reduced-motion rule (no split, single short fade) applies to the page titles.

No component code was copied from any library.

## Working with ChatGPT

Keshav asked Claude and ChatGPT to argue the direction through together. ChatGPT had written the original brief. Its critique changed the build:

- **Six identical project reveals became three different encounters plus an index.** The first version passed six data plates through one transition template; ChatGPT's point was that "by the fourth repetition the visitor knows the trick". It also argued that six equal stages imply six equal contributions. I pushed back on which three: ReviewGraph (sole author) is showcased and Loams (co-maintainer, no claimed subsystems) leads the index, by ChatGPT's own reasoning.
- **Blue stopped meaning "refuted".** It had been doing double duty as both identity and failure.
- **The GST showcase animates the relocation of work, not a shrinking number.** The line *"The writers maintain the state. The reader fetches one row."* came out of that exchange. There is no "200×" headline: no comparable benchmark methodology is published.
- **"Call it first" became The Commitment.** A width-based encounter with evidence, not a guessing game, with a visible skip, no score, and both caveats on the page. ChatGPT's claims about exp-009 were checked against `results/exp-009/README.md` in the FRONTIER repo before use.
- **The ending.** The full stop becomes a cursor, restrained, with a visible email link.

### Second round

Asked what to cut first, ChatGPT read the repository source (it could not play the preview) and named the "What I care about" section: its five statements explained qualities the showcases had just demonstrated. Cut. It also caught that section numbers ran backwards (02.3 → 04 → 02.4 → 03); they now run 01 → 06. One line survives, reworded to what the writing documents: *more than one of these failures returned HTTP 200*. My own pass in the same round removed a duplicate impact plate from the ReviewGraph case study.

The principle carried forward: once the work has demonstrated a quality, stop explaining it.

## Verification (run locally, 31 Oct 2026)

- `pnpm typecheck`, `pnpm lint`: clean.
- `pnpm test`: 16/16 (width conservation across press positions, spring settling, schema validation, internal links resolve, not-run experiments stay "not run", exp-009 figures match the data).
- `pnpm test:e2e`: 32/32 across desktop (1440×900) and mobile (Pixel 7). Every tested route: one `h1`, no console errors, no axe WCAG 2.1 AA violations, no horizontal overflow. Reduced-motion homepage is fully readable with no pinned runway. The Commitment works from the keyboard; skipping still shows the measurement. The theme persists. The base graph reveals the removed callee.
- Frame timing, scripted wheel-scroll through the homepage in headless Chromium: 56 fps average, p95 frame 16.8 ms, 1 frame over 50 ms. Indicative only; not a device benchmark.
- Bugs these checks caught and fixed: GSAP baking a stale pixel offset into stage names; writing frontmatter pointing at a renamed project slug; prefetch segment files the static host didn't serve; low-contrast tokens; a grid column forced wider than a phone by a code block.

Evidence in `docs/evidence/`: still frames (hero, GST final frame, ReviewGraph, the revealed Commitment), full-page filmstrips (light, dark, mobile), and two recordings (`walkthrough-light.mp4`, `interactions-dark.mp4`).

## Known gaps

- The 3D graph's labels are DOM overlays projected from the scene. On very small phones the outer labels can still sit close to the frame edge.
- Writing pages render code without syntax highlighting, by choice for now.
- No OG images were generated yet.

### Third round

Asked how to make the person more present without inventing anything, ChatGPT proposed one plain, unanimated line in the index: *I also built something that roasts your Spotify taste.* It's a small human interruption in a site otherwise about correctness. I checked the SonicMirror README before using the word: its tagline is "Your Music Taste Has a Personality. We Roast It." Its other conclusion stands as a boundary: the next layer of personal material has to come from Keshav, in his own words, not from project metadata.
