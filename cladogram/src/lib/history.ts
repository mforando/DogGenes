// Deep-history events for the prologue timeline. Dates are years before present.
// Sources: Wikipedia, "Domestication of the dog" (dates as stated there), and
// Parker et al. 2017 for the age of modern breeds.

export type HistoryEvent = {
  id: string;
  label: string;
  sub: string;
  /** a single date, or a [from, to] range in years ago */
  at: number | [number, number];
  /** vertical lane: positive = above the axis, negative = below */
  lane: number;
  kind: "dog" | "wolf" | "human" | "theory";
  debated?: boolean;
};

export const EVENTS: HistoryEvent[] = [
  { id: "split", label: "Dogs and wolves split", sub: "40,000–27,000 years ago", at: [40000, 27000], lane: 1, kind: "wolf" },
  { id: "lgm", label: "Ice Age at its coldest", sub: "wolves crash to a few survivors", at: 25000, lane: 3, kind: "wolf" },
  { id: "eastasia", label: "East Asia?", sub: "~33,000", at: [34500, 31500], lane: -1, kind: "theory" },
  { id: "europe", label: "Europe?", sub: "32,100–18,800", at: [32100, 18800], lane: -2, kind: "theory" },
  { id: "siberia", label: "Siberia?", sub: "26,000–19,700", at: [26000, 19700], lane: -3, kind: "theory" },
  { id: "goyet", label: "Goyet, Belgium", sub: "36,000 · dog or wolf?", at: 36000, lane: 3, kind: "dog", debated: true },
  { id: "altai", label: "Altai, Siberia", sub: "33,300 · dog or wolf?", at: 33300, lane: 4, kind: "dog", debated: true },
  { id: "erralla", label: "Erralla, Spain", sub: "17,500 · oldest accepted dog", at: 17500, lane: 2, kind: "dog" },
  { id: "bonn", label: "Bonn-Oberkassel, Germany", sub: "14,500 · dog buried with people", at: 14500, lane: 4, kind: "dog" },
  { id: "lineages", label: "Five dog lineages", sub: "by 11,700 years ago", at: 11700, lane: 1, kind: "dog" },
  { id: "farming", label: "Farming begins", sub: "11,400 years ago", at: 11400, lane: 3, kind: "human" },
  { id: "skull", label: "Dog-shaped skulls", sub: "~11,000 years ago", at: 11000, lane: 5, kind: "dog" },
  { id: "breeds", label: "Most modern breeds", sub: "last ~200 years", at: [200, 0], lane: -1, kind: "human" },
];

export const TIME_MAX = 42000;
