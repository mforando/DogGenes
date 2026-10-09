"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { familyTree, lineage, type FamilyNode } from "@/lib/relatives";
import { photoOf } from "@/lib/photos";

const INK = "#e9e2d0";
const MUTED = "#8a8a7f";
const GOLD = "#e8b74a";
const BG = "#0d1110";
const DX = 30; // spacing between neighbouring tips
const DY = 34; // spacing between ancestor levels
const PHOTO = 26; // breed photo between the tip dot and its name
const PHOTO_GAP = 10; // space between the tip dot and the photo
const LABEL_SPACE = 190 + PHOTO + 6; // room above the tips for photos and (vertical) names

const nameOf = (c: string) => (c === "WOLF" ? "Grey wolf" : data.breeds[c].name);
const clip = (s: string, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
type P = d3.HierarchyPointNode<FamilyNode>;

/**
 * The selected breed's corner of the cladogram, drawn straight instead of round:
 * every tip (today's breeds, plus the grey wolf) sits on one row at the top, and the
 * forks between them hang below, deeper the further back the shared ancestor. The
 * root at the bottom is the split between dogs and grey wolves.
 */
export default function LineageTree({ code, onSelect }: { code: string; onSelect: (c: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const zoomApi = useRef<{ by: (k: number) => void; reset: () => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const tree = familyTree(code);
    if (!tree) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // d3.cluster puts every tip on the same level, like the published cladogram.
    const root = d3.hierarchy<FamilyNode>(tree, (d) => (d.kind === "fork" ? d.children : undefined));
    d3.cluster<FamilyNode>().nodeSize([DX, DY]).separation((a, b) => (a.parent === b.parent ? 1 : 1.25))(root);
    const nodes = root.descendants() as P[];
    const tips = root.leaves() as P[];

    // Flip vertically: tips (today) on top, the root (oldest split) at the bottom.
    const yMax = d3.max(nodes, (d) => d.y)!;
    const Y = (d: P) => yMax - d.y;
    const [x0, x1] = d3.extent(nodes, (d) => d.x) as [number, number];
    const pad = { l: 120, r: 60, t: LABEL_SPACE, b: 70 };
    const innerW = x1 - x0 + pad.l + pad.r;
    const innerH = yMax + pad.t + pad.b;

    const W = el.clientWidth;
    const H = el.clientHeight;
    d3.select(el).selectAll("svg").remove();
    const svg = d3.select(el).append("svg").attr("width", W).attr("height", H)
      .attr("role", "img")
      .attr("aria-label", `Family tree of the ${nameOf(code)} and its cousins, back to the split from the grey wolf.`);
    // One rounded-square clip, shared by every tip photo (they all sit at the same local spot).
    svg.append("defs").append("clipPath").attr("id", "lt-photo-clip")
      .append("rect").attr("x", -PHOTO / 2).attr("y", -PHOTO_GAP - PHOTO).attr("width", PHOTO).attr("height", PHOTO).attr("rx", 3);
    const g = svg.append("g");
    const content = g.append("g").attr("transform", `translate(${pad.l - x0},${pad.t})`);

    // Faint guide lines for ancestor levels.
    const levels = d3.range(0, root.height + 1);
    content.append("g").selectAll("line").data(levels).join("line")
      .attr("x1", x0 - 20).attr("x2", x1 + 20)
      .attr("y1", (l) => yMax - l * DY).attr("y2", (l) => yMax - l * DY)
      .attr("stroke", "#18201c");

    // ---------- elbow links, as in the circular cladogram ----------
    const spineNodes = new Set<P>();
    let s: P | null = nodes.find((n) => n.data.kind === "leaf" && n.data.self) ?? null;
    while (s) {
      spineNodes.add(s);
      s = s.parent;
    }
    const links = content.append("g").attr("fill", "none")
      .selectAll("path")
      .data(root.links() as d3.HierarchyPointLink<FamilyNode>[])
      .join("path")
      .attr("d", (l) => `M${l.source.x},${Y(l.source)}H${l.target.x}V${Y(l.target)}`)
      .attr("stroke", (l) => (spineNodes.has(l.target) ? GOLD : INK))
      .attr("stroke-opacity", (l) => (spineNodes.has(l.target) ? 0.95 : 0.5))
      .attr("stroke-width", (l) => (spineNodes.has(l.target) ? 2.4 : 1.2))
      .attr("stroke-linecap", "round");
    // Grow upward from the root, level by level.
    links.each(function (l) {
      const p = this as SVGPathElement;
      const len = p.getTotalLength();
      d3.select(p).attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", reduce ? 0 : len)
        .transition().delay(reduce ? 0 : (root.height - l.source.height) * 45).duration(reduce ? 0 : 380)
        .attr("stroke-dashoffset", 0);
    });

    // ---------- forks (shared ancestors) ----------
    const forks = content.append("g").selectAll<SVGGElement, P>("g")
      .data(nodes.filter((n) => n.data.kind === "fork"))
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${Y(d)})`);
    forks.each(function (d) {
      const f = d3.select(this);
      const { confidence: bs, spine } = d.data as { confidence: number; spine: boolean };
      const r = spine ? 1 : 0.75;
      if (bs >= 90) f.append("circle").attr("r", 4.6 * r).attr("fill", GOLD).attr("stroke", BG).attr("stroke-width", 1.4);
      else if (bs >= 50)
        f.append("path").attr("d", d3.symbol(d3.symbolStar, 64 * r * r)()!)
          .attr("fill", bs >= 70 ? INK : BG).attr("stroke", bs >= 70 ? BG : INK).attr("stroke-width", 1);
      else f.append("circle").attr("r", 3.4 * r).attr("fill", BG).attr("stroke", MUTED).attr("stroke-width", 1.2);
      if (spine) {
        f.append("text").attr("x", -9).attr("dy", "-0.45em").attr("text-anchor", "end").attr("class", "lt-conf")
          .attr("fill", bs >= 90 ? GOLD : bs >= 50 ? INK : MUTED)
          .text(bs >= 50 ? `${Math.round(bs)}%` : "unsure");
      }
      f.append("title").text(`Shared ancestor · this grouping came up in ${Math.round(bs)} of 100 rebuilds`);
    });
    forks.attr("opacity", 0).transition().delay((d) => (reduce ? 0 : (root.height - d.height) * 45 + 150))
      .duration(reduce ? 0 : 300).attr("opacity", 1);

    // ---------- tips: today's breeds, all on one row ----------
    const tip = content.append("g").selectAll<SVGGElement, P>("g")
      .data(tips)
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${Y(d)})`);
    tip.each(function (d) {
      const t = d3.select(this);
      if (d.data.kind === "group") {
        // A collapsed swathe of the tree, drawn as a wedge like the paper's figure.
        const codes = d.data.codes;
        const fams = d3.rollups(codes, (v) => v.length, (c) => data.breeds[c]?.clade ?? "_none")
          .filter(([f]) => f !== "_none").sort((a, b) => b[1] - a[1]);
        const fill = fams.length === 1 ? cladeColor(fams[0][0]) : INK;
        t.append("path").attr("d", "M0,0L-9,-22H9Z").attr("fill", fill).attr("fill-opacity", 0.35)
          .attr("stroke", fill).attr("stroke-opacity", 0.8);
        const label = fams.length === 1
          ? `${codes.length} ${data.clades[fams[0][0]]} breeds`
          : `${codes.length} breeds · ${fams.length} families`;
        t.append("text").attr("transform", "translate(0,-28) rotate(-90)").attr("dy", "0.35em")
          .attr("class", "lt-group").text(label)
          .append("title").text(fams.map(([f, n]) => `${data.clades[f]} (${n})`).join(", "));
        return;
      }
      const { code: c, self } = d.data as { code: string; self: boolean };
      const sameBreed = c === code && !self;
      t.append("circle").attr("r", self ? 7 : 4.5)
        .attr("fill", self ? GOLD : cladeColor(data.breeds[c]?.clade ?? null, c))
        .attr("stroke", BG).attr("stroke-width", 1.5);
      if (self) t.append("circle").attr("r", 12).attr("class", "lt-pulse");
      // A small photo of the breed, just above its tip.
      const url = c === "WOLF" ? undefined : photoOf(c);
      const py = -PHOTO_GAP - PHOTO;
      const ph = t.append("g").attr("class", "lt-photo");
      if (url) {
        ph.append("image").attr("href", url).attr("x", -PHOTO / 2).attr("y", py).attr("width", PHOTO).attr("height", PHOTO)
          .attr("preserveAspectRatio", "xMidYMid slice").attr("clip-path", "url(#lt-photo-clip)")
          .attr("referrerpolicy", "no-referrer");
      }
      ph.append("rect").attr("x", -PHOTO / 2).attr("y", py).attr("width", PHOTO).attr("height", PHOTO).attr("rx", 3)
        .attr("fill", "none")
        .attr("stroke", self ? GOLD : url ? "rgba(233,226,208,0.35)" : cladeColor(data.breeds[c]?.clade ?? null, c))
        .attr("stroke-width", self ? 2 : 1)
        .attr("stroke-dasharray", url ? null : "3 2");
      ph.append("title").text(nameOf(c));
      if (!self && c !== "WOLF") ph.style("cursor", "pointer").on("click", () => onSelectRef.current(c));
      const label = t.append("text").attr("transform", `translate(0,${py - (self ? 8 : 5)}) rotate(-90)`)
        .attr("dy", "0.35em")
        .attr("class", self ? "lt-self-tip" : `lt-name${c === "WOLF" ? " wolf" : ""}${sameBreed ? " same" : ""}`)
        .text(clip(nameOf(c)) + (sameBreed ? " (other dogs)" : ""));
      label.append("title").text(nameOf(c));
      if (!self && c !== "WOLF") {
        label.attr("tabindex", 0).attr("role", "button").attr("aria-label", `Show ${nameOf(c)}`)
          .on("click", () => onSelectRef.current(c))
          .on("keydown", (ev: KeyboardEvent) => {
            if (ev.key === "Enter" || ev.key === " ") {
              ev.preventDefault();
              onSelectRef.current(c);
            }
          });
      }
    });
    tip.attr("opacity", 0).transition().delay(reduce ? 0 : root.height * 45 + 200).duration(reduce ? 0 : 400)
      .attr("opacity", 1);

    // Direction cues.
    content.append("text").attr("class", "lt-era").attr("x", x0 - 100).attr("y", 4).text("today");
    content.append("text").attr("class", "lt-era").attr("x", x0 - 100).attr("y", yMax + 4)
      .text("↓ further back");
    content.append("text").attr("class", "lt-root").attr("x", root.x as number).attr("y", yMax + 26)
      .attr("text-anchor", "middle").text("shared ancestor of dogs and grey wolves");

    // ---------- pan & zoom ----------
    // "Fit" shows the whole tree; the opening view stays readable and, on big trees,
    // starts at the top-left corner where the selected breed and its closest cousins are.
    const kAll = Math.min(1, (W - 12) / innerW, (H - 12) / innerH);
    const fit = d3.zoomIdentity.translate(Math.max(6, (W - innerW * kAll) / 2), 6).scale(kAll);
    const k0 = Math.max(0.8, kAll);
    const start = kAll >= 0.8 ? fit : d3.zoomIdentity.translate(6, 6).scale(k0);
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.25, 2.5])
      .translateExtent([[-150, -150], [innerW + 150, innerH + 150]])
      // Plain wheel pans; pinch / ctrl+wheel zooms.
      .filter((ev: Event) => (ev.type === "wheel" ? (ev as WheelEvent).ctrlKey : !(ev as MouseEvent).button))
      .on("zoom", (ev) => g.attr("transform", ev.transform.toString()));
    svg.call(zoom).call(zoom.transform, start).on("dblclick.zoom", null);
    svg.on("wheel.pan", (ev: WheelEvent) => {
      if (ev.ctrlKey) return;
      ev.preventDefault();
      const k = d3.zoomTransform(svg.node()!).k;
      const dx = ev.shiftKey ? ev.deltaY : ev.deltaX;
      const dy = ev.shiftKey ? 0 : ev.deltaY;
      zoom.translateBy(svg, -dx / k, -dy / k);
    });
    zoomApi.current = {
      by: (k) => svg.transition().duration(300).call(zoom.scaleBy, k),
      reset: () => svg.transition().duration(400).call(zoom.transform, fit),
    };

    return () => {
      d3.select(el).selectAll("svg").remove();
      zoomApi.current = null;
    };
  }, [code]);

  const forks = lineage(code).length;
  return (
    <div className="lineage">
      <div className="lineage-head">
        <p className="lineage-title">
          The <strong>{nameOf(code)}</strong>&rsquo;s family tree
        </p>
        <p className="lineage-sub">
          Today&rsquo;s breeds line up along the top, with the {nameOf(code)} first and its
          closest cousins beside it. Follow any two breeds down until their lines join: the
          higher the join, the closer the relatives. The gold line runs {forks} forks back to
          the split from the grey wolf. Scroll or drag to move around and pinch (or
          Ctrl + scroll) to zoom. Triangles are big groups of breeds folded together.
        </p>
      </div>
      <div className="lineage-wrap">
        <div ref={host} className="lineage-svg" />
        <div className="lt-zoom" role="group" aria-label="Zoom">
          <button type="button" onClick={() => zoomApi.current?.by(1.3)} aria-label="Zoom in">+</button>
          <button type="button" onClick={() => zoomApi.current?.by(1 / 1.3)} aria-label="Zoom out">−</button>
          <button type="button" onClick={() => zoomApi.current?.reset()} aria-label="Show the whole tree">Whole tree</button>
        </div>
      </div>
    </div>
  );
}
