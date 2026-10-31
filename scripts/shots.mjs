// Full-page screenshots of the given routes from a running static server.
//   node scripts/shots.mjs <base> <outDir> <theme> <route...>   (use "home" for /)
import { chromium } from "@playwright/test";
import fs from "node:fs";
const [base, out, theme, ...routes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
await p.addInitScript((t) => localStorage.setItem("theme", t), theme);
for (const r of routes) {
  await p.goto(base + (r === "home" ? "" : r + "/"), { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  const f = `${out}/${r.replaceAll("/", "_")}-${theme}.png`;
  await p.screenshot({ path: f, fullPage: true });
  console.log(f);
}
await b.close();
