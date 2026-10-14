"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
import { FAMILIES, PURPOSES, SUMMARIES, type PurposeId } from "@/lib/purpose";

/** Most breed photos a matrix tooltip shows; any more are listed by name. */
const PHOTO_MAX = 9;

const INK = "#e9e2d0";
const MUTED = "#8a8a7f";
const GOLD = "#e8b74a";
const famColor = (f: string) => (f === "_none" ? "#7d847e" : cladeColor(f));
const famName = (f: string) => FAMILIES.find((x) => x.id === f)!.name;

/**
 * Job × family matrix: one row per job, one column per family (in family-tree order).
 * Dot area = number of breeds. Reading across a row shows how many separate families
 * a job turns up in.
 */
export function PurposeMatrix({ selected, onSelect }: { selected: PurposeId; onSelect: (p: PurposeId) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((p: PurposeId) => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = host.current!;
    const left = 190, top = 150, right = 96, cell = 30, rowH = 40;
    const W = left + FAMILIES.length * cell + right;
    const H = top + PURPOSES.length * rowH + 10;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img")
      .attr("aria-label", "Matrix of dog jobs by family group; dot size shows how many breeds of each job are in each family.");
    const tip = d3.select(el).append("div").attr("class", "tip").attr("role", "status");
    const jobName = (id: PurposeId) => PURPOSES.find((p) => p.id === id)!.name;
    const breeds = (n: number) => `${n} breed${n === 1 ? "" : "s"}`;
    /** Show the tooltip with this content; it follows the pointer until the pointer leaves. */
    const hoverTip = (sel: d3.Selection<any, any, any, any>, html: () => string, wide: string) =>
      sel
        .on("pointerenter.tip", () => {
          tip.attr("class", `tip ${wide}`).html(html());
        })
        .on("pointermove.tip", (ev: PointerEvent) => {
          tip.classed("on", true);
          const box = el.getBoundingClientRect();
          const t = tip.node() as HTMLElement;
          // Keep it inside both the chart and the screen (the chart scrolls sideways on phones).
          const maxX = Math.min(box.width, window.innerWidth - box.left) - t.offsetWidth - 8;
          tip.style("left", `${Math.max(-box.left + 8, Math.min(ev.clientX - box.left + 14, maxX))}px`)
            .style("top", `${Math.max(0, Math.min(ev.clientY - box.top + 14, box.height - t.offsetHeight - 8))}px`);
        })
        .on("pointerleave.tip", () => tip.classed("on", false));
    /** A whole row or column: its breeds as small photos, grouped by family (for a job) or by job (for a family). */
    const groupedHtml = (title: string, sub: string, groups: { name: string; color: string; codes: string[] }[]) =>
      `<div class="tip-name">${title}</div>
       <div class="tip-sub">${sub}</div>
       <div class="tip-groups${groups.length > 3 ? " two" : ""}">${groups
         .map(
           (g) => `<section>
             <h4><i style="background:${g.color}"></i>${g.name}<b>${g.codes.length}</b></h4>
             <div class="tip-thumbs">${g.codes
               .map((c) => {
                 const src = photoOf(c);
                 return src ? `<img src="${src}" alt="${data.breeds[c].name}" title="${data.breeds[c].name}">` : "";
               })
               .join("")}</div>
             <p>${g.codes.map((c) => data.breeds[c].name).join(", ")}</p>
           </section>`,
         )
         .join("")}</div>`;
    // Area grows with breed count; even a single breed gets a dot big enough to hover.
    const r = d3.scaleSqrt().domain([1, d3.max(SUMMARIES, (s) => d3.max(Object.values(s.byFamily), (v) => v.length))!]).range([6, 14]);

    // Column headers: family names, angled.
    const cols = svg.append("g");
    FAMILIES.forEach((f, j) => {
      const x = left + j * cell + cell / 2;
      cols.append("line").attr("x1", x).attr("x2", x).attr("y1", top - 6).attr("y2", H - 6)
        .attr("stroke", "#1b2320");
      cols.append("rect").attr("x", x - 5).attr("y", top - 14).attr("width", 10).attr("height", 4).attr("rx", 1)
        .attr("fill", famColor(f.id));
      cols.append("text").attr("transform", `translate(${x + 3},${top - 20}) rotate(-55)`)
        .attr("class", "pm-col").text(f.name);
      // Hover a family's label to see its breeds, grouped by job.
      const hit = cols.append("g").attr("class", "pm-col-hit");
      hit.append("rect").attr("transform", `translate(${x + 3},${top - 20}) rotate(-55)`)
        .attr("x", -6).attr("y", -13).attr("width", 128).attr("height", 18).attr("fill", "transparent");
      hit.append("rect").attr("x", x - 9).attr("y", top - 20).attr("width", 18).attr("height", 14).attr("fill", "transparent");
      hoverTip(hit, () => {
        const groups = SUMMARIES.filter((s) => s.byFamily[f.id])
          .map((s) => ({ name: jobName(s.id), color: famColor(f.id), codes: s.byFamily[f.id] }));
        const n = d3.sum(groups, (g) => g.codes.length);
        return groupedHtml(f.name, `${breeds(n)} · ${groups.length} job${groups.length === 1 ? "" : "s"}`, groups);
      }, "tip-group");
    });

    const rows = svg.selectAll<SVGGElement, (typeof SUMMARIES)[number]>("g.pm-row")
      .data(SUMMARIES)
      .join("g")
      .attr("class", "pm-row")
      .attr("transform", (_, i) => `translate(0,${top + i * rowH + rowH / 2})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (s) => `${PURPOSES.find((p) => p.id === s.id)!.name}: in ${s.families.length} families. Select to explore.`)
      .on("click", (_, s) => onSelectRef.current(s.id))
      .on("keydown", (ev: KeyboardEvent, s) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onSelectRef.current(s.id);
        }
      });
    rows.append("rect").attr("class", "pm-band").attr("x", 0).attr("y", -rowH / 2 + 2).attr("width", W).attr("height", rowH - 4).attr("rx", 4);
    rows.append("text").attr("x", left - 14).attr("dy", "0.35em").attr("text-anchor", "end").attr("class", "pm-name")
      .text((s) => PURPOSES.find((p) => p.id === s.id)!.name);
    // Hover a job's label to see its breeds, grouped by family.
    rows.each(function (s) {
      const hit = d3.select(this).append("rect").attr("class", "pm-name-hit")
        .attr("x", 0).attr("y", -rowH / 2 + 2).attr("width", left - 4).attr("height", rowH - 4).attr("fill", "transparent");
      hoverTip(hit, () => {
        const groups = s.families.map((f) => ({ name: famName(f), color: famColor(f), codes: s.byFamily[f] }));
        return groupedHtml(jobName(s.id), `${breeds(s.codes.length)} · ${groups.length} famil${groups.length === 1 ? "y" : "ies"}`, groups);
      }, "tip-group");
    });
    rows.append("text").attr("x", W - right + 12).attr("dy", "0.35em").attr("class", "pm-count")
      .text((s) => `${s.families.length} famil${s.families.length === 1 ? "y" : "ies"}`);

    rows.each(function (s) {
      const g = d3.select(this);
      FAMILIES.forEach((f, j) => {
        const list = s.byFamily[f.id];
        if (!list) return;
        const x = left + j * cell + cell / 2;
        const dot = g.append("g").attr("transform", `translate(${x},0)`);
        dot.append("circle").attr("r", r(list.length)).attr("fill", famColor(f.id)).attr("stroke", "#0d1110").attr("stroke-width", 1.5);
        if (list.length > 1) dot.append("text").attr("dy", "0.35em").attr("text-anchor", "middle").attr("class", "pm-n").text(list.length);
        // Generous hit area for the tooltip.
        // Generous hit area for the tooltip.
        hoverTip(dot.append("circle").attr("r", 14).attr("fill", "transparent"), () => {
          // A photo for each breed (up to nine), with any others listed by name below.
          const shown = list.slice(0, PHOTO_MAX), rest = list.slice(PHOTO_MAX);
          const card = (c: string) => {
            const src = photoOf(c);
            return `<figure>${src ? `<img src="${src}" alt="">` : "<span></span>"}<figcaption>${data.breeds[c].name}</figcaption></figure>`;
          };
          return `<div class="tip-name">${famName(f.id)}</div>
             <div class="tip-sub">${jobName(s.id)} · ${breeds(list.length)}</div>
             <div class="tip-photos n${Math.min(shown.length, 3)}">${shown.map(card).join("")}</div>
             ${rest.length ? `<div class="tip-list">Also: ${rest.map((c) => data.breeds[c].name).join(", ")}</div>` : ""}`;
        }, list.length > 1 ? "tip-wide" : "");
      });
    });

    api.current = (p) => {
      rows.classed("is-selected", (s) => s.id === p);
      rows.select("text.pm-name").attr("fill", (s) => (s.id === p ? GOLD : INK));
    };
    return () => {
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, []);

  useEffect(() => api.current?.(selected), [selected]);
  return <div ref={host} className="purpose-matrix" />;
}

/** Ranked bars: on average, how many breeds from OTHER families each breed in a job shares big DNA chunks with. */
export function MixingBars({ selected, onSelect }: { selected: PurposeId; onSelect: (p: PurposeId) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((p: PurposeId) => void) | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = host.current!;
    const sorted = [...SUMMARIES].sort((a, b) => b.crossPerBreed - a.crossPerBreed);
    const left = 220, right = 60, rowH = 34, top = 30;
    const W = 860, H = top + sorted.length * rowH + 30;
    const x = d3.scaleLinear().domain([0, Math.ceil(d3.max(sorted, (s) => s.crossPerBreed)!)]).range([left, W - right]);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Bar chart: average number of breeds from other families each breed shares big DNA chunks with, by job.");

    // Recessive grid.
    for (const t of x.ticks(4)) {
      svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", top - 8).attr("y2", H - 22).attr("stroke", "#1c2420");
      svg.append("text").attr("x", x(t)).attr("y", H - 6).attr("text-anchor", "middle").attr("class", "mb-tick").text(t);
    }
    svg.append("text").attr("x", left).attr("y", 14).attr("class", "mb-axis")
      .text("breeds from other families each breed shares big DNA chunks with (average)");

    const row = svg.selectAll<SVGGElement, (typeof sorted)[number]>("g.mb-row").data(sorted).join("g")
      .attr("class", "mb-row")
      .attr("transform", (_, i) => `translate(0,${top + i * rowH})`)
      .style("cursor", "pointer")
      .on("click", (_, s) => onSelectRef.current(s.id));
    row.append("text").attr("x", left - 12).attr("y", rowH / 2).attr("dy", "0.35em").attr("text-anchor", "end")
      .attr("class", "mb-name").text((s) => PURPOSES.find((p) => p.id === s.id)!.name);
    row.append("rect").attr("class", "mb-bar").attr("x", left).attr("y", 8).attr("height", rowH - 16).attr("rx", 3)
      .attr("width", 0)
      .transition().duration(800).delay((_, i) => i * 40)
      .attr("width", (s) => Math.max(2, x(s.crossPerBreed) - left));
    row.append("text").attr("class", "mb-val").attr("y", rowH / 2).attr("dy", "0.35em")
      .attr("x", (s) => x(s.crossPerBreed) + 8).text((s) => s.crossPerBreed.toFixed(1));

    api.current = (p) => {
      row.select("rect.mb-bar").attr("fill", (s) => (s.id === p ? GOLD : "#4b5651"));
      row.select("text.mb-name").attr("fill", (s) => (s.id === p ? GOLD : INK));
      row.select("text.mb-val").attr("fill", (s) => (s.id === p ? INK : MUTED));
    };
    return () => {
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, []);

  useEffect(() => api.current?.(selected), [selected]);
  return <div ref={host} className="mixing-bars" />;
}
