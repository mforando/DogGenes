// Pulls photo URLs from the Dog CEO API (https://dog.ceo/dog-api/) for every study
// breed that the API also covers, and writes src/data/photos.json.
// Run with: npm run photos   (results are committed so the site needs no API at runtime)
//
// The API's breeds come from the Stanford Dogs / ImageNet sets, so a few similar
// names are different breeds (e.g. API "terrier/toy" is the English toy terrier,
// not the toy fox terrier; "waterdog/spanish" is not the Portuguese water dog).
// Those are deliberately left unmapped.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PER_BREED = 4;

/** study breed code → Dog CEO "breed" or "breed/sub-breed" (shared with build-explorer.py) */
const MAP = JSON.parse(readFileSync(join(root, "scripts/dogceo-map.json"), "utf8"));
/**
 * Hand-checked first photos (study code → file in the breed's folder): picked so the whole
 * dog shows in the chart tooltips' wide crop (using the Stanford Dogs bounding boxes where
 * available, by eye otherwise). The first photo is the one shown everywhere.
 */
const FIRST = JSON.parse(readFileSync(join(root, "scripts/photo-overrides.json"), "utf8"));

const out = {};
const missing = [];
for (const [code, path] of Object.entries(MAP)) {
  const res = await fetch(`https://dog.ceo/api/breed/${path}/images`);
  const json = await res.json();
  if (json.status !== "success") {
    missing.push(`${code} (${path}): ${json.message}`);
    continue;
  }
  // A base breed's list includes its sub-breeds' folders; keep only the exact one.
  const folder = `/breeds/${path.replace("/", "-")}/`;
  const urls = json.message.filter((u) => u.includes(folder)).sort();
  if (!urls.length) {
    missing.push(`${code} (${path}): no images in ${folder}`);
    continue;
  }
  // Evenly spaced picks keep the selection stable between runs.
  const step = urls.length / PER_BREED;
  const picks = [...new Set(Array.from({ length: Math.min(PER_BREED, urls.length) }, (_, i) => urls[Math.floor(i * step)]))];
  const first = FIRST[code] ? `https://images.dog.ceo/breeds/${path.replace("/", "-")}/${FIRST[code]}` : null;
  const ordered = first ? [first, ...picks.filter((u) => u !== first)].slice(0, PER_BREED) : picks;
  out[code] = { api: path, urls: ordered };
}

writeFileSync(join(root, "src/data/photos.json"), JSON.stringify(out, null, 1));
console.log(`photos for ${Object.keys(out).length} breeds`);
if (missing.length) console.log("skipped:\n  " + missing.join("\n  "));
