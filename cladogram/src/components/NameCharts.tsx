"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const INK = "#e9e2d0";
const GOLD = "#e8b74a";

/** Horizontal bars for "N× more likely" lifts within one group. */
export function LiftBars({ items: raw, max }: { items: { name: string; n: number; lift: number }[]; max: number }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    // Largest lift at the top; ties go to the more common name.
    const items = [...raw].sort((a, b) => b.lift - a.lift || b.n - a.n);
    const left = 92, right = 76, rowH = 22;
    const W = 360, H = items.length * rowH + 4;
    const x = d3.scaleLog().domain([1, Math.max(2, max)]).range([0, W - left - right]).clamp(true);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", items.map((d) => `${d.name}, ${d.lift} times more likely`).join("; "));
    const g = svg.selectAll("g").data(items).join("g").attr("transform", (_, i) => `translate(0,${i * rowH})`);
    g.append("text").attr("x", left - 8).attr("y", rowH / 2).attr("dy", "0.35em").attr("text-anchor", "end").attr("class", "nm-name").text((d) => d.name);
    g.append("rect").attr("x", left).attr("y", 5).attr("height", rowH - 10).attr("rx", 2).attr("fill", GOLD).attr("fill-opacity", 0.85)
      .attr("width", 0).transition().duration(600).delay((_, i) => i * 25).attr("width", (d) => Math.max(2, x(Math.max(1, d.lift))));
    g.append("text").attr("x", (d) => left + Math.max(2, x(Math.max(1, d.lift))) + 6).attr("y", rowH / 2).attr("dy", "0.35em")
      .attr("class", "nm-lift").text((d) => `${d.lift}× · ${d.n}`);
    return () => {
      d3.select(el).selectAll("*").remove();
    };
  }, [raw, max]);
  return <div ref={host} className="nm-lifts" />;
}

/** Size mix for one name compared with all NYC dogs. */
export function SizeCompare({ sizes, counts, base }: { sizes: string[]; counts: number[]; base: number[] }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    const total = d3.sum(counts) || 1;
    const share = counts.map((c) => c / total);
    const W = 420, left = 120, right = 50, rowH = 26, H = sizes.length * rowH + 22;
    const x = d3.scaleLinear().domain([0, Math.max(0.5, d3.max(share)!, d3.max(base)!)]).range([left, W - right]);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Size mix of dogs with this name compared with all NYC dogs");
    const g = svg.selectAll("g").data(sizes).join("g").attr("transform", (_, i) => `translate(0,${i * rowH})`);
    g.append("text").attr("x", left - 8).attr("y", rowH / 2).attr("dy", "0.35em").attr("text-anchor", "end").attr("class", "nm-name").text((d) => d.split(" (")[0]);
    g.append("rect").attr("x", left).attr("y", 6).attr("height", rowH - 12).attr("rx", 2).attr("fill", GOLD)
      .attr("width", (_, i) => Math.max(1, x(share[i]) - left));
    // NYC-wide share as a tick
    g.append("line").attr("x1", (_, i) => x(base[i])).attr("x2", (_, i) => x(base[i])).attr("y1", 3).attr("y2", rowH - 3)
      .attr("stroke", INK).attr("stroke-width", 2);
    g.append("text").attr("x", (_, i) => Math.max(x(share[i]), x(base[i])) + 6).attr("y", rowH / 2).attr("dy", "0.35em")
      .attr("class", "nm-lift").text((_, i) => `${Math.round(share[i] * 100)}%`);
    svg.append("line").attr("x1", left).attr("x2", left + 14).attr("y1", H - 8).attr("y2", H - 8).attr("stroke", INK).attr("stroke-width", 2)
      .attr("transform", `rotate(90 ${left + 7} ${H - 8})`);
    svg.append("text").attr("x", left + 16).attr("y", H - 8).attr("dy", "0.35em").attr("class", "nm-lift").text("= share among all NYC dogs");
    return () => {
      d3.select(el).selectAll("*").remove();
    };
  }, [sizes, counts, base]);
  return <div ref={host} className="nm-size" />;
}
