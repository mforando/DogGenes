"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useMedia } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { FAMILIES } from "@/lib/purpose";
import { MIXED_FREQ, VARIANTS, familiesOf } from "@/lib/health";

const INK = "#e9e2d0";
const GOLD = "#e8b74a";
const famColor = (f: string) => (f === "_none" ? "#7d847e" : cladeColor(f));

/**
 * Variant × family matrix. Each row is a disease variant; each column a family group from
 * the family tree. A dot means breeds in that family are documented carriers (dot area =
 * number of breeds). Rows are sorted by how many families the variant spans.
 */
export function TraitMatrix({ selected, onSelect }: { selected: string; onSelect: (id: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((id: string) => void) | null>(null);
  const cbRef = useRef(onSelect);
  cbRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  // Narrow screens: drawn tall (families down the side, variants across the top) so it fits
  // a phone without scrolling sideways.
  const tall = useMedia("(max-width: 640px)");

  useEffect(() => {
    const el = host.current!;
    const vars = [...VARIANTS].sort((a, b) => familiesOf(b).length - familiesOf(a).length);
    const left = tall ? 152 : 210, top = tall ? 138 : 150, right = tall ? 56 : 100, cell = tall ? 40 : 30, rowH = tall ? 30 : 40;
    const W = left + (tall ? vars.length : FAMILIES.length) * cell + right;
    const H = top + (tall ? FAMILIES.length : vars.length) * rowH + 8;
    // Centre of the cell for variant i and family j, in either layout.
    const X = (i: number, j: number) => left + (tall ? i : j) * cell + cell / 2;
    const Y = (i: number, j: number) => top + (tall ? j : i) * rowH + rowH / 2;
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Matrix of inherited disease variants by family group; dot size shows how many breeds in each family carry the variant.");
    const tip = d3.select(el).append("div").attr("class", "tip").attr("role", "status");
    const famOf = (c: string) => data.breeds[c]?.clade ?? "_none";
    const r = d3.scaleSqrt().domain([1, 12]).range([5, 13]).clamp(true);

    const place = (ev: { clientX: number; clientY: number }) => {
      tip.classed("on", true);
      const box = el.getBoundingClientRect();
      const t = tip.node() as HTMLElement;
      tip.style("left", `${Math.max(0, Math.min(ev.clientX - box.left + 14, box.width - t.offsetWidth - 8))}px`)
        .style("top", `${Math.max(0, Math.min(ev.clientY - box.top + 14, box.height - t.offsetHeight - 8))}px`);
    };
    // A tap outside the dots puts the tooltip away (touch has no "pointer left").
    const hideOnOutsideTap = (ev: PointerEvent) => {
      if (ev.pointerType !== "mouse" && !(ev.target as Element).closest?.(".pm-dot")) tip.classed("on", false);
    };
    document.addEventListener("pointerdown", hideOnOutsideTap);

    // Family headers: angled above the columns, or names down the left side.
    FAMILIES.forEach((f, j) => {
      if (tall) {
        const y = Y(0, j);
        svg.append("line").attr("x1", left - 4).attr("x2", W - right).attr("y1", y).attr("y2", y).attr("stroke", "#171e1b");
        svg.append("rect").attr("x", left - 10).attr("y", y - 5).attr("width", 4).attr("height", 10).attr("rx", 1).attr("fill", famColor(f.id));
        svg.append("text").attr("x", left - 16).attr("y", y).attr("dy", "0.35em").attr("text-anchor", "end").attr("class", "pm-fam").text(f.name);
      } else {
        const x = X(0, j);
        svg.append("line").attr("x1", x).attr("x2", x).attr("y1", top - 6).attr("y2", H - 6).attr("stroke", "#1b2320");
        svg.append("rect").attr("x", x - 5).attr("y", top - 14).attr("width", 10).attr("height", 4).attr("rx", 1).attr("fill", famColor(f.id));
        svg.append("text").attr("transform", `translate(${x + 3},${top - 20}) rotate(-55)`).attr("class", "pm-col").text(f.name);
      }
    });

    const row = svg.selectAll<SVGGElement, (typeof vars)[number]>("g.pm-row").data(vars).join("g")
      .attr("class", "pm-row")
      .attr("tabindex", 0).attr("role", "button")
      .attr("aria-label", (v) => `${v.name}: carriers in ${familiesOf(v).length} family groups`)
      .on("click", (_, v) => cbRef.current(v.id))
      .on("keydown", (ev: KeyboardEvent, v) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          cbRef.current(v.id);
        }
      });
    if (tall) {
      row.append("rect").attr("class", "pm-band").attr("x", (_, i) => X(i, 0) - cell / 2 + 2).attr("y", top - 8).attr("width", cell - 4).attr("height", H - top + 2).attr("rx", 4);
      row.append("line").attr("x1", (_, i) => X(i, 0)).attr("x2", (_, i) => X(i, 0)).attr("y1", top - 6).attr("y2", H - 6).attr("stroke", "#1b2320");
      row.append("text").attr("transform", (_, i) => `translate(${X(i, 0) + 4},${top - 14}) rotate(-62)`).attr("class", "pm-name").text((v) => v.short);
    } else {
      row.append("rect").attr("class", "pm-band").attr("x", 0).attr("y", (_, i) => Y(i, 0) - rowH / 2 + 2).attr("width", W).attr("height", rowH - 4).attr("rx", 4);
      row.append("text").attr("x", left - 14).attr("y", (_, i) => Y(i, 0)).attr("dy", "0.35em").attr("text-anchor", "end").attr("class", "pm-name").text((v) => v.short);
      row.append("text").attr("x", W - right + 12).attr("y", (_, i) => Y(i, 0)).attr("dy", "0.35em").attr("class", "pm-count")
        .text((v) => {
          const n = familiesOf(v).length;
          return `${n} famil${n === 1 ? "y" : "ies"}`;
        });
    }
    row.each(function (v, i) {
      const g = d3.select(this);
      const by = d3.group(v.carriers, famOf);
      FAMILIES.forEach((f, j) => {
        const list = by.get(f.id);
        if (!list) return;
        const dot = g.append("g").attr("class", "pm-dot").attr("transform", `translate(${X(i, j)},${Y(i, j)})`);
        dot.append("circle").attr("r", r(list.length)).attr("fill", famColor(f.id)).attr("stroke", "#0d1110").attr("stroke-width", 1.5);
        if (list.length > 1) dot.append("text").attr("dy", "0.35em").attr("text-anchor", "middle").attr("class", "pm-n").text(list.length);
        const html = () => `<div class="tip-name">${f.name}</div><div class="tip-sub">${v.short} · ${list.length} carrier breed${list.length === 1 ? "" : "s"}</div><div class="tip-list">${list.map((c) => data.breeds[c].name).join("<br>")}</div>`;
        // Mouse: follows the pointer. Touch: a tap shows it until a tap elsewhere.
        dot.append("circle").attr("r", 15).attr("fill", "transparent")
          .on("pointermove", (ev: PointerEvent) => {
            if (ev.pointerType !== "mouse") return;
            tip.html(html());
            place(ev);
          })
          .on("pointerleave", (ev: PointerEvent) => {
            if (ev.pointerType === "mouse") tip.classed("on", false);
          })
          .on("click", (ev: MouseEvent) => {
            tip.html(html());
            place(ev);
          });
      });
    });

    api.current = (id) => {
      row.classed("is-selected", (v) => v.id === id);
      row.select("text.pm-name").attr("fill", (v) => (v.id === id ? GOLD : INK));
    };
    api.current(selectedRef.current);
    return () => {
      document.removeEventListener("pointerdown", hideOnOutsideTap);
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, [tall]);

  useEffect(() => api.current?.(selected), [selected]);
  return <div ref={host} className={`purpose-matrix${tall ? " tall" : ""}`} />;
}

/** Allele frequencies of the most common disease variants in mixed-breed dogs. */
export function FreqBars() {
  const host = useRef<HTMLDivElement>(null);
  // Narrow screens: each name sits above its bar, so the text stays readable.
  const narrow = useMedia("(max-width: 640px)");
  useEffect(() => {
    const el = host.current!;
    const left = narrow ? 2 : 250, right = narrow ? 52 : 70, rowH = narrow ? 44 : 34, top = narrow ? 8 : 30;
    const W = narrow ? 400 : 860, H = top + MIXED_FREQ.length * rowH + 28;
    const barY = narrow ? 22 : 8, barH = narrow ? 14 : rowH - 16;
    const x = d3.scaleLinear().domain([0, 8]).range([left, W - right]);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Bar chart of disease variant frequency in mixed-breed dogs");
    for (const t of x.ticks(4)) {
      svg.append("line").attr("x1", x(t)).attr("x2", x(t)).attr("y1", top - 8).attr("y2", H - 22).attr("stroke", "#1c2420");
      svg.append("text").attr("x", x(t)).attr("y", H - 6).attr("text-anchor", "middle").attr("class", "mb-tick").text(`${t}%`);
    }
    if (!narrow) svg.append("text").attr("x", left).attr("y", 14).attr("class", "mb-axis")
      .text("share of gene copies carrying the variant, in ~83,000 mixed-breed dogs");
    const row = svg.selectAll("g.mb-row").data(MIXED_FREQ).join("g").attr("transform", (_, i) => `translate(0,${top + i * rowH})`);
    row.append("text").attr("x", narrow ? left : left - 12).attr("y", narrow ? 12 : rowH / 2).attr("dy", "0.35em").attr("text-anchor", narrow ? "start" : "end").attr("class", "mb-name").attr("fill", INK).text((d) => d.name);
    row.append("rect").attr("x", left).attr("y", barY).attr("height", barH).attr("rx", 3).attr("fill", GOLD).attr("width", 0)
      .transition().duration(800).delay((_, i) => i * 50).attr("width", (d) => x(d.pct) - left);
    row.append("text").attr("class", "mb-val").attr("fill", INK).attr("y", barY + barH / 2).attr("dy", "0.35em").attr("x", (d) => x(d.pct) + 8).text((d) => `${d.pct.toFixed(1)}%`);
    return () => {
      d3.select(el).selectAll("*").remove();
    };
  }, [narrow]);
  return <div ref={host} className="mixing-bars" />;
}
