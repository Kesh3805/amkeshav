// Real-GPU handoff check (Edge, D3D11). node scripts/unwritten/handoff.mjs <outdir> [query]
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3300"; // the dev server (.claude/launch.json)
const out = process.argv[2];
const q = process.argv[3] ?? "tier=high";
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("console", m.type(), m.text().slice(0, 300)); });
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 300)));
await p.goto(`${BASE}/prototype/unwritten/?${q}`, { waitUntil: "load" });
await p.screenshot({ path: `${out}/a-poster.png` });
const t0 = Date.now();
let op = "0";
while (Date.now() - t0 < 120000) {
  op = await p.evaluate(() => { const c = document.querySelector("canvas"); if (!c) return "none"; let e = c; while (e && e !== document.body) { const o = getComputedStyle(e).opacity; if (o !== "1") return o; e = e.parentElement; } return "1"; });
  if (op === "1") break;
  await p.waitForTimeout(1000);
}
console.log("opacity", op, "after", (Date.now() - t0) / 1000, "s");
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/b-after.png` });
await p.evaluate(() => { document.querySelectorAll("img").forEach((i) => (i.style.visibility = "hidden")); const c = document.querySelector("canvas"); let e = c; while (e && e !== document.body) { e.style.opacity = "1"; e = e.parentElement; } });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/c-webgl-only.png` });
await b.close();
