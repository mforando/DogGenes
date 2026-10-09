"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { lineage } from "@/lib/relatives";

const INK = "#e9e2d0";
const MUTED = "#8a8a7f";
const GOLD = "#e8b74a";
const BG = "#141a18";
const W = 280;
const ROW = 20;
const SPINE = 14;
const TIP = 30;

const nameOf = (c: string) => (c === "WOLF" ? "Grey wolf" : data.breeds[c]?.name ?? c);

/**
 * A compact list-tree for the details panel: the breed at the top, then each fork on its
 * line of descent, ending with the split from the grey wolf at the bottom. Each fork shows
 * the breeds that branched off there. Breeds developed FROM this breed (`exclude`) are its
 * descendants, not part of its line back to the wolf, so they're left out.
 */
export default function MiniLineage({ code, exclude = [] }: { code: string; exclude?: string[] }) {
  const host = useRef<HTMLDivElement>(null);
  const excludeKey = exclude.join(",");

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skip = new Set(exclude);
    const rungs = lineage(code)
      .slice()
      .reverse() // newest fork first
      .map((r) => ({ ...r, codes: r.codes.filter((c) => !skip.has(c)) }))
      .filter((r) => r.codes.length);
    const top = 18;
    const H = top + (rungs.length + 1) * ROW + 4;
    const y = (i: number) => top + i * ROW;

    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%")
      .attr("role", "img")
      .attr("aria-label", `Family line of the ${nameOf(code)}: ${rungs.length} forks back to the grey wolf.`);

    svg.append("line").attr("x1", SPINE).attr("x2", SPINE).attr("y1", y(0)).attr("y2", y(0))
      .attr("stroke", GOLD).attr("stroke-width", 2).attr("stroke-linecap", "round")
      .transition().duration(reduce ? 0 : 500).ease(d3.easeCubicOut).attr("y2", y(rungs.length));
    svg.append("circle").attr("cx", SPINE).attr("cy", y(0)).attr("r", 4.5).attr("fill", GOLD).attr("stroke", BG).attr("stroke-width", 1.5);
    svg.append("text").attr("x", TIP).attr("y", y(0)).attr("dy", "0.35em").attr("class", "ml-self").text(nameOf(code));

    const row = svg.selectAll<SVGGElement, (typeof rungs)[number]>("g.ml-row").data(rungs).join("g")
      .attr("class", "ml-row")
      .attr("transform", (_, i) => `translate(0,${y(i + 1)})`)
      .attr("opacity", 0);
    row.transition().delay((_, i) => (reduce ? 0 : 40 + i * 18)).duration(reduce ? 0 : 200).attr("opacity", 1);

    // Elbow in the tree's line colour, matching the relative lines on the circle chart.
    row.append("path").attr("fill", "none").attr("stroke", INK).attr("stroke-opacity", 0.6).attr("stroke-width", 1)
      .attr("d", `M${SPINE},0H${TIP - 8}`);
    row.each(function (r) {
      const g = d3.select(this);
      const bs = r.confidence;
      if (bs >= 90) g.append("circle").attr("cx", SPINE).attr("r", 3).attr("fill", GOLD).attr("stroke", BG).attr("stroke-width", 1);
      else if (bs >= 50)
        g.append("path").attr("transform", `translate(${SPINE},0)`).attr("d", d3.symbol(d3.symbolStar, 26)()!)
          .attr("fill", bs >= 70 ? INK : BG).attr("stroke", bs >= 70 ? BG : INK).attr("stroke-width", 0.8);
      else g.append("circle").attr("cx", SPINE).attr("r", 2.4).attr("fill", BG).attr("stroke", MUTED);
      g.append("title").text(`This split came up in ${Math.round(bs)} of 100 rebuilds of the tree`);

      const codes = r.codes;
      let color: string, label: string, sub = "";
      if (r.wolf) {
        color = "#d9d3c4";
        label = "Grey wolf";
      } else if (codes.length <= 2) {
        color = cladeColor(data.breeds[codes[0]]?.clade ?? null, codes[0]);
        label = codes.map(nameOf).join(", ");
      } else {
        const fams = d3.rollups(codes, (v) => v.length, (c) => data.breeds[c]?.clade ?? "_none")
          .filter(([f]) => f !== "_none").sort((a, b) => b[1] - a[1]);
        color = fams.length === 1 ? cladeColor(fams[0][0]) : INK;
        if (codes.length <= 4) label = `${nameOf(codes[0])} + ${codes.length - 1} more`;
        else if (fams.length === 1) label = `${codes.length} ${data.clades[fams[0][0]]} breeds`;
        else label = `${codes.length} breeds`;
        sub = fams.length > 1 ? `${fams.length} families` : "";
      }
      g.append("rect").attr("x", TIP - 7).attr("y", -3.5).attr("width", 7).attr("height", 7).attr("rx", 1.5)
        .attr("fill", codes.length > 4 && !r.wolf ? "none" : color).attr("stroke", color);
      const t = g.append("text").attr("x", TIP + 4).attr("dy", "0.35em")
        .attr("class", r.wolf ? "ml-name wolf" : "ml-name").text(label);
      if (sub) t.append("tspan").attr("class", "ml-sub").text(`  · ${sub}`);
      t.append("title").text(codes.map(nameOf).join(", "));
    });

    return () => {
      d3.select(el).selectAll("*").remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, excludeKey]);

  return <div ref={host} className="mini-lineage" />;
}
