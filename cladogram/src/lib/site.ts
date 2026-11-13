/** The site's name and its permanent public address, for metadata, structured data and the sitemap. */
export const SITE_NAME = "DogGenes";
export const SITE_URL = "https://mforando.github.io/DogGenes";
export const SITE_DESCRIPTION =
  "Interactive stories about where dogs came from and how 161 breeds are related, built from the DNA of 1,355 dogs.";
export const AUTHOR = { "@type": "Person", name: "Mason Forando", url: "https://www.linkedin.com/in/mforando/" } as const;

/** The study the site is built on, for "citation" in structured data. */
export const STUDY_CITATION = {
  "@type": "ScholarlyArticle",
  name: "Genomic analyses reveal the influence of geographic origin, migration, and hybridization on modern dog breed development",
  author: "Parker, H. G. et al.",
  datePublished: "2017",
  isPartOf: { "@type": "Periodical", name: "Cell Reports" },
  url: "https://doi.org/10.1016/j.celrep.2017.03.079",
} as const;

/** Absolute URL for a site path ("/tree/" → "https://…/DogGenes/tree/"). */
export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Lowercase, hyphenated URL slug for a breed name ("Chinese Shar-Pei" → "chinese-shar-pei"). */
export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
