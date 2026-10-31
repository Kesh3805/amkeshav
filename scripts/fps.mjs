// Rough frame-rate probe: wheel-scrolls the homepage while counting rAF frames and long frames.
// Headless numbers are indicative only; they are not a device benchmark.
import { chromium } from "@playwright/test";
const url = process.argv[2] ?? "http://localhost:4310/";
const b = await chromium.launch({ args: ["--disable-gpu-vsync"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: "networkidle" });
await p.waitForTimeout(2000);
await p.evaluate(() => {
  window.__f = [];
  let last = performance.now();
  const loop = (t) => { window.__f.push(t - last); last = t; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
});
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 100) { await p.mouse.wheel(0, 100); await p.waitForTimeout(16); }
const f = await p.evaluate(() => window.__f.slice(5));
const avg = f.reduce((a, b) => a + b, 0) / f.length;
const sorted = [...f].sort((a, b) => a - b);
console.log(JSON.stringify({ frames: f.length, avgFps: +(1000 / avg).toFixed(1), p95ms: +sorted[Math.floor(f.length * 0.95)].toFixed(1), over50ms: f.filter((x) => x > 50).length }));
await b.close();
