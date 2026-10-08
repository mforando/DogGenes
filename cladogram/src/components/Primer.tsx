"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import * as d3 from "d3";

export type TermId = "dna" | "cladogram" | "clade" | "bootstrap" | "haplotype";

const INK = "#e9e2d0";
const MUTED = "#5b635d";
const GOLD = "#e8b74a";
const W = 240;
const H = 120;

type G = d3.Selection<SVGGElement, unknown, null, undefined>;

/** A tiny four-breed tree; `hi` names the leaves whose branch is drawn in gold. */
function miniTree(g: G, x0: number, y0: number, w: number, h: number, hi: string[] = [], labels = true, pairOK = true) {
  const tips = pairOK ? ["Golden", "Lab", "Boxer", "Bulldog"] : ["Golden", "Boxer", "Lab", "Bulldog"];
  const step = w / (tips.length - 1);
  const xs = Object.fromEntries(tips.map((t, i) => [t, x0 + i * step]));
  const yTip = y0 + h;
  const line = (pts: [number, number][], on: boolean) =>
    g.append("path")
      .attr("d", d3.line()(pts))
      .attr("fill", "none")
      .attr("stroke", on ? GOLD : INK)
      .attr("stroke-width", on ? 2.2 : 1.3)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round");
  // Pairs join at mid height, the two pairs join at the top.
  const [a, b, c, dd] = tips;
  const yPair = y0 + h * 0.45;
  const yRoot = y0;
  const pairOn = hi.includes(a) && hi.includes(b);
  line([[xs[a], yTip], [xs[a], yPair], [xs[b], yPair], [xs[b], yTip]], pairOn);
  line([[xs[c], yTip], [xs[c], yPair], [xs[dd], yPair], [xs[dd], yTip]], false);
  const m1 = (xs[a] + xs[b]) / 2, m2 = (xs[c] + xs[dd]) / 2;
  line([[m1, yPair], [m1, yRoot], [m2, yRoot], [m2, yPair]], false);
  if (labels) {
    for (const t of tips) {
      g.append("text").attr("x", xs[t]).attr("y", yTip + 13).attr("text-anchor", "middle")
        .attr("class", "pr-label").attr("fill", hi.includes(t) ? GOLD : INK).text(t);
    }
  }
  return { xs, yPair, yRoot, yTip };
}

const DRAW: Record<TermId, (g: G) => void> = {
  dna(g) {
    // Two dogs' DNA, letter by letter: almost identical, a few spots differ.
    const seq = "ACGTTAGCATCGGATCAATG".split("");
    const alt = seq.map((s, i) => ([4, 11, 16].includes(i) ? ({ A: "G", C: "T", G: "A", T: "C" } as Record<string, string>)[s] : s));
    const cell = 11, x0 = 10;
    [seq, alt].forEach((row, r) => {
      const y = 24 + r * 44;
      g.append("text").attr("x", x0).attr("y", y - 7).attr("class", "pr-label").attr("fill", MUTED)
        .text(r === 0 ? "Dog 1" : "Dog 2");
      row.forEach((ch, i) => {
        const diff = ch !== seq[i] || alt[i] !== seq[i];
        g.append("rect").attr("x", x0 + i * cell).attr("y", y - 2).attr("width", cell - 1.5).attr("height", 14)
          .attr("rx", 2).attr("fill", diff ? GOLD : "#232b27");
        g.append("text").attr("x", x0 + i * cell + (cell - 1.5) / 2).attr("y", y + 8.5).attr("text-anchor", "middle")
          .attr("class", "pr-mono").attr("fill", diff ? "#0d1110" : INK).text(ch);
      });
    });
    g.append("text").attr("x", x0).attr("y", 108).attr("class", "pr-label").attr("fill", GOLD)
      .text("gold = the spots where dogs differ");
  },
  cladogram(g) {
    const { yRoot } = miniTree(g, 40, 18, 160, 72);
    g.append("text").attr("x", 120).attr("y", yRoot - 6).attr("text-anchor", "middle").attr("class", "pr-label")
      .attr("fill", MUTED).text("oldest split");
  },
  clade(g) {
    const { xs, yPair } = miniTree(g, 40, 18, 160, 72, ["Golden", "Lab"]);
    const x0 = xs.Golden - 12, x1 = xs.Lab + 12;
    g.append("rect").attr("x", x0).attr("y", yPair - 8).attr("width", x1 - x0).attr("height", 64)
      .attr("rx", 8).attr("fill", "none").attr("stroke", GOLD).attr("stroke-dasharray", "3 3");
    g.append("text").attr("x", (x0 + x1) / 2).attr("y", yPair + 70).attr("text-anchor", "middle")
      .attr("class", "pr-label").attr("fill", GOLD).text("one clade");
  },
  bootstrap(g) {
    // Five rebuilds; the Golden+Lab pairing shows up in four.
    const wins = [true, true, false, true, true];
    wins.forEach((ok, i) => {
      const sub = g.append("g");
      miniTree(sub, 8 + i * 46, 14, 30, 50, ok ? ["Golden", "Lab"] : [], false, ok);
      sub.append("text").attr("x", 23 + i * 46).attr("y", 82).attr("text-anchor", "middle")
        .attr("class", "pr-label").attr("fill", ok ? GOLD : MUTED).text(ok ? "✓" : "✗");
    });
    g.append("text").attr("x", 120).attr("y", 110).attr("text-anchor", "middle").attr("class", "pr-label")
      .attr("fill", INK).text("pairing found in 4 of 5 rebuilds = 80%");
  },
  haplotype(g) {
    // A shared chunk gets chopped shorter every generation.
    const gens = [
      { label: "Generation 1", pieces: [[20, 200]] },
      { label: "Generation 5", pieces: [[40, 120], [150, 185]] },
      { label: "Generation 20", pieces: [[60, 78], [110, 122], [168, 176]] },
    ];
    gens.forEach((gen, r) => {
      const y = 18 + r * 32;
      g.append("text").attr("x", 20).attr("y", y).attr("class", "pr-label").attr("fill", MUTED).text(gen.label);
      g.append("rect").attr("x", 20).attr("y", y + 5).attr("width", 200).attr("height", 10).attr("rx", 5).attr("fill", "#232b27");
      for (const [a, b] of gen.pieces) {
        g.append("rect").attr("x", a).attr("y", y + 5).attr("width", b - a).attr("height", 10).attr("rx", 5).attr("fill", GOLD);
      }
    });
    g.append("text").attr("x", 20).attr("y", 114).attr("class", "pr-label").attr("fill", GOLD)
      .text("long shared chunk = recent relative");
  },
};

const TERMS: Record<TermId, { word: string; say?: string; body: ReactNode }> = {
  dna: {
    word: "DNA",
    body: (
      <>
        <p>
          The instruction manual inside every cell, written in a four-letter alphabet:
          A, C, G and T. A dog&rsquo;s copy is about 2.4 billion letters long.
        </p>
        <p>
          Any two dogs match on almost all of it. The researchers compared about 150,000 of
          the spots where dogs tend to differ.
        </p>
      </>
    ),
  },
  cladogram: {
    word: "Cladogram",
    say: "CLAD-oh-gram",
    body: (
      <>
        <p>
          A family-tree diagram. It shows who split off from whom, and in what order. Think
          of a sports bracket run in reverse.
        </p>
        <p>
          It doesn&rsquo;t show dates, and the length of a line doesn&rsquo;t mean anything.
        </p>
      </>
    ),
  },
  clade: {
    word: "Clade",
    say: "rhymes with “made”",
    body: (
      <>
        <p>
          One branch of the tree plus everything growing out of it: a shared ancestor and
          all of its descendants.
        </p>
        <p>
          Like one side of your family: you, your siblings, your cousins, and the
          grandparents you have in common.
        </p>
      </>
    ),
  },
  bootstrap: {
    word: "Bootstrapping",
    body: (
      <>
        <p>
          A way of checking whether you&rsquo;d get the same answer twice. The researchers
          reshuffled their data and rebuilt the tree 100 times.
        </p>
        <p>
          If two breeds end up paired in 95 of those 100 trees, the pairing gets a 95% score.
          Higher means more trustworthy.
        </p>
      </>
    ),
  },
  haplotype: {
    word: "Haplotype",
    say: "HAP-lo-type",
    body: (
      <>
        <p>
          A chunk of DNA passed down in one piece, like a paragraph copied word-for-word from
          a parent. Every generation, the chunks get cut into smaller pieces as each
          parent&rsquo;s DNA is shuffled.
        </p>
        <p>
          So when two dogs share a <em>long</em> chunk, they had a common ancestor not long
          ago. Lengths are given in <strong>Mb</strong>, millions of DNA letters.
        </p>
      </>
    ),
  },
};

function TermCard({ id }: { id: TermId }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll("*").remove();
    DRAW[id](svg.append("g") as unknown as G);
  }, [id]);
  const t = TERMS[id];
  return (
    <li className="term">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Diagram illustrating ${t.word}`} />
      <h3>
        {t.word}
        {t.say && <span className="say">{t.say}</span>}
      </h3>
      {t.body}
    </li>
  );
}

export default function Primer({
  terms,
  title = "Five words you’ll need",
  intro,
  compact = false,
}: {
  terms: TermId[];
  title?: string;
  intro?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`primer${compact ? " compact" : ""}`} aria-labelledby="primer-h">
      <div className="primer-head">
        <p className="eyebrow">Quick glossary</p>
        <h2 id="primer-h">{title}</h2>
        {intro && <div className="primer-intro">{intro}</div>}
      </div>
      <ul className="terms" style={{ "--n": terms.length } as CSSProperties}>
        {terms.map((id) => (
          <TermCard key={id} id={id} />
        ))}
      </ul>
    </section>
  );
}
