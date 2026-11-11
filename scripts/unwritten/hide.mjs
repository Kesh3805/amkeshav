// Screenshot the WebGL layer with meshes hidden by name prefix. node scripts/unwritten/hide.mjs <out.png> PREFIX...
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3300"; // the dev server (.claude/launch.json)
const [out, ...prefixes] = process.argv.slice(2);
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`${BASE}/prototype/unwritten/?tier=high&dump`, { waitUntil: "load" });
await p.waitForFunction(() => document.querySelector("[data-live]") && window.__unwrittenHide, null, { timeout: 120000 });
for (const x of prefixes) await p.evaluate((x) => window.__unwrittenHide(x), x);
await p.evaluate(() => { document.querySelectorAll("img").forEach((i) => (i.style.visibility = "hidden")); });
await p.waitForTimeout(1500);
await p.screenshot({ path: out });
await b.close();
