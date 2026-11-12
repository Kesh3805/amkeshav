"use client";

import { useEffect } from "react";

/*
  The homepage's motion budget (docs/homepage/BRIEF.md §F), and nothing else:
  1. Drawing construction: a project drawing that enters the viewport draws its own linework (real SVG
     strokes only), then its labels fade up. Drawings already on screen at load are left complete.
  2. Hover lives in CSS (Home.module.css).
  3. Sections below the fold rise 10 px into place as they arrive. Content on screen at load never hides.
  4. Navigation state: the header link for the section in view takes the accent mark.
  Reduced motion skips 1 and 3 entirely. Without JavaScript the page is simply complete.
*/

const STROKES = "line, path, polyline, polygon, circle, rect, ellipse";

export function HomeMotion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;
    const observers: IntersectionObserver[] = [];

    if (!reduce) {
      // 3. Section reveal.
      const sections = [...document.querySelectorAll<HTMLElement>("[data-reveal]")].filter(below);
      sections.forEach((el) => el.setAttribute("data-reveal", "pending"));
      const reveal = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            e.target.setAttribute("data-reveal", "in");
            reveal.unobserve(e.target);
          }
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      sections.forEach((el) => reveal.observe(el));
      observers.push(reveal);

      // 1. Drawing construction.
      const drawings = [...document.querySelectorAll<HTMLElement>("[data-drawing]")].filter(below);
      const prepared = new Map<Element, { strokes: SVGGeometryElement[]; texts: SVGElement[] }>();
      for (const d of drawings) {
        const svg = d.querySelector("svg");
        if (!svg) continue;
        const strokes = [...svg.querySelectorAll<SVGGeometryElement>(STROKES)].filter((el) => {
          const cs = getComputedStyle(el);
          return cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0 && typeof el.getTotalLength === "function";
        });
        const texts = [...svg.querySelectorAll<SVGElement>("text")];
        for (const el of strokes) {
          const len = Math.max(1, el.getTotalLength());
          el.style.strokeDasharray = `${len}`;
          el.style.strokeDashoffset = `${len}`;
        }
        texts.forEach((t) => (t.style.opacity = "0"));
        prepared.set(d, { strokes, texts });
      }
      const draw = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const p = prepared.get(e.target);
            draw.unobserve(e.target);
            if (!p) continue;
            p.strokes.forEach((el, i) => {
              el.style.transition = `stroke-dashoffset 900ms cubic-bezier(0.4, 0, 0.2, 1) ${Math.min(i * 6, 500)}ms`;
              el.style.strokeDashoffset = "0";
            });
            p.texts.forEach((t) => {
              t.style.transition = "opacity 500ms ease 550ms";
              t.style.opacity = "";
            });
          }
        },
        { rootMargin: "0px 0px -10% 0px" },
      );
      prepared.forEach((_, d) => draw.observe(d));
      observers.push(draw);
    }

    // 4. Navigation state.
    const links = new Map(
      [...document.querySelectorAll<HTMLAnchorElement>("[data-nav]")].map((a) => [a.dataset.nav === "work" ? "work" : a.dataset.nav!, a]),
    );
    const sectionFor: Record<string, string> = { work: "work", research: "research", writing: "writing" };
    const state = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const a = links.get(sectionFor[e.target.id]);
          if (!a) continue;
          if (e.isIntersecting) a.setAttribute("data-current", "");
          else a.removeAttribute("data-current");
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    Object.keys(sectionFor).forEach((id) => {
      const el = document.getElementById(id);
      if (el) state.observe(el);
    });
    observers.push(state);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return null;
}
