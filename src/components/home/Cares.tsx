"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import s from "./Cares.module.css";

const items = [
  {
    head: "Being right under load, and under failure.",
    body: "Concurrency control, async pipelines, and the contracts between services. Most of the bugs I've learned the most from returned HTTP 200.",
  },
  {
    head: "Where the boundaries are.",
    body: "Between tenants. Between the write path and the read path. Between what a service promises and what it actually checks.",
  },
  {
    head: "When computation is worth doing.",
    body: "Whether an answer that arrives late is worth less, and whether a scheduler can act on that. So far, mine couldn't.",
  },
  {
    head: "How much checking a result needs.",
    body: "A verifier that's too weak accepts wrong answers. One that's too strong costs the yield you were trying to buy. I'd like to know where the line is.",
  },
  {
    head: "Writing it down before it runs.",
    body: "What the experiment is supposed to show, and what would count as failing. Then keeping the result on the page either way.",
  },
];

/* Read like a page: each line inks in as it reaches the reading line, and stays inked. */
export function Cares() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        root.current!.querySelectorAll<HTMLElement>("[data-ink]").forEach((el) => {
          gsap.fromTo(
            el,
            { "--ink-p": 0 },
            {
              "--ink-p": 1,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 82%", end: "top 48%", scrub: 0.4 },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className={s.section} aria-labelledby="cares-title">
      <div className={s.top}>
        <span className="label">03 — What I care about</span>
        <span className="label">In no particular order</span>
      </div>
      <h2 id="cares-title" className="sr-only">
        What I care about
      </h2>
      <ol className={s.list}>
        {items.map((it, i) => (
          <li key={it.head} className={s.item} data-ink>
            <span className={s.num} aria-hidden>
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className={s.head}>{it.head}</p>
            <p className={s.body}>{it.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
