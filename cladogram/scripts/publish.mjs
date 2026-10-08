// Copies the static export (cladogram/out) into the repository root so GitHub Pages can
// serve it, giving the repo an index.html entry point. Runs automatically after
// `npm run build` (the "postbuild" script).
//
// Safety: the root also holds source material (PDFs, spreadsheet, this app's folder).
// A manifest records exactly what this script placed there, so a rebuild removes only
// its own previous output, and it refuses to overwrite anything it didn't create.
import { copyFileSync, cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const app = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(app, "out");
const root = resolve(app, "..");
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

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")).entries : [];
const entries = readdirSync(out);
const protectedNames = new Set([".git", ".github", "cladogram", ".gitignore", "README.md", ".pages-manifest.json"]);

// Refuse to clobber files we didn't put there.
const clashes = entries.filter((e) => protectedNames.has(e) || (existsSync(join(root, e)) && !previous.includes(e)));
if (clashes.length) {
  console.error(`publish: refusing to overwrite existing file(s) in the site root: ${clashes.join(", ")}`);
  console.error("Move or rename them, then run the build again.");
  process.exit(1);
}

// Remove the last published copy, then copy the fresh build.
for (const e of previous) rmSync(join(root, e), { recursive: true, force: true });
for (const e of entries) cpSync(join(out, e), join(root, e), { recursive: true });

// Without this, GitHub Pages' Jekyll step hides the "_next" folder (leading underscore).
writeFileSync(join(root, ".nojekyll"), "");

writeFileSync(
  MANIFEST,
  JSON.stringify({ note: "Files copied here by cladogram/scripts/publish.mjs. Safe to delete with them.", entries: [...entries, ".nojekyll"] }, null, 2) + "\n",
);
console.log(`publish: copied ${entries.length} item(s) to ${root} (entry point: index.html)`);
