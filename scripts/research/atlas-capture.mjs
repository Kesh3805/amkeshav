// Captures each atlas site on the real GPU (Edge, D3D11 WebGL): the first frame, the settled frame,
// a pointer sweep, a scroll sequence, a desktop video and a mobile view.
// Usage: node scripts/research/atlas-capture.mjs [id ...]
import { chromium, devices } from "@playwright/test";
import { mkdirSync, readFileSync, renameSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = "docs/research/atlas";
const { sites } = JSON.parse(readFileSync(join(ROOT, "sites.json"), "utf8"));
const only = process.argv.slice(2);
const queue = sites.filter((s) => !only.length || only.includes(s.id));
const WORKERS = 2;
const launch = { channel: "msedge", args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu", "--autoplay-policy=no-user-gesture-required"] };

const wait = (p, ms) => p.waitForTimeout(ms);
const shot = (p, dir, name) => p.screenshot({ path: join(dir, `${name}.jpg`), type: "jpeg", quality: 72, timeout: 30000 }).catch(() => {});

// Prefer the privacy-preserving choice on consent banners; only enter gates, never sign up or buy.
async function clearGates(p) {
  for (const decline of [p.getByRole("button", { name: /reject|decline|necessary only|refuse|deny/i }), p.getByText(/^\s*(decline|reject all|refuse)\s*$/i)]) {
    const d = decline.first();
    if (await d.isVisible().catch(() => false)) { await d.click({ timeout: 2000 }).catch(() => {}); break; }
  }
  const gate = /\b(enter|start|explore|begin|skip|discover|let'?s (go|begin)|without (sound|audio)|no sound|sound off)\b/i;
  for (const [kind, loc] of [["button", p.getByRole("button", { name: gate })], ["link", p.getByRole("link", { name: gate })], ["text", p.getByText(/^\W*(enter|begin|start|click to (enter|start)|click anywhere|press to start|enter (the )?experience|let'?s begin)\W*$/i)]]) {
    const el = loc.first();
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 2000 }).catch(() => {}); return kind; }
  }
  return "none";
}

async function capture(browser, site) {
  const dir = join(ROOT, site.id);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const log = { id: site.id, url: site.url, started: new Date().toISOString(), notes: [] };

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir, size: { width: 960, height: 600 } } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => log.notes.length < 6 && log.notes.push(`pageerror: ${String(e.message).slice(0, 140)}`));
  try {
    await p.goto(site.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    log.finalUrl = p.url();
    await wait(p, 4000); await shot(p, dir, "01-first-4s");
    await wait(p, 8000 + Number(process.env.EXTRA_WAIT ?? 0)); await shot(p, dir, "02-settled-12s");
    log.gate = await clearGates(p);
    await wait(p, 4000); await shot(p, dir, "03-after-gate");
    // Pointer sweep across the stage, then a click-hold in the centre (drag-driven scenes).
    for (let i = 0; i <= 24; i++) { await p.mouse.move(200 + i * 42, 300 + Math.sin(i / 3) * 180); await wait(p, 60); }
    await shot(p, dir, "04-pointer");
    await p.mouse.move(720, 450); await p.mouse.down(); for (let i = 0; i < 15; i++) { await p.mouse.move(720 - i * 18, 450 + i * 6); await wait(p, 40); } await p.mouse.up();
    await wait(p, 1500); await shot(p, dir, "05-drag");
    // Scroll sequence: the mid-experience moments.
    for (let i = 1; i <= 8; i++) { await p.mouse.wheel(0, 700); await wait(p, 1600); if (i % 2 === 0) await shot(p, dir, `06-scroll-${i / 2}`); }
    // Keyboard, for world-like sites.
    await p.keyboard.down("ArrowUp"); await wait(p, 2500); await p.keyboard.up("ArrowUp"); await shot(p, dir, "07-keys");
    log.title = await p.title().catch(() => "");
  } catch (e) {
    log.error = String(e.message).split("\n")[0];
    await shot(p, dir, "99-error");
  }
  await ctx.close();
  for (const f of readdirSync(dir)) if (f.endsWith(".webm")) renameSync(join(dir, f), join(dir, "desktop.webm"));

  const m = await browser.newContext({ ...devices["iPhone 13"], defaultBrowserType: undefined });
  const mp = await m.newPage();
  try {
    await mp.goto(site.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await wait(mp, 12000); await shot(mp, dir, "m1-first");
    await clearGates(mp);
    for (let i = 0; i < 3; i++) { await mp.mouse.wheel(0, 700); await wait(mp, 1500); }
    await shot(mp, dir, "m2-scroll");
  } catch (e) { log.mobileError = String(e.message).split("\n")[0]; }
  await m.close();

  log.finished = new Date().toISOString();
  writeFileSync(join(dir, "log.json"), JSON.stringify(log, null, 2));
  console.log(site.id, log.error ? `ERROR ${log.error}` : "ok", `gate=${log.gate ?? "-"}`);
}

const browser = await chromium.launch(launch);
let next = 0;
await Promise.all(Array.from({ length: WORKERS }, async () => {
  while (next < queue.length) { const s = queue[next++]; await capture(browser, s).catch((e) => console.log(s.id, "FAILED", e.message)); }
}));
await browser.close();
