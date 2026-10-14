"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { geoArmadillo } from "d3-geo-projection";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land110 from "world-atlas/land-110m.json";
import { ORIGINS } from "@/lib/origins";
import { data } from "@/lib/tree";
import { photoOf } from "@/lib/photos";

const W = 480;
const H = 270;
const R = 4.2;

/**
 * A small Armadillo-projection world map of where one job's breeds come from. One dot per
 * breed, in its family colour, nudged apart where several share a region (a thin line joins
 * each moved dot to its true spot). Hovering a dot shows the breed's photo and origin and
 * reports the breed up, so the photo gallery can light it up; hovering a gallery photo
 * (`hovered`) lights the dot here.
 */
export default function JobMap({
  codes,
  colorOf,
  hovered,
  onHover,
}: {
  codes: string[];
  colorOf: (code: string) => string;
  hovered: string | null;
  /** Called with on=true when a dot is entered and on=false when it is left. */
  onHover: (code: string, on: boolean) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((c: string | null) => void) | null>(null);
  const onHoverRef = useRef(onHover);
  onHoverRef.current = onHover;

  // The land and frame never change; draw them once.
  const base = useRef<{
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
    dots: d3.Selection<SVGGElement, unknown, null, undefined>;
    tip: d3.Selection<HTMLDivElement, unknown, null, undefined>;
    proj: d3.GeoProjection;
  } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const proj = geoArmadillo().parallel(20).rotate([-10, 0]) as d3.GeoProjection;
    proj.fitExtent([[6, 6], [W - 6, H - 6]], { type: "Sphere" });
    const path = d3.geoPath(proj);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`)
      .attr("role", "img").attr("aria-label", "World map of where these breeds come from");
    const sphere = { type: "Sphere" } as d3.GeoPermissibleObjects;
    // Armadillo folds the far side of the globe out of sight but doesn't clip it, so clip
    // the land and graticule to the projection's outline.
    const clipId = `jm-clip-${Math.random().toString(36).slice(2, 8)}`;
    svg.append("clipPath").attr("id", clipId).append("path").datum(sphere).attr("d", path);
    svg.append("path").datum(sphere).attr("class", "jm-sphere").attr("d", path);
    const clipped = svg.append("g").attr("clip-path", `url(#${clipId})`);
    clipped.append("path").datum(d3.geoGraticule10()).attr("class", "jm-grat").attr("d", path);
    const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
    clipped.append("path").datum(feature(topo, topo.objects.land)).attr("class", "jm-land").attr("d", path);
    const dots = svg.append("g");
    const tip = d3.select(el).append("div").attr("class", "tip").attr("role", "status");
    base.current = { svg, dots, tip, proj };
    return () => {
      svg.remove();
      tip.remove();
      base.current = null;
    };
  }, []);

  useEffect(() => {
    const b = base.current;
    if (!b) return;
    const { dots, tip, proj } = b;
    const el = host.current!;
    type N = { code: string; x: number; y: number; ax: number; ay: number };
    const nodes: N[] = codes
      .filter((c) => ORIGINS[c])
      .map((c, i) => {
        const [x, y] = proj([ORIGINS[c].lon, ORIGINS[c].lat])!;
        // A tiny deterministic offset so stacked points separate the same way every time.
        return { code: c, x: x + Math.cos(i * 2.4) * 0.3, y: y + Math.sin(i * 2.4) * 0.3, ax: x, ay: y };
      });
    const sim = d3.forceSimulation(nodes)
      .force("x", d3.forceX<N>((d) => d.ax).strength(0.3))
      .force("y", d3.forceY<N>((d) => d.ay).strength(0.3))
      .force("collide", d3.forceCollide<N>(R + 0.9).iterations(3))
      .stop();
    for (let i = 0; i < 200; i++) sim.tick();

    dots.selectAll("*").remove();
    dots.selectAll("line").data(nodes.filter((n) => Math.hypot(n.x - n.ax, n.y - n.ay) > 2)).join("line")
      .attr("class", "jm-lead").attr("x1", (d) => d.ax).attr("y1", (d) => d.ay).attr("x2", (d) => d.x).attr("y2", (d) => d.y);

    const showTip = (n: N) => {
      const o = ORIGINS[n.code];
      const photo = photoOf(n.code);
      tip.html(
        `${photo ? `<img class="tip-photo" src="${photo}" alt="" referrerpolicy="no-referrer" />` : ""}
         <div class="tip-name">${data.breeds[n.code].name}</div>
         <div class="tip-sub">${o.place}${o.place === o.country ? "" : ` · ${o.country}`}</div>`,
      ).classed("on", true);
      // Centre it above the dot, kept within the map's width.
      const box = el.getBoundingClientRect();
      const s = box.width / W;
      const t = tip.node()!;
      const px = n.x * s, py = n.y * s;
      tip.style("left", `${Math.max(0, Math.min(px - t.offsetWidth / 2, box.width - t.offsetWidth))}px`)
        .style("top", `${py - t.offsetHeight - 12}px`);
    };

    const g = dots.selectAll<SVGGElement, N>("g.jm-dot").data(nodes, (d) => d.code).join("g")
      .attr("class", "jm-dot")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .on("pointerenter", (_, d) => onHoverRef.current(d.code, true))
      .on("pointerleave", (_, d) => onHoverRef.current(d.code, false));
    g.append("circle").attr("class", "jm-hit").attr("r", R + 4);
    g.append("circle").attr("class", "jm-pt").attr("r", R).attr("fill", (d) => colorOf(d.code));

    api.current = (c) => {
      g.classed("is-on", (d) => d.code === c).classed("is-dim", (d) => c !== null && d.code !== c);
      g.filter((d) => d.code === c).raise();
      const n = nodes.find((d) => d.code === c);
      if (n) showTip(n);
      else tip.classed("on", false);
    };
    api.current(null);
  }, [codes, colorOf]);

  useEffect(() => {
    api.current?.(hovered);
  }, [hovered, codes]);

  return <div ref={host} className="job-map" />;
}
