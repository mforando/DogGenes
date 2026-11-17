import { data } from "./tree";
import { nodeByCode, partnersOf as circosPartners } from "./circos";
import { cladeColor } from "./palette";

/**
 * Which families (clades) the ring of family bands around the Family Tree's circles should
 * bring forward. A step brings forward the families its text highlights; hovering a breed
 * brings forward its own family and every family it shares DNA with.
 */

/** A breed's family, including the extra sampled populations only the chord diagram has. */
export const cladeOf = (code: string): string | null => data.breeds[code]?.clade ?? nodeByCode.get(code)?.clade ?? null;

/** The distinct families of a set of breeds. */
export const cladesOf = (codes: Iterable<string>): string[] => {
  const out = new Set<string>();
  for (const c of codes) {
    const k = cladeOf(c);
    if (k) out.add(k);
  }
  return [...out];
};

/** The breeds that share DNA with any of `codes` (the tree's links and the chords). */
function partnersOfAll(codes: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const [a, b] of data.links) {
    if (codes.has(a)) out.add(b);
    if (codes.has(b)) out.add(a);
  }
  for (const c of codes) if (nodeByCode.has(c)) for (const p of circosPartners(c)) out.add(p.code);
  return out;
}

/** A breed's own family plus every family it shares DNA with (the tree's links and the chords). */
export function relatedClades(code: string): string[] {
  const codes = new Set<string>([code]);
  return cladesOf([...codes, ...partnersOfAll(codes)]);
}

/** Every breed in a family, including populations only the chord diagram has. */
export function cladeMembers(clade: string): string[] {
  const out = new Set<string>();
  for (const [code, b] of Object.entries(data.breeds)) if (b.clade === clade) out.add(code);
  for (const [code, n] of nodeByCode) if (n.clade === clade) out.add(code);
  return [...out];
}

/** Breeds outside a family that share DNA with any of its breeds. */
export function cladePartners(clade: string): string[] {
  const members = new Set(cladeMembers(clade));
  return [...partnersOfAll(members)].filter((c) => !members.has(c) && cladeOf(c) !== clade);
}

/** A family plus every family its breeds share DNA with. */
export function relatedToClade(clade: string): string[] {
  const members = new Set(cladeMembers(clade));
  return cladesOf([...members, ...partnersOfAll(members)]);
}

/** The details-panel card for a family: its breeds, and the families they share DNA with. */
export function cladeTipHtml(clade: string, note = ""): string {
  const members = cladeMembers(clade)
    .filter((c) => data.breeds[c])
    .sort((a, b) => data.breeds[a].name.localeCompare(data.breeds[b].name));
  const others = relatedToClade(clade).filter((c) => c !== clade);
  const related = cladePartners(clade).filter((c) => data.breeds[c]).length;
  const MAX = 6;
  return `${note}<div class="tip-name">${data.clades[clade]} family</div>
    <div class="tip-clade"><i style="background:${cladeColor(clade)}"></i>${members.length} breed${members.length === 1 ? "" : "s"}</div>
    <div class="tip-note">${members.map((c) => data.breeds[c].name).join(", ")}</div>
    ${others.length
      ? `<div class="tip-sub">Shares big chunks of DNA with ${related} breed${related === 1 ? "" : "s"} outside the family (highlighted on the chart), from ${others.length} other famil${others.length === 1 ? "y" : "ies"}:</div>
         ${others.slice(0, MAX).map((c) => `<div class="tip-clade"><i style="background:${cladeColor(c)}"></i>${data.clades[c]}</div>`).join("")}
         ${others.length > MAX ? `<div class="tip-more">+ ${others.length - MAX} more</div>` : ""}`
      : `<div class="tip-note">No big DNA overlap with breeds from other families.</div>`}`;
}
