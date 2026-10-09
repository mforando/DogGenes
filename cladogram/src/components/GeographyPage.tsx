"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import Globe, { type FlyTarget } from "./Globe";
import { SiteNav } from "./shared";
import { data } from "@/lib/tree";
import { cladeColor, CLADE_COLOR } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import { ORIGINS, PINS } from "@/lib/origins";
import { PURPOSES, purposeOf, type PurposeId } from "@/lib/purpose";

// Job colours borrowed from the validated categorical palette.
const JOB_COLOR: Record<PurposeId, string> = {
  sight: "#d4556c", scent: "#7976e3", gun: "#309f47", vermin: "#c76a00", herd: "#19ad94",
  flock: "#b88f1b", guard: "#1ca8b7", work: "#698ff7", spitz: "#e7685d", companion: "#df6597",
};

const REGIONS: { name: string; lat: number; lon: number; k: number }[] = [
  { name: "Whole world", lat: 25, lon: 10, k: 1 },
  { name: "British Isles", lat: 54.5, lon: -4, k: 6 },
  { name: "Western Europe", lat: 49, lon: 6, k: 4 },
  { name: "Mediterranean", lat: 38, lon: 15, k: 3 },
  { name: "Asia", lat: 33, lon: 105, k: 2 },
  { name: "The Arctic", lat: 72, lon: -20, k: 1.5 },
  { name: "The Americas", lat: 20, lon: -85, k: 1.4 },
  { name: "Africa & Australia", lat: -12, lon: 75, k: 1 },
];

const nameOf = (c: string) => data.breeds[c]?.name ?? c;
const familyName = (c: string) => {
  const cl = data.breeds[c]?.clade;
  return cl ? data.clades[cl] : "Loner (no clear family)";
};

const byCountry = d3.rollups(PINS, (v) => v.map((p) => p.code), (p) => p.country)
  .sort((a, b) => b[1].length - a[1].length);

/** Ranked bars of the countries/regions with the most breeds. */
function CountryBars({ active, onPick }: { active: string | null; onPick: (country: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<((a: string | null) => void) | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  useEffect(() => {
    const el = host.current!;
    const rows = byCountry.slice(0, 10);
    const W = 360, left = 118, rowH = 24, H = rows.length * rowH + 6;
    const x = d3.scaleLinear().domain([0, rows[0][1].length]).range([0, W - left - 30]);
    const svg = d3.select(el).append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img")
      .attr("aria-label", "Countries with the most breeds in the study");
    const g = svg.selectAll("g").data(rows).join("g").attr("transform", (_, i) => `translate(0,${i * rowH})`)
      .attr("class", "cb-row").style("cursor", "pointer").on("click", (_, d) => onPickRef.current(d[0]));
    g.append("text").attr("x", left - 8).attr("y", rowH / 2).attr("dy", "0.35em").attr("text-anchor", "end")
      .attr("class", "cb-name").text((d) => d[0]);
    g.append("rect").attr("x", left).attr("y", 5).attr("height", rowH - 10).attr("rx", 2)
      .attr("width", (d) => x(d[1].length));
    g.append("text").attr("x", (d) => left + x(d[1].length) + 6).attr("y", rowH / 2).attr("dy", "0.35em")
      .attr("class", "cb-val").text((d) => d[1].length);
    api.current = (a) => {
      g.select("rect").attr("fill", (d) => (d[0] === a ? "#e8b74a" : "#4b5651"));
      g.select("text.cb-name").attr("fill", (d) => (d[0] === a ? "#e8b74a" : "#e9e2d0"));
    };
    return () => {
      d3.select(el).selectAll("*").remove();
    };
  }, []);
  useEffect(() => api.current?.(active), [active]);
  return <div ref={host} className="country-bars" />;
}

export default function GeographyPage() {
  const [mode, setMode] = useState<"family" | "job">("family");
  const [selected, setSelected] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [fly, setFly] = useState<FlyTarget | null>(null);

  const colorOf = useCallback(
    (c: string) => (mode === "family" ? cladeColor(data.breeds[c]?.clade ?? null, c) : JOB_COLOR[purposeOf[c]]),
    [mode],
  );
  const highlight = useMemo(
    () => (country ? byCountry.find(([n]) => n === country)?.[1] ?? [] : []),
    [country],
  );

  const select = (c: string | null) => {
    setSelected(c);
    if (c) {
      const o = ORIGINS[c];
      setFly({ lat: o.lat, lon: o.lon, k: 4, id: Date.now() });
    }
  };
  const pickCountry = (name: string) => {
    const codes = byCountry.find(([n]) => n === name)![1];
    const pts = codes.map((c) => ORIGINS[c]);
    const spread = d3.max(pts, (p) => Math.abs(p.lat - d3.median(pts, (q) => q.lat)!)) ?? 0;
    setCountry(name);
    setSelected(null);
    setFly({ lat: d3.median(pts, (p) => p.lat)!, lon: d3.median(pts, (p) => p.lon)!, k: spread > 15 ? 2 : 5, id: Date.now() });
  };

  // Families and the places their breeds come from.
  const homelands = useMemo(() => {
    const rows = Object.keys(CLADE_COLOR).map((cl) => {
      const codes = PINS.filter((p) => data.breeds[p.code]?.clade === cl);
      const places = d3.rollups(codes, (v) => v.length, (p) => p.country).sort((a, b) => b[1] - a[1]);
      return { cl, n: codes.length, places };
    });
    return rows.filter((r) => r.n).sort((a, b) => a.places.length - b.places.length || b.n - a.n);
  }, []);

  const sel = selected ? ORIGINS[selected] : null;
  const legend =
    mode === "family"
      ? [...Object.keys(CLADE_COLOR).map((cl) => ({ key: cl, label: data.clades[cl], color: cladeColor(cl) })), { key: "none", label: "Loners", color: cladeColor(null, "") }]
      : PURPOSES.map((p) => ({ key: p.id, label: p.name, color: JOB_COLOR[p.id] }));

  return (
    <>
      <SiteNav />
      <main className="geo">
        <header className="pairs-head">
          <p className="eyebrow">Where they came from</p>
          <h1>A world of dogs</h1>
          <p className="pairs-lede">
            Every dot is a breed, placed where it was first developed. Drag the globe to spin
            it, pinch (or Ctrl + scroll) or use the buttons to zoom, and click a dot to meet the
            breed. Notice how the family groups from the family tree tend to cluster in one
            part of the world: geography shaped dog DNA.
          </p>
        </header>

        <div className="geo-grid">
          <div className="geo-globe">
            <Globe colorOf={colorOf} highlight={highlight} selected={selected} onSelect={select} fly={fly} />
          </div>

          <aside className="geo-side" aria-label="Globe controls and details">
            <div className="seg" role="group" aria-label="Color dots by">
              <span>Color by</span>
              <button type="button" aria-pressed={mode === "family"} onClick={() => setMode("family")}>Family</button>
              <button type="button" aria-pressed={mode === "job"} onClick={() => setMode("job")}>Job</button>
            </div>

            <div className="geo-fly">
              <span className="side-h">Fly to</span>
              <div className="job-chips">
                {REGIONS.map((r) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => {
                      setCountry(null);
                      setFly({ lat: r.lat, lon: r.lon, k: r.k, id: Date.now() });
                    }}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {sel && selected ? (
              <div className="geo-card">
                {PHOTOS[selected] && (
                  <img src={PHOTOS[selected].urls[0]} alt={nameOf(selected)} referrerPolicy="no-referrer" />
                )}
                <div>
                  <h2>{nameOf(selected)}</h2>
                  <p className="geo-place">
                    {sel.place}
                    {sel.place !== sel.country && `, ${sel.country}`}
                  </p>
                  {sel.note && <p className="geo-note">{sel.note}</p>}
                  <dl>
                    <dt>Family</dt>
                    <dd>
                      <i style={{ background: cladeColor(data.breeds[selected].clade, selected) }} />
                      {familyName(selected)}
                    </dd>
                    <dt>Original job</dt>
                    <dd>
                      <i style={{ background: JOB_COLOR[purposeOf[selected]] }} />
                      {PURPOSES.find((p) => p.id === purposeOf[selected])!.name}
                    </dd>
                  </dl>
                  <button type="button" className="geo-close" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="geo-countries">
                <span className="side-h">Most breeds by country {country && <button type="button" className="geo-clear" onClick={() => setCountry(null)}>Clear</button>}</span>
                <CountryBars active={country} onPick={pickCountry} />
                {country && (
                  <p className="geo-list">{highlight.map(nameOf).join(", ")}</p>
                )}
              </div>
            )}

            <div className="geo-legend">
              <span className="side-h">{mode === "family" ? "Family groups" : "Original jobs"}</span>
              <ul>
                {legend.map((l) => (
                  <li key={l.key}>
                    <i style={{ background: l.color }} />
                    {l.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <section className="pairs-section" aria-labelledby="homes-h">
          <h2 id="homes-h">Families and their homelands</h2>
          <p>
            The study found that breeds cluster by <strong>where</strong> they came from as
            much as by what they were bred to do. Here is every family group and the places
            its breeds come from, starting with the most local. Some families come from a
            single country: the American terriers, the Mexican toy dogs, the Hungarian herders.
            Others belong to a region rather than a country: the Mediterranean family stretches
            from Spain to Afghanistan. Several also include breeds developed far from home from
            local stock, like the Australian cattle dog and kelpie, built from British herding
            dogs and grouped with the UK Rural family.
          </p>
          <div className="pair-table-wrap">
            <table className="pair-table homes-table">
              <thead>
                <tr>
                  <th scope="col"><span className="th-pad">Family</span></th>
                  <th scope="col" className="num"><span className="th-pad">Breeds</span></th>
                  <th scope="col"><span className="th-pad">Where its breeds come from</span></th>
                </tr>
              </thead>
              <tbody>
                {homelands.map((h) => (
                  <tr key={h.cl}>
                    <td>
                      <span className="pair-family homes-fam">
                        <i style={{ background: cladeColor(h.cl) }} />
                        {data.clades[h.cl]}
                      </span>
                    </td>
                    <td className="num">{h.n}</td>
                    <td>{h.places.map(([p, n]) => (n > 1 ? `${p} (${n})` : p)).join(" · ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="pairs-foot">
          <p>
            Origins come from standard breed-club histories, not the study, which has no
            geographic coordinates. Each dot sits at an approximate regional centre, nudged
            apart where breeds crowd together (a thin line points to the true spot when zoomed
            in). Several origins are debated; those breeds carry a note. Map data: Natural Earth
            via world-atlas. Families: Parker et&nbsp;al. 2017. Photos: Dog CEO API.
          </p>
        </footer>
      </main>
    </>
  );
}
