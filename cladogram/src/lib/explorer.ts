import raw from "@/data/explorer.json";
import map from "../../scripts/dogceo-map.json";
import { data } from "./tree";
import { ORIGINS } from "./origins";
import { FAMILIES, PURPOSES, purposeOf, type PurposeId } from "./purpose";

/**
 * The Breed Explorer mosaic: every photo in the Dog CEO API, as thumbnails packed into
 * sprite sheets (built by scripts/build-explorer.py). Breeds the 2017 study sampled reuse
 * its family groups, jobs, and origins; the API's other breeds are described here.
 */
export const EX = raw as unknown as {
  tile: number;
  cols: number;
  perSheet: number;
  sheets: number;
  total: number;
  breeds: { path: string; start: number; files: string[] }[];
  colors: string;
};

type JobId = PurposeId | "wild";
type Extra = { name: string; job: JobId; lat?: number; lon?: number; place: string; country: string; kind?: "wild" | "designer" | "mix" };

/** Dog CEO folders that aren't in the study (origins and jobs from standard breed histories). */
const EXTRA: Record<string, Extra> = {
  affenpinscher: { name: "Affenpinscher", job: "vermin", lat: 50.1, lon: 8.7, place: "Germany", country: "Germany" },
  "african/wild": { name: "African Wild Dog", job: "wild", lat: -15, lon: 25, place: "Sub-Saharan Africa", country: "Africa", kind: "wild" },
  appenzeller: { name: "Appenzeller Sennenhund", job: "herd", lat: 47.33, lon: 9.41, place: "Appenzell", country: "Switzerland" },
  "bakharwal/indian": { name: "Bakharwal Dog", job: "flock", lat: 33.8, lon: 75.0, place: "Jammu & Kashmir", country: "India" },
  bluetick: { name: "Bluetick Coonhound", job: "scent", lat: 31.0, lon: -92.0, place: "Louisiana", country: "United States" },
  brabancon: { name: "Petit Brabançon", job: "companion", lat: 50.85, lon: 4.35, place: "Brussels", country: "Belgium" },
  "buhund/norwegian": { name: "Norwegian Buhund", job: "herd", lat: 61.0, lon: 8.0, place: "Western Norway", country: "Norway" },
  cavapoo: { name: "Cavapoo", job: "companion", place: "Designer cross (Cavalier × Poodle)", country: "Designer cross", kind: "designer" },
  "chippiparai/indian": { name: "Chippiparai", job: "sight", lat: 9.3, lon: 77.6, place: "Tamil Nadu", country: "India" },
  clumber: { name: "Clumber Spaniel", job: "gun", lat: 53.27, lon: -1.06, place: "Clumber Park, Nottinghamshire", country: "England" },
  cockapoo: { name: "Cockapoo", job: "companion", place: "Designer cross (Cocker × Poodle)", country: "Designer cross", kind: "designer" },
  coonhound: { name: "Black and Tan Coonhound", job: "scent", lat: 37.5, lon: -81.0, place: "Appalachia", country: "United States" },
  "danishswedish/farmdog": { name: "Danish-Swedish Farmdog", job: "vermin", lat: 55.9, lon: 13.2, place: "Denmark & Sweden", country: "Denmark / Sweden" },
  dhole: { name: "Dhole", job: "wild", lat: 22.0, lon: 85.0, place: "South & Southeast Asia", country: "Asia", kind: "wild" },
  dingo: { name: "Dingo", job: "wild", lat: -25.0, lon: 134.0, place: "Australia", country: "Australia", kind: "wild" },
  entlebucher: { name: "Entlebucher Mountain Dog", job: "herd", lat: 46.99, lon: 8.06, place: "Entlebuch", country: "Switzerland" },
  "finnish/lapphund": { name: "Finnish Lapphund", job: "herd", lat: 68.0, lon: 25.0, place: "Lapland", country: "Finland" },
  "gaddi/indian": { name: "Gaddi Kutta", job: "flock", lat: 32.2, lon: 76.3, place: "Himachal Pradesh", country: "India" },
  "greyhound/indian": { name: "Indian Greyhound", job: "sight", lat: 28.8, lon: 79.0, place: "Northern India", country: "India" },
  "hound/plott": { name: "Plott Hound", job: "scent", lat: 35.6, lon: -83.0, place: "North Carolina", country: "United States" },
  "hound/walker": { name: "Treeing Walker Coonhound", job: "scent", lat: 37.8, lon: -85.0, place: "Kentucky", country: "United States" },
  kombai: { name: "Kombai", job: "guard", lat: 9.9, lon: 77.3, place: "Tamil Nadu", country: "India" },
  labradoodle: { name: "Labradoodle", job: "companion", lat: -37.8, lon: 145.0, place: "Victoria (1980s cross)", country: "Australia", kind: "designer" },
  "mastiff/indian": { name: "Indian Mastiff (Bully Kutta)", job: "guard", lat: 30.5, lon: 72.5, place: "Punjab", country: "India / Pakistan" },
  mix: { name: "Mixed breed", job: "companion", place: "Everywhere", country: "Mixed breed", kind: "mix" },
  "mudhol/indian": { name: "Mudhol Hound", job: "sight", lat: 16.3, lon: 75.3, place: "Karnataka", country: "India" },
  "ovcharka/caucasian": { name: "Caucasian Shepherd Dog", job: "flock", lat: 42.3, lon: 44.0, place: "Caucasus", country: "Georgia / Russia" },
  "pariah/indian": { name: "Indian Pariah Dog", job: "spitz", lat: 22.0, lon: 79.0, place: "Indian subcontinent", country: "India" },
  pitbull: { name: "American Pit Bull Terrier", job: "vermin", lat: 36.5, lon: -89.0, place: "United States", country: "United States" },
  "pointer/germanlonghair": { name: "German Longhaired Pointer", job: "gun", lat: 51.0, lon: 9.0, place: "Germany", country: "Germany" },
  "poodle/medium": { name: "Medium Poodle", job: "companion", lat: 47.8, lon: 3.4, place: "France", country: "France" },
  puggle: { name: "Puggle", job: "companion", lat: 43.0, lon: -89.0, place: "Wisconsin (1980s cross)", country: "United States", kind: "designer" },
  "rajapalayam/indian": { name: "Rajapalayam", job: "sight", lat: 9.45, lon: 77.55, place: "Tamil Nadu", country: "India" },
  "retriever/chesapeake": { name: "Chesapeake Bay Retriever", job: "gun", lat: 38.8, lon: -76.4, place: "Maryland", country: "United States" },
  "segugio/italian": { name: "Segugio Italiano", job: "scent", lat: 43.0, lon: 12.0, place: "Italy", country: "Italy" },
  "sheepdog/indian": { name: "Himalayan Sheepdog", job: "herd", lat: 31.0, lon: 78.0, place: "Himalayas", country: "India" },
  "spaniel/sussex": { name: "Sussex Spaniel", job: "gun", lat: 50.95, lon: -0.4, place: "Sussex", country: "England" },
  "spaniel/welsh": { name: "Welsh Springer Spaniel", job: "gun", lat: 52.3, lon: -3.6, place: "Wales", country: "Wales" },
  "spitz/indian": { name: "Indian Spitz", job: "companion", lat: 19.0, lon: 73.0, place: "India", country: "India" },
  "spitz/japanese": { name: "Japanese Spitz", job: "companion", lat: 35.7, lon: 139.7, place: "Japan", country: "Japan" },
  "terrier/andalusian": { name: "Andalusian Ratter", job: "vermin", lat: 37.4, lon: -5.9, place: "Andalusia", country: "Spain" },
  "terrier/dandie": { name: "Dandie Dinmont Terrier", job: "vermin", lat: 55.4, lon: -2.8, place: "Scottish Borders", country: "Scotland" },
  "terrier/lakeland": { name: "Lakeland Terrier", job: "vermin", lat: 54.5, lon: -3.1, place: "Lake District", country: "England" },
  "terrier/patterdale": { name: "Patterdale Terrier", job: "vermin", lat: 54.53, lon: -2.93, place: "Patterdale, Cumbria", country: "England" },
  "terrier/sealyham": { name: "Sealyham Terrier", job: "vermin", lat: 51.95, lon: -4.95, place: "Pembrokeshire", country: "Wales" },
  "terrier/toy": { name: "English Toy Terrier", job: "vermin", lat: 53.5, lon: -2.3, place: "England", country: "England" },
  "terrier/welsh": { name: "Welsh Terrier", job: "vermin", lat: 53.0, lon: -3.5, place: "Wales", country: "Wales" },
  "waterdog/spanish": { name: "Spanish Water Dog", job: "herd", lat: 37.0, lon: -4.5, place: "Andalusia", country: "Spain" },
};

/** API folders that hold a study breed under a second name. */
const ALSO: Record<string, string> = { kelpie: "KELP", "terrier/boston": "BOST" };

const codeByPath: Record<string, string> = {
  ...Object.fromEntries(Object.entries(map as Record<string, string>).map(([code, path]) => [path, code])),
  ...ALSO,
};

const REGION_OF: Record<string, string> = {
  England: "British Isles", Scotland: "British Isles", Wales: "British Isles", Ireland: "British Isles",
  Germany: "Western & Central Europe", France: "Western & Central Europe", Belgium: "Western & Central Europe",
  Netherlands: "Western & Central Europe", Switzerland: "Western & Central Europe", "Germany / Poland": "Western & Central Europe",
  Hungary: "Western & Central Europe", Croatia: "Mediterranean & Middle East",
  Italy: "Mediterranean & Middle East", Spain: "Mediterranean & Middle East", Portugal: "Mediterranean & Middle East",
  Malta: "Mediterranean & Middle East", "France / Spain": "Mediterranean & Middle East", Turkey: "Mediterranean & Middle East",
  "Middle East": "Mediterranean & Middle East", Afghanistan: "Mediterranean & Middle East", "North Africa": "Africa",
  "Georgia / Russia": "Mediterranean & Middle East",
  Norway: "Nordic & Arctic", Sweden: "Nordic & Arctic", Finland: "Nordic & Arctic", Iceland: "Nordic & Arctic",
  Greenland: "Nordic & Arctic", "Siberia (Russia)": "Nordic & Arctic", Russia: "Nordic & Arctic", "Denmark / Sweden": "Nordic & Arctic",
  China: "Asia", "Tibet (China)": "Asia", Japan: "Asia", India: "Asia", "India / Pakistan": "Asia", Asia: "Asia",
  "Central Africa": "Africa", "Mali / Niger": "Africa", Zimbabwe: "Africa", "South Africa": "Africa", Madagascar: "Africa", Africa: "Africa",
  "United States": "The Americas", Canada: "The Americas", Mexico: "The Americas", Peru: "The Americas", Cuba: "The Americas",
  Australia: "Australia",
};
export const REGIONS = [
  "British Isles", "Western & Central Europe", "Mediterranean & Middle East", "Nordic & Arctic", "Asia", "Africa",
  "The Americas", "Australia", "No single homeland",
];

export const JOB_GROUPS: { id: JobId; name: string }[] = [
  ...PURPOSES.map((p) => ({ id: p.id as JobId, name: p.name })),
  { id: "wild", name: "Wild canids (not dogs)" },
];

export type ExBreed = {
  index: number;
  path: string;
  folder: string;
  start: number;
  files: string[];
  name: string;
  code: string | null;
  family: string; // clade id, "_loner", "_extra", "_designer", "_wild"
  familyName: string;
  job: JobId;
  region: string;
  place: string;
  country: string;
  lat: number | null;
  lon: number | null;
};

export const BREEDS: ExBreed[] = EX.breeds.map((b, index) => {
  const code = codeByPath[b.path] ?? null;
  const extra = EXTRA[b.path];
  const folder = b.path.replace("/", "-");
  if (code) {
    const o = ORIGINS[code];
    const cl = data.breeds[code]?.clade ?? null;
    return {
      index, path: b.path, folder, start: b.start, files: b.files,
      name: data.breeds[code].name, code,
      family: cl ?? "_loner",
      familyName: cl ? data.clades[cl] : "Loners (no clear family)",
      job: purposeOf[code],
      region: REGION_OF[o.country] ?? "No single homeland",
      place: o.place, country: o.country, lat: o.lat, lon: o.lon,
    };
  }
  const e = extra ?? { name: b.path, job: "companion", place: "Unknown", country: "Unknown" };
  const family = e.kind === "wild" ? "_wild" : e.kind ? "_designer" : "_extra";
  return {
    index, path: b.path, folder, start: b.start, files: b.files,
    name: e.name, code: null, family,
    familyName: family === "_wild" ? "Wild canids (not dogs)" : family === "_designer" ? "Designer crosses & mixes" : "Not in the 2017 study",
    job: e.job,
    region: e.lat == null ? "No single homeland" : REGION_OF[e.country] ?? "No single homeland",
    place: e.place, country: e.country, lat: e.lat ?? null, lon: e.lon ?? null,
  };
});

/** Family groups in family-tree (ring) order, then the non-study groups. */
export const FAMILY_ORDER: { id: string; name: string }[] = [
  ...FAMILIES.filter((f) => f.id !== "_none"),
  { id: "_loner", name: "Loners (no clear family)" },
  { id: "_extra", name: "Not in the 2017 study" },
  { id: "_designer", name: "Designer crosses & mixes" },
  { id: "_wild", name: "Wild canids (not dogs)" },
];

export const photoUrl = (b: ExBreed, i: number) => `https://images.dog.ceo/breeds/${b.folder}/${b.files[i]}`;
export const missingExtras = EX.breeds.filter((b) => !codeByPath[b.path] && !EXTRA[b.path]).map((b) => b.path);
