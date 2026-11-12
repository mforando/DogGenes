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

/** Each job's blurb and note at the Puppy (5th-grade) and Albert Pawstein (scientist) reading levels. */
export const PURPOSE_LEVELS: Record<PurposeId, Record<"puppy" | "pro", { blurb: string; note: string }>> = {
  sight: {
    puppy: { blurb: "Skinny, super-fast dogs that hunt by looking, not sniffing. They chase rabbits and deer across open fields.", note: "Sighthounds from Britain and from around the Mediterranean Sea aren’t close cousins. People in different places made the same fast, skinny kind of dog on their own." },
    pro: { blurb: "Coursing hounds selected for visual detection and sprint pursuit of fast game in open terrain.", note: "British and Mediterranean sighthounds fall in different clades: the gracile, long-limbed coursing phenotype arose convergently in separate regional populations." },
  },
  scent: {
    puppy: { blurb: "Dogs with amazing noses. They follow a smell trail for hours, often in a big group called a pack.", note: "All the scent hounds are in one family. That means they probably all came from the same kind of dog long ago, before people split them into breeds." },
    pro: { blurb: "Olfactory trackers selected for scenting and endurance, traditionally hunted in packs.", note: "All scent hounds resolve to a single clade, consistent with one ancestral population that was later partitioned into breeds." },
  },
  gun: {
    puppy: { blurb: "Hunting helpers. They find birds, point at them, scare them out of bushes, or fetch them back for hunters.", note: "Retrievers, pointers and setters, and spaniels are three different families, even though all of them were made to help bird hunters." },
    pro: { blurb: "Bird dogs (retrievers, pointers, setters, spaniels) selected for locating, flushing and retrieving game.", note: "Retrievers, pointer-setters and spaniels form three distinct clades despite a shared function, indicating separate breeding histories for each working style." },
  },
  vermin: {
    puppy: { blurb: "Small, tough, brave dogs made to catch rats and dig foxes and badgers out of their holes.", note: "Most terriers are one family from Britain and Ireland. But the bull terriers are cousins of the big mastiffs, and the rat terriers are their own American family." },
    pro: { blurb: "Small, tenacious earth dogs selected for killing rodents and bolting foxes and badgers from dens.", note: "Most terriers form a single British–Irish clade; bull-type terriers cluster with the European mastiffs, and the rat terriers form a separate American clade." },
  },
  herd: {
    puppy: { blurb: "Smart, speedy dogs that move sheep and cows around by working as a team with people.", note: "Herding dogs show up in five different families. People in different places made their own herding dogs when they started farming." },
    pro: { blurb: "Livestock-handling dogs selected for responsiveness to handlers and control of sheep and cattle.", note: "Herding breeds occur in five clades, supporting independent regional development of herding function alongside the spread of pastoralism." },
  },
  flock: {
    puppy: { blurb: "Giant dogs that live with the sheep and protect them from wolves and bears all by themselves.", note: "These giant dogs are cousins of the Mediterranean sighthounds, not the mastiffs. They didn’t mix with mastiffs, so people made giant dogs more than once." },
    pro: { blurb: "Large livestock guardian dogs selected to live with flocks and deter predators independently.", note: "Livestock guardians cluster with the Mediterranean clade rather than the mastiffs, with no recent haplotype sharing between them, implying giant size was selected more than once." },
  },
  guard: {
    puppy: { blurb: "Big, strong dogs made to protect people, homes, farms and cattle.", note: "Guard dogs have been mixed with other breeds a lot. People kept adding other dogs to make them bigger and stronger." },
    pro: { blurb: "Mastiff-type, drover and watch dogs selected for protection of people, property and cattle.", note: "Guard breeds rank among the most admixed, consistent with repeated introgression from other breeds to increase size and strength." },
  },
  work: {
    puppy: { blurb: "Hard workers that pull sleds and carts or rescue people in the water and in the mountains.", note: "Sled dogs come from the Asian spitz family. The big mountain dogs that pull carts come from the Alpine family. Same kind of job, totally different families." },
    pro: { blurb: "Draft, sled and rescue dogs selected for hauling and endurance, including water and mountain rescue.", note: "Sled dogs derive from the Asian spitz clade and Alpine draft breeds from the Alpine clade: similar function, unrelated lineages." },
  },
  spitz: {
    puppy: { blurb: "Fluffy northern hunting dogs with curly tails, plus some very old breeds like the basenji.", note: "These are some of the oldest kinds of dogs on the family tree. They sit close to the middle, near the wolves." },
    pro: { blurb: "Northern spitz-type hunting dogs and basal breeds such as the basenji.", note: "These include several basal lineages that branch near the root, adjacent to the wolf outgroup." },
  },
  companion: {
    puppy: { blurb: "Lap dogs and house dogs, made mostly to be good friends.", note: "Lap dogs are spread over 11 families! People made small, friendly dogs in lots of different places. The Asian toy dogs are one very old group of their own." },
    pro: { blurb: "Toy and companion breeds selected primarily for small size and temperament.", note: "Companion breeds are distributed across 11 clades: miniaturization and companionability were selected repeatedly in unrelated lineages, though the Asian toy breeds form a distinct, older clade." },
  },
};
