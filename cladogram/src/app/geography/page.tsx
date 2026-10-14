"use client";

import { useEffect } from "react";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** The "Where they came from" tab was retired; its globe lives on in the family tree story. */
export default function Page() {
  useEffect(() => {
    window.location.replace(`${BASE}/tree/#geography`);
  }, []);
  return (
    <main className="moved">
      <p>
        This page has moved. <a href={`${BASE}/tree/#geography`}>Continue to the breed origins globe →</a>
      </p>
    </main>
  );
}
