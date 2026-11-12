import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Every case study and essay, straight from content/, so a new one is tested without editing this list. */
const slugs = (dir: string) =>
  fs
    .readdirSync(path.join("content", dir))
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => `/${dir}/${f.replace(/\.mdx?$/, "")}/`);

const routes = [
  "/",
  "/work/",
  ...slugs("work"),
  "/research/",
  "/writing/",
  ...slugs("writing"),
  "/about/",
  "/prototype/unwritten/",
  "/prototype/unwritten/frontier/",
];

/** The chamber streams 12 MB and keeps rendering, so it never goes network-idle: wait for load there. */
const settled = (route: string) => (route.startsWith("/prototype/unwritten/") ? "load" : "networkidle");

for (const route of routes) {
  test(`${route} renders one h1, no console errors, no axe violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(route, { waitUntil: settled(route) });
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("no page scrolls sideways", async ({ page }) => {
  test.setTimeout(240_000);
  for (const route of routes) {
    await page.goto(route, { waitUntil: settled(route) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});

// Release gate 4 (ChatGPT, 12 Nov 2026): no route scrolls sideways at any of the target viewports.
for (const [width, height] of [[320, 720], [375, 812], [390, 844], [768, 1024], [1440, 900], [1920, 1080]]) {
  test(`no page scrolls sideways at ${width}×${height}`, async ({ page }) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width, height });
    const wide: string[] = [];
    for (const route of routes) {
      await page.goto(route, { waitUntil: settled(route) });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 0) wide.push(`${route} +${overflow}px`);
    }
    expect(wide).toEqual([]);
  });
}

// Release ruling (a), 12 Nov 2026: the superseded Threshold/Vault/Field prototype is retired from the site.
test("the retired art-direction prototype is gone", async ({ page }) => {
  const res = await page.goto("/prototype/");
  expect(res?.status()).toBe(404);
});

test("unknown routes get the 404 page", async ({ page }) => {
  const res = await page.goto("/nothing-here/");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("Not here");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  // The engineering folio must read as finished with every animation off (docs/homepage/BRIEF.md §H).
  test("homepage is complete with motion off", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toContainText("I build backends that have to be right");
    for (const name of ["Selected work", "Research", "Writing"]) {
      await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
    }
    await expect(page.locator("[data-reveal='pending']")).toHaveCount(0);
    await expect(page.locator("a[href^='mailto:']").first()).toBeVisible();
  });
});

test("selected work shows four equal previews, each linked to its case study", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const slug of ["gst-platform", "loams", "reviewgraph", "temporal-compute"]) {
    await expect(page.locator(`#work a[href$="/work/${slug}/"]`)).toBeAttached();
  }
  const heights = await page.locator("#work [data-drawing]").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  expect(new Set(heights).size, `drawing heights ${heights}`).toBe(1);
});

test("the on-page index reaches every section, and the work index lists every project", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  for (const id of ["work", "research", "writing"]) {
    await expect(page.locator(`nav[aria-label="On this page"] a[href="#${id}"]`)).toBeAttached();
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await page.goto("/work/", { waitUntil: "networkidle" });
  for (const route of slugs("work")) {
    await expect(page.locator(`a[href$="${route}"]`).first(), route).toBeAttached();
  }
});

test("theme toggle switches and persists", async ({ page }) => {
  await page.goto("/about/", { waitUntil: "networkidle" });
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole("button", { name: /Switch to/ }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
});
