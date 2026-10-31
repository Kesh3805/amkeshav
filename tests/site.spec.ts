import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/work/",
  "/work/gst-platform/",
  "/work/reviewgraph/",
  "/work/ferite/",
  "/research/",
  "/writing/",
  "/writing/redis-bullmq-namespace-bug/",
  "/about/",
];

for (const route of routes) {
  test(`${route} renders one h1, no console errors, no axe violations`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("h1")).toHaveCount(1);
    expect(errors).toEqual([]);
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("no page scrolls sideways", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, route).toBeLessThanOrEqual(0);
  }
});

test("unknown routes get the 404 page", async ({ page }) => {
  const res = await page.goto("/nothing-here/");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("Not here");
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("homepage is a plain readable document", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    // No pinned stretches: the opening is one viewport, not a scroll runway.
    const h = await page.locator("section").first().evaluate((el) => el.getBoundingClientRect().height);
    expect(h).toBeLessThanOrEqual(page.viewportSize()!.height + 2);
    await expect(page.getByText("The writers maintain the state.")).toBeVisible();
    for (const name of ["ReviewGraph", "The first scheduler lost.", "Call it first.", "What's next?"]) {
      await expect(page.getByRole("heading", { name })).toBeVisible();
    }
    await expect(page.locator("a[href^='mailto:']").first()).toBeVisible();
  });
});

test("The Commitment can be used from the keyboard", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const range = page.locator("#commitment input[type=range]");
  await range.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#commitment")).toContainText(/Your call: \d+% saved/);
  await page.getByRole("button", { name: "Lock it in" }).click();
  await expect(page.locator("#commitment")).toContainText("8 ms of 132");
  await expect(range).toBeDisabled();
});

test("skipping the call still shows the measurement", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Skip/ }).click();
  await expect(page.locator("#commitment")).toContainText("Not confirmatory");
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

test("ReviewGraph base graph reveals the removed callee", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#work-reviewgraph").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "+ Base graph" }).click();
  await expect(page.getByRole("button", { name: "+ Base graph" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#work-reviewgraph")).toContainText("permissionService.check");
});
