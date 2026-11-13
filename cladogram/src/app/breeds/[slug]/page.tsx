import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/shared";
import JsonLd, { breadcrumbs } from "@/components/JsonLd";
import { BREED_CODES, breedPage, breedPath, breedSummary, codeOfSlug, slugOf, type BreedPage } from "@/lib/breeds";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { pageMeta } from "@/lib/seo";
import { abs, AUTHOR, SITE_NAME } from "@/lib/site";

type Params = { slug: string };

export const dynamicParams = false;
export function generateStaticParams(): Params[] {
  return BREED_CODES.map((c) => ({ slug: slugOf(c) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const code = codeOfSlug.get((await params).slug);
  if (!code) return {};
  const p = breedPage(code);
  return pageMeta({
    title: `${p.name}: DNA Relatives, Breed Family and Origin`,
    description: breedSummary(p),
    path: breedPath(code),
    image: p.photo ?? "og/tree.png",
    imageAlt: p.name,
  });
}

const fmtYears = (n: number) => n.toLocaleString("en-US");

function BreedLink({ code }: { code: string }) {
  return (
    <Link href={breedPath(code)} className="bp-link">
      <i style={{ background: cladeColor(data.breeds[code].clade, code) }} aria-hidden />
      {data.breeds[code].name}
    </Link>
  );
}

/** AKC rank over time as a small server-drawn line (rank 1 at the top). */
function RankSpark({ ranks }: { ranks: { year: number; rank: number }[] }) {
  const W = 260, H = 70, pad = 6;
  const y0 = ranks[0].year, y1 = ranks[ranks.length - 1].year;
  const worst = Math.max(...ranks.map((r) => r.rank));
  const x = (y: number) => pad + ((y - y0) / Math.max(1, y1 - y0)) * (W - 2 * pad);
  const y = (r: number) => pad + ((r - 1) / Math.max(1, worst - 1)) * (H - 2 * pad);
  const d = ranks.map((r, i) => `${i ? "L" : "M"}${x(r.year).toFixed(1)},${y(r.rank).toFixed(1)}`).join("");
  const last = ranks[ranks.length - 1];
  return (
    <svg className="bp-spark" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`AKC popularity rank by year, ${y0} to ${y1}; ranked ${last.rank} in ${last.year}`}>
      <path d={d} fill="none" stroke="var(--gold)" strokeWidth={2} />
      <circle cx={x(last.year)} cy={y(last.rank)} r={4} fill="var(--gold)" />
    </svg>
  );
}

function Body({ p }: { p: BreedPage }) {
  const lastRank = p.ranks[p.ranks.length - 1];
  const firstRank = p.ranks[0];
  return (
    <main className="purpose breed-page">
      <nav className="bp-crumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span aria-hidden>›</span> <Link href="/breeds/">Breeds</Link> <span aria-hidden>›</span>{" "}
        <span aria-current="page">{p.name}</span>
      </nav>
      <header className="bp-head">
        <div>
          <p className="eyebrow">
            <i className="bp-swatch" style={{ background: p.color }} aria-hidden />
            {p.cladeName ? `${p.cladeName} family` : "No clear family group"}
            {p.purpose ? ` · ${p.purpose.name}` : ""}
          </p>
          <h1>{p.name}</h1>
          <p className="pairs-lede">{breedSummary(p).replace(" See its", " Below: its")}</p>
          <dl className="bp-facts">
            {p.origin && (
              <div>
                <dt>Origin</dt>
                <dd>
                  {p.origin.place}, {p.origin.country}
                </dd>
              </div>
            )}
            {p.purpose && (
              <div>
                <dt>Original job</dt>
                <dd>{p.purpose.name}</dd>
              </div>
            )}
            {p.modern && (
              <div>
                <dt>Founded</dt>
                <dd>
                  {p.modern.approx ? "about " : ""}
                  {p.modern.year}
                </dd>
              </div>
            )}
            {p.ancient?.ago && (
              <div>
                <dt>Type dates back</dt>
                <dd>about {fmtYears(p.ancient.ago)} years</dd>
              </div>
            )}
            {p.facts?.ht && (
              <div>
                <dt>Height</dt>
                <dd>{p.facts.ht}</dd>
              </div>
            )}
            {p.facts?.wt && (
              <div>
                <dt>Weight</dt>
                <dd>{p.facts.wt}</dd>
              </div>
            )}
            {lastRank && (
              <div>
                <dt>AKC rank, {lastRank.year}</dt>
                <dd>No. {lastRank.rank}</dd>
              </div>
            )}
          </dl>
        </div>
        {p.photo && (
          <figure className="bp-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.photo} alt={`A ${p.name}`} width={480} height={360} referrerPolicy="no-referrer" />
            <figcaption>
              {p.commons ? (
                <>
                  Photo: {p.commons.author},{" "}
                  {p.commons.licenseUrl ? <a href={p.commons.licenseUrl}>{p.commons.license}</a> : p.commons.license},{" "}
                  <a href={p.commons.page}>Wikimedia Commons</a>
                </>
              ) : (
                <>
                  Photo: <a href="https://dog.ceo/dog-api/">Dog CEO API</a>
                </>
              )}
            </figcaption>
          </figure>
        )}
      </header>

      <div className="bp-grid">
        <section aria-labelledby="bp-tree">
          <h2 id="bp-tree">Closest relatives on the family tree</h2>
          <p className="bp-note">
            Breeds whose branch joins the {p.name}&rsquo;s soonest on the DNA family tree of 161 breeds, nearest first.
          </p>
          {p.cousins.length ? (
            <ol className="bp-list">
              {p.cousins.map((c) => (
                <li key={c.code}>
                  {c.code === "WOLF" ? <span className="bp-link">Grey wolf</span> : <BreedLink code={c.code} />}
                  <span className="bp-meta">{c.splits === 1 ? "next branch over" : `${c.splits} forks back`}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="bp-note">This breed&rsquo;s dogs are split across the tree, so it has no single branch.</p>
          )}
          <p className="bp-more">
            <Link href="/tree/">Explore the interactive family tree →</Link>
          </p>
        </section>

        <section aria-labelledby="bp-dna">
          <h2 id="bp-dna">Breeds it shares DNA with</h2>
          <p className="bp-note">
            Long stretches of identical DNA point to a recent shared ancestor, usually because breeders crossed the two breeds. Shown as a share of the
            whole genome.
          </p>
          {p.dna.length ? (
            <ol className="bp-list">
              {p.dna.map((d) => (
                <li key={d.code}>
                  {d.code === "WOLF" || d.code === "GDJK" ? <span className="bp-link">{data.breeds[d.code].name}</span> : <BreedLink code={d.code} />}
                  <span className="bp-meta">
                    {d.pct.toFixed(1)}% · {d.sameFamily ? "same family" : "different family"}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="bp-note">No breed shares an unusual amount of DNA with the {p.name}: no sign of recent crossing.</p>
          )}
        </section>

        {p.mates.length > 0 && (
          <section aria-labelledby="bp-family">
            <h2 id="bp-family">The {p.cladeName} family</h2>
            <p className="bp-note">
              Breeds that share one branch, or clade, of the tree with the {p.name}.
            </p>
            <ul className="bp-chips">
              {p.mates.map((c) => (
                <li key={c}>
                  <BreedLink code={c} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {p.ranks.length > 1 && (
          <section aria-labelledby="bp-rank">
            <h2 id="bp-rank">Popularity in the United States</h2>
            <p className="bp-note">
              American Kennel Club registration rank: No. {firstRank.rank} in {firstRank.year}, No. {lastRank.rank} in {lastRank.year}.
            </p>
            <RankSpark ranks={p.ranks} />
            <p className="bp-more">
              <Link href="/popularity/">All breeds, year by year →</Link>
            </p>
          </section>
        )}

        {p.names && (
          <section aria-labelledby="bp-names">
            <h2 id="bp-names">Popular {p.name} names in New York City</h2>
            <p className="bp-note">
              Names far more common for this breed than for NYC dogs overall, from {p.names.dogs.toLocaleString("en-US")} licensed dogs.
            </p>
            <ul className="bp-chips bp-names">
              {p.names.list.map((n) => (
                <li key={n.name}>
                  {n.name} <span className="bp-meta">×{n.lift.toFixed(1)}</span>
                </li>
              ))}
            </ul>
            <p className="bp-more">
              <Link href="/names/">How New York names its dogs →</Link>
            </p>
          </section>
        )}

        {p.facts && (
          <section aria-labelledby="bp-about" className="bp-wide">
            <h2 id="bp-about">About the {p.name}</h2>
            <p>{p.facts.a}</p>
            {p.facts.h && <p>{p.facts.h}</p>}
            {p.origin?.note && <p>{p.origin.note}</p>}
            <p className="bp-src">
              From Wikipedia&rsquo;s <a href={p.wiki ?? undefined}>{p.facts.w.replace(/_/g, " ")}</a> article, CC BY-SA 4.0.
            </p>
          </section>
        )}
      </div>

      <p className="bp-src">
        Family tree and DNA sharing: Parker et&nbsp;al., <i>Cell Reports</i> 19 (2017),{" "}
        <a href="https://doi.org/10.1016/j.celrep.2017.03.079">doi:10.1016/j.celrep.2017.03.079</a>. <Link href="/breeds/">All breeds →</Link>
      </p>
    </main>
  );
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const code = codeOfSlug.get((await params).slug);
  if (!code) notFound();
  const p = breedPage(code);
  const path = breedPath(code);
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${p.name}: DNA relatives, breed family and origin`,
            description: breedSummary(p),
            url: abs(path),
            isPartOf: { "@type": "WebSite", name: SITE_NAME, url: abs("/") },
            author: AUTHOR,
            ...(p.photo ? { primaryImageOfPage: { "@type": "ImageObject", contentUrl: p.photo } } : {}),
            about: { "@type": "Thing", name: p.name, ...(p.wiki ? { sameAs: p.wiki } : {}) },
          },
          breadcrumbs([
            ["Breeds", "/breeds/"],
            [p.name, path],
          ]),
        ]}
      />
      <SiteNav />
      <Body p={p} />
    </>
  );
}
