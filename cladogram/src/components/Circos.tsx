"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CGEOM, circosData, cladeArcs, layoutLinks, links, nodeByCode, nodes, partnersOf, rawLinkByKey, type CEnd, type CLink, type CNode } from "@/lib/circos";
import { photoOf } from "@/lib/photos";

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
};

const INK = "#e9e2d0";
const DIM = "#2c3430";
const W = CGEOM.size;
const mb = (v: number) => `${(v / 1e6).toFixed(1)} Mb`;
const pol = (a: number, r: number): [number, number] => [r * Math.sin(a), -r * Math.cos(a)];

function cladeLabel(n: CNode) {
  if (n.code === "WOLF") return "Wild relative";
  return n.clade ? circosData.clades[n.clade] : "Loner (no clear family)";
}

export default function Circos({ view, ariaLabel }: { view: CircosView; ariaLabel?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ update: (v: CircosView) => void } | null>(null);

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

    const gRibbons = svg.append("g").attr("class", "ribbons");
    const gSegs = svg.append("g").attr("class", "segs");
    const gLabels = svg.append("g").attr("class", "codes");
    const gClade = svg.append("g").attr("class", "clade-ring").attr("opacity", 0);
    const tip = d3.select(el).append("div").attr("class", "tip").attr("role", "status");

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
      .text((d) => d.code);

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

    // ---------- state ----------
    let current: CircosView = { ribbons: "none" };
    let hover: string | null = null;

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
      const hoverOn = v.interactive && hover;
      if (hoverOn)
        shown = layoutLinks(links.filter((l) => l.a === hover || l.b === hover).map((l) => rawLinkByKey.get(l.key)!));

      const focus = new Set(v.focus ?? []);
      if (hoverOn) {
        focus.clear();
        focus.add(hover!);
        for (const p of partnersOf(hover!)) focus.add(p.code);
      }
      const clades = new Set(v.clades ?? []);
      const hasFocus = focus.size > 0 || clades.size > 0 || !!v.silent;
      const on = (n: CNode) =>
        !hasFocus ||
        focus.has(n.code) ||
        (!!n.clade && clades.has(n.clade)) ||
        (!!v.silent && n.degree === 0);

      const T = d3.transition().duration(hoverOn !== null && v.interactive ? DUR * 0.4 : DUR);
      segSel.transition(T).attr("fill", (d) => (on(d) ? d.color : DIM));
      labelSel
        .classed("hi", (d) => hasFocus && on(d))
        .transition(T)
        .attr("fill", (d) => (on(d) ? (hasFocus ? "#fffaf0" : "#b9b3a3") : "#4a524c"));
      gClade.transition(T).attr("opacity", v.cladeRing ? 1 : 0);
      gStart.transition(T).attr("opacity", v.start ? 1 : 0);

      const many = shown.length > 40;
      const baseOpacity = v.silent ? 0.12 : many ? 0.62 : 0.82;
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
        .on("pointermove", (ev: PointerEvent, d) => showRibbonTip(ev, d))
        .on("pointerleave", () => tip.classed("on", false))
        .transition(T)
        .delay((_, i) => (hoverOn || !many ? i * 30 : Math.min(i * 3, 500)))
        .attr("fill-opacity", baseOpacity)
        .attr("stroke-opacity", v.silent ? 0.2 : 0.9)
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
      const ps = partnersOf(d.code);
      const photo = photoOf(d.code === "CHTM" ? "TIBM" : d.code === "COOS" ? "SALU" : d.code === "ITCC" ? "CANE" : d.code);
      tip.html(
        `${photo ? `<img class="tip-photo" src="${photo}" alt="" referrerpolicy="no-referrer" />` : ""}
         <div class="tip-name">${d.name} <span class="tip-code">${d.code}</span></div>
         <div class="tip-clade"><i style="background:${d.color}"></i>${cladeLabel(d)}</div>
         ${ps.length
           ? `<div class="tip-sub">Shares big chunks of DNA with ${ps.length} breed${ps.length === 1 ? "" : "s"} from other families</div>
              <dl>${ps.slice(0, 6).map((p) => `<dt>${nodeByCode.get(p.code)!.name}</dt><dd>${mb(p.value)}</dd>`).join("")}</dl>
              ${ps.length > 6 ? `<div class="tip-more">+ ${ps.length - 6} more</div>` : ""}`
           : `<div class="tip-note">No big DNA overlap with breeds from other families.</div>`}`,
      ).classed("on", true);
      place(ev);
    }
    function showRibbonTip(ev: PointerEvent, d: CLink) {
      const a = nodeByCode.get(d.a)!, b = nodeByCode.get(d.b)!;
      tip.html(
        `<div class="tip-name">${a.name} ↔ ${b.name}</div>
         <dl><dt>Shared DNA</dt><dd>${mb(d.value)}</dd>
         <dt>Color comes from</dt><dd>${nodeByCode.get(d.hub)!.name}</dd></dl>`,
      ).classed("on", true);
      place(ev);
    }

    segSel
      .on("pointerenter focus", (ev, d) => {
        showSegTip(ev, d);
        if (current.interactive) {
          hover = d.code;
          render();
        }
      })
      .on("pointermove", (ev, d) => showSegTip(ev, d))
      .on("pointerleave blur", () => {
        tip.classed("on", false);
        if (current.interactive && hover) {
          hover = null;
          render();
        }
      });

    api.current = {
      update(v) {
        current = v;
        hover = null;
        render();
      },
    };
    return () => {
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, [ariaLabel]);

  useEffect(() => {
    api.current?.update(view);
  }, [view]);

  return <div ref={host} className="circos" />;
}
