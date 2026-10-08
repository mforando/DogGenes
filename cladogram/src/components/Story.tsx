"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Cladogram from "./Cladogram";
import { STEPS } from "@/lib/steps";
import { data, ringOrder } from "@/lib/tree";
import { CLADE_COLOR, cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { CITATION, SiteNav, Specimens, useActiveStep } from "./shared";
import Primer from "./Primer";
import LineageTree from "./LineageTree";
import Timeline from "./Timeline";
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
  const sel = step.view.explore ? selected : null;
  const showLineage = treeOnly && !!sel;
  // Keep the timeline's last state while it fades out into the cladogram.
  const lastTimeline = STEPS.filter((s) => s.timeline).at(-1)!.timeline!;

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
          <p className="eyebrow">A beginner’s guide to dog DNA, from Ice Age wolves to modern breeds</p>
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
          <div className={`figure-stage${showLineage ? " lineage-on" : ""}${step.timeline ? " timeline-on" : ""}`}>
            <div className="stage-circle" aria-hidden={showLineage}>
              <Cladogram view={step.view} selected={sel} onSelect={setSelected} />
            </div>
            <div className="stage-timeline" aria-hidden={!step.timeline}>
              <Timeline view={step.timeline ?? lastTimeline} />
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
              ref={stepRef(i)}
              data-index={i}
              className={`step${i === active ? " is-active" : ""}`}
              aria-labelledby={`h-${s.id}`}
            >
              <div className="card">
                <p className="kicker">{s.kicker}</p>
                <h2 id={`h-${s.id}`}>{s.title}</h2>
                {s.body}
                {s.photos && <Specimens codes={s.photos} />}
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
            et&nbsp;al. in 2017. The prologue&rsquo;s deep history comes from Wikipedia&rsquo;s{" "}
            <a href="https://en.wikipedia.org/wiki/Domestication_of_the_dog">Domestication of
            the dog</a> article (CC BY-SA). As in their chart, dogs of the same breed that cluster
            together are drawn as one wedge. When a breed is split up, only its biggest piece
            gets a label (hover over the others to see what they are). We picked our own
            colors. Dog photos for the {Object.keys(PHOTOS).length} breeds it covers come from
            the free <a href="https://dog.ceo/dog-api/">Dog CEO API</a>.
          </p>
          <p className="next-page">
            Up next: the same breeds, drawn as a web of shared DNA.{" "}
            <Link href="/circos/guide">Learn to read the circle chart →</Link>
          </p>
        </footer>
      </section>
    </>
  );
}
