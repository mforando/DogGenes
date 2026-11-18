"use client";

import OUTLINES from "@/data/aboutOutlines.json";
import { useActiveStep } from "./shared";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * A photo in public/about/: the dog cut out of its background. William's photo is his whole pack
 * (`under`), with him drawn again on top so the glow and outline pick out just him.
 */
export type AboutPhoto = { file: string; alt: string; caption: string; under?: string };
export type AboutDog = { name: string; photo: AboutPhoto };
type Outline = { w: number; h: number; scale: number; margin: number; d: string };

/**
 * The About page's dogs as a small scroller: the photos stay put on the left (on top, on phones)
 * and cross-fade to whichever dog's text is passing the middle of the screen on the right.
 */
export default function AboutScroller({ dogs }: { dogs: AboutDog[] }) {
  const { active, stepRef } = useActiveStep();
  return (
    <div className="about-scroller">
      <div className="about-stage" aria-hidden>
        {dogs.map(({ name, photo }, i) => (
          <div key={name} className={`about-frame${i === active ? " on" : ""}`}>
            <DogPhoto p={photo} id={name.toLowerCase()} />
          </div>
        ))}
      </div>
      <ol className="about-steps">
        {dogs.map(({ name, photo }, i) => (
          <li key={name} ref={stepRef(i)} data-index={i} className={i === active ? "on" : undefined}>
            <h3>{name}</h3>
            <p>{photo.caption}</p>
            {/* The photo for screen readers, beside its text (the stage on the left is hidden from them). */}
            <span className="sr-only">Photo: {photo.alt}.</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** One dog: the photo (over its pack, for William), a soft glow, then the outline on top. */
function DogPhoto({ p, id }: { p: AboutPhoto; id: string }) {
  const { w, h, scale: s, margin: m, d } = (OUTLINES as Record<string, Outline>)[p.under ?? p.file];
  const src = (f: string) => `${BASE}/about/${f}`;
  return (
    <svg className="about-photo" viewBox={`${-m} ${-m} ${w + 2 * m} ${h + 2 * m}`} width={Math.round((w + 2 * m) * s)} height={Math.round((h + 2 * m) * s)}>
      <defs>
        <filter id={`glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={5 / s} />
        </filter>
      </defs>
      {p.under && <image href={src(p.under)} width={w} height={h} />}
      <path className="about-glow" d={d} strokeWidth={9 / s} filter={`url(#glow-${id})`} />
      <image href={src(p.file)} width={w} height={h} />
      <path className="about-line" d={d} strokeWidth={1.6 / s} />
    </svg>
  );
}
