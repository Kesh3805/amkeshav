// Records the direct-manipulation pieces: turning the ReviewGraph fixture, reading the base graph,
// and making a call in The Commitment.  node scripts/record-interactions.mjs <url> <outDir> [theme]
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [url = "http://localhost:3300/", out = "artifacts/rec-interactions", theme = "light"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: theme,
  recordVideo: { dir: out, size: { width: 1440, height: 900 } },
});
await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// ReviewGraph: scroll in, drag the graph, then switch to the base graph.
await page.locator("#work-reviewgraph").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 120));
await page.waitForTimeout(1500);
const stage = await page.locator("[aria-label^='Fixture graph']").boundingBox();
if (stage) {
  const cx = stage.x + stage.width / 2;
  const cy = stage.y + stage.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 260, cy + 40, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(1200);
}
await page.getByRole("button", { name: "+ Base graph" }).click();
await page.waitForTimeout(1800);
await page.getByRole("button", { name: "Head graph" }).click();
await page.waitForTimeout(900);
await page.getByRole("button", { name: "+ Base graph" }).click();
await page.waitForTimeout(1200);

// The Commitment: drag the line to a guess, lock it, watch the measurement resolve.
await page.locator("#commitment").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, 260));
await page.waitForTimeout(1200);
const range = await page.locator("#commitment input[type=range]").boundingBox();
if (range) {
  const y = range.y + range.height / 2;
  await page.mouse.move(range.x + range.width * 0.5, y);
  await page.mouse.down();
  await page.mouse.move(range.x + range.width * 0.28, y, { steps: 25 });
  await page.mouse.move(range.x + range.width * 0.42, y, { steps: 15 });
  await page.mouse.up();
}
await page.waitForTimeout(700);
await page.getByRole("button", { name: "Lock it in" }).click();
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollBy(0, 300));
await page.waitForTimeout(2600);
await page.screenshot({ path: `${out}/commitment-revealed.png` });

await context.close();
await browser.close();
console.log(fs.readdirSync(out).map((f) => `${out}/${f}`).join("\n"));
