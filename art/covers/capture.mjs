// Captures a cover prototype on the real GPU: node art/covers/capture.mjs <name> [width height]
// Needs serve.mjs running. Output: docs/direction/covers/<name>/
import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [name, w = "1440", h = "900"] = process.argv.slice(2);
const W = +w, H = +h, phone = W < 700;
const out = resolve(dirname(fileURLToPath(import.meta.url)), "../../docs/direction/covers", name + (phone ? "-phone" : ""));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  channel: "msedge",
  args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: phone ? 2 : 1, recordVideo: { dir: out, size: { width: W, height: H } } });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(String(e)));
p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
const t0 = Date.now();
await p.goto(`http://localhost:4180/art/covers/${name}.html`);
const shot = (n) => p.screenshot({ path: join(out, `${n}.png`) });
await p.waitForTimeout(1000); await shot("01-first-1s");
await p.waitForTimeout(2000); await shot("02-settled-3s");

// A slow, human pass: in from the lower left, across the bottom, up the right side.
const path = [[0.04, 0.95], [0.12, 0.78], [0.3, 0.74], [0.42, 0.8], [0.6, 0.82], [0.8, 0.84], [0.92, 0.8], [0.86, 0.5], [0.8, 0.2], [0.7, 0.12], [0.4, 0.3], [0.2, 0.18], [0.08, 0.2]];
let k = 3;
for (let i = 1; i < path.length; i++) {
  const [ax, ay] = path[i - 1], [bx, by] = path[i];
  for (let s = 0; s <= 30; s++) {
    const f = s / 30;
    await p.mouse.move((ax + (bx - ax) * f) * W, (ay + (by - ay) * f) * H);
    await p.waitForTimeout(16);
  }
  if (i % 4 === 0) await shot(`0${k++}-pointer-${i}`);
}
await p.waitForTimeout(1500); await shot(`0${k++}-after-pass`);
await p.mouse.move(W * 0.5, H * 0.5);
await p.waitForTimeout(2000); await shot(`0${k++}-rest`);
await ctx.close();
await browser.close();
const vid = readdirSync(out).find((f) => f.endsWith(".webm"));
if (vid) renameSync(join(out, vid), join(out, "recording.webm"));
console.log(name, `${(Date.now() - t0) / 1000}s`, errors.length ? errors : "no errors");
