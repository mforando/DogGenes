"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as d3 from "d3";
import { CGEOM, circosData, cladeArcs, layoutLinks, links, nodeByCode, nodes, partnersOf, rawLinkByKey, type CEnd, type CLink, type CNode } from "@/lib/circos";
import { photoOf } from "@/lib/photos";
import { factsHtml } from "@/lib/breedFacts";
import { circosTree, elbow, treeCodeOf, type CTNode } from "@/lib/circosTree";
import { descendantsOf } from "@/lib/pairs";
import { LIGHT, tone } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { dockCladeSender, dockPinner } from "@/lib/dockPin";
import { hoverGate, STEP_CHANGE } from "@/lib/hoverGate";
import { cladeMembers, cladeOf, cladeTipHtml, cladesOf, relatedClades, relatedToClade } from "@/lib/ringClades";
import { GEOM, data as treeData, isLeaf, layout as treeLayout } from "@/lib/tree";
import { puppySwatchHtml } from "@/lib/puppyGlyph";
import { getPanelFocus, panelBreed, subscribePanelFocus } from "@/lib/panelFocus";

/** How long the ring takes to glide between the tree's layout and the chords' (ms). */
export const MORPH_MS = 1100;
/** Entering the chords, the glide waits for the tree's lines to fade (ms). */
const MORPH_IN_DELAY = 380;
/** Leaving the chords, the glide waits for the ribbons to fade (ms); the page holds the chords this long plus MORPH_MS. */
export const MORPH_OUT_DELAY = 150;

/**
 * Where the family tree (default layout) draws each breed and family, in the chord diagram's
 * terms: a breed's wedge and label angle, and each family's band and name tier. Used to start
 * the chords from the tree's pose (and return to it), so every mark keeps its identity.
 */
type TreePose = { byCode: Map<string, { a0: number; a1: number; a: number }>; clades: Map<string, { a0: number; a1: number; mid: number; tier: number }> };
const treePose = (() => {
  const cache = new Map<boolean, TreePose>();
  /** `ancestor`: the tree step shows the hypothetical common ancestor's wedge ("The missing link"). */
  return (ancestor: boolean): TreePose => {
    const hit = cache.get(ancestor);
    if (hit) return hit;
    const L = treeLayout(new Set(), { withAncestor: true, showAncestor: ancestor });
    const byCode = new Map<string, { a0: number; a1: number; a: number }>();
    const spans: { clade: string; a0: number; a1: number }[] = [];
    for (const l of L.leaves) {
      if (!isLeaf(l)) continue;
      const code = l.data.code;
      if (l.data.main) byCode.set(code, { a0: l.a0, a1: l.a1, a: l.a });
      const c = treeData.breeds[code]?.clade;
      if (!c) continue;
      const last = spans[spans.length - 1];
      if (last && last.clade === c) last.a1 = l.a1;
      else spans.push({ clade: c, a0: l.a0, a1: l.a1 });
    }
    // The tree's name tiers (as in Cladogram's assignTiers); a family split in two keeps its larger span.
    const placed: { lo: number; hi: number; tier: number }[] = [];
    const clades = new Map<string, { a0: number; a1: number; mid: number; tier: number }>();
    for (const sp of spans) {
      const mid = (sp.a0 + sp.a1) / 2;
      const half = (treeData.clades[sp.clade].length * 7.4) / GEOM.rCladeName / 2 + 0.02;
      let tier = 0;
      while (placed.some((p) => p.tier === tier && mid - half < p.hi && mid + half > p.lo)) tier++;
      placed.push({ lo: mid - half, hi: mid + half, tier });
      const prev = clades.get(sp.clade);
      if (!prev || sp.a1 - sp.a0 > prev.a1 - prev.a0) clades.set(sp.clade, { ...sp, mid, tier });
    }
    const pose = { byCode, clades };
    cache.set(ancestor, pose);
    return pose;
  };
})();
/** `a` shifted by whole turns to lie nearest `to`, so a glide takes the short way round. */
const nearTurn = (a: number, to: number) => a + 2 * Math.PI * Math.round((to - a) / (2 * Math.PI));
const TAU = 2 * Math.PI;
const norm = (a: number) => ((a % TAU) + TAU) % TAU;

/** What the circos figure should emphasise. */
export type CircosView = {
  /** Which ribbons to draw. */
  ribbons: "none" | "all" | { codes: string[] } | { keys: string[] };
  /** Breeds to emphasise (segments + labels). */
  focus?: string[];
  /** Clades to emphasise. */
  clades?: string[];
  /** Emphasise breeds with no cross-clade ribbons. */
  silent?: boolean;
  /** Show the clade-name ring. */
  cladeRing?: boolean;
  /** Families to bring forward on the ring (the rest fade); all of them when absent. */
  ring?: string[];
  /** Hovering a segment isolates its ribbons. */
  interactive?: boolean;
  /** Mark where the ring starts and which way it runs. */
  start?: boolean;
  /** Draw the family tree inside the ring; hovering traces paths through it. */
  tree?: boolean;
  /** Breed whose path back to the grey wolf is traced when nothing is hovered. */
  treePath?: string | null;
  /** A selection is locked in: hovering no longer changes the chart or the details. */
  frozen?: boolean;
};

let INK = "#e9e2d0";
/** Sister groups up to this many breeds get white lines all the way to their blocks. */
const RELATIVE_LIMIT = 6;
let GOLD = "#e8b74a";
let DIM = "#2c3430";
/** Labels of breeds that share DNA with the selected breed (full chart). */
let CYAN = "#5fd3e2";
const W = CGEOM.size;
const mb = (v: number) => `${(v / 1e6).toFixed(1)} Mb`;
const pol = (a: number, r: number): [number, number] => [r * Math.sin(a), -r * Math.cos(a)];
/** Ring labels stop at three words ("Nova Scotia Duck…") so the circle can be bigger. */
const shortName = (name: string) => {
  const w = name.split(/\s+/);
  return w.length > 3 ? `${w.slice(0, 3).join(" ")}…` : name;
};

function cladeLabel(n: CNode) {
  if (n.code === "WOLF") return "Wild relative";
  return n.clade ? circosData.clades[n.clade] : "Loner (no clear family)";
}

/** What the pointer (or keyboard focus) is on, for pages that show details outside the chart. */
export type CircosHover =
  | { kind: "breed"; code: string }
  | { kind: "ribbon"; key: string }
  | { kind: "clade"; clade: string }
  | null;

export default function Circos({
  view,
  ariaLabel,
  onHover,
  onBreedClick,
  onBackgroundClick,
  onCladeClick,
  spotlight = null,
  spotlightClade = null,
  tipDock,
  compact = false,
  shown,
  treeAncestor = false,
}: {
  view: CircosView;
  ariaLabel?: string;
  /** When given, hover details go to the page instead of a floating tooltip. */
  onHover?: (h: CircosHover) => void;
  /** Clicking (or pressing Enter on) a breed's block. */
  onBreedClick?: (code: string) => void;
  /** Clicking anywhere else on the chart. */
  onBackgroundClick?: () => void;
  /** Clicking a family's band or name (where the page keeps its own selection). */
  onCladeClick?: (clade: string) => void;
  /** Breed highlighted from outside the chart (e.g. hovering its photo), shown like a hover. */
  spotlight?: string | null;
  /** Family highlighted from outside the chart (its name hovered in the story text), shown like a family hover. */
  spotlightClade?: string | null;
  /** Show the tooltip in this element (a fixed panel beside the chart) instead of at the pointer. */
  tipDock?: RefObject<HTMLElement | null>;
  /** Phone-size screens: crop to the ring of breed blocks (no name labels or family band). */
  compact?: boolean;
  /**
   * In the story, whether the chords are the chart on screen. Turning it on glides every
   * breed and family from the family tree's layout to the chords' (and off, back again).
   */
  shown?: boolean;
  /** The neighbouring tree step shows the hypothetical-ancestor wedge (its layout shifts slightly). */
  treeAncestor?: boolean;
}) {
  const treeAncestorRef = useRef(treeAncestor);
  treeAncestorRef.current = treeAncestor;
  const onBreedClickRef = useRef(onBreedClick);
  onBreedClickRef.current = onBreedClick;
  const onBgClickRef = useRef(onBackgroundClick);
  onBgClickRef.current = onBackgroundClick;
  const onCladeClickRef = useRef(onCladeClick);
  onCladeClickRef.current = onCladeClick;
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ update: (v: CircosView) => void; spot: (code: string | null) => void; spotClade: (clade: string | null) => void; morph: (dir: "in" | "out", fromHidden: boolean) => void } | null>(null);
  // What's on screen, so a rebuild (theme switch) can restyle to match at once.
  const viewRef = useRef(view);
  viewRef.current = view;
  const spotRef = useRef(spotlight);
  spotRef.current = spotlight;
  const spotCladeRef = useRef(spotlightClade);
  spotCladeRef.current = spotlightClade;
  const built = useRef(false);
  const compactRef = useRef(compact);
  compactRef.current = compact;

  const theme = useTheme(); // rebuild when the light/dark switch changes
  useEffect(() => {
    INK = tone("#e9e2d0", LIGHT.ink);
    DIM = tone("#2c3430", LIGHT.dim);
    CYAN = tone("#5fd3e2", LIGHT.cyan);
    GOLD = tone("#e8b74a", LIGHT.gold);
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FULL = reduce ? 0 : 750;
    let DUR = FULL; // 0 while restyling instantly after a theme switch

    const svg = d3.select(el).append("svg")
      .attr("viewBox", `${-W / 2} ${-W / 2} ${W} ${W}`)
      .attr("role", "group")
      .attr("aria-label", ariaLabel ?? "Circos plot of haplotype sharing between dog breeds from different clades.");

    const defs = svg.append("defs");
    const halo = defs.append("radialGradient").attr("id", "c-halo");
    halo.append("stop").attr("offset", "0%").attr("stop-color", tone("#18211d", LIGHT.raise));
    halo.append("stop").attr("offset", "100%").attr("stop-color", tone("#0d1110", LIGHT.bg)).attr("stop-opacity", 0);
    svg.append("circle").attr("r", CGEOM.rOut + 40).attr("fill", "url(#c-halo)");

    // Family tree (under the ribbons) and its highlighted paths (over them).
    const gTree = svg.append("g").attr("class", "ctree").attr("fill", "none").attr("opacity", 0);
    gTree.selectAll("path")
      .data(circosTree.nodes.filter((n) => n.parent))
      .join("path")
      .attr("d", (n) => elbow((n.parent as CTNode).a, (n.parent as CTNode).r, n.a, n.r))
      .attr("stroke", INK).attr("stroke-opacity", 0.22).attr("stroke-width", 0.7);
    const gRibbons = svg.append("g").attr("class", "ribbons");
    const gTreeHi = svg.append("g").attr("class", "ctree-hi").attr("fill", "none").attr("pointer-events", "none");
    const gSegs = svg.append("g").attr("class", "segs");
    const gLabels = svg.append("g").attr("class", "codes");
    const gClade = svg.append("g").attr("class", "clade-ring").attr("opacity", 0);
    // The side panel, read once: in development React empties refs before an effect's cleanup
    // runs, and the cleanup must take its listeners off the same element they were put on.
    const dock = tipDock?.current ?? null;
    // In the story (details go to the side panel), a hover always takes over the chart.
    const hoverLeads = () => !!dock && !onHoverRef.current;
    const tip = d3.select(dock ?? el).append("div").attr("class", "tip").attr("role", "status");
    // Click a breed or ribbon to pin its details in the side panel (then scroll the panel); see
    // dockPin.ts. Only where the chart reports to the panel: other pages lock on click already.
    const gate = hoverGate();
    // Families get the full "Family group" panel, which the page draws in the side panel.
    const cladePanel = dockCladeSender(dock);
    const pinner = dockPinner(
      dock,
      "circos",
      () => {
        tip.classed("on", false);
        hover = null;
        hoverRibbon = null;
        hoverClade = null;
        cladePanel(null);
        gRibbons.classed("dim", false).selectAll("path").classed("hot", false);
        render();
      },
      () => !compactRef.current && !onBreedClickRef.current && !onHoverRef.current,
    );

    const arc = d3.arc<{ a0: number; a1: number }>()
      .innerRadius(CGEOM.rIn + 2).outerRadius(CGEOM.rOut)
      .startAngle((d) => d.a0).endAngle((d) => d.a1);
    type Geo = { s0: number; s1: number; t0: number; t1: number };
    const ribbon = d3.ribbon<Geo, { a0: number; a1: number }>()
      .source((d) => ({ a0: d.s0, a1: d.s1 })).target((d) => ({ a0: d.t0, a1: d.t1 }))
      .startAngle((d) => d.a0).endAngle((d) => d.a1)
      .radius(CGEOM.rIn);
    const geoOf = (l: { source: CEnd; target: CEnd }): Geo => ({
      s0: l.source.a0, s1: l.source.a1, t0: l.target.a0, t1: l.target.a1,
    });

    // "Start" marker beside the wolf, pointing counter-clockwise.
    defs.append("marker").attr("id", "arrowhead").attr("viewBox", "0 0 10 10").attr("refX", 6).attr("refY", 5)
      .attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto-start-reverse")
      .append("path").attr("d", "M0,0L10,5L0,10z").attr("fill", GOLD);
    const wolf = nodeByCode.get("WOLF")!;
    const gStart = svg.append("g").attr("class", "start-mk").attr("opacity", 0);
    {
      const r = CGEOM.rIn - 16;
      const a0 = wolf.mid, a1 = wolf.mid - 0.32;
      const [x0, y0] = pol(a0, r), [x1, y1] = pol(a1, r);
      gStart.append("path").attr("fill", "none").attr("stroke", GOLD).attr("stroke-width", 1.6)
        .attr("marker-end", "url(#arrowhead)")
        .attr("d", `M${x0},${y0}A${r},${r} 0 0 0 ${x1},${y1}`);
      const [tx, ty] = pol(a0 + 0.02, r - 18);
      gStart.append("text").attr("class", "start-label").attr("x", tx).attr("y", ty).attr("text-anchor", "end").text("start");
    }

    // ---------- segments & labels ----------
    const segSel = gSegs.selectAll<SVGPathElement, CNode>("path")
      .data(nodes, (d) => d.code)
      .join("path")
      .attr("d", (d) => arc(d))
      .attr("fill", (d) => d.color)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${d.name}, ${cladeLabel(d)}, ${d.degree} connections to other families`);

    const labelSel = gLabels.selectAll<SVGTextElement, CNode>("text")
      .data(nodes, (d) => d.code)
      .join("text")
      .attr("dy", "0.33em")
      .attr("text-anchor", (d) => labelAnchor(d.mid))
      .attr("transform", (d) => labelAt(d.mid))
      .text((d) => shortName(d.name));

    // ---------- clade ring ----------
    function labelAnchor(mid: number) {
      return norm(mid) > Math.PI ? "end" : "start";
    }
    function labelAt(mid: number) {
      const a = norm(mid);
      return `rotate(${(a * 180) / Math.PI - 90}) translate(${CGEOM.rLabel},0)${a > Math.PI ? " rotate(180)" : ""}`;
    }
    function namePath(mid: number, tier: number) {
      const m = norm(mid);
      const bottom = m > Math.PI / 2 && m < (3 * Math.PI) / 2;
      const r = CGEOM.rCladeName + tier * 17 + (bottom ? 9 : 0);
      const [x0, y0] = pol(bottom ? mid + 0.6 : mid - 0.6, r);
      const [x1, y1] = pol(bottom ? mid - 0.6 : mid + 0.6, r);
      return `M${x0},${y0}A${r},${r} 0 0 ${bottom ? 0 : 1} ${x1},${y1}`;
    }
    const bandArc = d3.arc<{ a0: number; a1: number }>()
      .innerRadius(CGEOM.rClade0).outerRadius(CGEOM.rClade1)
      .startAngle((d) => d.a0).endAngle((d) => d.a1);
    const bandSel = gClade.selectAll<SVGPathElement, (typeof cladeArcs)[number]>("path.band").data(cladeArcs).join("path").attr("class", "band")
      .attr("d", (d) => bandArc(d)).attr("fill", (d) => nodes.find((n) => n.clade === d.clade)!.color);
    // Tiered names so short neighbouring clades don't overprint.
    const placed: { lo: number; hi: number; tier: number }[] = [];
    const named = cladeArcs.map((c) => {
      const mid = (c.a0 + c.a1) / 2;
      const half = (circosData.clades[c.clade].length * 6.6) / CGEOM.rCladeName / 2 + 0.02;
      let tier = 0;
      while (placed.some((p) => p.tier === tier && mid - half < p.hi && mid + half > p.lo)) tier++;
      placed.push({ lo: mid - half, hi: mid + half, tier });
      return { ...c, mid, tier };
    });
    const tpSel = gClade.selectAll<SVGPathElement, (typeof named)[number]>("path.tp").data(named).join("path").attr("class", "tp").attr("fill", "none")
      .attr("id", (d) => `ctp-${d.clade}`)
      .attr("d", (d) => namePath(d.mid, d.tier));
    gClade.selectAll("text").data(named).join("text").attr("class", "clade-name")
      .append("textPath").attr("href", (d) => `#ctp-${d.clade}`)
      .attr("startOffset", "50%").attr("text-anchor", "middle")
      .text((d) => circosData.clades[d.clade]);
    // With an onHover handler (the full chart), each family's band and name can be hovered.
    const hitArc = (d: (typeof named)[number]) => {
      const band = d3.arc()({ innerRadius: CGEOM.rClade0 - 5, outerRadius: CGEOM.rLabel, startAngle: d.a0, endAngle: d.a1 }) ?? "";
      const half = Math.max((circosData.clades[d.clade].length * 6.6) / CGEOM.rCladeName / 2 + 0.02, (d.a1 - d.a0) / 2);
      const r = CGEOM.rCladeName + d.tier * 17;
      const name = d3.arc()({ innerRadius: r - 14, outerRadius: r + 24, startAngle: d.mid - half, endAngle: d.mid + half }) ?? "";
      return band + name;
    };
    const cladeHits = gClade.selectAll("path.clade-hit").data(onHoverRef.current || hoverLeads() ? named : []).join("path")
      .attr("class", "clade-hit").attr("d", (d) => hitArc(d)).attr("fill", "transparent")
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (d) => `${circosData.clades[d.clade]} family: show its tree and DNA sharing`)
      .on("pointerenter focus", (ev: PointerEvent | FocusEvent, d) => {
        if (!gate.ok() || pinner.busy) return;
        gClade.selectAll<SVGPathElement, { clade: string }>("path.band").classed("hover", (b) => b.clade === d.clade);
        onHoverRef.current?.({ kind: "clade", clade: d.clade });
        if (hoverLeads()) {
          hoverClade = d.clade;
          showCladeTip(ev, d.clade);
          render();
        }
      })
      .on("pointermove", (ev: PointerEvent, d) => {
        if (hoverLeads() && gate.ok()) showCladeTip(ev, d.clade);
      })
      .on("pointerleave blur", () => {
        if (pinner.busy) return;
        gClade.selectAll("path.band").classed("hover", false);
        onHoverRef.current?.(null);
        if (hoverLeads() && hoverClade) {
          hoverClade = null;
          tip.classed("on", false);
          cladePanel(null);
          render();
        }
      })
      .on("click.pin", (ev: MouseEvent, d) => {
        if (onCladeClickRef.current) {
          ev.stopPropagation();
          onCladeClickRef.current(d.clade);
          return;
        }
        if (!pinner.can()) return;
        ev.stopPropagation();
        if (!pinner.toggle(`clade:${d.clade}`)) return;
        hoverClade = d.clade;
        showCladeTip(ev, d.clade);
        render();
      });

    // ---------- state ----------
    let current: CircosView = { ribbons: "none" };
    let hover: string | null = null;
    // An outside highlight; wins over the pointer. Either a breed pointed at in a family's
    // panel (its tree or stretched chord), or one the page names (a photo or the text).
    let propSpot: string | null = null;
    let panelSpot: string | null = null;
    let spot: string | null = null;
    const syncSpot = () => {
      spot = panelSpot ?? propSpot;
    };
    let spotClade: string | null = null; // a family named in the text; wins over the pointer, not over a breed spot
    const active = (v: CircosView) => spot ?? (spotClade ? null : v.interactive || hoverLeads() ? hover : null);
    let hoverRibbon: CLink | null = null;
    let hoverClade: string | null = null; // a family band or name under the pointer (story only)

    /** Trace tree paths: a breed back to the grey wolf, or two breeds to their meeting point. */
    /** Breeds (tree codes) on white relative lines of the traced breed's path to the wolf. */
    let relatives = new Set<string>();
    function drawTreePaths(v: CircosView) {
      relatives = new Set();
      type Seg = { key: string; n: CTNode; color: string; w: number; stub?: boolean };
      const segs: Seg[] = [];
      const marks: { key: string; n: CTNode; label: string }[] = [];
      const leafOf = (c: string) => circosTree.mainLeaf.get(treeCodeOf(c));
      const trace = (a: CTNode, b: CTNode, colA: string, colB: string, label: string) => {
        const path = a.path(b) as CTNode[];
        const top = path.reduce((x, y) => (y.depth < x.depth ? y : x));
        const iTop = path.indexOf(top);
        path.forEach((n, i) => {
          if (n === top) return;
          segs.push({ key: `${n.data.id}`, n, color: i < iTop ? colA : colB, w: i < iTop ? 2.6 : 1.8 });
        });
        marks.push({ key: `m${top.data.id}`, n: top, label });
      };
      if (v.tree) {
        const breed = active(v) || (!hoverRibbon && v.treePath) || null;
        if (hoverRibbon) {
          const a = leafOf(hoverRibbon.a), b = leafOf(hoverRibbon.b);
          if (a && b) trace(a, b, GOLD, GOLD, "lines meet");
        } else if (breed && breed !== "WOLF") {
          const a = leafOf(breed), w = circosTree.mainLeaf.get("WOLF");
          if (a && w) {
            trace(a, w, GOLD, INK, "split from wolves");
            // Branches out to the relatives that split off along the breed's line.
            const self = treeCodeOf(breed);
            const skip = new Set([self, ...descendantsOf(self)]);
            const top = (a.path(w) as CTNode[]).reduce((x, y) => (y.depth < x.depth ? y : x));
            const onPath = new Set(a.ancestors());
            const codesOf = (n: CTNode) => [...new Set(n.leaves().map((l) => (l.data as { code: string }).code))];
            for (const anc of a.ancestors().slice(1) as CTNode[]) {
              for (const sis of (anc.children as CTNode[]).filter((c) => !onPath.has(c))) {
                if (sis.leaves().some((l) => (l.data as { code: string }).code === "WOLF")) continue; // drawn by trace
                const kin = codesOf(sis).filter((c) => !skip.has(c));
                if (!kin.length) continue;
                if (kin.length > RELATIVE_LIMIT) {
                  // A whole swathe of the tree: a short stub to where it branches off.
                  segs.push({ key: `w${sis.data.id}`, n: sis, color: INK, w: 1, stub: true });
                  continue;
                }
                kin.forEach((c) => relatives.add(c));
                for (const n of sis.descendants() as CTNode[]) {
                  if (codesOf(n).every((c) => skip.has(c))) continue;
                  segs.push({ key: `w${n.data.id}`, n, color: INK, w: 1 });
                }
              }
              if (anc === top) break;
            }
          }
        }
      }
      gTreeHi.selectAll<SVGPathElement, Seg>("path")
        .data(segs, (d) => d.key)
        .join("path")
        .sort((x, y) => (x.color === GOLD ? 1 : 0) - (y.color === GOLD ? 1 : 0))
        .attr("d", (d) => {
          const p = d.n.parent as CTNode;
          // Stubs stop a little way out so they read as "a big group branches off here".
          return elbow(p.a, p.r, d.n.a, d.stub ? p.r + Math.min(18, (d.n.r - p.r) * 0.6) : d.n.r);
        })
        .attr("stroke-dasharray", (d) => (d.stub ? "2 3" : null))
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", (d) => d.w)
        .attr("stroke-linecap", "round")
        // Relatives keep the tree's own line colour, just firmer than the faint background tree.
        .attr("stroke-opacity", (d) => (d.color === INK ? 0.6 : 0.95));
      // While a path is traced, hide the rest of the tree so only the relatives remain.
      gTree.classed("traced", segs.length > 0);
      const m = gTreeHi.selectAll<SVGGElement, (typeof marks)[number]>("g.ct-mark")
        .data(marks, (d) => d.key)
        .join((enter) => {
          const g = enter.append("g").attr("class", "ct-mark");
          g.append("circle").attr("r", 9).attr("class", "ct-pulse");
          g.append("circle").attr("r", 4.5).attr("fill", GOLD).attr("stroke", tone("#0d1110", LIGHT.bg)).attr("stroke-width", 1.5);
          g.append("text").attr("class", "ct-label").attr("dy", "-0.9em").attr("text-anchor", "middle");
          return g;
        })
        .attr("transform", (d) => `translate(${pol(d.n.a, d.n.r).join(",")})`);
      m.select("text").text((d) => d.label);
    }

    function visibleLinks(v: CircosView): CLink[] {
      const r = v.ribbons;
      if (r === "none") return [];
      if (r === "all") return links;
      const keys =
        "codes" in r
          ? links.filter((l) => r.codes.includes(l.a) || r.codes.includes(l.b)).map((l) => l.key)
          : r.keys;
      return layoutLinks(keys.map((k) => rawLinkByKey.get(k)!).filter(Boolean));
    }

    /** The family ring: the hovered breed's families, or a hovered ribbon's, else the step's. */
    function styleRing() {
      const h = active(current);
      const set = h
        ? relatedClades(h)
        : spotClade && !spot
          ? relatedToClade(spotClade)
          : hoverRibbon
          ? cladesOf([hoverRibbon.a, hoverRibbon.b])
          : hoverClade && !spot
            ? relatedToClade(hoverClade)
            : current.silent && !spot && current.ring
              ? // "No ribbons tells a story too": every family with a breed left on the ring
                [...new Set([...current.ring, ...cladesOf(nodes.filter((n) => n.degree === 0).map((n) => n.code))])]
              : current.ring;
      const ring = set ? new Set(set) : null;
      gClade.selectAll<SVGPathElement, { clade: string }>("path.band")
        .transition("ring").duration(DUR * 0.4)
        .attr("fill-opacity", (d) => (!ring || ring.has(d.clade) ? 1 : 0.15));
      gClade.selectAll<SVGTextElement, { clade: string }>("text.clade-name")
        .transition("ring").duration(DUR * 0.4)
        .attr("fill-opacity", (d) => (!ring || ring.has(d.clade) ? 1 : 0.25));
    }

    function render() {
      const v = current;
      let shown = visibleLinks(v);
      const h = active(v);
      const fam = spot ? null : spotClade ?? (!h ? hoverClade : null);
      const hoverOn = !!h || !!fam;
      if (h)
        shown = layoutLinks(links.filter((l) => l.a === h || l.b === h).map((l) => rawLinkByKey.get(l.key)!));
      else if (fam)
        shown = layoutLinks(links.filter((l) => cladeOf(l.a) === fam || cladeOf(l.b) === fam).map((l) => rawLinkByKey.get(l.key)!));

      const focus = new Set(v.focus ?? []);
      if (hoverOn) focus.clear();
      if (h) focus.add(h);
      const clades = new Set(spot ? [] : fam ? [fam] : v.clades ?? []);
      // A family hover (pointer or text) replaces the quiet-breeds highlight.
      const silent = !spot && !fam && !!v.silent;
      const hasFocus = focus.size > 0 || clades.size > 0 || silent;
      const on = (n: CNode) =>
        !hasFocus ||
        focus.has(n.code) ||
        (!!n.clade && clades.has(n.clade)) ||
        (silent && n.degree === 0);

      const T = d3.transition().duration(hoverOn ? DUR * 0.4 : DUR);
      // Breeds at the far end of a highlighted chord: white labels, dimmer than the focus.
      const ends = new Set(hasFocus ? shown.flatMap((l) => [l.a, l.b]) : []);
      const isEnd = (d: CNode) => hasFocus && !on(d) && ends.has(d.code);
      // Hovering a block keeps its partners' blocks in color, as before.
      segSel.transition(T).attr("fill", (d) => (on(d) || (hoverOn && !spot && isEnd(d)) ? d.color : DIM));
      // "No ribbons tells a story too": only the breeds without ribbons stay on the ring; every
      // other breed's block and name go, leaving just its chords. A hover brings them back.
      const hidden = (d: CNode) => silent && !hoverOn && !on(d);
      segSel.attr("pointer-events", (d) => (hidden(d) ? "none" : null)).transition("hide").duration(DUR * (hoverOn ? 0.4 : 1)).attr("opacity", (d) => (hidden(d) ? 0 : 1));
      labelSel.attr("pointer-events", (d) => (hidden(d) ? "none" : null)).transition("hide").duration(DUR * (hoverOn ? 0.4 : 1)).attr("opacity", (d) => (hidden(d) ? 0 : 1));
      gClade.transition(T).attr("opacity", v.cladeRing ? 1 : 0);
      styleRing();
      cladeHits.attr("pointer-events", v.cladeRing ? null : "none");
      gTree.transition(T).attr("opacity", v.tree ? 1 : 0);
      drawTreePaths(v);

      // With one breed selected on the full chart (tree drawn): its DNA partners in other
      // families are cyan, and the relatives along its family line back to the wolf are white.
      const selBreed = v.tree ? (hoverOn ? h : v.treePath ?? null) : null;
      const partners = new Set(selBreed ? partnersOf(selBreed).map((p) => p.code) : []);
      const isPartner = (d: CNode) => !!selBreed && partners.has(d.code);
      const isKin = (d: CNode) => !!selBreed && d.code !== selBreed && !isPartner(d) && relatives.has(treeCodeOf(d.code));
      labelSel
        .classed("hi", (d) => (hasFocus && on(d)) || isPartner(d) || isKin(d))
        .classed("partner", isPartner)
        .classed("kin", isKin)
        .transition(T)
        .attr("fill", (d) =>
          isPartner(d) ? CYAN : isKin(d) ? tone("#fffaf0", LIGHT.hi) : on(d) ? (hasFocus ? tone("#fffaf0", LIGHT.hi) : tone("#b9b3a3", LIGHT.ink2)) : isEnd(d) ? tone("#ffffff", LIGHT.hi) : tone("#4a524c", LIGHT.dim),
        )
        .attr("fill-opacity", (d) => (isPartner(d) || isKin(d) ? 1 : isEnd(d) ? 0.6 : 1));
      gStart.transition(T).attr("opacity", v.start ? 1 : 0);

      const many = shown.length > 40;
      const baseOpacity = silent ? 0.12 : many ? 0.62 : 0.82;
      gRibbons.selectAll<SVGPathElement, CLink>("path")
        .data(shown, (d) => d.key)
        .join(
          (enter) =>
            enter.append("path")
              .each(function (d) {
                (this as SVGPathElement & { __g?: Geo }).__g = geoOf(d);
              })
              .attr("fill-opacity", 0),
          (u) => u,
          (exit) => exit.transition().duration(DUR * 0.5).attr("fill-opacity", 0).attr("stroke-opacity", 0).remove(),
        )
        .attr("fill", (d) => d.color)
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", 0.4)
        .on("pointerenter", (_, d) => {
          if (current.frozen || pinner.busy || !gate.ok()) return;
          onHoverRef.current?.({ kind: "ribbon", key: d.key });
          hoverRibbon = d;
          // Fade the other ribbons so the hovered one and its tree path stand out.
          gRibbons.classed("dim", true).selectAll<SVGPathElement, CLink>("path").classed("hot", (x) => x.key === d.key);
          drawTreePaths(current);
          styleRing();
        })
        .on("pointermove", (ev: PointerEvent, d) => gate.ok() && showRibbonTip(ev, d))
        .on("click.pin", (ev: MouseEvent, d) => {
          if (!pinner.can()) return;
          ev.stopPropagation();
          if (!pinner.toggle(`rib:${d.key}`)) return;
          hoverRibbon = d;
          gRibbons.classed("dim", true).selectAll<SVGPathElement, CLink>("path").classed("hot", (x) => x.key === d.key);
          drawTreePaths(current);
          styleRing();
          showRibbonTip(ev as unknown as PointerEvent, d);
        })
        .on("pointerleave", () => {
          if (pinner.busy) return;
          tip.classed("on", false);
          if (current.frozen) return;
          onHoverRef.current?.(null);
          hoverRibbon = null;
          gRibbons.classed("dim", false).selectAll("path").classed("hot", false);
          drawTreePaths(current);
          styleRing();
        })
        .transition(T)
        .delay((_, i) => (hoverOn || !many ? i * 30 : Math.min(i * 3, 500)))
        .attr("fill-opacity", baseOpacity)
        .attr("stroke-opacity", silent ? 0.2 : 0.9)
        // Ends re-pack when the set of visible ribbons changes; glide to the new widths.
        .attrTween("d", function (d) {
          const self = this as SVGPathElement & { __g?: Geo };
          const next = geoOf(d);
          const i = d3.interpolateObject(self.__g ?? next, next);
          return (t) => ribbon((self.__g = i(t))) as unknown as string;
        });
    }

    // ---------- tooltips ----------
    function place(ev: PointerEvent | FocusEvent) {
      const box = el.getBoundingClientRect();
      let x: number, y: number;
      if ("clientX" in ev && ev.clientX) {
        x = ev.clientX - box.left;
        y = ev.clientY - box.top;
      } else {
        const r = (ev.target as Element).getBoundingClientRect();
        x = r.left + r.width / 2 - box.left;
        y = r.top + r.height / 2 - box.top;
      }
      const t = tip.node() as HTMLElement;
      tip.style("left", `${Math.min(Math.max(8, x + 14), box.width - t.offsetWidth - 8)}px`)
        .style("top", `${Math.min(Math.max(8, y + 14), box.height - t.offsetHeight - 8)}px`);
    }
    function showSegTip(ev: PointerEvent | FocusEvent, d: CNode) {
      if (onHoverRef.current) return;
      if (pinner.busy && pinner.key !== `seg:${d.code}`) return;
      cladePanel(null);
      const ps = partnersOf(d.code);
      // A second sampled population (e.g. Italian cane corsos) uses its breed's photo and facts.
      const breed = d.code === "CHTM" ? "TIBM" : d.code === "COOS" ? "SALU" : d.code === "ITCC" ? "CANE" : d.code;
      const photo = photoOf(breed);
      tip.html(
        `${photo ? `<img class="tip-photo" src="${photo}" alt="" referrerpolicy="no-referrer" />` : ""}
         <div class="tip-name">${d.name}</div>
         <div class="tip-clade">${puppySwatchHtml(d.code, d.color)}${cladeLabel(d)}</div>
         ${ps.length
           ? `<div class="tip-sub">Shares big chunks of DNA with ${ps.length} breed${ps.length === 1 ? "" : "s"} from other families</div>
              <dl class="tip-partners">${ps.slice(0, 6).map((p) => { const o = nodeByCode.get(p.code)!; return `<dt>${puppySwatchHtml(p.code, o.color)}${o.name}</dt><dd>${mb(p.value)}</dd>`; }).join("")}</dl>
              ${ps.length > 6 ? `<div class="tip-more">+ ${ps.length - 6} more</div>` : ""}`
           : `<div class="tip-note">No big DNA overlap with breeds from other families.</div>`}
         ${factsHtml(breed)}`,
      ).classed("on", true);
      place(ev);
    }
    function showCladeTip(ev: PointerEvent | MouseEvent | FocusEvent, clade: string) {
      const key = `clade:${clade}`;
      if (pinner.busy && pinner.key !== key) return;
      if (dock && !compactRef.current) {
        tip.classed("on", false);
        cladePanel(clade, pinner.key === key);
        return;
      }
      tip.html(cladeTipHtml(clade)).classed("on", true);
      place(ev as PointerEvent);
    }
    function showRibbonTip(ev: PointerEvent, d: CLink) {
      if (onHoverRef.current) return;
      if (pinner.busy && pinner.key !== `rib:${d.key}`) return;
      cladePanel(null);
      const a = nodeByCode.get(d.a)!, b = nodeByCode.get(d.b)!;
      tip.html(
        `<div class="tip-name">${a.name} ↔ ${b.name}</div>
         <dl><dt>Shared DNA</dt><dd>${mb(d.value)}</dd>
         <dt>Color comes from</dt><dd>${nodeByCode.get(d.hub)!.name}</dd></dl>`,
      ).classed("on", true);
      place(ev);
    }

    // Blocks and their name labels respond alike: hover for details, click to lock.
    function enterBreed(ev: PointerEvent | FocusEvent, d: CNode) {
      if (current.frozen || pinner.busy || !gate.ok()) return;
      showSegTip(ev, d);
      onHoverRef.current?.({ kind: "breed", code: d.code });
      if (current.interactive || hoverLeads()) {
        hover = d.code;
        render();
      }
    }
    function leaveBreed() {
      if (pinner.busy) return;
      tip.classed("on", false);
      if (current.frozen) return;
      onHoverRef.current?.(null);
      if ((current.interactive || hoverLeads()) && hover) {
        hover = null;
        render();
      }
    }
    function clickBreed(ev: MouseEvent, d: CNode) {
      if (pinner.can()) {
        ev.stopPropagation();
        if (!pinner.toggle(`seg:${d.code}`)) return;
        showSegTip(ev as unknown as PointerEvent, d);
        hover = d.code;
        render();
        return;
      }
      if (!onBreedClickRef.current) return;
      ev.stopPropagation();
      onBreedClickRef.current(d.code);
    }

    segSel
      .on("pointerenter focus", enterBreed)
      .on("pointermove", (ev, d) => gate.ok() && showSegTip(ev, d))
      .on("pointerleave blur", leaveBreed)
      // Click a block to lock onto it; click again (anywhere on the chart) to go back.
      .on("click", clickBreed)
      .on("keydown", (ev: KeyboardEvent, d) => {
        if ((ev.key === "Enter" || ev.key === " ") && onBreedClickRef.current) {
          ev.preventDefault();
          onBreedClickRef.current(d.code);
        }
      });
    // Labels: pointer only (the block already gives keyboard users a tab stop).
    labelSel
      .classed("clickable", () => !!onBreedClickRef.current || !!onHoverRef.current)
      .on("pointerenter", enterBreed)
      .on("pointermove", (ev, d) => gate.ok() && showSegTip(ev, d))
      .on("pointerleave", leaveBreed)
      .on("click", clickBreed);
    // A new step clears any hover (and pin), and hovers wait for the pointer to really move.
    const onStep = () => {
      pinner.unpin();
      tip.classed("on", false);
      gClade.selectAll("path.band").classed("hover", false);
      hover = null;
      hoverRibbon = null;
      hoverClade = null;
      cladePanel(null);
      gRibbons.classed("dim", false).selectAll("path").classed("hot", false);
      render();
      gate.lock();
    };
    dock?.addEventListener(STEP_CHANGE, onStep);
    // Pointing at a breed in a family's panel shows it here; letting go returns to the family.
    const offPanel = subscribePanelFocus(() => {
      const code = panelBreed(getPanelFocus());
      if (code === panelSpot || (code && !nodeByCode.has(code))) return;
      panelSpot = code;
      syncSpot();
      render();
    });
    svg.on("click", () => {
      pinner.unpin(); // a click on the chart's empty space lets go of a pinned item
      onBgClickRef.current?.();
    });

    // ---------- the tree ⇄ chords glide (object constancy) ----------
    // t = 0: every breed block, breed name, family band and family name where the family tree
    // draws it; t = 1: where the chords draw it. Ribbons (and the start mark) sit out the glide.
    type From = { a0: number; a1: number; mid: number };
    let fromNode = new Map<string, From | null>();
    let fromClade = new Map<string, (From & { tier: number }) | null>();
    function setPose(ancestor: boolean) {
      const pose = treePose(ancestor);
      fromNode = new Map(
      nodes.map((n) => {
        const g = pose.byCode.get(treeCodeOf(n.code));
        if (!g) return [n.code, null] as const;
        const s = nearTurn(g.a, n.mid) - g.a;
        return [n.code, { a0: g.a0 + s, a1: g.a1 + s, mid: g.a + s }] as const;
      }),
    );
      fromClade = new Map(
      named.map((c) => {
        const g = pose.clades.get(c.clade);
        if (!g) return [c.clade, null] as const;
        const s = nearTurn(g.mid, c.mid) - g.mid;
        return [c.clade, { a0: g.a0 + s, a1: g.a1 + s, mid: g.mid + s, tier: g.tier }] as const;
      }),
    );
    }
    setPose(false);
    let morphT = 1;
    function setGeom(t: number) {
      morphT = t;
      const lerp = (x: number, y: number) => x + (y - x) * t;
      segSel.attr("d", (d) => {
        const f = fromNode.get(d.code);
        return arc(f ? { a0: lerp(f.a0, d.a0), a1: lerp(f.a1, d.a1) } : d);
      });
      labelSel.each(function (d) {
        const f = fromNode.get(d.code);
        const m = f ? lerp(f.mid, d.mid) : d.mid;
        d3.select(this).attr("text-anchor", labelAnchor(m)).attr("transform", labelAt(m));
      });
      bandSel.attr("d", (d) => {
        const f = fromClade.get(d.clade);
        return bandArc(f ? { a0: lerp(f.a0, d.a0), a1: lerp(f.a1, d.a1) } : d);
      });
      tpSel.attr("d", (d) => {
        const f = fromClade.get(d.clade);
        return f ? namePath(lerp(f.mid, d.mid), lerp(f.tier, d.tier)) : namePath(d.mid, d.tier);
      });
    }
    function morph(dir: "in" | "out", fromHidden: boolean) {
      svg.interrupt("morph");
      setPose(treeAncestorRef.current); // the neighbouring tree step's exact layout
      if (!FULL) {
        setGeom(dir === "in" ? 1 : 0);
        svg.classed("morphing", dir === "out");
        return;
      }
      // Coming into view from the tree: start exactly where the tree draws everything.
      if (dir === "in" && fromHidden && morphT === 1) setGeom(0);
      svg.classed("morphing", true);
      const from = morphT, to = dir === "in" ? 1 : 0;
      const ms = MORPH_MS * Math.abs(to - from);
      svg.transition("morph")
        .delay(dir === "in" ? MORPH_IN_DELAY : MORPH_OUT_DELAY)
        .duration(ms)
        .ease(d3.easeCubicInOut)
        .tween("geom", () => (t) => setGeom(from + (to - from) * t))
        .on("end", () => {
          if (dir === "in") svg.classed("morphing", false); // the ribbons fade back in (CSS)
        });
    }

    api.current = {
      morph,
      spot(code) {
        if (code === propSpot) return;
        propSpot = code;
        syncSpot();
        render();
      },
      spotClade(clade) {
        if (clade === spotClade) return;
        spotClade = clade;
        render();
      },
      update(v) {
        if (v !== current) pinner.unpin();
        current = v;
        hover = null;
        hoverRibbon = null;
        hoverClade = null;
        gRibbons.classed("dim", false).selectAll("path").classed("hot", false);
        svg.classed("frozen", !!v.frozen);
        render();
      },
    };
    // A theme switch rebuilds the chart with the new colors; restyle it for the current step and
    // spotlight right away, without animating. (The first build is styled by the effects below.)
    if (built.current) {
      DUR = 0;
      propSpot = spotRef.current ?? null;
      syncSpot();
      spotClade = spotCladeRef.current ?? null;
      try {
        api.current.update(viewRef.current);
      } finally {
        DUR = FULL;
      }
    }
    built.current = true;
    return () => {
      dock?.removeEventListener(STEP_CHANGE, onStep);
      offPanel();
      pinner.dispose();
      d3.select(el).selectAll("*").remove();
      tip.remove();
      api.current = null;
    };
  }, [ariaLabel, theme]);

  useEffect(() => {
    api.current?.update(view);
  }, [view]);

  useEffect(() => {
    api.current?.spot(spotlight);
  }, [spotlight]);

  useEffect(() => {
    api.current?.spotClade(spotlightClade);
  }, [spotlightClade]);

  // In the story: glide between the tree's layout and the chords' as the chords come and go.
  const wasShown = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (shown === undefined) return;
    const prev = wasShown.current;
    wasShown.current = shown;
    if (prev === undefined) {
      // First render: the chords' own layout when on screen, the tree's when waiting off screen.
      if (!shown) api.current?.morph("out", true);
      return;
    }
    if (shown !== prev) api.current?.morph(shown ? "in" : "out", !prev);
  }, [shown, theme]);

  useEffect(() => {
    const half = compact ? CGEOM.rClade1 + 3 : W / 2; // where the tree crops, so the ring matches
    d3.select(host.current).select("svg").attr("viewBox", `${-half} ${-half} ${half * 2} ${half * 2}`);
  }, [compact, ariaLabel, theme]); // the rebuild resets the viewBox

  return <div ref={host} className={`circos${compact ? " compact" : ""}`} />;
}
