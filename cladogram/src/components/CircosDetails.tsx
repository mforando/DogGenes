"use client";

import { circosData, links, nodeByCode, partnersOf, type CNode } from "@/lib/circos";
import { photoOf } from "@/lib/photos";
import type { CircosHover } from "./Circos";
import { lineage } from "@/lib/relatives";
import { descendantsOf, stepsApart } from "@/lib/pairs";
import MiniLineage from "./MiniLineage";
import BreedGallery from "./BreedGallery";
import { data } from "@/lib/tree";

const mb = (v: number) => `${(v / 1e6).toFixed(1)} Mb`;
// Country-of-origin populations use the main breed's photos and family-tree entry.
const treeCode = (c: string) => (c === "CHTM" ? "TIBM" : c === "COOS" ? "SALU" : c === "ITCC" ? "CANE" : c);
const photoCode = (c: string) => (c === "CHTM" ? "TIBM" : c === "COOS" ? "SALU" : c === "ITCC" ? "CANE" : c);
const familyLabel = (n: CNode) =>
  n.code === "WOLF" ? "Wild relative" : n.clade ? circosData.clades[n.clade] : "Loner (no clear family)";
const maxValue = Math.max(...links.map((l) => l.value));

function BreedHeader({ n, small = false, gallery = false }: { n: CNode; small?: boolean; gallery?: boolean }) {
  const photo = photoOf(photoCode(n.code));
  return (
    <div className={`cd-breed${small ? " small" : ""}`}>
      {gallery && photo ? (
        <BreedGallery code={photoCode(n.code)} name={n.name} fallback={photo} />
      ) : photo ? (
        <img src={photo} alt={n.name} referrerPolicy="no-referrer" />
      ) : (
        <span className="cd-noimg" style={{ borderColor: n.color }} aria-hidden>
          {n.code}
        </span>
      )}
      <div>
        <p className="cd-name">
          {n.name} <span className="cd-code">{n.code}</span>
        </p>
        <p className="cd-family">
          <i style={{ background: n.color }} aria-hidden />
          {familyLabel(n)}
        </p>
      </div>
    </div>
  );
}

/** The right-hand panel on the full circle chart: details for whatever is hovered. */
export default function CircosDetails({
  hover,
  pinned,
  onClear,
}: {
  hover: CircosHover;
  pinned: string | null;
  onClear?: () => void;
}) {
  const h: CircosHover = hover ?? (pinned ? { kind: "breed", code: pinned } : null);

  if (!h) {
    return (
      <div className="cd-empty">
        <p className="cd-kicker">Details</p>
        <p className="cd-hint">
          Hover over a breed&rsquo;s block to see who it shares DNA with, or over a ribbon to
          see how much two breeds share. <strong>Click</strong> a breed to lock it in place so
          you can scroll through its details; click again to come back here.
        </p>
        <ul className="cd-howto">
          <li><strong>Block</strong>: one breed, in family-tree order.</li>
          <li><strong>Ribbon</strong>: two breeds from different families sharing unusually big chunks of DNA.</li>
          <li><strong>Width</strong>: how much DNA they share.</li>
          <li><strong>Color</strong>: the breed with more connections.</li>
        </ul>
      </div>
    );
  }

  if (h.kind === "ribbon") {
    const l = links.find((x) => x.key === h.key);
    if (!l) return null;
    const a = nodeByCode.get(l.a)!, b = nodeByCode.get(l.b)!;
    return (
      <div className="cd-panel" aria-live="polite">
        <p className="cd-kicker">Ribbon</p>
        <BreedHeader n={a} small />
        <p className="cd-and" aria-hidden>↕</p>
        <BreedHeader n={b} small />
        <div className="cd-stat">
          <span className="cd-big">{mb(l.value)}</span>
          <span>of shared DNA in long identical chunks</span>
          <span className="cd-bar" aria-hidden>
            <span style={{ width: `${(Math.sqrt(l.value / maxValue)) * 100}%` }} />
          </span>
        </div>
        {Number.isFinite(stepsApart(treeCode(l.a), treeCode(l.b))) && (
          <p className="cd-note cd-meet">
            On the family tree they sit <strong>{stepsApart(treeCode(l.a), treeCode(l.b))} branches apart</strong>
            {a.clade && a.clade === b.clade ? "" : ", in different families"}. The gold lines on the
            chart show where their family lines meet. A big DNA overlap despite that distance
            points to a fairly recent cross.
          </p>
        )}
        <p className="cd-note">
          The ribbon takes the color of <strong>{nodeByCode.get(l.hub)!.name}</strong>, the
          breed with more connections.
        </p>
      </div>
    );
  }

  const n = nodeByCode.get(h.code);
  if (!n) return null;
  const ps = partnersOf(n.code);
  return (
    <div className="cd-panel" aria-live="polite">
      {pinned === n.code && !hover ? (
        <div className="cd-locked">
          <p className="cd-kicker">Selected breed · locked</p>
          {onClear && (
            <button type="button" onClick={onClear}>
              ← Back to all breeds
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="cd-kicker">Breed</p>
          <p className="cd-clickhint">Click to lock this breed and scroll its details.</p>
        </>
      )}
      {/* A locked breed gets arrows to page through all of its photos. */}
      <BreedHeader n={n} gallery={pinned === n.code && !hover} />
      {ps.length ? (
        <>
          <p className="cd-sub">
            Shares big chunks of DNA with <strong>{ps.length}</strong> breed{ps.length === 1 ? "" : "s"} from
            other families:
          </p>
          <ol className="cd-list">
            {ps.map((p) => {
              const o = nodeByCode.get(p.code)!;
              return (
                <li key={p.code}>
                  {photoOf(photoCode(p.code)) ? (
                    <img className="cd-thumb" src={photoOf(photoCode(p.code))} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="cd-thumb cd-thumb-none" style={{ borderColor: o.color }} aria-hidden />
                  )}
                  <span className="cd-pname">
                    <span>{o.name}</span>
                    <span className="cd-pfam">
                      <i style={{ background: o.color }} aria-hidden />
                      {familyLabel(o)}
                    </span>
                  </span>
                  <span className="cd-bar" aria-hidden>
                    <span style={{ width: `${Math.sqrt(p.value / maxValue) * 100}%` }} />
                  </span>
                  <span className="cd-mb">{mb(p.value)}</span>
                </li>
              );
            })}
          </ol>
        </>
      ) : (
        <p className="cd-sub">
          No big DNA overlap with breeds from other families. It has kept to itself.
        </p>
      )}
      {n.code !== "WOLF" && data.breeds[treeCode(n.code)] && (
        <div className="cd-tree">
          <p className="cd-tree-h">Family line back to the grey wolf</p>
          <p className="cd-treenote">
            <span className="cd-swatch" aria-hidden />
            <span>
              On the chart, the <strong>gold</strong> line traces this breed&rsquo;s path,{" "}
              {lineage(treeCode(n.code)).length} forks back to where dogs split from grey wolves.
              The rest of the tree is hidden, leaving only the branches out to the relatives
              that split off along the way.
            </span>
          </p>
          <MiniLineage code={treeCode(n.code)} exclude={descendantsOf(treeCode(n.code))} />
          {descendantsOf(treeCode(n.code)).length > 0 && (
            <p className="cd-excluded">
              Left out: breeds developed from the {n.name} (
              {descendantsOf(treeCode(n.code)).map((c) => data.breeds[c]?.name ?? c).join(", ")}).
              They&rsquo;re its descendants, not part of its line back to the wolf.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
