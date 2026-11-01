// Smoke-checks the deployed prototype: assets load under the base path and the canvas comes up.
//   node scripts/check-prototype-live.mjs [url]
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "https://kesh3805.github.io/amkeshav/prototype/";
const b = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
const bad = [];
p.on("response", (r) => r.status() >= 400 && bad.push(`${r.status()} ${r.url()}`));
p.on("pageerror", (e) => bad.push(`error ${e.message}`));
await p.goto(url, { waitUntil: "load" });
const ready = await p
  .waitForSelector("[data-prototype][data-live]", { timeout: 30000 })
  .then(() => true)
  .catch(() => false);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
await p.waitForTimeout(2500);
await p.screenshot({ path: "artifacts/prototype-live.png" });
console.log(JSON.stringify({ ready, problems: bad }));
await b.close();
