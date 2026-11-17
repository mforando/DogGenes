/**
 * Click-to-pin for the Family Tree's details panel (the "tip dock" beside the chart).
 *
 * Hovering a breed shows its details in the panel; clicking it pins them there, so the reader
 * can move the pointer onto the panel and scroll it. Several sources share the one panel (the
 * tree, the circle chart, names in the step text), and only one can be pinned at a time, so
 * they coordinate through events on the panel element:
 *   "dock-pin"      (detail: source)  a source pinned something; the others let go
 *   "dock-unpin"                      everyone lets go (e.g. the step changed)
 *   "dock-unpinned" (detail: source)  a source let go
 * A pinned panel gets the class "pinned" (or, for a name pinned from the page's React code, a
 * data-pinned attribute), which makes it scrollable and clickable.
 */

export const DOCK_PIN = "dock-pin";
export const DOCK_UNPIN = "dock-unpin";
export const DOCK_UNPINNED = "dock-unpinned";

/** The note at the top of a pinned panel. */
export const PIN_NOTE = "Pinned · click it again or press Esc to release";
export const pinNoteHtml = () => `<div class="tip-pin">${PIN_NOTE}</div>`;

export type DockPinner = {
  /** What's pinned (a source-specific key), or null. */
  readonly key: string | null;
  /** Something is pinned in the panel, by this source or another (e.g. a name in the text). */
  readonly busy: boolean;
  /** Whether pinning is available right now (a docked panel on a large screen). */
  can: () => boolean;
  pin: (key: string) => void;
  unpin: () => void;
  /** Pin `key`, or release it if it's already pinned. Returns true if it's now pinned. */
  toggle: (key: string) => boolean;
  dispose: () => void;
};

export function dockPinner(
  dock: HTMLElement | null,
  source: string,
  onRelease: () => void,
  enabled: () => boolean,
): DockPinner {
  let key: string | null = null;
  const release = () => {
    if (key === null) return;
    key = null;
    dock?.classList.remove("pinned");
    if (dock) dock.scrollTop = 0; // the next hovered card starts at its top
    onRelease();
    dock?.dispatchEvent(new CustomEvent(DOCK_UNPINNED, { detail: source }));
  };
  const onOtherPin = (e: Event) => {
    if ((e as CustomEvent).detail !== source) release();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") release();
  };
  dock?.addEventListener(DOCK_PIN, onOtherPin);
  dock?.addEventListener(DOCK_UNPIN, release);
  window.addEventListener("keydown", onKey);

  const api: DockPinner = {
    get key() {
      return key;
    },
    get busy() {
      return key !== null || !!dock?.classList.contains("pinned") || dock?.dataset.pinned != null;
    },
    can: () => !!dock && enabled(),
    pin(k) {
      key = k;
      dock?.classList.add("pinned");
      if (dock) dock.scrollTop = 0;
      dock?.dispatchEvent(new CustomEvent(DOCK_PIN, { detail: source }));
    },
    unpin: release,
    toggle(k) {
      if (key === k) {
        release();
        return false;
      }
      if (key !== null) release();
      api.pin(k);
      return true;
    },
    dispose() {
      dock?.removeEventListener(DOCK_PIN, onOtherPin);
      dock?.removeEventListener(DOCK_UNPIN, release);
      window.removeEventListener("keydown", onKey);
      if (key !== null) dock?.classList.remove("pinned");
      key = null;
    },
  };
  return api;
}
