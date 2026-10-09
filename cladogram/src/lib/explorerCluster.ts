import { forceCollide, forceSimulation, forceX, forceY, type HierarchyNode } from "d3";
import { data, isLeaf, layout, type RawNode } from "./tree";
import { BREEDS, EX, type ExBreed } from "./explorer";

/**
 * The "Clustered" Breed Explorer view: every photo in one round mosaic, laid out like
 * the radial family tree. Each breed's anchor takes its angle from the cladogram and its
 * distance from the centre from how early its lineage branches off, putting the oldest
 * lineages next to a grey-wolf hub in the middle. Breeds are then clustered by family
 * group: each group becomes one solid blob (a collision simulation keeps the blobs
 * apart), sliced like a pie so every breed gets a wedge next to its closest relatives.
 */

/** Dog CEO breeds outside the study sit beside their closest study breed. */
const PROXY: Record<string, string> = {
  affenpinscher: "MPIN", appenzeller: "GSMD", "bakharwal/indian": "TIBM", bluetick: "REDB", brabancon: "BRUS",
  "buhund/norwegian": "NELK", cavapoo: "CKCS", "chippiparai/indian": "SALU", clumber: "ESSP", cockapoo: "ACKR",
  coonhound: "REDB", "danishswedish/farmdog": "MPIN", entlebucher: "BMD", "finnish/lapphund": "FINS",
  "gaddi/indian": "TIBM", "greyhound/indian": "SALU", "hound/plott": "REDB", "hound/walker": "FOXH",
  kombai: "BSJI", labradoodle: "LAB", "mastiff/indian": "MAST", "mudhol/indian": "SALU",
  "ovcharka/caucasian": "ANAT", "pariah/indian": "BSJI", pitbull: "AMST", "pointer/germanlonghair": "GSHP",
  "poodle/medium": "SPOO", puggle: "PUG", "rajapalayam/indian": "SALU", "retriever/chesapeake": "CCRT",
  "segugio/italian": "FOXH", "sheepdog/indian": "TIBM", "spaniel/sussex": "FIEL", "spaniel/welsh": "ESSP",
  "spitz/indian": "POM", "spitz/japanese": "SAMO", "terrier/andalusian": "JACK", "terrier/dandie": "BEDT",
  "terrier/lakeland": "WFOX", "terrier/patterdale": "BORT", "terrier/sealyham": "CAIR", "terrier/toy": "MNTY",
  "terrier/welsh": "AIRT", "waterdog/spanish": "PTWD",
};

/** Cells kept empty in the middle for the grey-wolf hub. */
export const HUB = 7;

type Seg = [number, number, number, number];

function build() {
  const N = EX.total;
  const base = layout();
  const leafOf = new Map<string, HierarchyNode<RawNode> & { a: number }>();
  for (const l of base.leaves) if (isLeaf(l) && l.data.main) leafOf.set(l.data.code, l);
  const depthOf = (code: string) => leafOf.get(code)!.depth;
  const studyCodes = [...leafOf.keys()].filter((c) => c !== "GDJK" && c !== "WOLF");
  const dMin = Math.min(...studyCodes.map(depthOf));
  const dMax = Math.max(...studyCodes.map(depthOf));
  const R = Math.sqrt((N + Math.PI * HUB * HUB) / Math.PI);
  const polar = (a: number, r: number) => [r * Math.sin(a), -r * Math.cos(a)] as const;
  const wolfAngle = leafOf.get("WOLF")!.a;

  // ---------- anchors (one per breed) ----------
  const anchor = BREEDS.map((b, i) => {
    const code = b.code ?? PROXY[b.path];
    let a: number, rad: number;
    if (b.family === "_wild") {
      a = wolfAngle + (i % 3) * 0.9 - 0.9; // wild relatives ring the wolf hub
      rad = HUB + 3;
    } else if (b.path === "mix") {
      a = 0; // the gap at the top of the tree
      rad = R * 0.92;
    } else {
      a = leafOf.get(code!)!.a + (b.code ? 0 : 0.0001); // non-study breeds just after their relative
      const t = (depthOf(code!) - dMin) / (dMax - dMin);
      rad = HUB + 4 + (R * 0.9 - HUB - 4) * Math.pow(t, 0.85);
    }
    return { a, rad, code };
  });

  // ---------- groups: each family group packs as one blob ----------
  // Breeds outside the study join their closest relative's family; loners stand alone.
  const groupKey = (b: ExBreed, i: number) => {
    if (b.family === "_wild") return "_wild";
    if (b.path === "mix") return "_mix";
    const code = anchor[i].code!;
    return data.breeds[code]?.clade ?? `_loner:${code}`;
  };
  type Group = { key: string; members: number[]; n: number; r: number; ax: number; ay: number; x: number; y: number; rank: number };
  const groups = new Map<string, Group>();
  BREEDS.forEach((b, i) => {
    const k = groupKey(b, i);
    const g = groups.get(k) ?? groups.set(k, { key: k, members: [], n: 0, r: 0, ax: 0, ay: 0, x: 0, y: 0, rank: 0 }).get(k)!;
    g.members.push(i);
  });
  for (const g of groups.values()) {
    let sx = 0, sy = 0, sr = 0;
    for (const i of g.members) {
      const w = BREEDS[i].files.length;
      const [x, y] = polar(anchor[i].a, anchor[i].rad);
      sx += x * w;
      sy += y * w;
      sr += anchor[i].rad * w;
      g.n += w;
    }
    g.ax = g.x = sx / g.n;
    g.ay = g.y = sy / g.n;
    g.rank = sr / g.n;
    g.r = Math.sqrt(g.n / Math.PI);
    // Members in family-tree order, so each breed gets a neighbouring slice.
    g.members.sort((p, q) => anchor[p].a - anchor[q].a);
  }
  const nodes = [...groups.values()];

  // ---------- keep the blobs apart, near their anchors ----------
  const sim = forceSimulation(nodes)
    .force("x", forceX<Group>((d) => d.ax).strength(0.2))
    .force("y", forceY<Group>((d) => d.ay).strength(0.2))
    .force("collide", forceCollide<Group>((d) => d.r + 2).iterations(4))
    .force("hub", () => {
      for (const n of nodes) {
        const d = Math.hypot(n.x, n.y) || 1;
        const min = HUB + n.r + 1.5;
        if (d < min) {
          n.x *= min / d;
          n.y *= min / d;
        }
      }
    })
    .stop();
  for (let i = 0; i < 400; i++) sim.tick();

  // ---------- pack: each blob takes the free cells nearest its centre ----------
  const gx = new Int16Array(N), gy = new Int16Array(N);
  const taken = new Set<number>();
  const key = (x: number, y: number) => (x + 2000) * 4000 + (y + 2000);
  for (const g of [...nodes].sort((p, q) => p.rank - q.rank)) {
    const cx = Math.round(g.x), cy = Math.round(g.y);
    let h = Math.ceil(g.r) + 2;
    let picks: [number, number, number][] = [];
    for (;;) {
      picks = [];
      for (let y = cy - h; y <= cy + h; y++) {
        for (let x = cx - h; x <= cx + h; x++) {
          if (Math.hypot(x, y) < HUB || taken.has(key(x, y))) continue;
          picks.push([x, y, (x - g.x) ** 2 + (y - g.y) ** 2]);
        }
      }
      if (picks.length >= g.n) break;
      h += 3;
    }
    picks.sort((p, q) => p[2] - q[2]);
    const cells = picks.slice(0, g.n);
    for (const [x, y] of cells) taken.add(key(x, y));
    // Slice the blob like a pie, in family-tree order, starting from the side facing the hub.
    let mx = 0, my = 0;
    for (const [x, y] of cells) {
      mx += x;
      my += y;
    }
    mx /= cells.length;
    my /= cells.length;
    const face = Math.atan2(-my, -mx);
    const ang = (x: number, y: number) => {
      let t = Math.atan2(y - my, x - mx) - face;
      while (t < 0) t += 2 * Math.PI;
      return t;
    };
    cells.sort((p, q) => ang(p[0], p[1]) - ang(q[0], q[1]));
    let k = 0;
    for (const i of g.members) {
      const b = BREEDS[i];
      // Within a slice, photos run from the blob's centre outward.
      const slice = cells.slice(k, k + b.files.length).sort((p, q) => (p[0] - mx) ** 2 + (p[1] - my) ** 2 - (q[0] - mx) ** 2 - (q[1] - my) ** 2);
      slice.forEach(([x, y], j) => {
        gx[b.start + j] = x;
        gy[b.start + j] = y;
      });
      k += b.files.length;
    }
  }

  // ---------- centroids ----------
  const centroid = (bs: ExBreed[]) => {
    let sx = 0, sy = 0, c = 0;
    for (const b of bs) for (let k = 0; k < b.files.length; k++) {
      sx += gx[b.start + k];
      sy += gy[b.start + k];
      c++;
    }
    return { x: sx / c, y: sy / c, n: c };
  };
  // One label per blob: family groups, loner breeds, wild relatives, mixed breeds.
  const labels = nodes.map((g) => {
    const c = centroid(g.members.map((i) => BREEDS[i]));
    const title = g.key === "_wild" ? "Wild relatives"
      : g.key === "_mix" ? "Mixed breeds"
      : g.key.startsWith("_loner:") ? data.breeds[g.key.slice(7)].name
      : data.clades[g.key];
    const breeds = g.key === "_wild" || g.key === "_mix" ? 0 : g.members.length;
    return { title, ...c, breeds };
  });
  const breedCentre = new Map<string, { x: number; y: number }>();
  for (const b of BREEDS) if (b.code) breedCentre.set(b.code, centroid([b]));

  // ---------- the family tree drawn over the clusters, rooted at the wolf hub ----------
  const top = base.nodes
    .filter((n) => n.children && n.leaves().some((l) => (l.data as { code?: string }).code === "WOLF") &&
      !n.leaves().some((l) => (l.data as { code?: string }).code === "GDJK"))
    .sort((p, q) => q.leaves().length - p.leaves().length)[0];
  const maxDepth = Math.max(...top.leaves().map((l) => l.depth));
  const pos = new Map<HierarchyNode<RawNode>, { x: number; y: number }>();
  top.eachAfter((n) => {
    if (!n.children) {
      const c = (n.data as { code: string; main: boolean });
      if (c.code === "WOLF") pos.set(n, { x: 0, y: 0 });
      else if (c.main && breedCentre.has(c.code)) pos.set(n, breedCentre.get(c.code)!);
      return;
    }
    const kids = n.children.filter((k) => pos.has(k));
    if (!kids.length) return;
    let sx = 0, sy = 0, w = 0;
    for (const k of kids) {
      const p = pos.get(k)!;
      const wt = k.leaves().length;
      sx += p.x * wt;
      sy += p.y * wt;
      w += wt;
    }
    // Pull forks toward the hub the further back they are.
    const f = n === top ? 0 : Math.pow((n.depth - top.depth) / (maxDepth - top.depth), 0.55);
    pos.set(n, { x: (sx / w) * f, y: (sy / w) * f });
  });
  const tree: Seg[] = [];
  top.each((n) => {
    if (!n.parent || !pos.has(n) || !pos.has(n.parent) || n === top) return;
    const p = pos.get(n.parent)!, c = pos.get(n)!;
    tree.push([p.x, p.y, c.x, c.y]);
  });

  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  for (let i = 0; i < N; i++) {
    if (gx[i] < minX) minX = gx[i];
    if (gx[i] > maxX) maxX = gx[i];
    if (gy[i] < minY) minY = gy[i];
    if (gy[i] > maxY) maxY = gy[i];
  }
  return { gx, gy, labels, tree, bounds: { minX, maxX, minY, maxY } };
}

let cache: ReturnType<typeof build> | null = null;
export const clusterCells = () => (cache ??= build());
