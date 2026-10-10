import raw from "@/data/photos.json";
import commonsRaw from "@/data/commons.json";

/** A freely licensed Wikimedia Commons photo and the credit its license requires. */
export type CommonsPhoto = { name: string; article: string | null; file: string; url: string; page: string; author: string; license: string; licenseUrl: string | null };
/** Keyed "code:<study code>", "akc:<AKC slug>" or "name:<breed name>" (see scripts/fetch-commons-photos.mjs). */
export const COMMONS = commonsRaw as Record<string, CommonsPhoto>;

/**
 * Photo URLs keyed by study breed code: Dog CEO photos (scripts/fetch-dog-photos.mjs),
 * with a Wikimedia Commons photo for breeds Dog CEO doesn't cover.
 */
export const PHOTOS: Record<string, { api: string; urls: string[] }> = { ...(raw as Record<string, { api: string; urls: string[] }>) };
for (const [key, p] of Object.entries(COMMONS)) {
  const code = key.startsWith("code:") ? key.slice(5) : null;
  if (code && !PHOTOS[code]) PHOTOS[code] = { api: "commons", urls: [p.url] };
}

export const photoOf = (code: string): string | undefined => PHOTOS[code]?.urls[0];

/** Photo for an AKC breed: its study breed's photo, else a Commons photo for the AKC breed. */
export const photoOfAkc = (code: string | null, slug: string): string | undefined => (code ? photoOf(code) : undefined) ?? COMMONS[`akc:${slug}`]?.url;
