"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** This page moved into the home page; send visitors (and old links) to the right spot. */
export default function Page() {
  useEffect(() => {
    window.location.replace(`${BASE}/#full-chart`);
  }, []);
  return (
    <main className="moved">
      <p>
        This page has moved. <a href={`${BASE}/#full-chart`}>Continue to the family tree &amp; DNA web →</a>
      </p>
    </main>
  );
}
