import type { Metadata } from "next";
import { SiteNav } from "@/components/shared";
import { factSources } from "@/lib/breedFacts";
import { abs } from "@/lib/site";

const TITLE = "Breed Information Sources";
const DESCRIPTION = "The English Wikipedia article behind each breed's description, history, origin, height and weight on this site.";

// Linked from the "Sources for this page" footers; kept out of search results and the sitemap.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  alternates: { canonical: abs("/sources/breeds/") },
};

export default function Page() {
  const all = factSources();
  const letters = new Map<string, typeof all>();
  for (const s of all) {
    const l = s.name[0].toUpperCase();
    (letters.get(l) ?? letters.set(l, []).get(l)!).push(s);
  }

  return (
    <>
      <SiteNav />
      <main className="purpose breed-page">
        <header className="pairs-head">
          <p className="eyebrow">Sources</p>
          <h1>Where the breed information comes from</h1>
          <p className="pairs-lede">
            The short description, line of history, origin, height and weight shown for each breed in tooltips, pop-ups
            and breed pages are quoted and shortened from that breed&rsquo;s English Wikipedia article, by Wikipedia
            contributors, under{" "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">
              CC BY-SA 4.0
            </a>
            . Below are the {all.length} articles used, A to Z by breed.
          </p>
        </header>
        <nav className="src-az" aria-label="Jump to letter">
          {[...letters.keys()].map((l) => (
            <a key={l} href={`#letter-${l}`}>
              {l}
            </a>
          ))}
        </nav>
        <div className="src-list">
          {[...letters].map(([l, items]) => (
            <section key={l} id={`letter-${l}`}>
              <h2>{l}</h2>
              <ul>
                {items.map((s) => (
                  <li key={s.name + s.url}>
                    {s.name}:{" "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      Wikipedia, &ldquo;{s.title}&rdquo;
                    </a>
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
