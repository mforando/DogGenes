import raw from "@/data/circos.json";
import { cladeColor } from "./palette";

export type CNode = {
  code: string;
  name: string;
  clade: string | null;
  group: string;
  index: number;
  /** angles in radians, 0 = 12 o'clock, clockwise (d3.arc convention) */
  a0: number;
  a1: number;
  mid: number;
  color: string;
  /** number of cross-clade partners */
  degree: number;
};

export type CEnd = { code: string; a0: number; a1: number };
export type CLink = {
  key: string;
  a: string;
  b: string;
  value: number;
  source: CEnd;
  target: CEnd;
  /** the end that sets the ribbon color (the busier breed) */
  hub: string;
  color: string;
};

export const circosData = raw as unknown as {
  clades: Record<string, string>;
  nodes: { code: string; name: string; clade: string | null; group: string }[];
  links: [string, string, number, number][];
};

export const CGEOM = {
  size: 1000,
  rIn: 330, // ribbons attach here
  rOut: 352, // outer edge of breed segments
  rLabel: 358,
  rClade0: 398,
  rClade1: 402,
  rCladeName: 414,
};

const N = circosData.nodes.length;
const SEG = (2 * Math.PI) / N;
const PAD = SEG * 0.12;

// Figure 4 starts with the wolf at 3 o'clock and runs counter-clockwise.
const start = Math.PI / 2 + SEG / 2;

const crossLinks = circosData.links.filter((l) => l[3] === 1);
const degree: Record<string, number> = {};
for (const [a, b] of crossLinks) {
  degree[a] = (degree[a] ?? 0) + 1;
  degree[b] = (degree[b] ?? 0) + 1;
}

export const nodes: CNode[] = circosData.nodes.map((n, i) => {
  const hi = start - i * SEG;
  return {
    ...n,
    index: i,
    a0: hi - SEG + PAD / 2,
    a1: hi - PAD / 2,
    mid: hi - SEG / 2,
    color: cladeColor(n.clade, n.code === "WOLF" ? "WOLF" : n.code),
    degree: degree[n.code] ?? 0,
  };
});
export const nodeByCode = new Map(nodes.map((n) => [n.code, n]));

export const valueExtent = [
  Math.min(...crossLinks.map((l) => l[2])),
  Math.max(...crossLinks.map((l) => l[2])),
] as const;

/**
 * Ribbon ends for a set of ribbons. Each ribbon's nominal width grows with the square
 * root of the shared haplotype length; where a breed's visible ribbons would overflow
 * its block they are squeezed to fit. Ends are ordered by where the partner sits on the
 * ring so ribbons leaving one block don't cross. Packing only the visible ribbons lets
 * a focused view show true relative widths.
 */
export function layoutLinks(subset: (typeof crossLinks)[number][] = crossLinks): CLink[] {
  const usable = SEG - PAD;
  const nominal = (v: number) => usable * (0.1 + 0.9 * Math.sqrt(v / valueExtent[1]));

  const ends = new Map<string, { link: number; partner: string; w: number }[]>();
  subset.forEach(([a, b, v], i) => {
    for (const [self, other] of [[a, b], [b, a]] as const) {
      const list = ends.get(self) ?? ends.set(self, []).get(self)!;
      list.push({ link: i, partner: other, w: nominal(v) });
    }
  });

  const placed = new Map<string, CEnd>(); // `${link}:${code}` -> end
  for (const [code, list] of ends) {
    const n = nodeByCode.get(code)!;
    // Order ends by the partner's clockwise offset from this block.
    const off = (p: string) => {
      const d = nodeByCode.get(p)!.mid - n.mid;
      return ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    };
    list.sort((x, y) => off(y.partner) - off(x.partner));
    const total = list.reduce((s, e) => s + e.w, 0);
    const k = Math.min(1, usable / total);
    let acc = n.mid - (total * k) / 2;
    for (const e of list) {
      placed.set(`${e.link}:${code}`, { code, a0: acc, a1: acc + e.w * k });
      acc += e.w * k;
    }
  }

  return subset.map(([a, b, value], i) => {
    const na = nodeByCode.get(a)!, nb = nodeByCode.get(b)!;
    // Color by the hub: the breed with more cross-clade partners (ties -> earlier on ring).
    const hub = na.degree > nb.degree || (na.degree === nb.degree && na.index < nb.index) ? a : b;
    return {
      key: `${a}|${b}`,
      a,
      b,
      value,
      source: placed.get(`${i}:${a}`)!,
      target: placed.get(`${i}:${b}`)!,
      hub,
      color: nodeByCode.get(hub)!.color,
    };
  });
}

export const links = layoutLinks();
export const rawLinkByKey = new Map(crossLinks.map((l) => [`${l[0]}|${l[1]}`, l]));

/** Contiguous clade arcs around the ring. */
export const cladeArcs = (() => {
  const arcs: { clade: string; a0: number; a1: number }[] = [];
  for (const n of nodes) {
    if (!n.clade) continue;
    const last = arcs[arcs.length - 1];
    if (last && last.clade === n.clade) last.a0 = n.a0;
    else arcs.push({ clade: n.clade, a0: n.a0, a1: n.a1 });
  }
  return arcs;
})();

export const partnersOf = (code: string) =>
  links
    .filter((l) => l.a === code || l.b === code)
    .map((l) => ({ code: l.a === code ? l.b : l.a, value: l.value }))
    .sort((x, y) => y.value - x.value);
