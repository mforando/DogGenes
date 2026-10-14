"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The breed pairs moved into the home page; send visitors (and old links) to the right spot. */
export default function Page() {
  useEffect(() => {
    window.location.replace(`${BASE}/tree/#breed-pairs`);
  }, []);
  return (
    <main className="moved">
      <p>
        This page has moved. <a href={`${BASE}/tree/#breed-pairs`}>Continue to the breed pairs on the family tree &amp; DNA web →</a>
      </p>
    </main>
  );
}
