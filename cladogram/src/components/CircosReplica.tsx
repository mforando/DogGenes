"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Circos, { type CircosView } from "./Circos";
import { SiteNav } from "./shared";
import Primer from "./Primer";
import { circosData, cladeArcs, links, nodeByCode, nodes } from "@/lib/circos";

const withRibbons = nodes.filter((n) => n.degree > 0).length;
const options = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

export default function CircosReplica() {
  const [pick, setPick] = useState<string | null>(null);
  const [names, setNames] = useState(true);
  const [sortBy, setSortBy] = useState<"value" | "pair">("value");

  const view = useMemo<CircosView>(
    () =>
      pick
        ? { ribbons: { codes: [pick] }, focus: [pick, ...links.filter((l) => l.a === pick || l.b === pick).map((l) => (l.a === pick ? l.b : l.a))], cladeRing: names }
        : { ribbons: "all", cladeRing: names, interactive: true },
    [pick, names],
  );

  const rows = useMemo(() => {
    const r = links.map((l) => ({ ...l, an: nodeByCode.get(l.a)!.name, bn: nodeByCode.get(l.b)!.name }));
    return sortBy === "value" ? r.sort((x, y) => y.value - x.value) : r.sort((x, y) => x.an.localeCompare(y.an));
  }, [sortBy]);

  return (
    <>
      <SiteNav />
      <main className="replica">

        <div className="replica-body">
          <aside className="replica-side" aria-label="Figure key and controls">
            <header className="replica-head">
              <p className="eyebrow">Recreated from Parker et al. 2017, Figure 4</p>
              <h1>Which dog breeds have been mixed together?</h1>
              <p className="replica-caption">
                <strong>In plain English:</strong> each colored block is a breed, arranged in
                the same order as the family tree. A ribbon connects two breeds from different
                family groups that share an unusually big amount of DNA, a sign that they were
                crossed in the last couple of centuries. Wider ribbons mean more shared DNA.{" "}
                <Link href="/circos/guide">Walk me through it →</Link>
              </p>
              <p className="replica-orig">
                Original title and caption: &ldquo;Haplotype sharing between breeds from different phylogenetic clades. The circos plot is ordered and colored to match the
                tree in Figure&nbsp;1. Ribbons connecting breeds indicate a median haplotype
                sharing between all dogs of each breed in excess of 95% of all haplotype
                sharing across clades.&rdquo;
              </p>
            </header>
            <dl className="stats">
              <div><dt>Breeds</dt><dd>{nodes.length}</dd></div>
              <div><dt>Ribbons</dt><dd>{links.length}</dd></div>
              <div><dt>Breeds with a ribbon</dt><dd>{withRibbons}</dd></div>
            </dl>

            <div className="control">
              <label htmlFor="circos-pick">Show one breed</label>
              <select id="circos-pick" value={pick ?? ""} onChange={(e) => setPick(e.target.value || null)}>
                <option value="">All breeds (or hover over one)</option>
                {options.map((n) => (
                  <option key={n.code} value={n.code}>
                    {n.name} ({n.code}) · {n.degree} ribbon{n.degree === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
              <label className="check">
                <input type="checkbox" checked={names} onChange={(e) => setNames(e.target.checked)} /> Show clade
                names
              </label>
            </div>

            <h2 className="side-h">Family groups, counter-clockwise from the wolf</h2>
            <ul className="clade-key">
              <li>
                <i style={{ background: nodeByCode.get("WOLF")!.color }} />
                Wild relative (wolf)
              </li>
              {cladeArcs.map((c) => (
                <li key={c.clade}>
                  <i style={{ background: nodes.find((n) => n.clade === c.clade)!.color }} />
                  {circosData.clades[c.clade]}
                </li>
              ))}
              <li>
                <i style={{ background: nodeByCode.get("EURA")!.color }} />
                Loners (no clear family)
              </li>
            </ul>
          </aside>
          <div className="replica-figure">
            <Circos view={view} ariaLabel="Replica of Figure 4: circos plot of cross-clade haplotype sharing among 168 dog breed populations." />
          </div>
        </div>

        <details className="replica-primer">
          <summary>New to this? Quick glossary</summary>
          <Primer terms={["dna", "haplotype", "clade", "cladogram"]} title="Key words, in plain English" compact />
        </details>

        <details className="ribbon-table">
          <summary>See all {links.length} ribbons as a list</summary>
          <div className="table-tools">
            Sort by{" "}
            <button type="button" aria-pressed={sortBy === "value"} onClick={() => setSortBy("value")}>
              shared length
            </button>
            <button type="button" aria-pressed={sortBy === "pair"} onClick={() => setSortBy("pair")}>
              breed name
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th scope="col">Breed</th>
                <th scope="col">Breed</th>
                <th scope="col" className="num">Shared DNA (Mb)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  <td><i style={{ background: nodeByCode.get(r.a)!.color }} />{r.an}</td>
                  <td><i style={{ background: nodeByCode.get(r.b)!.color }} />{r.bn}</td>
                  <td className="num">{(r.value / 1e6).toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </main>
    </>
  );
}
