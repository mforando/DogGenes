"use client";

import { useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import { MixingBars, PurposeMatrix } from "./PurposeCharts";
import { SiteNav } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { FAMILIES, PURPOSE_NOTE, PURPOSES, SUMMARIES, type PurposeId } from "@/lib/purpose";
import type { View } from "@/lib/steps";

const nameOf = (c: string) => data.breeds[c]?.name ?? c;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const noop = () => {};

export default function PurposePage() {
  const [sel, setSel] = useState<PurposeId>("herd");
  const purpose = PURPOSES.find((p) => p.id === sel)!;
  const s = SUMMARIES.find((x) => x.id === sel)!;
  const view = useMemo<View>(() => ({ color: "clade", codes: s.codes, cladeRing: true }), [s]);
  const gallery = s.codes.filter((c) => PHOTOS[c]).slice(0, 8);

  return (
    <>
      <SiteNav />
      <main className="purpose">
        <header className="pairs-head">
          <p className="eyebrow">Bred for purpose</p>
          <h1>Bred for a job</h1>
          <p className="pairs-lede">
            Most breeds were made to do something: chase hares, find birds, herd sheep, guard
            the farm, or sit on a lap. Here we sort all {Object.values(SUMMARIES).reduce((n, x) => n + x.codes.length, 0)}{" "}
            breeds by their <strong>original job</strong> and ask what their DNA says. Did each
            job get bred once, in one family of dogs, or many times over in unrelated ones? And
            which working dogs were crossed with other breeds the most?
          </p>
          <p className="pairs-tip">
            Jobs are simplified to one per breed, from standard breed histories. Many breeds
            did several jobs, and plenty are mostly companions today.
          </p>
        </header>

        <section className="pairs-section" aria-labelledby="matrix-h">
          <h2 id="matrix-h">One job, many families</h2>
          <p>
            Each row is a job. Each column is one of the family groups from the family tree, in
            the same order. A dot means that family has breeds doing that job, and bigger dots
            mean more breeds. A job spread across many columns was bred more than once, in
            unrelated dogs. Hover over a dot to see the breeds, and click a row to explore it
            below.
          </p>
          <div className="matrix-wrap">
            <PurposeMatrix selected={sel} onSelect={setSel} />
          </div>
        </section>

        <section className="pairs-section" aria-labelledby="explore-h">
          <h2 id="explore-h">Explore a job</h2>
          <div className="job-chips" role="tablist" aria-label="Jobs">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === sel}
                className={p.id === sel ? "on" : ""}
                onClick={() => setSel(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="job-panel">
            <div className="job-tree">
              <Cladogram view={view} selected={null} onSelect={noop} />
              <p className="job-tree-cap">
                The {s.codes.length} {purpose.name.toLowerCase()} lit up on the family tree.
              </p>
            </div>
            <div className="job-info">
              <h3>{purpose.name}</h3>
              <p className="job-blurb">{purpose.blurb}</p>
              <dl className="job-stats">
                <div><dt>Breeds</dt><dd>{s.codes.length}</dd></div>
                <div><dt>Dogs tested</dt><dd>{s.dogs}</dd></div>
                <div><dt>Family groups</dt><dd>{s.families.length}</dd></div>
                <div>
                  <dt>Kept to themselves</dt>
                  <dd>{pct(s.keptToThemselves)}</dd>
                </div>
              </dl>
              <p className="job-note">{PURPOSE_NOTE[sel]}</p>
              <ul className="job-fams">
                {s.families.map((f) => (
                  <li key={f}>
                    <i style={{ background: f === "_none" ? "#7d847e" : cladeColor(f) }} />
                    <strong>{FAMILIES.find((x) => x.id === f)!.name}</strong>
                    <span>{s.byFamily[f].map(nameOf).join(", ")}</span>
                  </li>
                ))}
              </ul>
              {s.topPair && (
                <p className="job-pair">
                  Closest pair doing this job: <strong>{nameOf(s.topPair.a)}</strong> and{" "}
                  <strong>{nameOf(s.topPair.b)}</strong>, sharing about{" "}
                  {s.topPair.pct < 1 ? s.topPair.pct.toFixed(1) : Math.round(s.topPair.pct)}% of their DNA.
                </p>
              )}
              {gallery.length > 0 && (
                <ul className="job-gallery">
                  {gallery.map((c) => (
                    <li key={c}>
                      <img src={PHOTOS[c].urls[0]} alt={nameOf(c)} loading="lazy" referrerPolicy="no-referrer" />
                      <span>{nameOf(c)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="pairs-section" aria-labelledby="mix-h">
          <h2 id="mix-h">Which jobs got mixed the most?</h2>
          <p>
            Breeders crossed some kinds of dogs far more than others. For each job, this is the
            average number of breeds <em>from other families</em> that each breed shares big
            chunks of DNA with, a sign of recent crossbreeding. Click a bar to explore that job.
          </p>
          <MixingBars selected={sel} onSelect={setSel} />
        </section>

        <section className="pairs-section" aria-labelledby="table-h">
          <h2 id="table-h">All jobs at a glance</h2>
          <div className="pair-table-wrap">
            <table className="pair-table job-table">
              <thead>
                <tr>
                  <th scope="col"><span className="th-pad">Job</span></th>
                  <th scope="col" className="num"><span className="th-pad">Breeds</span></th>
                  <th scope="col" className="num"><span className="th-pad">Dogs tested</span></th>
                  <th scope="col" className="num"><span className="th-pad">Families</span></th>
                  <th scope="col" className="num"><span className="th-pad">Outside ties per breed</span></th>
                  <th scope="col" className="num"><span className="th-pad">Kept to themselves</span></th>
                </tr>
              </thead>
              <tbody>
                {SUMMARIES.map((x) => (
                  <tr key={x.id} className={x.id === sel ? "is-sel" : ""} onClick={() => setSel(x.id)}>
                    <td className="job-cell">{PURPOSES.find((p) => p.id === x.id)!.name}</td>
                    <td className="num">{x.codes.length}</td>
                    <td className="num">{x.dogs}</td>
                    <td className="num">{x.families.length}</td>
                    <td className="num">{x.crossPerBreed.toFixed(1)}</td>
                    <td className="num">{pct(x.keptToThemselves)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="pairs-foot">
          <p>
            Jobs: each breed&rsquo;s original purpose, simplified to one, from standard
            breed-club histories (not part of the study). Families and DNA sharing: Parker
            et&nbsp;al. 2017. &ldquo;Kept to themselves&rdquo; means a breed shares no big DNA
            chunks with any breed outside its family. Loner breeds count as a family of their
            own. Photos: <a href="https://dog.ceo/dog-api/">Dog CEO API</a>.
          </p>
        </footer>
      </main>
    </>
  );
}
