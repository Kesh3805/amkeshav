"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import s from "./Research.module.css";

const OUTCOMES = [...Array(15).fill("win"), ...Array(15).fill("tie"), ...Array(170).fill("loss")] as const;

// A fixed shuffle so cells resolve in a scattered order rather than a sweep.
function order(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  let seed = 7;
  for (let i = n - 1; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TallyField() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current!;
        const cells = [...el.querySelectorAll<HTMLElement>("[data-part=field] [data-cell]")];
        const seq = order(cells.length);
        const counts = { win: el.querySelector("[data-count=win]")!, tie: el.querySelector("[data-count=tie]")!, loss: el.querySelector("[data-count=loss]")! };
        cells.forEach((c) => (c.dataset.on = "false"));
        let shown = -1;
        const render = (k: number) => {
          if (k === shown) return;
          shown = k;
          const tally = { win: 0, tie: 0, loss: 0 };
          seq.forEach((idx, i) => {
            const on = i < k;
            cells[idx].dataset.on = String(on);
            if (on) tally[cells[idx].dataset.cell as keyof typeof tally]++;
          });
          counts.win.textContent = String(tally.win);
          counts.tie.textContent = String(tally.tie);
          counts.loss.textContent = String(tally.loss);
        };
        render(0);
        const st = gsap.timeline({
          scrollTrigger: {
            trigger: el.querySelector("[data-part=field]"),
            start: "top 85%",
            end: "bottom 45%",
            scrub: true,
            onUpdate: (self) => render(Math.round(self.progress * cells.length)),
          },
        });
        return () => {
          st.kill();
          cells.forEach((c) => delete c.dataset.on);
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className={s.tally} aria-labelledby="tc-title" id="work-temporal-compute">
      <div className={s.top}>
        <span className="label">02.3 — Research</span>
        <span className="label">Temporal Compute · preregistered · TC-S1</span>
      </div>
      <div className={s.tallyGrid}>
        <div className={s.tallyCopy}>
          <h3 id="tc-title" className={s.tallyTitle}>
            The first scheduler lost.
          </h3>
          <p>
            The question: is computation worth more if you schedule it by <em>when its answer is still useful</em>, rather
            than by deadline? I froze the protocol, then ran 200 synthetic scenarios against EDF.
          </p>
          <p>
            It scored 5.07% less. Twelve sensitivity variants, all negative. Zero of five gates. The scheduler let 1,203
            jobs expire unstarted; EDF let 37.
          </p>
          <p>Generation I is retired and the result stays on the page. Generation II is registered and has not run.</p>
          <Link href="/work/temporal-compute" className={s.cta}>
            Case study →
          </Link>
        </div>
        <figure className={s.fieldWrap}>
          <div className={s.field} data-part="field" role="img" aria-label="200 scenarios against EDF: 15 wins, 15 ties, 170 losses, sorted by outcome.">
            {OUTCOMES.map((o, i) => (
              <span key={i} data-cell={o} className={s.cell} />
            ))}
          </div>
          <figcaption className={s.legend}>
            <span>
              <i className={s.cell} data-cell="win" data-on="true" /> wins <b data-count="win">15</b>
            </span>
            <span>
              <i className={s.cell} data-cell="tie" data-on="true" /> ties <b data-count="tie">15</b>
            </span>
            <span>
              <i className={s.cell} data-cell="loss" data-on="true" /> losses <b data-count="loss">170</b>
            </span>
            <span className={s.legendNote}>200 scenarios, sorted by outcome</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
