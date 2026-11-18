import { useSyncExternalStore } from "react";
import { links } from "./circos";

/**
 * The breed pointed at inside a family's panel (CladePanel): on its family tree (CladeTree) or
 * its stretched chord diagram (StretchedChord). Both of those, and the main circle charts, show
 * it; when it clears, everything goes back to the family's own highlight.
 *
 * kind "m": one of the family's breeds; "p": a partner breed in another family; "c": one chord,
 * id "member|partner".
 */
export type PanelFocus = { kind: "m" | "p" | "c"; id: string } | null;

let current: PanelFocus = null;
const listeners = new Set<() => void>();

export function setPanelFocus(f: PanelFocus) {
  if (f === current || (f && current && f.kind === current.kind && f.id === current.id)) return;
  current = f;
  for (const l of listeners) l();
}
export const getPanelFocus = () => current;
export function subscribePanelFocus(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
export const usePanelFocus = () => useSyncExternalStore(subscribePanelFocus, getPanelFocus, () => null);

/** The one breed the main charts should show for a focus (a chord shows its family's breed). */
export const panelBreed = (f: PanelFocus): string | null => (!f ? null : f.kind === "c" ? f.id.split("|")[0] : f.id);

/** The family's breeds (codes) a focus lights up on the family's tree. */
export function panelMembers(f: PanelFocus, members: Set<string>): Set<string> {
  if (!f) return new Set();
  if (f.kind === "m") return new Set([f.id]);
  if (f.kind === "c") return new Set([f.id.split("|")[0]]);
  // A partner: every breed of the family it shares DNA with.
  return new Set(links.flatMap((l) => (l.a === f.id && members.has(l.b) ? [l.b] : l.b === f.id && members.has(l.a) ? [l.a] : [])));
}
