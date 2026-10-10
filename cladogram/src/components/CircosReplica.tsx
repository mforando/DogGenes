"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Circos, { type CircosHover, type CircosView } from "./Circos";
import CircosDetails from "./CircosDetails";
import { SiteNav } from "./shared";
import { circosData, cladeArcs, links, nodeByCode, nodes } from "@/lib/circos";

const withRibbons = nodes.filter((n) => n.degree > 0).length;

/** Legend entries: the wolf, each family group in ring order, then the loners. */
const GROUPS: { key: string; label: string; color: string; codes: string[] }[] = [
  { key: "_wild", label: "Wild relative (wolf)", color: nodeByCode.get("WOLF")!.color, codes: ["WOLF"] },
  ...cladeArcs.map((c) => ({
    key: c.clade,
    label: circosData.clades[c.clade],
    color: nodes.find((n) => n.clade === c.clade)!.color,
    codes: nodes.filter((n) => n.clade === c.clade).map((n) => n.code),
  })),
  {
    key: "_loners",
    label: "Loners (no clear family)",
    color: nodeByCode.get("EURA")!.color,
    codes: nodes.filter((n) => !n.clade && n.code !== "WOLF").map((n) => n.code),
  },
];
const options = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

/** The full interactive circle chart. `embedded` renders it as the last section of the home page. */
export default function CircosReplica({ embedded = false }: { embedded?: boolean }) {
  const [pick, setPick] = useState<string | null>(null);
  const [names, setNames] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [sortBy, setSortBy] = useState<"value" | "pair">("value");
  const [hover, setHover] = useState<CircosHover>(null);
  // Family-group legend: hover previews a group, click locks it.
  const [groupHover, setGroupHover] = useState<string | null>(null);
  const [groupLock, setGroupLock] = useState<string | null>(null);
  const group = GROUPS.find((g) => g.key === (groupHover ?? groupLock)) ?? null;

  const view = useMemo<CircosView>(
    () =>
      pick
        ? { ribbons: { codes: [pick] }, focus: [pick, ...links.filter((l) => l.a === pick || l.b === pick).map((l) => (l.a === pick ? l.b : l.a))], cladeRing: names, tree: showTree, treePath: pick, frozen: true }
        : group
          ? { ribbons: { codes: group.codes }, focus: group.codes, cladeRing: names, tree: showTree }
          : { ribbons: "all", cladeRing: names, interactive: true, tree: showTree },
    [pick, names, showTree, group],
  );

  const rows = useMemo(() => {
    const r = links.map((l) => ({ ...l, an: nodeByCode.get(l.a)!.name, bn: nodeByCode.get(l.b)!.name }));
    return sortBy === "value" ? r.sort((x, y) => y.value - x.value) : r.sort((x, y) => x.an.localeCompare(y.an));
  }, [sortBy]);

  return (
    <>
      {!embedded && <SiteNav />}
      <Wrapper embedded={embedded}>

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
                {embedded ? <a href="#c-blocks">Back to the walkthrough ↑</a> : <Link href="/#c-blocks">Walk me through it →</Link>}
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
                <option value="">All breeds (hover, or click one to lock it)</option>
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
              <label className="check">
                <input type="checkbox" checked={showTree} onChange={(e) => setShowTree(e.target.checked)} /> Show the
                family tree inside the circle
              </label>
            </div>

            <h2 className="side-h">Family groups, counter-clockwise from the wolf · hover or click</h2>
            <ul className="clade-key" aria-label="Family groups: hover to preview on the chart, click to lock">
              {GROUPS.map((g) => {
                const on = (groupHover ?? groupLock) === g.key;
                const links_ = links.filter((l) => g.codes.includes(l.a) || g.codes.includes(l.b)).length;
                return (
                  <li key={g.key}>
                    <button
                      type="button"
                      className={`${on ? "on" : ""}${groupLock === g.key ? " locked" : ""}`}
                      aria-pressed={groupLock === g.key}
                      title={`${g.codes.length} breed${g.codes.length === 1 ? "" : "s"} · ${links_} ribbon${links_ === 1 ? "" : "s"}`}
                      onPointerEnter={() => setGroupHover(g.key)}
                      onPointerLeave={() => setGroupHover(null)}
                      onFocus={() => setGroupHover(g.key)}
                      onBlur={() => setGroupHover(null)}
                      onClick={() => {
                        setPick(null);
                        setGroupLock((k) => (k === g.key ? null : g.key));
                      }}
                    >
                      <i style={{ background: g.color }} />
                      {g.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            {group && (
              <p className="clade-key-note">
                <strong>{group.label}</strong>: {group.codes.length} breed{group.codes.length === 1 ? "" : "s"},{" "}
                {links.filter((l) => group.codes.includes(l.a) || group.codes.includes(l.b)).length} ribbons to other
                families.{groupLock && !groupHover ? " Click it again to unlock." : groupHover && groupLock !== groupHover ? " Click to lock." : ""}
              </p>
            )}
          </aside>
          <div className="replica-figure">
            <Circos
              view={view}
              onHover={setHover}
              // First click locks onto a breed; a second click returns to the default view.
              onBreedClick={(code) => {
                setHover(null);
                setGroupLock(null);
                setPick((p) => (p ? null : code));
              }}
              onBackgroundClick={() => {
                setHover(null);
                setPick(null);
                setGroupLock(null);
              }}
              ariaLabel="Replica of Figure 4: circos plot of cross-clade haplotype sharing among 168 dog breed populations."
            />
          </div>
          <aside className="replica-details" aria-label="Details for the hovered breed or ribbon">
            <CircosDetails hover={pick ? null : hover} pinned={pick} onClear={() => setPick(null)} />
          </aside>
        </div>


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
      </Wrapper>
    </>
  );
}

function Wrapper({ embedded, children }: { embedded: boolean; children: React.ReactNode }) {
  return embedded ? (
    <section id="full-chart" className="replica embedded" aria-label="The full interactive circle chart">
      {children}
    </section>
  ) : (
    <main className="replica">{children}</main>
  );
}
