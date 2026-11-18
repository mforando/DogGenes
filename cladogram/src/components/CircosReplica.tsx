"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CircosHover, CircosView } from "./Circos";
import CircosDetails from "./CircosDetails";
import LineageTree from "./LineageTree";
import Modal from "./Modal";
import BreedPairs from "./BreedPairs";
import { circosData, cladeArcs, links, nodeByCode, nodes } from "@/lib/circos";
import { Term } from "./Hints";
import { Lv } from "@/lib/readingLevel";

/**
 * The full interactive circle chart (a recreation of Parker et al. 2017, Figure 4), as the last
 * step of the Family Tree scroller: the story's own chord chart takes this view, the step card
 * holds the key and controls (ReplicaKey), and the side panel the details (ReplicaDetails).
 */

const withRibbons = nodes.filter((n) => n.degree > 0).length;

/** Legend entries: the wolf, each family group in ring order, then the loners. */
const GROUPS: { key: string; label: string; color: string; codes: string[] }[] = [
  { key: "_wild", label: "Wild relative (wolf)", color: nodeByCode.get("WOLF")!.cssColor, codes: ["WOLF"] },
  ...cladeArcs.map((c) => ({
    key: c.clade,
    label: circosData.clades[c.clade],
    color: nodes.find((n) => n.clade === c.clade)!.cssColor,
    codes: nodes.filter((n) => n.clade === c.clade).map((n) => n.code),
  })),
  {
    key: "_loners",
    label: "Loners (no clear family)",
    color: nodeByCode.get("EURA")!.cssColor,
    codes: nodes.filter((n) => !n.clade && n.code !== "WOLF").map((n) => n.code),
  },
];
const options = [...nodes].sort((a, b) => a.name.localeCompare(b.name));

/** The full chart's state: the chosen breed, the toggles, the legend and what's hovered. */
export function useReplica() {
  const [pick, setPick] = useState<string | null>(null);
  const [names, setNames] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [hover, setHover] = useState<CircosHover>(null);
  // The selected breed's family tree, in a pop-up.
  const [treeFor, setTreeFor] = useState<string | null>(null);
  // Family-group legend: hover previews a group, click locks it.
  const [groupHover, setGroupHover] = useState<string | null>(null);
  const [groupLock, setGroupLock] = useState<string | null>(null);
  // Hovering a family's band on the chart previews that family, like the legend.
  const bandHover = hover?.kind === "clade" ? hover.clade : null;
  const group = GROUPS.find((g) => g.key === (groupHover ?? bandHover ?? groupLock)) ?? null;

  const view = useMemo<CircosView>(
    () =>
      pick
        ? { ribbons: { codes: [pick] }, focus: [pick, ...links.filter((l) => l.a === pick || l.b === pick).map((l) => (l.a === pick ? l.b : l.a))], cladeRing: names, tree: showTree, treePath: pick, frozen: true }
        : group
          ? { ribbons: { codes: group.codes }, focus: group.codes, cladeRing: names, tree: showTree }
          : { ribbons: "all", cladeRing: names, interactive: true, tree: showTree },
    [pick, names, showTree, group],
  );

  // First click locks onto a breed; a second click returns to the default view.
  const onBreedClick = useCallback((code: string) => {
    setHover(null);
    setGroupLock(null);
    setPick((p) => (p ? null : code));
  }, []);
  const onBackgroundClick = useCallback(() => {
    setHover(null);
    setPick(null);
    setGroupLock(null);
  }, []);
  const onPick = useCallback((code: string) => {
    if (!nodeByCode.has(code)) return;
    setHover(null);
    setGroupLock(null);
    setPick(code);
  }, []);
  // Clicking a family's band locks it, like its legend entry, and keeps its panel open.
  const onCladeClick = useCallback((clade: string) => {
    setHover(null);
    setPick(null);
    setGroupLock((k) => (k === clade ? null : clade));
  }, []);
  /** A locked family (band or legend), whose panel shows while nothing else is hovered. */
  const lockedClade = groupLock && circosData.clades[groupLock] ? groupLock : null;
  /** Leaving the step drops anything hovered; the chosen breed and toggles stay. */
  const clearHover = useCallback(() => {
    setHover(null);
    setGroupHover(null);
  }, []);

  return {
    pick, setPick, names, setNames, showTree, setShowTree, hover, setHover, treeFor, setTreeFor,
    groupHover, setGroupHover, groupLock, setGroupLock, group, view, onBreedClick, onBackgroundClick, onCladeClick, lockedClade, onPick, clearHover,
  };
}
export type Replica = ReturnType<typeof useReplica>;

/** The step card: caption, the study's own caption, counts, controls and the family legend. */
export function ReplicaKey({ r, details = false }: { r: Replica; details?: boolean }) {
  const { pick, setPick, names, setNames, showTree, setShowTree, groupHover, setGroupHover, groupLock, setGroupLock, group } = r;
  return (
    <div className="replica-side">
      <p className="replica-caption">
        <Lv
          puppy={<><strong>What it shows:</strong> each colored block is a breed, in the same order as the family tree. A ribbon joins two breeds from different families that share a lot of <Term id="dna">DNA</Term>. That means people mixed them together in the last 200 years or so. Wider ribbons mean more shared DNA.</>}
          pro={<><strong>Reading the figure:</strong> segments are breeds in phylogenetic order, colored by clade. Ribbons join cross-clade breed pairs whose median pairwise <Term id="haplotype">IBD sharing</Term> exceeds the 95th percentile of all cross-clade sharing, i.e. evidence of recent admixture; ribbon width scales with shared length.</>}
        >
          <strong>In plain English:</strong> each block is a breed, in family-tree order.
          Ribbons join breeds from different families that share unusually long stretches
          of <Term id="dna">DNA</Term>, a sign of crossing in the last two centuries. Wider ribbons mean more
          sharing.
        </Lv>
      </p>
      <p className="replica-orig">
        Original title and caption: &ldquo;<Term id="haplotype">Haplotype</Term> sharing between breeds from different phylogenetic <Term id="clade">clades</Term>. The circos plot is ordered and colored to match the
        tree in Figure&nbsp;1. Ribbons connecting breeds indicate a median haplotype
        sharing between all dogs of each breed in excess of 95% of all haplotype
        sharing across clades.&rdquo;
      </p>
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
              {n.name} · {n.degree} ribbon{n.degree === 1 ? "" : "s"}
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

      {/* Narrower screens: no room for a side panel, so the details sit here. */}
      {details && (
        <section className="replica-details" aria-label="Details for the hovered breed or ribbon">
          <ReplicaDetails r={r} />
        </section>
      )}

      <h3 className="side-h">Family groups, counter-clockwise from the wolf · hover or click</h3>
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
    </div>
  );
}

/** Details for whatever is hovered or locked on the chart. */
export function ReplicaDetails({ r }: { r: Replica }) {
  return (
    <CircosDetails
      hover={r.pick ? null : r.hover ?? (r.lockedClade ? { kind: "clade", clade: r.lockedClade } : null)}
      pinned={r.pick}
      onClear={() => r.setPick(null)}
      onPick={r.onPick}
      onShowTree={r.setTreeFor}
    />
  );
}

/** Under the scroller: the family-tree pop-up and the expandable list of breed pairs. */
export function ReplicaExtras({ r }: { r: Replica }) {
  // Links to /tree/#breed-pairs (including the old Breed pairs tab) open the list.
  const pairsRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (window.location.hash !== "#breed-pairs" || !pairsRef.current) return;
    pairsRef.current.open = true;
    pairsRef.current.scrollIntoView();
  }, []);
  return (
    <section className="replica embedded" aria-label="Breed pairs">
      {r.treeFor && (
        <Modal label="Family tree" onClose={() => r.setTreeFor(null)}>
          <LineageTree code={r.treeFor} onSelect={r.setTreeFor} />
        </Modal>
      )}
      {/* A link to something inside makes the browser open this before React loads; that's fine. */}
      <details id="breed-pairs" className="ribbon-table" ref={pairsRef} suppressHydrationWarning>
        <summary>Which breeds share the most DNA? See the breed pairs</summary>
        <BreedPairs />
      </details>
    </section>
  );
}
