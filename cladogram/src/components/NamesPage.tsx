"use client";

import { useMemo, useState } from "react";
import * as d3 from "d3";
import raw from "@/data/nycnames.json";
import { AccuracyChart, LiftBars, SizeCompare } from "./NameCharts";
import { SiteNav } from "./shared";

type Item = { name: string; n: number; lift: number };
type Group = { group: string; dogs: number; distinctive: Item[]; popular: { name: string; n: number }[]; photo?: string | null };
const D = raw as unknown as {
  source: { records: number; dogs: number; named: number; used: number; years: string[] };
  top_names: { name: string; n: number }[];
  size_order: string[];
  base_size: number[];
  breeds: string[];
  groups: Record<"size" | "family" | "job" | "region" | "breed", Group[]>;
  model: { label: string; test_dogs: number; accuracy: number; baseline: number; top3: number; baseline_top3: number; classes: number; balanced: number; chance: number }[];
  tied: { name: string; breed: string; share: number; lift: number; n: number; photo?: string | null }[];
  lookup: Record<string, { n: number; b: [number, number, number][]; s: number[] }>;
};

const fmt = d3.format(",");
const TABS: { id: keyof typeof D.groups; label: string; blurb: string }[] = [
  { id: "breed", label: "Breed", blurb: "The 24 most common breeds in NYC." },
  { id: "size", label: "Size", blurb: "Typical adult weight of each dog's breed." },
  { id: "family", label: "Family group", blurb: "Family groups from this site's family tree. Breeds outside the study use their closest relative's group." },
  { id: "job", label: "Original job", blurb: "What each breed was first bred to do (from the Built for purpose tab)." },
  { id: "region", label: "Region of origin", blurb: "Where each breed was developed (from the Where they came from tab)." },
];
const NAMES = Object.keys(D.lookup).sort();

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
          <ol className="nm-guess">
            {hit.b.map(([bi, c, lift]) => (
              <li key={bi}>
                <span className="nm-gname">{D.breeds[bi]}</span>
                <span className="nm-gmeta">
                  {Math.round((c / hit.n) * 100)}% of {key}s · {lift}× the NYC average
                </span>
              </li>
            ))}
          </ol>
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
  const breedModel = D.model[0];
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
            the records and asked two questions: <strong>can you guess a dog&rsquo;s breed from its
            name?</strong> And which names are most characteristic of tiny dogs, giant dogs, sled
            dogs, or herders?
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

        <section className="pairs-section" aria-labelledby="pred-h">
          <h2 id="pred-h">Can a name predict the breed? Mostly no.</h2>
          <p>
            We trained a model to guess a dog&rsquo;s breed using only its name, from the
            spelling down to fragments like &ldquo;-ki&rdquo; or &ldquo;Chi-&rdquo;, and tested it
            on {fmt(breedModel.test_dogs)} dogs it had never seen. It
            picks the right breed out of the 20 most common{" "}
            <strong>{Math.round(breedModel.accuracy * 100)}% of the time</strong>, compared with{" "}
            {Math.round(breedModel.baseline * 100)}% if you always guessed the most common breed.
            That&rsquo;s about {(breedModel.accuracy / breedModel.baseline).toFixed(1)}× better
            than guessing, but still wrong more than four times in five. For size and original job,
            the name tells you almost nothing.
          </p>
          <AccuracyChart rows={D.model} />
          <p>
            Why so weak? The most popular names, like Bella, Luna, Max and Charlie, are used for
            every kind of dog, and they cover most of the city. The signal lives in rarer names:
            a dog called <strong>Kitsune</strong> or <strong>Hachi</strong> is very likely a Shiba
            Inu, but only a few hundred dogs carry names like that.
          </p>
        </section>

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
            The model is a logistic regression on letter patterns, scored on a held-out 20% of dogs.
          </p>
        </footer>
      </main>
    </>
  );
}
