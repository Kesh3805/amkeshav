// The WebGL chamber at the Desk stance on the real GPU (Edge, D3D11): the graded screenshot plus
// the pre-view-transform linear frame with the shaft and air (rgb + view distance, float32, rows bottom-up).
// node scripts/unwritten/desk.mjs <outdir> [desk|book]   (BASE=<dev server>)
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3300"; // the dev server (.claude/launch.json)
import { writeFileSync } from "node:fs";
const [out, stance = "desk"] = process.argv.slice(2);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 300)));
await p.goto(`${BASE}/prototype/unwritten/?tier=high&dump&stance=${stance}`, { waitUntil: "load" });
await p.waitForFunction(() => document.querySelector("[data-live]") && window.__unwrittenLinear, null, { timeout: 180000 });
await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/web-${stance}.png` });
const r = await p.evaluate(() => window.__unwrittenLinear({ full: true }));
writeFileSync(`${out}/web-${stance}.bin`, Buffer.from(r.data, "base64"));
console.log("dumped", r.w, r.h, r.ch);
await b.close();
