"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { site } from "@/lib/site";
import s from "./Closing.module.css";

/*
  The full stop's third meaning. It opened as punctuation, became the window into the work, and
  ends by leaving the name for a new line — an insertion point, with something left to write.
*/
export function Closing() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current!;
        const dot = el.querySelector<HTMLElement>("[data-part=dot]")!;
        const caret = el.querySelector<HTMLElement>("[data-part=caret]")!;
        const rest = el.querySelectorAll<HTMLElement>("[data-part=rest]");
        el.dataset.staged = "true";

        const tl = gsap.timeline({ paused: true });
        tl.add(() => {
          const a = dot.getBoundingClientRect();
          const b = caret.getBoundingClientRect();
          gsap.set(dot, { transformOrigin: "0 0" });
          gsap
            .timeline()
            .to(dot, { y: -a.height * 0.5, duration: 0.18, ease: "power2.out" })
            .to(dot, {
              x: b.left - a.left,
              y: b.top - a.top,
              scaleX: b.width / a.width,
              scaleY: b.height / a.height,
              duration: 0.62,
              ease: "power3.inOut",
            })
            .set(dot, { autoAlpha: 0 })
            .set(caret, { autoAlpha: 1 })
            .fromTo(rest, { autoAlpha: 0, x: -14 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.06, ease: "power2.out" }, "-=0.05");
        });

        const st = gsap.timeline({
          scrollTrigger: { trigger: el, start: "top 45%", once: true, onEnter: () => tl.play() },
        });
        return () => {
          st.kill();
          delete el.dataset.staged;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className={s.section} aria-labelledby="close-title" id="contact">
      <div className={s.top}>
        <span className="label">06 — Keshav</span>
        <span className="label">The work so far</span>
      </div>

      <p className={s.name} aria-hidden>
        KESHAV<span className={s.dot} data-part="dot" />
      </p>

      <div className={s.next}>
        <h2 id="close-title" className={s.line}>
          <span className={s.caret} data-part="caret" aria-hidden />
          <span data-part="rest">What&apos;s next?</span>
        </h2>
        <p className={s.ask} data-part="rest">
          Found an error in something here, or something worth building? Write to me.
        </p>
        <a className={s.mail} href={`mailto:${site.email}`} data-part="rest">
          {site.email}
        </a>
        <ul className={s.links} data-part="rest">
          <li>
            <a href={site.github} className="link">
              GitHub
            </a>
          </li>
          <li>
            <a href={site.linkedin} className="link">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={site.ostrium} className="link">
              Ostrium Labs
            </a>
          </li>
          <li>
            <Link href="/about" className="link">
              About
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
