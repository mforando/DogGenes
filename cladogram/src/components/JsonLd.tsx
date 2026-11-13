import { abs, AUTHOR, SITE_NAME, STUDY_CITATION } from "@/lib/site";

/** Renders schema.org structured data. Server component: the JSON lands in the static HTML. */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here except for "</script>", which we escape.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}

/** Home › page breadcrumb trail. */
export const breadcrumbs = (trail: [name: string, path: string][]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [["Home", "/"] as [string, string], ...trail].map(([name, path], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: abs(path),
  })),
});

/** An explanatory story page, with the study it draws on. */
export const article = (o: { headline: string; description: string; path: string; image: string; cites?: boolean }) => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: o.headline,
  description: o.description,
  url: abs(o.path),
  mainEntityOfPage: abs(o.path),
  image: abs(o.image),
  author: AUTHOR,
  publisher: { "@type": "Organization", name: SITE_NAME, url: abs("/") },
  datePublished: "2026-10-08",
  dateModified: new Date().toISOString().slice(0, 10),
  inLanguage: "en",
  about: [{ "@type": "Thing", name: "Dog", sameAs: "https://en.wikipedia.org/wiki/Dog" }, { "@type": "Thing", name: "Dog breed", sameAs: "https://en.wikipedia.org/wiki/Dog_breed" }],
  ...(o.cites === false ? {} : { citation: STUDY_CITATION }),
});
