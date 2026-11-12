"use client";

import { circosData, links, nodeByCode, nodes, partnersOf, type CNode } from "@/lib/circos";
import { photoOf } from "@/lib/photos";
import type { CircosHover } from "./Circos";
import { stepsApart } from "@/lib/pairs";
import BreedGallery from "./BreedGallery";
import RelatedBreeds from "./RelatedBreeds";
import CladeTree from "./CladeTree";
import { data } from "@/lib/tree";
import { Term } from "./Hints";

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
          {n.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("")}
        </span>
      )}
      <div>
        <p className="cd-name">
          {n.name}
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
  onPick,
  onShowTree,
}: {
  hover: CircosHover;
  pinned: string | null;
  onClear?: () => void;
  /** Lock onto another breed (from the related-breeds lists). */
  onPick?: (code: string) => void;
  /** Open the breed's family tree (study code). */
  onShowTree?: (code: string) => void;
}) {
  const h: CircosHover = hover ?? (pinned ? { kind: "breed", code: pinned } : null);

  if (!h) {
    return (
      <div className="cd-empty">
        <p className="cd-kicker">Details</p>
        <p className="cd-hint">
          Hover over a breed&rsquo;s block to see who it shares <Term id="dna">DNA</Term> with, or over a ribbon to
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

  if (h.kind === "clade") return <CladePanel clade={h.clade} />;

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
            chart show where their family lines meet. A big <Term id="dna">DNA</Term> overlap despite that distance
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
            Shares big chunks of <Term id="dna">DNA</Term> with <strong>{ps.length}</strong> breed{ps.length === 1 ? "" : "s"} from
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
      {data.breeds[treeCode(n.code)] && n.code !== "WOLF" && (
        <>
          {onShowTree && (
            <button type="button" className="cd-treebtn" onClick={() => onShowTree(treeCode(n.code))}>
              See the {n.name}&rsquo;s family tree →
            </button>
          )}
          <RelatedBreeds code={treeCode(n.code)} onSelect={(c) => onPick?.(c)} />
        </>
      )}
    </div>
  );
}

const otherLabel = (code: string) => {
  const n = nodeByCode.get(code)!;
  return n.code === "WOLF" ? "Wild relative" : n.clade ? circosData.clades[n.clade] : "Loners";
};

/** Hovering a family's band: its tree, and how much DNA it shares with each other family. */
function CladePanel({ clade }: { clade: string }) {
  const members = nodes.filter((n) => n.clade === clade);
  const color = members[0]?.color ?? "#888";
  const codes = new Set(members.map((n) => n.code));
  const out = links.filter((l) => codes.has(l.a) !== codes.has(l.b));
  const byOther = new Map<string, { label: string; color: string; value: number; ribbons: number }>();
  for (const l of out) {
    const other = codes.has(l.a) ? l.b : l.a;
    const key = otherLabel(other);
    const o = nodeByCode.get(other)!;
    const e = byOther.get(key) ?? { label: key, color: o.clade || o.code === "WOLF" ? o.color : "#7d847e", value: 0, ribbons: 0 };
    e.value += l.value;
    e.ribbons += 1;
    byOther.set(key, e);
  }
  const rows = [...byOther.values()].sort((a, b) => b.value - a.value);
  const max = rows[0]?.value ?? 1;
  return (
    <div className="cd-panel" aria-live="polite">
      <p className="cd-kicker">Family group</p>
      <p className="cd-name cd-clade-name">
        <i style={{ background: color }} aria-hidden /> {circosData.clades[clade]}
      </p>
      <p className="cd-sub">
        {members.length} breed{members.length === 1 ? "" : "s"}, {out.length} ribbon{out.length === 1 ? "" : "s"} to other families.
      </p>
      <p className="cd-tree-h">Its family tree</p>
      <CladeTree clade={clade} />
      <p className="cd-tree-h">Shares <Term id="dna">DNA</Term> with these families</p>
      {rows.length ? (
        <ol className="cd-list cd-clade-list">
          {rows.map((r) => (
            <li key={r.label}>
              <span className="cd-pname">
                <span>
                  <i className="cd-dot" style={{ background: r.color }} aria-hidden /> {r.label}
                </span>
                <span className="cd-pfam">
                  {r.ribbons} ribbon{r.ribbons === 1 ? "" : "s"}
                </span>
              </span>
              <span className="cd-bar" aria-hidden>
                <span style={{ width: `${Math.sqrt(r.value / max) * 100}%` }} />
              </span>
              <span className="cd-mb">{mb(r.value)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="cd-sub">No big DNA overlaps with other families.</p>
      )}
      <p className="cd-note">Totals add up every ribbon between this family&rsquo;s breeds and each other family.</p>
    </div>
  );
}
