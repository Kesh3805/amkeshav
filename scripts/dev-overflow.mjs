import { chromium, devices } from "@playwright/test";
const b = await chromium.launch(); const ctx = await b.newContext({ ...devices["Pixel 7"] }); const p = await ctx.newPage();
for (const r of ["", "work/", "work/gst-platform/", "work/reviewgraph/", "work/ferite/", "research/", "writing/", "writing/redis-bullmq-namespace-bug/", "about/"]) {
  await p.goto("http://localhost:4310/" + r, { waitUntil: "networkidle" });
  const out = await p.evaluate(() => { const W = document.documentElement.clientWidth; const bad = []; document.querySelectorAll("body *").forEach((el) => { const r = el.getBoundingClientRect(); if (r.right > W + 1 && getComputedStyle(el).position !== "fixed") bad.push(`${el.tagName}.${(el.className?.baseVal ?? el.className).toString().slice(0,40)} ${Math.round(r.right - W)}`); }); return { sw: document.documentElement.scrollWidth - W, bad: bad.filter(x=>!x.includes("JQlNzW")).slice(0, 8) }; });
  if (out.sw > 0) console.log(r, out);
}
await b.close();
