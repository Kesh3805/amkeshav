// Captures scroll states of a page as screenshots. Usage:
//   node scripts/capture.mjs <url> <outDir> [width] [height] [theme] [stops...]
// stops are scroll positions in viewport heights, e.g. 0 0.5 1 1.5
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [url = "http://localhost:3300/", out = "artifacts/shots", w = "1440", h = "900", theme = "light", ...rest] =
  process.argv.slice(2);
const stops = rest.length ? rest.map(Number) : [0, 0.5, 1, 1.5, 2];
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: +w, height: +h }, colorScheme: theme });
await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2200);
for (const s of stops) {
  await page.evaluate((y) => window.scrollTo(0, y * innerHeight), s);
  await page.waitForTimeout(1300);
  const file = `${out}/${w}x${h}-${theme}-${String(s).replace(".", "_")}.png`;
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
