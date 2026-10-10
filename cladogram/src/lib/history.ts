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
  { id: "bonn", label: "Bonn-Oberkassel, Germany", sub: "~14,200 · dog buried with people", at: 14200, lane: 4, kind: "dog" },
  { id: "lineages", label: "Five dog lineages", sub: "by 11,700 years ago", at: 11700, lane: 1, kind: "dog" },
  { id: "farming", label: "Farming begins", sub: "11,400 years ago", at: 11400, lane: 3, kind: "human" },
  { id: "skull", label: "Dog-shaped skulls", sub: "~11,000 years ago", at: 11000, lane: 5, kind: "dog" },
  { id: "breeds", label: "Most modern breeds", sub: "last ~200 years", at: [200, 0], lane: -1, kind: "human" },
];

export const TIME_MAX = 42000;

/** Calendar year treated as "today" on the timeline. */
export const NOW = 2026;

/**
 * Study breeds with a documented (or well-established approximate) founding date, from
 * standard breed-club histories. `approx` marks decade-level dates. Most breeds in the
 * study have no such date: they grew out of older local dogs long before records.
 */
/** `short` is an optional shorter label for the crowded timeline. */
export type ModernBreed = { code: string; name: string; short?: string; year: number; approx?: boolean; note: string };
export const MODERN_BREEDS: ModernBreed[] = [
  { code: "JACK", name: "Jack Russell Terrier", year: 1819, note: "Rev. John Russell buys Trump, the founding terrier" },
  { code: "BEDT", name: "Bedlington Terrier", year: 1825, approx: true, note: "first called the Bedlington terrier" },
  { code: "BEAG", name: "Beagle", year: 1830, approx: true, note: "modern pack bred by Rev. Honeywood" },
  { code: "AUCD", name: "Australian Cattle Dog", year: 1840, approx: true, note: "bred for cattle drives in New South Wales" },
  { code: "LEON", name: "Leonberger", year: 1846, note: "created by Heinrich Essig in Leonberg" },
  { code: "AIRT", name: "Airedale Terrier", year: 1853, approx: true, note: "bred in Yorkshire's Aire valley" },
  { code: "BULT", name: "Bull Terrier", year: 1860, approx: true, note: "James Hinks's white bull terriers" },
  { code: "FCR", name: "Flat-coated Retriever", year: 1860, approx: true, note: "shown at the first dog shows" },
  { code: "YORK", name: "Yorkshire Terrier", year: 1865, note: "Huddersfield Ben, the breed's foundation sire" },
  { code: "GOLD", name: "Golden Retriever", year: 1868, note: "Lord Tweedmouth's first litter in Scotland" },
  { code: "BOST", name: "Boston Terrier", year: 1870, approx: true, note: "descends from a dog named Judge in Boston" },
  { code: "KELP", name: "Kelpie", year: 1872, note: "named after a dog called Kelpie" },
  { code: "FBUL", name: "French Bulldog", year: 1880, approx: true, note: "toy bulldogs taken to France" },
  { code: "MSNZ", name: "Miniature Schnauzer", year: 1888, note: "first recorded in Germany" },
  { code: "DOBP", name: "Doberman Pinscher", year: 1890, approx: true, note: "Louis Dobermann, a tax collector in Apolda" },
  { code: "BORD", name: "Border Collie", year: 1893, note: "Old Hemp, the breed's foundation sire" },
  { code: "BOX", name: "Boxer", year: 1895, note: "first Boxer club in Munich" },
  { code: "GSD", name: "German Shepherd Dog", year: 1899, note: "Max von Stephanitz registers Horand" },
  { code: "SILK", name: "Silky Terrier", year: 1900, approx: true, note: "Australian × Yorkshire terrier crosses" },
  { code: "SSHP", name: "Shetland Sheepdog", year: 1909, note: "first breed club founded" },
  { code: "COOK", name: "Chinook", year: 1917, note: "Arthur Walden's sled dog Chinook is born" },
  { code: "RHOD", name: "Rhodesian Ridgeback", year: 1922, note: "breed standard written in Rhodesia" },
  { code: "CKCS", name: "Cavalier King Charles Spaniel", short: "Cavalier King Charles", year: 1928, note: "breed club rebuilds the old toy spaniel type" },
  { code: "TYFX", name: "Toy Fox Terrier", year: 1935, approx: true, note: "miniaturized fox terriers in the US" },
  { code: "BRTR", name: "Black Russian Terrier", year: 1950, approx: true, note: "Soviet Red Star Kennel" },
  { code: "EURA", name: "Eurasier", year: 1960, note: "Julius Wipfel crosses chow chow and wolfspitz" },
  { code: "NORF", name: "Norfolk Terrier", year: 1964, note: "split from the Norwich terrier" },
  { code: "AHRT", name: "American Hairless Terrier", year: 1972, note: "a hairless puppy born to rat terriers" },
];

/** Milestones of the 19th-century breed boom. */
export const MILESTONES: { id: string; label: string; year: number }[] = [
  { id: "show", label: "First dog show (Newcastle)", year: 1859 },
  { id: "kc", label: "The Kennel Club founded", year: 1873 },
  { id: "akc", label: "American Kennel Club founded", year: 1884 },
];

/**
 * Breeds with roots older than modern breeding. `ago` is an approximate age in years where
 * Wikipedia gives dated evidence (a genetic lineage, a skeleton, or a dated artwork); these
 * are ages of the *type of dog*, not of the modern breed standard. No `ago` = unknown.
 */
export type AncientBreed = { code: string; name: string; from: string; note: string; ago?: number; dateNote?: string };
export const ANCIENT_BREEDS: AncientBreed[] = [
  { code: "HUSK", name: "Siberian Husky", from: "Siberia", note: "Bred by the Chukchi people of Siberia to pull sleds over long distances.", ago: 9500, dateNote: "ancestral sled-dog lineage, traced genetically" },
  { code: "AMAL", name: "Alaskan Malamute", from: "Alaska", note: "The heavy sled dog of the Inupiat (Malemiut) people of Alaska.", ago: 9500, dateNote: "shares an ancestor with the 9,500-year-old Zhokhov dog" },
  { code: "CHOW", name: "Chow Chow", from: "China", note: "An old Chinese breed and a deep branch of the Asian spitz family.", ago: 8300, dateNote: "from native dogs of central China, per a genetic study" },
  { code: "BSJI", name: "Basenji", from: "Central Africa", note: "The first breed to branch off after the wolves on the study’s family tree.", ago: 4500, dateNote: "similar ‘Tesem’ dogs in Egyptian murals" },
  { code: "SALU", name: "Saluki", from: "Middle East", note: "A desert sighthound used for hunting gazelle and hare for centuries.", ago: 4000, dateNote: "Saluki-form skeleton at Tell Brak, Syria" },
  { code: "SHAR", name: "Chinese Shar-Pei", from: "Southern China", note: "A wrinkled Chinese farm and guard dog, closest cousin of the chow chow.", ago: 1900, dateNote: "Han dynasty sculpture, c. 100 CE" },
  { code: "LHSA", name: "Lhasa Apso", from: "Tibet", note: "Kept as an indoor watchdog in Tibetan monasteries.", ago: 1000, dateNote: "described as a thousand-year-old breed" },
  { code: "TIBM", name: "Tibetan Mastiff", from: "Tibetan Plateau", note: "Guarded herds and villages in the Himalayas long before kennel clubs." },
  { code: "SHIB", name: "Shiba Inu", from: "Japan", note: "A small Japanese hunting dog; similar dogs appear in prehistoric Jōmon figurines." },
  { code: "AKIT", name: "Akita", from: "Northern Japan", note: "Descends from the matagi hunting dogs of northern Japan, kept “since ancient times”." },
  { code: "PEKE", name: "Pekingese", from: "Beijing", note: "A lapdog of China’s imperial court for centuries." },
  { code: "XOLO", name: "Xoloitzcuintli", from: "Mexico", note: "Hairless dogs like it appear in ancient West Mexican burial sculptures." },
];

export const agoLabel = (a: AncientBreed) => (a.ago ? `~${a.ago.toLocaleString("en-US")} years ago` : "Unknown");
