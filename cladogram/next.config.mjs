import { PHASE_PRODUCTION_BUILD } from "next/constants.js";
import { pagesBasePath } from "./scripts/base-path.mjs";

export default function config(phase) {
  // Production builds are published to GitHub Pages (see scripts/publish.mjs), which
  // serves project sites under /<repo>/. `next dev` keeps serving from "/".
  const isBuild = phase === PHASE_PRODUCTION_BUILD;
  const basePath = isBuild ? pagesBasePath() : "";
  if (isBuild) console.log(`▲ GitHub Pages base path: "${basePath || "/"}"`);
  /** @type {import('next').NextConfig} */
  return {
    reactStrictMode: true,
    // Static HTML export: no server needed, so it can be hosted on GitHub Pages.
    output: "export",
    // Emit folder/index.html for every route so /circos/ works on a static host.
    trailingSlash: true,
    basePath,
    // Static files (the Breed Explorer sprite sheets) need the prefix at runtime too.
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
    images: { unoptimized: true },
  };
}
