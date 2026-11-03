import { describe, expect, it } from "vitest";
import data from "../../../../content/research/data/frontier-exp009.json";
import {
  CASES_FULL,
  clampK,
  fittedSaving,
  histogram,
  kAtHeight,
  kHeight,
  meanOfRatios,
  measuredSaving,
  modelledSaving,
  offLine,
  straightedge,
  toSvgY,
  type Layout,
} from "./nomogram";

const fit = data.fit;
const rows = data.failing as [number, number, number][];
const layout: Layout = { left: 90, right: 470, top: 110, bottom: 650, t: 0.5 };

describe("savings", () => {
  it("k = 1 promises ≈ 99.5% and the fit gives ≈ 7.8%", () => {
    expect(modelledSaving(1)).toBeCloseTo(0.99497, 4);
    expect(fittedSaving(1, fit)).toBeCloseTo(0.0781, 3);
  });

  it("both savings are zero for a full run", () => {
    expect(modelledSaving(CASES_FULL)).toBe(0);
    expect(fittedSaving(CASES_FULL, fit)).toBe(0);
  });

  it("the fixed share matches the fit", () => {
    expect(fit.fixedMs / (fit.fixedMs + fit.perCaseMs * CASES_FULL)).toBeCloseTo(data.fixedShare, 3);
  });
});

describe("nomographic geometry", () => {
  it("puts m(k), k and r(k) on one straight line for every k", () => {
    for (const k of [1, 2, 5, 8, 14, 50, 100, 171, 199]) {
      const s = straightedge(k, fit, layout);
      expect(Math.abs(offLine(s.left, s.right, s.pivot))).toBeLessThan(1e-9);
    }
    for (const t of [0.3, 0.62]) {
      const s = straightedge(37, fit, { ...layout, t });
      expect(Math.abs(offLine(s.left, s.right, s.pivot))).toBeLessThan(1e-9);
    }
  });

  it("makes the k scale linear, from (1 + r(0))/2 at k = 0 to 0 at k = 199", () => {
    expect(kHeight(0, fit)).toBeCloseTo((1 + fittedSaving(0, fit)) / 2, 12);
    expect(kHeight(0, fit)).toBeCloseTo(0.5393, 3);
    expect(kHeight(CASES_FULL, fit)).toBe(0);
    const step = kHeight(1, fit) - kHeight(0, fit);
    for (const k of [10, 99, 198]) expect(kHeight(k + 1, fit) - kHeight(k, fit)).toBeCloseTo(step, 12);
  });

  it("inverts heights back to k", () => {
    for (const k of [1, 33, 199]) expect(kAtHeight(kHeight(k, fit), fit)).toBeCloseTo(k, 9);
    expect(clampK(kAtHeight(2, fit))).toBe(1);
    expect(clampK(kAtHeight(-1, fit))).toBe(199);
  });

  it("levels the straightedge at k = 199 and tilts it down to the right below", () => {
    expect(straightedge(199, fit, layout).angle).toBeCloseTo(0, 9);
    expect(straightedge(1, fit, layout).angle).toBeGreaterThan(45);
    expect(toSvgY(1, layout)).toBe(layout.top);
  });
});

describe("the data", () => {
  it("has 1,020 failing candidates, 705 of them at k = 1, none beyond 171", () => {
    const h = histogram(rows.map((r) => r[0]));
    expect(rows).toHaveLength(1020);
    expect(h[0]).toEqual([1, 705]);
    expect(h.at(-1)![0]).toBe(171);
    expect(h.reduce((s, [, c]) => s + c, 0)).toBe(1020);
  });

  /*
    The comparison, documented rather than forced:
      - ratio of sums over the 1,020 per-candidate medians = 0.06396; evaluation.json's S_meas_fail = 0.064.
        Same definition, so they agree to rounding.
      - mean of per-candidate ratios = 0.0612: equal weight per candidate, so a bit lower. Not the headline.
      - modelled saving at the mean k (14.05) = 0.9294 = S_mod_fail exactly (m is linear in k).
      - the fit's saving at the mean k = 0.0730: inside the bootstrap CI [0.0508, 0.0779], but above 0.064,
        because the fit is over all 1,257 candidates and both modes, not only the FAIL early stops.
  */
  it("reproduces the experiment-wide figures", () => {
    expect(measuredSaving(rows)).toBeCloseTo(data.savingMeasured, 3);
    expect(meanOfRatios(rows)).toBeCloseTo(0.0612, 3);
    const meanK = rows.reduce((s, r) => s + r[0], 0) / rows.length;
    expect(modelledSaving(meanK)).toBeCloseTo(data.savingModelled, 3);
    const fitted = fittedSaving(meanK, fit);
    expect(fitted).toBeGreaterThan(data.savingMeasuredCi[0]);
    expect(fitted).toBeLessThan(data.savingMeasuredCi[1]);
  });
});
