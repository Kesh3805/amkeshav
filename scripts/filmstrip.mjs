// Scrolls a page top to bottom in fixed steps and saves one frame per step.
//   node scripts/filmstrip.mjs <url> <outDir> [width] [height] [theme] [stepVh] [reducedMotion]
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [url = "http://localhost:3300/", out = "artifacts/strip", w = "1440", h = "900", theme = "light", step = "0.8", reduced = "no"] =
  process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) fs.rmSync(`${out}/${f}`, { recursive: true, force: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  colorScheme: theme,
  reducedMotion: reduced === "reduce" ? "reduce" : "no-preference",
});
await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let i = 0;
for (let y = 0; ; y += +step * +h) {
  const at = Math.min(y, total);
  await page.evaluate((v) => window.scrollTo(0, v), at);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${out}/${String(i++).padStart(3, "0")}.png` });
  if (at >= total) break;
}
console.log(`${i} frames, page height ${total + +h}px`);
await browser.close();
