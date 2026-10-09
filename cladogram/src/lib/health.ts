import { data, ringOrder } from "./tree";

/**
 * Inherited disease variants shared across breeds. Carrier breeds are those listed for
 * the variant in OMIA (Online Mendelian Inheritance in Animals, omia.org) or in the
 * papers cited, restricted to breeds sampled in Parker et al. 2017 so they can be placed
 * on the family tree. Lists are not exhaustive: many breeds have never been tested.
 */
export type Variant = {
  id: string;
  name: string;
  short: string;
  gene: string;
  what: string;
  /** study breed codes documented as carrying the variant */
  carriers: string[];
  source: { label: string; url: string };
  note?: string;
};

export const VARIANTS: Variant[] = [
  {
    id: "cea",
    name: "Collie eye anomaly",
    short: "Collie eye",
    gene: "NHEJ1 (7.8 kb deletion)",
    what: "Abnormal development of the back of the eye; ranges from mild to blindness.",
    carriers: ["COLL", "SSHP", "AUSS", "BORD", "OES", "KELP", "NSDT", "PARS", "JACK", "HUSK", "COOK"],
    source: { label: "OMIA 000218-9615", url: "https://omia.org/OMIA000218/9615/" },
    note: "The same deletion, inherited from a shared ancestor, in every breed tested (Parker et al. 2007).",
  },
  {
    id: "mdr1",
    name: "Multidrug sensitivity (MDR1)",
    short: "MDR1",
    gene: "ABCB1 (4 bp deletion)",
    what: "Dangerous reactions to common drugs, including some dewormers and chemotherapy.",
    carriers: ["COLL", "SSHP", "AUSS", "BORD", "OES", "GSD", "COOK"],
    source: { label: "OMIA 001402-9615", url: "https://omia.org/OMIA001402/9615/" },
    note: "Found in about 10% of German shepherds and 15% of chinooks (cited in Parker et al. 2017).",
  },
  {
    id: "dm",
    name: "Degenerative myelopathy",
    short: "Degen. myelopathy",
    gene: "SOD1 (E40K)",
    what: "Slowly progressive paralysis of the hind legs in older dogs; resembles ALS in people.",
    carriers: [
      "AMAL", "AESK", "AUCD", "AUSS", "BELS", "BMAL", "BMD", "BLDH", "BORD", "BORZ", "BOX", "BRIA", "CARD", "CKCS",
      "CRES", "COLL", "COTO", "DALM", "DOBP", "MAST", "ESSP", "FBUL", "GSD", "GOLD", "GPYR", "IWOF", "ISET", "JACK",
      "KERY", "KOMO", "KUVZ", "LAB", "NEWF", "NOWT", "NSDT", "PEMB", "SPOO", "MPOO", "TPOO", "PUG", "PULI", "RATT",
      "RHOD", "ROTT", "STBD", "SAMO", "SSHP", "HUSK", "SCWT", "STAF", "TIBT", "WEIM", "WFOX", "ANAT",
    ],
    source: { label: "OMIA 000263-9615", url: "https://omia.org/OMIA000263/9615/" },
  },
  {
    id: "prcd",
    name: "Progressive retinal atrophy (prcd)",
    short: "PRA (prcd)",
    gene: "PRCD (c.5G>A)",
    what: "The retina slowly degenerates: night blindness first, then loss of sight.",
    carriers: [
      "ACKR", "AESK", "AUCD", "AUSS", "CRES", "CHIH", "ECKR", "GOLD", "KUVZ", "LAB", "NELK", "NSDT", "SPOO", "MPOO",
      "TPOO", "PTWD", "SKIP", "SILK", "YORK",
    ],
    source: { label: "OMIA 001298-9615", url: "https://omia.org/OMIA001298/9615/" },
  },
  {
    id: "eic",
    name: "Exercise-induced collapse",
    short: "Exercise collapse",
    gene: "DNM1 (R256L)",
    what: "Weakness and collapse after a few minutes of intense exercise.",
    carriers: ["LAB", "CCRT", "PEMB", "ACKR", "BOUV", "ECKR", "GWHP", "OES", "VIZS"],
    source: { label: "DogWellNet / AKC CHF", url: "https://dogwellnet.com/dwn/condition/130-exercise-induced-collapse-eic/" },
  },
  {
    id: "cddy",
    name: "Chondrodystrophy & disc disease",
    short: "Short legs / IVDD",
    gene: "FGF4 retrogene (chromosome 12)",
    what: "Short legs and early degeneration of spinal discs; raises the odds of disc disease about 51-fold.",
    carriers: ["DACH", "BEAG", "FBUL", "ACKR", "BASS", "PEMB"],
    source: { label: "Brown et al. 2017, PNAS", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5664524/" },
    note: "Breeds named in the paper; it reports the insertion in many more small and medium breeds.",
  },
  {
    id: "smoc2",
    name: "Short-muzzled skull (SMOC2)",
    short: "Short muzzle",
    gene: "SMOC2 (LINE-1 insertion)",
    what: "A shortened face, linked to breathing problems (brachycephalic airway syndrome).",
    carriers: ["BOST", "BULD", "FBUL", "PUG"],
    source: { label: "Marchant et al. 2017; Johansson 2019", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5462623" },
    note: "Fixed (every dog carries it) in all four breeds in a Swedish study.",
  },
  {
    id: "huu",
    name: "Hyperuricosuria",
    short: "Urinary stones",
    gene: "SLC2A9",
    what: "Too much uric acid in the urine, causing bladder and kidney stones.",
    carriers: ["DALM", "BULD", "BRTR"],
    source: { label: "Bannasch et al. 2008; Karmi et al. 2010", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5551899" },
    note: "Fixed in Dalmatians, so breeders crossed in a pointer in the 1970s to bring back the healthy version.",
  },
];

/** Allele frequency in ~83,000 mixed-breed dogs (Donner et al. 2018, PLOS Genetics, Table 2). */
export const MIXED_FREQ: { name: string; pct: number }[] = [
  { name: "Degenerative myelopathy (SOD1)", pct: 7.771 },
  { name: "Cone-rod dystrophy (cord1-PRA)", pct: 3.664 },
  { name: "Progressive retinal atrophy (prcd)", pct: 3.418 },
  { name: "Hyperuricosuria (SLC2A9)", pct: 2.155 },
  { name: "Collie eye anomaly (NHEJ1)", pct: 1.6 },
  { name: "Exercise-induced collapse (DNM1)", pct: 1.131 },
  { name: "von Willebrand disease type 1", pct: 0.768 },
];

/** Breeds in family-tree (ring) order, with their family. */
export const TREE_BREEDS = [...new Set(ringOrder)]
  .filter((c) => c !== "GDJK" && c !== "WOLF")
  .map((code) => ({ code, name: data.breeds[code].name, clade: data.breeds[code].clade }));

export const familiesOf = (v: Variant) =>
  [...new Set(v.carriers.map((c) => data.breeds[c]?.clade ?? `_${c}`))];

/**
 * Breeds that share unusually long stretches of DNA with carriers but aren't listed as
 * carriers themselves: candidates worth testing (the article's Figure 7 idea).
 */
export function candidates(v: Variant) {
  const carriers = new Set(v.carriers);
  const hits = new Map<string, { links: number; mb: number; partners: string[] }>();
  for (const [a, b, len] of data.links) {
    const [c, o] = carriers.has(a) && !carriers.has(b) ? [a, b] : carriers.has(b) && !carriers.has(a) ? [b, a] : [null, null];
    if (!c || !o || o === "WOLF" || o === "GDJK") continue;
    const h = hits.get(o) ?? hits.set(o, { links: 0, mb: 0, partners: [] }).get(o)!;
    h.links++;
    h.mb = Math.max(h.mb, len / 1e6);
    h.partners.push(c);
  }
  return [...hits].map(([code, h]) => ({ code, ...h })).sort((x, y) => y.links - x.links || y.mb - x.mb);
}
