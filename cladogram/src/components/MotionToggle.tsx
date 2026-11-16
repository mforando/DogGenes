"use client";

import { prefersReducedMotion, setMotionPaused, useMotionPaused } from "@/lib/motion";
import { useEffect, useState } from "react";

/**
 * Pause / play for the header's moving pictures (and the globes' idle spin). Sits in the
 * hero's corner; hidden when the system already asks for reduced motion, since then
 * nothing moves.
 */
export default function MotionToggle() {
  const paused = useMotionPaused();
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(prefersReducedMotion()), []);
  if (reduce) return null;
  return (
    <button type="button" className="motion-toggle" aria-pressed={paused} onClick={() => setMotionPaused(!paused)}>
      <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
        {paused ? <path d="M4 2.5v11l9-5.5z" fill="currentColor" /> : <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />}
      </svg>
      {paused ? "Play animation" : "Pause animation"}
    </button>
  );
}
