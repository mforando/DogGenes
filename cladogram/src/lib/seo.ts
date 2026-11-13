import type { Metadata } from "next";
import { abs, SITE_NAME } from "./site";

/**
 * Metadata for one page: title, description, canonical URL, and the Open Graph / Twitter
 * card. Page-level openGraph replaces the layout's wholesale, so the shared fields are
 * repeated here. `image` is a path under public/ (og/tree.png) or an absolute URL.
 */
export function pageMeta(o: { title: string; description: string; path: string; image: string; imageAlt?: string; type?: "website" | "article" }): Metadata {
  const image = o.image.startsWith("http") ? o.image : abs(o.image);
  const images = [{ url: image, width: o.image.startsWith("http") ? undefined : 1200, height: o.image.startsWith("http") ? undefined : 630, alt: o.imageAlt ?? o.title }];
  return {
    title: o.title,
    description: o.description,
    // Absolute: a relative canonical would resolve against the page's own path.
    alternates: { canonical: abs(o.path) },
    openGraph: { title: o.title, description: o.description, url: abs(o.path), siteName: SITE_NAME, type: o.type ?? "article", locale: "en_US", images },
    twitter: { card: "summary_large_image", title: o.title, description: o.description, images: images.map((i) => i.url) },
  };
}

/** Metadata for a page that only forwards visitors elsewhere: keep it out of search results. */
export const movedMeta = (to: string): Metadata => ({
  title: "This page has moved",
  robots: { index: false, follow: true },
  alternates: { canonical: abs(to) },
});
