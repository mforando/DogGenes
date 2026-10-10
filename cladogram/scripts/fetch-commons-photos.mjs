// Finds a freely licensed photo on Wikimedia Commons for every breed the site shows
// without a Dog CEO photo, and writes src/data/commons.json with the image URL and the
// credit each license requires (author, license, link to the file page).
// Run with: npm run commons   (results are committed so the site needs no API at runtime)
//
// For each breed it takes the lead image of the breed's English Wikipedia article, but
// only if Wikipedia marks the image as free (pilicense=free) and its Commons license is
// public domain, CC0, CC BY or CC BY-SA. Pages must be in a dog-breed category, so a
// disambiguation page or an unrelated article is never used. Results were checked by
// eye; REJECT lists images that were the wrong breed, a painting, or a poor crop.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const UA = { "User-Agent": "DogGenes/1.0 (https://github.com/mforando/DogGenes; educational site)" };

const tree = read("src/data/cladogram.json").breeds;
const dogceo = read("src/data/photos.json");
const akc = read("src/data/akc.json").breeds;

/** Article titles where the breed name alone doesn't find the right page. */
const TITLES = {
  "Grey Wolf": ["Wolf"],
  "Golden Jackal": ["Golden jackal"],
  Xigou: ["Xigou"],
  Volpino: ["Volpino Italiano"],
  "Toy Manchester Terrier": ["Manchester Terrier"],
  "Miniature Xoloitzcuintli": ["Xoloitzcuintle"],
  "Cane Paratore": ["Cane Paratore"],
  "Levriero Meridionale": ["Levriero Meridionale"],
  "Mastino Abruzzese": ["Mastino Abruzzese"],
  "Anatolian Shepherd": ["Anatolian Shepherd"],
  "American Cocker Spaniel": ["American Cocker Spaniel"],
  "Cocker Spaniel": ["American Cocker Spaniel"],
  "Petit Basset Griffon Vendeen": ["Petit Basset Griffon Vendéen"],
  "Petit Basset Griffon Vendéen": ["Petit Basset Griffon Vendéen"],
  "Grand Basset Griffon Vendéen": ["Grand Basset Griffon Vendéen"],
  "Cirneco dell'Etna": ["Cirneco dell'Etna"],
  "Cirneco dell’Etna": ["Cirneco dell'Etna"],
  "Löwchen": ["Löwchen"],
  Pointer: ["Pointer (dog breed)"],
  Harrier: ["Harrier (dog)"],
  "Manchester Terrier": ["Manchester Terrier"],
  "Portuguese Podengo Pequeno": ["Portuguese Podengo"],
  "Russian Toy": ["Russian Toy"],
  Mudi: ["Mudi"],
  Pumi: ["Pumi (dog)"],
  Puli: ["Puli (dog)"],
  Barbet: ["Barbet (dog)"],
  Chinook: ["Chinook (dog)"],
  "Greenland Sledge Dog": ["Greenland Dog"],
};
/** Breeds with no English article: try Italian Wikipedia. */
const TITLES_IT = {
  "Levriero Meridionale": ["Levriero meridionale"],
  "Mastino Abruzzese": ["Mastino abruzzese"],
};
/** Hand-picked Commons files, used when there is no suitable breed article. */
const FILES = {
  // The articles' lead images are paintings or a four-variety collage.
  "code:MNTY": "ToyManchesterTerrier.jpg",
  "akc:manchester-terrier-standard": "Manchester terrier Koira 2013.JPG",
  "akc:belgian-laekenois": "Laekenois Shepherd.JPG",
  // No breed article; picked from Commons' Goldendoodle photos.
  "name:Goldendoodle": "Goldendoodle on the beach.jpg",
};
/** Breeds whose lead image was checked and rejected (wrong dog, artwork, unusable crop). */
const REJECT = new Set([
  // Italian Wikipedia redirects this to the Maremma Sheepdog, a look-alike breed.
  "code:MAAB",
]);

const FREE = /^(public domain|pd\b|cc0|cc[ -]by(-sa)?[ -]\d|copyrighted free use)/i;
const strip = (h) => (h ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
/** Commons boilerplate like "No machine-readable author provided. X assumed (...)" → "X". */
const cleanAuthor = (a) =>
  a.replace(/^No machine-readable author provided\.\s*/i, "").replace(/\s*assumed \(based on copyright claims\)\.?$/i, "").replace(/~commonswiki$/i, "").trim() || "Unknown author";

async function api(host, params) {
  const url = `https://${host}/w/api.php?` + new URLSearchParams({ format: "json", formatversion: "2", ...params });
  // Be gentle with the API: space requests out and honor Retry-After when throttled.
  for (let tries = 0; tries < 6; tries++) {
    await new Promise((r) => setTimeout(r, 400));
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res.json();
    const wait = Number(res.headers.get("retry-after")) || 5 * (tries + 1);
    console.warn(`\n${res.status}, retrying in ${wait}s`);
    await new Promise((r) => setTimeout(r, wait * 1000));
  }
  throw new Error(`API failed: ${url}`);
}

/**
 * The breed's Wikipedia article, its free lead image, then the article's other photos
 * (tried in order when the lead image's license doesn't qualify).
 */
async function lookup(name, host = "en.wikipedia.org", titles = TITLES[name] ?? [`${name} (dog)`, `${name} (dog breed)`, name]) {
  const j = await api(host, {
    action: "query",
    redirects: "1",
    titles: titles.join("|"),
    prop: "pageimages|categories|images",
    piprop: "name",
    pilicense: "free",
    cllimit: "max",
    clshow: "!hidden",
    imlimit: "max",
  });
  const pages = j.query?.pages ?? [];
  // Follow the candidate order, through any redirects.
  const resolve = (t) => {
    const n = j.query?.normalized?.find((x) => x.from === t)?.to ?? t;
    return j.query?.redirects?.find((x) => x.from === n)?.to ?? n;
  };
  for (const t of titles) {
    const page = pages.find((p) => p.title === resolve(t) && !p.missing);
    if (!page) continue;
    const cats = (page.categories ?? []).map((c) => c.title).join(" ");
    if (!/dog breed|dog types|wolves|jackal|canis|mammals|razze canine/i.test(cats)) continue;
    const others = (page.images ?? [])
      .map((i) => i.title.replace(/^[^:]+:/, ""))
      .filter((f) => /\.(jpe?g|png)$/i.test(f) && f !== page.pageimage);
    const files = [page.pageimage, ...others].filter(Boolean);
    if (!files.length) return { article: page.title, reason: "no photos in the article" };
    return { article: page.title, files };
  }
  return { reason: "no matching breed article" };
}

async function credit(file) {
  const j = await api("commons.wikimedia.org", {
    action: "query",
    titles: `File:${file}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "480",
  });
  const info = j.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) return { reason: "file not on Commons" };
  const m = info.extmetadata ?? {};
  const license = strip(m.LicenseShortName?.value);
  if (!FREE.test(license)) return { reason: `license not allowed: ${license}` };
  return {
    url: info.thumburl,
    page: info.descriptionurl,
    author: cleanAuthor(strip(m.Artist?.value)),
    license,
    licenseUrl: m.LicenseUrl?.value ?? null,
  };
}

// Everything the site shows without a Dog CEO photo.
const wanted = new Map(); // key → breed name
for (const [code, b] of Object.entries(tree)) if (!dogceo[code]?.urls?.length) wanted.set(`code:${code}`, b.name);
for (const b of akc) if (!b.code) wanted.set(`akc:${b.slug}`, b.name);
for (const n of ["Goldendoodle"]) wanted.set(`name:${n}`, n);

const out = {};
const missing = [];
for (const [key, name] of wanted) {
  if (REJECT.has(key)) {
    missing.push(`${key} (${name}): rejected after review`);
    continue;
  }
  let found = FILES[key] ? { article: null, files: [FILES[key]] } : await lookup(name);
  if (!found.files && TITLES_IT[name]) found = await lookup(name, "it.wikipedia.org", TITLES_IT[name]);
  if (!found.files) {
    missing.push(`${key} (${name}): ${found.reason}${found.article ? ` [${found.article}]` : ""}`);
    continue;
  }
  let c = { reason: "no file with an allowed license" };
  let file = null;
  for (const f of found.files.slice(0, 8)) {
    c = await credit(f);
    if (c.url) {
      file = f;
      break;
    }
  }
  if (!c.url) {
    missing.push(`${key} (${name}): ${c.reason}`);
    continue;
  }
  out[key] = { name, article: found.article, file, ...c };
  process.stdout.write(".");
}

writeFileSync(join(root, "src/data/commons.json"), JSON.stringify(out, null, 1) + "\n");

// Credits table in SOURCES.md, between the markers (rewritten on every run).
const cell = (t) => String(t).replace(/\|/g, "\\|");
const rows = Object.values(out)
  .sort((a, b) => a.name.localeCompare(b.name))
  .filter((p, i, all) => all.findIndex((q) => q.url === p.url) === i)
  .map((p) => {
    const lic = p.licenseUrl ? `[${p.license}](${p.licenseUrl})` : p.license;
    const author = p.author === "Unknown author" ? "Not stated (see file page)" : cell(p.author);
    return `| ${cell(p.name)} | [${cell(p.file.replace(/_/g, " "))}](${p.page}) | ${author} | ${lic} |`;
  });
const table = ["| Breed | Photo (Wikimedia Commons file page) | Author | License |", "|---|---|---|---|", ...rows].join("\n");
const sourcesPath = join(root, "..", "SOURCES.md");
const START = "<!-- commons-credits:start -->";
const END = "<!-- commons-credits:end -->";
const md = readFileSync(sourcesPath, "utf8");
if (md.includes(START)) {
  const a = md.indexOf(START) + START.length;
  writeFileSync(sourcesPath, md.slice(0, a) + "\n" + table + "\n" + md.slice(md.indexOf(END)));
  console.log(`credits for ${rows.length} photos written to SOURCES.md`);
}
console.log(`\n${Object.keys(out).length} photos written to src/data/commons.json`);
if (missing.length) console.log(`No photo for ${missing.length}:\n  ` + missing.join("\n  "));
