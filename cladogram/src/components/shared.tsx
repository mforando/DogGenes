"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";
import LevelToggle from "./LevelToggle";

/** True while a CSS media query matches (false on the server and on first paint). */
export function useMedia(query: string) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const sync = () => setOn(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, [query]);
  return on;
}
/** Phone-size screens in either orientation (a rotated phone is wide but short). */
export const PHONE = "(max-width: 900px), (max-height: 520px) and (orientation: landscape)";

/** Tracks which scroll step is crossing the reading line. */
export function useActiveStep() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      // On narrow screens the pinned figure covers the top half, so read steps lower down.
      { rootMargin: window.innerWidth <= 900 ? "-72% 0px -26% 0px" : "-48% 0px -48% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  const stepRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
  };
  return { active, stepRef };
}

/** Dog CEO photos for breeds: one per breed, or every stored photo of a single breed. */
export function Specimens({
  codes,
  all = false,
  onHover,
}: {
  codes: string[];
  all?: boolean;
  /** Hovering (or focusing) a photo reports its breed; leaving reports null. */
  onHover?: (code: string | null) => void;
}) {
  const items = all
    ? (PHOTOS[codes[0]]?.urls ?? []).map((url) => ({ code: codes[0], url }))
    : codes.filter((c) => PHOTOS[c]).map((code) => ({ code, url: PHOTOS[code].urls[0] }));
  if (!items.length) return null;
  return (
    <ul className={`specimens n${Math.min(items.length, 4)}`}>
      {items.map(({ code, url }) => (
        <li
          key={url}
          className={onHover ? "is-linked" : undefined}
          tabIndex={onHover ? 0 : undefined}
          onPointerEnter={onHover ? () => onHover(code) : undefined}
          onPointerLeave={onHover ? () => onHover(null) : undefined}
          onFocus={onHover ? () => onHover(code) : undefined}
          onBlur={onHover ? () => onHover(null) : undefined}
        >
          <figure>
            <img src={url} alt={data.breeds[code].name} loading="lazy" referrerPolicy="no-referrer" />
            {!all && (
              <figcaption>
                <i style={{ background: cladeColor(data.breeds[code].clade, code) }} />
                {data.breeds[code].name}
              </figcaption>
            )}
          </figure>
        </li>
      ))}
    </ul>
  );
}

const PAGES = [
  { href: "/", label: "The history of dogs" },
  { href: "/tree", label: "Family tree & DNA web" },
  { href: "/purpose", label: "Bred for purpose" },
  { href: "/explorer", label: "Breed Explorer" },
  { href: "/health", label: "Health & heredity" },
  { href: "/names", label: "How we name our dogs" },
  { href: "/popularity", label: "Most popular breeds" },
  { href: "/game", label: "Dog Breed Game" },
];

export function SiteNav() {
  // With trailingSlash the pathname may end in "/"; compare without it.
  const path = usePathname().replace(/(.)\/$/, "$1");
  // The reading level sits at the end of the nav; once the nav scrolls away a copy stays
  // pinned to the top-right corner (the family tree page pins its own, beside the "?").
  const nav = useRef<HTMLElement>(null);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setPinned(!e.isIntersecting));
    if (nav.current) io.observe(nav.current);
    return () => io.disconnect();
  }, []);
  return (
    <>
    <nav ref={nav} className="site-nav" aria-label="Pages">
      <span className="site-mark" aria-hidden>
        Canis · 2017
      </span>
      <ul>
        {PAGES.map((p) => (
          <li key={p.href}>
            <Link href={p.href} aria-current={path === p.href ? "page" : undefined}>
              {p.label}
            </Link>
          </li>
        ))}
      </ul>
      <LevelToggle className="level-nav" />
    </nav>
    {path !== "/tree" && (
      <div className={`level-pin${pinned ? " on" : ""}`} aria-hidden={!pinned}>
        <LevelToggle />
      </div>
    )}
    </>
  );
}

/**
 * A small animated prompt in a page's intro, shown only on phones held upright (CSS): the
 * dense charts are bigger and easier to read with the phone turned sideways.
 */
export function RotateHint() {
  return (
    <p className="rotate-hint" role="note">
      <svg viewBox="0 0 64 64" aria-hidden>
        <path className="rh-arc" d="M50 20a22 22 0 0 0-30-8" />
        <path className="rh-arrow" d="M17 5l2 9 9-3" />
        <g className="rh-phone">
          <rect x="22" y="12" width="20" height="40" rx="4" />
          <line x1="29" y1="47" x2="35" y2="47" />
        </g>
      </svg>
      <span>
        <strong>Turn your phone sideways</strong> for bigger charts. It works upright too.
      </span>
    </p>
  );
}

export const CITATION = (
  <>
    Parker, Dreger, Rimbault, Davis, Mullen, Carpintero-Ramirez &amp; Ostrander,
    &ldquo;Genomic Analyses Reveal the Influence of Geographic Origin, Migration, and
    Hybridization on Modern Dog Breed Development,&rdquo; <i>Cell Reports</i> 19 (2017).
  </>
);
