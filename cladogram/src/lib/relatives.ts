import { data, isLeaf, layout, type TNode } from "./tree";

/** Approximate length of the dog genome in DNA letters (base pairs). */
export const GENOME_BP = 2.4e9;

const base = layout();
const mainLeaf = new Map(
  base.leaves.filter((l) => isLeaf(l) && l.data.main).map((l) => [(l.data as { code: string }).code, l]),
);
const codesUnder = (n: TNode) => [...new Set(n.leaves().map((l) => (l.data as { code: string }).code))];

/** Breeds sharing big DNA chunks with `code`, as a share of the genome, biggest first. */
export function dnaRelatives(code: string) {
  return data.links
    .filter(([a, b]) => a === code || b === code)
    .map(([a, b, v]) => {
      const other = a === code ? b : a;
      return { code: other, mb: v / 1e6, pct: (v / GENOME_BP) * 100, sameFamily: !!data.breeds[code].clade && data.breeds[other].clade === data.breeds[code].clade };
    })
    .sort((x, y) => y.mb - x.mb);
}

/**
 * Closest cousins on the tree: breeds whose branch joins this one soonest, in the order
 * you meet them walking back toward the root. `splits` counts forks back to the meeting point.
 */
export function treeRelatives(code: string, limit = 6) {
  const leaf = mainLeaf.get(code);
  if (!leaf) return [];
  const out: { code: string; splits: number; confidence: number }[] = [];
  let child: TNode = leaf;
  let splits = 0;
  for (const anc of leaf.ancestors().slice(1) as TNode[]) {
    splits++;
    const sisters = (anc.children as TNode[]).filter((c) => c !== child);
    const found = sisters.flatMap(codesUnder).filter((c) => c !== code && c !== "GDJK" && !out.some((o) => o.code === c));
    for (const c of found) out.push({ code: c, splits, confidence: (anc.data as { bs: number }).bs });
    if (out.length >= limit) break;
    child = anc;
  }
  return out.slice(0, limit);
}

export type Rung = {
  /** forks back from the selected breed (1 = its closest split) */
  splits: number;
  /** bootstrap support for the split, out of 100 */
  confidence: number;
  /** breeds on the other side of this split */
  codes: string[];
  wolf: boolean;
};

/**
 * The selected breed's line of descent, from the split with the grey wolf down to the
 * breed itself. Each rung is one fork: the breeds that branched off at that point.
 */
export function lineage(code: string): Rung[] {
  const leaf = mainLeaf.get(code);
  if (!leaf) return [];
  const rungs: Rung[] = [];
  let child: TNode = leaf;
  let splits = 0;
  for (const anc of leaf.ancestors().slice(1) as TNode[]) {
    splits++;
    const sisters = (anc.children as TNode[]).filter((c) => c !== child);
    const codes = [...new Set(sisters.flatMap(codesUnder))];
    const wolf = codes.includes("WOLF");
    rungs.push({
      splits,
      confidence: (anc.data as { bs: number }).bs,
      codes: wolf ? ["WOLF"] : codes.filter((c) => c !== code),
      wolf,
    });
    if (wolf) break;
    child = anc;
  }
  // Fragments of the same breed can sit on the far side of a fork (split breeds);
  // drop rungs that would only list the breed itself.
  return rungs.filter((r) => r.codes.length).reverse();
}

export type FamilyNode =
  | { kind: "leaf"; code: string; self: boolean; main: boolean }
  | { kind: "group"; codes: string[] }
  | { kind: "fork"; confidence: number; spine: boolean; children: FamilyNode[] };

/** Groups of cousins up to this many breeds are drawn branch by branch; bigger ones collapse. */
export const EXPAND_LIMIT = 6;

/**
 * A pruned copy of the real cladogram for one breed: every fork on its line of descent
 * back to the split from the grey wolf, with the cousins that branch off at each fork.
 * Small cousin groups keep their own branching; large ones collapse to one tip.
 * The breed's own line is always the first (leftmost) child.
 */
export function familyTree(code: string): FamilyNode | null {
  const leaf = mainLeaf.get(code);
  if (!leaf) return null;
  const ancestors = leaf.ancestors() as TNode[];
  const top = ancestors.find((a) => codesUnder(a).includes("WOLF"));
  if (!top) return null;
  const spine = new Set(ancestors.slice(0, ancestors.indexOf(top) + 1));

  const build = (n: TNode): FamilyNode => {
    if (!n.children) {
      const d = n.data as { code: string; main: boolean };
      return { kind: "leaf", code: d.code, self: n === leaf, main: d.main };
    }
    const kids = n.children as TNode[];
    if (spine.has(n)) {
      const ordered = [kids.find((c) => spine.has(c))!, ...kids.filter((c) => !spine.has(c))];
      return { kind: "fork", confidence: (n.data as { bs: number }).bs, spine: true, children: ordered.map(build) };
    }
    const codes = codesUnder(n);
    if (codes.length > EXPAND_LIMIT) return { kind: "group", codes };
    return { kind: "fork", confidence: (n.data as { bs: number }).bs, spine: false, children: kids.map(build) };
  };
  return build(top);
}
