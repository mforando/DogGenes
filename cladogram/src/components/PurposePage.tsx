"use client";

import { useCallback, useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import JobMap from "./JobMap";
import { MixingBars, PurposeMatrix } from "./PurposeCharts";
import { PHONE, SiteNav, useMedia } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
import { FAMILIES, PURPOSE_LEVELS, PURPOSE_NOTE, PURPOSES, SUMMARIES, type PurposeId } from "@/lib/purpose";
import { Lv, useReadingLevel } from "@/lib/readingLevel";
import type { View } from "@/lib/steps";
import { Term } from "./Hints";

const nameOf = (c: string) => data.breeds[c]?.name ?? c;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const noop = () => {};

export default function PurposePage() {
  const [sel, setSel] = useState<PurposeId>("herd");
  const purpose = PURPOSES.find((p) => p.id === sel)!;
  const { level } = useReadingLevel();
  // Phones: crop the tree to its ring (the gallery below names the breeds).
  const phone = useMedia(PHONE);
  const blurb = level === "adult" ? purpose.blurb : PURPOSE_LEVELS[sel][level].blurb;
  const note = level === "adult" ? PURPOSE_NOTE[sel] : PURPOSE_LEVELS[sel][level].note;
  const total = Object.values(SUMMARIES).reduce((n, x) => n + x.codes.length, 0);
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
            <Lv
              puppy={
                <>
                  Most breeds were made to do a job: chase rabbits, find birds, herd sheep, guard
                  the farm, or snuggle on a lap. Here we sort all {total} breeds by their{" "}
                  <strong>first job</strong> and check their <Term id="dna">DNA</Term>. Did people make each kind of
                  working dog just once, or lots of times in different places? And which working
                  dogs got mixed with other breeds the most?
                </>
              }
              pro={
                <>
                  Most breeds were selected for a function: coursing, scenting, retrieving, herding,
                  guarding or companionship. Here all {total} breeds are classified by{" "}
                  <strong>original function</strong> and compared with their position in the{" "}
                  <Term id="dna">genomic</Term> phylogeny. Was each function selected once, within a single
                  clade, or convergently in unrelated lineages? And which functional groups show the
                  most recent admixture?
                </>
              }
            >
              Most breeds were made to do something: chase hares, find birds, herd sheep, guard
              the farm, or sit on a lap. Here we sort all {total}{" "}
              breeds by their <strong>original job</strong> and ask what their <Term id="dna">DNA</Term> says. Did each
              job get bred once, in one family of dogs, or many times over in unrelated ones? And
              which working dogs were crossed with other breeds the most?
            </Lv>
          </p>
          <p className="pairs-tip">
            <Lv
              puppy="Each breed gets just one job here, from its history. Lots of breeds did more than one job, and many are mostly pets now."
              pro="Function is reduced to one category per breed from standard breed histories (not part of the study); many breeds were multi-purpose, and many now serve mainly as companions."
            >
              Jobs are simplified to one per breed, from standard breed histories. Many breeds
              did several jobs, and plenty are mostly companions today.
            </Lv>
          </p>
        </header>

        <section className="pairs-section" aria-labelledby="matrix-h">
          <h2 id="matrix-h">One job, many families</h2>
          <p>
            <Lv
              puppy={
                <>
                  Each row is a job. Each column is a dog family from the family tree. A dot means
                  that family has dogs doing that job. Bigger dots mean more breeds. If a job has dots
                  in lots of columns, people made that kind of dog more than once! Point at a dot, a
                  job or a family to see the dogs. Click a row to learn more about that job below.
                </>
              }
              pro={
                <>
                  Rows are functional categories; columns are the clades of the phylogeny, in tree
                  order. Dot area scales with the number of breeds in each function × clade cell. A
                  function distributed across many clades indicates convergent selection in
                  unrelated lineages. Hover a cell, a function or a clade for its breeds; select a row
                  to examine it below.
                </>
              }
            >
              Each row is a job. Each column is one of the family groups from the family tree, in
              the same order. A dot means that family has breeds doing that job, and bigger dots
              mean more breeds. A job spread across many columns was bred more than once, in
              unrelated dogs. Hover over a dot to see the breeds, over a job to see all its breeds
              by family, or over a family to see all its breeds by job. Click a row to explore it
              below.
            </Lv>
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
              <Cladogram view={view} selected={null} onSelect={noop} compact={phone} />
              <p className="job-tree-cap">
                <Lv
                  puppy={<>The {s.codes.length} {purpose.name.toLowerCase()} light up on the family tree.</>}
                  pro={<>The {s.codes.length} {purpose.name.toLowerCase()} highlighted on the neighbor-joining tree.</>}
                >
                  The {s.codes.length} {purpose.name.toLowerCase()} lit up on the family tree.
                </Lv>
              </p>
            </div>
            <div className="job-info">
              <h3>{purpose.name}</h3>
              <p className="job-blurb">{blurb}</p>
              <dl className="job-stats">
                <div><dt>Breeds</dt><dd>{s.codes.length}</dd></div>
                <div><dt>Dogs tested</dt><dd>{s.dogs}</dd></div>
                <div><dt>Family groups</dt><dd>{s.families.length}</dd></div>
                <div>
                  <dt>Kept to themselves</dt>
                  <dd>{pct(s.keptToThemselves)}</dd>
                </div>
              </dl>
              <p className="job-note">{note}</p>
              {s.topPair && (
                <p className="job-pair">
                  <Lv
                    puppy={<>The two closest cousins with this job: <strong>{nameOf(s.topPair.a)}</strong> and <strong>{nameOf(s.topPair.b)}</strong>. They share about {s.topPair.pct < 1 ? s.topPair.pct.toFixed(1) : Math.round(s.topPair.pct)}% of their DNA in big matching pieces.</>}
                    pro={<>Highest pairwise haplotype sharing within this function: <strong>{nameOf(s.topPair.a)}</strong> and <strong>{nameOf(s.topPair.b)}</strong>, ~{s.topPair.pct < 1 ? s.topPair.pct.toFixed(1) : Math.round(s.topPair.pct)}% of the genome in shared IBD segments.</>}
                  >
                    Closest pair doing this job: <strong>{nameOf(s.topPair.a)}</strong> and{" "}
                    <strong>{nameOf(s.topPair.b)}</strong>, sharing about{" "}
                    {s.topPair.pct < 1 ? s.topPair.pct.toFixed(1) : Math.round(s.topPair.pct)}% of their DNA.
                  </Lv>
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
            <Lv
              puppy={
                <>
                  People mixed some kinds of dogs with other breeds a lot more than others. Each bar
                  shows how many breeds <em>from other families</em> a dog with that job shares big pieces of
                  DNA with, on average. More sharing means more mixing not long ago. Click a bar to see
                  that job.
                </>
              }
              pro={
                <>
                  Recent admixture varies by function. For each category: the mean number of breeds{" "}
                  <em>outside the focal breed&rsquo;s clade</em> with which it shares long{" "}
                  <Term id="haplotype">IBD haplotypes</Term> above the study&rsquo;s threshold, a proxy for recent
                  crossbreeding. Select a bar to examine that function.
                </>
              }
            >
              Breeders crossed some kinds of dogs far more than others. For each job, this is the
              average number of breeds <em>from other families</em> that each breed shares big
              chunks of DNA with, a sign of recent crossbreeding. Click a bar to explore that job.
            </Lv>
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
            <Lv
              puppy={<>Where this comes from: each breed&rsquo;s first job is from breed histories. Dog families and shared DNA are from a 2017 study by Parker and others. &ldquo;Kept to themselves&rdquo; means a breed doesn&rsquo;t share big pieces of DNA with any breed outside its family.</>}
              pro={<>Functional categories are assigned from breed-club histories (not part of the study). Clades and IBD sharing: Parker et&nbsp;al. 2017. &ldquo;Kept to themselves&rdquo; = no above-threshold haplotype sharing with any breed outside its clade; unclustered breeds are treated as singleton clades.</>}
            >
              Jobs: each breed&rsquo;s original purpose, simplified to one, from standard
              breed-club histories (not part of the study). Families and DNA sharing: Parker
              et&nbsp;al. 2017. &ldquo;Kept to themselves&rdquo; means a breed shares no big DNA
              chunks with any breed outside its family. Loner breeds count as a family of their
              own.
            </Lv>{" "}
            Photos: <a href="https://dog.ceo/dog-api/">Dog CEO API</a>.
          </p>
        </footer>
      </main>
    </>
  );
}
