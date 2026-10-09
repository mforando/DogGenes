"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { PINS, type Pin } from "@/lib/origins";
import { data } from "@/lib/tree";

export type FlyTarget = { lat: number; lon: number; k: number; id: number };

type Props = {
  colorOf: (code: string) => string;
  /** breeds to emphasise (others dim); empty = all */
  highlight: string[];
  selected: string | null;
  onSelect: (code: string | null) => void;
  fly: FlyTarget | null;
};

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const land = feature(topo, topo.objects.countries);
const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b);
const graticule = d3.geoGraticule10();

/** A draggable, zoomable 3D globe (orthographic projection) with one dot per breed. */
export default function Globe({ colorOf, highlight, selected, onSelect, fly }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    style: (p: Pick<Props, "colorOf" | "highlight" | "selected">) => void;
    fly: (t: FlyTarget) => void;
    zoomBy: (f: number) => void;
  } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const size = () => Math.max(300, Math.min(el.clientWidth, 760));
    let S = size();
    const proj = d3.geoOrthographic().precision(0.3).clipAngle(90);
    const path = d3.geoPath(proj);
    let rot: [number, number] = [-10, -35]; // start over Europe, where most breeds come from
    let k = 1;
    const base = () => S / 2 - 14;
    const apply = () => proj.translate([S / 2, S / 2]).scale(base() * k).rotate([rot[0], rot[1], 0]);

    const svg = d3.select(el).append("svg").attr("role", "img")
      .attr("aria-label", "Interactive globe showing where each dog breed originated. Drag to rotate.");
    const defs = svg.append("defs");
    const ocean = defs.append("radialGradient").attr("id", "ocean").attr("cx", "40%").attr("cy", "35%");
    ocean.append("stop").attr("offset", "0%").attr("stop-color", "#1c2a2a");
    ocean.append("stop").attr("offset", "100%").attr("stop-color", "#0b1312");
    const glow = defs.append("radialGradient").attr("id", "atmo");
    glow.append("stop").attr("offset", "86%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.0);
    glow.append("stop").attr("offset", "93%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0.16);
    glow.append("stop").attr("offset", "100%").attr("stop-color", "#8fb3c9").attr("stop-opacity", 0);

    const gAtmo = svg.append("circle").attr("fill", "url(#atmo)");
    const sphere = svg.append("path").datum({ type: "Sphere" } as d3.GeoPermissibleObjects)
      .attr("fill", "url(#ocean)").attr("stroke", "#2c3a36");
    const grat = svg.append("path").datum(graticule).attr("fill", "none").attr("stroke", "#1d2a27").attr("stroke-width", 0.6);
    const landPath = svg.append("path").datum(land).attr("fill", "#26302b").attr("stroke", "none");
    const borderPath = svg.append("path").datum(borders).attr("fill", "none").attr("stroke", "#3a4741").attr("stroke-width", 0.5);
    const gLeaders = svg.append("g").attr("stroke", "#e9e2d0").attr("stroke-opacity", 0.35).attr("stroke-width", 0.6);
    const gPins = svg.append("g");
    const label = svg.append("g").attr("class", "globe-label").attr("pointer-events", "none");
    const tip = d3.select(el).append("div").attr("class", "tip").attr("role", "status");

    const leaders = gLeaders.selectAll<SVGLineElement, Pin>("line").data(PINS).join("line");
    const pins = gPins.selectAll<SVGCircleElement, Pin>("circle")
      .data(PINS, (d) => d.code)
      .join("circle")
      .attr("class", "pin")
      .attr("stroke", "#0d1110")
      .attr("stroke-width", 1)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${data.breeds[d.code].name}, from ${d.place}, ${d.country}`)
      .on("pointerenter pointermove", (ev: PointerEvent, d) => {
        tip.html(
          `<div class="tip-name">${data.breeds[d.code].name}</div>
           <div class="tip-sub">${d.place}${d.place === d.country ? "" : ` · ${d.country}`}</div>`,
        ).classed("on", true);
        const box = el.getBoundingClientRect();
        const t = tip.node() as HTMLElement;
        tip.style("left", `${Math.min(ev.clientX - box.left + 14, box.width - t.offsetWidth - 6)}px`)
          .style("top", `${Math.min(ev.clientY - box.top + 14, box.height - t.offsetHeight - 6)}px`);
      })
      .on("pointerleave blur", () => tip.classed("on", false))
      .on("click", (ev: MouseEvent, d) => {
        ev.stopPropagation();
        onSelectRef.current(d.code);
      })
      .on("keydown", (ev: KeyboardEvent, d) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          onSelectRef.current(d.code);
        }
      });

    let current: Pick<Props, "colorOf" | "highlight" | "selected"> = { colorOf: () => "#e9e2d0", highlight: [], selected: null };

    function render() {
      apply();
      svg.attr("viewBox", `0 0 ${S} ${S}`).attr("width", S).attr("height", S);
      gAtmo.attr("cx", S / 2).attr("cy", S / 2).attr("r", base() * k * 1.12);
      sphere.attr("d", path);
      grat.attr("d", path);
      landPath.attr("d", path);
      borderPath.attr("d", path);
      const center: [number, number] = [-rot[0], -rot[1]];
      const r = Math.min(8, 3.4 + k * 0.7);
      const hl = new Set(current.highlight);
      pins.each(function (d) {
        const visible = d3.geoDistance([d.plon, d.plat], center) < Math.PI / 2 - 0.02;
        const [x, y] = proj([d.plon, d.plat]) ?? [0, 0];
        const sel = d.code === current.selected;
        const on = hl.size === 0 || hl.has(d.code) || sel;
        d3.select(this)
          .attr("display", visible ? null : "none")
          .attr("cx", x).attr("cy", y)
          .attr("r", sel ? r + 3 : r)
          .attr("fill", current.colorOf(d.code))
          .attr("fill-opacity", on ? 1 : 0.18)
          .attr("stroke", sel ? "#e8b74a" : "#0d1110")
          .attr("stroke-width", sel ? 2.5 : 1);
      });
      leaders.each(function (d) {
        const moved = Math.hypot(d.plat - d.lat, d.plon - d.lon) > 0.35;
        const visible = moved && k > 1.6 && d3.geoDistance([d.lon, d.lat], center) < Math.PI / 2 - 0.02;
        const a = proj([d.lon, d.lat]) ?? [0, 0];
        const b = proj([d.plon, d.plat]) ?? [0, 0];
        d3.select(this).attr("display", visible ? null : "none")
          .attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]);
      });
      // Name tag for the selected breed.
      label.selectAll("*").remove();
      const s = PINS.find((p) => p.code === current.selected);
      if (s && d3.geoDistance([s.plon, s.plat], center) < Math.PI / 2 - 0.02) {
        const [x, y] = proj([s.plon, s.plat])!;
        const t = label.append("text").attr("x", x).attr("y", y - r - 10).attr("text-anchor", "middle")
          .attr("class", "globe-tag").text(data.breeds[s.code].name);
        const bb = (t.node() as SVGTextElement).getBBox();
        label.insert("rect", "text").attr("x", bb.x - 6).attr("y", bb.y - 3).attr("width", bb.width + 12)
          .attr("height", bb.height + 6).attr("rx", 3).attr("fill", "rgba(10,13,12,0.88)").attr("stroke", "#a8842f");
      }
    }

    // ---------- interaction: drag to rotate ----------
    let spinning = !reduce;
    const stopSpin = () => (spinning = false);
    svg.call(
      d3.drag<SVGSVGElement, unknown>()
        .on("start", () => {
          stopSpin();
          svg.classed("dragging", true);
        })
        .on("drag", (ev) => {
          const sens = 75 / (base() * k);
          rot = [rot[0] + ev.dx * sens, Math.max(-85, Math.min(85, rot[1] - ev.dy * sens))];
          render();
        })
        .on("end", () => svg.classed("dragging", false)),
    );
    svg.on("click", () => onSelectRef.current(null));
    // Pinch or ctrl+wheel zooms; plain wheel keeps scrolling the page.
    svg.on("wheel", (ev: WheelEvent) => {
      if (!ev.ctrlKey) return;
      ev.preventDefault();
      stopSpin();
      k = Math.max(1, Math.min(10, k * Math.exp(-ev.deltaY * 0.01)));
      render();
    }, { passive: false } as unknown as boolean);

    const timer = d3.timer(() => {
      if (!spinning) return;
      rot = [rot[0] + 0.08, rot[1]];
      render();
    });

    function flyTo(t: FlyTarget) {
      stopSpin();
      const from = { r0: rot[0], r1: rot[1], k };
      // Take the short way round.
      let target0 = -t.lon;
      while (target0 - from.r0 > 180) target0 -= 360;
      while (target0 - from.r0 < -180) target0 += 360;
      const to = { r0: target0, r1: -t.lat, k: t.k };
      const i = d3.interpolate(from, to);
      d3.select(el).transition("fly").duration(reduce ? 0 : 1300).ease(d3.easeCubicInOut)
        .tween("fly", () => (u: number) => {
          const v = i(u);
          rot = [v.r0, v.r1];
          k = v.k;
          render();
        });
    }

    const ro = new ResizeObserver(() => {
      const n = size();
      if (n !== S) {
        S = n;
        render();
      }
    });
    ro.observe(el);

    api.current = {
      style: (p) => {
        current = p;
        render();
      },
      fly: flyTo,
      zoomBy: (f) => {
        stopSpin();
        flyTo({ lat: -rot[1], lon: -rot[0], k: Math.max(1, Math.min(10, k * f)), id: Date.now() });
      },
    };
    render();
    return () => {
      timer.stop();
      ro.disconnect();
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, []);

  useEffect(() => {
    api.current?.style({ colorOf, highlight, selected });
  }, [colorOf, highlight, selected]);

  useEffect(() => {
    if (fly) api.current?.fly(fly);
  }, [fly]);

  return (
    <div className="globe-wrap">
      <div ref={host} className="globe" />
      <div className="lt-zoom globe-zoom" role="group" aria-label="Zoom">
        <button type="button" onClick={() => api.current?.zoomBy(1.6)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => api.current?.zoomBy(1 / 1.6)} aria-label="Zoom out">−</button>
      </div>
    </div>
  );
}
