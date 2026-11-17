/**
 * Hover gate: after the story moves to a new step, hovers stay off until the pointer really moves.
 *
 * Scrolling carries new things under a resting pointer, and browsers fire synthetic pointer
 * events at the same spot when a scroll ends, so without this a stale hover would come straight
 * back on the new step. `lock()` remembers where the pointer is; `ok()` stays false until the
 * pointer has moved a few pixels from there, or the reader presses a key (keyboard focus is
 * never held back).
 *
 * The story announces a step change with a STEP_CHANGE event on the chart-details panel, which
 * the charts listen for (they have no other link to the story's step).
 */

export const STEP_CHANGE = "step-change";

let lastX = NaN;
let lastY = NaN;
let keyedAt = -Infinity;
if (typeof window !== "undefined") {
  // Capture phase: updated before any element's own handler sees the same event.
  window.addEventListener(
    "pointermove",
    (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
    },
    { capture: true, passive: true },
  );
  window.addEventListener("keydown", () => (keyedAt = performance.now()), { capture: true, passive: true });
}

export type HoverGate = { lock: () => void; ok: () => boolean };

export function hoverGate(slop = 4): HoverGate {
  let locked = false;
  let lx = NaN;
  let ly = NaN;
  let lockedAt = 0;
  return {
    lock() {
      locked = true;
      lx = lastX;
      ly = lastY;
      lockedAt = performance.now();
    },
    ok() {
      if (!locked) return true;
      const keyed = keyedAt > lockedAt;
      const moved =
        !Number.isNaN(lastX) && (Number.isNaN(lx) || Math.hypot(lastX - lx, lastY - ly) > slop);
      if (!keyed && !moved) return false;
      locked = false;
      return true;
    },
  };
}
