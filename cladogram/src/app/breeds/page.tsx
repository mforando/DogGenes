import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/shared";
import JsonLd, { breadcrumbs } from "@/components/JsonLd";
import { BREED_CODES, breedPath } from "@/lib/breeds";
import { data, ringOrder } from "@/lib/tree";
import { CLADE_COLOR, cladeColor } from "@/lib/palette";
import { pageMeta } from "@/lib/seo";
import { abs } from "@/lib/site";

const TITLE = `All ${BREED_CODES.length} Dog Breeds in the DNA Family Tree`;
const DESCRIPTION = `Every breed in the 2017 dog DNA study, grouped by genetic family. Open any breed for its closest relatives, the breeds it shares DNA with, its origin and its job.`;

export const metadata: Metadata = pageMeta({ title: TITLE, description: DESCRIPTION, path: "/breeds/", image: "og/tree.png", type: "website" });

export default function Page() {
  // Families in the order they appear around the tree, loners last.
  const groups = new Map<string, string[]>();
  for (const code of ringOrder) {
    if (!BREED_CODES.includes(code)) continue;
    const key = data.breeds[code].clade ?? "_none";
    const list = groups.get(key) ?? groups.set(key, []).get(key)!;
    if (!list.includes(code)) list.push(code);
  }
  const ordered = [...groups].sort((a, b) => (a[0] === "_none" ? 1 : b[0] === "_none" ? -1 : 0));
  const az = [...BREED_CODES].sort((a, b) => data.breeds[a].name.localeCompare(data.breeds[b].name));

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: TITLE,
            description: DESCRIPTION,
            url: abs("/breeds/"),
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: az.length,
              itemListElement: az.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: data.breeds[c].name, url: abs(breedPath(c)) })),
            },
          },
          breadcrumbs([["Breeds", "/breeds/"]]),
        ]}
      />
      <SiteNav />
      <main className="purpose breed-page">
        <header className="pairs-head">
          <p className="eyebrow">Breed directory</p>
          <h1>Every breed on the dog family tree</h1>
          <p className="pairs-lede">
            The {BREED_CODES.length} breeds whose DNA was compared in the 2017 study behind this site, grouped by the genetic family they
            belong to. Pick a breed to see its closest relatives and the breeds it was crossed with.
          </p>
        </header>
        <div className="bp-dir">
          {ordered.map(([key, codes]) => (
            <section key={key}>
              <h2>
                <i className="bp-swatch" style={{ background: key === "_none" ? cladeColor(null, "") : CLADE_COLOR[key] }} aria-hidden />
                {key === "_none" ? "No clear family" : `${data.clades[key]} family`}
              </h2>
              <ul>
                {codes.map((c) => (
                  <li key={c}>
                    <Link href={breedPath(c)}>{data.breeds[c].name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
