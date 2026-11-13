// Copies the static export (cladogram/out) into the repository's docs/ folder, which
// GitHub Pages serves (Settings → Pages → Deploy from a branch → main, /docs). Runs
// automatically after `npm run build` (the "postbuild" script).
//
// Why docs/ and not the repo root: Pages serves everything in the folder it publishes,
// so publishing the root also put the source PDFs, spreadsheet and notes online. docs/
// holds only the built site and is replaced wholesale on every build.
//
//   node scripts/publish.mjs              build output → docs/
//   node scripts/publish.mjs --clean-root also remove the site copy that older versions of
//                                         this script placed in the repo root (listed in
//                                         .pages-manifest.json). Run it once, after Pages
//                                         has been switched to /docs.
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(app, "out");
const root = resolve(app, "..");
const docs = join(root, "docs");
const MANIFEST = join(root, ".pages-manifest.json");

if (!existsSync(join(out, "index.html"))) {
  console.error("publish: cladogram/out/index.html is missing. Did `next build` run with output: \"export\"?");
  process.exit(1);
}

// Next's static export writes client-navigation payloads as nested folders
// (circos/__next.circos/__PAGE__.txt) but the client requests them flat and
// dot-joined (circos/__next.circos.__PAGE__.txt). A static host can't map one to the
// other, so add the flat copies; otherwise every in-app navigation logs 404s.
function flattenPayloads(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".txt")) continue;
    const rel = relative(out, join(entry.parentPath, entry.name)).split(sep);
    const i = rel.findIndex((p) => p.startsWith("__next."));
    if (i < 0 || i === rel.length - 1) continue; // already flat
    const flat = join(out, ...rel.slice(0, i), rel.slice(i).join("."));
    if (!existsSync(flat)) copyFileSync(join(entry.parentPath, entry.name), flat);
  }
}
flattenPayloads(out);

// docs/ is ours alone: replace its contents with the fresh build. (Empty it rather than
// delete it, so a terminal or editor with docs/ open on Windows doesn't block the build.)
mkdirSync(docs, { recursive: true });
for (const e of readdirSync(docs)) rmSync(join(docs, e), { recursive: true, force: true });
cpSync(out, docs, { recursive: true });
// Without this, GitHub Pages' Jekyll step hides the "_next" folder (leading underscore).
writeFileSync(join(docs, ".nojekyll"), "");
console.log(`publish: copied the site to ${docs} (entry point: docs/index.html)`);

// One-off clean-up of the old root copy, listed in the manifest the previous version wrote.
if (process.argv.includes("--clean-root") && existsSync(MANIFEST)) {
  const previous = JSON.parse(readFileSync(MANIFEST, "utf8")).entries ?? [];
  for (const e of previous) rmSync(join(root, e), { recursive: true, force: true });
  rmSync(MANIFEST);
  console.log(`publish: removed ${previous.length} old site item(s) from the repo root`);
}
