"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "@/lib/gsap";
import type { DepthStage, ShotState } from "./depthStage";
import s from "./Prototype.module.css";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const shot = (focalX: number, focalY: number, opacity: number): ShotState => ({
  zoom: 1,
  dolly: 0,
  shiftX: 0,
  shiftY: 0,
  exposure: 1,
  opacity,
  focalX,
  focalY,
  glow: 0,
  glowR: 0,
  glowX: focalX,
  glowY: focalY,
  mask: 0,
  maskR: 0,
  maskX: 0.5,
  maskY: 0.5,
});

// Screen points (origin top-left) that the choreography hangs on.
const DOORWAY = { x: 0.547, y: 0.6 };
const FAR_END = { x: 0.5, y: 0.43 };
const BAY = { x: 0.425, y: 0.566 };
const RECORD = { x: 0.45, y: 0.4 };
const MARKER = { x: 0.5, y: 0.55 };

/*
  Three rendered worlds, one rule: light comes from a visible source and carries you to the next.
  The K's doorway swells, then its light contracts into the far end of the vault. The one lit bay
  is approached, then entered; its record's light travels outward as a wavefront with the test site
  inside it. From one marker the camera rises to all 200.
*/
export function Prototype() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const el = root.current!;
        const canvas = el.querySelector<HTMLCanvasElement>("canvas")!;
        const q = (p: string) => el.querySelector<HTMLElement>(`[data-part="${p}"]`)!;
        let stage: DepthStage | null = null;
        let raf = 0;
        let dead = false;

        const A = shot(DOORWAY.x, DOORWAY.y, 1); // Threshold
        const B = shot(BAY.x, BAY.y, 0); // Vault, the hall
        const Bc = shot(RECORD.x, RECORD.y, 0); // Vault, at the bay
        const C = shot(MARKER.x, MARKER.y, 0); // Test site, one marker
        const Cf = shot(0.5, 0.5, 0); // Test site, the whole field
        const nav = { dark: 0 };

        const fail = () => {
          // Keep the stills: an empty stage is worse than no motion.
          delete el.dataset.live;
          ScrollTrigger.refresh();
        };

        import("./depthStage")
          .then(async ({ DepthStage }) => {
            if (dead) return;
            stage = new DepthStage(canvas);
            const p = (n: string) => [`${base}/prototype/${n}.jpg`, `${base}/prototype/${n}-depth.png`] as const;
            await stage.add(...p("threshold"), A);
            await stage.add(...p("vault"), B);
            await stage.add(...p("vault-close"), Bc);
            await stage.add(...p("field-close"), C);
            await stage.add(...p("field"), Cf);
            if (dead) return stage.dispose();
            const fit = () => stage!.resize(canvas.clientWidth, canvas.clientHeight);
            el.dataset.live = "true";
            fit();
            window.addEventListener("resize", fit);
            const loop = () => {
              stage!.render();
              el.style.setProperty("--nav-dark", String(nav.dark));
              raf = requestAnimationFrame(loop);
            };
            loop();
            ScrollTrigger.refresh();
          })
          .catch(fail);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 1.1 },
        });

        // — Threshold: toward the doorway, then the doorway's light swells around you.
        tl.to(A, { zoom: 1.22, dolly: 0.12, shiftX: -0.008, duration: 1.4, ease: "power1.inOut" }, 0)
          .to(q("t1"), { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" }, 1.1)
          .to(A, { zoom: 3.1, dolly: 0.22, duration: 1.6, ease: "power2.in" }, 1.2)
          .to(A, { glow: 1, glowR: 1.9, duration: 1.0, ease: "power2.in" }, 1.9)
          // — The light contracts into the far end of the hall: the doorway becomes the vault's distance.
          .set(B, { opacity: 1, mask: 1, maskR: 2.0, maskX: FAR_END.x, maskY: FAR_END.y, glow: 1, glowR: 2.0, glowX: FAR_END.x, glowY: FAR_END.y }, 2.9)
          .to(B, { maskR: 0, glowR: 0.06, duration: 0.9, ease: "power2.inOut" }, 2.9)
          .to(B, { glow: 0, duration: 0.5 }, 3.5)
          .set(A, { opacity: 0 }, 3.8)
          .set(B, { mask: 0 }, 3.8)
          // — Down the aisle toward the one lit bay.
          .to(B, { zoom: 1.36, dolly: 1.2, duration: 2.0, ease: "power1.inOut" }, 3.1)
          .fromTo(q("v1"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 4.1)
          .to(q("v1"), { autoAlpha: 0, duration: 0.3 }, 5.2)
          // — Arrive at the bay: the hall plate hands over to the close-up as the push continues.
          .to(B, { zoom: 1.75, duration: 0.6, ease: "power1.in" }, 5.1)
          .fromTo(Bc, { opacity: 0, zoom: 0.86 }, { opacity: 1, zoom: 1, duration: 0.6, ease: "power1.out" }, 5.2)
          .set(B, { opacity: 0 }, 5.85)
          .to(Bc, { zoom: 1.28, dolly: 0.35, duration: 1.2, ease: "power1.inOut" }, 5.8)
          // — The record's light rises, then travels outward with the test site inside it.
          .set(Bc, { glowX: RECORD.x, glowY: RECORD.y }, 5.8)
          .to(Bc, { glow: 1, glowR: 0.32, duration: 0.6, ease: "power2.in" }, 6.2)
          .set(C, { opacity: 1, mask: -1, maskR: 0, maskX: RECORD.x, maskY: RECORD.y, zoom: 1.18, glow: 1, glowR: 2.6, glowX: RECORD.x, glowY: RECORD.y }, 6.8)
          .to(C, { glow: 0, duration: 1.0, ease: "power1.inOut" }, 7.1)
          .to(Bc, { glowR: 2.4, duration: 0.9, ease: "power2.in" }, 6.8)
          .to(C, { maskR: 2.2, duration: 0.9, ease: "power2.in" }, 6.88)
          .set(Bc, { opacity: 0 }, 7.8)
          .set(C, { mask: 0 }, 7.8)
          .to(C, { zoom: 1, dolly: 0.25, duration: 1.0, ease: "power1.out" }, 6.9)
          // — The camera rises from one marker to the whole experiment.
          .to(nav, { dark: 1, duration: 0.3 }, 7.0)
          .to(C, { zoom: 0.8, shiftY: 0.05, duration: 0.9, ease: "power1.in" }, 7.9)
          .fromTo(Cf, { opacity: 0, zoom: 1.4 }, { opacity: 1, zoom: 1.12, duration: 0.45, ease: "power1.out" }, 8.35)
          .set(C, { opacity: 0 }, 8.82)
          .to(Cf, { zoom: 1, duration: 0.8, ease: "power2.out" }, 8.9)
          .fromTo(q("f1"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 9.1)
          .fromTo(q("f2"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 9.4)
          .set({}, {}, 10.4);

        return () => {
          dead = true;
          cancelAnimationFrame(raf);
          stage?.dispose();
          delete el.dataset.live;
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.track} data-prototype>
      <div className={s.pin}>
        <canvas className={s.canvas} aria-hidden />

        <div className={s.overlay}>
          <div className={s.nav}>
            <span className={s.mark}>
              KESHAV<i />
            </span>
            <span className="label">Prototype · scroll</span>
          </div>

          <div className={`${s.t1} ${s.light}`} data-part="t1">
            <p className={s.lede}>
              I build backends that have to be right, and run experiments that are <em>allowed to be wrong.</em>
            </p>
            <span className="label">Software engineer · jpteam / C1X · Ostrium Labs</span>
          </div>

          <div className={`${s.v1} ${s.light}`} data-part="v1">
            <span className="label">02 — Production · GST compliance &amp; document AI</span>
            <p className={s.sentence}>
              The writers maintain the state.
              <br />
              The reader fetches one row.
            </p>
            <span className="label">Returns status at peak · 3,000ms+ → under 15ms</span>
          </div>

          <div className={`${s.f1} ${s.dark}`} data-part="f1">
            <span className="label">03 — Research · Temporal Compute</span>
            <p className={s.title}>The first scheduler lost.</p>
            <p className={s.sub}>200 scenarios against EDF, protocol frozen before the run. One marker each.</p>
          </div>
          <div className={`${s.f2} ${s.dark}`} data-part="f2">
            <span className="label">Standing · 15 won</span>
            <span className="label">Leaning · 15 tied</span>
            <span className="label">Down · 170 lost</span>
          </div>
        </div>

        {/* Until the stage is running — or if it can't — the three frames as plain stills. */}
        <div className={s.stills}>
          <img src={`${base}/prototype/threshold.jpg`} alt="The name KESHAV as concrete architecture, a blue cube in the foreground." />
          <img src={`${base}/prototype/vault.jpg`} alt="A vast records hall with one bay pulled out and lit." />
          <img src={`${base}/prototype/field.jpg`} alt="200 survey markers seen from above: 170 fallen, 15 leaning, 15 standing." />
        </div>
      </div>
    </div>
  );
}
