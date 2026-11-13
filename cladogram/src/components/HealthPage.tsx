"use client";

import { useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import { FreqBars, TraitMatrix } from "./HealthCharts";
import { PHONE, SiteNav, useMedia } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
import { VARIANT_LEVELS, VARIANTS, candidates, familiesOf, type Variant } from "@/lib/health";
import { Lv, useReadingLevel, type ReadingLevel } from "@/lib/readingLevel";
import type { View } from "@/lib/steps";
import { B, Term } from "./Hints";

const nameOf = (c: string) => data.breeds[c]?.name ?? c;
const noop = () => {};

function Chip({ code }: { code: string }) {
  const url = photoOf(code);
  return (
    <li className="hl-chip">
      {url ? (
        <img src={url} alt={nameOf(code)} loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className="hl-noimg" style={{ borderColor: cladeColor(data.breeds[code]?.clade ?? null, code) }} aria-hidden />
      )}
      <span>{nameOf(code)}</span>
    </li>
  );
}

/** A variant's description and note at the reader's level. */
const atLevel = (x: Variant, level: ReadingLevel) => (level === "adult" ? x : { ...x, ...VARIANT_LEVELS[x.id]?.[level] });

const SOURCES: { name: string; url: string; what: string; puppy: string; pro: string; extra?: { label: string; url: string } }[] = [
  {
    name: "OMIA: Online Mendelian Inheritance in Animals",
    url: "https://omia.org/",
    what: "An open, curated catalogue of inherited disorders and traits in animals, run from the University of Sydney. For dogs it lists over 400 single-gene disorders, most with the responsible mutation identified, and which breeds carry each one. The carrier lists on this page come from OMIA.",
    puppy: "A free online list of diseases that animals can inherit from their parents. For dogs it lists more than 400, and which breeds have each one. The lists on this page come from here.",
    pro: "Curated database of inherited disorders and traits in animals (University of Sydney). For the dog: >400 Mendelian disorders, most with a characterized causal variant, and breed occurrence. Carrier lists on this page are drawn from OMIA.",
  },
  {
    name: "Donner et al. 2018 & MyBreedData",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5945203/",
    what: "152 disease variants tested in over 100,000 dogs (83,000 mixed breeds, 18,000 purebreds from 330 breeds). The full genotype dataset is open on Dryad (doi:10.5061/dryad.dd91b), and MyBreedData.com keeps an updated view by breed.",
    puppy: "Scientists tested more than 100,000 dogs, both mixed breeds and purebreds, for 152 diseases. Anyone can download the results.",
    pro: "Genotypes for 152 disease variants in >100,000 dogs (83,000 mixed-breed; 18,000 purebred from 330 breeds); open on Dryad (doi:10.5061/dryad.dd91b), with breed-level frequencies maintained at MyBreedData.",
    extra: { label: "Dryad dataset", url: "https://datadryad.org/stash/dataset/doi:10.5061/dryad.dd91b" },
  },
  {
    name: "Parker et al. 2017 (this site's study)",
    url: "https://doi.org/10.1016/j.celrep.2017.03.079",
    what: "The family tree and the breed-to-breed DNA sharing table behind every chart on this site, published as open supplementary data. Its Figure 7 is the case study above.",
    puppy: "The study this whole website is about. It made the dog family tree and measured how much DNA breeds share. Its Figure 7 is the detective story above.",
    pro: "Source of the neighbor-joining phylogeny and pairwise IBD-sharing matrix used throughout this site (open supplementary data); Figure 7 is the case study above.",
  },
  {
    name: "Dog Aging Project",
    url: "https://dogagingproject.org/open_data_access/",
    what: "An open-science study following tens of thousands of companion dogs as they age. De-identified health, lifestyle, and genomic data are released yearly to researchers through the Terra platform.",
    puppy: "A big study that follows tens of thousands of pet dogs as they get older, to learn how dogs can live longer, healthier lives.",
    pro: "Longitudinal open-science cohort of tens of thousands of companion dogs; de-identified health, environmental and genomic data released annually via Terra.",
  },
  {
    name: "DogWellNet: Harmonization of Genetic Testing",
    url: "https://dogwellnet.com/",
    what: "A free, international directory of which genetic tests are relevant for which breeds, maintained by the International Partnership for Dogs.",
    puppy: "A free website that tells owners and breeders which DNA tests make sense for each breed.",
    pro: "International Partnership for Dogs resource harmonizing breed-relevant genetic tests and their validation status.",
  },
];

export default function HealthPage() {
  const [sel, setSel] = useState("cea");
  const { level } = useReadingLevel();
  // Phones: crop the tree to its ring (the carrier list below names the breeds).
  const phone = useMedia(PHONE);
  const v = atLevel(VARIANTS.find((x) => x.id === sel)!, level);
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
            <Lv
              puppy={
                <>
                  Every breed started with just a few dogs. If one of those first dogs had a
                  harmful change in its <Term id="dna">DNA</Term>, it could pass to thousands of puppies, and
                  then hop into other breeds when breeders mixed them. Knowing which breeds are
                  related helps scientists figure out <strong>where a disease came from, which breeds
                  might have it without anyone knowing, and which dogs to test first</strong>.
                </>
              }
              pro={
                <>
                  Breeds derive from small founder populations, so a deleterious allele carried by a
                  founder can rise to high frequency through drift and popular-sire effects, then
                  introgress into other breeds through admixture. Breed phylogeny and recent{" "}
                  <Term id="haplotype">haplotype</Term> sharing therefore indicate{" "}
                  <strong>a variant&rsquo;s origin, which breeds may carry it undetected, and where
                  screening should be prioritized</strong>.
                </>
              }
            >
              Every breed began with a small group of founding dogs. If one of those founders
              carried a harmful mutation, it could spread to thousands of descendants, and then
              jump to other breeds whenever breeders crossed them. Knowing how breeds are related,
              and which ones were crossed, tells scientists <strong>where a disease came from,
              which breeds might be carrying it unnoticed, and which dogs to test first</strong>.
            </Lv>
          </p>
        </header>

        <section className="pairs-section hl-why" aria-labelledby="why-h">
          <h2 id="why-h">Three reasons this research matters</h2>
          <ol className="hl-reasons">
            <li>
              <Lv
                puppy={<><strong>Breeds stay in their own family.</strong> Purebred dogs only have puppies with dogs of the same breed, so a harmful change doesn&rsquo;t fade away. That&rsquo;s why some breeds get certain diseases, and why in one big study purebreds were 2.7 times more likely than mixed breeds to get two copies of a disease gene.</>}
                pro={<><strong>Breeds are closed gene pools.</strong> Closed studbooks prevent gene flow, so founder alleles are not diluted and recessive variants reach homozygosity. Hence breed-specific Mendelian disorders, and in one large screen purebreds were 2.7× more likely than mixed-breed dogs to be homozygous for a tested disease variant.</>}
              >
                <strong>Breeds are closed gene pools.</strong> Purebred dogs only mate within their
                breed, so a founder&rsquo;s mutation doesn&rsquo;t get diluted. That&rsquo;s why
                specific breeds have specific inherited diseases, and why purebreds in one large
                study were 2.7 times more likely than mixed breeds to inherit two copies of a disease
                variant.
              </Lv>
            </li>
            <li>
              <Lv
                puppy={<><strong>Shared <Term id="dna">DNA</Term> finds hidden carriers.</strong> When two breeds share long, matching pieces of DNA, they might share the harmful changes inside those pieces too. The study used this to solve mysteries and guess which breeds should be tested next.</>}
                pro={<><strong>Shared <Term id="haplotype">haplotypes</Term> predict hidden carriers.</strong> Breeds sharing long IBD segments may also share the variants embedded in them. The study used this to explain anomalous occurrences and to prioritize untested breeds for screening.</>}
              >
                <strong>Shared <Term id="dna">DNA</Term> reveals hidden carriers.</strong> When two breeds share long,
                identical stretches of DNA, they may also share the mutations sitting inside those
                stretches. The study used this to explain puzzling cases and to predict breeds that
                should be tested next.
              </Lv>
            </li>
            <li>
              <Lv
                puppy={<><strong>Dog diseases help us understand people diseases.</strong> Dogs get lots of the same sicknesses as people, like cancer and eye problems. Because each breed&rsquo;s DNA is so simple, it&rsquo;s easier to find the gene that causes a disease. This study was done by scientists at a U.S. government lab that studies human genes.</>}
                pro={<><strong>Comparative genomics.</strong> Dogs share many diseases with humans (cancers, retinal dystrophies, neurodegeneration), and the extended linkage disequilibrium and reduced heterogeneity within breeds make causal loci far easier to map. The study came from the Cancer Genetics and Comparative Genomics Branch of the NHGRI.</>}
              >
                <strong>Dog diseases teach us about human ones.</strong> Dogs get many of the same
                illnesses as people (cancers, eye diseases, nerve disorders), and a breed&rsquo;s
                simple genetics makes the responsible gene far easier to find. The study itself
                came from the Cancer Genetics and Comparative Genomics Branch of the U.S. National
                Human Genome Research Institute.
              </Lv>
            </li>
          </ol>
        </section>

        <section className="pairs-section" aria-labelledby="case-h">
          <h2 id="case-h">The study&rsquo;s detective work</h2>
          <p>
            <Lv
              puppy="The study followed two harmful DNA changes from British herding dogs into some surprising breeds. Dogs that carry them light up on the family tree. The curves show which breeds share long pieces of DNA with them."
              pro="The article traces two variants from British herding breeds into unexpected breeds. Carrier breeds are highlighted on the tree; edges show above-threshold IBD sharing with them."
            >
              The article traces two mutations from British herding dogs into unexpected breeds.
              Carriers light up on the family tree, and the curves show which breeds share long
              chunks of DNA with them.
            </Lv>
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
              <Cladogram view={view} selected={null} onSelect={noop} compact={phone} />
              <p className="job-tree-cap">
                <Lv
                  puppy={<>Breeds known to carry {v.name.toLowerCase()}, with curves to the breeds they share DNA with.</>}
                  pro={<>Documented carrier breeds for {v.name.toLowerCase()}, with their IBD-sharing edges.</>}
                >
                  Documented carriers of {v.name.toLowerCase()} on the family tree, with their DNA-sharing curves.
                </Lv>
              </p>
            </div>
            <div className="job-info">
              <h3>{v.name}</h3>
              <p className="job-blurb">{v.what}</p>
              <p className="hl-gene">Gene: {v.gene}</p>
              {sel === "cea" && (
                <p className="job-note">
                  <Lv
                    puppy={<><B c="COLL">Collie</B> eye anomaly is a herding-dog disease. The collie, <B c="SSHP">Shetland sheepdog</B>, <B c="BORD">Border collie</B> and <B c="AUSS">Australian shepherd</B> all got the very same broken bit of DNA from one shared ancestor. But it also shows up in the <B c="NSDT">Nova Scotia duck tolling retriever</B>, a hunting dog from Canada. How? The shared DNA solved the mystery: somebody secretly mixed collies or Shetland sheepdogs into the toller, and they brought the problem with them.</>}
                    pro={<><B c="COLL">Collie</B> eye anomaly segregates in the UK herding breeds (collie, <B c="SSHP">Shetland sheepdog</B>, <B c="BORD">Border collie</B>, <B c="AUSS">Australian shepherd</B>) as a single 7.8 kb NHEJ1 deletion identical by descent. Its presence in the <B c="NSDT">Nova Scotia duck tolling retriever</B>, a gun dog, was unexplained until haplotype sharing revealed undocumented collie and/or Shetland sheepdog contribution to the toller, the likely route of introduction.</>}
                  >
                  <B c="COLL">Collie</B> eye anomaly is a herding-dog disease. The collie, <B c="SSHP">Shetland sheepdog</B>, <B c="BORD">Border
                  collie</B> and <B c="AUSS">Australian shepherd</B> all carry the same 7.8 kb deletion, inherited from
                  one shared ancestor. But it also turns up in the <B c="NSDT">Nova Scotia duck tolling
                  retriever</B>, a Canadian gun dog. The DNA-sharing data solved it: collies and/or
                  Shetland sheepdogs were undocumented contributors to the toller, and most likely
                  brought the mutation with them.
                  </Lv>
                </p>
              )}
              {sel === "mdr1" && (
                <p className="job-note">
                  <Lv
                    puppy={<>MDR1 makes some normal medicines dangerous for a dog. Lots of British herding dogs have it, and so do about 1 in 10 <B c="GSD">German shepherds</B>. The study found shared DNA that links German shepherds to those herders through the <B c="AUSS">Australian shepherd</B>, and links the <B c="COOK">chinook</B> to the German shepherd. The <B c="XOLO">Xoloitzcuintli</B> shares DNA with the same dogs, so the scientists guessed it might have MDR1 too, even though nobody had tested it yet.</>}
                    pro={<>The ABCB1 (MDR1) deletion occurs across the UK herding breeds and at ~10% frequency in <B c="GSD">German shepherds</B>. IBD sharing connects the German shepherd to the herding clade via the <B c="AUSS">Australian shepherd</B>, and the <B c="COOK">chinook</B> (~15% carrier frequency) to the German shepherd. The <B c="XOLO">Xoloitzcuintli</B> shares haplotypes with the same carriers, so the authors predicted it as a candidate carrier breed, then untested.</>}
                  >
                  MDR1 makes dogs dangerously sensitive to common drugs. It&rsquo;s found across the
                  UK herding breeds and in about 10% of <B c="GSD">German shepherds</B>. The study found shared DNA
                  linking the German shepherd to those herders through the <B c="AUSS">Australian shepherd</B>, and
                  linking the <B c="COOK">chinook</B> (15% carriers) to the German shepherd. The <B c="XOLO">Xoloitzcuintli</B>{" "}
                  shares DNA with the same carriers, so the authors predicted this rare breed may
                  carry MDR1 too, though it had yet to be tested.
                  </Lv>
                </p>
              )}
              {!caseIds.includes(sel) && v.note && <p className="job-note">{v.note}</p>}
              {caseIds.includes(sel) && v.note && <p className="hl-small">{v.note}</p>}
              <p className="side-h">
                <Lv puppy={<>Breeds known to carry it ({v.carriers.length} in the study)</>} pro={<>Documented carrier breeds ({v.carriers.length} sampled in the study)</>}>
                  Documented carriers ({v.carriers.length} breeds in the study)
                </Lv>
              </p>
              <ul className="hl-chips">
                {v.carriers.map((c) => (
                  <Chip key={c} code={c} />
                ))}
              </ul>
              <p className="side-h">
                <Lv puppy="Share the most DNA with carriers (good ones to test)" pro="Highest IBD sharing with carriers (screening candidates)">
                  Share the most DNA with carriers (worth testing)
                </Lv>
              </p>
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
                <Lv
                  puppy="This doesn’t mean these dogs are sick. Sharing DNA with carriers just makes it more likely. Only a DNA test can tell for sure."
                  pro="Not diagnostic: IBD sharing with carriers raises the prior probability that a breed segregates the variant; only genotyping can confirm, and some candidates may already have tested clear."
                >
                  Not a diagnosis: sharing DNA with carriers raises the chance a breed carries a
                  variant, but only a DNA test can say. Some of these may already have been tested
                  and found clear.
                </Lv>{" "}
                Carrier list:{" "}
                <a href={v.source.url}>{v.source.label}</a>.
              </p>
            </div>
          </div>
        </section>

        <section className="pairs-section" aria-labelledby="matrix-h">
          <h2 id="matrix-h">Old mutations travel far, young ones stay close</h2>
          <p>
            <Lv
              puppy={<>Each row is a disease gene. Each column is a dog family. If a disease only shows up in one or two families, it probably started not long ago in one dog. If it shows up in lots of families that aren&rsquo;t related, it&rsquo;s probably <strong>really old</strong>, older than the breeds! Click a row to see it on the family tree above.</>}
              pro={<>Rows are characterized disease variants; columns are clades. A variant restricted to one or two clades most likely arose recently in a founder and spread by limited admixture; one distributed across many unrelated clades most likely <strong>predates breed formation</strong>, segregating in the ancestral dog population. Select a row to map it on the tree above.</>}
            >
            Each row is a known disease variant; each column is a family group from the family
            tree. A variant confined to one or two families probably arose recently in a founder
            and spread through a few crosses. A variant found across many unrelated families
            is probably <strong>ancient</strong>, older than the breeds themselves, carried by
            the general dog population long before breeds were split apart. Click a row to see it
            on the family tree above.
            </Lv>
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
            {VARIANTS.map((v0) => atLevel(v0, level)).map((x) => (
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
            <Lv
              puppy={<>In the biggest study (more than 100,000 dogs), about <strong>2 out of every 5 dogs</strong> carried at least one copy of a disease gene. Mixed-breed dogs had the same common ones as purebreds, because those genes are very old. But mixed breeds were less likely to get two copies, which is usually what it takes to get sick.</>}
              pro={<>In the largest open genotyping study (&gt;100,000 dogs), about <strong>40% of dogs</strong> carried at least one tested disease allele. The most frequent alleles in mixed-breed dogs matched those in purebreds, consistent with old variants distributed across many breed groups, but mixed-breed dogs were less often homozygous, the genotype typically required for recessive disease.</>}
            >
            In the largest open study (over 100,000 dogs), about <strong>2 in 5 dogs</strong>{" "}
            carried at least one copy of a tested disease variant. The most common variants in
            mixed breeds were the same as in purebreds: old mutations already shared by many breed
            groups. Mixed breeds were less likely to inherit two copies, which is usually what it
            takes to get sick.
            </Lv>
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
                <p>{level === "puppy" ? s.puppy : level === "pro" ? s.pro : s.what}</p>
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
            <Lv
              puppy="This page is for learning, not for vet advice. If you’re worried about a dog, talk to a veterinarian."
              pro="For education, not veterinary advice. Carrier lists are restricted to breeds sampled in Parker et al. 2017 and are not exhaustive; many breeds have not been screened for every variant. Testing decisions for an individual dog belong with a veterinarian."
            >
            For learning, not veterinary advice. Carrier lists are limited to breeds sampled in
            Parker et&nbsp;al. 2017 and aren&rsquo;t exhaustive; many breeds have never been
            tested for every variant. Talk to a veterinarian about testing a specific dog.
            </Lv>{" "}
            Photos: Dog CEO API.
          </p>
        </footer>
      </main>
    </>
  );
}
