/**
 * Short history and facts for every breed on the site, from English Wikipedia (text under
 * CC BY-SA 4.0, credited in each tooltip and in SOURCES.md). Writes src/data/breedFacts.json,
 * keyed by study code ("CHOW") or "akc:<slug>" for AKC breeds the study didn't sample.
 *
 *   node scripts/fetch-breed-facts.mjs
 *
 * For each breed: find its article (the title already used for its Commons photo, else the
 * breed name, "<name> (dog)" or a search), confirm it is a dog-breed article (it uses the
 * "Infobox dog breed" template), then keep the infobox's origin, height, weight and life
 * span, and the first two sentences of the History section (or of the lead if it has none).
 * Responses are cached in scripts/.cache/wiki so reruns are cheap.
 */
import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const ROOT = new URL("..", import.meta.url);
const read = (p) => JSON.parse(readFileSync(new URL(p, ROOT)));
const tree = read("src/data/cladogram.json");
const akc = read("src/data/akc.json");
const commons = read("src/data/commons.json");
const CACHE = new URL("scripts/.cache/wiki/", ROOT);
mkdirSync(CACHE, { recursive: true });
const UA = "DogGenes-site-builder/1.0 (https://github.com/mforando/DogGenes)";

async function get(url) {
  const f = new URL(createHash("sha1").update(url).digest("hex") + ".json", CACHE);
  if (existsSync(f)) return JSON.parse(readFileSync(f));
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
    if (r.status === 429 && attempt < 5) {
      await new Promise((res) => setTimeout(res, 2000 * (attempt + 1)));
      continue;
    }
    if (!r.ok) return { error: r.status }; // don't cache failures
    const j = await r.json();
    writeFileSync(f, JSON.stringify(j));
    return j;
  }
}
const API = "https://en.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&";
const q = (params) => get(API + new URLSearchParams(params));

// Hand-picked titles where the name alone lands on the wrong page.
const TITLE = {
  WOLF: "Wolf",
  GDJK: "Golden jackal",
  XIGO: "Xigou",
  GREE: "Greenland Dog",
  MNTY: "Toy Manchester Terrier",
  LVMD: "Levriero Meridionale",
  MAAB: "Maremma Sheepdog",
  CPAT: "Cane Paratore",
  COOK: "Chinook (dog)",
  INCA: "Peruvian Hairless Dog",
  BOX: "Boxer (dog)",
  PUG: "Pug",
  COLL: "Collie",
  KELP: "Australian Kelpie",
  PUMI: "Pumi (dog)",
  PULI: "Puli (dog)",
  BRIT: "Brittany (dog)",
  AKIT: "Akita (dog)",
  MALT: "Maltese dog",
  BULD: "Bulldog",
  ITGY: "Italian Greyhound",
  VPIN: "Volpino Italiano",
  SPOO: "Poodle",
  TPOO: "Toy Poodle",
  MPOO: "Miniature Poodle",
  BSJI: "Basenji",
  LAB: "Labrador Retriever",
  STAF: "Staffordshire Bull Terrier",
  NEWF: "Newfoundland dog",
  DALM: "Dalmatian (dog)",
};

async function isBreed(title) {
  const j = await q({ action: "query", prop: "templates|info", titles: title, redirects: 1, tltemplates: "Template:Infobox dog breed|Template:Speciesbox|Template:Taxobox|Template:Automatic taxobox", tllimit: 10, inprop: "url" });
  const p = j.query?.pages?.[0];
  if (!p || p.missing) return null;
  return p.templates?.length ? { title: p.title, url: p.fullurl } : null;
}

async function findArticle(name, hint) {
  for (const t of [hint, name, `${name} (dog)`, `${name} (dog breed)`].filter(Boolean)) {
    const hit = await isBreed(t);
    if (hit) return hit;
  }
  const s = await q({ action: "query", list: "search", srsearch: `${name} dog breed`, srlimit: 3 });
  const words = name.toLowerCase().split(/[\s-]+/).filter((w) => w.length > 3);
  for (const r of s.query?.search ?? []) {
    if (!words.some((w) => r.title.toLowerCase().includes(w.slice(0, 5)))) continue;
    const hit = await isBreed(r.title);
    if (hit) return hit;
  }
  return null;
}

const strip = (html) =>
  html
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
    .replace(/<br\s*\/?>/g, "; ")
    .replace(/<\/(li|p|div)>/g, "; ")
    .replace(/<[^>]+>/g, "")
    .replace(/&#160;|&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/g, " ")
    .replace(/\[\d+\]|\[[a-z]\]|\[citation needed\]|\[note \d+\]/gi, "")
    .replace(/\s*;\s*(;\s*)+/g, "; ")
    .replace(/\s+/g, " ")
    .replace(/^[;\s]+|[;\s]+$/g, "")
    .trim();

/** The first n sentences of plain text (not splitting on "c." or initials). */
function sentences(text, n) {
  const ABBR = /(?:\b(?:St|Mt|Dr|Mr|Mrs|Ms|Jr|Sr|No|ca|c|approx|vs|U\.S|e\.g|i\.e|etc)|\b[A-Z])\.$/;
  const out = [];
  let cur = "";
  for (const piece of text.split(/(?<=[.!?])\s+/)) {
    cur += (cur ? " " : "") + piece;
    if (ABBR.test(cur)) continue; // "St." or an initial: not the end of a sentence
    out.push(cur);
    cur = "";
    if (out.length >= n || out.join(" ").length > 260) break;
  }
  if (cur && out.length < n) out.push(cur);
  return out.join(" ").replace(/\s*\(\s*[;,]?\s*\)/g, "").replace(/\s+([,.;])/g, "$1").trim();
}

/** Infobox rows as label → text. */
function infobox(html) {
  const box = html.match(/<table class="infobox[\s\S]*?<\/table>/)?.[0] ?? "";
  const rows = {};
  let section = "";
  for (const tr of box.match(/<tr[\s\S]*?<\/tr>/g) ?? []) {
    const th = tr.match(/<th[^>]*>([\s\S]*?)<\/th>/)?.[1];
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
    if (th && !tds.length) continue;
    if (th) section = strip(th);
    if (!section || !tds.length) continue;
    // "Height | Males | 60–65 cm" and the unlabelled "| Females | 55–60 cm" row after it.
    if (tds.length >= 2 && /^(fe)?males?$/i.test(tds[0])) rows[`${section} ${/^fe/i.test(tds[0]) ? "Females" : "Males"}`] = tds[1];
    else rows[section] = tds.join("; ");
  }
  return rows;
}

const pick = (rows, ...labels) => {
  for (const l of labels) {
    const k = Object.keys(rows).find((r) => r.toLowerCase() === l.toLowerCase());
    if (k && rows[k]) return rows[k];
  }
  return undefined;
};
/** "Males 56–61 cm (22–24 in)" + "Females …" → one short line. */
const range = (texts, unit) => {
  const nums = texts.flatMap((t) => [...t.matchAll(new RegExp(`(\\d+(?:\\.\\d+)?)(?:\\s*(?:–|-|to)\\s*(\\d+(?:\\.\\d+)?))?\\s*${unit}\\b`, "g"))].flatMap((m) => [+m[1], +(m[2] ?? m[1])]));
  if (!nums.length) return null;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  return lo === hi ? `${lo} ${unit}` : `${lo}–${hi} ${unit}`;
};
function measure(rows, what) {
  const texts = [`${what} Males`, `${what} Females`, what].map((l) => pick(rows, l)).filter(Boolean);
  const metric = range(texts, what === "Height" ? "cm" : "kg");
  const imperial = range(texts, what === "Height" ? "in" : "lb");
  if (metric) return imperial ? `${metric} (${imperial})` : metric;
  return measureRaw(rows, what);
}
function measureRaw(rows, what) {
  const m = pick(rows, `${what} Males`, `${what} Male`);
  const f = pick(rows, `${what} Females`, `${what} Female`);
  const one = pick(rows, what);
  const tidy = (s) => s && s.replace(/\s*\(\s*/g, " (").replace(/;\s*$/, "").slice(0, 70);
  if (m && f) return m === f ? tidy(m) : `${tidy(m)} (males), ${tidy(f)} (females)`.replace(/\) \(males\)/, "; males)").replace(/\) \(females\)/, "; females)");
  return tidy(one ?? m ?? f);
}

async function facts(key, name, hint) {
  const art = await findArticle(name, hint);
  if (!art) return null;
  const sum = await get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(art.title.replace(/ /g, "_"))}`);
  const intro = (sum.extract ?? "").replace(/\s+/g, " ").trim();
  const sec = await q({ action: "parse", page: art.title, prop: "sections", redirects: 1 });
  const hist = sec.parse?.sections?.find((s) => /^(history|origins?|history and origins?|origin and history)$/i.test(s.line));
  let history = "";
  if (hist) {
    const h = await q({ action: "parse", page: art.title, prop: "text", section: hist.index, redirects: 1, disabletoc: 1 });
    const ps = (h.parse?.text ?? "").match(/<p>[\s\S]*?<\/p>/g) ?? [];
    const text = ps.map(strip).find((p) => p.length > 60) ?? "";
    history = sentences(text, 2);
  }
  const top = await q({ action: "parse", page: art.title, prop: "text", section: 0, redirects: 1, disabletoc: 1 });
  const rows = infobox(top.parse?.text ?? "");
  const origin = pick(rows, "Origin", "Country of origin");
  // Kept short for the tooltips: one sentence of what the breed is, one of its history
  // (two if the first is very short), plus the infobox facts. Keys are terse because this
  // file ships with every chart.
  const one = (t) => {
    const s1 = sentences(t, 1);
    return s1.length < 70 ? sentences(t, 2) : s1;
  };
  const out = {
    w: decodeURIComponent(art.url.replace("https://en.wikipedia.org/wiki/", "")),
    a: one(intro),
    h: history ? one(history) : undefined,
    o: origin ? origin.replace(/;.*$/, "").slice(0, 60) : undefined,
    ht: measure(rows, "Height"),
    wt: measure(rows, "Weight"),
  };
  for (const k of Object.keys(out)) if (out[k] === undefined || out[k] === "") delete out[k];
  return out;
}

// ---------- every breed the site shows ----------
const jobs = [];
for (const [code, b] of Object.entries(tree.breeds)) {
  jobs.push({ key: code, name: b.name, hint: TITLE[code] ?? commons[`code:${code}`]?.article });
}
for (const b of akc.breeds) {
  if (b.code) continue;
  jobs.push({ key: `akc:${b.slug}`, name: b.name, hint: commons[`akc:${b.slug}`]?.article });
}

const result = {};
const missing = [];
let done = 0;
const POOL = 4;
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (jobs.length) {
      const j = jobs.shift();
      try {
        const f = await facts(j.key, j.name, j.hint);
        if (f) result[j.key] = f;
        else missing.push(j.key + " " + j.name);
      } catch (e) {
        missing.push(`${j.key} ${j.name} (${e.message})`);
      }
      if (++done % 25 === 0) console.log(done, "done");
    }
  }),
);
const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
// One breed per line: compact, but still readable in a diff.
const lines = Object.entries(sorted).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`);
writeFileSync(new URL("src/data/breedFacts.json", ROOT), `{\n${lines.join(",\n")}\n}\n`);
console.log(`wrote ${Object.keys(sorted).length} breeds; missing ${missing.length}:`, missing.join(" | "));
