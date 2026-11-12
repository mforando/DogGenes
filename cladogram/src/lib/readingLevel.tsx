"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

/** Reading levels for the whole site: same pages and visuals, different words. */
export type ReadingLevel = "puppy" | "adult" | "pro";

export const LEVELS: { id: ReadingLevel; label: string; hint: string }[] = [
  { id: "puppy", label: "Puppy", hint: "Simple words and everyday comparisons" },
  { id: "adult", label: "Adult", hint: "The standard version" },
  { id: "pro", label: "Albert Pawstein", hint: "Scientific terms and methods from the study" },
];

const KEY = "dg-reading-level";
const Ctx = createContext<{ level: ReadingLevel; setLevel: (l: ReadingLevel) => void }>({
  level: "adult",
  setLevel: () => {},
});

export function ReadingLevelProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<ReadingLevel>("adult");
  // Remember the reader's choice in this browser (a convenience; the page works without it).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === "puppy" || saved === "adult" || saved === "pro") setLevelState(saved);
    } catch {}
  }, []);
  const setLevel = (l: ReadingLevel) => {
    setLevelState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {}
  };
  return <Ctx.Provider value={{ level, setLevel }}>{children}</Ctx.Provider>;
}

export const useReadingLevel = () => useContext(Ctx);

/**
 * Text at the reader's level: `<Lv puppy={…} pro={…}>adult text</Lv>`. Puppy is about a
 * 5th-grade reading level; "pro" (Albert Pawstein) uses the study's scientific terms. A level
 * that isn't given falls back to the adult text.
 */
export function Lv({ children, puppy, pro }: { children: ReactNode; puppy?: ReactNode; pro?: ReactNode }) {
  const { level } = useContext(Ctx);
  if (level === "puppy" && puppy !== undefined) return <>{puppy}</>;
  if (level === "pro" && pro !== undefined) return <>{pro}</>;
  return <>{children}</>;
}
