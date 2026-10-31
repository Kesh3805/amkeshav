import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await ctx.newPage();
const agg = new Map();
for (const r of process.argv.slice(2)) {
  await p.goto("http://localhost:4310/" + (r === "home" ? "" : r + "/"), { waitUntil: "networkidle" });
  const res = await new AxeBuilder({ page: p }).withTags(["wcag2a","wcag2aa"]).analyze();
  for (const v of res.violations) for (const n of v.nodes) {
    const k = `${v.id} | ${n.any[0]?.data?.fgColor ?? ""} on ${n.any[0]?.data?.bgColor ?? ""} ${n.any[0]?.data?.contrastRatio ?? ""} | ${n.target[0].toString().slice(0,60)}`;
    agg.set(k.replace(/\.[A-Za-z]+-module__[\w-]+__/g,"."), (agg.get(k) ?? 0) + 1);
  }
}
[...agg].sort((a,b)=>b[1]-a[1]).slice(0,40).forEach(([k,n])=>console.log(n,k));
await b.close();
