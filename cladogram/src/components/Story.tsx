"use client";

import Link from "next/link";
import { Children, Fragment, isValidElement, useCallback, useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import { breedPath, hasBreedPage } from "@/lib/breedLinks";
import Cladogram from "./Cladogram";
import { STEPS, STEP_ALIASES } from "@/lib/steps";
import { data, ringOrder } from "@/lib/tree";
import { cladeVar } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { CITATION, PHONE, RotateHint, SiteNav, Specimens, useActiveStep, useMedia } from "./shared";
import Primer, { type TermId } from "./Primer";
import GlossaryButton from "./GlossaryButton";
import DnaHelix from "./DnaHelix";
import { B, Clade, HintBody, HintProvider } from "./Hints";
import { Lv, useReadingLevel } from "@/lib/readingLevel";
import { LEVEL_BODIES } from "@/lib/levels";
import Circos, { MORPH_MS, MORPH_OUT_DELAY } from "./Circos";
import CircosReplica from "./CircosReplica";
import ContinentGlobe from "./ContinentGlobe";
import { CONTINENT_BREEDS, type Continent } from "@/lib/regions";
import MotionToggle from "./MotionToggle";
import PawPrint from "./PawPrint";
import { DOCK_CLADE, DOCK_PIN, DOCK_UNPINNED } from "@/lib/dockPin";
import { CladePanel } from "./CircosDetails";
import { hoverGate, STEP_CHANGE } from "@/lib/hoverGate";
import { cladeOf, cladesOf, relatedClades } from "@/lib/ringClades";

const GLOSSARY: TermId[] = ["dna", "cladogram", "clade", "bootstrap", "haplotype"];
// The "?" shows from the glossary section through the end of the scroller.
const GLOSSARY_WATCH = [".primer", "main.scrolly"];

/** The families a step's text highlights: its breed names (their families) and family names. */
function textClades(node: ReactNode, out = new Set<string>()): Set<string> {
  Children.forEach(node, (n) => {
    if (!isValidElement(n)) return;
    const p = n.props as { c?: string; id?: string; children?: ReactNode };
    if (n.type === B && p.c) {
      const k = cladeOf(p.c);
      if (k) out.add(k);
    } else if (n.type === Clade && p.id) out.add(p.id);
    if (p.children) textClades(p.children, out);
  });
  return out;
}

export default function Story() {
  return <StoryBody />;
}

function StoryBody() {
  const { level } = useReadingLevel();
  const { active, stepRef } = useActiveStep();

  const step = STEPS[active];
  // Hovering a breed photo in a step card highlights that breed in the chart on the right.
  const [photoHoverRaw, setPhotoHoverNow] = useState<string | null>(null);
  // Picking a continent on the step's globe highlights that continent's breeds instead.
  const [continent, setContinent] = useState<Continent | null>(null);
  // Hovering a dot on the step's globe highlights that breed on the circle chart.
  const [globeHoverRaw, setGlobeHoverNow] = useState<string | null>(null);
  // ...and hovering a wedge on the circle chart spins the globe to that breed's origin.
  const [treeHover, setTreeHoverNow] = useState<string | null>(null);
  // Sweeping across the circle crosses dozens of breeds a second; spinning the globe (and
  // re-rendering the step) for each one makes the page stutter. Wait until the pointer settles.
  const TREE_HOVER_DELAY = 300;
  const treeHoverTimer = useRef<number | undefined>(undefined);
  const setTreeHover = useCallback((code: string | null) => {
    window.clearTimeout(treeHoverTimer.current);
    treeHoverTimer.current = window.setTimeout(() => setTreeHoverNow(code), TREE_HOVER_DELAY);
  }, []);
  useEffect(() => () => window.clearTimeout(treeHoverTimer.current), []);
  // Hovering a breed's name or a family's name in the text highlights it on the chart too.
  const [textBreedRaw, setTextBreedNow] = useState<string | null>(null);
  const [textCladeRaw, setTextCladeNow] = useState<string | null>(null);
  // Moving to a new step overrides any hover: everything is cleared, and new hovers wait until
  // the pointer really moves (scrolling brings new things under a resting pointer). Clearing
  // (null) always goes through. See hoverGate.ts.
  const gate = useRef(hoverGate()).current;
  const gated = useCallback(
    (set: (v: string | null) => void) => (v: string | null) => {
      if (v !== null && !gate.ok()) return;
      set(v);
    },
    [gate],
  );
  const setPhotoHover = useMemo(() => gated(setPhotoHoverNow), [gated]);
  const setGlobeHover = useMemo(() => gated(setGlobeHoverNow), [gated]);
  const setTextBreed = useMemo(() => gated(setTextBreedNow), [gated]);
  const setTextClade = useMemo(() => gated(setTextCladeNow), [gated]);
  const tipDock = useRef<HTMLElement>(null);
  // Click to pin: a breed or family name clicked in the text keeps its card in the side panel
  // (textPin); a breed clicked on a chart does the same from inside the chart (chartPinned).
  // While anything is pinned, other hovers leave the panel and the chart alone. See dockPin.ts.
  const [textPin, setTextPin] = useState<{ kind: "breed" | "clade"; id: string } | null>(null);
  const [chartPinned, setChartPinned] = useState(false);
  // A family hovered (or pinned) on either circle: its full "Family group" panel (desktop).
  const [chartClade, setChartClade] = useState<{ clade: string; pinned: boolean } | null>(null);
  const frozen = chartPinned || !!textPin;
  const photoHover = frozen ? null : photoHoverRaw;
  const globeHover = frozen ? null : globeHoverRaw;
  // A breed or family name hovered in the text always wins, even over a pin, so the reader can
  // flick between the text and their selection; leaving the name hands back to the pin.
  const textHover = !!(textBreedRaw || textCladeRaw);
  const textBreed = textHover ? textBreedRaw : textPin?.kind === "breed" ? textPin.id : null;
  const textClade = textHover ? (textBreedRaw ? null : textCladeRaw) : textPin?.kind === "clade" ? textPin.id : null;
  // Phones: the charts are cropped to their rings (names would be a few pixels tall), so the
  // breeds or families a step highlights are listed under the chart instead.
  const phone = useMedia(PHONE);
  useEffect(() => {
    setPhotoHover(null);
    setContinent(null);
    setGlobeHover(null);
    window.clearTimeout(treeHoverTimer.current); // a new step drops any hover at once
    setTreeHoverNow(null);
    setTextBreed(null);
    setTextClade(null);
    setTextPin(null);
    setChartClade(null);
    gate.lock();
    tipDock.current?.dispatchEvent(new CustomEvent(STEP_CHANGE)); // the charts clear their own hovers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
  // Pinning a name in the text tells the charts to let go of theirs, and the other way round.
  useEffect(() => {
    const dock = tipDock.current;
    if (!dock) return;
    const onPin = (e: Event) => {
      if ((e as CustomEvent).detail === "text") return;
      setTextPin(null);
      setChartPinned(true);
    };
    const onUnpinned = () => setChartPinned(false);
    const onClade = (e: Event) => setChartClade((e as CustomEvent<{ clade: string; pinned: boolean } | null>).detail);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTextPin(null);
    dock.addEventListener(DOCK_PIN, onPin);
    dock.addEventListener(DOCK_UNPINNED, onUnpinned);
    dock.addEventListener(DOCK_CLADE, onClade);
    window.addEventListener("keydown", onKey);
    return () => {
      dock.removeEventListener(DOCK_PIN, onPin);
      dock.removeEventListener(DOCK_UNPINNED, onUnpinned);
      dock.removeEventListener(DOCK_CLADE, onClade);
      window.removeEventListener("keydown", onKey);
    };
  }, []);
  useEffect(() => {
    const dock = tipDock.current;
    if (!dock) return;
    dock.scrollTop = 0; // a newly pinned card, or the next hovered one, starts at its top
    if (!textPin) return;
    dock.dispatchEvent(new CustomEvent(DOCK_PIN, { detail: "text" }));
  }, [textPin]);
  const pinText = (kind: "breed" | "term" | "clade", id: string) => {
    // A selection clicked on the circle plot only ends by a click on the plot or Esc; names in
    // the text still preview over it while hovered, but a click on one doesn't replace it.
    if (phone || kind === "term" || chartPinned) return;
    setTextPin((p) => (p && p.kind === kind && p.id === id ? null : { kind, id }));
  };
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
  // Desktop: whatever breed the reader points at in the step (a word, a photo, a globe dot)
  // pops out in the panel on the right, the same way; a family named in the text does too.
  const dockBreed = phone ? null : textBreed ?? photoHover ?? (step.continentGlobe ? globeHover : null);
  const dockClade = phone || dockBreed ? null : textClade;
  const sel = pointed && !step.circos ? pointed : null;
  // The family ring brings forward the families the step's text highlights (at the reader's
  // level, plus any the step's view emphasises); steps that name none show the whole ring.
  const stepClades = useMemo(() => {
    const body = level === "adult" ? step.body : LEVEL_BODIES[step.id]?.[level] ?? step.body;
    const set = textClades(body);
    for (const c of step.view.clades ?? []) set.add(c);
    for (const c of step.circos?.clades ?? []) set.add(c);
    return set.size ? [...set] : undefined;
  }, [step, level]);
  // While a photo is hovered, the step's own highlights step aside so only that breed shows.
  const treeView = useMemo(() => {
    const base = step.flipDelay && !flipOn ? { ...step.view, flip: undefined } : step.view;
    const view = { ...base, ring: stepClades };
    if (textClade && !pointed && !step.circos) {
      const { codes, clades, paths, outgroup, split, links, ...rest } = view;
      void codes; void clades; void paths; void outgroup; void split; void links;
      return { ...rest, color: "clade" as const, clades: [textClade], ring: [textClade] };
    }
    const focus = pointed ? [pointed] : step.continentGlobe && continent ? CONTINENT_BREEDS[continent] : null;
    if (!focus || step.circos) return view;
    const { codes, clades, paths, outgroup, split, links, ...rest } = view;
    void codes; void clades; void paths; void outgroup; void split;
    return {
      ...rest,
      codes: focus,
      ...(links ? { links: { codes: focus } } : {}),
      ring: pointed ? relatedClades(pointed) : cladesOf(focus),
    };
  }, [pointed, continent, step, textClade, flipOn, stepClades]);
  // The chord diagram keeps the nearest chord step's view while it fades in or out.
  const idx = STEPS.indexOf(step);
  const lastCircos =
    STEPS.slice(0, idx + 1).filter((s) => s.circos).at(-1)?.circos ?? STEPS.find((s) => s.circos)!.circos!;
  // The tree step next to the chords (the one just left, or the one being entered), whose
  // layout the chords glide from and back to.
  const lastTree = useRef(step.circos ? STEPS.find((s) => !s.circos)! : step);
  if (!step.circos) lastTree.current = step;
  // The chords stay on screen while the ring glides back to the tree's layout, then hand over.
  const [circosOn, setCircosOn] = useState(!!step.circos);
  useEffect(() => {
    if (step.circos) {
      setCircosOn(true);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setCircosOn(false), reduce ? 0 : MORPH_OUT_DELAY + MORPH_MS);
    return () => window.clearTimeout(t);
  }, [step]);
  // A stable object, so the chord diagram only restyles when the step (or its families) change.
  const circosView = useMemo(() => (step.circos ? { ...step.circos, ring: stepClades } : lastCircos), [step, stepClades, lastCircos]);

  const chips = useMemo(() => {
    const c = step.circos;
    const codes = c
      ? c.focus ?? (typeof c.ribbons === "object" && "codes" in c.ribbons ? c.ribbons.codes : [])
      : treeView.outgroup
        ? ["GDJK", "WOLF", ...(treeView.codes ?? [])]
        : treeView.codes ?? [];
    const clades = (c ? c.clades : treeView.clades) ?? [];
    const names = new Map<string, string>();
    for (const cl of clades) names.set(data.clades[cl], cladeVar(cl));
    for (const code of codes) {
      const b = data.breeds[code];
      if (b) names.set(b.name, cladeVar(b.clade, code));
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
    <HintProvider onBreed={setTextBreed} onClade={setTextClade} onPin={pinText} allowHover={gate.ok} docked={phone ? [] : ["breed", "clade"]}>
      {/* Desktop: a breed or family named in the text pops out in the panel on the right; phones keep the small pop-up. */}
      <SiteNav />
      <header className="hero">
        <DnaHelix />
        <div className="hero-inner">
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
        <MotionToggle />
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
        <div className="figure">
          {/* Screen readers hear one short line per step; the charts themselves aren't live regions. */}
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {`Step ${active + 1} of ${STEPS.length}: ${step.title}.`}
          </p>
          <div className="figure-meta">
            <span className="counter">
              {String(active + 1).padStart(2, "0")}
              <span> / {STEPS.length}</span>
            </span>
            <span className="figure-title">{step.title}</span>
          </div>
          <div className={`figure-stage docked${circosOn ? " circos-on" : ""}`}>
            <div className="stage-chart">
              <div className="stage-circle" aria-hidden={!!step.circos} inert={!!step.circos}>
                <Cladogram view={treeView} selected={sel} textFocus={textHover} onSelect={() => {}} onHover={step.continentGlobe ? setTreeHover : undefined} tipDock={tipDock} compact={phone} />
              </div>
              <div className="stage-circos" aria-hidden={!step.circos} inert={!step.circos}>
                <Circos view={circosView} shown={!!step.circos} treeAncestor={!!lastTree.current.view.ancestor} spotlight={step.circos ? photoHover ?? textBreed : null} ariaLabel="Chord diagram of DNA shared between dog breeds from different family groups" tipDock={tipDock} compact={phone} />
              </div>
            </div>
            {/* Chart tooltips show here, in a fixed panel, instead of following the pointer. */}
            <aside ref={tipDock} className="tip-dock" data-pinned={textPin ? "text" : undefined} data-text-hover={textHover || undefined} aria-live="polite" aria-label="Chart details">
              <p className="tip-dock-empty">
                Hover over or tap a breed on the chart to see its photo, family and history here. Click one to keep it here while
                you scroll its details.
              </p>
              {/* The breed or family named in the text, popped out beside the chart (desktop). */}
              {chartClade && !phone && !textHover ? (
                <div key={`clade-${chartClade.clade}`} className="tip on dock-hint dock-clade">
                  <CladePanel clade={chartClade.clade} />
                </div>
              ) : (dockBreed || dockClade) && (
                <div key={dockBreed ?? dockClade!} className="tip on dock-hint">
                  <HintBody kind={dockBreed ? "breed" : "clade"} id={(dockBreed ?? dockClade)!} docked />
                </div>
              )}
            </aside>
          </div>
          {/* Always there on phones (empty when nothing is highlighted), at a fixed height, so
              the chart keeps the same size and place from step to step. */}
          {phone && (
            <ul className="hi-chips" aria-label="Highlighted on the chart" aria-hidden={chips.shown.length === 0 || undefined}>
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
                <p className="kicker">
                  <PawPrint className="step-paw" />
                  {s.kicker}
                  <PawPrint className="step-paw step-paw-end" />
                </p>
                <h2 id={`h-${s.id}`}>{s.title}</h2>
                {level === "adult" ? s.body : LEVEL_BODIES[s.id]?.[level] ?? s.body}
                {s.photos && <Specimens codes={s.photos} onHover={i === active ? setPhotoHover : undefined} />}
                {s.continentGlobe && (
                  <ContinentGlobe
                    continent={i === active ? continent : null}
                    onPick={i === active ? setContinent : undefined}
                    spotlight={i === active ? photoHover ?? textBreed ?? treeHover : null}
                    onHoverBreed={i === active ? setGlobeHover : undefined}
                    quietTip={!phone}
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
                      background: key.startsWith("_") ? cladeVar(null, key === "_wild" ? "WOLF" : "") : cladeVar(key),
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
