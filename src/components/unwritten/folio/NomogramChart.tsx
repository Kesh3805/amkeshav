"use client";

import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  CASES_FULL,
  centreX,
  clampK,
  describeK,
  fittedSaving,
  fromSvgY,
  kAtHeight,
  kHeight,
  pct,
  straightedge,
  toSvgY,
  type Fit,
  type Layout,
} from "./nomogram";
import s from "./Folio.module.css";

/*
  An alignment chart engraved on vellum. Left: the saving the cost model promised. Right: the saving the
  fitted wall-time model gives, on the same 0–100% mapping, so its whole range is a sliver at the foot.
  Centre: k, cases run before the first failure, linear (collinearity forces it; see nomogram.ts), with the
  1,020 failing candidates as a density rug. The brass straightedge is the one line through all three.
*/

const W = 560;
const H = 690;
const L: Layout = { left: 104, right: 456, top: 104, bottom: 616, t: 0.5 };
const CX = centreX(L);
const OVERHANG = 20;
const RULE_W = 13;
const RUG_MAX = 74; // px, for the tallest bin

const savingTicks = Array.from({ length: 21 }, (_, i) => i * 5); // %
const fineTicks = Array.from({ length: 9 }, (_, i) => i + 1); // 1–9 %, on the right only
const kLabels = [1, 25, 50, 75, 100, 125, 150, 175, 199];
const kMinor = Array.from({ length: 39 }, (_, i) => (i + 1) * 5).filter((k) => k % 25 !== 0);

export type NomogramProps = {
  fit: Fit;
  /** [k, count] for the failing candidates. */
  bins: [number, number][];
  total: number;
};

export function Nomogram({ fit, bins, total }: NomogramProps) {
  const [k, setK] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const titleId = useId();
  const se = straightedge(k, fit, L);
  const ky = (kk: number) => toSvgY(kHeight(kk, fit, L.t), L);
  const peak = Math.max(...bins.map(([, c]) => c));
  const [, peakCount] = bins.find(([, c]) => c === peak)!;

  const kFromEvent = useCallback(
    (e: PointerEvent) => {
      const svg = svgRef.current;
      const ctm = svg?.getScreenCTM();
      if (!svg || !ctm) return;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
      setK(clampK(kAtHeight(fromSvgY(p.y, L), fit, L.t)));
    },
    [fit],
  );

  const onDown = (e: PointerEvent<SVGElement>) => {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    kFromEvent(e);
  };
  const onMove = (e: PointerEvent<SVGElement>) => {
    if (dragging.current) kFromEvent(e);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (step !== undefined) setK((v) => clampK(v + step));
    else if (e.key === "Home") setK(1);
    else if (e.key === "End") setK(CASES_FULL);
    else return;
    e.preventDefault();
  };

  const ruleLen = se.length + 2 * OVERHANG;
  const gradTicks = Array.from({ length: Math.floor(ruleLen / 8) + 1 }, (_, i) => -ruleLen / 2 + i * 8);
  const rot = `translate(${se.pivot.x} ${se.pivot.y}) rotate(${se.angle})`;
  const r1 = toSvgY(se.fitted, L);

  return (
    <figure className={s.nomogram} aria-labelledby={titleId}>
      <div
        className={s.slider}
        role="slider"
        tabIndex={0}
        aria-label="Cases run before the first failure"
        aria-orientation="vertical"
        aria-valuemin={1}
        aria-valuemax={CASES_FULL}
        aria-valuenow={k}
        aria-valuetext={describeK(k, fit)}
        onKeyDown={onKey}
      >
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={s.chart} aria-hidden="true">
          <defs>
            <linearGradient id="nomo-brass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#AC8960" />
              <stop offset="1" stopColor="#7A5F3B" />
            </linearGradient>
            <filter id="nomo-shadow" x="-10%" y="-200%" width="120%" height="500%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>
          </defs>

          {/* Scale titles */}
          <g className={s.scaleTitle}>
            <text x={L.left} y={40} textAnchor="middle">
              Saving the
            </text>
            <text x={L.left} y={58} textAnchor="middle">
              model promised
            </text>
            <text x={CX} y={40} textAnchor="middle">
              Cases run before
            </text>
            <text x={CX} y={58} textAnchor="middle">
              the first failure, k
            </text>
            <text x={L.right} y={40} textAnchor="middle">
              Fitted wall-time
            </text>
            <text x={L.right} y={58} textAnchor="middle">
              saving
            </text>
          </g>
          <line className={s.rule} x1={24} x2={W - 24} y1={76} y2={76} />

          {/* Saving scales, left and right, identical mapping */}
          {[L.left, L.right].map((x, side) => {
            const dir = side === 0 ? -1 : 1;
            return (
              <g key={x}>
                <line className={s.axis} x1={x} x2={x} y1={L.top} y2={L.bottom} />
                {savingTicks.map((v) => {
                  const y = toSvgY(v / 100, L);
                  const major = v % 10 === 0;
                  return (
                    <g key={v}>
                      <line className={s.tick} x1={x} x2={x + dir * (major ? 9 : 5)} y1={y} y2={y} />
                      {major && (
                        <text className={s.num} x={x + dir * 14} y={y + 4} textAnchor={side === 0 ? "end" : "start"}>
                          {v}
                          {v === 100 ? "%" : ""}
                        </text>
                      )}
                    </g>
                  );
                })}
                {side === 1 &&
                  fineTicks.map((v) => {
                    const y = toSvgY(v / 100, L);
                    return <line key={v} className={s.tick} x1={x} x2={x + 3} y1={y} y2={y} />;
                  })}
              </g>
            );
          })}

          {/* The clock's whole range, k = 1…199 */}
          <g className={s.bracket}>
            <path d={`M ${L.right + 40} ${toSvgY(0, L)} h 4 V ${toSvgY(fittedSaving(1, fit), L)} h -4`} />
            <text className={s.note} x={L.right + 50} y={toSvgY(0.04, L) + 4}>
              all of it
            </text>
          </g>

          {/* k scale */}
          <line className={s.axis} x1={CX} x2={CX} y1={ky(1)} y2={ky(CASES_FULL)} />
          {kMinor.map((kk) => (
            <line key={kk} className={s.tick} x1={CX} x2={CX + 4} y1={ky(kk)} y2={ky(kk)} />
          ))}
          {kLabels.map((kk) => (
            <g key={kk}>
              <line className={s.tick} x1={CX} x2={CX + 9} y1={ky(kk)} y2={ky(kk)} />
              <text className={s.num} x={CX + 14} y={ky(kk) + 4}>
                {kk}
              </text>
            </g>
          ))}

          {/* The 1,020 failing candidates: one hairline per k, length ∝ √count */}
          <g className={s.rug}>
            {bins.map(([kk, c]) => (
              <line key={kk} x1={CX - 2} x2={CX - 2 - RUG_MAX * Math.sqrt(c / peak)} y1={ky(kk)} y2={ky(kk)} />
            ))}
          </g>
          <text className={s.note} x={CX - RUG_MAX - 8} y={ky(1) + 4} textAnchor="end">
            {peakCount}
          </text>
          {/* Legend above k = 1, right of the axis: the straightedge always slopes down to the right from a
              pivot at or below k = 1, so it never crosses this corner. */}
          <text className={s.legend} x={CX + 8} y={ky(1) - 46}>
            {total.toLocaleString("en")} failing candidates
          </text>
          <text className={s.legendSub} x={CX + 8} y={ky(1) - 28}>
            hairline per k, ∝ √count
          </text>

          {/* Straightedge: shadow first (offset in page space, so it tracks the rotation), then brass */}
          <g transform={`translate(${se.pivot.x + 2.5} ${se.pivot.y + 4.5}) rotate(${se.angle})`} opacity={0.32}>
            <rect x={-ruleLen / 2} y={0} width={ruleLen} height={RULE_W} fill="#141512" filter="url(#nomo-shadow)" />
          </g>
          <g
            className={s.straightedge}
            transform={rot}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <rect x={-ruleLen / 2} y={0} width={ruleLen} height={RULE_W} fill="url(#nomo-brass)" />
            <line className={s.bevelLight} x1={-ruleLen / 2} x2={ruleLen / 2} y1={0.6} y2={0.6} />
            <line className={s.bevelDark} x1={-ruleLen / 2} x2={ruleLen / 2} y1={RULE_W - 0.5} y2={RULE_W - 0.5} />
            {gradTicks.map((x, i) => (
              <line key={i} className={s.grad} x1={x} x2={x} y1={1.5} y2={i % 5 === 0 ? 7 : 4} />
            ))}
            {/* The reading edge, exact */}
            <line className={s.edge} x1={-ruleLen / 2} x2={ruleLen / 2} y1={0} y2={0} />
          </g>

          {/* Readings */}
          <circle className={s.reading} cx={se.left.x} cy={se.left.y} r={4} />
          <circle className={s.reading} cx={se.right.x} cy={r1} r={4} />
          <g className={s.pin} transform={`translate(${se.pivot.x} ${se.pivot.y})`}>
            <circle r={5.5} className={s.pinHead} />
            <circle r={2.4} className={s.pinRing} />
          </g>

          {/* Drag surface along the k scale */}
          <rect
            className={s.dragSurface}
            x={CX - RUG_MAX - 24}
            y={ky(1) - 12}
            width={RUG_MAX + 70}
            height={ky(CASES_FULL) - ky(1) + 24}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          />

          <line className={s.rule} x1={24} x2={W - 24} y1={H - 34} y2={H - 34} />
          <text className={s.foot} x={W / 2} y={H - 12} textAnchor="middle">
            Drag the straightedge along k · arrows, Page Up/Down, Home, End
          </text>
        </svg>
      </div>

      <dl className={s.readouts}>
        <div>
          <dt>Model promised</dt>
          <dd>{pct(se.modelled)}</dd>
        </div>
        <div>
          <dt>Cases run, k</dt>
          <dd>
            {k}
            <span className={s.of}> of {CASES_FULL}</span>
          </dd>
        </div>
        <div>
          <dt>Fitted wall-time</dt>
          <dd>{pct(se.fitted)}</dd>
        </div>
      </dl>
      <figcaption id={titleId} className={s.caption}>
        Fail-fast verification, per failing candidate. The charge counts cases run, so the model promises 1 − k/199.
        The clock pays {fit.fixedMs.toFixed(1)} ms before the first case and {fit.perCaseMs} ms per case after it.
      </figcaption>
    </figure>
  );
}
