"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";
import raw from "@/data/nycnames.json";
import { LiftBars, SizeCompare } from "./NameCharts";
import { SiteNav } from "./shared";
import CityCompare from "./CityCompare";

type Item = { name: string; n: number; lift: number };
type Group = { group: string; dogs: number; distinctive: Item[]; popular: { name: string; n: number }[]; photo?: string | null };
const D = raw as unknown as {
  source: { records: number; dogs: number; named: number; used: number; years: string[] };
  top_names: { name: string; n: number }[];
  size_order: string[];
  base_size: number[];
  breeds: string[];
  groups: Record<"size" | "family" | "job" | "region" | "breed", Group[]>;
  /** Every breed outside the top 24; `distinctive` is null when there isn't enough data. */
  more_breeds: (Omit<Group, "distinctive"> & { distinctive: Item[] | null })[];
  more_min_dogs: number;
  model: { label: string; test_dogs: number; accuracy: number; baseline: number; top3: number; baseline_top3: number; classes: number; balanced: number; chance: number }[];
  tied: { name: string; breed: string; share: number; lift: number; n: number; photo?: string | null }[];
  lookup: Record<string, { n: number; b: [number, number, number][]; s: number[] }>;
};

const fmt = d3.format(",");
const TABS: { id: keyof typeof D.groups; label: string; blurb: string }[] = [
  { id: "breed", label: "Breed", blurb: "The 24 most common breeds in NYC." },
  { id: "size", label: "Size", blurb: "Typical adult weight of each dog's breed." },
  { id: "family", label: "Family group", blurb: "Family groups from this site's family tree. Breeds outside the study use their closest relative's group." },
  { id: "job", label: "Original job", blurb: "What each breed was first bred to do (from the Bred for purpose tab)." },
  { id: "region", label: "Region of origin", blurb: "Where each breed was developed (from the breed origins globe on the Family tree tab)." },
];
const NAMES = Object.keys(D.lookup).sort();
const MORE = [...D.more_breeds].sort((a, b) => a.group.localeCompare(b.group));

/** Search for any breed outside the top 24, with an honest "not enough data" when needed. */
function OtherBreed({ maxLift }: { maxLift: number }) {
  const [q, setQ] = useState("");
  const g = MORE.find((b) => b.group.toLowerCase() === q.trim().toLowerCase()) ?? null;
  const analyzed = MORE.filter((b) => b.distinctive).length;
  return (
    <div className="nm-other">
      <label className="nm-input nm-other-input">
        <span>Another breed</span>
        <input type="search" list="nm-more-breeds" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Pug, Jindo, Great Dane" />
        <datalist id="nm-more-breeds">
          {MORE.map((b) => (
            <option key={b.group} value={b.group} />
          ))}
        </datalist>
      </label>
      <p className="hl-small">
        Any of the {MORE.length} other breeds in the data. {analyzed} have enough dogs to analyze; these are
        smaller groups, so a name only needs 5 dogs of the breed to count (instead of 12), and results are rougher.
      </p>
      {g &&
        (g.distinctive ? (
          <article className="nm-card has-photo nm-other-card">
            <div className="nm-chead">
              {g.photo ? (
                <span className="nm-photo">
                  <img src={g.photo} alt={g.group} loading="lazy" referrerPolicy="no-referrer" />
                </span>
              ) : (
                <span className="nm-photo nm-nophoto" aria-hidden>
                  {g.group.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
                </span>
              )}
              <div>
                <h3>{g.group}</h3>
                <p className="nm-cmeta">
                  {fmt(g.dogs)} dogs · most popular: {g.popular.slice(0, 3).map((p) => p.name).join(", ")}
                </p>
              </div>
            </div>
            <LiftBars items={g.distinctive.slice(0, 8)} max={maxLift} />
          </article>
        ) : (
          <p className="nm-miss nm-other-miss">
            <strong>Not enough data for {g.group}.</strong>{" "}
            {g.dogs < D.more_min_dogs
              ? `Only ${fmt(g.dogs)} NYC dogs are recorded as ${g.group}s; we need at least ${fmt(D.more_min_dogs)} to tell which names are distinctive rather than chance.`
              : `There are ${fmt(g.dogs)} of them, but too few share the same names (at least 5 dogs each, for 3 names or more) to tell which are distinctive rather than chance.`}
          </p>
        ))}
      {q.trim() && !g && <p className="nm-miss">Pick a breed from the list.</p>}
    </div>
  );
}
// The four listed breeds, in list order (validated as a set on the dark surface), then the rest.
const GUESS_COLORS = ["#2d88e2", "#d35e2c", "#199e6e", "#b75fb8"];
const OTHER_COLOR = "#4a5450";

/** Pie: what share of dogs with this name are each listed breed, and everything else. */
function BreedPie({ name, total, rows }: { name: string; total: number; rows: [number, number, number][] }) {
  const R = 64;
  const slices = [
    ...rows.map(([bi, c], i) => ({ label: D.breeds[bi], n: c, color: GUESS_COLORS[i] })),
    { label: "All other breeds", n: total - d3.sum(rows, (r) => r[1]), color: OTHER_COLOR },
  ];
  const arcs = d3.pie<(typeof slices)[number]>().sort(null).value((d) => d.n)(slices);
  const arc = d3.arc<d3.PieArcDatum<(typeof slices)[number]>>().innerRadius(0).outerRadius(R);
  return (
    <figure className="nm-pie">
      <svg viewBox={`${-R - 2} ${-R - 2} ${2 * R + 4} ${2 * R + 4}`} role="img" aria-label={`Dogs named ${name}: ${slices.map((s) => `${s.label} ${Math.round((s.n / total) * 100)}%`).join(", ")}`}>
        {arcs.map((a) => (
          <path key={a.data.label} d={arc(a)!} fill={a.data.color} stroke="#141a18" strokeWidth={2}>
            <title>{`${a.data.label}: ${fmt(a.data.n)} of ${fmt(total)} (${Math.round((a.data.n / total) * 100)}%)`}</title>
          </path>
        ))}
      </svg>
      <figcaption>
        <i style={{ background: OTHER_COLOR }} /> All other breeds {Math.round((slices[slices.length - 1].n / total) * 100)}%
      </figcaption>
    </figure>
  );
}

function NameDetective() {
  const [q, setQ] = useState("Kuma");
  const key = useMemo(() => {
    const t = q.trim().toLowerCase();
    return NAMES.find((n) => n.toLowerCase() === t) ?? null;
  }, [q]);
  const hit = key ? D.lookup[key] : null;
  return (
    <div className="nm-detective">
      <label className="nm-input">
        <span>Type a dog&rsquo;s name</span>
        <input type="search" list="nm-names" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Kuma, Taco, Bernie" />
        <datalist id="nm-names">
          {NAMES.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </label>
      {hit && key ? (
        <div className="nm-result">
          <p className="nm-rhead">
            <strong>{fmt(hit.n)}</strong> NYC dogs are named <strong>{key}</strong>. Compared with all
            NYC dogs, a {key} is most likely to be a:
          </p>
          <div className="nm-guesswrap">
          <ol className="nm-guess">
            {hit.b.map(([bi, c, lift], i) => (
              <li key={bi}>
                <span className="nm-gname">
                  <i className="nm-gdot" style={{ background: GUESS_COLORS[i] }} aria-hidden />
                  {D.breeds[bi]}
                </span>
                <span className="nm-gmeta">
                  {Math.round((c / hit.n) * 100)}% of {key}s · {lift}× the NYC average
                </span>
              </li>
            ))}
          </ol>
          <BreedPie name={key} total={hit.n} rows={hit.b} />
          </div>
          <p className="side-h">Size of dogs named {key}</p>
          <SizeCompare sizes={D.size_order} counts={hit.s} base={D.base_size} />
        </div>
      ) : (
        <p className="nm-miss">
          {q.trim()
            ? "Not enough NYC dogs have that name (it needs at least 25). Try another, or pick one from the list."
            : "Start typing to see the breeds behind a name."}
        </p>
      )}
    </div>
  );
}

export default function NamesPage() {
  const [tab, setTab] = useState<keyof typeof D.groups>("breed");
  const groups = D.groups[tab];
  const maxLift = useMemo(() => d3.max(groups.flatMap((g) => g.distinctive.slice(0, 8).map((d) => d.lift))) ?? 10, [groups]);
  const t = TABS.find((x) => x.id === tab)!;

  return (
    <>
      <SiteNav />
      <main className="purpose names">
        <header className="pairs-head">
          <p className="eyebrow">What&rsquo;s in a name?</p>
          <h1>{fmt(D.source.used)} New York City dogs and their names</h1>
          <p className="pairs-lede">
            Every dog in New York City needs a license, and the city publishes them. We cleaned up
            the records to see how New Yorkers name their dogs, and which names are most
            characteristic of tiny dogs, giant dogs, sled dogs, or herders.
          </p>
          <p className="nm-top">
            Most popular names:{" "}
            {D.top_names.slice(0, 10).map((n, i) => (
              <span key={n.name}>
                <strong>{n.name}</strong> ({fmt(n.n)}){i < 9 ? ", " : ""}
              </span>
            ))}
          </p>
        </header>

        <section className="pairs-section" aria-labelledby="det-h">
          <h2 id="det-h">Name detective</h2>
          <p>
            Look up any of the {fmt(NAMES.length)} names shared by at least 25 NYC dogs. The
            &ldquo;×&rdquo; numbers compare with the city as a whole: 5× means that breed is five
            times more common among dogs with this name than among all dogs.
          </p>
          <NameDetective />
        </section>

        <section className="pairs-section" aria-labelledby="give-h">
          <h2 id="give-h">Names that give the breed away</h2>
          <p>
            Among names with at least 60 dogs, these are the most tied to a single breed. The
            patterns are easy to read: Japanese names for the Japanese Shiba Inu, cold and wolfish
            names for huskies, Spanish names for Chihuahuas, and puns everywhere.
          </p>
          <ul className="nm-tied">
            {D.tied.slice(0, 18).map((x) => (
              <li key={x.name}>
                {/* Breed photo flush with the card's top-left corner, like the breed cards. */}
                <span className="nm-tphoto">
                  {x.photo ? (
                    <img src={x.photo} alt={x.breed} loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="nm-tnone" aria-hidden>
                      {x.breed.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
                    </span>
                  )}
                </span>
                <span className="nm-ttext">
                  <span className="nm-tname">{x.name}</span>
                  <span className="nm-tbreed">{x.breed}</span>
                  <span className="nm-tmeta">
                    {x.lift}× · {Math.round(x.share * 100)}% of {fmt(x.n)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="pairs-section" aria-labelledby="dist-h">
          <h2 id="dist-h">The most distinctive names, group by group</h2>
          <p>
            Not the most <em>popular</em> names (those are the same everywhere), but the ones a
            group uses far more than everyone else. Bars show how many times more likely the name
            is in that group; the second number is how many dogs have it.
          </p>
          <div className="job-chips" role="tablist" aria-label="Group dogs by">
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={tab === x.id ? "on" : ""} onClick={() => setTab(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <p className="hl-small">{t.blurb}</p>
          <div className="nm-cards">
            {groups.map((g) => (
              <article key={g.group} className={`nm-card${tab === "breed" ? " has-photo" : ""}`}>
                <div className="nm-chead">
                  {tab === "breed" &&
                    (g.photo ? (
                      <span className="nm-photo">
                        <img src={g.photo} alt={g.group} loading="lazy" referrerPolicy="no-referrer" />
                      </span>
                    ) : (
                      <span className="nm-photo nm-nophoto" aria-hidden>
                        {g.group.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
                      </span>
                    ))}
                  <div>
                    <h3>{g.group}</h3>
                    <p className="nm-cmeta">
                      {fmt(g.dogs)} dogs · most popular: {g.popular.slice(0, 3).map((p) => p.name).join(", ")}
                    </p>
                  </div>
                </div>
                <LiftBars items={g.distinctive.slice(0, 8)} max={maxLift} />
              </article>
            ))}
          </div>
          {tab === "breed" && <OtherBreed maxLift={maxLift} />}
        </section>

        <section className="pairs-section" aria-labelledby="see-h">
          <h2 id="see-h">What the names say about ancestry</h2>
          <ul className="hl-reasons nm-takeaways">
            <li>
              <strong>Owners echo a breed&rsquo;s homeland.</strong> Shiba Inus get Japanese names
              (Kuma, Hiro, Yuki, Kenji, Haru), Chihuahuas get Spanish ones (Chico, Chiquita, Papi),
              French bulldogs get French ones (Hugo, Louis, Napoleon), and schnauzers and dachshunds
              get German ones (Fritz, Otto, Heidi).
            </li>
            <li>
              <strong>Size shows up as attitude.</strong> Giant breeds get big, sturdy names (Bernie,
              Hank, Moose, Tank, Diesel). Toy breeds get royal and dainty ones (Princess, Prince,
              Chanel, Minnie, Tiny).
            </li>
            <li>
              <strong>Looks and jobs leave a trace.</strong> White dogs are Snowball, Casper and
              Snowy; huskies and other sled dogs are Balto, Ghost, Lobo and Ice; dachshunds are
              Frankie, Oscar, Pickle and, almost certainly in honor of the Coney Island hot dog
              stand, Nathan.
            </li>
          </ul>
        </section>

        <CityCompare />

        <footer className="pairs-foot">
          <p>
            Data: <a href="https://data.cityofnewyork.us/Health/NYC-Dog-Licensing-Dataset/nu7n-tubp">NYC Dog Licensing Dataset</a>{" "}
            (NYC Department of Health, NYC Open Data), {fmt(D.source.records)} license records from{" "}
            {D.source.years[0]}–{D.source.years[D.source.years.length - 1]}. A renewal creates a new
            record, so dogs were de-duplicated by name, sex, birth year, breed and ZIP code
            ({fmt(D.source.dogs)} dogs). We dropped blank or placeholder names and names that were
            just a breed (&ldquo;Yorkie&rdquo;, &ldquo;Husky&rdquo;), and kept dogs whose breed we
            could match, {fmt(D.source.used)} in all. Mixes count under their main breed. Breeds
            are as reported by owners; sizes are typical adult weights for the breed. Distinctive
            names use a log-odds ratio with an informative Dirichlet prior (Monroe et al. 2008).
          </p>
          <p>
            Toronto:{" "}
            <a href="https://open.toronto.ca/dataset/licensed-dog-and-cat-names/">Licensed Dog and Cat Names</a>{" "}
            (City of Toronto Open Data), dogs only: complete name lists for dogs licensed in
            2012–2019, and the top 200 names for 2020–2025. For those years the lookup divides by
            the city&rsquo;s official count of licensed dogs, from{" "}
            <a href="https://open.toronto.ca/dataset/licensed-dogs-and-cats-reports/">Licensed Dogs and Cats Reports</a>{" "}
            (2020–2022) and{" "}
            <a href="https://open.toronto.ca/dataset/licensed-dogs-and-cats/">Licensed Dogs and Cats</a>{" "}
            (2023–2025). Toronto doesn&rsquo;t publish breeds with names, so only names are
            compared. The head-to-head uses dogs licensed in 2019 in both cities; the name lookup
            uses New York dogs by license issue year, 2015–2025, each year de-duplicated and
            cleaned the same way. Contains information licensed under the Open
            Government Licence – Toronto.
          </p>
        </footer>
      </main>
    </>
  );
}
