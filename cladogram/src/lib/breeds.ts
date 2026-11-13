import akc from "@/data/akc.json";
import nyc from "@/data/nycnames.json";
import { data } from "./tree";
import { cladeColor } from "./palette";
import { PURPOSES, purposeOf } from "./purpose";
import { ORIGINS } from "./origins";
import { factsFor, factsUrl } from "./breedFacts";
import { COMMONS, PHOTOS, photoOf } from "./photos";
import { dnaRelatives, treeRelatives } from "./relatives";
import { ANCIENT_BREEDS, MODERN_BREEDS } from "./history";

/**
 * One static page per study breed (/breeds/<slug>/): everything the site knows about a breed,
 * gathered in one place. Built at compile time, so it all lands in the HTML for search engines.
 */

export { BREED_CODES, slugOf, codeOfSlug, breedPath, hasBreedPage } from "./breedLinks";
import { BREED_CODES, slugOf } from "./breedLinks";

type AkcBreed = { slug: string; name: string; code: string | null; r: (number | null)[] };
const AKC = akc as { years: number[]; breeds: AkcBreed[] };

type NameGroup = { group: string; dogs: number; distinctive: { name: string; n: number; lift: number }[] };
const NYC = nyc as unknown as { groups: { breed: NameGroup[] }; more_breeds: NameGroup[] };
const normName = (s: string) => s.toLowerCase().replace(/\bdog\b/g, "").replace(/[^a-z]+/g, " ").trim();
const NAME_GROUPS = new Map([...NYC.groups.breed, ...NYC.more_breeds].map((g) => [normName(g.group), g]));

export type BreedPage = ReturnType<typeof breedPage>;

export function breedPage(code: string) {
  const b = data.breeds[code];
  const clade = b.clade;
  const purpose = PURPOSES.find((p) => p.id === purposeOf[code]);
  const origin = ORIGINS[code];
  const facts = factsFor(code);
  const photo = photoOf(code);
  const commons = PHOTOS[code]?.api === "commons" ? COMMONS[`code:${code}`] : undefined;
  const akcRow = AKC.breeds.find((r) => r.code === code);
  const ranks = akcRow ? AKC.years.map((y, i) => ({ year: y, rank: akcRow.r[i] })).filter((r): r is { year: number; rank: number } => r.rank != null) : [];
  const names = NAME_GROUPS.get(normName(b.name)) ?? NAME_GROUPS.get(normName(akcRow?.name ?? ""));
  const cousins = treeRelatives(code, 6);
  const dna = dnaRelatives(code).slice(0, 8);
  const mates = clade ? BREED_CODES.filter((c) => c !== code && data.breeds[c].clade === clade) : [];
  const modern = MODERN_BREEDS.find((m) => m.code === code);
  const ancient = ANCIENT_BREEDS.find((m) => m.code === code);

  return {
    code,
    name: b.name,
    slug: slugOf(code),
    clade,
    cladeName: clade ? data.clades[clade] : null,
    color: cladeColor(clade, code),
    purpose,
    origin,
    facts,
    wiki: facts ? factsUrl(facts) : null,
    photo,
    commons,
    ranks,
    // Breeds with too few NYC dogs have no distinctive names (null in the data).
    names: names?.distinctive?.length ? { dogs: names.dogs, list: names.distinctive.slice(0, 8) } : null,
    cousins,
    dna,
    mates,
    modern,
    ancient,
  };
}

/** A one-sentence summary for the meta description and the page's lede. */
export function breedSummary(p: BreedPage) {
  const near = p.cousins.slice(0, 2).map((c) => data.breeds[c.code].name);
  const rel = near.length ? `The ${p.name}’s closest relatives on the dog DNA family tree are the ${near.join(" and the ")}.` : `The ${p.name} on the dog DNA family tree.`;
  return `${rel} See its breed family, original job, origin and the breeds it shares DNA with.`;
}
