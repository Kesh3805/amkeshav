/*
  The width material. A row of letters behaves like a row of rubber blocks:
  pressing one narrows it, and its neighbours widen to keep the row's total width.
  Pure functions so they can be unit-tested without a DOM.
*/

export const WDTH_MIN = 50;
export const WDTH_MAX = 150;

/** Linear width model for one glyph: width(v) = a + b * v, measured at two wdth values. */
export type GlyphModel = { a: number; b: number };

export function fitModel(wAtMin: number, wAtMax: number): GlyphModel {
  const b = (wAtMax - wAtMin) / (WDTH_MAX - WDTH_MIN);
  return { a: wAtMin - b * WDTH_MIN, b };
}

/** Gaussian falloff of a press at `x` over glyph centres. */
export function influence(centres: number[], x: number, radius: number): number[] {
  return centres.map((c) => Math.exp(-((c - x) ** 2) / (2 * radius * radius)));
}

/**
 * Given a rest width and per-glyph press amounts (0..1), return wdth values whose summed
 * glyph width equals the summed width at rest. Pressed glyphs narrow; the rest share the slack.
 */
export function conserve(models: GlyphModel[], rest: number, press: number[], depth: number): number[] {
  const pressed = press.map((f) => rest - f * depth * (rest - WDTH_MIN));
  let freed = 0;
  let share = 0;
  models.forEach((m, i) => {
    freed += m.b * (rest - pressed[i]);
    share += m.b * (1 - press[i]);
  });
  const delta = share > 1e-6 ? freed / share : 0;
  return pressed.map((v, i) => clamp(v + delta * (1 - press[i]), WDTH_MIN, WDTH_MAX));
}

export function rowWidth(models: GlyphModel[], values: number[]): number {
  return models.reduce((sum, m, i) => sum + m.a + m.b * values[i], 0);
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Critically-damped-ish spring step. Returns [position, velocity]. */
export function spring(x: number, v: number, target: number, k: number, damping: number, dt: number): [number, number] {
  const a = k * (target - x) - damping * v;
  const nv = v + a * dt;
  return [x + nv * dt, nv];
}
