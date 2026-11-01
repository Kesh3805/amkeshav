// Composites the art-direction frames: each HTML overlay over its rendered plate, at 1920×1080.
//   node art/shoot.mjs  → docs/direction/*.png
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const out = path.resolve(here, "..", "docs", "direction");
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
for (const [i, name] of ["threshold", "vault", "field"].entries()) {
  await page.goto(pathToFileURL(path.join(here, "frames", `${name}.html`)).href, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const file = path.join(out, `${i + 1}-${name}.png`);
  await page.screenshot({ path: file });
  console.log(file);
}
await browser.close();
