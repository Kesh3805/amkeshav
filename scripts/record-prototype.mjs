// Records the prototype: a steady scroll from the opening through to the test site,
// plus stills at the key beats.  node scripts/record-prototype.mjs <url> <outDir> [seconds]
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [url = "http://localhost:4310/prototype/", out = "artifacts/prototype", secs = "24"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) fs.rmSync(`${out}/${f}`, { recursive: true, force: true });

const W = 1280;
const H = 720;
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const context = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: out, size: { width: W, height: H } } });
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForSelector("[data-prototype][data-live]", { timeout: 30000 });
await page.waitForTimeout(1500);

const total = await page.evaluate(() => document.querySelector("[data-prototype]").offsetHeight - innerHeight);
const steps = Number(secs) * 20;
for (let i = 1; i <= steps; i++) {
  const t = i / steps;
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  await page.evaluate((y) => window.scrollTo(0, y), eased * total);
  await page.waitForTimeout(50);
}
await page.waitForTimeout(2500);
await context.close();

// Stills at fixed beats, without video, so each frame has settled.
const p2 = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await p2.goto(url, { waitUntil: "networkidle" });
await p2.waitForSelector("[data-prototype][data-live]", { timeout: 30000 });
const total2 = await p2.evaluate(() => document.querySelector("[data-prototype]").offsetHeight - innerHeight);
for (const beat of [0, 0.1, 0.21, 0.29, 0.34, 0.45, 0.54, 0.62, 0.68, 0.72, 0.8, 1]) {
  await p2.evaluate((y) => window.scrollTo(0, y), beat * total2);
  await p2.waitForTimeout(2200);
  await p2.screenshot({ path: `${out}/beat-${String(Math.round(beat * 100)).padStart(3, "0")}.png` });
}
await browser.close();
console.log(fs.readdirSync(out).join("\n"));
