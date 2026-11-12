"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as d3 from "d3";
import { CGEOM, circosData, cladeArcs, layoutLinks, links, nodeByCode, nodes, partnersOf, rawLinkByKey, type CEnd, type CLink, type CNode } from "@/lib/circos";
import { photoOf } from "@/lib/photos";
import { factsHtml } from "@/lib/breedFacts";
import { circosTree, elbow, treeCodeOf, type CTNode } from "@/lib/circosTree";
import { descendantsOf } from "@/lib/pairs";

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

const INK = "#e9e2d0";
/** Sister groups up to this many breeds get white lines all the way to their blocks. */
const RELATIVE_LIMIT = 6;
const DIM = "#2c3430";
/** Labels of breeds that share DNA with the selected breed (full chart). */
const CYAN = "#5fd3e2";
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
  spotlight = null,
  tipDock,
  compact = false,
}: {
  view: CircosView;
  ariaLabel?: string;
  /** When given, hover details go to the page instead of a floating tooltip. */
  onHover?: (h: CircosHover) => void;
  /** Clicking (or pressing Enter on) a breed's block. */
  onBreedClick?: (code: string) => void;
  /** Clicking anywhere else on the chart. */
  onBackgroundClick?: () => void;
  /** Breed highlighted from outside the chart (e.g. hovering its photo), shown like a hover. */
  spotlight?: string | null;
  /** Show the tooltip in this element (a fixed panel beside the chart) instead of at the pointer. */
  tipDock?: RefObject<HTMLElement | null>;
  /** Phone-size screens: crop to the ring of breed blocks (no name labels or family band). */
  compact?: boolean;
}) {
  const onBreedClickRef = useRef(onBreedClick);
  onBreedClickRef.current = onBreedClick;
  const onBgClickRef = useRef(onBackgroundClick);
  onBgClickRef.current = onBackgroundClick;
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ update: (v: CircosView) => void; spot: (code: string | null) => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DUR = reduce ? 0 : 750;

    const svg = d3.select(el).append("svg")
      .attr("viewBox", `${-W / 2} ${-W / 2} ${W} ${W}`)
      .attr("role", "img")
      .attr("aria-label", ariaLabel ?? "Circos plot of haplotype sharing between dog breeds from different clades.");

    const defs = svg.append("defs");
    const halo = defs.append("radialGradient").attr("id", "c-halo");
    halo.append("stop").attr("offset", "0%").attr("stop-color", "#18211d");
    halo.append("stop").attr("offset", "100%").attr("stop-color", "#0d1110").attr("stop-opacity", 0);
    svg.append("circle").attr("r", CGEOM.rOut + 20).attr("fill", "url(#c-halo)");

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
    const tip = d3.select(tipDock?.current ?? el).append("div").attr("class", "tip").attr("role", "status");

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
      .append("path").attr("d", "M0,0L10,5L0,10z").attr("fill", "#e8b74a");
    const wolf = nodeByCode.get("WOLF")!;
    const gStart = svg.append("g").attr("class", "start-mk").attr("opacity", 0);
    {
      const r = CGEOM.rIn - 16;
      const a0 = wolf.mid, a1 = wolf.mid - 0.32;
      const [x0, y0] = pol(a0, r), [x1, y1] = pol(a1, r);
      gStart.append("path").attr("fill", "none").attr("stroke", "#e8b74a").attr("stroke-width", 1.6)
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
      .attr("text-anchor", (d) => (d.mid % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) > Math.PI ? "end" : "start")
      .attr("transform", (d) => {
        const a = ((d.mid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const deg = (a * 180) / Math.PI - 90;
        return `rotate(${deg}) translate(${CGEOM.rLabel},0)${a > Math.PI ? " rotate(180)" : ""}`;
      })
      .text((d) => shortName(d.name));

    // ---------- clade ring ----------
    const bandArc = d3.arc<{ a0: number; a1: number }>()
      .innerRadius(CGEOM.rClade0).outerRadius(CGEOM.rClade1)
      .startAngle((d) => d.a0).endAngle((d) => d.a1);
    gClade.selectAll("path.band").data(cladeArcs).join("path").attr("class", "band")
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
    gClade.selectAll("path.tp").data(named).join("path").attr("class", "tp").attr("fill", "none")
      .attr("id", (d) => `ctp-${d.clade}`)
      .attr("d", (d) => {
        const m = ((d.mid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const bottom = m > Math.PI / 2 && m < (3 * Math.PI) / 2;
        const r = CGEOM.rCladeName + d.tier * 15 + (bottom ? 8 : 0);
        const [x0, y0] = pol(bottom ? d.mid + 0.6 : d.mid - 0.6, r);
        const [x1, y1] = pol(bottom ? d.mid - 0.6 : d.mid + 0.6, r);
        return `M${x0},${y0}A${r},${r} 0 0 ${bottom ? 0 : 1} ${x1},${y1}`;
      });
    gClade.selectAll("text").data(named).join("text").attr("class", "clade-name")
      .append("textPath").attr("href", (d) => `#ctp-${d.clade}`)
      .attr("startOffset", "50%").attr("text-anchor", "middle")
      .text((d) => circosData.clades[d.clade]);
    // With an onHover handler (the full chart), each family's band and name can be hovered.
    const hitArc = d3.arc<{ a0: number; a1: number }>()
      .innerRadius(CGEOM.rClade0 - 6).outerRadius(CGEOM.rCladeName + 34)
      .startAngle((d) => d.a0).endAngle((d) => d.a1);
    const cladeHits = gClade.selectAll("path.clade-hit").data(onHoverRef.current ? cladeArcs : []).join("path")
      .attr("class", "clade-hit").attr("d", (d) => hitArc(d)).attr("fill", "transparent")
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (d) => `${circosData.clades[d.clade]} family: show its tree and DNA sharing`)
      .on("pointerenter focus", (_, d) => {
        gClade.selectAll<SVGPathElement, { clade: string }>("path.band").classed("hover", (b) => b.clade === d.clade);
        onHoverRef.current?.({ kind: "clade", clade: d.clade });
      })
      .on("pointerleave blur", () => {
        gClade.selectAll("path.band").classed("hover", false);
        onHoverRef.current?.(null);
      });

    // ---------- state ----------
    let current: CircosView = { ribbons: "none" };
    let hover: string | null = null;
    let spot: string | null = null; // outside highlight; wins over the pointer
    const active = (v: CircosView) => spot ?? (v.interactive ? hover : null);
    let hoverRibbon: CLink | null = null;

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
          if (a && b) trace(a, b, "#e8b74a", "#e8b74a", "lines meet");
        } else if (breed && breed !== "WOLF") {
          const a = leafOf(breed), w = circosTree.mainLeaf.get("WOLF");
          if (a && w) {
            trace(a, w, "#e8b74a", INK, "split from wolves");
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
        .sort((x, y) => (x.color === "#e8b74a" ? 1 : 0) - (y.color === "#e8b74a" ? 1 : 0))
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
          g.append("circle").attr("r", 4.5).attr("fill", "#e8b74a").attr("stroke", "#0d1110").attr("stroke-width", 1.5);
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

    function render() {
      const v = current;
      let shown = visibleLinks(v);
      const h = active(v);
      const hoverOn = !!h;
      if (h)
        shown = layoutLinks(links.filter((l) => l.a === h || l.b === h).map((l) => rawLinkByKey.get(l.key)!));

      const focus = new Set(v.focus ?? []);
      if (hoverOn) {
        focus.clear();
        focus.add(h!);
      }
      const clades = new Set(spot ? [] : v.clades ?? []);
      const silent = !spot && !!v.silent;
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
      gClade.transition(T).attr("opacity", v.cladeRing ? 1 : 0);
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
          isPartner(d) ? CYAN : isKin(d) ? "#fffaf0" : on(d) ? (hasFocus ? "#fffaf0" : "#b9b3a3") : isEnd(d) ? "#ffffff" : "#4a524c",
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
          if (current.frozen) return;
          onHoverRef.current?.({ kind: "ribbon", key: d.key });
          hoverRibbon = d;
          // Fade the other ribbons so the hovered one and its tree path stand out.
          gRibbons.classed("dim", true).selectAll<SVGPathElement, CLink>("path").classed("hot", (x) => x.key === d.key);
          drawTreePaths(current);
        })
        .on("pointermove", (ev: PointerEvent, d) => showRibbonTip(ev, d))
        .on("pointerleave", () => {
          tip.classed("on", false);
          if (current.frozen) return;
          onHoverRef.current?.(null);
          hoverRibbon = null;
          gRibbons.classed("dim", false).selectAll("path").classed("hot", false);
          drawTreePaths(current);
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
      const ps = partnersOf(d.code);
      // A second sampled population (e.g. Italian cane corsos) uses its breed's photo and facts.
      const breed = d.code === "CHTM" ? "TIBM" : d.code === "COOS" ? "SALU" : d.code === "ITCC" ? "CANE" : d.code;
      const photo = photoOf(breed);
      tip.html(
        `${photo ? `<img class="tip-photo" src="${photo}" alt="" referrerpolicy="no-referrer" />` : ""}
         <div class="tip-name">${d.name}</div>
         <div class="tip-clade"><i style="background:${d.color}"></i>${cladeLabel(d)}</div>
         ${ps.length
           ? `<div class="tip-sub">Shares big chunks of DNA with ${ps.length} breed${ps.length === 1 ? "" : "s"} from other families</div>
              <dl>${ps.slice(0, 6).map((p) => `<dt>${nodeByCode.get(p.code)!.name}</dt><dd>${mb(p.value)}</dd>`).join("")}</dl>
              ${ps.length > 6 ? `<div class="tip-more">+ ${ps.length - 6} more</div>` : ""}`
           : `<div class="tip-note">No big DNA overlap with breeds from other families.</div>`}
         ${factsHtml(breed)}`,
      ).classed("on", true);
      place(ev);
    }
    function showRibbonTip(ev: PointerEvent, d: CLink) {
      if (onHoverRef.current) return;
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
      if (current.frozen) return;
      showSegTip(ev, d);
      onHoverRef.current?.({ kind: "breed", code: d.code });
      if (current.interactive) {
        hover = d.code;
        render();
      }
    }
    function leaveBreed() {
      tip.classed("on", false);
      if (current.frozen) return;
      onHoverRef.current?.(null);
      if (current.interactive && hover) {
        hover = null;
        render();
      }
    }
    function clickBreed(ev: MouseEvent, d: CNode) {
      if (!onBreedClickRef.current) return;
      ev.stopPropagation();
      onBreedClickRef.current(d.code);
    }

    segSel
      .on("pointerenter focus", enterBreed)
      .on("pointermove", (ev, d) => showSegTip(ev, d))
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
      .on("pointermove", (ev, d) => showSegTip(ev, d))
      .on("pointerleave", leaveBreed)
      .on("click", clickBreed);
    svg.on("click", () => onBgClickRef.current?.());

    api.current = {
      spot(code) {
        if (code === spot) return;
        spot = code;
        render();
      },
      update(v) {
        current = v;
        hover = null;
        hoverRibbon = null;
        gRibbons.classed("dim", false).selectAll("path").classed("hot", false);
        svg.classed("frozen", !!v.frozen);
        render();
      },
    };
    return () => {
      d3.select(el).selectAll("*").remove();
      tip.remove();
      api.current = null;
    };
  }, [ariaLabel]);

  useEffect(() => {
    api.current?.update(view);
  }, [view]);

  useEffect(() => {
    api.current?.spot(spotlight);
  }, [spotlight]);

  useEffect(() => {
    const half = compact ? CGEOM.rOut + 4 : W / 2;
    d3.select(host.current).select("svg").attr("viewBox", `${-half} ${-half} ${half * 2} ${half * 2}`);
  }, [compact, ariaLabel]);

  return <div ref={host} className={`circos${compact ? " compact" : ""}`} />;
}
