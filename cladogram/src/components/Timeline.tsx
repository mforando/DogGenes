"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { agoLabel, ANCIENT_BREEDS, EVENTS, MILESTONES, MODERN_BREEDS, NOW, TIME_MAX, type HistoryEvent } from "@/lib/history";
import { photoOf } from "@/lib/photos";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";

/**
 * `mode: "modern"` shows the last ~230 years with dated breeds; `"deep"` (default) shows the
 * last 42,000 years. Switching animates a zoom between the two.
 */
export type TimelineView = { show: string[]; focus?: string[]; mode?: "modern" | "farming" | "deep" };

/** Years shown (back from today) for each zoom level. */
const FARMING_SPAN = 13000; // just past the start of farming, before the Ice Age

const W = 1000;
const H = 800;
const AXIS_Y = 330;
const LANE = 48;
const X0 = 70;
const X1 = 930;
const MODERN_SPAN = NOW - 1795; // years shown in the modern view
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
const PHOTO_R = 28;

const laneY = (lane: number) => (lane > 0 ? AXIS_Y - lane * LANE - 6 : AXIS_Y + -lane * LANE + 30);
// Modern breeds: rows above (1, 2, ...) and below (-1, -2, ...) the axis. Each label is one
// word per line, so rows are narrow; each row is only as tall as its tallest label.
const LINE_H = 12;
const STEM = 20; // gap between the axis and the nearest row of photos
const ROW_GAP = 6;

export default function Timeline({ view }: { view: TimelineView }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((v: TimelineView) => void) | null>(null);

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DUR = reduce ? 0 : 700;
    let span = MODERN_SPAN; // current x-domain (years ago at the left edge)
    const x = d3.scaleLinear().domain([span, 0]).range([X0, X1]);

    const svg = d3.select(el).append("svg")
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img")
      .attr("aria-label", "Timeline of dog history, from breeds created in the last 200 years back to the split with wolves 40,000 years ago.");
    const defs = svg.append("defs");
    defs.append("clipPath").attr("id", "tl-plot").append("rect").attr("x", X0 - 16).attr("y", 0).attr("width", X1 - X0 + 40).attr("height", H);
    const plot = svg.append("g").attr("clip-path", "url(#tl-plot)");

    // ---------- Ice Age band (deep view) ----------
    const ICE_END = 11700, LGM: [number, number] = [26000, 20000];
    const bandY = 24, bandH = 18;
    const wash = defs.append("linearGradient").attr("id", "ice").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
    wash.append("stop").attr("offset", "0%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.1);
    wash.append("stop").attr("offset", "100%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.02);
    const ice = plot.append("g").attr("class", "tl-ice");
    const iceWash = ice.append("rect").attr("y", bandY + bandH).attr("height", AXIS_Y - bandY - bandH).attr("fill", "url(#ice)");
    const iceBand = ice.append("path").attr("fill", "#8fb3c9").attr("fill-opacity", 0.22).attr("stroke", "#8fb3c9").attr("stroke-opacity", 0.5);
    const iceLgm = ice.append("rect").attr("y", bandY).attr("height", bandH).attr("fill", "#8fb3c9").attr("fill-opacity", 0.45);
    const iceEnd = ice.append("line").attr("y1", bandY).attr("y2", AXIS_Y).attr("stroke", "#8fb3c9").attr("stroke-opacity", 0.45).attr("stroke-dasharray", "2 3");
    const iceL1 = ice.append("text").attr("y", bandY + bandH / 2).attr("dy", "0.35em").attr("class", "tl-ice-label").text("◂ Last Ice Age · began ~115,000 years ago");
    const iceL2 = ice.append("text").attr("y", bandY + bandH / 2).attr("dy", "0.35em").attr("text-anchor", "middle").attr("class", "tl-ice-label strong").text("coldest");
    const iceL3 = ice.append("text").attr("y", bandY + bandH / 2).attr("dy", "0.35em").attr("class", "tl-ice-label").text("ends 11,700 years ago");

    // ---------- axis ----------
    svg.append("line").attr("x1", X0).attr("x2", X1).attr("y1", AXIS_Y).attr("y2", AXIS_Y).attr("stroke", "#e9e2d0").attr("stroke-opacity", 0.5);
    const ticks = svg.append("g").attr("transform", `translate(0,${AXIS_Y})`);
    const axisLabel = svg.append("text").attr("x", X0).attr("y", AXIS_Y + 38).attr("class", "tl-axis-label");

    // ---------- legend (deep view) ----------
    const legend = svg.append("g").attr("transform", `translate(${X0},${H - 22})`);
    let lx = 0;
    for (const [k, label] of LEGEND) {
      legend.append("rect").attr("x", lx).attr("y", -9).attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", COLOR[k]);
      const t = legend.append("text").attr("x", lx + 16).attr("class", "tl-legend").text(label);
      lx += 16 + (t.node() as SVGTextElement).getComputedTextLength() + 22;
    }
    legend.append("text").attr("x", lx).attr("class", "tl-legend muted").text("dashed = debated");

    // ---------- deep-history events ----------
    const ev = plot.append("g").selectAll<SVGGElement, HistoryEvent>("g.ev").data(EVENTS, (d) => d.id).join("g")
      .attr("class", "ev").attr("opacity", 0);
    ev.each(function (d) {
      const g = d3.select(this);
      const c = COLOR[d.kind];
      g.append("line").attr("class", "stem").attr("stroke", c).attr("stroke-opacity", 0.45).attr("stroke-dasharray", d.debated ? "3 3" : null);
      if (Array.isArray(d.at)) {
        g.append("rect").attr("class", "band").attr("height", 12).attr("rx", 6).attr("fill", c).attr("fill-opacity", d.kind === "theory" ? 0.55 : 0.8);
      } else {
        g.append("circle").attr("r", 6).attr("fill", d.debated ? "#0d1110" : c).attr("stroke", c).attr("stroke-width", 2)
          .attr("stroke-dasharray", d.debated ? "2 2" : null);
      }
      g.append("text").attr("class", "tl-label lab").text(d.label);
      g.append("text").attr("class", "tl-sub sub").text(d.sub);
    });

    // ---------- modern view: milestones + dated breeds ----------
    const modern = plot.append("g").attr("class", "tl-modern");
    const ms = modern.append("g").selectAll("g.ms").data(MILESTONES).join("g").attr("class", "ms");
        // Along the bottom edge, below the breed rows; they step down because they're close in time.
    const msY = (i: number) => H - 52 + i * 17;
    ms.append("line").attr("y1", AXIS_Y).attr("y2", (_, i) => msY(i)).attr("stroke", "#e9e2d0").attr("stroke-opacity", 0.18).attr("stroke-dasharray", "2 4");
    ms.append("circle").attr("cy", (_, i) => msY(i)).attr("r", 2.5).attr("fill", "#e9e2d0");
    ms.append("text").attr("x", 6).attr("y", (_, i) => msY(i)).attr("dy", "0.35em").attr("class", "tl-ms").text((d) => `${d.label}, ${d.year}`);

    /**
     * Photo markers on stems. Stems (and their axis ticks) live in a layer *under* every
     * photo, so a line never crosses a dog. Markers are packed into rows using the labels'
     * real widths (one word per line), laid out for the zoom level they're shown at.
     */
    type Marker = { id: string; code: string; name: string; ago: number; title: string };
    function buildMarkers(parent: d3.Selection<SVGGElement, unknown, null, undefined>, items: Marker[], packSpan: number, order = [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
      const stems = parent.append("g").attr("class", "tl-stems");
      const marks = parent.append("g").attr("class", "tl-marks");
      const colorOf = (d: Marker) => cladeColor(data.breeds[d.code]?.clade ?? null, d.code);
      const sg = stems.selectAll<SVGGElement, Marker>("g").data(items, (d) => d.id).join("g");
      sg.append("line").attr("class", "stem").attr("y2", AXIS_Y).attr("stroke", colorOf).attr("stroke-opacity", 0.55);
      sg.append("circle").attr("class", "tick").attr("cy", AXIS_Y).attr("r", 2.5).attr("fill", colorOf);
      const mg = marks.selectAll<SVGGElement, Marker>("g.mb").data(items, (d) => d.id).join("g").attr("class", "mb");
      mg.each(function (d) {
        const g = d3.select(this);
        const color = colorOf(d);
        const clipId = `mb-clip-${d.id}`;
        defs.append("clipPath").attr("id", clipId).append("circle").attr("r", PHOTO_R);
        const ph = g.append("g").attr("class", "ph");
        const url = photoOf(d.code);
        ph.append("circle").attr("r", PHOTO_R + 1.5).attr("fill", "#1a211e").attr("stroke", color).attr("stroke-width", 2);
        if (url) {
          ph.append("image").attr("href", url).attr("x", -PHOTO_R).attr("y", -PHOTO_R).attr("width", PHOTO_R * 2).attr("height", PHOTO_R * 2)
            .attr("preserveAspectRatio", "xMidYMid slice").attr("clip-path", `url(#${clipId})`).attr("referrerpolicy", "no-referrer");
        } else {
          ph.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("class", "tl-mb-init")
            .text(d.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join(""));
        }
        // One word per line; the date lives on the axis and in the hover text.
        const label = g.append("text").attr("class", "tl-mb-name").attr("text-anchor", "middle");
        for (const w of d.name.split(/\s+/)) label.append("tspan").attr("x", 0).text(w);
        g.append("title").text(d.title);
      });

      /** Greedy rows (nearest row above, then below, where the widest word fits), stacked outward. */
      function pack() {
        const xm = d3.scaleLinear().domain([packSpan, 0]).range([X0, X1]);
        const lastX = new Map<number, number>();
        const nodes = mg.nodes();
        const items2 = nodes.map((n, i) => {
          const d = d3.select<SVGGElement, Marker>(n).datum();
          const words = [...n.querySelectorAll("text.tl-mb-name tspan")] as SVGTSpanElement[];
          const tw = Math.max(...words.map((t) => t.getComputedTextLength()));
          return { i, d, words, px: xm(d.ago), w: Math.max(2 * PHOTO_R + 4, tw + 6), lane: 0 };
        }).sort((p, q) => q.d.ago - p.d.ago);
        for (const it of items2) {
          const fits = order.find((l) => it.px - it.w / 2 > (lastX.get(l) ?? -Infinity) + 3);
          it.lane = fits ?? order.reduce((best, l) => ((lastX.get(l) ?? -Infinity) < (lastX.get(best) ?? -Infinity) ? l : best));
          lastX.set(it.lane, it.px + it.w / 2);
        }
        const labelH = new Map<number, number>();
        for (const it of items2) labelH.set(it.lane, Math.max(labelH.get(it.lane) ?? 0, it.words.length * LINE_H + 4));
        const centre = new Map<number, number>();
        for (const side of [1, -1]) {
          let edge = AXIS_Y - side * STEM;
          for (let k = 1; labelH.has(side * k); k++) {
            const lane = side * k;
            centre.set(lane, edge - side * PHOTO_R);
            edge = edge - side * (2 * PHOTO_R + labelH.get(lane)! + ROW_GAP);
          }
        }
        const stemNodes = sg.nodes();
        for (const it of items2) {
          const y = centre.get(it.lane)!;
          d3.select(stemNodes[it.i]).select("line.stem").attr("y1", y);
          d3.select(nodes[it.i]).select("g.ph").attr("transform", `translate(0,${y})`);
          const n = it.words.length;
          // Upper rows: last word just above the photo. Lower rows: first word just below.
          const first = it.lane > 0 ? y - PHOTO_R - 6 - (n - 1) * LINE_H : y + PHOTO_R + 13;
          it.words.forEach((t, k) => t.setAttribute("y", String(first + k * LINE_H)));
        }
      }
      pack();
      // Web fonts change label widths; pack again once they're ready.
      document.fonts?.ready.then(() => pack());
      return {
        place: (xs: d3.ScaleLinear<number, number>) => {
          sg.attr("transform", (d) => `translate(${xs(d.ago)},0)`);
          mg.attr("transform", (d) => `translate(${xs(d.ago)},0)`);
        },
      };
    }

    const modernMarkers = buildMarkers(
      modern,
      MODERN_BREEDS.map((d) => ({
        id: d.code, code: d.code, name: d.short ?? d.name, ago: NOW - d.year,
        title: `${d.name}, ${d.approx ? "around " : ""}${d.year}: ${d.note}`,
      })),
      MODERN_SPAN,
    );

    // ---------- "Dogs came first" view: ancient breeds with an approximate origin ----------
    const ancient = plot.append("g").attr("class", "tl-ancient").attr("opacity", 0);
    const ancientMarkers = buildMarkers(
      ancient,
      ANCIENT_BREEDS.filter((a) => a.ago).map((a) => ({
        id: `anc-${a.code}`, code: a.code, name: a.name, ago: a.ago!,
        title: `${a.name}: ${agoLabel(a)} (${a.dateNote}). ${a.note}`,
      })),
      FARMING_SPAN,
      // Above the axis only: the event labels sit below it in this view.
      [1, 2, 3],
    );
    // Breeds with no known origin date: a labelled strip below the axis.
    const unknown = ANCIENT_BREEDS.filter((a) => !a.ago);
    const uk = svg.append("g").attr("class", "tl-unknown").attr("opacity", 0)
      .attr("transform", `translate(${X0},${H - 150})`);
    uk.append("text").attr("class", "tl-unk-h").attr("y", -14).text("Origin date unknown");
    const UR = 18;
    uk.selectAll("g").data(unknown).join("g").attr("transform", (_, i) => `translate(${UR + 4 + i * 86},${UR + 4})`).each(function (a) {
      const g = d3.select(this);
      const clipId = `unk-clip-${a.code}`;
      defs.append("clipPath").attr("id", clipId).append("circle").attr("r", UR);
      g.append("circle").attr("r", UR + 1.5).attr("fill", "#1a211e").attr("stroke", "#7d847e").attr("stroke-width", 1.5).attr("stroke-dasharray", "3 2");
      const url = photoOf(a.code);
      if (url) {
        g.append("image").attr("href", url).attr("x", -UR).attr("y", -UR).attr("width", UR * 2).attr("height", UR * 2)
          .attr("preserveAspectRatio", "xMidYMid slice").attr("clip-path", `url(#${clipId})`).attr("referrerpolicy", "no-referrer");
      }
      const t = g.append("text").attr("class", "tl-mb-name").attr("text-anchor", "middle");
      a.name.split(/\s+/).forEach((w, k) => t.append("tspan").attr("x", 0).attr("y", UR + 14 + k * LINE_H).text(w));
      g.append("title").text(`${a.name}: origin unknown. ${a.note}`);
    });

    // ---------- layout for the current span ----------
    let show = new Set<string>();
    let iceOn = 0; // 0..1, faded in/out when entering or leaving the deep view
    let ancientOn = 0; // 0..1, the ancient breeds shown at the farming zoom level
    let focus = new Set<string>();

    function draw() {
      x.domain([span, 0]);
      const deepness = Math.max(0, Math.min(1, (span - 600) / 1400)); // 0 = modern, 1 = deep
      const modernness = Math.max(0, Math.min(1, (900 - span) / 500));

      // Ticks: calendar years when zoomed in, "years ago" when zoomed out.
      const calendar = span < 1500;
      const tv = calendar
        ? d3.ticks(NOW - span, NOW, 8).filter((t) => t <= NOW - span * 0.06).map((yr) => ({ at: NOW - yr, label: `${yr}` }))
        : x.ticks(8).map((t) => ({ at: t, label: t === 0 ? "today" : d3.format(",")(t) }));
      if (calendar) tv.push({ at: 0, label: "today" });
      const tk = ticks.selectAll<SVGGElement, { at: number; label: string }>("g").data(tv, (d) => d.label)
        .join((e) => {
          const g = e.append("g");
          g.append("line").attr("y1", -4).attr("y2", 4).attr("stroke", "#e9e2d0").attr("stroke-opacity", 0.5);
          g.append("text").attr("y", 20).attr("text-anchor", "middle").attr("class", "tl-tick");
          return g;
        })
        .attr("transform", (d) => `translate(${x(d.at)},0)`);
      tk.select("text").text((d) => d.label);
      axisLabel.text(calendar ? "year →" : "years ago →");

      // Ice band
      const iceL = Math.max(X0 - 14, x(TIME_MAX * 3));
      // The Ice Age band only appears in the full deep view, not when stopped at farming.
      const iceR = x(ICE_END);
      ice.attr("opacity", deepness * iceOn);
      iceWash.attr("x", iceL).attr("width", Math.max(0, iceR - iceL));
      iceBand.attr("d", `M${iceL + 8},${bandY}H${iceR}V${bandY + bandH}H${iceL + 8}L${iceL},${bandY + bandH * 0.75}L${iceL + 8},${bandY + bandH / 2}L${iceL},${bandY + bandH * 0.25}Z`);
      iceLgm.attr("x", x(LGM[0])).attr("width", Math.max(0, x(LGM[1]) - x(LGM[0])));
      iceEnd.attr("x1", iceR).attr("x2", iceR);
      iceL1.attr("x", iceL + 16);
      iceL2.attr("x", (x(LGM[0]) + x(LGM[1])) / 2);
      iceL3.attr("x", iceR + 5);
      legend.attr("opacity", deepness);

      // Deep events
      ev.each(function (d) {
        const g = d3.select(this);
        const y = laneY(d.lane);
        const isRange = Array.isArray(d.at);
        const from = isRange ? (d.at as [number, number])[0] : (d.at as number);
        const to = isRange ? (d.at as [number, number])[1] : (d.at as number);
        const xa = x(from), xb = x(to);
        // With the ancient breeds showing, "Farming begins" reads leftward, clear of their photos.
        const right = from < span * 0.14 || (d.id === "farming" && ancientOn > 0.5);
        g.select("line.stem").attr("x1", xa).attr("x2", xa).attr("y1", y).attr("y2", AXIS_Y);
        g.select("rect.band").attr("x", xa).attr("y", y - 6).attr("width", Math.max(5, xb - xa) * ((this as SVGGElement & { __grow?: number }).__grow ?? 1));
        g.select("circle").attr("cx", xa).attr("cy", y);
        const tx = right ? xa - 12 : isRange ? xa : xa + 12;
        const ty = isRange ? y - 29 : y - 5;
        g.select("text.lab").attr("x", tx).attr("y", ty).attr("text-anchor", right ? "end" : "start");
        g.select("text.sub").attr("x", tx).attr("y", ty + 16).attr("text-anchor", right ? "end" : "start");
      });

      // Modern markers ride the axis and fade as we zoom out.
      modern.attr("opacity", modernness).attr("pointer-events", modernness > 0.5 ? null : "none");
      ms.attr("transform", (d) => `translate(${x(NOW - d.year)},0)`);
      modernMarkers.place(x);
      ancientMarkers.place(x);
      ancient.attr("opacity", ancientOn).attr("pointer-events", ancientOn > 0.5 ? null : "none");
      uk.attr("opacity", ancientOn).attr("pointer-events", ancientOn > 0.5 ? null : "none");
    }

    function setVisibility(animate: boolean) {
      ev.transition().duration(animate ? DUR : 0)
        .attr("opacity", (d) => (!show.has(d.id) ? 0 : focus.size === 0 || focus.has(d.id) ? 1 : 0.22));
      // Ranges grow from their start the first time they appear.
      ev.filter(function (d) {
        return show.has(d.id) && Array.isArray(d.at) && (this as SVGGElement & { __grow?: number }).__grow === undefined;
      }).each(function () {
        const g = this as SVGGElement & { __grow?: number };
        g.__grow = 0;
        d3.select(g).transition("grow").duration(reduce ? 0 : 900).ease(d3.easeCubicOut).tween("grow", () => (t) => {
          g.__grow = t;
          draw();
        });
      });
    }

    function zoomTo(target: number) {
      if (target === span) return;
      const i = d3.interpolateNumber(Math.log(span), Math.log(target));
      d3.select(el).transition("zoom").duration(reduce ? 0 : 1800).ease(d3.easeCubicInOut)
        .tween("span", () => (t) => {
          span = Math.exp(i(t));
          draw();
        });
    }

    draw();
    // On narrow screens the timeline scrolls sideways; start at the recent end.
    if (el.scrollWidth > el.clientWidth) el.scrollLeft = el.scrollWidth;

    api.current = (v) => {
      show = new Set(v.show);
      focus = new Set(v.focus ?? []);
      setVisibility(true);
      const target = v.mode === "modern" ? MODERN_SPAN : v.mode === "farming" ? FARMING_SPAN : TIME_MAX;
      const iceTarget = v.mode === "modern" || v.mode === "farming" ? 0 : 1;
      if (iceTarget !== iceOn) {
        const from = iceOn;
        d3.select(ice.node()).transition("ice").duration(reduce ? 0 : 900).tween("ice", () => (t) => {
          iceOn = from + (iceTarget - from) * t;
          draw();
        });
      }
      const ancientTarget = v.mode === "farming" ? 1 : 0;
      if (ancientTarget !== ancientOn) {
        const from = ancientOn;
        d3.select(ancient.node()).transition("anc").duration(reduce ? 0 : 900).tween("anc", () => (t) => {
          ancientOn = from + (ancientTarget - from) * t;
          draw();
        });
      }
      zoomTo(target);
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
