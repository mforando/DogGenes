import { hierarchy, type HierarchyNode } from "d3";
import raw from "@/data/cladogram.json";

export type RawNode =
  | { id: number; t: "i"; bs: number; c: RawNode[] }
  | { id: number; t: "b"; code: string; n: number; s: string[]; main: boolean; frags: number };

export type Breed = { name: string; clade: string | null };

export const data = raw as unknown as {
  stats: { dogs: number; breeds: number; wedges: number };
  clades: Record<string, string>;
  breeds: Record<string, Breed>;
  tree: RawNode;
  links: [string, string, number][];
};

export type TNode = HierarchyNode<RawNode> & {
  /** angle (radians, 0 = 12 o'clock, clockwise) */
  a: number;
  /** radius */
  r: number;
  /** wedge angular extent (leaves only) */
  a0: number;
  a1: number;
};

export const GEOM = {
  size: 1120, // viewBox: just room for the outermost labels (clade names at rCladeName)
  rTree: 330, // radius at the deepest internal node
  rWedge: 372, // outer edge of breed wedges
  rClade0: 377,
  rClade1: 383,
  rLabel: 389,
  rCladeName: 530,
};

/**
 * A hypothetical sample from the common ancestor of grey wolves and dogs, for the
 * "missing links" step. It isn't in the study: it's inserted at the fork where the dogs
 * split from the nearest wolves, and takes no room unless shown.
 */
export const ANCESTOR = "ANC";
export const ANCESTOR_BREED: Breed = { name: "Common ancestor (hypothetical)", clade: null };
const ANCESTOR_NODE: RawNode = { id: 100000, t: "b", code: ANCESTOR, n: 0, s: [], main: true, frags: 1 };
const ANCESTOR_WEIGHT = 80;

/** The fork where every dog breed splits from the nearest wolves (parent of the dogs' common ancestor). */
const DOG_FORK = (() => {
  const isWild = (c: string) => c === "WOLF" || c === "GDJK";
  const hasDog = (n: RawNode): boolean => (n.t === "b" ? !isWild(n.code) : n.c.some(hasDog));
  const allDog = (n: RawNode): boolean => (n.t === "b" ? !isWild(n.code) : n.c.every(allDog));
  // Walk down from the root while exactly one child holds dogs, until that child is all dogs.
  let fork = data.tree as Extract<RawNode, { t: "i" }>;
  for (;;) {
    const dogKids = fork.c.filter(hasDog);
    if (dogKids.length !== 1 || allDog(dogKids[0]) || dogKids[0].t !== "i") return fork.id;
    fork = dogKids[0];
  }
})();

// Each labelled wedge gets angular room for its label plus room proportional to its
// dogs; minor fragments of split breeds are unlabelled, so they only need their dogs.
const leafWeight = (d: RawNode, showAncestor: boolean) =>
  d.t !== "b" ? 0 : d.code === ANCESTOR ? (showAncestor ? ANCESTOR_WEIGHT : 0) : (d.main ? 7 : 2) + 0.75 * d.n;
const GAP = 0.012; // radians left open at the top of the ring

/**
 * Lays the tree out radially. `flipped` holds ids of internal nodes whose children
 * are drawn in reverse order — the rotation that leaves the tree's meaning unchanged.
 */
export function layout(
  flipped: ReadonlySet<number> = new Set(),
  /** withAncestor adds the hypothetical ancestor leaf (zero width unless showAncestor). */
  opts: { withAncestor?: boolean; showAncestor?: boolean } = {},
): {
  root: TNode;
  nodes: TNode[];
  leaves: TNode[];
  byId: Map<number, TNode>;
} {
  const root = hierarchy<RawNode>(data.tree, (d) => {
    if (d.t !== "i") return null;
    // The ancestor sits beside the dogs, between them and the wolves they split from.
    const kids = opts.withAncestor && d.id === DOG_FORK ? [d.c[0], ANCESTOR_NODE, ...d.c.slice(1)] : d.c;
    return flipped.has(d.id) ? [...kids].reverse() : kids;
  }) as TNode;

  const leaves = root.leaves() as TNode[];
  const show = !!opts.showAncestor;
  const total = leaves.reduce((s, l) => s + leafWeight(l.data, show), 0);
  const span = 2 * Math.PI - GAP;
  let acc = GAP / 2;
  for (const l of leaves) {
    const w = (leafWeight(l.data, show) / total) * span;
    l.a0 = acc;
    l.a1 = acc + w;
    l.a = acc + w / 2;
    acc += w;
  }

  const maxDepth = Math.max(...root.descendants().filter((d) => d.children).map((d) => d.depth));
  // Gentle power scale: the caterpillar-like backbone near the root stays compact
  // while the dense branching near the rim gets room.
  const rOf = (depth: number) => GEOM.rTree * Math.pow(depth / maxDepth, 0.82);

  root.eachAfter((n) => {
    const t = n as TNode;
    t.r = rOf(t.depth);
    if (t.children) {
      const kids = t.children as TNode[];
      t.a = (kids[0].a + kids[kids.length - 1].a) / 2;
    }
  });

  const nodes = root.descendants() as TNode[];
  return { root, nodes, leaves, byId: new Map(nodes.map((n) => [n.data.id, n])) };
}

export const isLeaf = (n: TNode): n is TNode & { data: Extract<RawNode, { t: "b" }> } =>
  n.data.t === "b";

export function cladeOf(code: string) {
  return data.breeds[code]?.clade ?? null;
}

/** Most recent common ancestor of every main-fragment wedge of the given breeds. */
export function mrca(nodes: TNode[], codes: string[]): TNode | null {
  const targets = nodes.filter((n) => isLeaf(n) && codes.includes(n.data.code) && n.data.main);
  if (!targets.length) return null;
  let anc = targets[0].ancestors() as TNode[];
  for (const t of targets.slice(1)) {
    const set = new Set(t.ancestors());
    anc = anc.filter((a) => set.has(a));
  }
  return anc[0] ?? null;
}

/** Order-independent id lookups resolved against a fresh, unflipped layout. */
const base = layout();
export function nodeIdOf(codes: string[]) {
  return mrca(base.nodes, codes)?.data.id ?? -1;
}
export const ringOrder = base.leaves.map((l) => (l.data as { code: string }).code);
