import { data } from "./tree";
import { slugify } from "./site";

/**
 * Breed page addresses (/breeds/<slug>/). Kept apart from lib/breeds.ts so client
 * components can link to breed pages without bundling the pages' data.
 */

/** Study breeds with a page: every sampled breed, without the wild outgroups. */
export const BREED_CODES = Object.keys(data.breeds).filter((c) => c !== "WOLF" && c !== "GDJK");
export const slugOf = (code: string) => slugify(data.breeds[code].name);
export const codeOfSlug = new Map(BREED_CODES.map((c) => [slugOf(c), c]));
export const breedPath = (code: string) => `/breeds/${slugOf(code)}/`;
export const hasBreedPage = (code: string) => BREED_CODES.includes(code);
