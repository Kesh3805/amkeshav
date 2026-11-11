// Dump the WebGL chamber's scene-linear Threshold frame (dev server, ?dump). node scripts/unwritten/dump.mjs <out.bin>
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3300"; // the dev server (.claude/launch.json)
import { writeFileSync } from "node:fs";
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
p.on("pageerror", (e) => console.log("pageerror", e.message.slice(0, 300)));
await p.goto(`${BASE}/prototype/unwritten/?tier=high&dump`, { waitUntil: "load" });
await p.waitForFunction(() => document.querySelector("[data-live]") && window.__unwrittenLinear, null, { timeout: 120000 });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => window.__unwrittenLinear());
writeFileSync(process.argv[2], Buffer.from(r.data, "base64"));
console.log("dumped", r.w, r.h);
await b.close();
