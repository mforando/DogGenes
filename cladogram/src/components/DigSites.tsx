"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { LIGHT, tone } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";

/**
 * Two of the oldest accepted dog finds, on a small draggable globe, with what was found.
 * Facts from Wikipedia: "Bonn–Oberkassel dog", "Paleolithic dog", "Domestication of the dog".
 */
type Site = {
  id: string;
  name: string;
  place: string;
  lat: number;
  lon: number;
  age: string;
  facts: string[];
};

const SITES: Site[] = [
  {
    id: "erralla",
    name: "Erralla cave",
    place: "Gipuzkoa, Basque Country, Spain",
    lat: 43.25,
    lon: -2.24,
    age: "~17,500 years ago",
    facts: [
      "Only a single bone survives: a humerus (upper front-leg bone).",
      "Its measurements match a domestic dog from Pont d’Ambon in France, which is why it counts as an undisputed dog rather than a wolf.",
      "The oldest widely accepted dog remains in southwestern Europe. (The Paleolithic dog article lists it at 14,500 years BP, likely in uncalibrated radiocarbon years.)",
    ],
  },
  {
    id: "bonn",
    name: "Bonn-Oberkassel",
    place: "Bonn, Germany",
    lat: 50.732,
    lon: 7.093,
    age: "~14,200 years ago",
    facts: [
      "Found in 1914 by workers in a basalt quarry: a dog buried with a man and a young woman, all sprinkled with red hematite powder.",
      "The puppy died at about 7½ months. It had survived canine distemper, which it could only have done with weeks of human care: cleaning, water, and food.",
      "Its DNA marks it as a direct ancestor of modern dogs. The bones are in the LVR-LandesMuseum Bonn.",
    ],
  },
];

const topo = world as unknown as Topology<{ countries: GeometryCollection }>;
const land = feature(topo, topo.objects.countries);
const borders = mesh(topo, topo.objects.countries, (a, b) => a !== b);
const graticule = d3.geoGraticule10();
const S = 260;

export default function DigSites() {
  const host = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string>("bonn");
  const api = useRef<((id: string) => void) | null>(null);

  const theme = useTheme(); // rebuild when the light/dark switch changes
  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Zoomed in on Europe (scale 1.7x the globe radius); a circular clip keeps the globe shape.
    const R = S / 2 - 4;
    const proj = d3.geoOrthographic().translate([S / 2, S / 2]).scale(R * 1.7).clipAngle(90).precision(0.3);
    const path = d3.geoPath(proj);
    // Start over western Europe, a little zoomed out so both sites and the Atlantic show.
    let rot: [number, number] = [-3, -38];

    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${S} ${S}`).attr("role", "img")
      .attr("aria-label", "Globe showing the Erralla cave in Spain and Bonn-Oberkassel in Germany. Drag to rotate.");
    const defs = svg.append("defs");
    const ocean = defs.append("radialGradient").attr("id", "dig-ocean").attr("cx", "40%").attr("cy", "35%");
    ocean.append("stop").attr("offset", "0%").attr("stop-color", tone("#1d2b2b", LIGHT.ocean0));
    ocean.append("stop").attr("offset", "100%").attr("stop-color", tone("#0b1312", LIGHT.ocean1));
    defs.append("clipPath").attr("id", "dig-clip").append("circle").attr("cx", S / 2).attr("cy", S / 2).attr("r", R);
    const globe = svg.append("g").attr("clip-path", "url(#dig-clip)");
    const sphere = globe.append("path").datum({ type: "Sphere" } as d3.GeoPermissibleObjects).attr("fill", "url(#dig-ocean)").attr("stroke", tone("#2c3a36", LIGHT.border));
    const grat = globe.append("path").datum(graticule).attr("fill", "none").attr("stroke", tone("#1d2a27", LIGHT.grat)).attr("stroke-width", 0.5);
    const landP = globe.append("path").datum(land).attr("fill", tone("#28322d", LIGHT.land));
    const bordP = globe.append("path").datum(borders).attr("fill", "none").attr("stroke", tone("#3d4a44", LIGHT.border)).attr("stroke-width", 0.4);
    const pins = globe.append("g");
    svg.append("circle").attr("cx", S / 2).attr("cy", S / 2).attr("r", R).attr("fill", "none").attr("stroke", tone("#3a4a44", LIGHT.border));
    let current = "bonn";

    function render() {
      proj.rotate([rot[0], rot[1], 0]);
      sphere.attr("d", path);
      grat.attr("d", path);
      landP.attr("d", path);
      bordP.attr("d", path);
      const center: [number, number] = [-rot[0], -rot[1]];
      const g = pins.selectAll<SVGGElement, Site>("g.pin").data(SITES, (d) => d.id).join((enter) => {
        const p = enter.append("g").attr("class", "pin").style("cursor", "pointer")
          .on("click", (_, d) => setActive(d.id));
        p.append("circle").attr("class", "dig-pulse").attr("r", 9);
        p.append("circle").attr("class", "dot").attr("r", 4.5).attr("stroke", tone("#0d1110", LIGHT.bg)).attr("stroke-width", 1.5);
        p.append("text").attr("class", "dig-label").attr("dy", "0.35em");
        return p;
      });
      g.each(function (d) {
        const [px, py] = proj([d.lon, d.lat]) ?? [-99, -99];
        const visible = d3.geoDistance([d.lon, d.lat], center) < Math.PI / 2 - 0.05 && Math.hypot(px - S / 2, py - S / 2) < R - 8;
        const [x, y] = proj([d.lon, d.lat]) ?? [0, 0];
        const on = d.id === current;
        const sel = d3.select(this).attr("display", visible ? null : "none").attr("transform", `translate(${x},${y})`);
        sel.select("circle.dot").attr("fill", on ? tone("#e8b74a", LIGHT.gold) : tone("#e9e2d0", LIGHT.ink));
        sel.select("circle.dig-pulse").attr("display", on ? null : "none");
        // Spain's label to the left, Germany's to the right, so they never collide.
        sel.select("text").attr("x", d.id === "erralla" ? -9 : 9).attr("text-anchor", d.id === "erralla" ? "end" : "start")
          .attr("fill", on ? tone("#e8b74a", LIGHT.gold) : tone("#e9e2d0", LIGHT.ink)).text(d.id === "erralla" ? "Erralla" : "Bonn");
      });
    }

    svg.call(
      d3.drag<SVGSVGElement, unknown>().on("drag", (ev) => {
        const k = 75 / (R * 1.7);
        rot = [rot[0] + ev.dx * k, Math.max(-85, Math.min(85, rot[1] - ev.dy * k))];
        render();
      }),
    );

    api.current = (id) => {
      current = id;
      const s = SITES.find((x) => x.id === id)!;
      // Turn gently toward the chosen site (but keep both in view).
      const target: [number, number] = [-(s.lon * 0.6 + 2.5 * 0.4), -(s.lat * 0.6 + 47 * 0.4)];
      const i = d3.interpolate(rot, target);
      d3.select(el).transition().duration(reduce ? 0 : 900).ease(d3.easeCubicInOut)
        .tween("rot", () => (t) => {
          rot = i(t) as [number, number];
          render();
        });
    };
    render();
    return () => {
      d3.select(el).selectAll("*").remove();
      api.current = null;
    };
  }, [theme]);

  useEffect(() => api.current?.(active), [active]);
  const site = SITES.find((s) => s.id === active)!;

  return (
    <div className="dig">
      <div className="dig-globe" ref={host} />
      <div className="dig-tabs" role="tablist" aria-label="Dig sites">
        {SITES.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={s.id === active} className={s.id === active ? "on" : ""} onClick={() => setActive(s.id)}>
            {s.name}
            <span>{s.age}</span>
          </button>
        ))}
      </div>
      <div className="dig-info" role="tabpanel" aria-live="polite">
        <p className="dig-place">{site.place}</p>
        <ul>
          {site.facts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <p className="dig-src">
        Sources: Wikipedia,{" "}
        <a href="https://en.wikipedia.org/wiki/Bonn%E2%80%93Oberkassel_dog">Bonn–Oberkassel dog</a> and{" "}
        <a href="https://en.wikipedia.org/wiki/Paleolithic_dog">Paleolithic dog</a> (CC BY-SA). Drag the globe to spin it.
      </p>
    </div>
  );
}
