"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";
import raw from "@/data/nycnames.json";
import { LiftBars, SizeCompare } from "./NameCharts";
import { SiteNav } from "./shared";
import CityCompare from "./CityCompare";
import { B } from "./Hints";
import { factsText } from "@/lib/breedFacts";
import { Lv, useReadingLevel } from "@/lib/readingLevel";

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
const TABS: { id: keyof typeof D.groups; label: string; blurb: string; puppy: string; pro: string }[] = [
  { id: "breed", label: "Breed", blurb: "The 24 most common breeds in NYC.", puppy: "The 24 breeds New Yorkers have the most of.", pro: "The 24 most frequent breeds among licensed NYC dogs." },
  { id: "size", label: "Size", blurb: "Typical adult weight of each dog's breed.", puppy: "How heavy a grown-up dog of each breed usually is.", pro: "Breed-typical adult body mass class." },
  { id: "family", label: "Family group", blurb: "Family groups from this site's family tree. Breeds outside the study use their closest relative's group.", puppy: "The dog families from this site’s family tree. Breeds that weren’t in the study join their closest cousin’s family.", pro: "Clades from the Parker et al. phylogeny; unsampled breeds are assigned their nearest relative’s clade." },
  { id: "job", label: "Original job", blurb: "What each breed was first bred to do (from the Bred for purpose tab).", puppy: "The first job each breed was made to do (from the Bred for purpose page).", pro: "Original breed function (as on the Bred for purpose tab)." },
  { id: "region", label: "Region of origin", blurb: "Where each breed was developed (from the breed origins globe on the Family tree tab).", puppy: "Where in the world each breed comes from (from the globe on the Family tree page).", pro: "Region of breed development (as on the origins globe of the Family tree tab)." },
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
        <Lv
          puppy={<>Any of the {MORE.length} other breeds. {analyzed} have enough dogs to check. These groups are smaller, so the results are rougher.</>}
          pro={<>Any of the {MORE.length} remaining breeds; {analyzed} meet the minimum sample. For these smaller groups a name needs only 5 dogs of the breed (vs 12), so estimates are noisier.</>}
        >
          Any of the {MORE.length} other breeds in the data. {analyzed} have enough dogs to analyze; these are
          smaller groups, so a name only needs 5 dogs of the breed to count (instead of 12), and results are rougher.
        </Lv>
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
            <title>
              {[`${a.data.label}: ${fmt(a.data.n)} of ${fmt(total)} (${Math.round((a.data.n / total) * 100)}%)`, factsText(null, null, a.data.label)]
                .filter(Boolean)
                .join("\n\n")}
            </title>
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
  const { level } = useReadingLevel();
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
            <Lv
              puppy="Every dog in New York City needs a license, and the city shares the list with everyone. We tidied it up to see what New Yorkers name their dogs, and which names go best with tiny dogs, giant dogs, sled dogs and herding dogs."
              pro="New York City publishes its dog-license records. After de-duplication and cleaning, we model naming patterns across the licensed population and identify the names most over-represented in each breed, size, clade, functional and regional group."
            >
              Every dog in New York City needs a license, and the city publishes them. We cleaned up
              the records to see how New Yorkers name their dogs, and which names are most
              characteristic of tiny dogs, giant dogs, sled dogs, or herders.
            </Lv>
          </p>
          <p className="nm-top">
            <Lv puppy="Top names:" pro="Most frequent names:">Most popular names:</Lv>{" "}
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
            <Lv
              puppy={<>Type any of the {fmt(NAMES.length)} names that at least 25 New York dogs share. The &ldquo;×&rdquo; numbers compare with all the dogs in the city: 5× means that breed shows up five times more often among dogs with that name.</>}
              pro={<>Query any of the {fmt(NAMES.length)} names borne by ≥25 NYC dogs. &ldquo;×&rdquo; is the lift: a breed&rsquo;s share among dogs with the name divided by its share in the whole licensed population (5× = five-fold over-representation).</>}
            >
              Look up any of the {fmt(NAMES.length)} names shared by at least 25 NYC dogs. The
              &ldquo;×&rdquo; numbers compare with the city as a whole: 5× means that breed is five
              times more common among dogs with this name than among all dogs.
            </Lv>
          </p>
          <NameDetective />
        </section>

        <section className="pairs-section" aria-labelledby="give-h">
          <h2 id="give-h">Names that give the breed away</h2>
          <p>
            <Lv
              puppy={<>Some names almost always belong to one breed. Japanese names go with the Japanese <B c="SHIB">Shiba Inu</B>, chilly wolf names go with <B c="HUSK">huskies</B>, Spanish names go with <B c="CHIH">Chihuahuas</B>, and there are funny puns everywhere.</>}
              pro={<>Among names with ≥60 dogs, those with the highest single-breed lift. The associations are interpretable: Japanese names for the <B c="SHIB">Shiba Inu</B>, cold-climate and lupine names for <B c="HUSK">huskies</B>, Hispanic names for <B c="CHIH">Chihuahuas</B>, and breed puns throughout.</>}
            >
            Among names with at least 60 dogs, these are the most tied to a single breed. The
            patterns are easy to read: Japanese names for the Japanese <B c="SHIB">Shiba Inu</B>, cold and wolfish
            names for <B c="HUSK">huskies</B>, Spanish names for <B c="CHIH">Chihuahuas</B>, and puns everywhere.
            </Lv>
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
            <Lv
              puppy={<>Not the most <em>popular</em> names (those are the same everywhere), but the names one group uses way more than everybody else. The bars show how many times more likely the name is in that group. The second number is how many dogs have it.</>}
              pro={<>Not the most <em>frequent</em> names, which are shared across groups, but the most <em>distinctive</em>: weighted log-odds with an informative Dirichlet prior (Monroe et al. 2008), shown as lift; the second number is the name&rsquo;s count in the group.</>}
            >
              Not the most <em>popular</em> names (those are the same everywhere), but the ones a
              group uses far more than everyone else. Bars show how many times more likely the name
              is in that group; the second number is how many dogs have it.
            </Lv>
          </p>
          <div className="job-chips" role="tablist" aria-label="Group dogs by">
            {TABS.map((x) => (
              <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} className={tab === x.id ? "on" : ""} onClick={() => setTab(x.id)}>
                {x.label}
              </button>
            ))}
          </div>
          <p className="hl-small">{level === "puppy" ? t.puppy : level === "pro" ? t.pro : t.blurb}</p>
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
              <Lv
                puppy={<><strong>Owners pick names from the breed&rsquo;s home country.</strong> <B c="SHIB">Shiba Inus</B> get Japanese names (Kuma, Hiro, Yuki), <B c="CHIH">Chihuahuas</B> get Spanish ones (Chico, Chiquita, Papi), <B c="FBUL">French bulldogs</B> get French ones (Hugo, Louis, Napoleon), and <B c="DACH">dachshunds</B> get German ones (Fritz, Otto, Heidi).</>}
                pro={<><strong>Names track a breed&rsquo;s nation of origin.</strong> <B c="SHIB">Shiba Inus</B> are disproportionately given Japanese names (Kuma, Hiro, Yuki, Kenji, Haru), <B c="CHIH">Chihuahuas</B> Spanish (Chico, Chiquita, Papi), <B c="FBUL">French bulldogs</B> French (Hugo, Louis, Napoleon), and schnauzers and <B c="DACH">dachshunds</B> German (Fritz, Otto, Heidi).</>}
              >
              <strong>Owners echo a breed&rsquo;s homeland.</strong> <B c="SHIB">Shiba Inus</B> get Japanese names
              (Kuma, Hiro, Yuki, Kenji, Haru), <B c="CHIH">Chihuahuas</B> get Spanish ones (Chico, Chiquita, Papi),{" "}
              <B c="FBUL">French bulldogs</B> get French ones (Hugo, Louis, Napoleon), and schnauzers and <B c="DACH">dachshunds</B>{" "}
              get German ones (Fritz, Otto, Heidi).
              </Lv>
            </li>
            <li>
              <Lv
                puppy={<><strong>Big dogs get big names.</strong> Giant breeds get tough names like Bernie, Moose and Tank. Tiny breeds get fancy, cute ones like Princess, Prince and Tiny.</>}
                pro={<><strong>Body size maps onto name semantics.</strong> Giant breeds are over-represented for large, sturdy names (Bernie, Hank, Moose, Tank, Diesel); toy breeds for regal and diminutive ones (Princess, Prince, Chanel, Minnie, Tiny).</>}
              >
              <strong>Size shows up as attitude.</strong> Giant breeds get big, sturdy names (Bernie,
              Hank, Moose, Tank, Diesel). Toy breeds get royal and dainty ones (Princess, Prince,
              Chanel, Minnie, Tiny).
              </Lv>
            </li>
            <li>
              <Lv
                puppy={<><strong>How a dog looks matters too.</strong> White dogs are named Snowball, Casper and Snowy. <B c="HUSK">Huskies</B> and other sled dogs are Balto, Ghost and Ice. And <B c="DACH">dachshunds</B>, the &ldquo;hot dog&rdquo; dogs, are often Frankie, Oscar, Pickle and Nathan, like the famous hot dog stand!</>}
                pro={<><strong>Coat color and function are also encoded.</strong> White dogs: Snowball, Casper, Snowy; <B c="HUSK">huskies</B> and other sled breeds: Balto, Ghost, Lobo, Ice; <B c="DACH">dachshunds</B>: Frankie, Oscar, Pickle and, almost certainly after the Coney Island frankfurter stand, Nathan.</>}
              >
              <strong>Looks and jobs leave a trace.</strong> White dogs are Snowball, Casper and
              Snowy; <B c="HUSK">huskies</B> and other sled dogs are Balto, Ghost, Lobo and Ice; <B c="DACH">dachshunds</B> are
              Frankie, Oscar, Pickle and, almost certainly in honor of the Coney Island hot dog
              stand, Nathan.
              </Lv>
            </li>
          </ul>
        </section>

        <CityCompare />

        <footer className="pairs-foot">
          {level === "puppy" && (
            <p>
              Where this comes from: New York City&rsquo;s list of licensed dogs, and Toronto&rsquo;s
              list of dog names. We removed repeats, blank names, and dogs named just after their
              breed. The details are below.
            </p>
          )}
          <p>
            Data: <a href="https://data.cityofnewyork.us/Health/NYC-Dog-Licensing-Dataset/nu7n-tubp">NYC Dog Licensing Dataset</a>{" "}
            (NYC Department of Health, NYC Open Data), {fmt(D.source.records)} license records from{" "}
            {D.source.years[0]}–{D.source.years[D.source.years.length - 1]}. A renewal creates a new
            record, so dogs were de-duplicated by name, sex, birth year, breed and ZIP code
            ({fmt(D.source.dogs)} dogs). We dropped blank or placeholder names and names that were
            just a breed (&ldquo;Yorkie&rdquo;, &ldquo;<B c="HUSK">Husky</B>&rdquo;), and kept dogs whose breed we
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
