"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { breedPath, hasBreedPage } from "@/lib/breedLinks";
import Cladogram from "./Cladogram";
import { STEPS, STEP_ALIASES } from "@/lib/steps";
import { data, ringOrder } from "@/lib/tree";
import { CLADE_COLOR, cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { CITATION, PHONE, RotateHint, SiteNav, Specimens, useActiveStep, useMedia } from "./shared";
import Primer, { type TermId } from "./Primer";
import GlossaryButton from "./GlossaryButton";
import DnaHelix from "./DnaHelix";
import { HintProvider } from "./Hints";
import { Lv, useReadingLevel } from "@/lib/readingLevel";
import { LEVEL_BODIES } from "@/lib/levels";
import Circos from "./Circos";
import CircosReplica from "./CircosReplica";
import ContinentGlobe from "./ContinentGlobe";
import { CONTINENT_BREEDS, type Continent } from "@/lib/regions";

const GLOSSARY: TermId[] = ["dna", "cladogram", "clade", "bootstrap", "haplotype"];
// The "?" shows from the glossary section through the end of the scroller.
const GLOSSARY_WATCH = [".primer", "main.scrolly"];

export default function Story() {
  return <StoryBody />;
}

function StoryBody() {
  const { level } = useReadingLevel();
  const { active, stepRef } = useActiveStep();

  const step = STEPS[active];
  // Hovering a breed photo in a step card highlights that breed in the chart on the right.
  const [photoHover, setPhotoHover] = useState<string | null>(null);
  // Picking a continent on the step's globe highlights that continent's breeds instead.
  const [continent, setContinent] = useState<Continent | null>(null);
  // Hovering a dot on the step's globe highlights that breed on the circle chart.
  const [globeHover, setGlobeHover] = useState<string | null>(null);
  // ...and hovering a wedge on the circle chart spins the globe to that breed's origin.
  const [treeHover, setTreeHover] = useState<string | null>(null);
  // Hovering a breed's name or a family's name in the text highlights it on the chart too.
  const [textBreed, setTextBreed] = useState<string | null>(null);
  const [textClade, setTextClade] = useState<string | null>(null);
  const tipDock = useRef<HTMLElement>(null);
  // Phones: the charts are cropped to their rings (names would be a few pixels tall), so the
  // breeds or families a step highlights are listed under the chart instead.
  const phone = useMedia(PHONE);
  useEffect(() => {
    setPhotoHover(null);
    setContinent(null);
    setGlobeHover(null);
    setTreeHover(null);
    setTextBreed(null);
    setTextClade(null);
  }, [active]);
  // A step with a delayed spin ("neighbors aren't necessarily family") shows the plain view
  // first, then rotates the fork once the reader has had a moment to see where the breeds sit.
  const [flipOn, setFlipOn] = useState(false);
  useEffect(() => {
    setFlipOn(false);
    if (!step.flipDelay) return;
    const t = setTimeout(() => setFlipOn(true), step.flipDelay);
    return () => clearTimeout(t);
  }, [step]);
  // Links to steps that were merged into others (/tree/#rotate) land on the step that holds them now.
  useEffect(() => {
    const go = () => {
      const to = STEP_ALIASES[decodeURIComponent(window.location.hash.slice(1))];
      if (!to) return;
      history.replaceState(null, "", `#${to}`);
      document.getElementById(to)?.scrollIntoView();
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  const pointed = photoHover ?? textBreed ?? (step.continentGlobe ? globeHover : null);
  const sel = pointed && !step.circos ? pointed : null;
  // While a photo is hovered, the step's own highlights step aside so only that breed shows.
  const treeView = useMemo(() => {
    const view = step.flipDelay && !flipOn ? { ...step.view, flip: undefined } : step.view;
    if (textClade && !pointed && !step.circos) {
      const { codes, clades, paths, outgroup, split, links, ...rest } = view;
      void codes; void clades; void paths; void outgroup; void split; void links;
      return { ...rest, color: "clade" as const, clades: [textClade] };
    }
    const focus = pointed ? [pointed] : step.continentGlobe && continent ? CONTINENT_BREEDS[continent] : null;
    if (!focus || step.circos) return view;
    const { codes, clades, paths, outgroup, split, links, ...rest } = view;
    void codes; void clades; void paths; void outgroup; void split;
    return { ...rest, codes: focus, ...(links ? { links: { codes: focus } } : {}) };
  }, [pointed, continent, step, textClade, flipOn]);
  // The chord diagram keeps the nearest chord step's view while it fades in or out.
  const idx = STEPS.indexOf(step);
  const lastCircos =
    STEPS.slice(0, idx + 1).filter((s) => s.circos).at(-1)?.circos ?? STEPS.find((s) => s.circos)!.circos!;

  const chips = useMemo(() => {
    const c = step.circos;
    const codes = c
      ? c.focus ?? (typeof c.ribbons === "object" && "codes" in c.ribbons ? c.ribbons.codes : [])
      : treeView.outgroup
        ? ["GDJK", "WOLF", ...(treeView.codes ?? [])]
        : treeView.codes ?? [];
    const clades = (c ? c.clades : treeView.clades) ?? [];
    const names = new Map<string, string>();
    for (const cl of clades) names.set(data.clades[cl], CLADE_COLOR[cl]);
    for (const code of codes) {
      const b = data.breeds[code];
      if (b) names.set(b.name, cladeColor(b.clade, code));
    }
    const all = [...names];
    return { shown: all.slice(0, 6), more: Math.max(0, all.length - 6) };
  }, [step, treeView]);

  const cladeGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const code of ringOrder) {
      const b = data.breeds[code];
      const key = b.clade ?? (code === "WOLF" || code === "GDJK" ? "_wild" : "_none");
      const list = groups.get(key) ?? groups.set(key, []).get(key)!;
      if (!list.includes(code)) list.push(code);
    }
    return [...groups];
  }, []);

  return (
    <HintProvider onBreed={setTextBreed} onClade={setTextClade}>
      <SiteNav />
      <header className="hero">
        <DnaHelix />
        <div className="hero-inner">
          <p className="eyebrow">The dog breed family tree · a beginner’s guide to dog DNA</p>
          <h1>
            How to read <em>the dog&rsquo;s</em> family tree
          </h1>
          <p className="dek">
            <Lv
              puppy={<>In 2017, scientists checked the DNA of {data.stats.dogs.toLocaleString("en-US")} dogs from 161 breeds. Then they drew one giant family tree of all the breeds. It&rsquo;s tricky to read, so we&rsquo;ll go step by step.</>}
              pro={<>Parker et&nbsp;al. (2017) genotyped {data.stats.dogs.toLocaleString("en-US")} dogs from 161 breeds at ~150,000 SNPs and inferred a bootstrapped neighbor-joining phylogeny, then quantified pairwise haplotype sharing to detect recent admixture. Scroll for a step-by-step reading of the tree and the sharing network.</>}
            >
              In 2017, scientists analyzed the DNA of {data.stats.dogs.toLocaleString("en-US")} dogs
              from 161 breeds and drew a single family tree showing how the breeds are related. It
              is elegant, and easy to misread. Here is how to read it, one step at a time. No
              science background needed.
            </Lv>
          </p>
          <p className="cite">{CITATION}</p>
          <RotateHint />
          <div className="scroll-cue" aria-hidden>
            <span>scroll</span>
          </div>
        </div>
      </header>

      <Primer
        terms={GLOSSARY}
        intro={
          <p>
            <Lv
              puppy="Here are a few science words you’ll see. Tap any underlined word to see what it means."
              pro="Key terms as used in the study. Each card has a schematic; the ? button reopens them anytime."
            >
              A few terms come up often. Hover over or tap any underlined word to see its
              definition again.
            </Lv>
          </p>
        }
      />

      <GlossaryButton terms={GLOSSARY} watch={GLOSSARY_WATCH} />
      <main className="scrolly">
        <div className="figure" aria-live="polite">
          <div className="figure-meta">
            <span className="counter">
              {String(active + 1).padStart(2, "0")}
              <span> / {STEPS.length}</span>
            </span>
            <span className="figure-title">{step.title}</span>
          </div>
          <div className={`figure-stage docked${step.circos ? " circos-on" : ""}`}>
            <div className="stage-chart">
              <div className="stage-circle">
                <Cladogram view={treeView} selected={sel} onSelect={() => {}} onHover={step.continentGlobe ? setTreeHover : undefined} tipDock={tipDock} compact={phone} />
              </div>
              <div className="stage-circos" aria-hidden={!step.circos}>
                <Circos view={step.circos ?? lastCircos} spotlight={step.circos ? photoHover ?? textBreed : null} ariaLabel="Chord diagram of DNA shared between dog breeds from different family groups" tipDock={tipDock} compact={phone} />
              </div>
            </div>
            {/* Chart tooltips show here, in a fixed panel, instead of following the pointer. */}
            <aside ref={tipDock} className="tip-dock" aria-live="polite">
              <p className="tip-dock-empty">Hover over or tap a breed on the chart to see its photo, family and history here.</p>
            </aside>
          </div>
          {phone && chips.shown.length > 0 && (
            <ul className="hi-chips" aria-label="Highlighted on the chart">
              {chips.shown.map(([name, color]) => (
                <li key={name}>
                  <i style={{ background: color }} />
                  {name}
                </li>
              ))}
              {chips.more > 0 && <li className="more">+{chips.more} more</li>}
            </ul>
          )}
        </div>

        <div className="steps">
          {STEPS.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              ref={stepRef(i)}
              data-index={i}
              className={`step${i === active ? " is-active" : ""}`}
              aria-labelledby={`h-${s.id}`}
            >
              <div className="card">
                <p className="kicker">{s.kicker}</p>
                <h2 id={`h-${s.id}`}>{s.title}</h2>
                {level === "adult" ? s.body : LEVEL_BODIES[s.id]?.[level] ?? s.body}
                {s.photos && <Specimens codes={s.photos} onHover={i === active ? setPhotoHover : undefined} />}
                {s.continentGlobe && (
                  <ContinentGlobe
                    continent={i === active ? continent : null}
                    onPick={i === active ? setContinent : undefined}
                    spotlight={i === active ? photoHover ?? textBreed ?? treeHover : null}
                    onHoverBreed={i === active ? setGlobeHover : undefined}
                  />
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <CircosReplica embedded />

      <section className="appendix" aria-labelledby="table-h">
        <details>
          <summary id="table-h">See every breed, grouped by family</summary>
          <div className="clade-table">
            {cladeGroups.map(([key, names]) => (
              <div key={key} className="clade-col">
                <h3>
                  <i
                    style={{
                      background: key.startsWith("_") ? cladeColor(null, key === "_wild" ? "WOLF" : "") : CLADE_COLOR[key],
                    }}
                  />
                  {key === "_wild" ? "Wild relatives" : key === "_none" ? "Loners (no clear family)" : data.clades[key]}
                </h3>
                <p>
                  {names.map((c, j) => (
                    <Fragment key={c}>
                      {j > 0 && ", "}
                      {hasBreedPage(c) ? <Link href={breedPath(c)}>{data.breeds[c].name}</Link> : data.breeds[c].name}
                    </Fragment>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </details>
        <footer>
          <p>
            <Lv
              puppy={<>Where this comes from: the family tree and shared-DNA data from a 2017 study by Parker and other scientists. Dogs of the same breed that group together are drawn as one wedge. We picked the colors ourselves.</>}
              pro={<>Data: the neighbor-joining tree and pairwise IBD-sharing matrix from Parker et&nbsp;al. 2017. Following their figure, monophyletic groups of conspecific breed samples are collapsed to one wedge; for polyphyletic breeds only the largest fragment is labeled. Allele-sharing (IBS) distances were preferred over frequency-based statistics because the CanineHD SNPs were ascertained largely in the boxer, inflating its minor allele frequencies (MAF 0.351 versus 0.260 overall). The palette is ours.</>}
            >
            Where this comes from: the family tree and DNA-sharing data published by Parker
            et&nbsp;al. in 2017. As in their chart, dogs of one breed that cluster together are
            drawn as a single wedge; when a breed is split, only its largest piece is labeled. Colors
            are ours.
            </Lv> Dog photos for the {Object.keys(PHOTOS).length} breeds it covers come from
            the free <a href="https://dog.ceo/dog-api/">Dog CEO API</a>.
          </p>
          <p className="next-page">
            Up next: what each breed was bred to do.{" "}
            <Link href="/purpose">See Bred for purpose →</Link>
          </p>
        </footer>
      </section>
    </HintProvider>
  );
}
