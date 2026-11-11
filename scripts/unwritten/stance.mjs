// Stance flight on the real GPU (Edge, D3D11). node scripts/unwritten/stance.mjs <outdir>
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3300"; // the dev server (.claude/launch.json)
const out = process.argv[2];
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("console", (m) => { if (m.type() === "error") console.log("console", m.text().slice(0, 300)); });
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 300)));
await p.goto(`${BASE}/prototype/unwritten/?tier=high`, { waitUntil: "load" });
await p.waitForFunction(() => document.querySelector("[data-live]"), null, { timeout: 120000 });
await p.waitForTimeout(1200);
await p.screenshot({ path: `${out}/0-threshold.png` });
const t0 = Date.now();
await p.click('button[aria-label="Open the FRONTIER volume"]');
for (const [i, ms] of [[1, 700], [2, 1300], [3, 1900], [4, 2700], [5, 3400], [6, 5200]]) {
  await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
  await p.screenshot({ path: `${out}/${i}-${ms}.png` });
  console.log("shot", i, "at", Date.now() - t0);
}
await p.waitForFunction(() => document.querySelector("dialog")?.open, null, { timeout: 10000 });
console.log("dialog open after", Date.now() - t0, "ms");
await p.keyboard.press("Escape");
await p.waitForTimeout(1800);
await p.screenshot({ path: `${out}/7-closing.png` });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${out}/8-back.png` });
await b.close();
