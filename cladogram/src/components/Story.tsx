"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import { STEPS } from "@/lib/steps";
import { data, ringOrder } from "@/lib/tree";
import { CLADE_COLOR, cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { CITATION, SiteNav, Specimens, useActiveStep } from "./shared";
import Primer from "./Primer";
import LineageTree from "./LineageTree";
import Circos from "./Circos";
import CircosReplica from "./CircosReplica";
import RelatedBreeds from "./RelatedBreeds";

const breedOptions = Object.entries(data.breeds)
  .filter(([c]) => c !== "GDJK" && c !== "WOLF")
  .map(([code, b]) => ({ code, name: b.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Story() {
  const { active, stepRef } = useActiveStep();
  const [selected, setSelected] = useState<string | null>(null);
  const [treeOnly, setTreeOnly] = useState(false);

  const step = STEPS[active];
  // Selection only applies while exploring.
  // Hovering a breed photo in a step card highlights that breed in the chart on the right.
  const [photoHover, setPhotoHover] = useState<string | null>(null);
  useEffect(() => setPhotoHover(null), [active]);
  const sel = photoHover && !step.circos ? photoHover : step.view.explore ? selected : null;
  // While a photo is hovered, the step's own highlights step aside so only that breed shows.
  const treeView = useMemo(() => {
    if (!photoHover || step.circos) return step.view;
    const { codes, clades, paths, outgroup, split, links, ...rest } = step.view;
    void codes; void clades; void paths; void outgroup; void split;
    return { ...rest, codes: [photoHover], ...(links ? { links: { codes: [photoHover] } } : {}) };
  }, [photoHover, step]);
  const showLineage = treeOnly && !!sel;
  // The chord diagram keeps the nearest chord step's view while it fades in or out.
  const idx = STEPS.indexOf(step);
  const lastCircos =
    STEPS.slice(0, idx + 1).filter((s) => s.circos).at(-1)?.circos ?? STEPS.find((s) => s.circos)!.circos!;

  const cladeGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const code of ringOrder) {
      const b = data.breeds[code];
      const key = b.clade ?? (code === "WOLF" || code === "GDJK" ? "_wild" : "_none");
      const list = groups.get(key) ?? groups.set(key, []).get(key)!;
      if (!list.includes(b.name)) list.push(b.name);
    }
    return [...groups];
  }, []);

  return (
    <>
      <SiteNav />
      <header className="hero">
        <div className="hero-inner">
          <p className="eyebrow">A beginner’s guide to dog DNA</p>
          <h1>
            How to read <em>the dog&rsquo;s</em> family tree
          </h1>
          <p className="dek">
            In 2017, scientists tested the DNA of {data.stats.dogs.toLocaleString("en-US")}{" "}
            dogs from 161 breeds and drew one giant family tree showing how they&rsquo;re all
            related. It&rsquo;s gorgeous, and very easy to misread. Scroll down and
            we&rsquo;ll walk through it one step at a time. No science background needed.
          </p>
          <p className="cite">{CITATION}</p>
          <div className="scroll-cue" aria-hidden>
            <span>scroll</span>
          </div>
        </div>
      </header>

      <Primer
        terms={["dna", "cladogram", "clade", "bootstrap", "haplotype"]}
        intro={
          <p>
            The chart uses a few science words. Here&rsquo;s what they mean in plain
            English. You can come back here anytime.
          </p>
        }
      />

      <main className="scrolly">
        <div className="figure" aria-live="polite">
          <div className="figure-meta">
            <span className="counter">
              {String(active + 1).padStart(2, "0")}
              <span> / {STEPS.length}</span>
            </span>
            <span className="figure-title">{step.title}</span>
          </div>
          <div className={`figure-stage${showLineage ? " lineage-on" : ""}${step.circos ? " circos-on" : ""}`}>
            <div className="stage-circle" aria-hidden={showLineage}>
              <Cladogram view={treeView} selected={sel} onSelect={setSelected} />
            </div>
            <div className="stage-circos" aria-hidden={!step.circos}>
              <Circos view={step.circos ?? lastCircos} spotlight={step.circos ? photoHover : null} ariaLabel="Chord diagram of DNA shared between dog breeds from different family groups" />
            </div>
            {showLineage && sel && (
              <div className="stage-lineage">
                <LineageTree code={sel} onSelect={setSelected} />
              </div>
            )}
          </div>
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
                {s.body}
                {s.photos && <Specimens codes={s.photos} onHover={i === active ? setPhotoHover : undefined} />}
                {s.view.explore && (
                  <div className="explore">
                    <label htmlFor="breed-search">Find a breed</label>
                    <select
                      id="breed-search"
                      value={selected ?? ""}
                      onChange={(e) => setSelected(e.target.value || null)}
                    >
                      <option value="">Choose a breed…</option>
                      {breedOptions.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {selected && (
                      <p className="sel-note">
                        <i style={{ background: cladeColor(data.breeds[selected].clade, selected) }} />
                        <strong>{data.breeds[selected].name}</strong>
                        {" · "}
                        {data.breeds[selected].clade ? data.clades[data.breeds[selected].clade!] : "Loner (no clear family)"}
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(null);
                            setTreeOnly(false);
                          }}
                        >
                          Clear
                        </button>
                      </p>
                    )}
                    {selected &&
                      (PHOTOS[selected] ? (
                        <Specimens codes={[selected]} all />
                      ) : (
                        <p className="no-photo">Sorry, we don’t have photos of this breed.</p>
                      ))}
                    {selected && (
                      <button
                        type="button"
                        className="lineage-toggle"
                        aria-pressed={treeOnly}
                        onClick={() => setTreeOnly((t) => !t)}
                      >
                        {treeOnly ? "← Back to the full circle" : "Show just its family line →"}
                      </button>
                    )}
                    {selected && <RelatedBreeds code={selected} onSelect={setSelected} />}
                  </div>
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
                <p>{names.join(", ")}</p>
              </div>
            ))}
          </div>
        </details>
        <footer>
          <p>
            Where this comes from: the family tree and DNA-sharing data published by Parker
            et&nbsp;al. in 2017. As in their chart, dogs of the same breed that cluster
            together are drawn as one wedge. When a breed is split up, only its biggest piece
            gets a label (hover over the others to see what they are). We picked our own
            colors. Dog photos for the {Object.keys(PHOTOS).length} breeds it covers come from
            the free <a href="https://dog.ceo/dog-api/">Dog CEO API</a>.
          </p>
          <p className="next-page">
            Up next: which breeds share the most DNA.{" "}
            <Link href="/pairs">See the breed pairs →</Link>
          </p>
        </footer>
      </section>
    </>
  );
}
