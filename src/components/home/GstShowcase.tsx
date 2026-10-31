"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import s from "./GstShowcase.module.css";

/*
  Production engineering as a transfer of responsibility. The page opens on the old burden: a
  monumental 3,000ms and a reader rebuilding status from both filings on every request. Scrolling
  moves the work across the rule — the sources go to the write side, one projection row appears,
  the old number retreats into a footnote, and the new one lands at its own size.
  The final frame is the composition; the motion only gets you there.
*/
export function GstShowcase() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current!;
        el.dataset.staged = "true";
        const q = (p: string) => el.querySelector<HTMLElement>(`[data-part="${p}"]`)!;
        const qa = (p: string) => el.querySelectorAll<HTMLElement>(`[data-part="${p}"]`);

        const big = q("big");
        const small = q("small");
        const read = q("readCol");
        const write = q("writeCol");

        // FLIP: the big number travels to where the footnote sits in the final layout.
        const flip = () => {
          gsap.set(big, { clearProps: "transform" });
          const a = big.getBoundingClientRect();
          const b = small.getBoundingClientRect();
          return { x: b.left - a.left, y: b.top - a.top, scale: b.height / a.height };
        };
        const shift = () => read.getBoundingClientRect().left - write.getBoundingClientRect().left;

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });

        tl.fromTo(q("rebuild"), { "--w": 130, scaleX: 1 }, { "--w": 50, scaleX: 0, duration: 0.2, ease: "power3.in" }, 0.12)
          .fromTo(qa("source"), { x: () => shift() }, { x: 0, duration: 0.25, stagger: 0.04 }, 0.22)
          .fromTo(q("emit"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.42)
          .fromTo(q("row"), { scaleX: 0 }, { scaleX: 1, duration: 0.2, ease: "power3.out" }, 0.44)
          .fromTo(q("select"), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.1 }, 0.58)
          .fromTo(big, { x: 0, y: 0, scale: 1 }, { x: () => flip().x, y: () => flip().y, scale: () => flip().scale, duration: 0.24, ease: "power3.inOut" }, 0.56)
          .fromTo(big, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.04 }, 0.8)
          .fromTo(small, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0.8)
          .fromTo(q("after"), { clipPath: "inset(0% 0% 100% 0%)", y: 40 }, { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.2, ease: "power3.out" }, 0.68)
          .fromTo(q("line"), { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.84)
          .set({}, {}, 1);

        return () => delete el.dataset.staged;
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className={s.section} aria-labelledby="gst-title" id="work-gst-platform">
      <div className={s.sticky}>
        <div className={s.top}>
          <span className="label">02.1 — Production</span>
          <span className="label">Returns status · jpteam / C1X Inc.</span>
        </div>

        <div className={s.head}>
          <h3 id="gst-title" className={s.title}>
            GST compliance &amp; document AI — primary contributor
          </h3>
          <p className={s.small} data-part="small">
            <span className="label">The old read path</span>
            <span className={s.smallNum}>3,000ms+</span>
            <span className="label">at peak load</span>
          </p>
        </div>

        <div className={s.hero}>
          <p className={s.big} data-part="big" aria-hidden>
            3,000ms+
          </p>
          <p className={s.after} data-part="after">
            <span className="label">The new read path</span>
            <span className={s.afterNum}>
              under&nbsp;15ms
            </span>
          </p>
        </div>

        <div className={s.rule} aria-label="Where the work happens">
          <div className={s.col} data-part="writeCol">
            <span className={`label ${s.colHead}`}>Write side</span>
            <span className={s.source} data-part="source">
              GSTR-1 writer
            </span>
            <span className={s.source} data-part="source">
              GSTR-3B writer
            </span>
            <span className={s.emit} data-part="emit">
              emit source-changed(account, gstin, period)
            </span>
          </div>
          <div className={s.row} data-part="row">
            <span className="label">one projection row · upserted</span>
          </div>
          <div className={s.col} data-part="readCol">
            <span className={`label ${s.colHead}`}>Read side</span>
            <span className={s.rebuild} data-part="rebuild" aria-hidden>
              rebuild status from both filings, per request
            </span>
            <span className={s.select} data-part="select">
              SELECT one row by key
            </span>
          </div>
        </div>

        <div className={s.line} data-part="line">
          <p className={s.quote}>The writers maintain the state. The reader fetches one row.</p>
          <div className={s.lineSide}>
            <span className="label">Event-maintained projection · bounded freshness lag</span>
            <Link href="/work/gst-platform" className={s.cta}>
              Case study →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
