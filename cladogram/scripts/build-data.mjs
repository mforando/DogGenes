// Builds src/data/cladogram.json from the raw study data:
//   data/tree.nwk    — Newick string extracted from treeFile.pdf (NEXUS, Parker et al. 2017)
//   data/breeds.json — clade / breed / code table + significant haplotype sharing
//                      (extracted from haplotypeSharing.xlsx, Supplemental Table 2)
//
// In the NEXUS file every tip has length 100 and each internal "branch length"
// is actually the bootstrap support (out of 100 replicates) for that node.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const newick = readFileSync(join(root, "data/tree.nwk"), "utf8").trim();
const { breeds, sharing: rawSharing } = JSON.parse(readFileSync(join(root, "data/breeds.json"), "utf8"));
// The spreadsheet's column header spells the Large Munsterlander "KMUN"; its row says "LMUN".
const HEADER_ALIAS = { KMUN: "LMUN" };
const sharing = rawSharing.map(([a, b, v]) => [HEADER_ALIAS[a] ?? a, HEADER_ALIAS[b] ?? b, v]);
// Spreadsheet clades as published (incl. "*" weak placements), before the tree page edits them.
const sheetClade = Object.fromEntries(breeds.map((b) => [b.code, b.clade]));

// Sample IDs use a few prefixes that differ from the spreadsheet's breed codes
// (samples genotyped at other labs carry their own short prefixes).
const PREFIX_ALIAS = {
  EBD: "BULD", Rtw: "ROTT", Dob: "DOBP", BoC: "BORD", Gry: "GREY", IrW: "IWOF",
  BeT: "TURV", GRe: "GOLD", LRe: "LAB", NFd: "NEWF", NSD: "NSDT", KMUN: "LMUN",
  GoS: "GORD", GSET: "GORD", ESt: "ESET", BrS: "BRIT", Wei: "WEIM", CoS: "ECKR",
  Bgl: "BEAG", Dac: "DACH", GSh: "GSD", TYo: "YORK", JRT: "JACK", BoT: "BORT",
  StP: "SPOO", Sci: "SKIP", Elk: "NELK", FSp: "FINS", Eur: "EURA", GSl: "GREE",
  ShP: "SHAR",
};

// Clade display names, in the order the paper's Figure 2 introduces them.
const CLADES = {
  AsianSpitz: "Asian Spitz", AsianToy: "Asian Toy", NordicSpitz: "Nordic Spitz",
  Schnauzer: "Schnauzer", SmallSpitz: "Small Spitz", ToySpitz: "Toy Spitz",
  Hungarian: "Hungarian", Poodle: "Poodle", AmericanToy: "American Toy",
  AmericanTerrier: "American Terrier", Pinscher: "Pinscher", Terrier: "Terrier",
  NewWorld: "New World", Mediterranean: "Mediterranean", ScentHound: "Scent Hound",
  Spaniel: "Spaniel", Retriever: "Retriever", PointerSetter: "Pointer Setter",
  ContinentalHerder: "Continental Herder", UKRural: "UK Rural", Drover: "Drover",
  Alpine: "Alpine", EuropeanMastiff: "European Mastiff",
};

const breedByCode = new Map(breeds.map((b) => [b.code, b]));
// Fix spreadsheet quirks and add the jackal outgroup.
breedByCode.get("FINS").name = "Finnish Spitz";
breedByCode.get("PUG").name = "Pug";
breedByCode.get("JACK").name = "Jack Russell Terrier";
breedByCode.set("GDJK", { code: "GDJK", name: "Golden Jackal", clade: null });
breedByCode.get("TIBM").name = "Tibetan Mastiff";
breedByCode.get("SALU").name = "Saluki";
breedByCode.get("CANE").name = "Cane Corso";
// Population-level codes in the sharing matrix that the tree files under one prefix.
const POP_ALIAS = { CHTM: "TIBM", COOS: "SALU", ITCC: "CANE" };
// Breeds that sit in a clade at <50% support (marked * in the spreadsheet) are
// treated as unclustered, matching the paper's count of 23 clades / 150 breeds.
for (const b of breedByCode.values()) if (b.weakClade) b.clade = null;
// "Wild" and "Basenji" are not breed clades in the paper.
for (const b of breedByCode.values()) if (b.clade && !CLADES[b.clade]) b.clade = null;

// ---------- Newick parser ----------
function parse(s) {
  let i = 0;
  function node() {
    const n = { children: [] };
    if (s[i] === "(") {
      i++;
      n.children.push(node());
      while (s[i] === ",") { i++; n.children.push(node()); }
      i++; // ')'
    }
    let label = "";
    while (i < s.length && !",():;".includes(s[i])) label += s[i++];
    if (s[i] === ":") {
      i++;
      let num = "";
      while (i < s.length && !",();".includes(s[i])) num += s[i++];
      n.length = parseFloat(num);
    }
    if (label) n.name = label;
    return n;
  }
  return node();
}

const tree = parse(newick);

function codeOf(sample) {
  const p = sample.split("_")[0];
  const code = PREFIX_ALIAS[p] ?? p;
  if (!breedByCode.has(code)) throw new Error(`Unknown sample prefix ${p} (${sample})`);
  return code;
}

// Annotate leaf breed sets bottom-up.
function annotate(n) {
  if (!n.children.length) {
    n.code = codeOf(n.name);
    n.codes = new Set([n.code]);
    n.samples = [n.name];
    return;
  }
  n.children.forEach(annotate);
  n.codes = new Set(n.children.flatMap((c) => [...c.codes]));
  n.samples = n.children.flatMap((c) => c.samples);
}
annotate(tree);

// Collapse maximal single-breed subtrees into "wedge" leaves (Figure 1's triangles).
let nextId = 0;
function collapse(n, depth) {
  const id = nextId++;
  if (n.codes.size === 1) {
    return { id, t: "b", code: [...n.codes][0], n: n.samples.length, s: n.samples };
  }
  return {
    id,
    t: "i",
    bs: n.length ?? 100, // root carries no support value
    c: n.children.map((c) => collapse(c, depth + 1)),
  };
}
const out = collapse(tree, 0);

// Mark which fragment of a split breed is the "main" one (most dogs).
const frags = new Map();
(function walk(n) {
  if (n.t === "b") (frags.get(n.code) ?? frags.set(n.code, []).get(n.code)).push(n);
  else n.c.forEach(walk);
})(out);
for (const list of frags.values()) {
  list.sort((a, b) => b.n - a.n);
  list.forEach((f, k) => { f.main = k === 0; f.frags = list.length; });
}

const breedTable = {};
for (const [code, b] of breedByCode) {
  if (!frags.has(code)) continue;
  breedTable[code] = { name: b.name, clade: b.clade };
}

// Symmetric breed-pair sharing (keep the max of the two directions).
const pair = new Map();
for (const [a0, b0, v] of sharing) {
  const a = POP_ALIAS[a0] ?? a0, b = POP_ALIAS[b0] ?? b0;
  if (a === b || !breedTable[a] || !breedTable[b]) continue;
  const k = a < b ? `${a}|${b}` : `${b}|${a}`;
  pair.set(k, Math.max(pair.get(k) ?? 0, v));
}
const links = [...pair].map(([k, v]) => [...k.split("|"), v]);

const stats = {
  dogs: tree.samples.length,
  breeds: Object.keys(breedTable).filter((c) => !["WOLF", "GDJK"].includes(c)).length,
  wedges: [...frags.values()].reduce((s, l) => s + l.length, 0),
};

writeFileSync(
  join(root, "src/data/cladogram.json"),
  JSON.stringify({ stats, clades: CLADES, breeds: breedTable, tree: out, links }),
);
// ---------- Figure 4 (circos) ----------
// One segment per breed population in the spreadsheet's row order, which is the
// paper's circos order (wolf first, then counter-clockwise in cladogram order).
// Unlike the tree page, breeds placed in a clade at <50% support keep that clade
// here, because Figure 4 colors and groups them that way.
const POP_NAME = {
  CHTM: "Tibetan Mastiff (China)", TIBM: "Tibetan Mastiff (US)",
  COOS: "Saluki (country of origin)", SALU: "Saluki (US)",
  ITCC: "Cane Corso (Italy)", CANE: "Cane Corso (US)",
  FINS: "Finnish Spitz", PUG: "Pug", JACK: "Jack Russell Terrier",
};
const circosNodes = breeds.map((b) => {
  const clade = sheetClade[b.code]?.replace("*", "") ?? null;
  return {
    code: b.code,
    name: POP_NAME[b.code] ?? b.name,
    clade: clade && CLADES[clade] ? clade : null,
    group: clade ?? "Unclustered", // Wild / Basenji / Unclustered count as their own group
  };
});
const groupOf = Object.fromEntries(circosNodes.map((n) => [n.code, n.group]));
const cpair = new Map();
for (const [a, b, v] of sharing) {
  const k = a < b ? `${a}|${b}` : `${b}|${a}`;
  cpair.set(k, Math.max(cpair.get(k) ?? 0, v));
}
const circosLinks = [];
for (const [k, v] of cpair) {
  const [a, b] = k.split("|");
  // Ribbons only join breeds from different clades; unclustered breeds have no clade.
  const cross = groupOf[a] === "Unclustered" || groupOf[b] === "Unclustered" || groupOf[a] !== groupOf[b];
  circosLinks.push([a, b, v, cross ? 1 : 0]);
}
writeFileSync(
  join(root, "src/data/circos.json"),
  JSON.stringify({ clades: CLADES, nodes: circosNodes, links: circosLinks }),
);

console.log(stats, "links:", links.length, "circos cross links:", circosLinks.filter((l) => l[3]).length,
  "split breeds:", [...frags].filter(([, l]) => l.length > 1).map(([c, l]) => `${c}×${l.length}`).join(" "));
