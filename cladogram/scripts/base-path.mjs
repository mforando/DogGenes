import { execSync } from "node:child_process";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** The repository root (one folder above the app), where the published site lives. */
export const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/**
 * GitHub Pages serves a project site from https://<user>.github.io/<repo>/, so every URL
 * needs a "/<repo>" prefix. A user/organisation site (a repo named <user>.github.io)
 * is served from the domain root and needs none.
 *
 * Order of precedence: PAGES_BASE_PATH env var ("" for no prefix) → the repo name from
 * `git remote get-url origin` → the root folder's name.
 */
export function pagesBasePath() {
  const env = process.env.PAGES_BASE_PATH;
  if (env !== undefined) {
    const trimmed = env.trim().replace(/^\/+|\/+$/g, "");
    return trimmed ? `/${trimmed}` : "";
  }
  let repo;
  try {
    const url = execSync("git remote get-url origin", { cwd: siteRoot, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    repo = url.replace(/\.git$/, "").split(/[/:]/).pop();
  } catch {
    // Not a git repository (yet): fall back to the folder name.
  }
  repo ||= basename(siteRoot);
  return repo.toLowerCase().endsWith(".github.io") ? "" : `/${repo}`;
}
