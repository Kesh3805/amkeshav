import { describe, expect, it } from "vitest";
import { anchorFor, frameView, FRONTIER_BOOK, parseShot, posterPoint } from "./chamberCamera";

const blenderHero = {
  position: [-1.0, -12.4, 1.78],
  direction: [0.12, 0.99, 0],
  fov_v_deg: 43.6,
  shift_y: 0.18,
  sensor_fit: "HORIZONTAL",
};

describe("parseShot", () => {
  it("detects Blender Z-up from a level direction and converts to Y-up", () => {
    const s = parseShot(blenderHero)!;
    expect(s.position).toEqual([-1.0, 1.78, 12.4]);
    expect(s.direction).toEqual([0.12, 0, -0.99]);
    expect(s.shiftY).toBe(0.18);
    expect(s.sensorFit).toBe("HORIZONTAL");
    expect(s.frame).toEqual({ width: 1920, height: 1080 });
  });

  it("keeps Y-up input and honours an explicit up axis", () => {
    expect(parseShot({ ...blenderHero, position: [-1, 1.78, 12.4], direction: [0.12, 0, -0.99] })!.position).toEqual([-1, 1.78, 12.4]);
    expect(parseShot({ ...blenderHero, up_axis: "Y" })!.position).toEqual([-1.0, -12.4, 1.78]);
  });

  it("derives the vertical fov from lens and sensor for a horizontal fit", () => {
    const s = parseShot({ location: [0, 0, 1], target: [0, 5, 1], lens: 24, sensor_width: 36, sensor_fit: "HORIZONTAL" })!;
    const h = 2 * Math.atan(18 / 24);
    expect(s.fovV).toBeCloseTo((2 * Math.atan(Math.tan(h / 2) * (1080 / 1920)) * 180) / Math.PI, 6);
  });

  it("unwraps {cameras: {HERO}} and rejects junk", () => {
    expect(parseShot({ cameras: { HERO: blenderHero } })).not.toBeNull();
    expect(parseShot(null)).toBeNull();
    expect(parseShot({ position: [0, 0, 0] })).toBeNull();
    expect(parseShot({ ...blenderHero, fov_v_deg: "nope" })).toBeNull();
  });
});

describe("frameView", () => {
  const shot = parseShot(blenderHero)!;

  it("is the full frame plus shift at the poster's own size", () => {
    const v = frameView(shot, 1920, 1080, anchorFor(false));
    expect(v.fullWidth).toBe(1920);
    expect(v.offsetX).toBe(0);
    // Positive Blender shift moves the window up: a negative offset from the top, in units of width.
    expect(v.offsetY).toBeCloseTo(-0.18 * 1920, 6);
    expect(v.aspect).toBeCloseTo(16 / 9, 9);
  });

  it("crops like object-fit: cover at the CSS object-position", () => {
    const tall = frameView({ ...shot, shiftY: 0 }, 1000, 1000, anchorFor(true));
    expect(tall.fullHeight).toBeCloseTo(1000, 6);
    expect(tall.offsetX).toBeCloseTo((tall.fullWidth - 1000) * 0.56, 6);
    expect(tall.offsetY).toBeCloseTo(0, 6);
    const wide = frameView({ ...shot, shiftY: 0 }, 2560, 1080, anchorFor(false));
    expect(wide.fullWidth).toBeCloseTo(2560, 6);
    expect(wide.offsetY).toBeCloseTo((wide.fullHeight - 1080) / 2, 6);
  });
});

describe("posterPoint", () => {
  it("finds the FRONTIER book on a 1440×900 desktop and a 390×844 phone", () => {
    const d = posterPoint(FRONTIER_BOOK.x, FRONTIER_BOOK.y, 1440, 900, anchorFor(false));
    expect(d.scale).toBeCloseTo(900 / 1080, 9);
    expect(d.x).toBeCloseTo(0.4755 * 1600, 6);
    expect(d.y).toBeCloseTo(0.827 * 900, 6);
    const p = posterPoint(FRONTIER_BOOK.x, FRONTIER_BOOK.y, 390, 844, anchorFor(true));
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(390);
  });

  it("is the identity at the poster's own size", () => {
    const p = posterPoint(0.25, 0.75, 1920, 1080, anchorFor(false));
    expect([p.x, p.y, p.scale]).toEqual([480, 810, 1]);
  });
});
