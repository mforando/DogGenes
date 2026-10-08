// Serves the published copy in the repository root exactly as GitHub Pages would,
// including the /<repo>/ prefix: http://localhost:3123/<repo>/
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { pagesBasePath, siteRoot } from "./base-path.mjs";

const base = pagesBasePath();
const port = Number(process.env.PORT ?? 3123);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".png": "image/png", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
};

createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? "/").split("?")[0]);
  if (base && url === "/") {
    res.writeHead(302, { Location: `${base}/` }).end();
    return;
  }
  if (!url.startsWith(base + "/")) {
    res.writeHead(404).end("Not under the site base path");
    return;
  }
  let file = normalize(join(siteRoot, url.slice(base.length)));
  if (!file.startsWith(siteRoot)) {
    res.writeHead(403).end();
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
  if (!existsSync(file)) file = join(siteRoot, "404.html");
  res.writeHead(file.endsWith("404.html") && !url.endsWith("404.html") ? 404 : 200, {
    "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Preview: http://localhost:${port}${base}/`));
