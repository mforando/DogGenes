"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { GENERATIONS, N_LINES, simulate, summary, type Dog, type Mode } from "@/lib/selection";

/**
 * Natural selection vs. breeding, and why breeds are analysed differently from species:
 * an animated breeding simulation, then a tree (species) and a web (breeds) drawing in.
 */

// Four founder lines; validated as a set (all pairs) on the card surface #141a18:
// lightness band, chroma, CVD and normal-vision separation all pass.
const LINE_COLORS = ["#2d88e2", "#d35e2c", "#199e6e", "#b75fb8"];
const W = 420;
const R = 3.1;
const BIN = 2 * R + 0.8;

type XScale = d3.ScaleLinear<number, number>;

/** Dot histogram: each dog sits in its size bin, stacked upward; tall stacks compress. */
function layout(pop: Dog[], x: XScale, base: number, maxH: number): [number, number][] {
  const x0 = x(0);
  const bins = new Map<number, number[]>();
  pop.forEach((d, i) => {
    const b = Math.round((x(d.t) - x0) / BIN);
    if (!bins.has(b)) bins.set(b, []);
    bins.get(b)!.push(i);
  });
  const out: [number, number][] = new Array(pop.length);
  for (const [b, idx] of bins) {
    idx.sort((p, q) => pop[p].lin - pop[q].lin);
    const step = idx.length > 1 ? Math.min(BIN, (maxH - 2 * R) / (idx.length - 1)) : BIN;
    idx.forEach((i, k) => (out[i] = [x0 + b * BIN, base - R - k * step]));
  }
  return out;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function useRuns() {
  return useMemo(() => ({ natural: simulate("natural"), artificial: simulate("artificial") }), []);
}

const PANEL: Record<Mode, { title: string; rule: string }> = {
  natural: { title: "Natural selection", rule: "Any dog can breed. Smaller dogs leave slightly more pups." },
  artificial: { title: "Breeding (artificial selection)", rule: "Only smaller dogs sire pups, and one popular sire fathers a quarter of them." },
};

/** Founder-line swatches: filled if the line survives, hollow if it's gone. */
function Lines({ pop, x, y }: { pop: Dog[]; x: number; y: number }) {
  const alive = new Set(pop.map((d) => d.lin));
  return (
    <g transform={`translate(${x},${y})`}>
      {LINE_COLORS.map((c, i) => (
        <circle key={c} cx={i * 9} cy={-3.5} r={3.2} fill={alive.has(i) ? c : "none"} stroke={c} strokeWidth={1.2} />
      ))}
    </g>
  );
}

// ---------------------------------------------------------------- animated version

const PH = 172;

function SimPanel({ mode, gens, gen, y }: { mode: Mode; gens: Dog[][]; gen: number; y: number }) {
  const x = d3.scaleLinear().domain([0, 1]).range([20, W - 20]);
  const pop = gens[gen];
  const base = PH - 40;
  const pos = layout(pop, x, base, 88);
  const s = summary(pop);
  const start = summary(gens[0]).mean;
  const sire = mode === "artificial" && gen < GENERATIONS ? pop.findIndex((d) => d.sire) : -1;
  return (
    <g transform={`translate(0,${y})`}>
      <text className="sel-t" x={0} y={14}>{PANEL[mode].title}</text>
      <text className="sel-s" x={0} y={30}>{PANEL[mode].rule}</text>
      {/* where the average started, and where it is now */}
      <line x1={x(start)} x2={x(start)} y1={40} y2={base + 2} className="sel-start" />
      <text className="sel-s" x={x(start) + 4} y={46}>start</text>
      <g className="sel-mean" style={{ transform: `translateX(${x(s.mean)}px)` }}>
        <line x1={0} x2={0} y1={40} y2={base + 2} />
        {/* Label sits left of the line, unless that would run off the chart. */}
        <text x={x(s.mean) < 70 ? 4 : -4} y={46} textAnchor={x(s.mean) < 70 ? "start" : "end"}>average</text>
      </g>
      {pop.map((d, i) => (
        <circle
          key={i}
          className="sel-dot"
          r={R}
          style={{ transform: `translate(${pos[i][0]}px,${pos[i][1]}px)`, fill: LINE_COLORS[d.lin] }}
          stroke={d.carrier ? "#ece5d3" : "none"}
          strokeWidth={d.carrier ? 1.6 : 0}
        >
          <title>{`Founder line ${d.lin + 1} · size ${d.t.toFixed(2)}${d.carrier ? " · carries the hidden variant" : ""}`}</title>
        </circle>
      ))}
      {sire >= 0 && (
        <g className="sel-sire" style={{ transform: `translate(${pos[sire][0]}px,${pos[sire][1]}px)` }}>
          <circle r={7} />
          <text x={9} y={-6}>popular sire</text>
        </g>
      )}
      <line x1={x(0) - 6} x2={x(1) + 6} y1={base + 2} y2={base + 2} className="sel-axis" />
      <text className="sel-s" x={x(0)} y={base + 15}>← smaller</text>
      <text className="sel-s" x={(x(0) + x(1)) / 2} y={base + 15} textAnchor="middle">body size</text>
      <text className="sel-s" x={x(1)} y={base + 15} textAnchor="end">larger →</text>
      <text className="sel-v" x={0} y={PH - 6}>Founder lines left: {s.lines} of {N_LINES}</text>
      <Lines pop={pop} x={128} y={PH - 6} />
      <text className="sel-v" x={W - 2} y={PH - 6} textAnchor="end">Hidden disease variant: {pct(s.carriers)} of dogs</text>
    </g>
  );
}

function AnimatedVersion() {
  const runs = useRuns();
  const [gen, setGen] = useState(0);
  const [playing, setPlaying] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    if (gen >= GENERATIONS) {
      setPlaying(false);
      return;
    }
    const id = setTimeout(() => setGen((g) => g + 1), gen === 0 ? 900 : 650);
    return () => clearTimeout(id);
  }, [playing, gen]);

  // Start once, the first time the simulation scrolls into view (not with reduced motion).
  useEffect(() => {
    const el = root.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const done = gen >= GENERATIONS;
  return (
    <div className="sel-anim" ref={root}>
      <div className="sel-controls">
        <button
          type="button"
          onClick={() => {
            if (done) setGen(0);
            setPlaying((p) => (done ? true : !p));
          }}
        >
          {playing ? "Pause" : done ? "Replay" : gen > 0 ? "Resume" : "Play"}
        </button>
        <label>
          <span>
            Generation <strong>{gen}</strong> of {GENERATIONS}
          </span>
          <input
            type="range"
            min={0}
            max={GENERATIONS}
            value={gen}
            onChange={(e) => {
              setPlaying(false);
              setGen(Number(e.target.value));
            }}
            aria-label="Generation"
          />
        </label>
      </div>
      <SelLegend />
      <svg
        viewBox={`0 0 ${W} ${PH * 2 + 14}`}
        className="sel-svg"
        role="img"
        aria-label={`Simulation, generation ${gen}: natural selection keeps ${summary(runs.natural[gen]).lines} of 4 founder lines; breeding keeps ${summary(runs.artificial[gen]).lines}.`}
      >
        <SimPanel mode="natural" gens={runs.natural} gen={gen} y={0} />
        <SimPanel mode="artificial" gens={runs.artificial} gen={gen} y={PH + 14} />
      </svg>
      <p className="sel-note">
        Same 90 starting dogs, same 20 generations. In the wild the pressure is gentle and
        spread over many traits, so change is slow and the old variety survives. A breeder
        pushes hard on one trait with a few chosen sires: the look changes fast, most founder
        lines vanish, and a hidden disease variant can ride along with a popular sire because
        nobody can see it to select against it.
      </p>
      <TreeVsWeb animate />
      <ul className="sel-points">
        <li>
          <strong>Too young for the clock.</strong> Most breeds are about 50 dog generations
          old, too few for many new mutations. Breeds differ mainly in which <em>old</em>{" "}
          variants they kept, so their ages come from studbooks, not mutation counts.
        </li>
        <li>
          <strong>Genetic islands.</strong> About 30% of dog genetic variation lies between
          breeds, versus about 5% between human populations, so DNA can tell almost any breed
          apart.
        </li>
        <li>
          <strong>A few big genes.</strong> Three or fewer genes explain most of the
          differences in size, legs or skull shape among breeds; human height involves
          thousands.
        </li>
      </ul>
    </div>
  );
}

function SelLegend() {
  return (
    <ul className="sel-legend" aria-label="Legend">
      <li>
        <span className="sel-sw">
          {LINE_COLORS.map((c) => (
            <i key={c} style={{ background: c }} />
          ))}
        </span>
        4 founder lines (the starting families)
      </li>
      <li>
        <span className="sel-ring" /> carries a hidden disease variant
      </li>
      <li>
        <span className="sel-ring gold" /> popular sire
      </li>
    </ul>
  );
}

// ---------------------------------------------------------------- tree vs web

const TW_H = 200;
/** Elbow tree with four tips; `split` sets how far down (later) the splits happen. */
function treePaths(ox: number, top: number, mid: number, tip: number) {
  const xs = [ox + 22, ox + 72, ox + 128, ox + 178];
  const l = (xs[0] + xs[1]) / 2;
  const r = (xs[2] + xs[3]) / 2;
  const c = (l + r) / 2;
  const el = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} H${x2} V${y2}`;
  return {
    stem: `M${c},${top - 14} V${top}`,
    branches: [el(c, top, l, mid), el(c, top, r, mid), el(l, mid, xs[0], tip), el(l, mid, xs[1], tip), el(r, mid, xs[2], tip), el(r, mid, xs[3], tip)],
    xs,
    l,
    r,
  };
}

function TreeVsWeb({ animate = false }: { animate?: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [drawn, setDrawn] = useState(!animate);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!animate) return;
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDrawn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setDrawn(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [animate, run]);

  const sp = treePaths(0, 52, 92, 150);
  const br = treePaths(220, 52, 126, 150);
  const cross: [number, number, number, number][] = [
    [br.xs[1], 140, br.xs[2], 132],
    [br.xs[0], 146, br.xs[3], 138],
    [br.xs[2], 145, br.xs[3], 146],
  ];
  const cls = (delay: number) => ({
    className: `tw-path${animate ? " anim" : ""}${drawn ? " on" : ""}`,
    style: { transitionDelay: `${delay}ms` },
    pathLength: 1,
  });

  return (
    <figure className="tw">
      <svg ref={ref} viewBox={`0 0 ${W} ${TW_H}`} role="img" aria-label="Species form a clean branching tree; breeds form a web, because crossbreeding moves DNA between branches." key={run}>
        <text className="sel-t" x={0} y={14}>Species: a tree</text>
        <text className="sel-t" x={220} y={14}>Breeds: a web</text>
        <text className="sel-s" x={0} y={30}>splits millions of years apart</text>
        <text className="sel-s" x={220} y={30}>splits within ~200 years</text>
        <path d={sp.stem} {...cls(0)} />
        {sp.branches.map((d, i) => (
          <path key={d} d={d} {...cls(200 + i * 160)} />
        ))}
        <path d={br.stem} {...cls(0)} />
        {br.branches.map((d, i) => (
          <path key={d} d={d} {...cls(200 + i * 160)} />
        ))}
        {cross.map(([x1, y1, x2, y2], i) => (
          <path
            key={i}
            d={`M${x1},${y1} C${x1},${y1 - 26} ${x2},${y2 - 26} ${x2},${y2}`}
            {...cls(1400 + i * 350)}
            className={`tw-cross${animate ? " anim" : ""}${drawn ? " on" : ""}`}
          />
        ))}
        {[...sp.xs, ...br.xs].map((x) => (
          <circle key={x} cx={x} cy={150} r={3} className="tw-tip" />
        ))}
        {/* "clock" ticks: steady differences piling up along the species branches */}
        {[
          ...[sp.l, sp.r].flatMap((x) => [66, 80].map((y) => [x, y])),
          ...sp.xs.flatMap((x) => [106, 120, 134].map((y) => [x, y])),
        ].map(([x, y]) => (
          <line key={`${x}-${y}`} x1={x - 4} x2={x + 4} y1={y} y2={y} className={`tw-tick${animate ? " anim" : ""}${drawn ? " on" : ""}`} />
        ))}
        <text className="sel-a" x={0} y={170}>Branches never rejoin. Mutations pile up</text>
        <text className="sel-a" x={0} y={183}>steadily (ticks), so counting them dates</text>
        <text className="sel-a" x={0} y={196}>each split: a molecular clock.</text>
        <text className="sel-a" x={220} y={170}>Crosses (gold) move DNA sideways, and</text>
        <text className="sel-a" x={220} y={183}>there was no time for the clock. Breeds are</text>
        <text className="sel-a" x={220} y={196}>traced by shared stretches of DNA instead.</text>
      </svg>
      <figcaption>
        That&rsquo;s why the study behind this site pairs its family tree with a{" "}
        <Link href="/">web of shared DNA</Link>.
        {animate && (
          <button
            type="button"
            className="tw-replay"
            onClick={() => {
              setDrawn(false);
              setRun((r) => r + 1);
            }}
          >
            Replay
          </button>
        )}
      </figcaption>
    </figure>
  );
}

export default function SelectionExplainer() {
  return (
    <div className="sel">
      <p className="sel-h">
        <span className="ancient-badge">Bred, not evolved</span>
        Natural selection vs. breeding
      </p>
      <AnimatedVersion />
    </div>
  );
}
