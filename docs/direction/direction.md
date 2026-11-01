# Direction — The Drawing Set

Set 1 Nov 2026, after the atlas (`docs/research/atlas/`) and the taste-boundary study. Revised the same day after ChatGPT's critique, which gave it a conditional approval (summary at the end). Status: **proposed, awaiting Keshav's approval.** Nothing is designed or built from this until he approves it.

This supersedes the three Blender plates in `README.md` (Threshold, Vault, Field). They were dark, cinematic, 3D worlds: exactly the register Keshav passed over on the finalists board. The conceptual work in `brief.md` survives: the Lab Notebook leads site-wide, and the Ledger's replay is used only where dated history is dense.

## What the research settled

From Keshav's own verdicts and marks, not from our reading of trends:
- **Light ground, led by type, drawing or graphic form.** All six loved sites; none of the dark or cinematic ones.
- **Strong graphic authorship first. Motion should reveal, construct or substantiate the visual idea, not compete with it.** The working principle agreed with ChatGPT.
- **Arrival without waiting.** His earliest mark (Making Software, 2.2 s) was for a page that was simply already there.
- **Form being built is an extraordinary moment.** Clocks redrawing line by line, a wordmark wiping in, plaster growing flowers.
- **Documentary authority reads as sophisticated.** OXMAN flipped to "sophisticated" in motion: real material framed by one hairline circle.
- **Out:** colour leading the composition, sideways movement, motion that performs, wit as the personality. Rauno failed on all three at once.

What it did *not* settle: that colour, humour, cinematic movement or 3D are banned. "White background + ink + drawing animation" is not a formula Keshav approved. He approved intentional graphic authorship.

## The idea

**Make the hidden mechanism visible.** Each major piece of work gets one sheet: a drawing of how that work actually behaves, made in one graphic family on paper-white. The homepage is the cover sheet.

The drawings are not engineering drafting applied to software. Elevations and sections suit physical objects, not event sourcing or dependency graphs. Each mechanism gets the representation native to it:

| Sheet | What is drawn | Native form |
| --- | --- | --- |
| ReviewGraph | Review starts from a standing understanding of the repository, not from the patch | The repository graph, with changed symbols and the impact traversal reaching out from them |
| GST read model | The answer is maintained before anyone asks for it | Before and after: a read that asks every source, beside writers keeping one row current |
| FRONTIER | The verifier cost model, then the measurement that broke it | Model against measurement, with the confidence interval |
| Temporal Compute | Compute whose value depends on when it finishes | A time axis with decaying value; the scheduler losing to EDF |
| Loams | One subsystem Keshav can attribute and explain | To be chosen with Keshav |

What holds them together is the family: the same ink, line weights, type, annotation style and callouts. Not the same projection. If two sheets could swap titles, one of them has failed.

**Why this beats a typographic index.** His work is mechanisms. A drawing that makes a mechanism intelligible shows understanding; a beautiful list shows only taste.

## Three grammars, kept apart

ChatGPT rejected the first draft's "line type = how it is known" mapping, and it was right to:
- Real drafting conventions already mean something else (a dashed line is hidden geometry, not a hypothesis).
- How a thing is known and what it is are independent. A reconstructed architecture can carry a measured number. Encoding both in one stroke makes visitors learn a private notation before they can read the mechanism.

So the sheets use three separate grammars:

1. **Drawing grammar: what the system does.** Solid strokes for active paths, dashed for conditional or optional paths, thin leaders for annotations, circle callouts for detail. Consistent on every sheet.
2. **Evidence grammar: how we know.** A plain text label beside the claim itself, not in a legend:
   - MEASURED
   - MODELLED
   - RECONSTRUCTED
   - HYPOTHETICAL
   - PLANNED

   Each label carries its source and, where published, its scope.
   - Example: the GST label reads *measured at peak load, 3,000 ms+ before and under 15 ms after, as reported in the write-up; method not published*. The write-up itself says those are its only two measurements.
3. **Revision grammar: what changed.** Dated entries that distinguish SUPERSEDED, WITHDRAWN, REFUTED and CORRECTED.
   - The one accent colour marks a revision, not a failure.
   - A refuted hypothesis is a result, not a defect.
   - Only sheets with real dated history get revisions: today FRONTIER and Temporal Compute, with 18 events. Professional sheets carry no invented history.

Every drawing must read without hover and without studying a key first.

## The signature moment: the drawing changes its meaning

A line drawing itself is familiar motion-graphics language, and six of them in a row become predictable. Construction stays in the motion grammar, but it is not the signature.

The signature is one flagship sheet where the visitor watches a conclusion change for a real reason. On **FRONTIER**:
1. **The original model.** The drawing explains why stopping verification early was expected to save compute: **92.9%, modelled**.
2. **The measurement enters.** The fixed interpreter overhead the model left out appears in the drawing: about 120.5 ms per verification plus 0.05 ms per case, roughly 92% of a verification's cost.
3. **The conclusion changes.** The saving redraws to **6.4% measured, [5.1, 7.8]**, with its scope stated, and the revision is dated.

All figures are from `content/research/frontier.json` (exp-009). The visitor sees a technical conclusion change when measured evidence contradicts the original model. The correction is the interaction, not merely its subject (ChatGPT's wording, which replaced an unverifiable uniqueness claim). This is the Ledger idea at its most honest: one deep moment, not a site-wide replay.

Other sheets stay quiet and explanatory. There is no giant transition, camera fly-through, animated drafting machine or drawing intro.

## Visual system

- **Ground:** paper-white, not a blueprint. No blue background, no fake grid paper, no texture.
- **Ink:** near-black line work at two or three fixed weights.
- **One accent:** for revisions only. Chosen in the still test.
- **Type:**
  - a book serif for prose, because the sheets are read, not skimmed;
  - a technical sans or mono for labels, values and the title block;
  - the name set very large.
  Typefaces are chosen in the still test.
- **The circle callout:** opens a detail in place. It is a magnifier, so it is never the only interaction on a sheet that claims to be inspectable.

## The cover must already show the language

ChatGPT's sharpest point: a big name, a title block and a list of projects is the Index wearing drawing vocabulary. The first frame has to show *why this visual language exists* before anyone scrolls.

Two candidates for the still test:
- **A. Cover as index of drawings.** Each sheet appears in the index as its key drawing, small but complete and legible, beside its title and role. The first frame is the whole body of work, drawn.
- **B. Cover leads with the flagship.** The FRONTIER drawing appears complete at the model-versus-measurement state, with the name and a one-line statement. The index follows.

Either way, it is complete at first paint: no loader, no intro, no gate.

## Motion grammar

1. **Arrival.** Complete at first paint.
2. **Construction, secondary.** A sheet's drawing builds once, in the order the mechanism works, in about a second. It does not replay on scroll back.
3. **The flagship correction.** As described above. It is the only staged sequence on the site.
4. **The callout.** It opens its detail in place.
5. **Never:**
   - sideways scrolling;
   - colour that moves;
   - characters or bounce;
   - parallax for its own sake;
   - cursor followers.
   SonicMirror's humour stays in words.
6. **Reduced motion.** Sheets appear complete, and the flagship shows its states as a stacked sequence.

## Which work gets a sheet

Five sheets, ordered to show authorship, then depth, then research judgement:
1. **ReviewGraph.** Sole author.
   - Draw the mechanism.
   - Claim no review accuracy or scale that hasn't been measured.
2. **GST read model.** Primary contributor; employer work.
   - The architecture is redrawn from Keshav's own published write-up and labelled RECONSTRUCTED.
   - It is never presented as the operational diagram.
   - The BullMQ namespace incident becomes a detail on this sheet, not a sheet of its own.
3. **FRONTIER.** The flagship.
4. **Temporal Compute.** A preserved negative result. It is the only sheet about time, so it must not look like ReviewGraph with the boxes moved.
5. **Loams.** Co-maintainer. One subsystem Keshav can attribute, with what ships kept distinct from what is planned.

**Everything else goes in the text index, credited accurately.** That includes Ferite (docs site, deployment and brand: no mechanism sheet), the other professional work, the independent projects and the writing. The rule: importance alone does not earn a drawing. A project gets one only if it has a distinct visual explanation.

ChatGPT also proposed a sixth sheet, Kinetic, a public repository (`ostrium-labs/kinetic`, "programmable cinematography for engineering", v0.1 in development). It is not in `content/`, and nothing establishes Keshav's contribution to it, so it is left out unless he says what he built. ChatGPT agreed.

## Risks

- **A Making Software copy.** The likeness is the whole editorial register, not just the drawing angle. The difference has to come from the content: real systems, real evidence, a conclusion that changes. The test is whether a sheet could be mistaken for a page of theirs. If it could, it fails.
- **Documentation, not portfolio.** The risk is a beautifully typeset architecture site. The answer is the person on the cover, the serif voice, the one human line in the index, and plainly written revision notes.
- **Graph sameness.** Several mechanisms are graph-like. Layouts must differ because the mechanisms differ.
- **Every value must trace to `content/`.** This becomes a test, as the current build already tests exp-009's figures.

## The fallback: The Index

A purely typographic site: an exact grid of titles at a large size, the giant name as the only mark, and no drawings.

It should **not** win because it is easier. It wins only if the still test shows that the drawings are elegant illustrations placed beside explanations, or that they need legends to be understood.

## The next gate (only if approved)

A **still test**, judged with nothing moving, before any motion or build:
1. The cover, in both candidates (A and B), with two or three type pairings.
2. The GST sheet: mechanism, evidence labels, attribution.
3. The FRONTIER sheet: model against measurement, the interval, a dated revision.

Each is checked:
- at desktop and phone widths;
- in greyscale;
- without hover;
- without a legend.

If GST is excellent but FRONTIER looks like a flowchart with a key, the Drawing Set is not universal, and the Index or a hybrid comes back on the table. Keshav and ChatGPT judge the stills. Only then is motion prototyped.

## Decisions for Keshav

1. Approve the Drawing Set (with the Index as the fallback), or choose the Index now.
2. GST is employer work. Is a reconstruction drawn from your own published write-up acceptable on the site?
3. Which Loams subsystem can you attribute to yourself?
4. Did you build part of Kinetic (`ostrium-labs/kinetic`)? If so, what?

---

## ChatGPT's critique (1 Nov 2026)

**Verdict: conditional approval; the Drawing Set over the Index, but not unchanged.**
- **Honesty system rejected.** Separate the drawing, evidence and revision grammars; use explicit evidence labels beside claims; give measurements their context. Red is not a universal failure mark.
- **Don't force drafting conventions** onto non-spatial systems. The governing idea is *make the hidden mechanism visible*, not *make everything look like an engineering drawing*.
- **Stroke reveals are not a signature.** The signature should be one deeper moment where the drawing changes its meaning. It proposed FRONTIER's model-versus-measurement correction.
- **The cover must demonstrate the graphic system at first frame,** or it is just the Index.
- **The Making Software differentiation** must come from inspectable content, not from the projection angle.
- **Sheets:** ReviewGraph, GST (with confidentiality care), FRONTIER, Temporal Compute, Loams (one attributable subsystem). Ferite goes in the index. The BullMQ incident is a detail, not a sheet. (Its "Kinetic" suggestion could not be verified; see above.)
- **Widen the gate** to the cover, GST and FRONTIER, tested on mobile, in greyscale and without hover.
- **Closing line:** "The drawings must reveal how the work behaves, not merely demonstrate that Keshav knows how to draw software architecture beautifully."

**On the revision:** ChatGPT approved it for Keshav's decision, after one edit (the uniqueness claim, now replaced).

Checked before use: exp-009's 6.4% [5.1, 7.8] against 92.9% modelled, and TC-S1's 5.07% loss to EDF, against `content/research/*.json`.
