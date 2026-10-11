"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { data, type RawNode } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";

type T = { name: string; code?: string; children?: T[] };

/** The study tree pruned to one clade's breeds: branches with no member are dropped, single-child forks folded. */
function prune(n: RawNode, clade: string): T | null {
  if (n.t === "b") {
    return n.main && data.breeds[n.code]?.clade === clade ? { name: data.breeds[n.code].name, code: n.code } : null;
  }
  const kids = n.c.map((c) => prune(c, clade)).filter((c): c is T => !!c);
  if (!kids.length) return null;
  return kids.length === 1 ? kids[0] : { name: "", children: kids };
}

/** A small left-to-right family tree of one clade (family group). */
export default function CladeTree({ clade }: { clade: string }) {
  const tree = useMemo(() => {
    const t = prune(data.tree, clade);
    if (!t) return null;
    const root = d3.hierarchy(t);
    const n = root.leaves().length;
    const ROW = 17;
    const H = Math.max(ROW, n * ROW);
    const W = 300;
    const LABEL = 150;
    d3.cluster<T>().size([H, W - LABEL - 8])(root);
    return { root: root as d3.HierarchyPointNode<T>, H, W };
  }, [clade]);
  if (!tree) return null;
  const color = cladeColor(clade);
  const { root, H, W } = tree;
  return (
    <svg className="clade-tree" viewBox={`-4 -10 ${W} ${H + 4}`} role="img" aria-label={`Family tree of the ${data.clades[clade]} breeds: ${root.leaves().map((l) => l.data.name).join(", ")}`}>
      {root.links().map((l, i) => (
        <path key={i} d={`M${l.source.y},${l.source.x}V${l.target.x}H${l.target.y}`} fill="none" stroke={color} strokeWidth={1.4} />
      ))}
      {root.leaves().map((l) => (
        <g key={l.data.code} transform={`translate(${l.y},${l.x})`}>
          <circle r={2.6} fill={color} />
          <text x={6} dy="0.33em" className="clade-tree-lab">{l.data.name}</text>
        </g>
      ))}
    </svg>
  );
}
