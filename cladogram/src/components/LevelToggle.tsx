"use client";

import { LEVELS, useReadingLevel } from "@/lib/readingLevel";
import { track } from "@/lib/track";

/** Puppy / Adult / Albert Pawstein: switches the story's wording. */
export default function LevelToggle({ className = "" }: { className?: string }) {
  const { level, setLevel } = useReadingLevel();
  return (
    <div className={`level-toggle ${className}`} role="radiogroup" aria-label="Reading level">
      {LEVELS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="radio"
          aria-checked={level === l.id}
          title={l.hint}
          className={level === l.id ? "on" : ""}
          onClick={() => {
            setLevel(l.id);
            track("reading_level", { level: l.id });
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
