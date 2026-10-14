import { ORIGINS } from "./origins";

/** World regions (originally the fly-to buttons of the retired "Where they came from" tab). `lat`/`lon`/`k` frame each one. */
export const REGIONS: { name: string; lat: number; lon: number; k: number }[] = [
  { name: "Whole world", lat: 25, lon: 10, k: 1 },
  { name: "British Isles", lat: 54.5, lon: -4, k: 6 },
  { name: "Western Europe", lat: 49, lon: 6, k: 4 },
  { name: "Mediterranean", lat: 38, lon: 15, k: 3 },
  { name: "Asia", lat: 33, lon: 105, k: 2 },
  { name: "The Arctic", lat: 72, lon: -20, k: 1.5 },
  { name: "The Americas", lat: 20, lon: -85, k: 1.4 },
  { name: "Africa & Australia", lat: -12, lon: 75, k: 1 },
];

/** Continents, for the family-tree story's globe. `lat`/`lon`/`k` frame each one. */
export const CONTINENTS = [
  { name: "Europe", lat: 52, lon: 12, k: 2.6 },
  { name: "Asia", lat: 38, lon: 90, k: 1.5 },
  { name: "Africa", lat: 3, lon: 20, k: 1.6 },
  { name: "North America", lat: 48, lon: -95, k: 1.4 },
  { name: "South America", lat: -15, lon: -62, k: 1.7 },
  { name: "Australia", lat: -26, lon: 134, k: 2.2 },
] as const;
export const WORLD = { lat: 25, lon: 10, k: 1 };

export type Continent = (typeof CONTINENTS)[number]["name"];

const CONTINENT_OF_COUNTRY: Record<string, Continent> = {
  China: "Asia", "Tibet (China)": "Asia", Japan: "Asia", Afghanistan: "Asia", "Middle East": "Asia",
  Turkey: "Asia", "Siberia (Russia)": "Asia",
  "United States": "North America", Canada: "North America", Mexico: "North America", Cuba: "North America",
  Greenland: "North America",
  Peru: "South America",
  Australia: "Australia",
  "Central Africa": "Africa", "Mali / Niger": "Africa", Zimbabwe: "Africa", "South Africa": "Africa",
  Madagascar: "Africa", "North Africa": "Africa",
};

/** A breed's continent, from where it was developed (everything else listed is in Europe). */
export function continentOf(code: string): Continent | null {
  const o = ORIGINS[code];
  return o ? (CONTINENT_OF_COUNTRY[o.country] ?? "Europe") : null;
}

/** Breed codes by continent. */
export const CONTINENT_BREEDS: Record<Continent, string[]> = (() => {
  const out = Object.fromEntries(CONTINENTS.map((c) => [c.name, [] as string[]])) as Record<Continent, string[]>;
  for (const code of Object.keys(ORIGINS)) {
    const c = continentOf(code);
    if (c) out[c].push(code);
  }
  return out;
})();
