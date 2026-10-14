"use client";

import { useCallback, useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import JobMap from "./JobMap";
import { MixingBars, PurposeMatrix } from "./PurposeCharts";
import { SiteNav } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
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
  // A breed hovered on the map or in the photo gallery; each lights it up in the other.
  const [hovered, setHovered] = useState<string | null>(null);
  // Leaving one breed only clears the hover if nothing else has been entered since (the map's
  // and the gallery's enter/leave events can arrive in either order).
  const hover = useCallback((c: string, on: boolean) => setHovered((h) => (on ? c : h === c ? null : h)), []);
  const famColor = (f: string) => (f === "_none" ? "#7d847e" : cladeColor(f));
  const colorOf = useCallback(
    (c: string) => famColor(s.families.find((f) => s.byFamily[f].includes(c))!),
    [s],
  );

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
            unrelated dogs. Hover over a dot to see the breeds, over a job to see all its breeds
            by family, or over a family to see all its breeds by job. Click a row to explore it
            below.
          </p>
          <div className="matrix-wrap">
            <PurposeMatrix selected={sel} onSelect={setSel} />
          </div>
        </section>

        <section className="pairs-section job-explore" aria-labelledby="explore-h">
          <h2 id="explore-h">Explore a job</h2>
          <div className="job-chips" role="tablist" aria-label="Jobs">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={p.id === sel}
                className={p.id === sel ? "on" : ""}
                onClick={() => {
                  setSel(p.id);
                  setHovered(null);
                }}
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
              {s.topPair && (
                <p className="job-pair">
                  Closest pair doing this job: <strong>{nameOf(s.topPair.a)}</strong> and{" "}
                  <strong>{nameOf(s.topPair.b)}</strong>, sharing about{" "}
                  {s.topPair.pct < 1 ? s.topPair.pct.toFixed(1) : Math.round(s.topPair.pct)}% of their DNA.
                </p>
              )}
              <div className="job-map-wrap">
                <h4>Where they come from</h4>
                <JobMap codes={s.codes} colorOf={colorOf} hovered={hovered} onHover={hover} />
              </div>
            </div>
            <div className="job-gallery" aria-label={`${purpose.name} breeds by family`}>
              <div className="job-masonry">
              {[...s.families].sort((a, b) => s.byFamily[b].length - s.byFamily[a].length).map((f) => (
                <section key={f}>
                  <h4>
                    <i style={{ background: famColor(f) }} />
                    {FAMILIES.find((x) => x.id === f)!.name}
                    <b>{s.byFamily[f].length}</b>
                  </h4>
                  <ul>
                    {s.byFamily[f].map((c) => (
                      <li
                        key={c}
                        className={hovered === c ? "is-on" : undefined}
                        onPointerEnter={() => hover(c, true)}
                        onPointerLeave={() => hover(c, false)}
                      >
                        {photoOf(c) ? (
                          <img src={photoOf(c)} alt="" loading="lazy" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="job-nophoto" />
                        )}
                        <span>{nameOf(c)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              </div>
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
