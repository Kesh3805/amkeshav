import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { getExp009Nomogram, getExperiment, getPrograms, getWork, getWriting } = await import("./content");

describe("content", () => {
  const work = getWork();
  const writing = getWriting();
  const programs = getPrograms();

  it("validates every work entry against the schema", () => {
    expect(work.length).toBeGreaterThanOrEqual(10);
    expect(new Set(work.map((w) => w.slug)).size).toBe(work.length);
  });

  it("scopes Ferite to the docs site and brand", () => {
    const ferite = work.find((w) => w.slug === "ferite")!;
    expect(ferite.role).toMatch(/Not the Rust toolchain/);
  });

  it("does not resurrect the old PR reviewer", () => {
    expect(work.some((w) => /antigravity/i.test(w.slug + w.title))).toBe(false);
  });

  it("links writing only to projects that exist", () => {
    const slugs = new Set(work.map((w) => w.slug));
    writing.forEach((p) => p.relatedProjects.forEach((r) => expect(slugs).toContain(r)));
  });

  it("keeps internal links in bodies pointing at real routes", () => {
    const routes = new Set([
      ...work.map((w) => `/work/${w.slug}`),
      ...writing.map((p) => `/writing/${p.slug}`),
      "/research",
      "/writing",
      "/work",
      "/about",
    ]);
    const bodies = [...work.map((w) => w.body), ...writing.map((p) => p.body.replace(/\]\(\/projects\//g, "](/work/"))];
    for (const body of bodies) {
      for (const m of body.matchAll(/\]\((\/[^)#\s]*)/g)) expect(routes, m[1]).toContain(m[1].replace(/\/$/, ""));
    }
  });

  it("records experiments that have not run as not run", () => {
    const notRun = programs.flatMap((p) => p.experiments).filter((e) => e.verdict === "not-run");
    expect(notRun.length).toBeGreaterThan(0);
    notRun.forEach((e) => expect(e.result).toMatch(/^Not run/));
  });

  it("keeps the exp-009 figures the homepage quotes", () => {
    const e = programs.find((p) => p.slug === "frontier")!.experiments.find((x) => x.id === "exp-009")!;
    expect(e.effect).toMatchObject({ estimate: 6.4, low: 5.1, high: 7.8 });
    expect(e.result).toContain("92.9%");
  });

  it("loads the exp-009 nomogram data consistently with the experiment", () => {
    const n = getExp009Nomogram();
    expect(n.failing).toHaveLength(n.fail);
    expect(getExperiment("frontier", "exp-009")?.verdict).toBe("refuted");
  });
});
