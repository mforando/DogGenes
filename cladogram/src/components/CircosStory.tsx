"use client";

import Link from "next/link";
import Circos from "./Circos";
import { CITATION, SiteNav, Specimens, useActiveStep } from "./shared";
import Primer from "./Primer";
import { CIRCOS_STEPS } from "@/lib/circosSteps";
import { links } from "@/lib/circos";

export default function CircosStory() {
  const { active, stepRef } = useActiveStep();
  const step = CIRCOS_STEPS[active];

  return (
    <>
      <SiteNav />
      <header className="hero hero-circos">
        <div className="hero-inner">
          <p className="eyebrow">Part two · The circle chart</p>
          <h1>
            The web <em>beneath</em> the tree
          </h1>
          <p className="dek">
            A family tree can only branch apart. But breeders mix breeds all the time, and
            that mixing leaves big shared chunks of DNA behind. The scientists drew those
            connections as a circle chart (a &ldquo;circos plot&rdquo;) with {links.length}{" "}
            colorful ribbons. Here&rsquo;s how to read it.
          </p>
          <p className="cite">{CITATION}</p>
          <div className="scroll-cue" aria-hidden>
            <span>scroll</span>
          </div>
        </div>
      </header>

      <Primer
        terms={["dna", "haplotype", "clade", "cladogram"]}
        title="Four words you’ll need"
        intro={
          <p>
            New here? These are the key ideas behind the chart. If you read part one, the
            haplotype card is the new one.
          </p>
        }
      />

      <main className="scrolly">
        <div className="figure" aria-live="polite">
          <div className="figure-meta">
            <span className="counter">
              {String(active + 1).padStart(2, "0")}
              <span> / {CIRCOS_STEPS.length}</span>
            </span>
            <span className="figure-title">{step.title}</span>
          </div>
          <Circos view={step.view} />
        </div>

        <div className="steps">
          {CIRCOS_STEPS.map((s, i) => (
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
                {s.view.interactive && (
                  <p className="next-inline">
                    <Link href="/circos">Open the full-size chart →</Link>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <section className="appendix">
        <footer>
          <p>
            Where this comes from: the DNA-sharing table published by Parker et&nbsp;al. in
            2017. A ribbon joins two breeds from different family groups when their shared DNA
            passes the researchers&rsquo; cutoff. A handful of breeds with a shaky family
            placement keep it here, just as in the original chart. Ribbon width grows with
            the amount of shared DNA and gets squeezed where a block is crowded. Each ribbon
            takes the color of the breed with more connections. We picked our own colors.
          </p>
          <p className="next-page">
            <Link href="/circos">See the whole chart full-size →</Link>
          </p>
        </footer>
      </section>
    </>
  );
}
