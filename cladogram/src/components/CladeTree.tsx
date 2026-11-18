"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { data, type RawNode } from "@/lib/tree";
import { cladeVar } from "@/lib/palette";
import { puppyGlyph } from "@/lib/puppyGlyph";
import { nodes } from "@/lib/circos";
import { treeCodeOf } from "@/lib/circosTree";
import { panelMembers, setPanelFocus, usePanelFocus } from "@/lib/panelFocus";

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
    const LABEL = 170; // name plus its mini dog
    d3.cluster<T>().size([H, W - LABEL - 8])(root);
    return { root: root as d3.HierarchyPointNode<T>, H, W };
  }, [clade]);
  // The family's breeds as the chord charts name them (a breed's home-country group included).
  const members = useMemo(() => new Set(nodes.filter((n) => n.clade === clade).map((n) => n.code)), [clade]);
  // A breed pointed at here or on the panel's chord diagram: lit, the rest recede.
  const focus = usePanelFocus();
  const lit = useMemo(() => new Set([...panelMembers(focus, members)].map(treeCodeOf)), [focus, members]);
  if (!tree) return null;
  const color = cladeVar(clade);
  const { root, H, W } = tree;
  const dim = (code?: string) => !!focus && !lit.has(code ?? "");
  return (
    <svg className="clade-tree" onPointerLeave={() => setPanelFocus(null)} viewBox={`-4 -10 ${W} ${H + 4}`} role="img" aria-label={`Family tree of the ${data.clades[clade]} breeds: ${root.leaves().map((l) => l.data.name).join(", ")}`}>
      {root.links().map((l, i) => (
        <path key={i} d={`M${l.source.y},${l.source.x}V${l.target.x}H${l.target.y}`} fill="none" stroke={color} strokeWidth={1.4} />
      ))}
      {root.leaves().map((l) => (
        <g
          key={l.data.code}
          className={`clade-tree-leaf${dim(l.data.code) ? " dim" : ""}${focus && !dim(l.data.code) ? " lit" : ""}`}
          transform={`translate(${l.y},${l.x})`}
          onPointerEnter={() => l.data.code && setPanelFocus({ kind: "m", id: l.data.code })}
        >
          {/* The whole row answers the pointer, not just the letters. */}
          <rect className="clade-tree-hit" x={-4} y={-8.5} width={W - l.y} height={17} />
          <circle r={2.6} fill={color} />
          {puppyGlyph(l.data.code) && (
            <text x={6} y={5} className="clade-tree-dog" fill={color} aria-hidden>
              {puppyGlyph(l.data.code)}
            </text>
          )}
          <text x={26} dy="0.33em" className="clade-tree-lab">{l.data.name}</text>
        </g>
      ))}
    </svg>
  );
}
