"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";
import raw from "@/data/torontonames.json";
import { LiftBars } from "./NameCharts";

type Item = { name: string; n: number; lift: number };
type Top = { name: string; n: number; share: number };
const T = raw as unknown as {
  source: { year: number; toronto_dogs: number; nyc_dogs: number; toronto_years: number[]; toronto_full_years: number[]; nyc_years: number[]; trend_min: number };
  top: { toronto: Top[]; nyc: Top[] };
  vs: { toronto: Item[]; nyc: Item[] };
  /**
   * Dogs per 10,000 licensed that year: t = Toronto (toronto_years), n = New York (nyc_years).
   * Toronto is null after its complete lists end in years the name wasn't in the top 200.
   */
  trend: Record<string, { t: (number | null)[]; n: number[] }>;
};

const fmt = d3.format(",");
const pct = d3.format(".1%");
const one = d3.format(",.1f");
// Validated as a pair on the dark surface (lightness, chroma, CVD and normal-vision checks).
const CITY = { toronto: { label: "Toronto", color: "#d35e2c" }, nyc: { label: "New York", color: "#2d88e2" } };
const NAMES = Object.keys(T.trend).sort();
const TY = T.source.toronto_years;
const LAST_FULL = T.source.toronto_full_years[T.source.toronto_full_years.length - 1];
const NY = T.source.nyc_years;
const YEARS = d3.range(Math.min(TY[0], NY[0]), Math.max(TY[TY.length - 1], NY[NY.length - 1]) + 1);

/** Name lookup: the name's share of licensed dogs, year by year, in both cities. */
function NameTrend() {
  const [q, setQ] = useState("Maple");
  const key = useMemo(() => NAMES.find((n) => n.toLowerCase() === q.trim().toLowerCase()) ?? null, [q]);
  const W = 640;
  const H = 230;
  const RX = 74;
  type Pt = { y: number; v: number | null };
  const series: { id: "toronto" | "nyc"; pts: Pt[] }[] = key
    ? [
        { id: "toronto", pts: TY.map((y, i) => ({ y, v: T.trend[key].t[i] })) },
        { id: "nyc", pts: NY.map((y, i) => ({ y, v: T.trend[key].n[i] })) },
      ]
    : [];
  const max = d3.max(series.flatMap((s) => s.pts.map((p) => p.v ?? 0))) || 10;
  const x = d3.scalePoint<number>().domain(YEARS).range([44, W - RX]);
  const y = d3.scaleLinear().domain([0, max]).nice().range([H - 30, 14]);
  const line = d3
    .line<Pt>()
    .defined((p) => p.v !== null)
    .x((p) => x(p.y)!)
    .y((p) => y(p.v ?? 0));
  const atYear = (s: (typeof series)[number], yr: number) => s.pts.find((p) => p.y === yr)?.v;
  return (
    <div className="nm-detective cc-lookup">
      <label className="nm-input">
        <span>Type a dog&rsquo;s name</span>
        <input type="search" list="cc-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Luna, Maple, Princess" />
        <datalist id="cc-names">
          {NAMES.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <ul className="cc-legend" aria-label="Legend">
          {(["toronto", "nyc"] as const).map((c) => (
            <li key={c}>
              <i style={{ background: CITY[c].color }} />
              {CITY[c].label}
            </li>
          ))}
        </ul>
      </label>
      {key ? (
        <div className="pop-lres">
          <p className="nm-rhead">
            In {T.source.year}, <strong>{one(atYear(series[0], T.source.year) ?? 0)}</strong> of every
            10,000 licensed Toronto dogs were named <strong>{key}</strong>, and{" "}
            <strong>{one(atYear(series[1], T.source.year) ?? 0)}</strong> in New York.
          </p>
          <svg viewBox={`0 0 ${W} ${H}`} className="pop-svg" role="img" aria-label={series.map((s) => `${CITY[s.id].label}: ${s.pts.map((p) => `${p.y} ${p.v}`).join(", ")}`).join("; ")}>
            {y.ticks(4).map((t) => (
              <g key={t}>
                <line x1={36} x2={W - RX + 8} y1={y(t)} y2={y(t)} className="pop-grid" />
                <text className="pop-axis" x={32} y={y(t)} dy="0.35em" textAnchor="end">{d3.format(",")(t)}</text>
              </g>
            ))}
            <text className="pop-axis" x={36} y={8}>dogs per 10,000</text>
            {YEARS.map((yr) => (
              <text key={yr} className="pop-axis" x={x(yr)} y={H - 8} textAnchor="middle">
                {yr % 2 === 1 ? yr : ""}
              </text>
            ))}
            {series.map((s) => {
              const c = CITY[s.id].color;
              const shown = s.pts.filter((p): p is { y: number; v: number } => p.v !== null);
              const last = shown[shown.length - 1];
              return (
                <g key={s.id}>
                  <path d={line(s.pts)!} fill="none" stroke={c} strokeWidth={2.4} />
                  {shown.map((p) => (
                    <circle key={p.y} cx={x(p.y)} cy={y(p.v)} r={3.6} fill={c} stroke="#141a18" strokeWidth={1.5}>
                      <title>{`${CITY[s.id].label}, ${p.y}: ${one(p.v)} per 10,000 dogs`}</title>
                    </circle>
                  ))}
                  {last && (
                    <text className="cc-endlab" x={x(last.y)! + 8} y={y(last.v)} dy="0.35em" fill={c}>
                      {CITY[s.id].label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          <p className="hl-small">
            After {LAST_FULL} Toronto publishes only its top 200 names each year, so its line shows
            those years only when the name made the top 200 (a gap means it didn&rsquo;t), divided by
            the city&rsquo;s official count of licensed dogs. New York counts dogs by the year their
            license was issued.
          </p>
        </div>
      ) : (
        <p className="nm-miss">
          {q.trim()
            ? `Not enough dogs have that name (it needs at least ${T.source.trend_min} in one year in either city). Try another, or pick one from the list.`
            : "Start typing a name."}
        </p>
      )}
    </div>
  );
}

/**
 * Share of each city's population reporting Irish or Scottish origin. People can report
 * more than one origin, so the shares overlap and are drawn side by side, never stacked.
 * Toronto: 2021 Census, ethnic or cultural origin, population in private households
 *   (2,761,285; Irish 226,865, Scottish 211,180), City of Toronto Ward Profiles.
 * New York: ACS 2020-2024 5-year, people reporting ancestry (B04006) over total population
 *   (8,483,844; Irish 372,527, Scottish 43,017), via Census Reporter.
 */
const ORIGINS = [
  { origin: "Irish", toronto: 226865 / 2761285, nyc: 372527 / 8483844 },
  { origin: "Scottish", toronto: 211180 / 2761285, nyc: 43017 / 8483844 },
];

/** Split bar: Toronto to the left of the origin labels, New York to the right. */
function OriginSplit() {
  const W = 320;
  const MID = W / 2;
  const GAP = 34; // room for the origin label in the middle
  const RH = 30;
  const x = d3.scaleLinear().domain([0, 0.1]).range([0, MID - GAP - 34]);
  const H = 20 + ORIGINS.length * RH + 16;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cc-split" role="img" aria-label={ORIGINS.map((o) => `${o.origin}: Toronto ${pct(o.toronto)}, New York ${pct(o.nyc)}`).join("; ")}>
      <text className="cc-sh" x={MID - GAP} y={10} textAnchor="end" fill={CITY.toronto.color}>Toronto</text>
      <text className="cc-sh" x={MID + GAP} y={10} fill={CITY.nyc.color}>New York</text>
      {ORIGINS.map((o, i) => {
        const yy = 20 + i * RH;
        const wt = x(o.toronto);
        const wn = x(o.nyc);
        return (
          <g key={o.origin}>
            <title>{`${o.origin} origin: ${pct(o.toronto)} of Toronto, ${pct(o.nyc)} of New York`}</title>
            <text className="cc-so" x={MID} y={yy + 11} textAnchor="middle">{o.origin}</text>
            <rect x={MID - GAP - wt} y={yy + 2} width={wt} height={14} rx={2} fill={CITY.toronto.color} />
            <text className="cc-sv" x={MID - GAP - wt - 4} y={yy + 13} textAnchor="end">{pct(o.toronto)}</text>
            <rect x={MID + GAP} y={yy + 2} width={Math.max(2, wn)} height={14} rx={2} fill={CITY.nyc.color} />
            <text className="cc-sv" x={MID + GAP + Math.max(2, wn) + 4} y={yy + 13}>{pct(o.nyc)}</text>
          </g>
        );
      })}
      <text className="cc-sn" x={MID} y={H - 2} textAnchor="middle">share of residents reporting each origin</text>
    </svg>
  );
}

/** One city's top 10; names missing from the other city's top 10 are highlighted. */
function TopList({ city, rows, other }: { city: string; rows: Top[]; other: Top[] }) {
  const shared = new Set(other.map((o) => o.name));
  return (
    <article className="nm-card">
      <h3>{city}</h3>
      <p className="nm-cmeta">top 10 names, share of dogs</p>
      <ol className="cc-top">
        {rows.map((r) => (
          <li key={r.name} className={shared.has(r.name) ? "" : "only"}>
            <span className="cc-name">{r.name}</span>
            <span className="cc-share">{pct(r.share)}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

/** New York vs. Toronto: the same favorites, different accents. */
export default function CityCompare() {
  const max = Math.min(8, d3.max([...T.vs.toronto, ...T.vs.nyc].map((d) => d.lift)) ?? 8);
  const y = T.source.year;
  return (
    <section className="pairs-section" aria-labelledby="city-h">
      <h2 id="city-h">New York vs. Toronto</h2>
      <p>
        Toronto publishes the names of its licensed dogs too (names only, no breeds), so we
        can compare the two cities: {fmt(T.source.toronto_dogs)} dogs licensed in Toronto in {y}{" "}
        and {fmt(T.source.nyc_dogs)} in New York the same year. The favorites are almost the
        same. Seven of each city&rsquo;s top 10 names are shared, led by Charlie, Bella, Max
        and Luna. Highlighted names are in only one city&rsquo;s top 10.
      </p>
      <div className="nm-cards cc-tops">
        <TopList city="Toronto" rows={T.top.toronto} other={T.top.nyc} />
        <TopList city="New York City" rows={T.top.nyc} other={T.top.toronto} />
      </div>
      <p>
        The differences show up a little further down the list. Using the same
        distinctive-name method as above, these are the names each city uses far more than the
        other (bars show how many times more common; the second number is how many dogs had it):
      </p>
      <div className="nm-cards">
        <article className="nm-card">
          <h3>More Toronto</h3>
          <p className="nm-cmeta">names Toronto uses far more than New York</p>
          <LiftBars items={T.vs.toronto} max={max} />
        </article>
        <article className="nm-card">
          <h3>More New York</h3>
          <p className="nm-cmeta">names New York uses far more than Toronto</p>
          <LiftBars items={T.vs.nyc} max={max} />
        </article>
      </div>
      <ul className="hl-reasons nm-takeaways cc-notes">
        <li>
          <strong>Toronto&rsquo;s names sound Scottish and Irish.</strong> Angus, Finnegan,
          Murphy, Maggie and Molly all come out well ahead, and so does a Canadian original:
          Maple. It fits the city: about 1 in 12 Torontonians report Irish origin and 1 in 13
          Scottish, against 1 in 23 and 1 in 200 New Yorkers.
          <OriginSplit />
          <span className="cc-src">
            Toronto: 2021 Census. New York: American Community Survey 2020–2024. People can report
            more than one origin.
          </span>
        </li>
        <li>
          <strong>New York&rsquo;s dogs are royalty.</strong> Princess, Prince, King and Lady are
          all about twice as common as in Toronto.
        </li>
        <li>
          <strong>New York names reflect its neighborhoods and languages.</strong> Dogs are named
          Brooklyn, Spanish-speaking owners use Nena (&ldquo;girl&rdquo;),
          and treat names like Brownie, Oreo and Cookie are more common. New Yorkers also call
          lapdogs plain Little and Baby, where Toronto owners write &ldquo;Little Bear&rdquo; or
          &ldquo;Little One&rdquo;.
        </li>
      </ul>
      <h3 className="cc-h">Look up a name in both cities</h3>
      <p className="cc-p">
        How common a name is in each city, year by year, as a share of licensed dogs, so the two
        cities can be compared despite their different sizes. Any of the {d3.format(",")(NAMES.length)}{" "}
        names given to at least {T.source.trend_min} dogs in one year in either city.
      </p>
      <NameTrend />
    </section>
  );
}
