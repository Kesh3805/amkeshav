// Records a real browser session as video: entrance, pressing the name, then a slow scroll.
//   node scripts/record.mjs <url> <outDir> [width] [height] [theme]
import { chromium } from "@playwright/test";
import fs from "node:fs";

const [url = "http://localhost:3300/", out = "artifacts/rec", w = "1440", h = "900", theme = "light"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const W = +w;
const H = +h;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: W, height: H },
  colorScheme: theme,
  recordVideo: { dir: out, size: { width: W, height: H } },
});
await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2400);

// Press the name: sweep across it, hold a press, release.
const name = await page.locator("#name").boundingBox();
if (name) {
  const y = name.y + name.height / 2;
  await page.mouse.move(name.x + 10, y);
  for (let i = 0; i <= 60; i++) {
    await page.mouse.move(name.x + (name.width * i) / 60, y);
    await page.waitForTimeout(22);
  }
  await page.mouse.move(name.x + name.width * 0.35, y, { steps: 12 });
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.up();
  await page.waitForTimeout(900);
  await page.mouse.move(W / 2, 40, { steps: 10 });
}

// Scroll like a person: wheel steps with pauses at the end of each burst.
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
let y = 0;
while (y < total) {
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(45);
  }
  y = await page.evaluate(() => scrollY);
  await page.waitForTimeout(650);
  if (y > 14000) break;
}
await page.waitForTimeout(800);
await context.close();
await browser.close();
const files = fs.readdirSync(out).filter((f) => f.endsWith(".webm"));
console.log(files.map((f) => `${out}/${f}`).join("\n"));
