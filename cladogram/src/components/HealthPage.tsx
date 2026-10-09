"use client";

import { useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import { FreqBars, TraitMatrix } from "./HealthCharts";
import { SiteNav } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
import { VARIANTS, candidates, familiesOf } from "@/lib/health";
import type { View } from "@/lib/steps";

const nameOf = (c: string) => data.breeds[c]?.name ?? c;
const noop = () => {};

function Chip({ code }: { code: string }) {
  const url = photoOf(code);
  return (
    <li className="hl-chip">
      {url ? (
        <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="hl-noimg" style={{ borderColor: cladeColor(data.breeds[code]?.clade ?? null, code) }} aria-hidden />
      )}
      <span>{nameOf(code)}</span>
    </li>
  );
}

const SOURCES = [
  {
    name: "OMIA: Online Mendelian Inheritance in Animals",
    url: "https://omia.org/",
    what: "An open, curated catalogue of inherited disorders and traits in animals, run from the University of Sydney. For dogs it lists over 400 single-gene disorders, most with the responsible mutation identified, and which breeds carry each one. The carrier lists on this page come from OMIA.",
  },
  {
    name: "Donner et al. 2018 & MyBreedData",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5945203/",
    what: "152 disease variants tested in over 100,000 dogs (83,000 mixed breeds, 18,000 purebreds from 330 breeds). The full genotype dataset is open on Dryad (doi:10.5061/dryad.dd91b), and MyBreedData.com keeps an updated view by breed.",
    extra: { label: "Dryad dataset", url: "https://datadryad.org/stash/dataset/doi:10.5061/dryad.dd91b" },
  },
  {
    name: "Parker et al. 2017 (this site's study)",
    url: "https://doi.org/10.1016/j.celrep.2017.03.079",
    what: "The family tree and the breed-to-breed DNA sharing table behind every chart on this site, published as open supplementary data. Its Figure 7 is the case study above.",
  },
  {
    name: "Dog Aging Project",
    url: "https://dogagingproject.org/open_data_access/",
    what: "An open-science study following tens of thousands of companion dogs as they age. De-identified health, lifestyle, and genomic data are released yearly to researchers through the Terra platform.",
  },
  {
    name: "DogWellNet: Harmonization of Genetic Testing",
    url: "https://dogwellnet.com/",
    what: "A free, international directory of which genetic tests are relevant for which breeds, maintained by the International Partnership for Dogs.",
  },
];

export default function HealthPage() {
  const [sel, setSel] = useState("cea");
  const v = VARIANTS.find((x) => x.id === sel)!;
  const cand = useMemo(() => candidates(v).slice(0, 8), [v]);
  const view = useMemo<View>(
    () => ({ color: "clade", codes: v.carriers, links: { codes: v.carriers }, cladeRing: true }),
    [v],
  );
  const caseIds = ["cea", "mdr1"];

  return (
    <>
      <SiteNav />
      <main className="purpose health">
        <header className="pairs-head">
          <p className="eyebrow">Health &amp; heredity</p>
          <h1>Why a dog family tree matters for dog health</h1>
          <p className="pairs-lede">
            Every breed began with a small group of founding dogs. If one of those founders
            carried a harmful mutation, it could spread to thousands of descendants, and then
            jump to other breeds whenever breeders crossed them. Knowing how breeds are related,
            and which ones were crossed, tells scientists <strong>where a disease came from,
            which breeds might be carrying it unnoticed, and which dogs to test first</strong>.
          </p>
        </header>

        <section className="pairs-section hl-why" aria-labelledby="why-h">
          <h2 id="why-h">Three reasons this research matters</h2>
          <ol className="hl-reasons">
            <li>
              <strong>Breeds are closed gene pools.</strong> Purebred dogs only mate within their
              breed, so a founder&rsquo;s mutation doesn&rsquo;t get diluted. That&rsquo;s why
              specific breeds have specific inherited diseases, and why purebreds in one large
              study were 2.7 times more likely than mixed breeds to inherit two copies of a disease
              variant.
            </li>
            <li>
              <strong>Shared DNA reveals hidden carriers.</strong> When two breeds share long,
              identical stretches of DNA, they may also share the mutations sitting inside those
              stretches. The study used this to explain puzzling cases and to predict breeds that
              should be tested next.
            </li>
            <li>
              <strong>Dog diseases teach us about human ones.</strong> Dogs get many of the same
              illnesses as people (cancers, eye diseases, nerve disorders), and a breed&rsquo;s
              simple genetics makes the responsible gene far easier to find. The study itself
              came from the Cancer Genetics and Comparative Genomics Branch of the U.S. National
              Human Genome Research Institute.
            </li>
          </ol>
        </section>

        <section className="pairs-section" aria-labelledby="case-h">
          <h2 id="case-h">The study&rsquo;s detective work</h2>
          <p>
            The article traces two mutations from British herding dogs into unexpected breeds.
            Carriers light up on the family tree, and the curves show which breeds share long
            chunks of DNA with them.
          </p>
          <div className="job-chips" role="tablist" aria-label="Case study">
            {caseIds.map((id) => {
              const x = VARIANTS.find((y) => y.id === id)!;
              return (
                <button key={id} type="button" role="tab" aria-selected={sel === id} className={sel === id ? "on" : ""} onClick={() => setSel(id)}>
                  {x.name}
                </button>
              );
            })}
            {!caseIds.includes(sel) && (
              <button type="button" role="tab" aria-selected className="on">
                {v.name}
              </button>
            )}
          </div>

          <div className="job-panel">
            <div className="job-tree">
              <Cladogram view={view} selected={null} onSelect={noop} />
              <p className="job-tree-cap">
                Documented carriers of {v.name.toLowerCase()} on the family tree, with their DNA-sharing curves.
              </p>
            </div>
            <div className="job-info">
              <h3>{v.name}</h3>
              <p className="job-blurb">{v.what}</p>
              <p className="hl-gene">Gene: {v.gene}</p>
              {sel === "cea" && (
                <p className="job-note">
                  Collie eye anomaly is a herding-dog disease. The collie, Shetland sheepdog, Border
                  collie and Australian shepherd all carry the same 7.8 kb deletion, inherited from
                  one shared ancestor. But it also turns up in the Nova Scotia duck tolling
                  retriever, a Canadian gun dog. The DNA-sharing data solved it: collies and/or
                  Shetland sheepdogs were undocumented contributors to the toller, and most likely
                  brought the mutation with them.
                </p>
              )}
              {sel === "mdr1" && (
                <p className="job-note">
                  MDR1 makes dogs dangerously sensitive to common drugs. It&rsquo;s found across the
                  UK herding breeds and in about 10% of German shepherds. The study found shared DNA
                  linking the German shepherd to those herders through the Australian shepherd, and
                  linking the chinook (15% carriers) to the German shepherd. The Xoloitzcuintli
                  shares DNA with the same carriers, so the authors predicted this rare breed may
                  carry MDR1 too, though it had yet to be tested.
                </p>
              )}
              {!caseIds.includes(sel) && v.note && <p className="job-note">{v.note}</p>}
              {caseIds.includes(sel) && v.note && <p className="hl-small">{v.note}</p>}
              <p className="side-h">Documented carriers ({v.carriers.length} breeds in the study)</p>
              <ul className="hl-chips">
                {v.carriers.map((c) => (
                  <Chip key={c} code={c} />
                ))}
              </ul>
              <p className="side-h">Share the most DNA with carriers (worth testing)</p>
              <ul className="hl-cands">
                {cand.map((c) => (
                  <li key={c.code}>
                    <i style={{ background: cladeColor(data.breeds[c.code]?.clade ?? null, c.code) }} aria-hidden />
                    <span className="hl-cname">{nameOf(c.code)}</span>
                    <span className="hl-cmeta">
                      linked to {c.links} carrier{c.links === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="hl-small">
                Not a diagnosis: sharing DNA with carriers raises the chance a breed carries a
                variant, but only a DNA test can say. Some of these may already have been tested
                and found clear. Carrier list:{" "}
                <a href={v.source.url}>{v.source.label}</a>.
              </p>
            </div>
          </div>
        </section>

        <section className="pairs-section" aria-labelledby="matrix-h">
          <h2 id="matrix-h">Old mutations travel far, young ones stay close</h2>
          <p>
            Each row is a known disease variant; each column is a family group from the family
            tree. A variant confined to one or two families probably arose recently in a founder
            and spread through a few crosses. A variant found across many unrelated families
            is probably <strong>ancient</strong>, older than the breeds themselves, carried by
            the general dog population long before breeds were split apart. Click a row to see it
            on the family tree above.
          </p>
          <div className="matrix-wrap">
            <TraitMatrix
              selected={sel}
              onSelect={(id) => {
                setSel(id);
                document.getElementById("case-h")?.scrollIntoView({ behavior: "smooth" });
              }}
            />
          </div>
          <div className="hl-variants">
            {VARIANTS.map((x) => (
              <div key={x.id} className="hl-variant">
                <p className="hl-vname">{x.name}</p>
                <p className="hl-vwhat">{x.what}</p>
                <p className="hl-vmeta">
                  {x.gene} · {x.carriers.length} study breeds in {familiesOf(x).length} famil
                  {familiesOf(x).length === 1 ? "y" : "ies"} · <a href={x.source.url}>{x.source.label}</a>
                </p>
                {x.note && <p className="hl-vnote">{x.note}</p>}
              </div>
            ))}
          </div>
        </section>

        <section className="pairs-section" aria-labelledby="mixed-h">
          <h2 id="mixed-h">Mixed breeds carry them too</h2>
          <p>
            In the largest open study (over 100,000 dogs), about <strong>2 in 5 dogs</strong>{" "}
            carried at least one copy of a tested disease variant. The most common variants in
            mixed breeds were the same as in purebreds: old mutations already shared by many breed
            groups. Mixed breeds were less likely to inherit two copies, which is usually what it
            takes to get sick.
          </p>
          <FreqBars />
          <p className="hl-small">
            Source: Donner et al. 2018, <i>PLOS Genetics</i>, Table 2. Frequencies are for gene
            copies (alleles), not dogs.
          </p>
        </section>

        <section className="pairs-section" aria-labelledby="data-h">
          <h2 id="data-h">Open data you can explore</h2>
          <ul className="hl-sources">
            {SOURCES.map((s) => (
              <li key={s.name}>
                <a href={s.url} className="hl-sname">{s.name} →</a>
                <p>{s.what}</p>
                {s.extra && (
                  <a href={s.extra.url} className="hl-extra">
                    {s.extra.label} →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <footer className="pairs-foot">
          <p>
            For learning, not veterinary advice. Carrier lists are limited to breeds sampled in
            Parker et&nbsp;al. 2017 and aren&rsquo;t exhaustive; many breeds have never been
            tested for every variant. Talk to a veterinarian about testing a specific dog.
            Photos: Dog CEO API.
          </p>
        </footer>
      </main>
    </>
  );
}
