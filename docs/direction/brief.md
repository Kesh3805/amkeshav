# Direction brief — three concepts

Grounded in `docs/research/` (5,659 sites, top tier in `top-tier.json`) and in what is verifiably true about Keshav's work. No visuals yet: each concept is an idea, the evidence that it works, and what a visitor actually does. Keshav picks one; only then does anything get designed.

Constraints every concept must meet, taken from the research:
- **A strong first frame with no GPU.** 30 of 67 award sites we captured showed a loader or a blank screen first.
- **An honest fallback.** Nothing to Watch and Fabian Tjoe-A-On are the models.
- **One governing idea**, not a stack of effects.
- **Nothing invented.** Every number on screen is published or measured, and anything reconstructed is labelled as such.

---

## A · The Lab Notebook

**The idea.** The site is Keshav's research notebook, and the experiments in it are runnable. Every project is written as *claim → prediction → method → result → what I'd change*, and the reader can push on it: flip an analysis fork and see whether the finding survives, or drag a number inside a sentence and watch the conclusion move.

**Why it fits.** He pre-registers experiments and keeps failures on the record. FRONTIER and Temporal Compute already publish hypotheses, gates, verdicts and limitations. No other portfolio type can show that discipline; this one makes it the interface.

**The visitor does X → Y → reveals Z.**
- On the FRONTIER page, the visitor switches between the modelled and measured cost of verification. Every downstream comparison re-computes, which shows why exp-009 invalidated the earlier savings.
- In a case study, the visitor drags the request rate in "status took 3,000 ms at peak". The derived-on-read cost climbs while the projection stays flat, which shows why the read model was inverted.

**Proof it works.** Explorable Multiverse Analyses, Tangle, Nutshell, Distill, Ciechanowski, Maggie Appleton's growth-stage garden.

**First frame.** A notebook page set in type: name, one line, and the current open question ("Does verifier-driven allocation still win once verification costs what it actually costs?"). There is no canvas.

**Fallback.** Everything is a readable document first. Interactions enhance claims that are already stated in prose.

**Risks.**
- It could read as academic or dry. The fix is voice, plus one signature runnable claim on the homepage.
- The runnable models must use only published numbers and must say so.

**Effort.** Medium. A small reactive-document engine plus a handful of bespoke explorables.

---

## B · The Running System

**The idea.** The site presents itself the way an engineer would look at a production system: as something running, with state you can observe. The homepage is a live, honest instrument. It shows its own real build and serve facts (route sizes, how it was built, when it was last deployed), and each case study becomes a trace you can scrub. GST's read path becomes a flame view that collapses from 3,000 ms to under 15 ms. ReviewGraph's impact analysis becomes a graph you can expand hop by hop.

**Why it fits.** His work is correctness under load, async pipelines, read models and observability. Perfetto- and speedscope-style views are his native language, and nobody else's portfolio speaks it.

**The visitor does X → Y → reveals Z.**
- The visitor brushes a time range on the GST trace. The spans re-aggregate, which shows that the old path spent its time reconstructing state, not reading it.
- The visitor stops a node in a Raft-style diagram of a queue hand-off. Jobs pile up under the wrong key prefix, which shows the BullMQ namespace bug from the incident write-up.

**Proof it works.** Perfetto, speedscope, The Secret Lives of Data: Raft, samwho's Load Balancing, Numbers Every Programmer Should Know, and Low-tech Magazine's live battery gauge (honest live state as identity).

**First frame.** One quiet live readout and the name: the page's own measured state, written as a sentence ("This page: 11 KB of HTML, built 2 h ago, served from Pages."), not a dashboard.

**Fallback.** Traces are static SVG first, and scrubbing enhances them.

**Risks.**
- It could slide into dashboard clutter. It needs strong art direction and very few instruments.
- Traces must be real measurements or clearly labelled reconstructions, because employer data stays private.

**Effort.** Medium–high. A trace and graph viewer for a few stories.

---

## C · The Ledger

**The idea.** The whole site is an append-only log. It is event-sourced the way his GST read model is. What you see first is the **projection**: who Keshav is now, computed from the events. Every project, experiment, failure and write-up is an event with a timestamp and a link to the previous one. The visitor can **replay**: scrub back through the log and watch the projection rebuild, including the experiments that failed. Nothing is ever deleted, only superseded, exactly like exp-003 being withdrawn in favour of exp-004.

**Why it fits.** It is his own architecture used as autobiography. Read models, event sourcing, FRONTIER's hash-chained event log, and "keep failures on the record" are one idea here, and the site's structure is the argument.

**The visitor does X → Y → reveals Z.**
- The visitor drags the replay head back to 2025. The projection recomputes (role, open questions, current work), which shows how the work and its questions changed.
- The visitor opens a superseded event. The entry and the event that replaced it appear side by side, which shows a mind changing on the record.

**Proof it works.** Lynn Fisher (iteration kept as an archive), XXIIVV, Universal Paperclips and A Dark Room (interfaces that grow from state), Henry Heffernan (a single governing fiction), and Library of Babel (addressability).

**First frame.** The projection set as a single typographic sheet, the current state of a person, with a hairline "replay" control and the event count. Pure type, instant.

**Fallback.** The projection is a normal page; the log is a normal list. Replay is enhancement.

**Risks.**
- The metaphor only lands if the replay is genuinely satisfying.
- It needs a dated event history. Most dates exist in the content; any that don't must be marked approximate.

**Effort.** Medium. An event model, a projection renderer and a replay control.

---

## How they differ

| | A · Lab Notebook | B · Running System | C · The Ledger |
| --- | --- | --- | --- |
| Lead quality | Research honesty | Systems mastery | Coherent identity |
| Governing mechanic | Push on a claim | Observe and scrub a system | Replay the record |
| Strongest proof site | Explorable Multiverse | Perfetto | Lynn Fisher × Paperclips |
| Biggest risk | Dry | Dashboard clutter | Metaphor must land |
| First frame | Notebook page | One live readout | Projection sheet |

They can borrow from one another. For example, C's event log could hold A's runnable claims. But one must lead.

---

## ChatGPT's critique (1 Nov 2026)

**Ranking: C → A → B. Kill B as the governing idea.**
- **B, "telemetry theatre".** A page reporting its own size doesn't tell anyone why Keshav is worth knowing. Its trace views survive only inside case studies backed by real measurements or clearly labelled reconstructions.
- **A, "simulated rigour".** The draft's request-rate slider on GST latency would fabricate a curve: we have two measured points (3,000 ms+ and under 15 ms), not a function. Observed measurements, analytical models, hypothetical scenarios and retrospective explanations must be visibly distinct. Architecture work has requirements, constraints and trade-offs, not hypotheses; don't force it into the experiment format.
- **C, "a glorified changelog".**
  - The reframe: a person cannot truthfully be computed from a project log. The governing principle becomes *the present is visible; the history behind it stays inspectable*.
  - The counter: an event belongs in the replay only if it changes the interpretation of something already seen.
  - Keep withdrawn, refuted, superseded and still-supported as distinct states.
  - Don't let event sourcing make the site GST-centred.
- **Combination.** C governs the narrative, A governs the evidence, and B is an occasional instrument, all under one rule: *every significant claim is traceable to what was known, observed or believed at the time.*
- **Factual gate for C.** It needs 12–20 meaningful, verifiably dated changes across several projects, including real reversals. If that isn't met, choose A.

## Gate check (done against `content/research/*.json`)

- **Count, passes.** There are 18 dated, interpretation-changing events with real reversals:
  - exp-003 was withdrawn and superseded by exp-004.
  - exp-008's modelled saving was refuted by exp-009's measurement.
  - TC-S1 failed all five gates, and Generation I was retired.
  - Offline gate v1 forced the baselines to be amended (v2).
  - TC-R1 was halted by review before running.
- **Span and breadth, fails today.** All 18 fall between 6 and 27 October 2026, in two research projects. Professional work has only coarse dates (internship Aug 2025, full-time May 2026), and all five write-ups are dated 25 Sep 2026.

**Implication.** C is the right mechanic *inside the research programmes* now. As the whole site's governing idea it is too thin until the record grows. By the gate's own rule, A leads site-wide, with C's replay used where the history is dense.

## Open questions for Keshav

1. *What should a stranger understand about you after 30 seconds?* How I reason · how my thinking changes · how I understand systems.
2. ChatGPT separately recommended a visual taste calibration before any direction is fixed: 40 visually exceptional sites inspected properly (on real GPU hardware), then Keshav judges 12 finalists. The worry is that conceptual originality and visual excellence are separate gates, and the project has drifted from visual ambition before.
