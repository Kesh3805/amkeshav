// Checks which Chromium launch mode gives real GPU WebGL on this machine, using a heavy WebGL site.
import { chromium } from "@playwright/test";

const url = process.argv[2] ?? "https://bruno-simon.com";
const modes = {
  "edge-gpu": { channel: "msedge", args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu"] },
  "chrome-gpu": { channel: "chrome", args: ["--enable-gpu", "--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-unsafe-webgpu"] },
};
for (const [name, opts] of Object.entries(modes)) {
  try {
    const b = await chromium.launch(opts);
    const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
    const info = await p.evaluate(() => {
      const c = document.createElement("canvas");
      const gl = c.getContext("webgl2") || c.getContext("webgl");
      if (!gl) return "no webgl";
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    });
    const gpu = await p.evaluate(async () => (navigator.gpu ? !!(await navigator.gpu.requestAdapter()) : false));
    await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(12000);
    await p.screenshot({ path: `artifacts/gpu-probe-${name}.jpg`, type: "jpeg", quality: 70, timeout: 60000 });
    console.log(name, "| renderer:", info, "| webgpu adapter:", gpu);
    await b.close();
  } catch (e) {
    console.log(name, "failed:", String(e.message).split("\n")[0]);
  }
}
