import { data, isLeaf, layout } from "./tree";
import { GENOME_BP } from "./relatives";

export type PairRow = {
  key: string;
  a: string;
  b: string;
  /** shared long-chunk DNA, in Mb (median across dog pairs) */
  mb: number;
  /** same, as a share of the ~2.4 billion-letter genome */
  pct: number;
  /** branches between the two breeds on the family tree */
  steps: number;
  note?: string;
};

const shared = new Map(data.links.map(([a, b, v]) => [[a, b].sort().join("|"), v]));
const sharedBp = (a: string, b: string) => shared.get([a, b].sort().join("|"));

const base = layout();
const mainLeaf = new Map(
  base.leaves.filter((l) => isLeaf(l) && l.data.main).map((l) => [(l.data as { code: string }).code, l]),
);
/** Number of branches you walk along the tree to get from one breed to the other. */
export function stepsApart(a: string, b: string) {
  const la = mainLeaf.get(a), lb = mainLeaf.get(b);
  return la && lb ? la.path(lb).length - 1 : NaN;
}

function row(a: string, b: string, v: number, note?: string): PairRow {
  return { key: `${a}|${b}`, a, b, mb: v / 1e6, pct: (v / GENOME_BP) * 100, steps: stepsApart(a, b), note };
}

const clade = (c: string) => data.breeds[c]?.clade ?? null;
const wild = (c: string) => c === "WOLF" || c === "GDJK";

/** Pairs in the same family group (clade), most shared DNA first. */
export const cousinPairs: PairRow[] = data.links
  .filter(([a, b]) => !wild(a) && !wild(b) && clade(a) && clade(a) === clade(b))
  .map(([a, b, v]) => row(a, b, v))
  .sort((x, y) => y.mb - x.mb);

/** Pairs from different family groups (loners count as their own group). */
export const crossPairs: PairRow[] = data.links
  .filter(([a, b]) => !wild(a) && !wild(b) && (!clade(a) || !clade(b) || clade(a) !== clade(b)))
  .map(([a, b, v]) => row(a, b, v))
  .sort((x, y) => y.mb - x.mb);

/**
 * Founder breed → breed developed from it, from written breed histories (the DNA alone
 * can't tell which came first). Only pairs whose shared DNA passed the study's cutoff
 * are listed, ranked by that sharing.
 */
const LINEAGES: [string, string, string][] = [
  ["BULT", "MBLT", "Bred down in size from small Bull Terriers."],
  ["NOWT", "NORF", "Drop-eared Norwich Terriers were split off as the Norfolk Terrier in 1964."],
  ["COLL", "SSHP", "Small Shetland herding dogs were crossed with Rough Collies in the early 1900s."],
  ["ROTT", "BRTR", "Created by the Soviet Red Star Kennel in the mid-1900s, largely from Rottweilers."],
  ["GSNZ", "BRTR", "Giant Schnauzers were one of the Black Russian Terrier’s main founding breeds."],
  ["AIRT", "BRTR", "Airedales were also used to create the Black Russian Terrier."],
  ["CHOW", "EURA", "Created in Germany in the 1960s–70s, starting from Chow Chow crosses."],
  ["SAMO", "EURA", "Samoyeds were added to the Eurasier’s founding mix."],
  ["KEES", "EURA", "Wolfspitz (Keeshond) dogs were one of the Eurasier’s three founding breeds."],
  ["PEKE", "SHIH", "Thought to come from Pekingese crossed with Lhasa Apsos in the Chinese imperial court."],
  ["LHSA", "SHIH", "Tibetan Lhasa Apsos, sent as gifts to China, are one of the Shih Tzu’s likely founders."],
  ["MPOO", "TPOO", "Bred down in size from Miniature Poodles."],
  ["SPOO", "MPOO", "Bred down in size from Standard Poodles."],
  ["MAST", "BULM", "English gamekeepers in the 1800s crossed Mastiffs with Bulldogs."],
  ["BULD", "BULM", "The Bulldog is the Bullmastiff’s other founding breed."],
  ["DEER", "IWOF", "The breed was revived in the late 1800s mainly from Scottish Deerhounds."],
  ["DANE", "IWOF", "Great Danes were also used to rebuild the Irish Wolfhound’s size."],
  ["GSD", "COOK", "Created in New Hampshire in the 1910s; German Shepherds were added to the line."],
  ["GREE", "COOK", "The Chinook line began with a sled dog of Greenland husky ancestry."],
  ["AUST", "SILK", "Developed in Australia around 1900 by crossing Australian and Yorkshire Terriers."],
  ["YORK", "SILK", "Yorkshire Terriers are the Silky Terrier’s other parent breed."],
  ["FCR", "GOLD", "Started in 1800s Scotland from a yellow wavy-coated (flat-coated) retriever."],
  ["GREY", "WHIP", "Developed in 1800s northern England from small Greyhounds."],
  ["COLL", "AUSS", "Developed in the US from collie-type herding dogs."],
  ["SSNZ", "MSNZ", "Bred down from Standard Schnauzers, probably with smaller breeds mixed in."],
  ["SSNZ", "GSNZ", "Standard Schnauzers were crossed with larger dogs to make the Giant."],
  ["BULD", "FBUL", "Descends from toy Bulldogs taken to France by English lace workers in the 1800s."],
  ["STAF", "AMST", "Developed in the US from Staffordshire-type bull terriers."],
  ["STBD", "LEON", "Created in Leonberg, Germany in the 1800s, with Saint Bernards among its founders."],
  ["BLDH", "BASS", "English breeders crossed Bassets with Bloodhounds in the late 1800s."],
  ["BULD", "BOST", "Descends from Bulldogs crossed with white English terriers in 1800s Boston."],
  ["RATT", "AHRT", "Began in the 1970s with a hairless puppy born to Rat Terrier parents."],
  ["BULD", "BULT", "Created in the 1800s by crossing Bulldogs with the now-extinct English White Terrier."],
];

export const lineagePairs: PairRow[] = LINEAGES.flatMap(([parent, child, note]) => {
  const v = sharedBp(parent, child);
  return v ? [row(parent, child, v, note)] : [];
}).sort((x, y) => y.mb - x.mb);
