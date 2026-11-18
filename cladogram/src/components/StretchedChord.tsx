"use client";

import { useMemo } from "react";
import { circosData, links, nodeByCode, nodes } from "@/lib/circos";
import { cladeVar } from "@/lib/palette";
import { setPanelFocus, usePanelFocus } from "@/lib/panelFocus";

/**
 * A stretched chord diagram, after Nadieh Bremer's (visualcinnamon.com/2015/08/stretched-chord):
 * a chord diagram whose ring is split into a left and a right half and pulled apart, with empty
 * gaps at the top and bottom. Left: the selected family's breeds that share DNA outside the
 * family. Right: the breeds they share it with, grouped by family (a thin bracket marks each
 * family). Each chord is one pair, as wide as the DNA they share, shaded from the family's color
 * to its partner's. Names run outward from the ring; where they'd collide, the bigger arcs keep
 * theirs and the rest show on hover.
 */

const mb = (v: number) => `${(v / 1e6).toFixed(1)} Mb`;
const familyOf = (code: string) => {
  const n = nodeByCode.get(code)!;
  return n.code === "WOLF" ? "Wild relative" : n.clade ? circosData.clades[n.clade] : "Loners";
};
const colorOf = (code: string) => {
  const n = nodeByCode.get(code)!;
  return n.clade || n.code === "WOLF" ? n.cssColor : cladeVar(null);
};
const MAX_CHARS = 13;
const shortName = (s: string) => (s.length > MAX_CHARS ? `${s.slice(0, MAX_CHARS - 1)}…` : s);

// Geometry, in viewBox units (angles: 0 at the top, clockwise, as in d3).
const EMPTY = 0.67; // half-angle of the empty gap at the top and at the bottom: each half spans ~103°, so names run fairly level
const THICK = 8; // breed arc thickness
const BRACKET = 3; // family bracket thickness (right side), just outside the arcs
const PULL = 18; // how far each half is pulled out from the centre
const FONT = 12;
const LABEL_STEP = 12.5; // names need at least this much arc between them
const PAD = 0.018; // between breeds
const FAMILY_PAD = 0.05; // between families (right)

type Item = { code: string; name: string; color: string; v: number; a0: number; a1: number; family?: string };
type Chord = { m: string; p: string; v: number; s0: number; s1: number; t0: number; t1: number; famKey: string };

export default function StretchedChord({ clade }: { clade: string }) {
  // What's pointed at, here or on the panel's family tree (shared with the main charts).
  const hot = usePanelFocus();
  const setHot = setPanelFocus;

  const g = useMemo(() => {
    const members = nodes.filter((n) => n.clade === clade);
    const inFam = new Set(members.map((n) => n.code));
    const pairs = links
      .filter((l) => inFam.has(l.a) !== inFam.has(l.b))
      .map((l) => (inFam.has(l.a) ? { m: l.a, p: l.b, v: l.value } : { m: l.b, p: l.a, v: l.value }));
    if (!pairs.length) return null;
    const V = pairs.reduce((s, p) => s + p.v, 0);

    // Left: the family's breeds with DNA outside the family, in ring (tree) order.
    const mTotal = new Map<string, number>();
    for (const p of pairs) mTotal.set(p.m, (mTotal.get(p.m) ?? 0) + p.v);
    const left = members.filter((n) => mTotal.has(n.code)).map((n) => ({ code: n.code, name: n.name, color: colorOf(n.code), v: mTotal.get(n.code)! }));

    // Right: partner breeds grouped by family (most shared DNA first), breeds by DNA within.
    const pTotal = new Map<string, number>();
    for (const p of pairs) pTotal.set(p.p, (pTotal.get(p.p) ?? 0) + p.v);
    const fams = new Map<string, { key: string; name: string; color: string; v: number; codes: string[] }>();
    for (const [code, v] of pTotal) {
      const f = familyOf(code);
      const e = fams.get(f) ?? fams.set(f, { key: `f${fams.size}`, name: f, color: colorOf(code), v: 0, codes: [] }).get(f)!;
      e.v += v;
      e.codes.push(code);
    }
    const famList = [...fams.values()].sort((a, b) => b.v - a.v);
    for (const f of famList) f.codes.sort((a, b) => pTotal.get(b)! - pTotal.get(a)!);
    const right = famList.flatMap((f) => f.codes.map((code) => ({ code, name: nodeByCode.get(code)!.name, color: f.color, v: pTotal.get(code)!, family: f.name })));

    // Each half runs top to bottom between the gaps. Right: EMPTY → π − EMPTY (clockwise).
    // Left: 2π − EMPTY → π + EMPTY (counter-clockwise), so tops face tops and chords don't twist.
    const SPAN = Math.PI - 2 * EMPTY;
    const place = (items: Omit<Item, "a0" | "a1">[], gapAt: (i: number) => number, side: -1 | 1): Item[] => {
      const gaps = items.reduce((s, _, i) => s + (i ? gapAt(i) : 0), 0);
      const floor = Math.min(0.012, (0.25 * (SPAN - gaps)) / items.length);
      const k = (SPAN - gaps - floor * items.length) / V;
      let t = 0; // distance from the top along the half
      return items.map((it, i) => {
        if (i) t += gapAt(i);
        const from = t;
        t += floor + it.v * k;
        const [a0, a1] = side > 0 ? [EMPTY + from, EMPTY + t] : [2 * Math.PI - EMPTY - from, 2 * Math.PI - EMPTY - t];
        return { ...it, a0, a1 };
      });
    };
    const L = place(left, () => PAD, -1);
    const R = place(right, (i) => (right[i].family !== right[i - 1].family ? FAMILY_PAD : PAD), 1);

    // Chords: each arc's range split among its pairs, in the other side's order (no crossings).
    const Lpos = new Map(L.map((it, i) => [it.code, i]));
    const Rpos = new Map(R.map((it, i) => [it.code, i]));
    const split = (it: Item, parts: { key: string; v: number }[]) => {
      const out = new Map<string, [number, number]>();
      let a = it.a0;
      for (const p of parts) {
        const d = ((it.a1 - it.a0) * p.v) / it.v;
        out.set(p.key, [a, a + d]);
        a += d;
      }
      return out;
    };
    const lCut = new Map(L.map((it) => [it.code, split(it, pairs.filter((p) => p.m === it.code).sort((x, y) => Rpos.get(x.p)! - Rpos.get(y.p)!).map((p) => ({ key: p.p, v: p.v })))]));
    const rCut = new Map(R.map((it) => [it.code, split(it, pairs.filter((p) => p.p === it.code).sort((x, y) => Lpos.get(x.m)! - Lpos.get(y.m)!).map((p) => ({ key: p.m, v: p.v })))]));
    const chords: Chord[] = pairs
      .map((p) => {
        const [s0, s1] = lCut.get(p.m)!.get(p.p)!;
        const [t0, t1] = rCut.get(p.p)!.get(p.m)!;
        return { ...p, s0, s1, t0, t1, famKey: fams.get(familyOf(p.p))!.key };
      })
      .sort((a, b) => b.v - a.v); // thin chords on top

    // Radius from the busier half: room for its names, within a compact range.
    const busiest = Math.max(L.length, R.length);
    const Rad = Math.max(66, Math.min(134, (busiest * LABEL_STEP * 0.62) / SPAN));
    return { L, R, chords, famList, Rad, clade: members[0]?.cssColor ?? "#888" };
  }, [clade]);

  if (!g) return <p className="cd-sub">No big DNA overlaps with other families.</p>;
  const { L, R, chords, famList, Rad } = g;

  const pt = (side: number, a: number, r = Rad): [number, number] => [side * PULL + r * Math.sin(a), -r * Math.cos(a)];
  const f = (n: number) => n.toFixed(1);
  // An annular sector on one half (a0 → a1 in either direction).
  const sector = (side: number, a0: number, a1: number, r0: number, r1: number) => {
    const [lo, hi] = a0 < a1 ? [a0, a1] : [a1, a0];
    const large = hi - lo > Math.PI ? 1 : 0;
    const [x0, y0] = pt(side, lo, r1), [x1, y1] = pt(side, hi, r1), [x2, y2] = pt(side, hi, r0), [x3, y3] = pt(side, lo, r0);
    return `M${f(x0)},${f(y0)}A${r1},${r1} 0 ${large} 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${r0},${r0} 0 ${large} 0 ${f(x3)},${f(y3)}Z`;
  };
  // The stretched chord: down the left arc, across through the middle, up the right arc, back.
  const chordPath = (c: Chord) => {
    const [sx0, sy0] = pt(-1, c.s0), [sx1, sy1] = pt(-1, c.s1);
    const [tx0, ty0] = pt(1, c.t0), [tx1, ty1] = pt(1, c.t1);
    return `M${f(sx0)},${f(sy0)}A${Rad},${Rad} 0 0 0 ${f(sx1)},${f(sy1)}Q0,0 ${f(tx1)},${f(ty1)}A${Rad},${Rad} 0 0 0 ${f(tx0)},${f(ty0)}Q0,0 ${f(sx0)},${f(sy0)}Z`;
  };

  // Names run outward from the ring; where two would collide, the bigger arc keeps its name.
  const labelR = (side: number) => Rad + THICK + (side > 0 ? BRACKET + 5 : 4);
  const named = (side: number, items: Item[]) => {
    const step = LABEL_STEP / labelR(side);
    const kept: number[] = [];
    const keep = new Set<string>();
    for (const it of [...items].sort((a, b) => b.v - a.v)) {
      const mid = (it.a0 + it.a1) / 2;
      if (kept.every((k) => Math.abs(k - mid) >= step)) {
        kept.push(mid);
        keep.add(it.code);
      }
    }
    return keep;
  };
  const lNamed = named(-1, L);
  const rNamed = named(1, R);
  const labelTf = (side: number, a: number) => {
    const [x, y] = pt(side, a, labelR(side));
    const deg = (a * 180) / Math.PI - 90;
    return `translate(${f(x)},${f(y)}) rotate(${f(side < 0 ? deg + 180 : deg)})`;
  };

  // Family brackets on the right, just outside the arcs.
  const brackets = famList.map((fam) => {
    const its = R.filter((it) => it.family === fam.name);
    return { fam, a0: Math.min(...its.map((i) => i.a0)), a1: Math.max(...its.map((i) => i.a1)) };
  });

  // Fit the view to the ring and the longest names (names are at most MAX_CHARS long).
  const reach = Rad + THICK + BRACKET + 5 + MAX_CHARS * FONT * 0.56;
  const xMax = PULL + reach;
  const yMax = Math.cos(EMPTY) * reach + 6;

  const on = (c: Chord) => !hot || (hot.kind === "m" ? c.m === hot.id : hot.kind === "p" ? c.p === hot.id : `${c.m}|${c.p}` === hot.id);
  const itemOn = (side: "m" | "p", code: string) =>
    !hot || (hot.kind === side && hot.id === code) || chords.some((c) => on(c) && (side === "m" ? c.m : c.p) === code);

  return (
    <div className="sc">
      <svg
        className="sc-svg"
        viewBox={`${-xMax} ${-yMax} ${2 * xMax} ${2 * yMax}`}
        role="img"
        aria-label={`Stretched chord diagram: ${L.length} breeds in this family share DNA with ${R.length} breeds in ${famList.length} other groups.`}
        onPointerLeave={() => setHot(null)}
      >
        <defs>
          {famList.map((fam) => (
            <linearGradient key={fam.key} id={`sc-${clade}-${fam.key}`} gradientUnits="userSpaceOnUse" x1={-PULL - Rad * 0.6} x2={PULL + Rad * 0.6} y1={0} y2={0}>
              <stop offset="0%" stopColor={g.clade} />
              <stop offset="100%" stopColor={fam.color} />
            </linearGradient>
          ))}
        </defs>
        <g className="sc-chords">
          {chords.map((c) => (
            <path
              key={`${c.m}|${c.p}`}
              d={chordPath(c)}
              fill={`url(#sc-${clade}-${c.famKey})`}
              fillOpacity={on(c) ? (hot ? 0.9 : 0.62) : 0.06}
              onPointerEnter={() => setHot({ kind: "c", id: `${c.m}|${c.p}` })}
            >
              <title>{`${nodeByCode.get(c.m)!.name} ↔ ${nodeByCode.get(c.p)!.name}: ${mb(c.v)}`}</title>
            </path>
          ))}
        </g>
        {brackets.map((b) => (
          <path key={b.fam.key} className="sc-bracket" d={sector(1, b.a0, b.a1, Rad + THICK + 1.5, Rad + THICK + 1.5 + BRACKET)} fill={b.fam.color}>
            <title>{`${b.fam.name}: ${mb(b.fam.v)}`}</title>
          </path>
        ))}
        {([["m", -1, L, lNamed], ["p", 1, R, rNamed]] as const).map(([kind, side, items, keep]) => (
          <g key={kind} className={`sc-side sc-${kind}`}>
            {items.map((it) => (
              <g key={it.code} opacity={itemOn(kind, it.code) ? 1 : 0.22} onPointerEnter={() => setHot({ kind, id: it.code })}>
                <path d={sector(side, it.a0, it.a1, Rad, Rad + THICK)} fill={it.color}>
                  <title>{`${it.name}${it.family ? ` (${it.family})` : ""}: ${mb(it.v)} shared`}</title>
                </path>
                {keep.has(it.code) && (
                  <text transform={labelTf(side, (it.a0 + it.a1) / 2)} dy="0.34em" textAnchor={side < 0 ? "end" : "start"} fontSize={FONT}>
                    {shortName(it.name)}
                  </text>
                )}
              </g>
            ))}
          </g>
        ))}
      </svg>
      <ul className="sc-legend" aria-label="Families on the right">
        {famList.map((fam) => (
          <li key={fam.name}>
            <i style={{ background: fam.color }} aria-hidden /> {fam.name} <span>{mb(fam.v)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
