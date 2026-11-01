"use client";

import { useRef, useState } from "react";
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
});

/*
  Three rendered worlds joined by one idea: light is the passage.
  Push through the lit counter of the K into the vault; dolly down the aisle to the one lit bay;
  go through its record into the test site, which pulls back from a single marker to all 200.
*/
export function Prototype() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

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

        const A = shot(0.547, 0.6, 1); // Threshold: the doorway in the K
        const B = shot(0.425, 0.566, 0); // Vault: the lit bay
        const C = shot(0.535, 0.55, 0); // Test Site: one marker, then all of them

        import("./depthStage").then(async ({ DepthStage }) => {
          if (dead) return;
          stage = new DepthStage(canvas);
          await stage.add(`${base}/prototype/threshold.jpg`, `${base}/prototype/threshold-depth.png`, A);
          await stage.add(`${base}/prototype/vault.jpg`, `${base}/prototype/vault-depth.png`, B);
          await stage.add(`${base}/prototype/field.jpg`, `${base}/prototype/field-depth.png`, C);
          if (dead) return stage.dispose();
          const fit = () => stage!.resize(canvas.clientWidth, canvas.clientHeight);
          fit();
          window.addEventListener("resize", fit);
          const loop = () => {
            stage!.render();
            raf = requestAnimationFrame(loop);
          };
          loop();
          setReady(true);
          ScrollTrigger.refresh();
        });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 1.1 },
        });

        // — Threshold: a slow push toward the doorway, then through it.
        tl.to(A, { zoom: 1.18, dolly: 0.22, shiftX: -0.01, duration: 1.6, ease: "power1.inOut" }, 0)
          .to(q("t1"), { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" }, 1.2)
          .to(A, { zoom: 10, dolly: 0.6, duration: 1.6, ease: "power3.in" }, 1.6)
          .to(A, { exposure: 5, duration: 0.9, ease: "power2.in" }, 2.3)
          // — The light falls away and the hall is there.
          .set(B, { opacity: 1, exposure: 5 }, 3.2)
          .set(A, { opacity: 0 }, 3.2)
          .to(B, { exposure: 1, duration: 0.7, ease: "power2.out" }, 3.2)
          .fromTo(B, { zoom: 1, dolly: 0 }, { zoom: 1.32, dolly: 1.15, duration: 2.2, ease: "power1.inOut" }, 3.3)
          .fromTo(q("v1"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 4.6)
          .to(q("v1"), { autoAlpha: 0, duration: 0.3 }, 5.9)
          // — Into the record.
          .to(B, { zoom: 9, duration: 0.9, ease: "power3.in" }, 5.6)
          .to(B, { exposure: 5, duration: 0.6, ease: "power2.in" }, 5.9)
          // — The test site, from one marker out to the whole field.
          .set(C, { opacity: 1, exposure: 5, zoom: 7 }, 6.5)
          .set(B, { opacity: 0 }, 6.5)
          .to(C, { exposure: 1, duration: 0.6, ease: "power2.out" }, 6.5)
          .to(C, { zoom: 1, duration: 2.4, ease: "power2.out" }, 6.5)
          .fromTo(q("f1"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, 8.3)
          .fromTo(q("f2"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 8.7)
          .set({}, {}, 10);

        return () => {
          dead = true;
          cancelAnimationFrame(raf);
          stage?.dispose();
        };
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.track} data-prototype>
      <div className={s.pin}>
        <canvas className={s.canvas} aria-hidden data-ready={ready || undefined} />

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

        {/* Without motion: the three frames as plain stills. */}
        <div className={s.stills}>
          <img src={`${base}/prototype/threshold.jpg`} alt="The name KESHAV as concrete architecture, a blue cube in the foreground." />
          <img src={`${base}/prototype/vault.jpg`} alt="A vast records hall with one bay pulled out and lit." />
          <img src={`${base}/prototype/field.jpg`} alt="200 survey markers seen from above: 170 fallen, 15 leaning, 15 standing." />
        </div>
      </div>
    </div>
  );
}
