"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The history of dogs is now the home page; send old links (and their #section) there. */
export default function Page() {
  useEffect(() => {
    window.location.replace(`${BASE}/${window.location.hash}`);
  }, []);
  return (
    <main className="moved">
      <p>
        This page has moved. <a href={`${BASE}/`}>Continue to the history of dogs →</a>
      </p>
    </main>
  );
}
