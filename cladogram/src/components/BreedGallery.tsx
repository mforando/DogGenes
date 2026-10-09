"use client";

import { useEffect, useState } from "react";

type Explorer = typeof import("@/lib/explorer");
let explorer: Promise<Explorer> | null = null;
/** The full Dog CEO photo lists live in the Breed Explorer data; load them only when needed. */
const loadExplorer = () => (explorer ??= import("@/lib/explorer"));

/**
 * A breed photo with ‹ › arrows that step through every Dog CEO photo of the breed
 * (the arrow keys work too). Falls back to a single photo until the list has loaded.
 */
export default function BreedGallery({ code, name, fallback }: { code: string; name: string; fallback?: string }) {
  const [urls, setUrls] = useState<string[]>(fallback ? [fallback] : []);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    setI(0);
    setUrls(fallback ? [fallback] : []);
    loadExplorer().then(({ BREEDS, photoUrl }) => {
      if (!live) return;
      const b = BREEDS.find((x) => x.code === code);
      if (b) setUrls(b.files.map((_, k) => photoUrl(b, k)));
    });
    return () => {
      live = false;
    };
  }, [code, fallback]);

  useEffect(() => setLoaded(false), [i, urls]);

  const n = urls.length;
  const go = (d: number) => setI((x) => (x + d + n) % n);

  useEffect(() => {
    if (n < 2) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  if (!n) return null;
  return (
    <div className="bg-gallery">
      <div className={`bg-frame${loaded ? " loaded" : ""}`}>
        <img
          key={urls[i]}
          src={urls[i]}
          alt={`${name}, photo ${i + 1} of ${n}`}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
        />
        {n > 1 && (
          <>
            <button type="button" className="bg-prev" onClick={() => go(-1)} aria-label="Previous photo">‹</button>
            <button type="button" className="bg-next" onClick={() => go(1)} aria-label="Next photo">›</button>
          </>
        )}
      </div>
      {n > 1 && (
        <p className="bg-count" aria-live="polite">
          Photo {i + 1} of {n} · use ‹ › or the arrow keys
        </p>
      )}
    </div>
  );
}
