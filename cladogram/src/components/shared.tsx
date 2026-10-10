"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { PHOTOS } from "@/lib/photos";

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
  { href: "/history", label: "The history of dogs" },
  { href: "/", label: "Family tree & DNA web" },
  { href: "/pairs", label: "Breed pairs" },
  { href: "/purpose", label: "Bred for purpose" },
  { href: "/geography", label: "Where they came from" },
  { href: "/explorer", label: "Breed Explorer" },
  { href: "/health", label: "Health & heredity" },
  { href: "/names", label: "How we name our dogs" },
  { href: "/popularity", label: "Most popular breeds" },
];

export function SiteNav() {
  // With trailingSlash the pathname may end in "/"; compare without it.
  const path = usePathname().replace(/(.)\/$/, "$1");
  return (
    <nav className="site-nav" aria-label="Pages">
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
    </nav>
  );
}

export const CITATION = (
  <>
    Parker, Dreger, Rimbault, Davis, Mullen, Carpintero-Ramirez &amp; Ostrander,
    &ldquo;Genomic Analyses Reveal the Influence of Geographic Origin, Migration, and
    Hybridization on Modern Dog Breed Development,&rdquo; <i>Cell Reports</i> 19 (2017).
  </>
);
