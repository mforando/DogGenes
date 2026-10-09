import { hierarchy, type HierarchyNode } from "d3";
import { data, type RawNode } from "./tree";
import { CGEOM, nodeByCode } from "./circos";

/**
 * The cladogram from the family-tree tab, re-laid out inside the circle chart's ring:
 * each tip sits on its breed's block (the paper orders the circle to match the tree),
 * and forks are placed further from the centre the more recent they are.
 */
export type CTNode = HierarchyNode<RawNode> & { a: number; r: number };

/** Circle-chart population codes that live under a different code in the tree. */
export const TREE_CODE: Record<string, string> = { CHTM: "TIBM", COOS: "SALU", ITCC: "CANE" };
export const treeCodeOf = (c: string) => TREE_CODE[c] ?? c;

const R_TIP = CGEOM.rIn - 2;
const R_MAX = CGEOM.rIn - 26;

function build() {
  // Start at the split between dogs and grey wolves (drop the jackal outgroup).
  const full = hierarchy<RawNode>(data.tree, (d) => (d.t === "i" ? d.c : null));
  const codes = (n: HierarchyNode<RawNode>) => n.leaves().map((l) => (l.data as { code: string }).code);
  const top = full.descendants()
    .filter((n) => n.children && codes(n).includes("WOLF") && !codes(n).includes("GDJK"))
    .sort((a, b) => b.leaves().length - a.leaves().length)[0];
  const root = top.copy() as CTNode;

  // Fragments of a split breed share its block; spread them evenly across it.
  const leaves = root.leaves() as CTNode[];
  const frags = new Map<string, CTNode[]>();
  for (const l of leaves) {
    const c = (l.data as { code: string }).code;
    (frags.get(c) ?? frags.set(c, []).get(c)!).push(l);
  }
  for (const [c, list] of frags) {
    const n = nodeByCode.get(c)!;
    const span = n.a1 - n.a0;
    list.forEach((l, i) => {
      l.a = n.a0 + span * ((i + 0.5) / list.length);
      l.r = R_TIP;
    });
  }

  const maxDepth = Math.max(...root.descendants().filter((d) => d.children).map((d) => d.depth));
  root.eachAfter((n) => {
    const t = n as CTNode;
    if (!t.children) return;
    const kids = t.children as CTNode[];
    t.a = kids.reduce((s, k) => s + k.a, 0) / kids.length;
    t.r = R_MAX * Math.pow(t.depth / maxDepth, 0.8);
  });

  const mainLeaf = new Map<string, CTNode>();
  for (const l of leaves) {
    const d = l.data as { code: string; main: boolean };
    if (d.main) mainLeaf.set(d.code, l);
  }
  return { root, nodes: root.descendants() as CTNode[], mainLeaf };
}

export const circosTree = build();

/** Branch shape: an arc around the centre at the parent's radius, then straight out. */
export function elbow(pa: number, pr: number, a: number, r: number) {
  const p = (ang: number, rad: number) => `${rad * Math.sin(ang)},${-rad * Math.cos(ang)}`;
  if (pr < 0.5) return `M${p(a, pr)}L${p(a, r)}`;
  const large = Math.abs(a - pa) > Math.PI ? 1 : 0;
  const sweep = a > pa ? 1 : 0;
  return `M${p(pa, pr)}A${pr},${pr} 0 ${large} ${sweep} ${p(a, pr)}L${p(a, r)}`;
}
