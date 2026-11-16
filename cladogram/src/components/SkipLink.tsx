"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * "Skip to main content": the first thing a keyboard user reaches. Hidden until focused.
 * It jumps past the eight-link nav to the page's headline (or its <main>), which is given
 * the id "main-content" and made focusable on every page.
 */
export default function SkipLink() {
  const path = usePathname();
  useEffect(() => {
    const target = document.querySelector<HTMLElement>("h1") ?? document.querySelector<HTMLElement>("main");
    if (!target || document.getElementById("main-content")) return;
    target.id ||= "main-content";
    if (target.id !== "main-content") {
      // The headline already has an id: put a marker just before it instead.
      const mark = document.createElement("span");
      mark.id = "main-content";
      target.before(mark);
    }
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  }, [path]);
  return (
    <a
      className="skip-link"
      href="#main-content"
      onClick={(e) => {
        const target = document.querySelector<HTMLElement>("h1") ?? document.querySelector<HTMLElement>("main");
        if (!target) return;
        e.preventDefault();
        target.focus();
        target.scrollIntoView({ block: "start" });
      }}
    >
      Skip to main content
    </a>
  );
}
