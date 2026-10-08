"use client";

import { useMemo, useState, type ReactNode } from "react";
import * as d3 from "d3";
import { SiteNav } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { cousinPairs, crossPairs, lineagePairs, type PairRow } from "@/lib/pairs";

type SortKey = "a" | "b" | "pct" | "steps" | "note";
const PAGE = 12;

// One scale for every table so equal bars always mean equal sharing.
const maxPct = d3.max([...cousinPairs, ...crossPairs, ...lineagePairs], (r) => r.pct) ?? 1;
const barScale = d3.scaleLinear().domain([0, maxPct]).range([0, 100]);

const nameOf = (c: string) => data.breeds[c]?.name ?? c;
const familyOf = (c: string) => {
  const cl = data.breeds[c]?.clade;
  return cl ? data.clades[cl] : "Loner (no clear family)";
};

function Breed({ code }: { code: string }) {
  const url = PHOTOS[code]?.urls[0];
  const color = cladeColor(data.breeds[code]?.clade ?? null, code);
  return (
    <div className="pair-breed">
      {url ? (
        <img src={url} alt={nameOf(code)} loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="pair-noimg" style={{ borderColor: color }} aria-label={`No photo of ${nameOf(code)}`}>
          {nameOf(code)
            .split(/\s+/)
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
      )}
      <span className="pair-text">
        <span className="pair-name">{nameOf(code)}</span>
        <span className="pair-family">
          <i style={{ background: color }} aria-hidden />
          {familyOf(code)}
        </span>
      </span>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  setSort,
  className,
}: {
  label: ReactNode;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  setSort: (s: { key: SortKey; dir: 1 | -1 }) => void;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th scope="col" className={className} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() =>
          // Numbers start high-to-low, names A-to-Z; a second click flips it.
          setSort({ key: k, dir: active ? (sort.dir === 1 ? -1 : 1) : k === "pct" ? -1 : 1 })
        }
      >
        {label}
        <span className="sort-arrow" aria-hidden>
          {active ? (sort.dir === 1 ? "▲" : "▼") : "↕"}
        </span>
      </button>
    </th>
  );
}

function PairTable({
  rows,
  labels,
  withNote = false,
  caption,
}: {
  rows: PairRow[];
  labels: [string, string];
  withNote?: boolean;
  caption: string;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "pct", dir: -1 });
  const [all, setAll] = useState(false);

  const sorted = useMemo(() => {
    const val = (r: PairRow): string | number =>
      sort.key === "a" ? nameOf(r.a) : sort.key === "b" ? nameOf(r.b) : sort.key === "note" ? r.note ?? "" : r[sort.key];
    return [...rows].sort((x, y) => {
      const a = val(x), b = val(y);
      const c = typeof a === "number" ? a - (b as number) : a.localeCompare(b as string);
      return c * sort.dir || y.pct - x.pct;
    });
  }, [rows, sort]);
  const shown = all ? sorted : sorted.slice(0, PAGE);

  return (
    <div className="pair-table-wrap">
      <table className="pair-table">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="num rank">#</th>
            <SortHeader label={labels[0]} k="a" sort={sort} setSort={setSort} />
            <SortHeader label={labels[1]} k="b" sort={sort} setSort={setSort} />
            <SortHeader label="Shared DNA" k="pct" sort={sort} setSort={setSort} className="col-share" />
            <SortHeader label={<>Tree<br />branches apart</>} k="steps" sort={sort} setSort={setSort} className="num col-steps" />
            {withNote && <SortHeader label="The story" k="note" sort={sort} setSort={setSort} className="col-note" />}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, i) => (
            <tr key={r.key}>
              <td className="num rank">{i + 1}</td>
              <td><Breed code={r.a} /></td>
              <td>
                {withNote && <span className="arrow" aria-hidden>→</span>}
                <Breed code={r.b} />
              </td>
              <td className="col-share">
                <span className="share">
                  <span className="share-bar" aria-hidden>
                    <span style={{ width: `${barScale(r.pct)}%` }} />
                  </span>
                  <span className="share-num">
                    {r.pct < 1 ? r.pct.toFixed(1) : r.pct.toFixed(r.pct < 10 ? 1 : 0)}%
                    <span className="share-mb">{Math.round(r.mb)} Mb</span>
                  </span>
                </span>
              </td>
              <td className="num col-steps">{Number.isFinite(r.steps) ? r.steps : "–"}</td>
              {withNote && <td className="col-note">{r.note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > PAGE && (
        <button type="button" className="show-all" onClick={() => setAll((a) => !a)}>
          {all ? "Show the top 12 only" : `Show all ${rows.length} pairs`}
        </button>
      )}
    </div>
  );
}

export default function PairsPage() {
  return (
    <>
      <SiteNav />
      <main className="pairs">
        <header className="pairs-head">
          <p className="eyebrow">Breed pairs</p>
          <h1>Which breeds share the most DNA?</h1>
          <p className="pairs-lede">
            When dogs of two breeds carry the same <strong>long, unbroken chunks of DNA</strong>,
            they had common ancestors not long ago. Below are the pairs that share the most,
            in three flavors. The percent is how much DNA a typical dog from each breed has
            in common in those long chunks. The most closely tied pair in the study shares
            about {Math.round(maxPct)}%, and even 1% between two breeds is a lot.
          </p>
          <nav className="pairs-jump" aria-label="Sections">
            <a href="#cousins">Close cousins</a>
            <a href="#founders">Founder breeds</a>
            <a href="#across">Across families</a>
          </nav>
          <p className="pairs-tip">Click any column heading to sort. Click it again to flip the order.</p>
        </header>

        <section id="cousins" className="pairs-section" aria-labelledby="cousins-h">
          <h2 id="cousins-h">Close cousins</h2>
          <p>
            Breeds from the <strong>same family group</strong> that share the most DNA. They
            come from the same ancestors and, in many cases, were one breed not long ago:
            size varieties, coat varieties, or local types that registries later split apart.
          </p>
          <PairTable rows={cousinPairs} labels={["Breed", "Breed"]} caption="Same-family breed pairs ranked by shared DNA" />
        </section>

        <section id="founders" className="pairs-section" aria-labelledby="founders-h">
          <h2 id="founders-h">Parent and child breeds</h2>
          <p>
            Breeds with a <strong>documented founder</strong>: the newer breed was created from
            the older one. The DNA can&rsquo;t say which came first, since both are breeds alive
            today, so the direction comes from written breed histories. What the DNA
            <em> does</em> show is how much of the founder each newer breed still carries.
          </p>
          <PairTable
            rows={lineagePairs}
            labels={["Founder breed", "Breed made from it"]}
            withNote
            caption="Founder breeds and the breeds developed from them, ranked by shared DNA"
          />
        </section>

        <section id="across" className="pairs-section" aria-labelledby="across-h">
          <h2 id="across-h">Closest across families</h2>
          <p>
            Pairs from <strong>different family groups</strong>, which shouldn&rsquo;t share
            much at all, but do. These are the fingerprints of crossbreeding: a breed built
            from far-apart parents, or a popular breed mixed into others. Notice how many
            tree branches can sit between them.
          </p>
          <PairTable rows={crossPairs} labels={["Breed", "Breed"]} caption="Breed pairs from different families ranked by shared DNA" />
        </section>

        <footer className="pairs-foot">
          <p>
            Shared DNA: median total length of long identical DNA chunks shared between dogs of
            the two breeds, for pairs that passed the significance cutoff in Parker et&nbsp;al.
            2017 (Supplemental Table 2), shown as a share of the roughly 2.4 billion-letter dog
            genome. &ldquo;Tree branches apart&rdquo; counts the lines you&rsquo;d follow on the
            family tree to get from one breed to the other. Breed histories are summarized from
            standard breed-club accounts. Photos: <a href="https://dog.ceo/dog-api/">Dog CEO API</a>.
          </p>
        </footer>
      </main>
    </>
  );
}
