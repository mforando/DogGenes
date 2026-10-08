"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EVENTS, TIME_MAX, type HistoryEvent } from "@/lib/history";

export type TimelineView = { show: string[]; focus?: string[] };

const W = 1000;
const H = 600;
const AXIS_Y = 330;
const LANE = 48;
const X0 = 70;
const X1 = 930;
const COLOR: Record<HistoryEvent["kind"], string> = {
  dog: "#e8b74a",
  wolf: "#8fb3c9",
  human: "#e9e2d0",
  theory: "#c58fb8",
};
const LEGEND: [HistoryEvent["kind"], string][] = [
  ["wolf", "wolves"],
  ["dog", "dogs"],
  ["theory", "where it may have started"],
  ["human", "people"],
];

const laneY = (lane: number) => (lane > 0 ? AXIS_Y - lane * LANE - 6 : AXIS_Y + -lane * LANE + 30);

/** A to-scale timeline of the last 42,000 years of dog history, revealed step by step. */
export default function Timeline({ view }: { view: TimelineView }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((v: TimelineView) => void) | null>(null);

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DUR = reduce ? 0 : 700;
    const x = d3.scaleLinear().domain([TIME_MAX, 0]).range([X0, X1]);

    const svg = d3.select(el).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img")
      .attr("aria-label", "Timeline of dog history over the last 42,000 years, from the split with wolves to modern breeds.");

    // Ice-age shading: the cold peak around 25,000 years ago.
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "ice").attr("x1", 0).attr("x2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.02);
    grad.append("stop").attr("offset", "40%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.09);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.0);
    svg.append("rect").attr("x", x(36000)).attr("width", x(11700) - x(36000)).attr("y", 60).attr("height", AXIS_Y - 60)
      .attr("fill", "url(#ice)");
    svg.append("text").attr("x", x(24000)).attr("y", 52).attr("text-anchor", "middle").attr("class", "tl-era")
      .text("last Ice Age");

    // Axis.
    const axis = svg.append("g").attr("transform", `translate(0,${AXIS_Y})`);
    axis.append("line").attr("x1", X0).attr("x2", X1).attr("stroke", "#e9e2d0").attr("stroke-opacity", 0.5);
    for (const t of d3.range(40000, -1, -5000)) {
      axis.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", -4).attr("y2", 4).attr("stroke", "#e9e2d0").attr("stroke-opacity", 0.5);
      axis.append("text").attr("x", x(t)).attr("y", 20).attr("text-anchor", "middle").attr("class", "tl-tick")
        .text(t === 0 ? "today" : `${d3.format(",")(t)}`);
    }
    axis.append("text").attr("x", X0).attr("y", 38).attr("class", "tl-axis-label").text("years ago →");

    // Legend.
    const legend = svg.append("g").attr("transform", `translate(${X0},${H - 22})`);
    let lx = 0;
    for (const [k, label] of LEGEND) {
      legend.append("rect").attr("x", lx).attr("y", -9).attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", COLOR[k]);
      const t = legend.append("text").attr("x", lx + 16).attr("class", "tl-legend").text(label);
      lx += 16 + (t.node() as SVGTextElement).getComputedTextLength() + 22;
    }
    legend.append("text").attr("x", lx).attr("class", "tl-legend muted").text("dashed = debated");

    // Events.
    const ev = svg.append("g").selectAll<SVGGElement, HistoryEvent>("g.ev")
      .data(EVENTS, (d) => d.id)
      .join("g")
      .attr("class", "ev")
      .attr("opacity", 0);

    ev.each(function (d) {
      const g = d3.select(this);
      const y = laneY(d.lane);
      const c = COLOR[d.kind];
      const isRange = Array.isArray(d.at);
      const from = isRange ? (d.at as [number, number])[0] : (d.at as number);
      const to = isRange ? (d.at as [number, number])[1] : (d.at as number);
      const xa = x(from), xb = x(to);
      const right = from < 6000; // near "today": put labels on the left
      // Stem down (or up) to the axis.
      g.append("line").attr("x1", xa).attr("x2", xa).attr("y1", y).attr("y2", AXIS_Y)
        .attr("stroke", c).attr("stroke-opacity", 0.45).attr("stroke-dasharray", d.debated ? "3 3" : null);
      if (isRange) {
        g.append("rect").attr("class", "band").attr("x", xa).attr("y", y - 6).attr("height", 12).attr("rx", 6)
          .attr("width", Math.max(5, xb - xa)).attr("fill", c).attr("fill-opacity", d.kind === "theory" ? 0.55 : 0.8);
      } else {
        g.append("circle").attr("cx", xa).attr("cy", y).attr("r", 6).attr("fill", d.debated ? "#0d1110" : c)
          .attr("stroke", c).attr("stroke-width", 2).attr("stroke-dasharray", d.debated ? "2 2" : null);
      }
      const tx = right ? xa - 12 : isRange ? xa : xa + 12;
      const ty = isRange ? y - 29 : y - 5;
      g.append("text").attr("x", tx).attr("y", ty).attr("text-anchor", right ? "end" : "start")
        .attr("class", "tl-label").text(d.label);
      g.append("text").attr("x", tx).attr("y", ty + 16).attr("text-anchor", right ? "end" : "start")
        .attr("class", "tl-sub").text(d.sub);
      // (label sits on the first line, the date/detail on the second)
    });

    // On narrow screens the timeline scrolls sideways; start at the recent end.
    if (el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;

    api.current = (v) => {
      const show = new Set(v.show);
      const focus = new Set(v.focus ?? []);
      ev.transition().duration(DUR)
        .attr("opacity", (d) => (!show.has(d.id) ? 0 : focus.size === 0 || focus.has(d.id) ? 1 : 0.22));
      // Ranges grow from their start the first time they appear.
      ev.filter((d) => show.has(d.id) && Array.isArray(d.at)).select("rect.band")
        .filter(function () {
          return !(this as SVGRectElement & { __grown?: boolean }).__grown;
        })
        .each(function (d) {
          const r = this as SVGRectElement & { __grown?: boolean };
          r.__grown = true;
          const [from, to] = d.at as [number, number];
          d3.select(r).attr("width", 0).transition().duration(reduce ? 0 : 900).ease(d3.easeCubicOut)
            .attr("width", Math.max(5, x(to) - x(from)));
        });
    };
    return () => {
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    api.current?.(view);
  }, [view]);

  return <div ref={host} className="timeline" />;
}
