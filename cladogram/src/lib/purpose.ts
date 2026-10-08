import { data, ringOrder } from "./tree";
import { GENOME_BP } from "./relatives";

/**
 * Each breed's ORIGINAL job, simplified to one primary purpose. Assignments follow
 * standard breed-club histories, not the study, which doesn't classify breeds by use.
 * Many breeds did several jobs or have since become mostly companions.
 */
export type PurposeId =
  | "scent" | "sight" | "gun" | "vermin" | "herd" | "flock" | "guard" | "work" | "spitz" | "companion";

export const PURPOSE_NOTE: Record<PurposeId, string> = {
  "sight": "The study found the UK and Mediterranean sighthounds aren’t close relatives: the same lean, fast build was bred separately in different regions.",
  "scent": "Every scent hound lands in one family, so these trackers likely share a single origin before being split into breeds.",
  "gun": "Retrievers, pointer-setters, and spaniels form separate families of their own, even though all three were bred for bird hunting.",
  "vermin": "Most terriers are one family from Britain and Ireland, but the bull terriers sit with the mastiffs and the rat terriers form their own American family.",
  "herd": "Herders turn up in five families. The study suggests herding dogs were developed independently in different regions as people took up farming.",
  "flock": "These giants sit with the Mediterranean sighthounds, not with the mastiffs. The study found no recent mixing between the two, suggesting giant size was bred more than once.",
  "guard": "Guard breeds are among the most crossbred, which fits a long history of mixing in size and strength from other breeds.",
  "work": "Sled dogs come from the Asian spitz family, and the mountain draft dogs from the Alpine family: the same kind of work, done by unrelated dogs.",
  "spitz": "These are some of the oldest-looking lineages on the tree, close to the root where the wolves branch off.",
  "companion": "Lap dogs are scattered across 11 families. Small size and good company were bred into many unrelated lineages, though the Asian toy dogs form a distinct old group of their own."
};

export const PURPOSES: { id: PurposeId; name: string; short: string; blurb: string }[] = [
  { id: "sight", name: "Sighthounds", short: "Sight", blurb: "Lean sprinters that hunt by sight, chasing down fast game in open country." },
  { id: "scent", name: "Scent hounds", short: "Scent", blurb: "Nose-first trackers that follow a trail for hours, often in packs." },
  { id: "gun", name: "Gun dogs", short: "Gun", blurb: "Retrievers, pointers, setters, and spaniels bred to find and fetch birds for hunters." },
  { id: "vermin", name: "Ratters & terriers", short: "Vermin", blurb: "Small, tough, fearless dogs bred to kill rats and dig out foxes and badgers." },
  { id: "herd", name: "Herders", short: "Herd", blurb: "Quick, clever dogs that move sheep and cattle by working closely with people." },
  { id: "flock", name: "Flock guardians", short: "Flock", blurb: "Giants that live with the flock and fight off wolves and bears on their own." },
  { id: "guard", name: "Guards & protectors", short: "Guard", blurb: "Mastiffs, drovers, and watchdogs bred to protect people, property, and cattle." },
  { id: "work", name: "Sled, draft & rescue", short: "Work", blurb: "Pullers, haulers, and rescuers: sled dogs, cart dogs, and water and mountain rescue." },
  { id: "spitz", name: "Spitz hunters & ancient types", short: "Spitz", blurb: "Curly-tailed northern hunting dogs and very old breeds like the basenji." },
  { id: "companion", name: "Companions", short: "Companion", blurb: "Lap dogs and house dogs, bred mainly to be good company." },
];

const ASSIGN: Record<PurposeId, string[]> = {
  sight: ["AFGH", "SALU", "SLOU", "AZWK", "IBIZ", "PHAR", "CIRN", "GREY", "WHIP", "BORZ", "DEER", "IWOF", "XIGO", "LVMD"],
  scent: ["BEAG", "BASS", "BLDH", "FOXH", "OTTR", "REDB", "PBGV", "DACH"],
  gun: ["GOLD", "LAB", "FCR", "CCRT", "NSDT", "IWSP", "ESSP", "ECKR", "ACKR", "FIEL", "BRIT", "GSHP", "GWHP",
    "WHPG", "VIZS", "WEIM", "LMUN", "SPIN", "ISET", "ESET", "GORD", "SPOO"],
  vermin: ["AIRT", "KERY", "GLEN", "SCWT", "IRIT", "BEDT", "BORT", "PARS", "JACK", "WFOX", "AUST", "YORK", "NOWT",
    "NORF", "SCOT", "CAIR", "WHWT", "RATT", "TYFX", "AHRT", "MNTY", "MPIN", "MSNZ", "STAF", "AMST", "BULT", "MBLT"],
  herd: ["BORD", "KELP", "BERD", "CARD", "PEMB", "SSHP", "COLL", "AUSS", "AUCD", "OES", "BMAL", "TURV", "BELS",
    "BRIA", "BOUV", "GSD", "BPIC", "CPAT", "PULI", "PUMI", "ICES", "SVAL"],
  flock: ["GPYR", "KUVZ", "KOMO", "ANAT", "MAAB", "TIBM"],
  guard: ["ROTT", "DOBP", "GSNZ", "SSNZ", "BRTR", "BOX", "BULM", "MAST", "DDBX", "CANE", "NEAP", "BOER", "DANE",
    "RHOD", "CHOW", "SHAR"],
  work: ["AMAL", "HUSK", "GREE", "COOK", "SAMO", "BMD", "GSMD", "STBD", "LEON", "NEWF", "PTWD", "DALM"],
  spitz: ["BSJI", "NELK", "FINS", "SHIB", "AKIT"],
  companion: ["PEKE", "SHIH", "LHSA", "TIBS", "CHIN", "TIBT", "POM", "VPIN", "AESK", "PAPI", "BRUS", "PUG", "SKIP",
    "MALT", "HAVA", "BICH", "COTO", "TPOO", "MPOO", "CKCS", "ITGY", "SILK", "BULD", "FBUL", "BOST", "EURA", "KEES",
    "XOLO", "MXOL", "INCA", "CRES", "CHIH"],
};

export const purposeOf: Record<string, PurposeId> = Object.fromEntries(
  (Object.entries(ASSIGN) as [PurposeId, string[]][]).flatMap(([p, codes]) => codes.map((c) => [c, p])),
);

/** Breeds in the data with no assigned purpose (wild canids excluded). Should be empty. */
export const unassigned = Object.keys(data.breeds).filter((c) => c !== "WOLF" && c !== "GDJK" && !purposeOf[c]);

/** Families in ring order, with "Loners" (no clade) last. */
export const FAMILIES: { id: string; name: string }[] = [
  ...[...new Set(ringOrder.map((c) => data.breeds[c].clade).filter(Boolean) as string[])].map((id) => ({
    id,
    name: data.clades[id],
  })),
  { id: "_none", name: "Loners" },
];
export const familyOf = (code: string) => data.breeds[code]?.clade ?? "_none";

// Dogs tested per breed (summed over wedges).
const dogs: Record<string, number> = {};
(function walk(n: { t: string; code?: string; n?: number; c?: unknown[] }) {
  if (n.t === "b") dogs[n.code!] = (dogs[n.code!] ?? 0) + n.n!;
  else (n.c as (typeof n)[]).forEach(walk);
})(data.tree as never);

export type PurposeSummary = {
  id: PurposeId;
  codes: string[];
  dogs: number;
  families: string[];
  /** breed count per family */
  byFamily: Record<string, string[]>;
  /** average number of breeds from OTHER families each breed shares big DNA chunks with */
  crossPerBreed: number;
  /** share of breeds with no big DNA sharing outside their family */
  keptToThemselves: number;
  /** strongest DNA tie between two breeds that share this job */
  topPair?: { a: string; b: string; pct: number };
  /** of the job's breeds' outside-family ties, the share going to breeds with a DIFFERENT job */
  toOtherJobs: number;
};

const links = data.links;
/** Big DNA ties to breeds outside this breed's family (loners count as their own family each). */
const crossTies = (code: string) =>
  links.filter(([a, b]) => {
    if (a !== code && b !== code) return false;
    const other = a === code ? b : a;
    return familyOf(code) === "_none" || familyOf(other) === "_none" || familyOf(other) !== familyOf(code);
  });

export const SUMMARIES: PurposeSummary[] = PURPOSES.map(({ id }) => {
  const codes = ringOrder.filter((c, i) => ringOrder.indexOf(c) === i && purposeOf[c] === id);
  const byFamily: Record<string, string[]> = {};
  for (const c of codes) (byFamily[familyOf(c)] ??= []).push(c);
  const ties = codes.map((c) => crossTies(c));
  const within = links
    .filter(([a, b]) => purposeOf[a] === id && purposeOf[b] === id)
    .sort((x, y) => y[2] - x[2])[0];
  const allTies = ties.flat();
  const toOther = allTies.filter(([a, b]) => purposeOf[a] !== id || purposeOf[b] !== id).length;
  return {
    id,
    codes,
    dogs: codes.reduce((s, c) => s + (dogs[c] ?? 0), 0),
    families: FAMILIES.map((f) => f.id).filter((f) => byFamily[f]),
    byFamily,
    crossPerBreed: ties.reduce((s, t) => s + t.length, 0) / codes.length,
    keptToThemselves: ties.filter((t) => t.length === 0).length / codes.length,
    topPair: within ? { a: within[0], b: within[1], pct: (within[2] / GENOME_BP) * 100 } : undefined,
    toOtherJobs: allTies.length ? toOther / allTies.length : 0,
  };
});
