"use client";

import { useEffect, useState } from "react";
import Globe, { type FlyTarget } from "./Globe";
import { CONTINENTS, CONTINENT_BREEDS, WORLD, continentOf, type Continent } from "@/lib/regions";
import { ORIGINS } from "@/lib/origins";

const PICKED = "#e8b74a";
const IDLE = "#b9b3a3";
const DIM = "#4a5450";

/**
 * The "Where they came from" globe, with one twist: clicking any breed's dot picks its whole
 * continent, and the story's circle chart highlights every breed from there.
 */
export default function ContinentGlobe({
  continent,
  onPick,
  spotlight = null,
  onHoverBreed,
}: {
  continent: Continent | null;
  onPick?: (c: Continent | null) => void;
  /** A breed whose photo is hovered: spin to its origin and pick it out. */
  spotlight?: string | null;
  /** Hovering a dot: highlight that breed elsewhere (the story's circle chart). */
  onHoverBreed?: (code: string | null) => void;
}) {
  const [fly, setFly] = useState<FlyTarget | null>(null);
  // Spin to a hovered photo's breed; spin back to the picked continent (or the world) after.
  useEffect(() => {
    const o = spotlight ? ORIGINS[spotlight] : null;
    if (o) {
      setFly({ lat: o.lat, lon: o.lon, k: 3, id: Date.now() });
      return;
    }
    setFly((f) => {
      if (!f) return f;
      const t = CONTINENTS.find((x) => x.name === continent) ?? WORLD;
      return { lat: t.lat, lon: t.lon, k: t.k, id: Date.now() };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotlight]);
  const pick = (c: Continent | null) => {
    onPick?.(c);
    const t = CONTINENTS.find((x) => x.name === c) ?? WORLD;
    setFly({ lat: t.lat, lon: t.lon, k: t.k, id: Date.now() });
  };
  // Leaving the step clears the pick; spin back out to the whole world too.
  useEffect(() => {
    if (!continent) setFly((f) => (f ? { ...WORLD, id: Date.now() } : f));
  }, [continent]);

  const colorOf = (code: string) =>
    spotlight && ORIGINS[spotlight] ? (code === spotlight ? PICKED : DIM) : !continent ? IDLE : continentOf(code) === continent ? PICKED : DIM;
  return (
    <div className="rg">
      <div className="rg-globe">
        <Globe
          colorOf={colorOf}
          highlight={spotlight && ORIGINS[spotlight] ? [spotlight] : continent ? CONTINENT_BREEDS[continent] : []}
          selected={spotlight && ORIGINS[spotlight] ? spotlight : null}
          onSelect={(code) => {
            if (!code) return;
            const c = continentOf(code);
            pick(c && c !== continent ? c : null);
          }}
          fly={fly}
          onHover={onHoverBreed}
        />
      </div>
      <div className="job-chips rg-chips" role="group" aria-label="Pick a continent">
        {CONTINENTS.map(({ name }) => (
          <button key={name} type="button" className={continent === name ? "on" : ""} aria-pressed={continent === name} onClick={() => pick(continent === name ? null : name)}>
            {name} <span className="rg-n">{CONTINENT_BREEDS[name].length}</span>
          </button>
        ))}
      </div>
      <p className="rg-status" aria-live="polite">
        {continent
          ? `${CONTINENT_BREEDS[continent].length} ${CONTINENT_BREEDS[continent].length === 1 ? "breed" : "breeds"} from ${continent} ${CONTINENT_BREEDS[continent].length === 1 ? "is" : "are"} lit up on the chart.`
          : "Click a dot or a continent to light up its breeds on the chart."}
      </p>
    </div>
  );
}
