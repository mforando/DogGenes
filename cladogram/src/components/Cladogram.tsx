"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { data, GEOM, isLeaf, layout, nodeIdOf, type TNode } from "@/lib/tree";
import { cladeColor, OUTGROUP } from "@/lib/palette";
import type { View } from "@/lib/steps";
import { photoOf } from "@/lib/photos";

type Props = {
  view: View;
  selected: string | null;
  onSelect: (code: string | null) => void;
};

type Pt = { a: number; r: number };
type LinkGeom = { pa: number; pr: number; a: number; r: number };
type WedgeGeom = { a: number; r: number; a0: number; a1: number };
type ArcGeom = { a0: number; a1: number };

const INK = "#e9e2d0";
const INK_DIM = "#3a423d";
const GOLD = "#e8b74a";
const W = GEOM.size;

const pol = (a: number, r: number): [number, number] => [r * Math.sin(a), -r * Math.cos(a)];
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

/** Invisible hit area: the wedge's sector from the apex out past the label. */
function hitPath({ a, r, a0, a1 }: WedgeGeom) {
  const R = GEOM.rLabel + 120;
  const [ax, ay] = pol(a, Math.max(r, GEOM.rTree * 0.6));
  const [x0, y0] = pol(a0, R);
  const [x1, y1] = pol(a1, R);
  return `M${ax},${ay}L${x0},${y0}A${R},${R} 0 0 1 ${x1},${y1}Z`;
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
      m.set(t.data.id, data.breeds[t.data.code].clade);
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
    const c = data.breeds[l.data.code].clade;
    if (!c) continue;
    const last = spans[spans.length - 1];
    if (last && last.clade === c) last.a1 = l.a1;
    else spans.push({ clade: c, a0: l.a0, a1: l.a1 });
  }
  return spans;
}

const partnersOf = (code: string) =>
  data.links.filter(([a, b]) => a === code || b === code).map(([a, b, v]) => [a === code ? b : a, v] as const);

export default function Cladogram({ view, selected, onSelect }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ update: (v: View, sel: string | null) => void } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Build the SVG scaffold once.
  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DUR = reduce ? 0 : 900;

    const svg = d3
      .select(el)
      .append("svg")
      .attr("viewBox", `${-W / 2} ${-W / 2} ${W} ${W}`)
      .attr("role", "img")
      .attr(
        "aria-label",
        `Circular cladogram of ${data.stats.dogs} dogs from 161 breeds, rooted on the golden jackal.`,
      );

    const defs = svg.append("defs");
    const glow = defs.append("radialGradient").attr("id", "halo");
    glow.append("stop").attr("offset", "0%").attr("stop-color", "#1f2a25").attr("stop-opacity", 0.9);
    glow.append("stop").attr("offset", "100%").attr("stop-color", "#0d1110").attr("stop-opacity", 0);

    const zoomG = svg.append("g").attr("class", "zoom");
    zoomG.append("circle").attr("r", GEOM.rWedge + 40).attr("fill", "url(#halo)");
    const guides = zoomG.append("g").attr("class", "guides");
    for (const f of [0.25, 0.5, 0.75, 1]) {
      guides.append("circle").attr("r", GEOM.rTree * f).attr("fill", "none")
        .attr("stroke", "#1e2723").attr("stroke-width", 0.6);
    }

    const gLinks = zoomG.append("g").attr("class", "links").attr("fill", "none");
    const gWedges = zoomG.append("g").attr("class", "wedges");
    const gPath = zoomG.append("g").attr("class", "trace").attr("fill", "none");
    const gBundles = zoomG.append("g").attr("class", "bundles").attr("fill", "none");
    const gSupport = zoomG.append("g").attr("class", "support");
    const gClade = zoomG.append("g").attr("class", "clade-ring");
    const gLabels = zoomG.append("g").attr("class", "labels");
    const gMarks = zoomG.append("g").attr("class", "marks");
    const gHit = zoomG.append("g").attr("class", "hits");

    const tip = d3.select(el).append("div").attr("class", "tip").attr("role", "status");

    let L = layout();
    let flipKey = "";
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
        return d.data.main ? data.breeds[d.data.code].name : "";
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
        return bs >= 90 ? GOLD : bs >= 70 ? INK : "#0d1110";
      })
      .attr("stroke", (d) => ((d.data as { bs: number }).bs >= 70 ? "#0d1110" : INK))
      .attr("stroke-width", 0.8)
      .attr("opacity", 0);

    const hitSel = gHit
      .selectAll<SVGPathElement, TNode>("path")
      .data(L.leaves, (d) => d.data.id)
      .join("path")
      .attr("fill", "transparent")
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => (isLeaf(d) ? data.breeds[d.data.code].name : ""));

    // ---------- tooltip ----------
    function showTip(ev: PointerEvent | FocusEvent, d: TNode) {
      if (!isLeaf(d)) return;
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
         ${d.data.frags > 1 ? `<div class="tip-note">This breed is split into ${d.data.frags} wedges${d.data.main ? ". This is the biggest one." : "."}</div>` : ""}`,
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
      .on("pointermove", (ev, d) => showTip(ev, d))
      .on("focus", (ev, d) => showTip(ev, d))
      .on("pointerleave blur", () => tip.classed("on", false))
      .on("click", (_, d) => {
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
      const key = flipIds.join(",");
      const relayout = key !== flipKey;
      if (relayout) {
        flipKey = key;
        L = layout(new Set(flipIds));
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
        if (v.color === "ink") return INK;
        if (isLeaf(d)) return cladeColor(data.breeds[d.data.code].clade, d.data.code);
        const c = nodeClade.get(d.data.id);
        return c ? cladeColor(c) : INK;
      };
      const ghost = !!v.links; // bundles take the stage

      const T = d3.transition("style").duration(DUR * 0.7);
      linkSel.transition(T)
        .attr("stroke", (d) => (onIds.has(d.data.id) ? colorOf(d) : INK_DIM))
        .attr("stroke-opacity", (d) => (ghost ? 0.18 : onIds.has(d.data.id) ? 0.9 : 0.5));
      wedgeSel.transition(T)
        .attr("fill", (d) => (onIds.has(d.data.id) ? colorOf(d) : INK_DIM))
        .attr("fill-opacity", (d) =>
          !onIds.has(d.data.id)
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
        .attr("fill", (d) => (onIds.has(d.data.id) ? (hasFocus ? "#fffaf0" : "#b9b3a3") : "#4a524c"));
      supportSel.transition(T).attr("opacity", v.support ? 1 : 0);
      gClade.transition(T).attr("opacity", v.cladeRing ? 1 : 0);
      gClade.selectAll<SVGPathElement, { clade: string }>("path.band")
        .transition(T)
        .attr("fill-opacity", (d) => (clades.size === 0 || clades.has(d.clade) ? 1 : 0.15));
      gClade.selectAll<SVGTextElement, { clade: string }>("text")
        .transition(T)
        .attr("fill-opacity", (d) => (clades.size === 0 || clades.has(d.clade) ? 1 : 0.2));

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
            g.append("circle").attr("r", 3.4).attr("fill", GOLD).attr("stroke", "#0d1110").attr("stroke-width", 1.5);
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
          g.append("circle").attr("r", 5).attr("fill", OUTGROUP).attr("stroke", "#0d1110").attr("stroke-width", 1.5);
          g.append("text").attr("x", 12).attr("y", -10).attr("class", "mk-label").text("root");
          return g;
        });
      rootMk.transition().duration(DUR).attr("opacity", 1);
      gMarks.selectAll("g.root-mk").filter(() => !showRoot).remove();
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

      gBundles.selectAll<SVGPathElement, B>("path")
        .data(bundles, (d) => d.key)
        .join(
          (enter) => enter.append("path").attr("stroke-opacity", 0),
          (u) => u,
          (exit) => exit.transition().duration(400).attr("stroke-opacity", 0).remove(),
        )
        .attr("d", (d) => line(d.pts))
        .attr("stroke", (d) => d.color)
        .attr("stroke-width", (d) => d.w)
        .style("mix-blend-mode", "screen")
        .transition("bundle").duration(DUR).delay((_, i) => (focus ? i * 25 : Math.min(i * 2, 600)))
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
        .attr("fill", "#0d1110")
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

    applyGeometry(false);
    api.current = { update };

    return () => {
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    api.current?.update(view, selected);
  }, [view, selected]);

  return <div ref={host} className="cladogram" />;
}
