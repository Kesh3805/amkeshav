// Renders the still test: node art/stills/shoot.mjs [page ...]
// Output: docs/direction/stills/<page>-t<type>-<desktop|phone>[-grey].png
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(here, "../../docs/direction/stills");
mkdirSync(out, { recursive: true });

const PAGES = ["cover-a", "cover-b", "gst", "frontier"];
const COVERS = new Set(["cover-a", "cover-b"]);
const pick = process.argv.slice(2);
const pages = pick.length ? pick : PAGES;

const VIEWS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  phone: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
};

const jobs = [];
for (const page of pages)
  for (const view of Object.keys(VIEWS)) {
    for (const type of COVERS.has(page) ? [1, 2, 3] : [1]) jobs.push({ page, view, type, grey: false });
    jobs.push({ page, view, type: 1, grey: true });
  }

const browser = await chromium.launch();
for (const { page, view, type, grey } of jobs) {
  const ctx = await browser.newContext(VIEWS[view]);
  const p = await ctx.newPage();
  await p.goto(pathToFileURL(join(here, `${page}.html`)).href + `?type=${type}`, { waitUntil: "networkidle" });
  await p.evaluate(() => document.fonts.ready);
  if (grey) await p.addStyleTag({ content: "html{filter:grayscale(1)}" });
  const name = `${page}-t${type}-${view}${grey ? "-grey" : ""}`;
  await p.screenshot({ path: join(out, `${name}.png`), fullPage: true });
  await p.screenshot({ path: join(out, `${name}-fold.png`) });
  console.log(name);
  await ctx.close();
}
await browser.close();
