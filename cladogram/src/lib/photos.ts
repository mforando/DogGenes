import raw from "@/data/photos.json";

/** Photo URLs from the Dog CEO API, keyed by study breed code (see scripts/fetch-dog-photos.mjs). */
export const PHOTOS = raw as Record<string, { api: string; urls: string[] }>;

export const photoOf = (code: string): string | undefined => PHOTOS[code]?.urls[0];
