"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import * as d3 from "d3";
import raw from "@/data/akc.json";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
import { SiteNav } from "./shared";

type Breed = { slug: string; name: string; code: string | null; r: (number | null)[] };
type Era = { breed: string; code: string; from: number; to: number };
const D = raw as unknown as { years: number[]; breeds: Breed[]; eras: Era[] };
const YEARS = D.years;
const LAST = YEARS.length - 1;
const FIRST_YEAR = YEARS[0];
const LAST_YEAR = YEARS[LAST];

const colorOf = (b: { code: string | null }) => (b.code ? cladeColor(data.breeds[b.code]?.clade ?? null, b.code) : "#7d847e");
const cladeName = (code: string | null) => {
  const c = code ? data.breeds[code]?.clade : null;
  return c ? data.clades[c] : null;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

function Photo({ b, size }: { b: { code: string | null; name: string }; size: number }) {
  const url = b.code ? photoOf(b.code) : undefined;
  return url ? (
    <img className="pop-photo" src={url} alt={b.name} width={size} height={size} loading="lazy" referrerPolicy="no-referrer" />
  ) : (
    <span className="pop-photo pop-nophoto" style={{ width: size, height: size }} aria-hidden>
      {initials(b.name)}
    </span>
  );
}

// React's SVG <image> types lack referrerPolicy, but the attribute works (Dog CEO images need it).
const NO_REFERRER = { referrerPolicy: "no-referrer" } as object;

/** SVG photo disc (or initials) for chart marks. */
function Disc({ b, x, y, r }: { b: Breed | Era; x: number; y: number; r: number }) {
  const code = b.code;
  const name = "name" in b ? b.name : b.breed;
  const url = code ? photoOf(code) : undefined;
  const id = `pop-clip-${code ?? name.replace(/\W/g, "")}-${r}`;
  return (
    <g transform={`translate(${x},${y})`}>
      <clipPath id={id}>
        <circle r={r} />
      </clipPath>
      <circle r={r + 1.5} fill="#1a211e" stroke={colorOf({ code })} strokeWidth={2} />
      {url ? (
        <image href={url} x={-r} y={-r} width={2 * r} height={2 * r} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} {...NO_REFERRER} />
      ) : (
        <text className="pop-init" textAnchor="middle" dy="0.35em">
          {initials(name)}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------- top 20 tiles

function TopTiles() {
  const top = D.breeds.filter((b) => b.r[LAST] && b.r[LAST]! <= 20).sort((a, b) => a.r[LAST]! - b.r[LAST]!);
  return (
    <ol className="pop-tiles">
      {top.map((b) => {
        const prev = b.r[LAST - 1];
        const d = prev ? prev - b.r[LAST]! : null;
        const clade = cladeName(b.code);
        return (
          <li key={b.slug}>
            <Photo b={b} size={72} />
            <div className="pop-ttext">
              <span className="pop-rank">#{b.r[LAST]}</span>
              <span className="pop-tname">{b.name}</span>
              <span className="pop-tmeta">
                {d === null ? "new" : d > 0 ? `▲ ${d} since ${LAST_YEAR - 1}` : d < 0 ? `▼ ${-d} since ${LAST_YEAR - 1}` : `same as ${LAST_YEAR - 1}`}
              </span>
              {clade && (
                <span className="pop-tclade">
                  <i style={{ background: colorOf(b) }} />
                  {clade}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ---------------------------------------------------------------- #1 eras

function Eras() {
  const W = 1000;
  const H = 214;
  const x = d3.scaleLinear().domain([1936, 2026]).range([12, W - 12]);
  const by = 92; // top of the reign blocks
  return (
    <div className="pop-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="pop-svg pop-eras" role="img" aria-label={D.eras.map((e) => `${e.breed} ${e.from}–${e.to}`).join("; ")}>
        {D.eras.map((e) => {
          const x0 = x(e.from);
          const x1 = x(e.to + 1);
          const cx = (x0 + x1) / 2;
          const years = e.to - e.from + 1;
          const anchor = cx > W - 60 ? "end" : "middle";
          const tx = anchor === "end" ? x1 : cx;
          const words = e.breed.split(" ");
          return (
            <g key={e.from}>
              <title>{`${e.breed}: #1 from ${e.from} to ${e.to} (${years} years)`}</title>
              <rect x={x0 + 1} y={by} width={x1 - x0 - 2} height={22} rx={3} fill={colorOf(e)} />
              <line x1={cx} x2={cx} y1={by - 12} y2={by} className="pop-stem" />
              <Disc b={e} x={cx} y={by - 40} r={26} />
              {[words[0], words.slice(1).join(" ")].filter(Boolean).map((w, k) => (
                <text key={k} className="pop-ename" x={tx} y={by + 62 + k * 14} textAnchor={anchor}>{w}</text>
              ))}
              <text className="pop-eyears" x={tx} y={by + 62 + (words.length > 1 ? 2 : 1) * 14} textAnchor={anchor}>
                {e.from}–{e.to} · {years} yrs
              </text>
            </g>
          );
        })}
        {/* decade axis between the blocks and the names */}
        <line x1={x(1936)} x2={x(2026)} y1={by + 27} y2={by + 27} className="pop-baseline" />
        {d3.range(1940, 2030, 10).map((yy) => (
          <g key={yy}>
            <line x1={x(yy)} x2={x(yy)} y1={by + 27} y2={by + 31} className="pop-baseline" />
            <text className="pop-axis" x={x(yy)} y={by + 42} textAnchor="middle">{yy}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------- bump chart

function Bump({ n }: { n: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const W = 1000;
  const LX = 210;
  const RX = 250;
  const RH = n <= 10 ? 36 : 25;
  const TOP = 24;
  const x = d3.scalePoint<number>().domain(YEARS).range([LX, W - RX]);
  const y = (r: number) => TOP + (r - 1) * RH;
  const yOff = y(n) + RH * 1.1;
  const H = yOff + 26;
  const set = D.breeds.filter((b) => b.r.some((r) => r !== null && r <= n));
  const yr = (r: number) => (r <= n ? y(r) : yOff);
  const hb = hover ? set.find((b) => b.slug === hover) : null;

  return (
    <>
      <p className="pop-readout" aria-live="polite">
        {hb ? (
          <>
            <strong>{hb.name}</strong>: {hb.r[0] ? `#${hb.r[0]} in ${FIRST_YEAR}` : `not ranked in ${FIRST_YEAR}`} →{" "}
            {hb.r[LAST] ? `#${hb.r[LAST]} in ${LAST_YEAR}` : "not ranked"}
            {" · "}best #{d3.min(hb.r.filter((r): r is number => r !== null))} (
            {YEARS.filter((_, i) => hb.r[i] === d3.min(hb.r.filter((r): r is number => r !== null))).join(", ")})
          </>
        ) : (
          <>Hover or tap a breed to follow it. Breeds that drop out of the top {n} slide to the &ldquo;lower&rdquo; lane.</>
        )}
      </p>
      <div className="pop-scroll">
        <svg viewBox={`0 0 ${W} ${H}`} className="pop-svg pop-bump" role="img" aria-label={`Top ${n} AKC breeds by year, ${FIRST_YEAR} to ${LAST_YEAR}.`} onPointerLeave={() => setHover(null)}>
          {YEARS.map((yy) => (
            <g key={yy}>
              <line x1={x(yy)} x2={x(yy)} y1={TOP - 10} y2={yOff} className="pop-grid" />
              <text className="pop-axis" x={x(yy)} y={TOP - 14} textAnchor="middle">
                {yy % 2 === 1 || yy === LAST_YEAR ? yy : ""}
              </text>
            </g>
          ))}
          <text className="pop-axis" x={x(FIRST_YEAR)! - 8} y={yOff + 4} textAnchor="end">lower than #{n}</text>
          <line x1={x(FIRST_YEAR)} x2={x(LAST_YEAR)} y1={yOff} y2={yOff} className="pop-offlane" />
          {set.map((b) => {
            const c = colorOf(b);
            const dim = hover && hover !== b.slug;
            const segs = YEARS.slice(0, -1).flatMap((yy, i) => {
              const a = b.r[i];
              const z = b.r[i + 1];
              if (a === null || z === null || (a > n && z > n)) return [];
              return [{ i, x1: x(yy)!, y1: yr(a), x2: x(YEARS[i + 1])!, y2: yr(z), inside: a <= n && z <= n }];
            });
            // Label breeds that are never in the top n at either end at their best rank.
            const best = d3.min(b.r.filter((r): r is number => r !== null))!;
            const bi = b.r.indexOf(best);
            const ends = (b.r[0] ?? 999) <= n || (b.r[LAST] ?? 999) <= n;
            return (
              <g key={b.slug} className="pop-line" opacity={dim ? 0.12 : 1} onPointerEnter={() => setHover(b.slug)} onClick={() => setHover(b.slug)}>
                <title>{b.name}</title>
                {segs.map((s) => (
                  <line key={s.i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={c} strokeWidth={hover === b.slug ? 3.5 : 2.2} strokeDasharray={s.inside ? undefined : "3 3"} strokeLinecap="round" />
                ))}
                {segs.map((s) => (
                  <line key={`h${s.i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="transparent" strokeWidth={12} />
                ))}
                {b.r.map((r, i) =>
                  r !== null && r <= n ? <circle key={i} cx={x(YEARS[i])} cy={y(r)} r={3.6} fill={c} stroke="#0d1110" strokeWidth={1.5} /> : null,
                )}
                {b.r[0] !== null && b.r[0] <= n && (
                  <text className="pop-lab" x={LX - 12} y={y(b.r[0])} dy="0.35em" textAnchor="end">
                    <tspan className="pop-labrank">#{b.r[0]}</tspan> {b.name}
                  </text>
                )}
                {b.r[LAST] !== null && b.r[LAST]! <= n && (
                  <>
                    <Disc b={b} x={x(LAST_YEAR)! + 26} y={y(b.r[LAST]!)} r={n <= 10 ? 14 : 10} />
                    <text className="pop-lab" x={x(LAST_YEAR)! + (n <= 10 ? 48 : 42)} y={y(b.r[LAST]!)} dy="0.35em">
                      <tspan className="pop-labrank">#{b.r[LAST]}</tspan> {b.name}
                    </text>
                  </>
                )}
                {!ends && (
                  <text className="pop-lab small" x={x(YEARS[bi])} y={y(best) - 8} textAnchor="middle">
                    {b.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- climbers & fallers

function Movers({ dir }: { dir: "up" | "down" }) {
  const pool = D.breeds.filter((b) => b.r[0] && b.r[LAST] && Math.min(b.r[0], b.r[LAST]!) <= 60);
  const rows = [...pool].sort((a, b) => (dir === "up" ? 1 : -1) * ((b.r[0]! - b.r[LAST]!) - (a.r[0]! - a.r[LAST]!))).slice(0, 10);
  const W = 480;
  const RH = 36;
  const x = d3.scaleLinear().domain([110, 1]).range([200, W - 16]);
  const H = rows.length * RH + 28;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pop-svg" role="img" aria-label={rows.map((b) => `${b.name} #${b.r[0]} to #${b.r[LAST]}`).join("; ")}>
      {[100, 75, 50, 25, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={16} y2={H} className="pop-grid" />
          <text className="pop-axis" x={x(t)} y={11} textAnchor="middle">#{t}</text>
        </g>
      ))}
      {rows.map((b, i) => {
        const yy = 28 + i * RH + RH / 2 - 6;
        const a = x(b.r[0]!);
        const z = x(b.r[LAST]!);
        const c = colorOf(b);
        return (
          <g key={b.slug}>
            <title>{`${b.name}: #${b.r[0]} in ${FIRST_YEAR}, #${b.r[LAST]} in ${LAST_YEAR}`}</title>
            <Disc b={b} x={14} y={yy} r={12} />
            <text className="pop-lab" x={34} y={yy} dy="0.35em">{b.name}</text>
            <line x1={a} x2={z} y1={yy} y2={yy} stroke={c} strokeWidth={2.2} />
            <path d={dir === "up" ? `M${z - 7},${yy - 5} L${z},${yy} L${z - 7},${yy + 5}` : `M${z + 7},${yy - 5} L${z},${yy} L${z + 7},${yy + 5}`} fill="none" stroke={c} strokeWidth={2.2} strokeLinejoin="round" />
            <circle cx={a} cy={yy} r={3.5} fill="#0d1110" stroke={c} strokeWidth={1.8} />
            <text className="pop-val" x={a + (dir === "up" ? -6 : 6)} y={yy - 9} textAnchor={dir === "up" ? "end" : "start"}>#{b.r[0]}</text>
            <text className="pop-val strong" x={z + (dir === "up" ? 6 : -6)} y={yy - 9} textAnchor={dir === "up" ? "start" : "end"}>#{b.r[LAST]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------- lookup

const BY_NAME = new Map(D.breeds.map((b) => [b.name.toLowerCase(), b]));
const NAMES = D.breeds.map((b) => b.name).sort((a, b) => a.localeCompare(b));

function Lookup() {
  const [q, setQ] = useState("Cane Corso");
  const b = BY_NAME.get(q.trim().toLowerCase()) ?? null;
  const W = 480;
  const H = 200;
  const pts = b ? YEARS.map((yy, i) => ({ yy, r: b.r[i] })).filter((p): p is { yy: number; r: number } => p.r !== null) : [];
  const maxR = pts.length ? Math.max(10, d3.max(pts, (p) => p.r)!) : 10;
  const x = d3.scalePoint<number>().domain(YEARS).range([40, W - 30]);
  const y = d3.scaleLinear().domain([1, maxR]).nice().range([24, H - 30]);
  const line = d3
    .line<{ yy: number; r: number | null }>()
    .defined((p) => p.r !== null)
    .x((p) => x(p.yy)!)
    .y((p) => y(p.r ?? 1));
  return (
    <div className="nm-detective pop-lookup">
      <label className="nm-input">
        <span>Pick a breed</span>
        <input type="search" list="pop-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Cane Corso, Boxer" />
        <datalist id="pop-names">
          {NAMES.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </label>
      {b ? (
        <div className="pop-lres">
          <div className="pop-lhead">
            <Photo b={b} size={64} />
            <div>
              <p className="pop-lname">{b.name}</p>
              <p className="pop-lmeta">
                {b.r[LAST] ? `#${b.r[LAST]} of ${D.breeds.filter((z) => z.r[LAST]).length} in ${LAST_YEAR}` : `not ranked in ${LAST_YEAR}`}
                {cladeName(b.code) && (
                  <>
                    {" · "}
                    <i style={{ background: colorOf(b) }} /> {cladeName(b.code)} family group
                  </>
                )}
              </p>
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="pop-svg" role="img" aria-label={`${b.name} rank by year: ${pts.map((p) => `${p.yy} #${p.r}`).join(", ")}`}>
            {y.ticks(4).map((t) => (
              <g key={t}>
                <line x1={30} x2={W - 20} y1={y(Math.max(1, t))} y2={y(Math.max(1, t))} className="pop-grid" />
                <text className="pop-axis" x={26} y={y(Math.max(1, t))} dy="0.35em" textAnchor="end">#{Math.max(1, t)}</text>
              </g>
            ))}
            {YEARS.map((yy) => (
              <text key={yy} className="pop-axis" x={x(yy)} y={H - 8} textAnchor="middle">
                {yy % 2 === 1 || yy === LAST_YEAR ? yy : ""}
              </text>
            ))}
            <path d={line(YEARS.map((yy, i) => ({ yy, r: b.r[i] })))!} fill="none" stroke={colorOf(b)} strokeWidth={2.4} />
            {pts.map((p) => (
              <g key={p.yy}>
                <title>{`${p.yy}: #${p.r}`}</title>
                <circle cx={x(p.yy)} cy={y(p.r)} r={4} fill={colorOf(b)} stroke="#141a18" strokeWidth={1.5} />
                {(p.yy === pts[0].yy || p.yy === pts[pts.length - 1].yy) && (
                  <text className="pop-val strong" x={x(p.yy)} y={y(p.r) - 9} textAnchor="middle">#{p.r}</text>
                )}
              </g>
            ))}
          </svg>
          {pts.length < YEARS.length && <p className="hl-small">Gaps: no rank listed for that year in our sources (often a newly recognized breed).</p>}
        </div>
      ) : (
        <p className="nm-miss">Pick a breed from the list ({D.breeds.length} breeds).</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- page

export default function PopularityPage() {
  const [n, setN] = useState(10);
  const top5 = useMemo(() => D.breeds.filter((b) => b.r[LAST] && b.r[LAST]! <= 5).sort((a, b) => a.r[LAST]! - b.r[LAST]!), []);
  const lab = D.eras.find((e) => e.breed === "Labrador Retriever")!;
  return (
    <>
      <SiteNav />
      <main className="purpose popularity">
        <header className="pairs-head">
          <p className="eyebrow">America&rsquo;s favorite dogs</p>
          <h1>The most popular breeds, year by year</h1>
          <p className="pairs-lede">
            Every year the American Kennel Club ranks its breeds by how many puppies are
            registered. The list moves slowly at the top and fast below it: one breed held{" "}
            <strong>#1 for {lab.to - lab.from + 1} years in a row</strong>, while others have
            climbed or fallen more than 30 places in a dozen years.
          </p>
          <p className="nm-top">
            Top 5 in {LAST_YEAR}:{" "}
            {top5.map((b, i) => (
              <span key={b.slug}>
                <strong>{b.name}</strong>
                {i < top5.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>
        </header>

        <section className="pairs-section" aria-labelledby="top-h">
          <h2 id="top-h">The top 20 of {LAST_YEAR}</h2>
          <p>
            Change is compared with {LAST_YEAR - 1}. The colored dot is the breed&rsquo;s family
            group on this site&rsquo;s family tree, when the breed was part of the 2017 study.
          </p>
          <TopTiles />
        </section>

        <section className="pairs-section" aria-labelledby="eras-h">
          <h2 id="eras-h">Who held #1, 1936–{LAST_YEAR}</h2>
          <p>
            Only six reigns in ninety years. The Cocker Spaniel took the top spot twice; the
            Labrador Retriever&rsquo;s run, from 1991 to 2021, is the longest on record. In 2022
            the French Bulldog finally passed it, and it has stayed on top since.
          </p>
          <Eras />
        </section>

        <section className="pairs-section" aria-labelledby="bump-h">
          <h2 id="bump-h">
            Rank by rank, {FIRST_YEAR}–{LAST_YEAR}
          </h2>
          <p>
            Each line is a breed. The French Bulldog climbed from #11 to #1; the Dachshund and
            German Shorthaired Pointer moved up, the Bulldog slid from #5 to #10, and the Yorkshire
            Terrier and Boxer dropped out of the top 10.
          </p>
          <div className="job-chips" role="tablist" aria-label="How many ranks">
            {[10, 20].map((k) => (
              <button key={k} type="button" role="tab" aria-selected={n === k} className={n === k ? "on" : ""} onClick={() => setN(k)}>
                Top {k}
              </button>
            ))}
          </div>
          <Bump n={n} key={n} />
        </section>

        <section className="pairs-section" aria-labelledby="move-h">
          <h2 id="move-h">
            Biggest climbers and fallers since {FIRST_YEAR}
          </h2>
          <p>
            Among breeds ranked in the top 60 in {FIRST_YEAR} or {LAST_YEAR}. The Cane Corso, an
            Italian guardian breed the AKC recognized only in 2010, rose from #50 to #11. Big
            working and spitz breeds, like the Bullmastiff, Akita and Alaskan Malamute, fell.
          </p>
          <div className="pop-movers">
            <div>
              <h3>Climbed</h3>
              <Movers dir="up" />
            </div>
            <div>
              <h3>Fell</h3>
              <Movers dir="down" />
            </div>
          </div>
        </section>

        <section className="pairs-section" aria-labelledby="look-h">
          <h2 id="look-h">Look up any breed</h2>
          <p>All {D.breeds.length} ranked breeds, {FIRST_YEAR} to {LAST_YEAR}. Higher on the chart is more popular.</p>
          <Lookup />
        </section>

        <section className="pairs-section" aria-labelledby="dna-h">
          <h2 id="dna-h">What popularity does to a breed&rsquo;s DNA</h2>
          <ul className="hl-reasons nm-takeaways">
            <li>
              <strong>Booms can narrow the gene pool.</strong> When demand surges, many puppies
              can come from relatively few breeding dogs, especially sought-after sires. That
              concentrates whatever they carry, including hidden disease variants (see{" "}
              <Link href="/history#lineages">natural selection vs. breeding</Link>).
            </li>
            <li>
              <strong>Looks in fashion are often genetic extremes.</strong> The French Bulldog and
              Bulldog are both in the top 10, and their flat faces are tied to breathing problems.
              The genetics are on the <Link href="/health">Health &amp; heredity</Link> tab.
            </li>
            <li>
              <strong>Rankings count registrations, not dogs.</strong> They only include purebred
              puppies registered with the AKC, so mixed-breed dogs and doodles, among the most
              common dogs in many cities, never appear.
            </li>
          </ul>
        </section>

        <footer className="pairs-foot">
          <p>
            Data: American Kennel Club breed popularity rankings. {FIRST_YEAR}–2020 as compiled
            from AKC data by K. Kakey for the R4DS TidyTuesday project (1 Feb 2022); 2021–{LAST_YEAR} from
            the AKC&rsquo;s annual &ldquo;Most Popular Dog Breeds&rdquo; announcements. The
            compiled data has gaps for about twenty breeds before 2020. Years at #1 before{" "}
            {FIRST_YEAR} come from AKC articles and Wikipedia; sources differ by a year on when the
            Cocker Spaniel&rsquo;s second run began. Breeds are matched to the 2017 study by
            name for photos and family groups.
          </p>
        </footer>
      </main>
    </>
  );
}
