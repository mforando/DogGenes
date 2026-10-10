"use client";

import Link from "next/link";
import Timeline from "./Timeline";
import { CITATION, SiteNav, useActiveStep } from "./shared";
import { HISTORY_STEPS } from "@/lib/steps";

/** The history of dogs: 40,000 years of domestication on a scroll-driven timeline. */
export default function HistoryStory() {
  const { active, stepRef } = useActiveStep();
  const step = HISTORY_STEPS[active];

  return (
    <>
      <SiteNav />
      <header className="hero hero-history">
        <div className="hero-inner">
          <p className="eyebrow">The history of dogs</p>
          <h1>
            From Ice Age wolves to <em>best friends</em>
          </h1>
          <p className="dek">
            Dogs were the first animal people ever tamed, long before farming, cities or
            writing. Scroll through 40,000 years of history: where dogs came from, how a wolf
            becomes a dog, and the oldest dogs ever found.
          </p>
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
              <Timeline view={step.timeline!} />
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
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </main>

      <section className="appendix history-next">
        <Link href="/" className="history-cta">
          <span className="history-cta-kicker">Next</span>
          <span className="history-cta-label">Learn more about the genetic history of dogs →</span>
        </Link>
        <footer>
          <p>
            Source: Wikipedia&rsquo;s{" "}
            <a href="https://en.wikipedia.org/wiki/Domestication_of_the_dog">Domestication of the dog</a>{" "}
            article (CC BY-SA), with modern breed ages from {CITATION}
          </p>
        </footer>
      </section>
    </>
  );
}
