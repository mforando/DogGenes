"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const INK = "#e9e2d0";
const MUTED = "#8a8a7f";
const GOLD = "#e8b74a";
const GRID = "#1c2420";

type ModelRow = { label: string; accuracy: number; baseline: number; top3: number; baseline_top3: number; classes: number };

/** Dumbbell chart: model accuracy vs. always guessing the most common answer. */
export function AccuracyChart({ rows }: { rows: ModelRow[] }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current!;
    const left = 230, right = 60, rowH = 54, top = 36;
    const W = 860, H = top + rows.length * rowH + 30;
    const x = d3.scaleLinear().domain([0, 0.6]).range([left, W - right - 90]);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "How often a name-based guess is right, compared with always guessing the most common answer");
    for (const t of x.ticks(5)) {
      svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", top - 10).attr("y2", H - 24).attr("stroke", GRID);
      svg.append("text").attr("x", x(t)).attr("y", H - 8).attr("text-anchor", "middle").attr("class", "mb-tick").text(`${Math.round(t * 100)}%`);
    }
    // Legend
    const lg = svg.append("g").attr("transform", `translate(${left},12)`);
    lg.append("circle").attr("r", 5).attr("fill", "none").attr("stroke", MUTED).attr("stroke-width", 2);
    lg.append("text").attr("x", 10).attr("dy", "0.35em").attr("class", "mb-axis").text("always guess the most common answer");
    lg.append("circle").attr("cx", 270).attr("r", 5.5).attr("fill", GOLD);
    lg.append("text").attr("x", 280).attr("dy", "0.35em").attr("class", "mb-axis").text("guess from the dog's name");

    const row = svg.selectAll("g.ac").data(rows).join("g").attr("transform", (_, i) => `translate(0,${top + i * rowH + rowH / 2})`);
    row.append("text").attr("x", left - 14).attr("dy", "-0.1em").attr("text-anchor", "end").attr("class", "mb-name").attr("fill", INK).text((d) => d.label);
    row.append("text").attr("x", left - 14).attr("dy", "1.2em").attr("text-anchor", "end").attr("class", "mb-tick").text((d) => `${d.classes} possible answers`);
    row.append("line").attr("x1", (d) => x(Math.min(d.accuracy, d.baseline))).attr("x2", (d) => x(Math.min(d.accuracy, d.baseline)))
      .attr("stroke", (d) => (d.accuracy > d.baseline ? GOLD : MUTED)).attr("stroke-width", 3).attr("stroke-opacity", 0.6)
      .transition().duration(900).attr("x2", (d) => x(Math.max(d.accuracy, d.baseline)));
    row.append("circle").attr("cx", (d) => x(d.baseline)).attr("r", 6).attr("fill", "#0d1110").attr("stroke", MUTED).attr("stroke-width", 2);
    row.append("circle").attr("cx", (d) => x(d.baseline)).attr("r", 7).attr("fill", GOLD)
      .transition().duration(900).attr("cx", (d) => x(d.accuracy));
    row.append("text").attr("class", "mb-val").attr("fill", INK).attr("dy", "0.35em")
      .attr("x", (d) => x(Math.max(d.accuracy, d.baseline)) + 14)
      .text((d) => {
        const diff = d.accuracy - d.baseline;
        return `${Math.round(d.accuracy * 100)}% vs ${Math.round(d.baseline * 100)}%${Math.abs(diff) < 0.02 ? " · no real help" : ""}`;
      });
    return () => {
      d3.select(el).selectAll("*").remove();
    };
  }, [rows]);
  return <div ref={host} className="mixing-bars nm-acc" />;
}

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
