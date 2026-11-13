import type { MetadataRoute } from "next";
import { BREED_CODES, breedPath } from "@/lib/breeds";
import { abs } from "@/lib/site";

// Static export: written once at build time as sitemap.xml.
export const dynamic = "force-static";

/** The real pages, then one per breed. Retired URLs that only redirect are left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages: [string, number][] = [
    ["/", 1],
    ["/tree/", 0.9],
    ["/purpose/", 0.8],
    ["/explorer/", 0.7],
    ["/health/", 0.7],
    ["/names/", 0.7],
    ["/popularity/", 0.7],
    ["/game/", 0.6],
    ["/breeds/", 0.8],
  ];
  return [
    ...pages.map(([p, priority]) => ({ url: abs(p), lastModified: now, changeFrequency: "monthly" as const, priority })),
    ...BREED_CODES.map((c) => ({ url: abs(breedPath(c)), lastModified: now, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
