// List the WebGL chamber's meshes and their materials (dev server, ?dump). node scripts/unwritten/meshes.mjs
import { chromium } from "@playwright/test";
const BASE = process.env.BASE ?? "http://localhost:3300"; // the dev server (.claude/launch.json)
const b = await chromium.launch({ channel: "msedge", args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await p.goto(`${BASE}/prototype/unwritten/?tier=high&dump`, { waitUntil: "load" });
await p.waitForFunction(() => document.querySelector("[data-live]") && window.__unwrittenMeshes, null, { timeout: 120000 });
console.log((await p.evaluate(() => window.__unwrittenMeshes())).join("\n"));
await b.close();
