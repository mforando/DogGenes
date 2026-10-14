"use client";

import { useEffect, useRef, useState } from "react";
import faces from "@/data/faces.json";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Which face (or which pair, mid-morph) is on screen at time t. */
function labelAt(t: number) {
  const segs = faces.segments;
  let i = 0;
  while (i + 1 < segs.length && segs[i + 1].start <= t) i++;
  const s = segs[i];
  if (s.kind === "hold") return s.name;
  const from = segs[(i - 1 + segs.length) % segs.length].name;
  return `${from} → ${s.name}`;
}

/**
 * The header's centerpiece: one grey wolf that evolves into ten dog breeds and back.
 * The video is pre-rendered by scripts/face-morph/render.py: each face has 12 hand-placed landmarks
 * (eyes, nose, mouth, head and cheeks), the in-between shapes are warped triangle by
 * triangle, and the blend lets coarse shape and colour change before fine fur detail, so
 * the in-between faces read as animals rather than a double exposure. It holds on the wolf
 * for reduced motion and only plays while the opening section is on screen.
 */
export default function FaceMorph() {
  const video = useRef<HTMLVideoElement>(null);
  const [label, setLabel] = useState(faces.segments[0].name);

  useEffect(() => {
    const v = video.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const tick = () => {
      setLabel(labelAt(v.currentTime));
      raf = requestAnimationFrame(tick);
    };
    // Play only while the opening section is on screen; off screen the video and its label
    // loop stop completely, so the rest of the page scrolls without the decoder running.
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        v.play().catch(() => {});
        raf = requestAnimationFrame(tick);
      } else v.pause();
    });
    io.observe(v.closest("header") ?? v);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      v.pause();
    };
  }, []);

  return (
    <div className="face-morph">
      <div className="face-ring">
        <video
          ref={video}
          src={`${BASE}/${faces.video}`}
          poster={`${BASE}/${faces.poster}`}
          muted
          loop
          playsInline
          preload="auto"
          aria-label="A grey wolf's face evolving into ten dog breeds and back"
        />
      </div>
      <p className="face-name" aria-hidden>
        {label}
      </p>
    </div>
  );
}
