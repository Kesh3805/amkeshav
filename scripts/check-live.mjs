// Smoke-checks a deployed preview: final URL, failed requests, console errors, key content.
import { chromium } from "@playwright/test";
const base = process.argv[2];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const bad = []; const errs = [];
p.on("response", (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
p.on("pageerror", (e) => errs.push(e.message));
for (const r of ["", "work/reviewgraph/", "research/", "writing/gst-returns-read-model/", "about/"]) {
  await p.goto(base + r, { waitUntil: "networkidle" });
  console.log(p.url(), "|", await p.locator("h1").first().innerText().catch(() => "NO H1"));
}
await p.goto(base, { waitUntil: "networkidle" }); await p.waitForTimeout(2000);
await p.screenshot({ path: "artifacts/live-hero.png" });
await p.getByRole("link", { name: "Research", exact: true }).first().click(); await p.waitForURL(/research/); console.log("client nav ->", p.url());
console.log("failed:", bad.slice(0, 10)); console.log("errors:", errs.slice(0, 5));
await b.close();
