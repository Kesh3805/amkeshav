"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { gsap } from "@/lib/gsap";
import s from "./Research.module.css";

/*
  FRONTIER exp-009, as an encounter. One line is a full verification of a failing candidate.
  You set how much of it you expect early stop to remove, and lock it before you see the measurement.
  The drama is how little of the line the real saving occupies.
*/

const FULL_MS = 132; // mean full verification of a FAIL candidate, rounded (131.8 ms)
const MEASURED = 6.4; // % saved, 95% CI [5.1, 7.8]
const MODEL = 92.9; // % the charge model said it would save
const OVERHEAD = 92; // % of a full verification that is fixed overhead, [86, 97]

export function Commitment() {
  const root = useRef<HTMLElement>(null);
  const [guess, setGuess] = useState(50);
  const [phase, setPhase] = useState<"call" | "locked" | "skipped">("call");
  const id = useId();
  const revealed = phase !== "call";

  const reveal = (how: "locked" | "skipped") => {
    setPhase(how);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      const el = root.current!;
      const parts = el.querySelectorAll("[data-measure]");
      if (reduce) return;
      gsap.fromTo(
        parts,
        { "--grow": 0 },
        { "--grow": 1, duration: 1.1, ease: "power3.inOut", stagger: 0.18 },
      );
      gsap.fromTo(el.querySelectorAll("[data-after]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.9, stagger: 0.08 });
    });
  };

  return (
    <section ref={root} className={s.commit} aria-labelledby={`${id}-t`} id="commitment">
      <div className={s.top}>
        <span className="label">03 — The commitment</span>
        <span className="label">FRONTIER · exp-009</span>
      </div>

      <div className={s.commitHead}>
        <h2 id={`${id}-t`} className={s.commitTitle}>
          Call it first.
        </h2>
        <div className={s.commitSetup}>
          <p>
            In FRONTIER, a verifier decides whether an attempt counts. When a candidate is wrong, the verifier can stop at
            the first failing check instead of running all 199. The cost model said that saves <strong>{MODEL}%</strong>{" "}
            of the time.
          </p>
          <p>
            <strong>Before you look:</strong> how much of a real verification did early stop remove, when it was timed?
          </p>
        </div>
      </div>

      <div className={s.instrument}>
        <div className={s.lineLabel}>
          <span className="label">One full verification · {FULL_MS} ms</span>
          <span className="label" aria-live="polite">
            {revealed && phase === "skipped" ? "No call made" : `Your call: ${guess}% saved`}
          </span>
        </div>

        <div className={s.line} data-revealed={revealed || undefined}>
          <div className={s.lineKept} style={{ width: `${100 - guess}%` }} />
          <div className={s.lineSaved} style={{ width: `${guess}%` }} data-skipped={phase === "skipped" || undefined} />
          <span className={s.modelMark} style={{ left: `${100 - MODEL}%` }} aria-hidden>
            <span className="label">model · {MODEL}%</span>
          </span>
          <label className="sr-only" htmlFor={`${id}-r`}>
            Your prediction: percent of verification time saved
          </label>
          <input
            id={`${id}-r`}
            className={s.range}
            type="range"
            min={0}
            max={100}
            step={1}
            value={guess}
            disabled={revealed}
            onChange={(e) => setGuess(Number(e.target.value))}
            aria-valuetext={`${guess} percent saved`}
          />
        </div>

        {!revealed ? (
          <div className={s.actions}>
            <button type="button" className={s.lock} onClick={() => reveal("locked")}>
              Lock it in
            </button>
            <button type="button" className={s.skip} onClick={() => reveal("skipped")}>
              Skip — show the measurement
            </button>
            <span className={s.hint}>Drag the edge of the line, or use the arrow keys.</span>
          </div>
        ) : (
          <div className={s.measured}>
            <div className={s.lineLabel}>
              <span className="label">Measured · 1,020 failing candidates × 3 repetitions</span>
              <span className="label">
                {MEASURED}% saved · 95% CI 5.1–7.8
              </span>
            </div>
            <div className={s.line}>
              <div className={s.overhead} data-measure style={{ width: `${OVERHEAD}%` }}>
                <span className="label">fixed overhead · process start-up, input generation, harness</span>
              </div>
              <div className={s.work} data-measure style={{ width: `${100 - OVERHEAD - MEASURED}%` }} />
              <div className={s.realSaved} data-measure style={{ width: `${MEASURED}%` }} />
            </div>
            <div className={s.after}>
              <p data-after>
                About <strong>8 ms of 132</strong>. Half the failing candidates fail on their very first check, and stopping
                there still saves almost nothing, because about {OVERHEAD}% of a verification is fixed cost early stop
                can&apos;t touch. The model charged nothing for that overhead.
              </p>
              <p data-after>
                So every earlier result that leaned on the modelled saving has to be re-run under measured costs. That&apos;s
                the next experiment.
              </p>
              <p data-after className={s.caveat}>
                One Windows host, non-LLM DSL candidates. Not confirmatory: its predictions were informed by a disclosed
                smoke run. Verdicts were identical in both modes.
              </p>
              <p data-after className={s.links}>
                <Link href="/research" className="link">
                  Every experiment, including the ones that failed
                </Link>
                <Link href="/work/frontier" className="link">
                  FRONTIER case study
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
