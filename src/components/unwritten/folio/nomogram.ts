/*
  The exp-009 nomogram, as pure math. No React, no DOM: testable in node.

  Two savings, both linear in k (cases run before the first failure, of n = 199):
    modelled  m(k) = 1 − k/n                          what the cost model promised (charge ∝ cases run)
    fitted    r(k) = b·(n − k) / (a + b·n)            what the fitted wall-time model gives (a fixed ms + b ms per case)

  Layout (a parallel-scale alignment chart): left = modelled saving, right = fitted saving, both 0–100% on
  the same height and the same mapping; the k scale sits between them at fraction t of the gap. A straight
  line through m(k) on the left and r(k) on the right crosses the centre line at the height
      y_k(k) = (1 − t)·m(k) + t·r(k)
  which is linear in k, so the k scale is LINEAR. (A log k scale would read the k = 1 pile-up better, but
  then the three readings would not be collinear: it would stop being a nomogram.) With t = ½ the k scale
  runs from (1 + r(0))/2 ≈ 0.539 of the saving height at k = 0 down to 0 at k = n.

  All heights here are in "saving units" (0 = foot of the scales, 1 = head). `toSvgY` maps them to pixels.
*/

export type Fit = { fixedMs: number; perCaseMs: number };

export const CASES_FULL = 199;

export const clampK = (k: number, n = CASES_FULL) => Math.min(n, Math.max(1, Math.round(k)));

/** Saving the cost model promised for an early stop after k of n cases. */
export const modelledSaving = (k: number, n = CASES_FULL) => 1 - k / n;

/** Saving the fitted wall-time model gives for the same early stop. */
export const fittedSaving = (k: number, fit: Fit, n = CASES_FULL) =>
  (fit.perCaseMs * (n - k)) / (fit.fixedMs + fit.perCaseMs * n);

/** Height (saving units) of k on the centre scale placed at fraction t between left and right. */
export const kHeight = (k: number, fit: Fit, t = 0.5, n = CASES_FULL) =>
  (1 - t) * modelledSaving(k, n) + t * fittedSaving(k, fit, n);

/** Inverse of kHeight: the (unclamped, real) k at a height on the centre scale. */
export function kAtHeight(y: number, fit: Fit, t = 0.5, n = CASES_FULL) {
  const at0 = kHeight(0, fit, t, n);
  const slope = kHeight(n, fit, t, n) - at0; // over n cases; negative
  return ((y - at0) / slope) * n;
}

/** Scale geometry in SVG pixels. The saving scales run from `top` (100%) to `bottom` (0%). */
export type Layout = { left: number; right: number; top: number; bottom: number; t: number };

export const centreX = (l: Layout) => l.left + (l.right - l.left) * l.t;
export const toSvgY = (saving: number, l: Layout) => l.bottom - saving * (l.bottom - l.top);
export const fromSvgY = (y: number, l: Layout) => (l.bottom - y) / (l.bottom - l.top);

export type Point = { x: number; y: number };

/** The straightedge for k: its three readings (collinear by construction) and its angle in degrees. */
export function straightedge(k: number, fit: Fit, l: Layout, n = CASES_FULL) {
  const m = modelledSaving(k, n);
  const r = fittedSaving(k, fit, n);
  const left: Point = { x: l.left, y: toSvgY(m, l) };
  const right: Point = { x: l.right, y: toSvgY(r, l) };
  const pivot: Point = { x: centreX(l), y: toSvgY(kHeight(k, fit, l.t, n), l) };
  const angle = (Math.atan2(right.y - left.y, right.x - left.x) * 180) / Math.PI;
  return { k, modelled: m, fitted: r, left, right, pivot, angle, length: Math.hypot(right.x - left.x, right.y - left.y) };
}

/** Signed distance (px) of p from the line through a and b: 0 when the three are collinear. */
export const offLine = (a: Point, b: Point, p: Point) =>
  ((b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)) / Math.hypot(b.x - a.x, b.y - a.y);

/** [k, count] for every k that occurs, ascending. */
export function histogram(ks: readonly number[]): [number, number][] {
  const counts = new Map<number, number>();
  for (const k of ks) counts.set(k, (counts.get(k) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0] - b[0]);
}

/**
 * Experiment-wide measured saving from per-candidate medians: 1 − Σ early / Σ full (a ratio of sums, which
 * is how evaluation.json's S_meas_fail is defined; a mean of per-candidate ratios weights every candidate
 * equally and comes out lower).
 */
export function measuredSaving(rows: readonly (readonly [number, number, number])[]) {
  let early = 0;
  let full = 0;
  for (const [, e, f] of rows) {
    early += e;
    full += f;
  }
  return 1 - early / full;
}

export const meanOfRatios = (rows: readonly (readonly [number, number, number])[]) =>
  rows.reduce((s, [, e, f]) => s + (f - e) / f, 0) / rows.length;

export const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

/** Screen-reader text for the slider. */
export const describeK = (k: number, fit: Fit, n = CASES_FULL) =>
  `${k} ${k === 1 ? "case" : "cases"} run before the first failure: the model promised ${pct(modelledSaving(k, n))} saving; the fitted wall-time saving is ${pct(fittedSaving(k, fit, n))}`;
