// Screenshots the first viewport of every shortlisted site, so the standouts are judged on pixels.
//   node scripts/research/shoot-shortlist.mjs  → docs/research/shots/NN-key.jpg + shots.json
import { chromium } from "@playwright/test";
import fs from "node:fs";

const list = JSON.parse(fs.readFileSync("docs/research/shortlist.json", "utf8"));
const out = "docs/research/shots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const results = [];
const queue = list.map((s, i) => ({ ...s, i }));

async function worker() {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  });
  while (queue.length) {
    const s = queue.shift();
    const page = await ctx.newPage();
    const file = `${out}/${String(s.i + 1).padStart(2, "0")}-${s.key.replace(/[^a-z0-9]+/gi, "-").slice(0, 40)}.jpg`;
    let status = "ok";
    try {
      const res = await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (res && res.status() >= 400) status = `http ${res.status()}`;
      // Give WebGL intros a moment, then dismiss nothing — we want the first impression as served.
      await page.waitForTimeout(6000);
      await page.screenshot({ path: file, type: "jpeg", quality: 70 });
    } catch (e) {
      status = `error: ${String(e.message).split("\n")[0].slice(0, 80)}`;
    }
    results.push({ ...s, file: fs.existsSync(file) ? file : null, status });
    console.log(s.i + 1, s.key, status);
    await page.close();
  }
  await ctx.close();
}

await Promise.all([worker(), worker(), worker(), worker()]);
await browser.close();
results.sort((a, b) => a.i - b.i);
fs.writeFileSync(`${out}/shots.json`, JSON.stringify(results, null, 1));
