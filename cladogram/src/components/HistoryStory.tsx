"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FaceMorph from "./FaceMorph";
import { HintProvider } from "./Hints";
import Timeline from "./Timeline";
import { CITATION, RotateHint, SiteNav, useActiveStep } from "./shared";
import { HISTORY_STEPS, STEP_ALIASES } from "@/lib/steps";
import { HISTORY_LEVEL_BODIES } from "@/lib/historyLevels";
import { Lv, useReadingLevel } from "@/lib/readingLevel";

/** The history of dogs: 40,000 years of domestication on a scroll-driven timeline. */
export default function HistoryStory() {
  const { active, stepRef } = useActiveStep();
  const { level } = useReadingLevel();
  // The family tree used to be the home page: send old links to its sections
  // (/#full-chart, /#breed-pairs, /#c-blocks, ...) on to /tree.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    // Steps merged into others (/#where) land on the step that holds their text now.
    const to = STEP_ALIASES[id];
    if (to && document.getElementById(to)) {
      history.replaceState(null, "", `#${to}`);
      document.getElementById(to)!.scrollIntoView();
      return;
    }
    if (id && !document.getElementById(id)) {
      window.location.replace(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/tree/#${id}`);
    }
  }, []);
  const step = HISTORY_STEPS[active];
  // Hovering a breed's name in the text lights up its photo on the timeline.
  const [textBreed, setTextBreed] = useState<string | null>(null);
  useEffect(() => setTextBreed(null), [active]);

  return (
    <HintProvider onBreed={setTextBreed}>
      <SiteNav />
      <header className="hero hero-history">
        <FaceMorph />
        <div className="hero-inner">
          <p className="eyebrow">The history of dogs: where dogs came from</p>
          <h1>
            From Ice Age wolves to <em>best friends</em>
          </h1>
          <p className="dek">
            <Lv
              puppy={
                <>
                  Dogs were the first animals people ever tamed, long before farms or towns. Scroll
                  down to travel back 40,000 years and meet the very first dogs.
                </>
              }
              pro={
                <>
                  The dog was the first domesticate, predating agriculture by millennia. Scroll
                  through 40,000 years: the contested origin, the genomic signatures of
                  domestication and the earliest archaeological evidence.
                </>
              }
            >
              Dogs were the first animal people domesticated, thousands of years before anyone
              planted a crop. Their story begins with a wolf that no longer exists. Scroll back
              through 40,000 years of evidence.
            </Lv>
          </p>
          <RotateHint />
          <div className="scroll-cue" aria-hidden>
            <span>scroll</span>
          </div>
        </div>
      </header>

      <main className="scrolly">
        <div className="figure" aria-live="polite">
          <div className="figure-meta">
            <span className="counter">
              {String(active + 1).padStart(2, "0")}
              <span> / {HISTORY_STEPS.length}</span>
            </span>
            <span className="figure-title">{step.title}</span>
          </div>
          <div className="figure-stage timeline-on">
            <div className="stage-timeline">
              <Timeline view={step.timeline!} spot={textBreed} />
            </div>
          </div>
        </div>

        <div className="steps">
          {HISTORY_STEPS.map((s, i) => (
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
                {level === "adult" ? s.body : HISTORY_LEVEL_BODIES[s.id]?.[level] ?? s.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <section className="appendix history-next">
        <Link href="/tree" className="history-cta">
          <span className="history-cta-kicker">Next</span>
          <span className="history-cta-label">Next: how 161 breeds are related →</span>
        </Link>
        <footer>
          <p>
            Source: Wikipedia&rsquo;s{" "}
            <a href="https://en.wikipedia.org/wiki/Domestication_of_the_dog">Domestication of the dog</a>{" "}
            article (CC BY-SA), with modern breed ages from {CITATION}
          </p>
        </footer>
      </section>
    </HintProvider>
  );
}
