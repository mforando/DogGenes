"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as d3 from "d3";
import { ANCESTOR, ANCESTOR_BREED, data, GEOM, isLeaf, layout, nodeIdOf, type TNode } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import type { View } from "@/lib/steps";
import { photoOf } from "@/lib/photos";
import { factsHtml } from "@/lib/breedFacts";
import { LIGHT, tone } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { dockCladeSender, dockPinner } from "@/lib/dockPin";
import { hoverGate, STEP_CHANGE } from "@/lib/hoverGate";
import { cladeMembers, cladePartners, cladeTipHtml, cladesOf, relatedClades, relatedToClade } from "@/lib/ringClades";

type Props = {
  view: View;
  selected: string | null;
  onSelect: (code: string | null) => void;
  /** Hovering (or focusing) a breed's wedge reports it; leaving reports null. */
  onHover?: (code: string | null) => void;
  /** Show the tooltip in this element (a fixed panel beside the chart) instead of at the pointer. */
  tipDock?: RefObject<HTMLElement | null>;
  /** Phone-size screens: crop to the ring (no name labels) so the circle fills the space. */
  compact?: boolean;
  /**
   * The page's view is pointing at a name hovered in the text: show it even over the chart's own
   * hover or pin (which comes back when the text hover ends).
   */
  textFocus?: boolean;
};

type Pt = { a: number; r: number };
type LinkGeom = { pa: number; pr: number; a: number; r: number };
type WedgeGeom = { a: number; r: number; a0: number; a1: number };
type ArcGeom = { a0: number; a1: number };

let INK = "#e9e2d0";
let INK_DIM = "#3a423d";
let GOLD = "#e8b74a";
const W = GEOM.size;

const pol = (a: number, r: number): [number, number] => [r * Math.sin(a), -r * Math.cos(a)];
/** Breed info for a leaf, including the hypothetical ancestor (not in the study's data). */
const breedOf = (code: string) => (code === ANCESTOR ? ANCESTOR_BREED : data.breeds[code]);
const isAncestor = (d: TNode) => isLeaf(d) && d.data.code === ANCESTOR;
const deg = (a: number) => (a * 180) / Math.PI;

function linkPath({ pa, pr, a, r }: LinkGeom) {
  const [x0, y0] = pol(pa, pr);
  const [x1, y1] = pol(a, pr);
  const [x2, y2] = pol(a, r);
  const large = Math.abs(a - pa) > Math.PI ? 1 : 0;
  const sweep = a > pa ? 1 : 0;
  return pr < 0.5
    ? `M${x1},${y1}L${x2},${y2}`
    : `M${x0},${y0}A${pr},${pr} 0 ${large} ${sweep} ${x1},${y1}L${x2},${y2}`;
}

function wedgePath({ a, r, a0, a1 }: WedgeGeom) {
  const R = GEOM.rWedge;
  const [ax, ay] = pol(a, r);
  const [x0, y0] = pol(a0 + 0.0009, R);
  const [x1, y1] = pol(a1 - 0.0009, R);
  return `M${ax},${ay}L${x0},${y0}A${R},${R} 0 0 1 ${x1},${y1}Z`;
}

/**
 * Invisible hit area: the breed's whole slice of the circle, from the centre out past its
 * label, so pointing anywhere at a breed's angle picks it. (The tree's branches have hit
 * areas of their own, drawn above these.)
 */
function hitPath({ a0, a1 }: WedgeGeom) {
  return d3.arc()({ innerRadius: 0, outerRadius: GEOM.rLabel + 120, startAngle: a0, endAngle: a1 }) ?? "";
}

function arcBand({ a0, a1 }: ArcGeom) {
  return d3.arc()({
    innerRadius: GEOM.rClade0,
    outerRadius: GEOM.rClade1,
    startAngle: a0 + 0.002,
    endAngle: a1 - 0.002,
  })!;
}

/** Path the clade name rides on; reversed on the lower half so text stays upright. */
/**
 * A family's hover area: its band (out to where the breed names start) and the space around its
 * name. Drawn above the breed slices, so pointing at the ring picks the family.
 */
function cladeHitPath({ a0, a1, tier, clade }: ArcGeom & { tier: number; clade: string }) {
  const band = d3.arc()({ innerRadius: GEOM.rClade0 - 5, outerRadius: GEOM.rLabel, startAngle: a0, endAngle: a1 }) ?? "";
  const mid = (a0 + a1) / 2;
  const nameHalf = ((data.clades[clade].length * 7.4) / GEOM.rCladeName) / 2 + 0.02;
  const half = Math.max(nameHalf, (a1 - a0) / 2);
  const r = GEOM.rCladeName + tier * 17;
  const name = d3.arc()({ innerRadius: r - 14, outerRadius: r + 24, startAngle: mid - half, endAngle: mid + half }) ?? "";
  return band + name;
}

function arcTextPath({ a0, a1, tier }: ArcGeom & { tier: number }) {
  const mid = (a0 + a1) / 2;
  const bottom = mid > Math.PI / 2 && mid < (3 * Math.PI) / 2;
  const r = GEOM.rCladeName + tier * 17 + (bottom ? 9 : 0);
  const half = 0.6; // generous: text is centred with startOffset 50%
  const [x0, y0] = pol(bottom ? mid + half : mid - half, r);
  const [x1, y1] = pol(bottom ? mid - half : mid + half, r);
  return `M${x0},${y0}A${r},${r} 0 0 ${bottom ? 0 : 1} ${x1},${y1}`;
}

/** Greedy tiering: a clade name moves outward until it no longer overlaps a neighbour. */
function assignTiers<T extends { clade: string; a0: number; a1: number }>(spans: T[]) {
  const placed: { lo: number; hi: number; tier: number }[] = [];
  return spans.map((sp) => {
    const mid = (sp.a0 + sp.a1) / 2;
    const half = ((data.clades[sp.clade].length * 7.4) / GEOM.rCladeName) / 2 + 0.02;
    let tier = 0;
    while (placed.some((p) => p.tier === tier && mid - half < p.hi && mid + half > p.lo)) tier++;
    placed.push({ lo: mid - half, hi: mid + half, tier });
    return { ...sp, tier };
  });
}

function labelTransform(a: number) {
  const flip = a > Math.PI;
  return `rotate(${deg(a) - 90}) translate(${GEOM.rLabel},0)${flip ? " rotate(180)" : ""}`;
}

/** Each node's uniform clade (null if its leaves span several clades). */
function computeNodeClades(root: TNode) {
  const m = new Map<number, string | null | undefined>();
  root.eachAfter((n) => {
    const t = n as TNode;
    if (isLeaf(t)) {
      m.set(t.data.id, breedOf(t.data.code).clade);
      return;
    }
    const cs = new Set((t.children as TNode[]).map((c) => m.get(c.data.id)));
    m.set(t.data.id, cs.size === 1 ? [...cs][0] : undefined);
  });
  return m;
}

function cladeSpans(leaves: TNode[]) {
  const spans: { clade: string; a0: number; a1: number }[] = [];
  for (const l of leaves) {
    if (!isLeaf(l)) continue;
    const c = breedOf(l.data.code).clade;
    if (!c) continue;
    const last = spans[spans.length - 1];
    if (last && last.clade === c) last.a1 = l.a1;
    else spans.push({ clade: c, a0: l.a0, a1: l.a1 });
  }
  return spans;
}

const partnersOf = (code: string) =>
  data.links.filter(([a, b]) => a === code || b === code).map(([a, b, v]) => [a === code ? b : a, v] as const);

export default function Cladogram({ view, selected, onSelect, onHover, tipDock, compact = false, textFocus = false }: Props) {
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ update: (v: View, sel: string | null, instant?: boolean, textFocus?: boolean) => void } | null>(null);
  const textFocusRef = useRef(textFocus);
  textFocusRef.current = textFocus;
  // The step and selection on screen, so a rebuild (theme switch) can restyle to match at once.
  const viewRef = useRef(view);
  viewRef.current = view;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const built = useRef(false);
  const compactRef = useRef(compact);
  compactRef.current = compact;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Build the SVG scaffold once.
  const theme = useTheme(); // rebuild when the light/dark switch changes
  useEffect(() => {
    INK = tone("#e9e2d0", LIGHT.ink);
    INK_DIM = tone("#3a423d", LIGHT.dim);
    GOLD = tone("#e8b74a", LIGHT.gold);
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const FULL = reduce ? 0 : 900;
    let DUR = FULL; // 0 while restyling instantly after a theme switch

    const svg = d3
      .select(el)
      .append("svg")
      .attr("viewBox", `${-W / 2} ${-W / 2} ${W} ${W}`)
      .attr("role", "group")
      .attr(
        "aria-label",
        `Circular cladogram of ${data.stats.dogs} dogs from 161 breeds, rooted on the golden jackal.`,
      );

    const defs = svg.append("defs");
    const glow = defs.append("radialGradient").attr("id", "halo");
    glow.append("stop").attr("offset", "0%").attr("stop-color", tone("#1f2a25", LIGHT.raise)).attr("stop-opacity", 0.9);
    glow.append("stop").attr("offset", "100%").attr("stop-color", tone("#0d1110", LIGHT.bg)).attr("stop-opacity", 0);

    const zoomG = svg.append("g").attr("class", "zoom");
    zoomG.append("circle").attr("r", GEOM.rWedge + 40).attr("fill", "url(#halo)");
    const guides = zoomG.append("g").attr("class", "guides");
    for (const f of [0.25, 0.5, 0.75, 1]) {
      guides.append("circle").attr("r", GEOM.rTree * f).attr("fill", "none")
        .attr("stroke", tone("#1e2723", LIGHT.grid)).attr("stroke-width", 0.6);
    }

    const gLinks = zoomG.append("g").attr("class", "links").attr("fill", "none");
    const gWedges = zoomG.append("g").attr("class", "wedges");
    const gPath = zoomG.append("g").attr("class", "trace").attr("fill", "none");
    const gBundles = zoomG.append("g").attr("class", "bundles").attr("fill", "none");
    const gSupport = zoomG.append("g").attr("class", "support");
    const gClade = zoomG.append("g").attr("class", "clade-ring");
    const gLabels = zoomG.append("g").attr("class", "labels");
    const gMarks = zoomG.append("g").attr("class", "marks");
    // Hovering a breed traces its line back to the grey wolf (drawn above the step's own paths).
    // Hovering a branch lights up everything descended from it (under the wolf trace).
    const gBranch = zoomG.append("g").attr("class", "branch-trace").attr("pointer-events", "none");
    const gWolf = zoomG.append("g").attr("class", "wolf-trace").attr("fill", "none").attr("pointer-events", "none");
    const gHit = zoomG.append("g").attr("class", "hits");
    const gBranchHit = zoomG.append("g").attr("class", "branch-hits");
    const gCladeHit = zoomG.append("g").attr("class", "clade-hits");

    // The side panel, read once: in development React empties refs before an effect's cleanup
    // runs, and the cleanup must take its listeners off the same element they were put on.
    const dock = tipDock?.current ?? null;
    const tip = d3.select(dock ?? el).append("div").attr("class", "tip").attr("role", "status");
    // Click a breed to pin its details in the side panel (then scroll the panel); see dockPin.ts.
    const gate = hoverGate();
    // Families get the full "Family group" panel, which the page draws in the side panel.
    const cladePanel = dockCladeSender(dock);
    const pinner = dockPinner(
      dock,
      "tree",
      () => {
        tip.classed("on", false);
        onHoverRef.current?.(null);
        traceBranch(null);
        setHover(null);
        cladePanel(null);
      },
      () => !compactRef.current,
    );

    let L = layout(new Set(), { withAncestor: true });
    let flipKey = "|";
    let nodeClade = computeNodeClades(L.root);
    let current: View = { color: "ink" };
    let currentSel: string | null = null;

    const linkNodes = () => L.nodes.filter((n) => n.parent);
    const linkGeom = (n: TNode): LinkGeom => {
      const p = n.parent as TNode;
      return { pa: p.a, pr: p.r, a: n.a, r: n.r };
    };

    // ---------- static joins (geometry is tweened in update) ----------
    const linkSel = gLinks
      .selectAll<SVGPathElement, TNode>("path")
      .data(linkNodes(), (d) => d.data.id)
      .join("path")
      .attr("stroke-width", 0.9)
      .attr("stroke-linecap", "round");

    const wedgeSel = gWedges
      .selectAll<SVGPathElement, TNode>("path")
      .data(L.leaves, (d) => d.data.id)
      .join("path");

    const labelSel = gLabels
      .selectAll<SVGTextElement, TNode>("text")
      .data(L.leaves, (d) => d.data.id)
      .join("text")
      .attr("dy", "0.32em")
      .text((d) => {
        if (!isLeaf(d)) return "";
        // Minor fragments of split breeds stay unlabelled; the tooltip names them.
        return d.data.main ? breedOf(d.data.code).name : "";
      });

    const internal = L.nodes.filter((n) => n.children && n.parent && n.data.t === "i" && n.data.bs >= 50);
    const star = d3.symbol(d3.symbolStar, 30)()!;
    const supportSel = gSupport
      .selectAll<SVGPathElement, TNode>("path")
      .data(internal, (d) => d.data.id)
      .join("path")
      .attr("d", (d) => {
        const bs = (d.data as { bs: number }).bs;
        return bs >= 90 ? d3.symbol(d3.symbolCircle, 22)()! : star;
      })
      .attr("fill", (d) => {
        const bs = (d.data as { bs: number }).bs;
        return bs >= 90 ? GOLD : bs >= 70 ? INK : tone("#0d1110", LIGHT.bg);
      })
      .attr("stroke", (d) => ((d.data as { bs: number }).bs >= 70 ? tone("#0d1110", LIGHT.bg) : INK))
      .attr("stroke-width", 0.8)
      .attr("opacity", 0);

    const hitSel = gHit
      .selectAll<SVGPathElement, TNode>("path")
      .data(L.leaves, (d) => d.data.id)
      .join("path")
      .attr("fill", "transparent")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => (isLeaf(d) ? breedOf(d.data.code).name : ""));

    // ---------- hover overrides the step ----------
    // The step's view (from the page) and, while the reader points at a breed or a branch, a
    // view built from that instead: its lines, its links, its name, and on the family ring its
    // own family plus every family it shares DNA with. Swapped here, without a React render.
    type HoverOn = { kind: "breed"; code: string } | { kind: "branch"; node: TNode } | { kind: "clade"; clade: string } | null;
    const hoverKey = (h: HoverOn) =>
      !h ? "" : h.kind === "breed" ? `b:${h.code}` : h.kind === "branch" ? `n:${h.node.data.id}` : `c:${h.clade}`;
    let hoverOn: HoverOn = null;
    let stepView: View = { color: "ink" };
    let stepSel: string | null = null;
    function hoverView(h: NonNullable<HoverOn>): View {
      const { codes, clades, paths, outgroup, split, links, ring, ...rest } = stepView;
      void codes; void clades; void paths; void outgroup; void split; void ring;
      if (h.kind === "clade") {
        // A family: all its breeds, every breed elsewhere that shares DNA with them, their links
        // out to other families, and those families on the ring.
        return {
          ...rest,
          color: "clade",
          clades: [h.clade],
          codes: [...cladeMembers(h.clade), ...cladePartners(h.clade)].filter((c) => data.breeds[c]),
          ...(links ? { links: { codes: cladeMembers(h.clade) } } : {}),
          ring: relatedToClade(h.clade),
        };
      }
      const focus =
        h.kind === "breed"
          ? [h.code]
          : [...new Set((h.node.leaves() as TNode[]).filter((l) => isLeaf(l) && l.data.code !== ANCESTOR).map((l) => (l as TNode & { data: { code: string } }).data.code))];
      return {
        ...rest,
        color: "clade",
        codes: focus,
        ...(links ? { links: { codes: focus } } : {}),
        ring: h.kind === "breed" ? relatedClades(h.code) : cladesOf(focus),
      };
    }
    function setHover(h: HoverOn) {
      if (!h && !hoverOn) return;
      if (hoverKey(h) === hoverKey(hoverOn)) return;
      hoverOn = h;
      if (textFocusRef.current) return; // the text's highlight is showing; this one waits
      DUR = FULL * 0.35; // hovers restyle quickly
      try {
        update(h ? hoverView(h) : stepView, h ? null : stepSel);
      } finally {
        DUR = FULL;
      }
    }

    // The breed under the pointer, once its hover has been reported (highlight + wolf trace).
    let reported: TNode | null = null;
    function report(d: TNode) {
      reported = d;
      if (isLeaf(d) && d.data.code !== ANCESTOR) {
        onHoverRef.current?.(d.data.code);
        setHover({ kind: "breed", code: d.data.code });
      }
      traceToWolf(d);
    }

    // Branches: an invisible, wider copy of each internal branch, above the breed slices.
    const branchNodes = () => L.nodes.filter((n) => n.parent && n.children);
    const branchSel = gBranchHit
      .selectAll<SVGPathElement, TNode>("path")
      .data(branchNodes(), (d) => d.data.id)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "transparent")
      .attr("stroke-width", 9)
      .attr("stroke-linecap", "round")
      .attr("pointer-events", "stroke");

    // ---------- tooltip ----------
    function placeTip(ev: PointerEvent | FocusEvent | MouseEvent) {
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
      const tw = (tip.node() as HTMLElement).offsetWidth;
      const th = (tip.node() as HTMLElement).offsetHeight;
      tip
        .style("left", `${Math.min(Math.max(8, x + 14), box.width - tw - 8)}px`)
        .style("top", `${Math.min(Math.max(8, y + 14), box.height - th - 8)}px`);
    }
    /** A family: its breeds and the families they share DNA with. */
    function showCladeTip(ev: PointerEvent | MouseEvent, clade: string) {
      const key = `clade:${clade}`;
      if (pinner.busy && pinner.key !== key) return;
      if (dock && !compactRef.current) {
        tip.classed("on", false);
        cladePanel(clade, pinner.key === key);
        return;
      }
      tip.html(cladeTipHtml(clade)).classed("on", true);
      placeTip(ev);
    }
    /** A branch: the breeds descended from it and the families they belong to. */
    function showBranchTip(ev: PointerEvent | MouseEvent, n: TNode) {
      const key = `node:${n.data.id}`;
      if (pinner.busy && pinner.key !== key) return;
      cladePanel(null);
      const codes = [...new Set((n.leaves() as TNode[]).filter((l) => isLeaf(l) && l.data.code !== ANCESTOR).map((l) => (l as TNode & { data: { code: string } }).data.code))];
      const wild: string[] = codes.filter((c) => c === "WOLF" || c === "GDJK");
      const breeds = codes.filter((c) => !wild.includes(c)).sort((x, y) => data.breeds[x].name.localeCompare(data.breeds[y].name));
      const clades = [...new Set(breeds.map((c) => data.breeds[c].clade).filter((c): c is string => !!c))];
      const loners = breeds.filter((c) => !data.breeds[c].clade).length;
      const bs = (n.data as { bs?: number }).bs;
      const MAX = 14;
      const wildNote = wild.length ? ` and the ${wild.map((c) => data.breeds[c].name.toLowerCase()).join(" and ")}` : "";
      tip.html(
        `<div class="tip-name">A branch of the tree</div>
         <div class="tip-sub">${breeds.length} breed${breeds.length === 1 ? "" : "s"}${wildNote} descend from this fork</div>
         ${clades.slice(0, 6).map((c) => `<div class="tip-clade"><i style="background:${cladeColor(c)}"></i>${data.clades[c]}</div>`).join("")}
         ${clades.length > 6 ? `<div class="tip-more">+ ${clades.length - 6} more families</div>` : ""}
         ${loners ? `<div class="tip-clade"><i style="background:${cladeColor(null)}"></i>${loners} loner${loners === 1 ? "" : "s"} (no clear family)</div>` : ""}
         ${bs != null ? `<dl><dt>Bootstrap support</dt><dd>${bs}%</dd></dl>` : ""}
         ${breeds.length ? `<div class="tip-note">${breeds.slice(0, MAX).map((c) => data.breeds[c].name).join(", ")}${breeds.length > MAX ? `, and ${breeds.length - MAX} more` : ""}</div>` : ""}
         <div class="tip-note">Gold: this branch and the breeds on it. The line runs back to where it meets the grey wolf.</div>`,
      ).classed("on", true);
      placeTip(ev);
    }
    function showTip(ev: PointerEvent | FocusEvent, d: TNode) {
      if (!isLeaf(d)) return;
      if (pinner.busy && pinner.key !== d.data.code) return;
      cladePanel(null);
      if (d.data.code === ANCESTOR) {
        tip.html(
          `<div class="tip-name">${ANCESTOR_BREED.name}</div>
           <div class="tip-note">Where DNA from the wolf population that dogs came from would join the tree, if anyone had it.</div>`,
        ).classed("on", true);
        const box = el.getBoundingClientRect();
        const r = (ev.target as Element).getBoundingClientRect();
        tip.style("left", `${Math.min(r.left + r.width / 2 - box.left, box.width - 240)}px`).style("top", `${r.top + r.height / 2 - box.top}px`);
        return;
      }
      const b = data.breeds[d.data.code];
      const partners = partnersOf(d.data.code);
      const cross = partners.filter(([c]) => data.breeds[c]?.clade !== b.clade || !b.clade).length;
      const cladeName = b.clade ? data.clades[b.clade] : d.data.code === "WOLF" || d.data.code === "GDJK" ? "Wild relative" : "Loner (no clear family)";
      const photo = photoOf(d.data.code);
      tip.html(
        `${photo ? `<img class="tip-photo" src="${photo}" alt="" referrerpolicy="no-referrer" />` : ""}
         <div class="tip-name">${b.name}</div>
         <div class="tip-clade"><i style="background:${cladeColor(b.clade, d.data.code)}"></i>${cladeName}</div>
         <dl>
           <dt>Dogs tested</dt><dd>${d.data.n}</dd>
           <dt>Mixed with other families</dt><dd>${cross} breed${cross === 1 ? "" : "s"}</dd>
         </dl>
         ${d.data.frags > 1 ? `<div class="tip-note">This breed is split into ${d.data.frags} wedges${d.data.main ? ". This is the biggest one." : "."}</div>` : ""}
         ${factsHtml(d.data.code)}`,
      ).classed("on", true);
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
      const tw = (tip.node() as HTMLElement).offsetWidth;
      const th = (tip.node() as HTMLElement).offsetHeight;
      tip
        .style("left", `${Math.min(Math.max(8, x + 14), box.width - tw - 8)}px`)
        .style("top", `${Math.min(Math.max(8, y + 14), box.height - th - 8)}px`);
    }
    hitSel
      .on("pointermove", (ev, d) => {
        if (!gate.ok()) return;
        if (!pinner.busy && reported !== d) report(d); // the pointer was resting here when the step changed
        showTip(ev, d);
      })
      .on("focus", (ev, d) => showTip(ev, d))
      .on("pointerenter.report focus.report", (_, d) => {
        if (pinner.busy || !gate.ok()) return;
        report(d);
      })
      .on("pointerleave blur", () => {
        if (pinner.busy) return;
        reported = null;
        tip.classed("on", false);
        onHoverRef.current?.(null);
        traceToWolf(null);
        setHover(null);
      })
      .on("click", (ev: MouseEvent, d) => {
        if (pinner.can() && isLeaf(d) && pinner.toggle(d.data.code)) {
          showTip(ev, d);
          report(d);
        }
        if (!current.explore || !isLeaf(d)) return;
        onSelectRef.current(currentSel === d.data.code ? null : d.data.code);
      })
      .on("keydown", (ev: KeyboardEvent, d) => {
        if ((ev.key === "Enter" || ev.key === " ") && current.explore && isLeaf(d)) {
          ev.preventDefault();
          onSelectRef.current(currentSel === d.data.code ? null : d.data.code);
        }
      });

    // ---------- geometry ----------
    function applyGeometry(animate: boolean) {
      const dur = animate ? DUR : 0;
      const ease = d3.easeCubicInOut;

      linkSel.data(linkNodes(), (d) => d.data.id);
      linkSel.transition("geom").duration(dur).ease(ease).attrTween("d", function (d) {
        const self = this as SVGPathElement & { __g?: LinkGeom };
        const next = linkGeom(d);
        const i = d3.interpolateObject(self.__g ?? next, next);
        return (t) => linkPath((self.__g = i(t)));
      });

      branchSel.data(branchNodes(), (d) => d.data.id);
      branchSel.transition("geom").duration(dur).ease(ease).attrTween("d", function (d) {
        const self = this as SVGPathElement & { __g?: LinkGeom };
        const next = linkGeom(d);
        const i = d3.interpolateObject(self.__g ?? next, next);
        return (t) => linkPath((self.__g = i(t)));
      });

      for (const sel of [wedgeSel, hitSel]) {
        sel.data(L.leaves, (d) => d.data.id);
        sel.transition("geom").duration(dur).ease(ease).attrTween("d", function (d) {
          const self = this as SVGPathElement & { __g?: WedgeGeom };
          const next = { a: d.a, r: d.r, a0: d.a0, a1: d.a1 };
          const i = d3.interpolateObject(self.__g ?? next, next);
          return (t) => (sel === wedgeSel ? wedgePath : hitPath)((self.__g = i(t)));
        });
      }

      labelSel.data(L.leaves, (d) => d.data.id);
      labelSel
        .attr("text-anchor", (d) => (d.a > Math.PI ? "end" : "start"))
        .transition("geom").duration(dur).ease(ease)
        .attrTween("transform", function (d) {
          const self = this as SVGTextElement & { __a?: number };
          const i = d3.interpolateNumber(self.__a ?? d.a, d.a);
          return (t) => labelTransform((self.__a = i(t)));
        });

      supportSel.data(internal.map((n) => L.byId.get(n.data.id)!), (d) => d.data.id);
      supportSel.transition("geom").duration(dur).ease(ease).attrTween("transform", function (d) {
        const self = this as SVGPathElement & { __p?: Pt };
        const next = { a: d.a, r: d.r };
        const i = d3.interpolateObject(self.__p ?? next, next);
        return (t) => {
          const p = (self.__p = i(t));
          const [x, y] = pol(p.a, p.r);
          return `translate(${x},${y})`;
        };
      });

      const spans = assignTiers(cladeSpans(L.leaves));
      gCladeHit.selectAll<SVGPathElement, (typeof spans)[0]>("path")
        .data(spans, (d) => d.clade)
        .join("path")
        .attr("fill", "transparent")
        .attr("d", (d) => cladeHitPath(d))
        .on("pointerenter", (ev: PointerEvent, d) => {
          if (pinner.busy || !gate.ok()) return;
          setHover({ kind: "clade", clade: d.clade });
          showCladeTip(ev, d.clade);
        })
        .on("pointermove", (ev: PointerEvent, d) => {
          if (!gate.ok()) return;
          if (!pinner.busy) setHover({ kind: "clade", clade: d.clade }); // the pointer was resting here
          showCladeTip(ev, d.clade);
        })
        .on("pointerleave", () => {
          if (pinner.busy) return;
          tip.classed("on", false);
          cladePanel(null);
          setHover(null);
        })
        .on("click", (ev: MouseEvent, d) => {
          if (pinner.can() && pinner.toggle(`clade:${d.clade}`)) {
            setHover({ kind: "clade", clade: d.clade });
            showCladeTip(ev, d.clade);
          }
        });
      const band = gClade.selectAll<SVGPathElement, (typeof spans)[0]>("path.band")
        .data(spans, (d) => d.clade)
        .join("path")
        .attr("class", "band")
        .attr("fill", (d) => cladeColor(d.clade));
      band.transition("geom").duration(dur).ease(ease).attrTween("d", function (d) {
        const self = this as SVGPathElement & { __g?: ArcGeom };
        const next = { a0: d.a0, a1: d.a1 };
        const i = d3.interpolateObject(self.__g ?? next, next);
        return (t) => arcBand((self.__g = i(t)));
      });
      const tp = gClade.selectAll<SVGPathElement, (typeof spans)[0]>("path.tp")
        .data(spans, (d) => d.clade)
        .join("path")
        .attr("class", "tp")
        .attr("id", (d) => `tp-${d.clade}`)
        .attr("fill", "none");
      tp.transition("geom").duration(dur).ease(ease).attrTween("d", function (d) {
        const self = this as SVGPathElement & { __g?: ArcGeom & { tier: number } };
        const next = { a0: d.a0, a1: d.a1, tier: d.tier };
        const i = d3.interpolateObject(self.__g ?? next, next);
        return (t) => arcTextPath((self.__g = i(t)));
      });
      gClade.selectAll<SVGTextElement, (typeof spans)[0]>("text")
        .data(spans, (d) => d.clade)
        .join((enter) => {
          const t = enter.append("text").attr("class", "clade-name");
          t.append("textPath").attr("startOffset", "50%").attr("text-anchor", "middle");
          return t;
        })
        .select("textPath")
        .attr("href", (d) => `#tp-${d.clade}`)
        .text((d) => data.clades[d.clade]);
    }

    // ---------- styling for a view ----------
    function update(v: View, sel: string | null) {
      const prevView = current;
      current = v;
      currentSel = sel;

      // Rotation: relayout only when the set of flipped forks changes.
      const flipIds = (v.flip ?? []).map(nodeIdOf);
      const key = `${flipIds.join(",")}|${v.ancestor ? "anc" : ""}`;
      const relayout = key !== flipKey;
      if (relayout) {
        flipKey = key;
        L = layout(new Set(flipIds), { withAncestor: true, showAncestor: !!v.ancestor });
        nodeClade = computeNodeClades(L.root);
      }
      if (relayout) applyGeometry(prevView !== v);

      // Which leaves are in focus?
      const codes = new Set(v.codes ?? []);
      if (sel) codes.add(sel);
      const clades = new Set(v.clades ?? []);
      const hasFocus = codes.size > 0 || clades.size > 0 || !!v.outgroup || !!v.split;
      const leafOn = (d: TNode) => {
        if (!isLeaf(d)) return false;
        if (!hasFocus) return true;
        const c = d.data.code;
        if (codes.has(c)) return true;
        if (c === ANCESTOR) return !!v.ancestor;
        const cl = data.breeds[c].clade;
        if (cl && clades.has(cl)) return true;
        if (v.outgroup && (c === "WOLF" || c === "GDJK")) return true;
        if (v.split && d.data.frags > 1 && c !== "WOLF" && c !== "GDJK") return true;
        return false;
      };
      const onIds = new Set<number>();
      L.root.eachAfter((n) => {
        const t = n as TNode;
        if (isLeaf(t) ? leafOn(t) : (t.children as TNode[]).every((c) => onIds.has(c.data.id)))
          onIds.add(t.data.id);
      });

      const colorOf = (d: TNode) => {
        if (isAncestor(d)) return GOLD;
        if (v.color === "ink") return INK;
        if (isLeaf(d)) return cladeColor(data.breeds[d.data.code].clade, d.data.code);
        const c = nodeClade.get(d.data.id);
        return c ? cladeColor(c) : INK;
      };
      const ghost = !!v.links; // bundles take the stage

      const T = d3.transition("style").duration(DUR * 0.7);
      const ancOn = !!v.ancestor;
      linkSel
        .attr("stroke-dasharray", (d) => (isAncestor(d) ? "5 4" : null))
        .transition(T)
        .attr("stroke", (d) => (onIds.has(d.data.id) ? colorOf(d) : INK_DIM))
        .attr("stroke-width", (d) => (isAncestor(d) ? 2.4 : 0.9))
        .attr("stroke-opacity", (d) =>
          isAncestor(d) ? (ancOn ? 1 : 0) : ghost ? (hasFocus && onIds.has(d.data.id) ? 0.9 : 0.18) : onIds.has(d.data.id) ? 0.9 : 0.5,
        );
      wedgeSel.transition(T)
        .attr("fill", (d) => (onIds.has(d.data.id) ? colorOf(d) : INK_DIM))
        .attr("fill-opacity", (d) =>
          isAncestor(d)
            ? ancOn ? 0.75 : 0
            : !onIds.has(d.data.id)
            ? 0.3
            : ghost && !codes.has((d.data as { code: string }).code)
              ? 0.28
              : hasFocus
                ? 0.85
                : v.color === "ink"
                  ? 0.2
                  : 0.55,
        );
      labelSel
        .classed("hi", (d) => hasFocus && onIds.has(d.data.id))
        .transition(T)
        .attr("fill", (d) => (isAncestor(d) ? GOLD : onIds.has(d.data.id) ? (hasFocus ? tone("#fffaf0", LIGHT.hi) : tone("#b9b3a3", LIGHT.ink2)) : tone("#4a524c", LIGHT.dim)))
        .attr("fill-opacity", (d) => (isAncestor(d) ? (ancOn ? 1 : 0) : 1));
      hitSel.attr("pointer-events", (d) => (isAncestor(d) && !ancOn ? "none" : null));
      supportSel.transition(T).attr("opacity", v.support ? 1 : 0);
      // The family ring is a key, like the DNA web's: every band and name in full color whenever
      // it shows (the step's focus is carried by the tree's own wedges and names).
      gClade.transition(T).attr("opacity", v.cladeRing ? 1 : 0);
      gCladeHit.attr("display", v.cladeRing ? null : "none");
      const ring = v.ring ? new Set(v.ring) : null;
      gClade.selectAll<SVGPathElement, { clade: string }>("path.band")
        .transition(T)
        .attr("fill-opacity", (d) => (!ring || ring.has(d.clade) ? 1 : 0.15));
      gClade.selectAll<SVGTextElement, { clade: string }>("text")
        .transition(T)
        .attr("fill-opacity", (d) => (!ring || ring.has(d.clade) ? 1 : 0.25));

      drawTraces(v, sel);
      drawBundles(v, sel);
      drawDogs(v);
      zoomTo(v);
    }

    // ---------- MRCA traces ----------
    function mainLeaf(code: string) {
      return L.leaves.find((l) => isLeaf(l) && l.data.code === code && l.data.main);
    }

    function drawTraces(v: View, sel: string | null) {
      type Trace = { key: string; nodes: TNode[]; mrca: TNode; color: string };
      const traces: Trace[] = [];
      for (const [a, b] of v.paths ?? []) {
        const la = mainLeaf(a), lb = mainLeaf(b);
        if (!la || !lb) continue;
        const nodes = la.path(lb) as TNode[];
        const m = nodes.reduce((x, y) => (y.depth < x.depth ? y : x));
        traces.push({ key: `${a}-${b}`, nodes, mrca: m, color: GOLD });
      }
      if (sel) {
        const l = mainLeaf(sel);
        if (l) traces.push({ key: `sel-${sel}`, nodes: l.ancestors() as TNode[], mrca: L.root, color: GOLD });
      }

      const segs = traces.flatMap((t) =>
        t.nodes.filter((n) => n !== t.mrca && n.parent).map((n) => ({ key: `${t.key}:${n.data.id}`, n, color: t.color })),
      );
      gPath.selectAll<SVGPathElement, (typeof segs)[0]>("path")
        .data(segs, (d) => d.key)
        .join(
          (enter) => enter.append("path").attr("stroke-opacity", 0),
          (u) => u,
          (exit) => exit.transition().duration(300).attr("stroke-opacity", 0).remove(),
        )
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", 2.6)
        .attr("stroke-linecap", "round")
        .transition("trace").duration(DUR).ease(d3.easeCubicInOut)
        .attr("stroke-opacity", 1)
        .attrTween("d", function (d) {
          const self = this as SVGPathElement & { __g?: LinkGeom };
          const next = linkGeom(d.n);
          const i = d3.interpolateObject(self.__g ?? next, next);
          return (t) => linkPath((self.__g = i(t)));
        });

      const mrcas = traces.filter((t) => !t.key.startsWith("sel-"));
      const mk = gMarks.selectAll<SVGGElement, Trace>("g.mrca")
        .data(mrcas, (d) => d.key)
        .join(
          (enter) => {
            const g = enter.append("g").attr("class", "mrca").attr("opacity", 0);
            g.append("circle").attr("class", "pulse").attr("r", 5);
            g.append("circle").attr("r", 3.4).attr("fill", GOLD).attr("stroke", tone("#0d1110", LIGHT.bg)).attr("stroke-width", 1.5);
            return g;
          },
          (u) => u,
          (exit) => exit.transition().duration(300).attr("opacity", 0).remove(),
        );
      mk.transition("trace").duration(DUR).attr("opacity", 1).attrTween("transform", function (d) {
        const self = this as SVGGElement & { __p?: Pt };
        const next = { a: d.mrca.a, r: d.mrca.r };
        const i = d3.interpolateObject(self.__p ?? next, next);
        return (t) => {
          const p = (self.__p = i(t));
          const [x, y] = pol(p.a, p.r);
          return `translate(${x},${y})`;
        };
      });

      // Root marker for the outgroup step.
      const showRoot = !!v.outgroup;
      const rootMk = gMarks.selectAll<SVGGElement, number>("g.root-mk")
        .data(showRoot ? [1] : [])
        .join((enter) => {
          const g = enter.append("g").attr("class", "root-mk").attr("opacity", 0);
          g.append("circle").attr("class", "pulse").attr("r", 10);
          g.append("circle").attr("r", 5).attr("fill", cladeColor(null, "WOLF")).attr("stroke", tone("#0d1110", LIGHT.bg)).attr("stroke-width", 1.5);
          g.append("text").attr("x", 12).attr("y", -10).attr("class", "mk-label").text("root");
          return g;
        });
      rootMk.transition().duration(DUR).attr("opacity", 1);
      gMarks.selectAll("g.root-mk").filter(() => !showRoot).remove();
    }

    // ---------- hover: the hovered breed's line back to the grey wolf ----------
    // Whenever the whole circle is showing (not zoomed into a few wedges), pointing at a breed
    // draws its path through the tree to where it meets the grey wolf's branch, and labels the
    // wolf's end of the line in white.
    /** A branch: light up every branch and breed descended from it, and trace it to the wolf. */
    function traceBranch(n: TNode | null) {
      const branch = n && !isLeaf(n) ? n : null;
      zoomG.classed("branching", !!branch);
      const inner = branch ? (branch.descendants() as TNode[]).filter((x) => x !== branch) : [];
      gBranch.selectAll<SVGPathElement, TNode>("path.desc")
        .data(inner, (x) => String(x.data.id))
        .join("path")
        .attr("class", "desc")
        .attr("fill", "none")
        .attr("d", (x) => linkPath(linkGeom(x)))
        .attr("stroke", GOLD)
        .attr("stroke-width", 1.6)
        .attr("stroke-linecap", "round")
        .attr("stroke-opacity", 0.95);
      const leaves = inner.filter((x) => isLeaf(x) && x.data.code !== ANCESTOR);
      gBranch.selectAll<SVGPathElement, TNode>("path.leaf")
        .data(leaves, (x) => String(x.data.id))
        .join("path")
        .attr("class", "leaf")
        .attr("d", (x) => wedgePath({ a: x.a, r: x.r, a0: x.a0, a1: x.a1 }))
        .attr("fill", GOLD)
        .attr("fill-opacity", 0.55);
      const ids = new Set(leaves.map((x) => x.data.id));
      labelSel.classed("branch-hot", (x) => ids.has(x.data.id));
      traceToWolf(n);
    }

    function traceToWolf(d: TNode | null) {
      const wolf = mainLeaf("WOLF");
      const ok = d && (isLeaf(d) ? d.data.code !== "WOLF" && d.data.code !== ANCESTOR : !!d.parent);
      const on = ok && !current.zoom && wolf ? d : null;
      const nodes = on && wolf ? ((on as TNode).path(wolf as TNode) as TNode[]) : [];
      // (each node's own segment runs from its parent out to it; the leaves' wedges sit further out)
      const top = nodes.length ? nodes.reduce((x, y) => (y.depth < x.depth ? y : x)) : null;
      const iTop = top ? nodes.indexOf(top) : 0;
      const segs = nodes.filter((n) => n !== top).map((n) => ({ n, breedSide: nodes.indexOf(n) < iTop }));
      gWolf.selectAll<SVGPathElement, (typeof segs)[number]>("path")
        .data(segs, (s) => String(s.n.data.id))
        .join("path")
        .attr("d", (s) => linkPath(linkGeom(s.n)))
        .attr("stroke", (s) => (s.breedSide ? GOLD : INK))
        .attr("stroke-width", (s) => (s.breedSide ? 2.6 : 2))
        .attr("stroke-linecap", "round")
        .attr("stroke-opacity", 0.95);
      // Carry both ends out to the rim, where each breed's wedge (its data point) is drawn.
      const spokes = on && wolf
        ? [...(isLeaf(on) ? [{ key: "breed", a: on.a, r0: on.r, color: GOLD, w: 2.6 }] : []), { key: "wolf", a: wolf.a, r0: wolf.r, color: INK, w: 2 }]
        : [];
      gWolf.selectAll<SVGLineElement, (typeof spokes)[number]>("line.spoke")
        .data(spokes, (k) => k.key)
        .join("line")
        .attr("class", "spoke")
        .attr("x1", (k) => pol(k.a, k.r0)[0]).attr("y1", (k) => pol(k.a, k.r0)[1])
        .attr("x2", (k) => pol(k.a, GEOM.rWedge)[0]).attr("y2", (k) => pol(k.a, GEOM.rWedge)[1])
        .attr("stroke", (k) => k.color).attr("stroke-width", (k) => k.w).attr("stroke-linecap", "round").attr("stroke-opacity", 0.95);
      const marks = on && wolf && top ? [{ kind: "meet", a: top.a, r: top.r }, { kind: "wolf", a: wolf.a, r: GEOM.rWedge }] : [];
      const m = gWolf.selectAll<SVGGElement, (typeof marks)[number]>("g.wolf-mk")
        .data(marks, (k) => k.kind)
        .join((enter) => {
          const g = enter.append("g").attr("class", (k) => `wolf-mk ${k.kind}`);
          g.append("circle").attr("r", (k) => (k.kind === "wolf" ? 4.5 : 3.4))
            .attr("fill", (k) => (k.kind === "wolf" ? "#ffffff" : GOLD))
            .attr("stroke", tone("#0d1110", LIGHT.bg)).attr("stroke-width", 1.5);
          g.filter((k) => k.kind === "wolf").append("text").attr("class", "wolf-label").attr("text-anchor", "middle").text("Grey wolf");
          return g;
        })
        .attr("transform", (k) => {
          const [x, y] = pol(k.a, k.r);
          return `translate(${x},${y})`;
        });
      // The label sits just inside the circle, toward the centre, so it never covers the ring names.
      m.select("text.wolf-label").each(function (k) {
        const [dx, dy] = pol(k.a, -30);
        d3.select(this).attr("x", dx).attr("y", dy).attr("dy", "0.35em");
      });
    }

    // ---------- haplotype-sharing bundles ----------
    const line = d3.lineRadial<Pt>().angle((d) => d.a).radius((d) => d.r).curve(d3.curveBundle.beta(0.75));

    function drawBundles(v: View, sel: string | null) {
      type B = { key: string; pts: Pt[]; color: string; w: number; o: number };
      let pairs: [string, string, number][] = [];
      const focus = sel && v.explore ? [sel] : v.links && v.links !== "cross" ? v.links.codes : null;
      if (focus) pairs = data.links.filter(([a, b]) => focus.includes(a) || focus.includes(b));
      else if (v.links === "cross")
        pairs = data.links.filter(([a, b]) => {
          const ca = data.breeds[a].clade, cb = data.breeds[b].clade;
          return !ca || !cb || ca !== cb;
        });

      const maxV = d3.max(data.links, (d) => d[2]) ?? 1;
      const bundles: B[] = [];
      for (const [a, b, val] of pairs) {
        const la = mainLeaf(a), lb = mainLeaf(b);
        if (!la || !lb) continue;
        const nodes = la.path(lb) as TNode[];
        const pts = nodes.map((n) => ({ a: n.a, r: isLeaf(n) ? n.r : n.r * 0.92 }));
        const partner = focus ? (focus.includes(a) ? b : a) : a;
        bundles.push({
          key: `${a}|${b}`,
          pts,
          color: cladeColor(data.breeds[partner].clade, partner),
          w: focus ? 1 + 2.4 * Math.sqrt(val / maxV) : 0.5 + 1.6 * Math.sqrt(val / maxV),
          o: focus ? 0.85 : 0.42,
        });
      }

      // Bundles on their way out are left alone by later redraws (quick hovers come one after
      // another): they drop any pending fade-in and always finish fading out and leave.
      gBundles.selectAll<SVGPathElement, B>("path:not(.exiting)")
        .data(bundles, (d) => d.key)
        .join(
          (enter) => enter.append("path").attr("stroke-opacity", 0),
          (u) => u,
          (exit) => exit.classed("exiting", true).interrupt("bundle").transition("exit").duration(400).attr("stroke-opacity", 0).remove(),
        )
        .attr("d", (d) => line(d.pts))
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", (d) => d.w)
        .style("mix-blend-mode", "screen")
        .transition("bundle").duration(DUR).delay((_, i) => (focus ? Math.min(i * 25, 450) : Math.min(i * 2, 600)) * (FULL ? DUR / FULL : 0))
        .attr("stroke-opacity", (d) => d.o);
    }

    // ---------- individual dogs inside a zoomed wedge ----------
    function drawDogs(v: View) {
      const ls = v.zoom
        ? L.leaves.filter((l) => isLeaf(l) && v.zoom!.codes.includes(l.data.code) && l.data.main)
        : [];
      const dots = ls.flatMap((l) => {
        const n = (l.data as { n: number }).n;
        const pad = (l.a1 - l.a0) * 0.12;
        return d3.range(n).map((i) => ({
          key: `${l.data.id}:${i}`,
          a: l.a0 + pad + ((i + 0.5) * (l.a1 - l.a0 - 2 * pad)) / n,
        }));
      });
      gMarks.selectAll<SVGCircleElement, (typeof dots)[0]>("circle.dog")
        .data(dots, (d) => d.key)
        .join(
          (enter) => enter.append("circle").attr("class", "dog").attr("r", 1.2).attr("opacity", 0),
          (u) => u,
          (exit) => exit.transition().duration(250).attr("opacity", 0).remove(),
        )
        .attr("fill", tone("#0d1110", LIGHT.bg))
        .attr("cx", (d) => pol(d.a, GEOM.rWedge - 5)[0])
        .attr("cy", (d) => pol(d.a, GEOM.rWedge - 5)[1])
        .transition("dogs").delay((_, i) => DUR + i * 40).duration(250)
        .attr("opacity", 1);
    }

    // ---------- zoom ----------
    function zoomTo(v: View) {
      let k = 1, cx = 0, cy = 0;
      if (v.zoom) {
        const ls = L.leaves.filter((l) => isLeaf(l) && v.zoom!.codes.includes(l.data.code) && l.data.main);
        const a0 = d3.min(ls, (l) => l.a0)!, a1 = d3.max(ls, (l) => l.a1)!;
        const mid = (a0 + a1) / 2;
        [cx, cy] = pol(mid, GEOM.rWedge - 20);
        k = v.zoom.k;
      }
      zoomG.transition("zoom").duration(DUR * 1.2).ease(d3.easeCubicInOut)
        .attr("transform", `translate(${-k * cx},${-k * cy}) scale(${k})`);
    }

    // A click on the chart's empty space lets go of a pinned breed.
    branchSel
      .on("pointerenter", (ev: PointerEvent, d) => {
        if (pinner.busy || !gate.ok()) return;
        setHover({ kind: "branch", node: d });
        traceBranch(d);
        showBranchTip(ev, d);
      })
      .on("pointermove", (ev: PointerEvent, d) => {
        if (!gate.ok()) return;
        if (!pinner.busy && !zoomG.classed("branching")) {
          // the pointer was resting here when the step changed
          setHover({ kind: "branch", node: d });
          traceBranch(d);
        }
        showBranchTip(ev, d);
      })
      .on("pointerleave", () => {
        if (pinner.busy) return;
        tip.classed("on", false);
        traceBranch(null);
        setHover(null);
      })
      .on("click", (ev: MouseEvent, d) => {
        if (pinner.can() && pinner.toggle(`node:${d.data.id}`)) {
          setHover({ kind: "branch", node: d });
          traceBranch(d);
          showBranchTip(ev, d);
        }
      });

    // A new step clears any hover (and pin), and hovers wait for the pointer to really move.
    const onStep = () => {
      pinner.unpin();
      reported = null;
      tip.classed("on", false);
      onHoverRef.current?.(null);
      traceBranch(null);
      setHover(null);
      cladePanel(null);
      gate.lock();
    };
    dock?.addEventListener(STEP_CHANGE, onStep);
    svg.on("click.pin", (ev: MouseEvent) => {
      if (!(ev.target as Element).closest(".hits, .branch-hits, .clade-hits")) pinner.unpin();
    });

    applyGeometry(false);
    api.current = {
      // The page's view for the step; a hover in progress stays on top of it.
      update: (v, sel, instant, textFocus = false) => {
        stepView = v;
        stepSel = sel;
        // A name hovered in the text outranks the chart's own hover or pin while it lasts;
        // the pinned item's traces step aside and come back after.
        const own = hoverOn && !textFocus;
        gBranch.attr("display", textFocus ? "none" : null);
        gWolf.attr("display", textFocus ? "none" : null);
        DUR = instant ? 0 : FULL;
        try {
          update(own ? hoverView(hoverOn!) : v, own ? null : sel);
        } finally {
          DUR = FULL;
        }
      },
    };
    // A theme switch rebuilds the tree with the new colors; style it for the current step right
    // away, without replaying the step's animation. (The first build is styled by the effect below.)
    if (built.current) api.current.update(viewRef.current, selectedRef.current, true, textFocusRef.current);
    built.current = true;

    return () => {
      dock?.removeEventListener(STEP_CHANGE, onStep);
      pinner.dispose();
      d3.select(el).selectAll("*").remove();
      tip.remove();
      api.current = null;
    };
  }, [theme]);

  useEffect(() => {
    api.current?.update(view, selected, false, textFocus);
  }, [view, selected, textFocus]);

  // Compact: a viewBox just outside the clade ring. Names are hidden (CSS) because they'd be a
  // few pixels tall; the page lists what's highlighted and a tap shows a breed's details.
  useEffect(() => {
    const half = compact ? GEOM.rClade1 + 3 : W / 2;
    d3.select(host.current).select("svg").attr("viewBox", `${-half} ${-half} ${half * 2} ${half * 2}`);
  }, [compact, theme]); // the rebuild resets the viewBox

  return <div ref={host} className={`cladogram${compact ? " compact" : ""}`} />;
}
