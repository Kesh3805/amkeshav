// Release gates 3, 5, 8 and 9 (ChatGPT, 12 Nov 2026) against the static export: `pnpm build && pnpm start`,
// then node scripts/unwritten/gates.mjs [BASE=http://localhost:4310]. Edge on the real GPU (D3D11).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const BASE = process.env.BASE ?? "http://localhost:4310";
const slugs = (dir) => fs.readdirSync(path.join("content", dir)).filter((f) => /\.mdx?$/.test(f)).map((f) => `/${dir}/${f.replace(/\.mdx?$/, "")}/`);
const routes = ["/", "/work/", ...slugs("work"), "/research/", "/writing/", ...slugs("writing"), "/about/", "/prototype/unwritten/", "/prototype/unwritten/frontier/"];
const GPU = ["--use-angle=d3d11", "--ignore-gpu-blocklist"];
const report = { gate3: {}, gate5: {}, gate8: {}, gate9: [] };

async function session(opts, args = GPU) {
  const browser = await chromium.launch({ channel: "msedge", args });
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on("pageerror", (e) => errors.push(e.message.slice(0, 160)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 160)));
  page.on("requestfailed", (r) => failed.push(`${r.url().replace(BASE, "")} ${r.failure()?.errorText}`));
  page.on("response", (r) => r.status() >= 400 && failed.push(`${r.url().replace(BASE, "")} ${r.status()}`));
  return { browser, page, errors, failed };
}

const state = (page) =>
  page.evaluate(() => ({
    live: !!document.querySelector("[data-live]"),
    canvas: !!document.querySelector("canvas"),
    poster: [...document.images].some((i) => i.src.includes("hero-poster") && i.complete && i.naturalWidth > 0),
    openButton: !!document.querySelector('button[aria-label="Open the FRONTIER volume"]'),
    flatLink: !!document.querySelector('a[href*="/prototype/unwritten/frontier"]'),
  }));

// Gate 3: four scenarios expose the same research content.
for (const [name, opts, args] of [
  ["desktop + WebGL", { viewport: { width: 1920, height: 1080 } }, GPU],
  ["desktop, no WebGL", { viewport: { width: 1920, height: 1080 } }, ["--disable-webgl", "--disable-webgl2", "--disable-3d-apis"]],
  ["phone + WebGL", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, GPU],
  ["reduced motion", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" }, GPU],
]) {
  const s = await session(opts, args);
  await s.page.goto(`${BASE}/prototype/unwritten/?tier=high`, { waitUntil: "load" });
  await s.page.waitForTimeout(name.includes("no WebGL") || name.includes("reduced") ? 4000 : 12000);
  const st = await state(s.page);
  // Open the folio the way this visitor can, and read the research it shows.
  let folio = null;
  const btn = s.page.locator('button[aria-label="Open the FRONTIER volume"]');
  if (await btn.isVisible().catch(() => false)) {
    await btn.focus();
    await s.page.keyboard.press("Enter");
    const dlg = await s.page.waitForSelector("dialog[open]", { timeout: 12000 }).catch(() => null);
    if (dlg) {
      const text = await dlg.innerText();
      folio = { via: "dialog (keyboard)", has929: text.includes("92.9"), has64: text.includes("6.4"), stamp: /COST MODEL REFUTED/i.test(text), focusInside: await s.page.evaluate(() => !!document.activeElement?.closest("dialog")) };
      await s.page.keyboard.press("Escape");
      await s.page.waitForTimeout(300);
      folio.focusDuringReturn = await s.page.evaluate(() => document.activeElement?.tagName);
      await s.page.waitForTimeout(4500);
      folio.closed = await s.page.evaluate(() => !document.querySelector("dialog[open]"));
      folio.focusBack = await s.page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName);
    }
  }
  if (!folio) {
    await s.page.goto(`${BASE}/prototype/unwritten/frontier/`, { waitUntil: "load" });
    const text = await s.page.locator("main#main").innerText();
    folio = { via: "flat page", has929: text.includes("92.9"), has64: text.includes("6.4"), stamp: /COST MODEL REFUTED/i.test(text) };
  }
  report.gate3[name] = { ...st, folio, errors: s.errors, failed: s.failed };
  await s.browser.close();
}

// Gate 3: a deep link to the flat folio, refreshed.
{
  const s = await session({ viewport: { width: 1440, height: 900 } });
  const r1 = await s.page.goto(`${BASE}/prototype/unwritten/frontier/`, { waitUntil: "load" });
  const r2 = await s.page.reload({ waitUntil: "load" });
  report.gate3["deep link + refresh"] = { status: [r1?.status(), r2?.status()], h1: await s.page.locator("h1").count(), errors: s.errors };
  await s.browser.close();
}

// Gate 5: a 60-second session on the live chamber: three round trips to the Book, then idle parallax.
{
  const s = await session({ viewport: { width: 1920, height: 1080 } });
  await s.page.goto(`${BASE}/prototype/unwritten/?tier=high`, { waitUntil: "load" });
  await s.page.waitForSelector("[data-live]", { timeout: 120000 });
  const heap = async () => s.page.evaluate(() => Math.round((performance.memory?.usedJSHeapSize ?? 0) / 1e6));
  const samples = [await heap()];
  const t0 = Date.now();
  const trips = [];
  for (let i = 0; i < 3; i++) {
    const t = Date.now();
    await s.page.click('button[aria-label="Open the FRONTIER volume"]');
    await s.page.waitForSelector("dialog[open]", { timeout: 15000 });
    trips.push(Date.now() - t);
    await s.page.waitForTimeout(2000);
    await s.page.keyboard.press("Escape");
    await s.page.waitForTimeout(3500);
    samples.push(await heap());
  }
  while (Date.now() - t0 < 60000) {
    await s.page.mouse.move(200 + Math.random() * 1500, 200 + Math.random() * 700, { steps: 8 });
    await s.page.waitForTimeout(400);
  }
  samples.push(await heap());
  report.gate5 = { secondsRun: Math.round((Date.now() - t0) / 1000), openMs: trips, heapMB: samples, errors: s.errors, failed: s.failed };
  await s.browser.close();
}

// Gates 8 and 9: third-party hosts, and each route's metadata.
{
  const s = await session({ viewport: { width: 1440, height: 900 } });
  const hosts = new Map();
  s.page.on("request", (r) => {
    const h = new URL(r.url()).host;
    if (h && !BASE.includes(h)) hosts.set(h, (hosts.get(h) ?? 0) + 1);
  });
  for (const route of routes) {
    await s.page.goto(BASE + route, { waitUntil: "load" });
    await s.page.waitForTimeout(route.startsWith("/prototype/unwritten/") ? 3000 : 800);
    report.gate9.push({
      route,
      ...(await s.page.evaluate(() => {
        const meta = (sel) => document.querySelector(sel)?.getAttribute("content") ?? null;
        return {
          title: document.title,
          description: meta('meta[name="description"]'),
          ogTitle: meta('meta[property="og:title"]'),
          ogImage: meta('meta[property="og:image"]'),
          icon: document.querySelector('link[rel~="icon"]')?.getAttribute("href") ?? null,
          robots: meta('meta[name="robots"]'),
        };
      })),
    });
  }
  report.gate8 = { thirdPartyHosts: Object.fromEntries(hosts), errors: s.errors, failed: s.failed };
  await s.browser.close();
}

console.log(JSON.stringify(report, null, 1));
