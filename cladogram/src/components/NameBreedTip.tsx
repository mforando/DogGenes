"use client";

import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import { cladeVar } from "@/lib/palette";

/**
 * Names page tooltip: hovering a name shown next to a breed draws every NYC dog with that name
 * as a circle-packing chart by breed (circle area = dogs), with the hovered breed outlined in
 * bold. Data: src/data/nycnamebreeds.json (scripts/build-nyc-name-breeds.py), loaded on first use.
 */

export type NameTip = { name: string; breed: string; x: number; y: number } | null;

type Data = {
  breeds: string[];
  clade: (string | null)[];
  names: Record<string, { n: number; b: [number, number][]; other: [number, number] }>;
};

const SIZE = 224; // chart size in px
const W = 256; // tooltip width in px
const fmt = (n: number) => n.toLocaleString("en-US");

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
  const pack = useMemo(() => {
    if (!entry || !data) return null;
    type Leaf = { breed: string; n: number; clade: string | null; other?: boolean };
    const leaves: Leaf[] = entry.b.map(([i, n]) => ({ breed: data.breeds[i], n, clade: data.clade[i] }));
    if (entry.other[0] > 0) leaves.push({ breed: "Other breeds", n: entry.other[0], clade: null, other: true });
    const root = d3.hierarchy<{ children: Leaf[] } | Leaf>({ children: leaves }).sum((d) => ("n" in d ? d.n : 0));
    return d3.pack<{ children: Leaf[] } | Leaf>().size([SIZE, SIZE]).padding(1.5)(root).leaves() as d3.HierarchyCircularNode<Leaf>[];
  }, [entry, data]);

  if (!tip || !entry || !pack) return null;
  const mine = entry.b.find(([i]) => data!.breeds[i] === tip.breed);
  const share = mine ? mine[1] / entry.n : 0;

  // Beside the pointer, kept inside the window.
  const H = SIZE + 92;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const left = Math.min(Math.max(8, tip.x + 18), vw - W - 8);
  const top = Math.min(Math.max(8, tip.y + 18), vh - H - 8);

  return (
    <div className="nb-tip" style={{ left, top, width: W }} role="tooltip">
      <p className="nb-h">
        <b>{tip.name}</b> · {fmt(entry.n)} NYC dogs, by breed
      </p>
      <p className="nb-sub">
        {mine ? (
          <>
            <i className="nb-swatch" aria-hidden /> {tip.breed}: {fmt(mine[1])} ({Math.round(share * 1000) / 10}%)
          </>
        ) : (
          <>{tip.breed}: no dogs with this name</>
        )}
      </p>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden>
        {pack
          .slice()
          .sort((a, b) => Number(a.data.breed === tip.breed) - Number(b.data.breed === tip.breed)) // hovered breed on top
          .map((c) => {
            const hot = c.data.breed === tip.breed;
            const label = c.r > 15;
            const chars = Math.max(3, Math.floor((c.r * 2) / 5.4));
            const short = c.data.breed.length > chars ? `${c.data.breed.slice(0, chars - 1)}…` : c.data.breed;
            return (
              <g key={c.data.breed} transform={`translate(${c.x.toFixed(1)},${c.y.toFixed(1)})`}>
                <circle
                  r={c.r}
                  className={`nb-c${hot ? " hot" : ""}${c.data.other ? " other" : ""}`}
                  style={{ fill: c.data.other ? undefined : cladeVar(c.data.clade, "") }}
                />
                {label && (
                  <text className="nb-l" textAnchor="middle" dy={c.r > 24 ? "-0.15em" : "0.35em"}>
                    {short}
                  </text>
                )}
                {label && c.r > 24 && (
                  <text className="nb-l nb-n" textAnchor="middle" dy="1.05em">
                    {fmt(c.data.n)}
                  </text>
                )}
              </g>
            );
          })}
      </svg>
      <p className="nb-note">
        Circle area = dogs. {tip.breed} is outlined.
        {entry.other[0] > 0 && ` “Other breeds” groups ${entry.other[1]} more breeds (${fmt(entry.other[0])} dogs).`}
      </p>
    </div>
  );
}
