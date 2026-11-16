"use client";

import { useEffect, useState } from "react";

/**
 * One site-wide "pause animations" switch (WCAG 2.2.2: anything that moves for more than
 * five seconds needs a way to stop it). The header helix, the wolf-to-dog video and the
 * globes' idle spin all follow it. It is remembered on this device, and the operating
 * system's "reduce motion" setting always counts as paused.
 */
const KEY = "dg-motion";
const EVENT = "dg-motion-change";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function stored(): boolean {
  try {
    return localStorage.getItem(KEY) === "paused";
  } catch {
    return false;
  }
}

/** True when animation should hold still: paused on the page, or reduced motion in the OS. */
export const motionPaused = () => prefersReducedMotion() || stored();

export function setMotionPaused(paused: boolean) {
  try {
    if (paused) localStorage.setItem(KEY, "paused");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the switch still works for this page view.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: paused }));
}

/** Calls `fn(paused)` whenever the switch changes. Returns an unsubscribe function. */
export function onMotionChange(fn: (paused: boolean) => void) {
  const h = (e: Event) => fn(prefersReducedMotion() || (e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** The switch as React state (false on the server and the first render). */
export function useMotionPaused() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    setPaused(motionPaused());
    return onMotionChange(setPaused);
  }, []);
  return paused;
}
