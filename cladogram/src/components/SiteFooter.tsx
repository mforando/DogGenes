"use client";

import { usePathname } from "next/navigation";

/** One citation line: what it is, where to find it, and its license. */
type Cite = { text: string; url: string; license?: string };

const C = {
  parker: {
    text: "Parker H.G. et al. (2017). Genomic analyses reveal the influence of geographic origin, migration, and hybridization on modern dog breed development. Cell Reports 19(4):697–708, with supplementary data",
    url: "https://doi.org/10.1016/j.celrep.2017.03.079",
    license: "CC BY 4.0",
  },
  dogceo: {
    text: "Dog photos: Dog CEO API, images from the Stanford Dogs Dataset (ImageNet)",
    url: "https://dog.ceo/dog-api/",
    license: "non-commercial research & education",
  },
  breedHistories: {
    text: "Breed founding dates, origins and original jobs: standard breed-club histories (e.g. American Kennel Club)",
    url: "https://www.akc.org/dog-breeds/",
  },
  naturalEarth: {
    text: "Map outlines: Natural Earth via world-atlas",
    url: "https://www.naturalearthdata.com/",
    license: "public domain",
  },
  wikiDomestication: { text: "Wikipedia: Domestication of the dog", url: "https://en.wikipedia.org/wiki/Domestication_of_the_dog", license: "CC BY-SA 4.0" },
  wikiGlacial: { text: "Wikipedia: Last Glacial Period; Last Glacial Maximum", url: "https://en.wikipedia.org/wiki/Last_Glacial_Period", license: "CC BY-SA 4.0" },
  wikiBonn: { text: "Wikipedia: Bonn–Oberkassel dog", url: "https://en.wikipedia.org/wiki/Bonn%E2%80%93Oberkassel_dog", license: "CC BY-SA 4.0" },
  wikiPaleo: { text: "Wikipedia: Paleolithic dog", url: "https://en.wikipedia.org/wiki/Paleolithic_dog", license: "CC BY-SA 4.0" },
  wikiBreeds: { text: "Wikipedia breed articles (Siberian Husky, Chow Chow, Basenji, Saluki, Shar Pei, Lhasa Apso and others): ancient-breed origin dates", url: "https://en.wikipedia.org/wiki/List_of_dog_breeds", license: "CC BY-SA 4.0" },
  omia: { text: "OMIA: Online Mendelian Inheritance in Animals (University of Sydney)", url: "https://omia.org/", license: "CC BY" },
  donner: {
    text: "Donner J. et al. (2018). Frequency and distribution of 152 genetic disease variants in over 100,000 mixed breed and purebred dogs. PLOS Genetics 14(4):e1007361; data on Dryad",
    url: "https://doi.org/10.1371/journal.pgen.1007361",
    license: "CC BY 4.0 / CC0",
  },
  brown: {
    text: "Brown E.A. et al. (2017). FGF4 retrogene on CFA12 is responsible for chondrodystrophy and intervertebral disc disease in dogs. PNAS 114(43):11476–11481",
    url: "https://doi.org/10.1073/pnas.1709082114",
    license: "PNAS open access",
  },
  marchant: {
    text: "Marchant T.W. et al. (2017). Canine brachycephaly is associated with a retrotransposon-mediated missplicing of SMOC2. Current Biology",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5462623",
    license: "CC BY 4.0",
  },
  karmi: {
    text: "Karmi N. et al. (2010), Am. J. Vet. Res.; Bannasch D. et al. (2008), PLOS Genetics: hyperuricosuria (SLC2A9)",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5551899",
  },
  dogwellnet: { text: "DogWellNet (International Partnership for Dogs)", url: "https://dogwellnet.com/" },
  dap: { text: "Dog Aging Project open data", url: "https://dogagingproject.org/open_data_access/" },
  nyc: {
    text: "NYC Dog Licensing Dataset, NYC Department of Health and Mental Hygiene (NYC Open Data); modified for this site",
    url: "https://data.cityofnewyork.us/Health/NYC-Dog-Licensing-Dataset/nu7n-tubp",
    license: "NYC Open Data Terms of Use",
  },
  monroe: {
    text: "Monroe B.L., Colaresi M.P., Quinn K.M. (2008). Fightin' Words. Political Analysis 16(4):372–403 (method)",
    url: "https://doi.org/10.1093/pan/mpn018",
  },
  pudding: { text: "Layout inspired by The Pudding, “Every Outdoor Basketball Court in the U.S.A.” (2024)", url: "https://pudding.cool/2024/09/courts/" },
} satisfies Record<string, Cite>;

/** Sources cited on each page (keyed by route, without the base path). */
const BY_PAGE: Record<string, Cite[]> = {
  "/history": [C.wikiDomestication, C.wikiGlacial, C.wikiBonn, C.wikiPaleo, C.wikiBreeds, C.breedHistories, C.parker, C.dogceo, C.naturalEarth],
  "/": [C.parker, C.dogceo],
  "/pairs": [C.parker, C.breedHistories, C.dogceo],
  "/purpose": [C.parker, C.breedHistories, C.dogceo],
  "/geography": [C.breedHistories, C.parker, C.naturalEarth, C.dogceo],
  "/explorer": [C.dogceo, C.parker, C.breedHistories, C.naturalEarth, C.pudding],
  "/health": [C.parker, C.omia, C.donner, C.brown, C.marchant, C.karmi, C.dogwellnet, C.dap, C.dogceo],
  "/names": [C.nyc, C.monroe, C.parker, C.dogceo],
};

const SOURCES_URL = "https://github.com/mforando/DogGenes/blob/main/SOURCES.md";
const LINKEDIN = "https://www.linkedin.com/in/mforando/";

export default function SiteFooter() {
  const raw = usePathname() ?? "/";
  const path = raw.replace(/\/+$/, "") || "/";
  const cites = BY_PAGE[path] ?? BY_PAGE["/"];

  return (
    <footer className="site-footer" aria-label="Sources and credits">
      <div className="sf-cites">
        <p className="sf-h">Sources for this page</p>
        <ol>
          {cites.map((c) => (
            <li key={c.url + c.text}>
              <a href={c.url} target="_blank" rel="noopener noreferrer">
                {c.text}
              </a>
              {c.license && <span className="sf-lic"> · {c.license}</span>}
            </li>
          ))}
        </ol>
        <p className="sf-all">
          All sources and licenses: <a href={SOURCES_URL} target="_blank" rel="noopener noreferrer">SOURCES.md</a>. For
          learning, not veterinary advice.
        </p>
      </div>
      <div className="sf-me">
        <p className="sf-h">Made by Mason Forando</p>
        <a className="sf-linkedin" href={LINKEDIN} target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <rect x="1" y="1" width="22" height="22" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <rect x="5.5" y="9.5" width="2.6" height="8.5" fill="currentColor" />
            <circle cx="6.8" cy="6.6" r="1.6" fill="currentColor" />
            <path d="M10.5 9.5h2.5v1.3c.5-.9 1.6-1.5 2.9-1.5 2.2 0 3.1 1.4 3.1 3.8V18h-2.6v-4.4c0-1.2-.4-2-1.5-2s-1.8.8-1.8 2V18h-2.6z" fill="currentColor" />
          </svg>
          Connect on LinkedIn
        </a>
      </div>
    </footer>
  );
}
