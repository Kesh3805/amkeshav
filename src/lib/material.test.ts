import { describe, expect, it } from "vitest";
import { conserve, fitModel, influence, rowWidth, spring, WDTH_MAX, WDTH_MIN } from "./material";

// Six glyphs with different width responses, roughly like K E S H A V.
const models = [
  fitModel(120, 290),
  fitModel(95, 250),
  fitModel(118, 300),
  fitModel(125, 305),
  fitModel(130, 320),
  fitModel(124, 300),
];
const REST = 96;

describe("fitModel", () => {
  it("reproduces the two measured widths", () => {
    const m = fitModel(100, 300);
    expect(m.a + m.b * WDTH_MIN).toBeCloseTo(100);
    expect(m.a + m.b * WDTH_MAX).toBeCloseTo(300);
  });
});

describe("conserve", () => {
  const rest = rowWidth(models, models.map(() => REST));

  it("leaves the row untouched when nothing is pressed", () => {
    expect(conserve(models, REST, models.map(() => 0), 1)).toEqual(models.map(() => REST));
  });

  it.each([0, 1.5, 3.2, 5])("keeps the row's total width when pressing at glyph %s", (x) => {
    const centres = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5];
    const press = influence(centres, x, 0.8);
    const values = conserve(models, REST, press, 1);
    expect(rowWidth(models, values)).toBeCloseTo(rest, 4);
  });

  it("narrows the pressed glyph and widens the others", () => {
    const press = [0, 0, 1, 0, 0, 0];
    const values = conserve(models, REST, press, 1);
    expect(values[2]).toBeLessThan(REST);
    values.forEach((v, i) => i !== 2 && expect(v).toBeGreaterThan(REST));
  });

  it("never leaves the font's wdth axis", () => {
    const values = conserve(models, REST, [1, 1, 1, 1, 1, 0], 1.15);
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(WDTH_MIN);
      expect(v).toBeLessThanOrEqual(WDTH_MAX);
    });
  });
});

describe("spring", () => {
  it("settles on its target", () => {
    let x = 0;
    let v = 0;
    for (let i = 0; i < 400; i++) [x, v] = spring(x, v, 1, 210, 17, 1 / 60);
    expect(x).toBeCloseTo(1, 3);
  });
});
