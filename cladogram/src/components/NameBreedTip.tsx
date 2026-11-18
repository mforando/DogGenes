"use client";

import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import { puppyGlyph } from "@/lib/puppyGlyph";

/**
 * Names page tooltip: hovering a name shown next to a breed draws every breed with NYC dogs of
 * that name as a beeswarm on one axis. Each circle is a breed, placed by the share of that
 * breed's dogs with the name and sized by how many of them there are; the hovered breed is
 * outlined in bold, and circles big enough carry the breed's LilPuppies dog and name. Data: src/data/nycnamebreeds.json (scripts/build-nyc-name-breeds.py),
 * loaded on first use.
 */

export type NameTip = { name: string; breed: string; x: number; y: number } | null;

type Data = {
  breeds: string[];
  clade: (string | null)[];
  /** Each breed's study code, for its LilPuppies dog (none for breeds outside the study). */
  code: (string | null)[];
  /** Every named NYC dog of each breed. */
  total: number[];
  /** Every named NYC dog (with a recognized breed): the base for a name's overall share. */
  all: number;
  names: Record<string, { n: number; b: [number, number][]; other: [number, number] }>;
};

const W_MAX = 560; // tooltip width in px (narrower on small screens)
const R_MAX = 30; // the biggest circle's radius
const LABEL_R = 17; // circles at least this big get the breed's dog and name; DOG_R, the dog alone
const DOG_R = 10;
const PAD = { l: 12, r: 16, b: 8 }; // chart margins
const AXIS_Y = 20; // the axis runs along the top, labels above it
const SWARM_TOP = 60; // below the overall line's label
const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (v: number) => `${(v * 100).toFixed(v < 0.01 ? 2 : 1)}%`;

let cache: Data | null = null;

// The tooltip keeps its own state, set from anywhere on the page through showNameTip, so a
// hover redraws only the tooltip, never the page's charts.
let current: NameTip = null;
const listeners = new Set<(t: NameTip) => void>();
export function showNameTip(t: NameTip) {
  current = t;
  for (const l of listeners) l(t);
}

export default function NameBreedTip() {
  const [tip, setTip] = useState<NameTip>(current);
  useEffect(() => {
    listeners.add(setTip);
    return () => {
      listeners.delete(setTip);
    };
  }, []);
  const [data, setData] = useState<Data | null>(cache);
  useEffect(() => {
    if (!tip || data) return;
    import("@/data/nycnamebreeds.json").then((m) => {
      cache = m.default as unknown as Data;
      setData(cache);
    });
  }, [tip, data]);

  const entry = tip && data ? data.names[tip.name] : null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const W = Math.min(W_MAX, vw - 16);
  const CW = W - 24; // chart width
  const swarm = useMemo(() => {
    if (!entry || !data) return null;
    type Dot = { breed: string; code: string | null; n: number; total: number; share: number; r: number; tx: number; x: number; y: number };
    const rows = entry.b.filter(([i]) => data.total[i] > 0);
    const overall = entry.n / data.all; // the share of all NYC dogs with the name
    const nMax = d3.max(rows, ([, n]) => n) ?? 1;
    const r = d3.scaleSqrt().domain([0, nMax]).range([0, R_MAX]);
    const sMax = Math.max(overall, d3.max(rows, ([i, n]) => n / data.total[i]) ?? 0.01);
    const x = d3.scaleLinear().domain([0, sMax]).nice(4).range([PAD.l, CW - PAD.r]);
    // Below the overall share purple, above it orange, deeper the further away (as in the NYT's tax-rate chart).
    const color = d3.scaleDiverging(d3.interpolatePuOr).domain([0, overall, x.domain()[1]]); // PuOr runs purple → white → orange
    const dots: Dot[] = rows.map(([i, n]) => {
      const share = n / data.total[i];
      return { breed: data.breeds[i], code: data.code[i], n, total: data.total[i], share, r: Math.max(3, r(n)), tx: x(share), x: x(share), y: 0 };
    });
    // A beeswarm: each breed pulled to its share on the axis, the circles pushed apart vertically.
    const sim = d3
      .forceSimulation(dots)
      .force("x", d3.forceX<Dot>((d) => d.tx).strength(1))
      .force("y", d3.forceY<Dot>(0).strength(0.05))
      .force("collide", d3.forceCollide<Dot>((d) => d.r + 0.8).iterations(3))
      .stop();
    for (let k = 0; k < 300; k++) sim.tick();
    const top = d3.min(dots, (d) => d.y - d.r) ?? 0;
    const bottom = d3.max(dots, (d) => d.y + d.r) ?? 0;
    const shift = SWARM_TOP - top;
    for (const d of dots) d.y += shift;
    return { dots, x, color, overall, mid: shift, height: bottom + shift + PAD.b };
  }, [entry, data, CW]);

  if (!tip || !entry || !swarm || !data) return null;
  const mine = swarm.dots.find((d) => d.breed === tip.breed);

  // Beside the pointer, kept inside the window.
  const H = swarm.height + 120;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(Math.max(8, tip.x + 18), vw - W - 8);
  const top = Math.min(Math.max(8, tip.y + 18), vh - H - 8);
  const ticks = swarm.x.ticks(4);

  return (
    <div className="nb-tip" style={{ left, top, width: W }} role="tooltip">
      <p className="nb-h">
        <b>{tip.name}</b> · {fmt(entry.n)} NYC dogs
      </p>
      <p className="nb-sub">
        {mine ? (
          <>
            <i className="nb-swatch" aria-hidden /> {fmt(mine.n)} of {fmt(mine.total)} {tip.breed}s ({pct(mine.share)})
          </>
        ) : (
          <>{tip.breed}: no dogs with this name</>
        )}
      </p>
      <p className="nb-axis-title">Share of each breed named {tip.name}</p>
      <svg viewBox={`0 0 ${CW} ${swarm.height}`} width={CW} height={swarm.height} aria-hidden>
        {/* The axis along the top: labels above, small ticks below. */}
        <g className="nb-axis">
          {ticks.map((t) => (
            <g key={t} transform={`translate(${swarm.x(t)},${AXIS_Y})`}>
              <text y={-6} textAnchor="middle">
                {d3.format(t === 0 ? ".0%" : ticks[1] < 0.01 ? ".1%" : ".0%")(t)}
              </text>
              <line y1={0} y2={5} />
            </g>
          ))}
        </g>
        {/* A dotted line through the middle of the swarm. */}
        <line className="nb-mid" x1={swarm.x.range()[0]} x2={swarm.x.range()[1]} y1={swarm.mid} y2={swarm.mid} />
        {swarm.dots
          .slice()
          .sort((a, b) => Number(a.breed === tip.breed) - Number(b.breed === tip.breed)) // hovered breed on top
          .map((d) => (
            <circle key={d.breed} cx={d.x} cy={d.y} r={d.r} className={`nb-c${d.breed === tip.breed ? " hot" : ""}`} style={{ fill: swarm.color(d.share) }} />
          ))}
        {/* The overall share: every NYC dog with the name, out of all NYC dogs (over the circles, under their labels). */}
        <g className="nb-overall" transform={`translate(${swarm.x(swarm.overall)},0)`}>
          <text y={SWARM_TOP - 19} textAnchor="middle" className="nb-overall-k">
            ALL NYC DOGS
          </text>
          <text y={SWARM_TOP - 7} textAnchor="middle" className="nb-overall-v">
            {pct(swarm.overall)}
          </text>
          <line y1={SWARM_TOP - 3} y2={swarm.height} />
        </g>
        {/* Big circles: the breed's LilPuppies dog and name inside (dark or light, whichever reads on the fill). */}
        {swarm.dots
          .filter((d) => d.r >= DOG_R)
          .map((d) => {
            const g = puppyGlyph(d.code ?? undefined);
            const named = d.r >= LABEL_R;
            if (!g && !named) return null;
            const ink = (d3.hsl(swarm.color(d.share)).l ?? 1) > 0.6 ? "#1d1b18" : "#ffffff";
            const chars = Math.max(4, Math.floor((d.r * 1.75) / 5.2));
            const label = d.breed.length > chars ? `${d.breed.slice(0, chars - 1)}…` : d.breed;
            return (
              <g key={`l-${d.breed}`} className="nb-in" transform={`translate(${d.x},${d.y})`} style={{ fill: ink }}>
                {g && (
                  <text className="nb-dog" y={named ? -d.r * 0.08 : d.r * 0.32} fontSize={d.r * (named ? 0.82 : 1.1)} textAnchor="middle">
                    {g}
                  </text>
                )}
                {named && (
                  <text className="nb-name" y={g ? d.r * 0.5 : 3} textAnchor="middle">
                    {label}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      <p className="nb-note">
        Each circle is a breed: further right, a bigger share of that breed is named {tip.name}; bigger circle, more dogs. Purple
        breeds use the name less than NYC dogs overall, orange more.
        {entry.other[0] > 0 && ` ${entry.other[1]} more breeds with fewer ${tip.name}s aren’t shown.`}
      </p>
    </div>
  );
}
