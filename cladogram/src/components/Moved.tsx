"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * A retired URL: forwards visitors to where its content lives now. The meta refresh covers
 * crawlers and visitors without JavaScript; the script keeps the #section when asked to.
 * Its page exports movedMeta(), which keeps it out of search results.
 */
export default function Moved({ to, label, keepHash = false }: { to: string; label: string; keepHash?: boolean }) {
  useEffect(() => {
    window.location.replace(`${BASE}${keepHash ? to.replace(/#.*$/, "") + window.location.hash : to}`);
  }, [to, keepHash]);
  return (
    <main className="moved">
      <meta httpEquiv="refresh" content={`0; url=${BASE}${to}`} />
      <p>
        This page has moved. <a href={`${BASE}${to}`}>{label} →</a>
      </p>
    </main>
  );
}
