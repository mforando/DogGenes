import raw from "@/data/breedFacts.json";
import akc from "@/data/akc.json";

/**
 * A short history and key facts for each breed, from English Wikipedia (CC BY-SA 4.0), fetched
 * by scripts/fetch-breed-facts.mjs. Keyed by study code, or "akc:<slug>" for AKC breeds the
 * study didn't sample. w: article title, a: what the breed is, h: a line of its history,
 * o: origin, ht / wt: height and weight ranges.
 */
export type BreedFacts = { w: string; a: string; h?: string; o?: string; ht?: string; wt?: string };
const FACTS = raw as Record<string, BreedFacts>;

// Breeds by name, for places that know a breed only by its name: AKC names, and each
// article's title without a "(dog)"-style suffix ("Boxer (dog)" → "boxer").
const norm = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/\s*\((dog|dog breed|breed)\)$/, "").trim();
const KEY_BY_NAME = new Map<string, string>();
for (const [k, f] of Object.entries(FACTS)) KEY_BY_NAME.set(norm(f.w), k);
for (const b of (akc as { breeds: { name: string; slug: string; code: string | null }[] }).breeds) {
  const k = b.code ?? `akc:${b.slug}`;
  if (FACTS[k]) KEY_BY_NAME.set(norm(b.name), k);
}

/** Facts by study code, else by AKC slug, else by breed name. */
export const factsFor = (code?: string | null, slug?: string | null, name?: string | null): BreedFacts | undefined =>
  (code ? FACTS[code] : undefined) ??
  (slug ? FACTS[`akc:${slug}`] : undefined) ??
  (name ? FACTS[KEY_BY_NAME.get(norm(name)) ?? ""] : undefined);

export const factsUrl = (f: BreedFacts) => `https://en.wikipedia.org/wiki/${encodeURIComponent(f.w.replace(/ /g, "_"))}`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
/** "55–65 cm (22–26 in)" → metric on top, imperial below. */
const measureHtml = (v: string) => {
  const m = v.match(/^(.*?)\s*\((.*)\)$/);
  return m ? `${esc(m[1])}<i>${esc(m[2])}</i>` : esc(v);
};
const cells = (f: BreedFacts): [string, string][] =>
  ([["Origin", f.o], ["Height", f.ht], ["Weight", f.wt]] as [string, string | undefined][]).filter((c): c is [string, string] => !!c[1]);

/** The facts block as HTML, for the D3 tooltips (append it after the breed's name). */
export function factsHtml(code?: string | null, slug?: string | null, name?: string | null): string {
  const f = factsFor(code, slug, name);
  if (!f) return "";
  const row = cells(f)
    .map(([k, v]) => `<span><b>${k}</b>${k === "Origin" ? esc(v) : measureHtml(v)}</span>`)
    .join("");
  return `<div class="bf">
    ${row ? `<div class="bf-row">${row}</div>` : ""}
    <p>${esc(f.a)}</p>
    ${f.h ? `<p><b>History</b> ${esc(f.h)}</p>` : ""}
    <div class="bf-src">Wikipedia · CC BY-SA 4.0</div>
  </div>`;
}

/** The facts as plain text, for native (title) tooltips. */
export function factsText(code?: string | null, slug?: string | null, name?: string | null): string {
  const f = factsFor(code, slug, name);
  if (!f) return "";
  const facts = cells(f).map(([k, v]) => `${k}: ${v}`).join(" · ");
  return [facts, f.a, f.h ? `History: ${f.h}` : "", "(Wikipedia, CC BY-SA 4.0)"].filter(Boolean).join("\n");
}

/** The facts block for React pop-ups. */
export function BreedFactsBlock({ code, slug }: { code?: string | null; slug?: string | null }) {
  const f = factsFor(code, slug);
  if (!f) return null;
  const row = cells(f);
  return (
    <div className="bf">
      {row.length > 0 && (
        <div className="bf-row">
          {row.map(([k, v]) => {
            const m = k === "Origin" ? null : v.match(/^(.*?)\s*\((.*)\)$/);
            return (
              <span key={k}>
                <b>{k}</b>
                {m ? (
                  <>
                    {m[1]}
                    <i>{m[2]}</i>
                  </>
                ) : (
                  v
                )}
              </span>
            );
          })}
        </div>
      )}
      <p>{f.a}</p>
      {f.h && (
        <p>
          <b>History</b> {f.h}
        </p>
      )}
      <div className="bf-src">Wikipedia · CC BY-SA 4.0</div>
    </div>
  );
}
