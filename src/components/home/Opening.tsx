"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import {
  WDTH_MAX,
  WDTH_MIN,
  conserve,
  fitModel,
  influence,
  rowWidth,
  spring,
  type GlyphModel,
} from "@/lib/material";
import s from "./Opening.module.css";

const LETTERS = ["K", "E", "S", "H", "A", "V"];
const REST = 96;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function Opening({ names, more }: { names: string[]; more: number }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = root.current!;
      const row = section.querySelector<HTMLElement>(`[data-part="name"]`)!;
      const letters = [...section.querySelectorAll<HTMLElement>(`[data-part="letter"]`)];
      const dot = section.querySelector<HTMLElement>(`[data-part="dot"]`)!;
      const win = section.querySelector<HTMLElement>(`[data-part="window"]`)!;
      const wash = section.querySelector<HTMLElement>(`[data-part="wash"]`)!;
      const card = section.querySelector<HTMLElement>(`[data-part="card"]`)!;
      const cardTitle = section.querySelector<HTMLElement>(`[data-part="cardTitle"]`)!;
      const copy = section.querySelectorAll<HTMLElement>(`[data-part="reveal"]`);

      const n = letters.length;
      let models: GlyphModel[] = [];
      let centres: number[] = [];
      let restWidth = 0;
      const value = new Array(n).fill(REST);
      const vel = new Array(n).fill(0);
      let ready = false;

      const pointer = { x: 0, inside: false, down: false, depth: 0, depthV: 0 };
      const scroll = { p: 0 };
      const mm = gsap.matchMedia();

      const setWdth = (el: HTMLElement, v: number) => {
        el.style.fontVariationSettings = `"wdth" ${v.toFixed(2)}`;
      };

      // Measure each glyph at both ends of the wdth axis; widths are linear enough in between.
      function measure() {
        const lo = letters.map((el) => (setWdth(el, WDTH_MIN), el.getBoundingClientRect().width));
        const hi = letters.map((el) => (setWdth(el, WDTH_MAX), el.getBoundingClientRect().width));
        models = lo.map((w, i) => fitModel(w, hi[i]));
        letters.forEach((el, i) => setWdth(el, value[i]));
        restWidth = rowWidth(models, new Array(n).fill(REST));
        let x = 0;
        centres = models.map((m) => {
          const w = m.a + m.b * REST;
          const c = x + w / 2;
          x += w;
          return c;
        });
      }

      // Size the name so the row at rest spans the measure exactly.
      function fit() {
        const avail = row.parentElement!.clientWidth;
        const current = parseFloat(getComputedStyle(row).fontSize);
        letters.forEach((el) => setWdth(el, REST));
        const used = letters.reduce((w, el) => w + el.getBoundingClientRect().width, 0) + dot.getBoundingClientRect().width * 1.25;
        const size = current * (avail / used);
        row.style.fontSize = `${size}px`;
        measure();
      }

      let geometry = { top: 0, left: 0, right: 0, bottom: 0, rowLeft: 0, gap: 0 };
      function readGeometry() {
        const sb = section.querySelector<HTMLElement>(`[data-part="sticky"]`)!.getBoundingClientRect();
        const prev = row.style.transform;
        row.style.transform = "none";
        const db = dot.getBoundingClientRect();
        const rb = row.getBoundingClientRect();
        row.style.transform = prev;
        const left = db.left - sb.left;
        const rowLeft = rb.left - sb.left;
        geometry = {
          top: db.top - sb.top,
          left,
          right: sb.right - db.right,
          bottom: sb.bottom - db.bottom,
          rowLeft,
          gap: left - (rowLeft + restWidth),
        };
      }

      const start = () => {
        if (ready) return;
        ready = true;
        section.dataset.ready = "true";
        fit();
        readGeometry();
      };

      document.fonts.ready.then(() => {
        // Let the CSS entrance finish before physics takes over the same property.
        const last = letters[n - 1];
        const done = () => start();
        last.addEventListener("animationend", done, { once: true });
        gsap.delayedCall(1.9, done);
      });

      const onMove = (e: PointerEvent) => {
        const b = row.getBoundingClientRect();
        pointer.x = e.clientX - b.left;
        pointer.inside = true;
      };
      const onLeave = () => {
        pointer.inside = false;
        pointer.down = false;
      };
      const onDown = (e: PointerEvent) => {
        onMove(e);
        pointer.down = true;
      };
      const onUp = () => (pointer.down = false);

      row.addEventListener("pointermove", onMove);
      row.addEventListener("pointerleave", onLeave);
      row.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);

      const onResize = () => {
        if (!ready) return;
        fit();
        readGeometry();
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", onResize);

      const tick = (_t: number, deltaMs: number) => {
        if (!ready) return;
        const dt = Math.min(deltaMs, 40) / 1000;

        // Press depth springs toward hover (0.55) or press (1); release overshoots on the way back.
        const targetDepth = pointer.inside ? (pointer.down ? 1 : 0.55) : 0;
        [pointer.depth, pointer.depthV] = spring(pointer.depth, pointer.depthV, targetDepth, 170, 14, dt);

        const radius = (restWidth / n) * 0.75;
        const press = pointer.depth > 0.001 ? influence(centres, pointer.x, radius) : new Array(n).fill(0);
        const resting = conserve(models, REST, press, Math.max(0, Math.min(1.15, pointer.depth)));

        const squeeze = smooth(0.02, 0.62, scroll.p);
        for (let i = 0; i < n; i++) {
          const target = resting[i] + (WDTH_MIN - resting[i]) * squeeze;
          [value[i], vel[i]] = spring(value[i], vel[i], target, 210, 17, dt);
          setWdth(letters[i], Math.max(WDTH_MIN, Math.min(WDTH_MAX, value[i])));
        }

        // The full stop opens into a window and shoves the name ahead of its left edge.
        const g = smooth(0.06, 0.84, scroll.p);
        const { top, left, right, bottom } = geometry;
        win.style.clipPath = `inset(${top * (1 - g)}px ${right * (1 - g)}px ${bottom * (1 - g)}px ${left * (1 - g)}px)`;
        win.style.visibility = scroll.p > 0.001 ? "visible" : "hidden";
        dot.style.visibility = scroll.p > 0.001 ? "hidden" : "visible";

        // Keep the letters' right end a fixed gap ahead of the window's left edge.
        const edge = left * (1 - g);
        const width = rowWidth(models, value);
        const shove = scroll.p > 0.001 ? edge - geometry.gap - (geometry.rowLeft + width) : 0;
        row.style.transform = `translate3d(${Math.min(0, shove).toFixed(2)}px,0,0)`;

        // A second aperture: the dark plate irises open inside the blue.
        const iris = smooth(0.4, 0.86, scroll.p);
        const ih = 50 * (1 - iris);
        wash.style.clipPath = `inset(${ih}% ${ih}% ${ih}% ${ih}%)`;
        const c = smooth(0.5, 0.92, scroll.p);
        card.style.opacity = String(c);
        card.style.transform = `scale(${0.94 + 0.06 * c})`;
        setWdth(cardTitle, WDTH_MIN + (110 - WDTH_MIN) * c);
      };
      gsap.ticker.add(tick);

      mm.add(MOTION_OK, () => {
        gsap.to(scroll, {
          p: 1,
          ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6 },
        });
        gsap.to(copy, {
          yPercent: -110,
          ease: "power2.in",
          stagger: 0.04,
          scrollTrigger: { trigger: section, start: "top top", end: "18% top", scrub: 0.4 },
        });
      });

      return () => {
        gsap.ticker.remove(tick);
        mm.revert();
        row.removeEventListener("pointermove", onMove);
        row.removeEventListener("pointerleave", onLeave);
        row.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("resize", onResize);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} className={s.opening} aria-labelledby="name">
      <div className={s.sticky} data-part="sticky">
        <div className={s.top}>
          <span className="label">01 — Keshav</span>
          <span className="label">Software engineer</span>
        </div>

        <div className={s.copy}>
          <p className={s.lede}>
            <span className={s.line}>
              <span className={s.reveal} data-part="reveal">I build backends that have to be right,</span>
            </span>{" "}
            <span className={s.line}>
              <span className={s.reveal} data-part="reveal">
                and run experiments that are <em>allowed to be wrong.</em>
              </span>
            </span>
          </p>
          <p className={s.sub}>
            <span className={s.line}>
              <span className={s.reveal} data-part="reveal">
                Production systems at jpteam / C1X. Open-source data infrastructure at Ostrium Labs. Research I
                write down before it runs — and leave on the page when it fails.
              </span>
            </span>
          </p>
        </div>

        <div className={s.nameWrap}>
          <h1 id="name" className={s.name} data-part="name" aria-label="Keshav.">
            {LETTERS.map((l, i) => (
              <span key={i} className={s.letter} data-part="letter" style={{ "--i": i } as React.CSSProperties} aria-hidden>
                {l}
              </span>
            ))}
            <span className={s.dot} data-part="dot" aria-hidden />
          </h1>
        </div>

        <div className={s.foot}>
          <span className="label">Press the name.</span>
          <span className="label">Scroll — the full stop opens</span>
        </div>

        <div className={s.window} data-part="window" aria-hidden>
          <div className={s.wash} data-part="wash">
          <div className={s.card} data-part="card">
            <span className="label">02 — Selected work</span>
            <p className={s.cardTitle} data-part="cardTitle">Selected work</p>
            <ol className={s.cardList}>
              {names.map((name, i) => (
                <li key={name} className="label">
                  {String(i + 1).padStart(2, "0")} {name}
                </li>
              ))}
              <li className="label">+ {more} more</li>
            </ol>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
