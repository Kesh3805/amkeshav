"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { fixtureNodes } from "@/lib/fixture";
import s from "./GraphShowcase.module.css";

const GraphScene = dynamic(() => import("./GraphScene"), { ssr: false });

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/*
  The independent work, as a thing you can turn over. The fixture graph is small enough to hold in
  your hand; the one node that matters most only exists when you read the graph as it was before.
*/
export function GraphShowcase() {
  const root = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const labels = useRef<(HTMLElement | null)[]>([]);
  const drag = useRef({ x: 0.5, y: 0.18, vx: 0, vy: 0, active: false });
  const [base, setBase] = useState(false);
  const [live, setLive] = useState(false);
  const [still, setStill] = useState(false);
  const [colors, setColors] = useState({ ink: "#ecebe4", dim: "#77756e", signal: "#5c5fff" });

  // Mount WebGL only when the section is near the viewport.
  useEffect(() => {
    const el = root.current!;
    if (!webglOk()) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      setStill(matchMedia("(prefers-reduced-motion: reduce)").matches);
      setLive(true);
      io.disconnect();
    }, {
      rootMargin: "50% 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Follow the theme.
  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(root.current!);
      setColors({
        ink: cs.getPropertyValue("--plate-ink").trim(),
        dim: cs.getPropertyValue("--plate-dim").trim(),
        signal: cs.getPropertyValue("--signal").trim(),
      });
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || !live) return;
    let lx = 0;
    let ly = 0;
    const down = (e: PointerEvent) => {
      drag.current.active = true;
      lx = e.clientX;
      ly = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.active) return;
      const dx = (e.clientX - lx) * 0.008;
      const dy = (e.clientY - ly) * 0.006;
      drag.current.x += dx;
      drag.current.y += dy;
      drag.current.vx = dx;
      drag.current.vy = dy;
      lx = e.clientX;
      ly = e.clientY;
    };
    const up = () => (drag.current.active = false);
    const key = (e: KeyboardEvent) => {
      const step = 0.12;
      if (e.key === "ArrowLeft") drag.current.vx = -step;
      else if (e.key === "ArrowRight") drag.current.vx = step;
      else if (e.key === "ArrowUp") drag.current.vy = -step * 0.6;
      else if (e.key === "ArrowDown") drag.current.vy = step * 0.6;
      else return;
      e.preventDefault();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
    };
  }, [live]);

  return (
    <section ref={root} className={s.section} aria-labelledby="rg-title" id="work-reviewgraph">
      <div className={s.top}>
        <span className="label">02.2 — Independent</span>
        <span className="label">Sole author · Rust, TypeScript</span>
      </div>

      <div className={s.grid}>
        <div className={s.copy}>
          <h3 id="rg-title" className={s.title}>
            ReviewGraph
          </h3>
          <p className={s.lede}>A pull-request reviewer that reads the repository as a graph before it reads the diff.</p>
          <p>
            This is its golden fixture. A change swaps <code>permissionService.check(...)</code> for{" "}
            <code>user.role === &apos;admin&apos;</code>. One method becomes the seed; six elements are impacted; two decoys
            must stay out. Risk: <strong>0.993, critical</strong>.
          </p>
          <p>
            The most important node isn&apos;t in the code any more. You can only find it by reading the graph as it was{" "}
            <em>before</em>.
          </p>

          <div className={s.toggle} role="group" aria-label="Which graph to read">
            <button type="button" aria-pressed={!base} onClick={() => setBase(false)}>
              Head graph
            </button>
            <button type="button" aria-pressed={base} onClick={() => setBase(true)}>
              + Base graph
            </button>
          </div>

          <p className={s.honest}>
            Built: parsing, the code graph, diff → symbols, budgeted impact. Not built: the evidence verifier. It has not
            reviewed a real pull request end to end.
          </p>
          <Link href="/work/reviewgraph" className={s.cta}>
            Case study →
          </Link>
        </div>

        <div
          ref={stageRef}
          className={s.stage}
          data-live={live || undefined}
          tabIndex={live ? 0 : undefined}
          aria-label={live ? "Fixture graph. Drag, or use the arrow keys, to turn it." : undefined}
        >
          {live && <GraphScene base={base} colors={colors} labels={labels} drag={drag} still={still} />}
          <ul className={s.labels} aria-label="Nodes in the fixture graph">
            {fixtureNodes.map((n, i) => (
              <li
                key={n.id}
                ref={(el) => {
                  labels.current[i] = el;
                }}
                className={s.node}
                data-role={n.role}
                hidden={n.role === "removed" && !base && !live ? true : undefined}
              >
                <span className={s.nodeLabel}>{n.label}</span>
                <span className={s.nodeNote}>{n.note}</span>
              </li>
            ))}
          </ul>
          {live && <span className={`label ${s.hint}`}>Drag to turn · arrow keys</span>}
        </div>
      </div>
    </section>
  );
}
