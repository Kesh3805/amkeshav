// Minimal static server for the exported site in out/, used by the e2e suite.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("out");
const port = Number(process.env.PORT ?? 4310);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
};

http
  .createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    let file = path.join(root, url);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) {
      res.writeHead(404, { "content-type": types[".html"] });
      return fs.createReadStream(path.join(root, "404.html")).pipe(res);
    }
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`serving out/ on http://localhost:${port}`));
