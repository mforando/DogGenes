/**
 * Marks up the story text so it's interactive (components/Hints.tsx): breed names become
 * <B c="CODE">, family names <Clade id="...">, and glossary words <Term id="...">.
 *
 *   node scripts/link-text.mjs [--write] file.tsx ...
 *
 * Only prose is touched: JSX text inside <p>, <li> or <figcaption> (including their <strong>
 * and <em>). Breeds are linked once per paragraph; families and glossary words once per
 * block of text (a step body). Text that is already linked is skipped, so it is safe to rerun.
 * Without --write it prints what it would change.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { parse } = require("next/dist/compiled/babel/parser");
const tree = JSON.parse(readFileSync(new URL("../src/data/cladogram.json", import.meta.url)));

// ---------- what to look for ----------
const SKIP_NAMES = new Set(["BRIT"]); // "Brittany" is also a region of France
const ALIAS = {
  WOLF: ["grey wolf", "grey wolves", "gray wolf", "gray wolves"],
  GDJK: ["golden jackal", "golden jackals"],
  GSD: ["German shepherd", "German shepherds"],
  LAB: ["Labrador", "Labradors", "Labrador retrievers"],
  XOLO: ["Mexican hairless dog", "Mexican hairless dogs", "Xoloitzcuintli"],
  INCA: ["Peruvian hairless dog", "Peruvian hairless dogs"],
  HUSK: ["Siberian husky", "Siberian huskies", "husky", "huskies"],
  AMAL: ["Alaskan malamute", "malamute", "malamutes"],
  SHAR: ["shar-pei", "Chinese shar-pei"],
  MNTY: ["toy Manchester terrier", "toy Manchester terriers"],
  AIRT: ["Airedale", "Airedales"],
  DOBP: ["Doberman", "Dobermans"],
  CKCS: ["Cavalier King Charles spaniel", "Cavalier King Charles spaniels"],
  STBD: ["Saint Bernard", "St. Bernard", "Saint Bernards"],
  SSHP: ["sheltie", "shelties"],
  BMD: ["Bernese", "Bernese mountain dog", "Bernese mountain dogs"],
  BULD: ["bulldog", "bulldogs", "English bulldog", "English bulldogs"],
  CIRN: ["Cirneco"],
};
const breedPatterns = [];
for (const [code, b] of Object.entries(tree.breeds)) {
  if (SKIP_NAMES.has(code)) continue;
  const names = new Set([b.name, ...(ALIAS[code] ?? [])]);
  // Plurals of the full name: "boxers", "pugs", "basenjis".
  if (!/s$/i.test(b.name)) names.add(b.name + "s");
  for (const n of names) breedPatterns.push({ kind: "B", id: code, text: n });
}
const CLADE_ALIAS = {
  AsianSpitz: ["Asian spitz"],
  AsianToy: ["Asian toy"],
  NordicSpitz: ["Nordic spitz"],
  SmallSpitz: ["small spitz"],
  ToySpitz: ["toy spitz"],
  AmericanToy: ["American toy"],
  AmericanTerrier: ["American terrier", "American terriers"],
  NewWorld: ["New World"],
  ScentHound: ["scent hound", "scent hounds"],
  PointerSetter: ["pointer-setter", "pointer setter", "pointers and setters"],
  ContinentalHerder: ["Continental herder", "Continental herders"],
  UKRural: ["UK Rural"],
  EuropeanMastiff: ["European mastiff", "European mastiffs"],
  Mediterranean: ["Mediterranean"],
};
const cladePatterns = Object.entries(CLADE_ALIAS).flatMap(([id, ns]) => ns.map((text) => ({ kind: "Clade", id, text })));
const TERM_ALIAS = {
  haplotype: ["haplotype", "haplotypes", "identical-by-descent"],
  clade: ["clade", "clades"],
  cladogram: ["cladogram", "cladograms"],
  bootstrap: ["bootstrapping", "bootstrap", "bootstraps"],
  dna: ["DNA"],
};
const termPatterns = Object.entries(TERM_ALIAS).flatMap(([id, ns]) => ns.map((text) => ({ kind: "Term", id, text })));

// One regex, longest names first so "Italian greyhound" wins over "greyhound".
const all = [...breedPatterns, ...cladePatterns, ...termPatterns].sort((a, b) => b.text.length - a.text.length);
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[ -]/g, (c) => (c === " " ? "\\s+" : "[-\\s]"));
const RE = new RegExp(`(?<![\\w-])(${all.map((p) => esc(p.text)).join("|")})(?![\\w-])`, "gi");
const norm = (s) => s.replace(/[\s-]+/g, " ").toLowerCase();
const lookup = (m) => all.find((p) => norm(p.text) === norm(m));

// ---------- walk the JSX ----------
const PROSE = new Set(["p", "li", "figcaption"]);
const INLINE = new Set(["strong", "em", "span", "b", "i"]);
const LINKED = new Set(["B", "Term", "Clade", "a", "Link"]);
const nameOf = (el) => (el.type === "JSXElement" && el.openingElement.name.type === "JSXIdentifier" ? el.openingElement.name.name : null);

function visit(node, fn, parents = []) {
  if (!node || typeof node.type !== "string") return;
  fn(node, parents);
  for (const k of Object.keys(node)) {
    if (k === "loc" || k === "start" || k === "end" || k === "extra") continue;
    const v = node[k];
    const next = [...parents, node];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && visit(c, fn, next));
    else if (v && typeof v.type === "string") visit(v, fn, next);
  }
}

const write = process.argv.includes("--write");
for (const file of process.argv.slice(2).filter((a) => !a.startsWith("--"))) {
  const src = readFileSync(file, "utf8");
  const ast = parse(src, { sourceType: "module", plugins: ["jsx", "typescript"] });
  const edits = [];
  const used = new Map(); // scope node -> Set of "kind:id"
  const seen = (scope, key) => {
    const s = used.get(scope) ?? used.set(scope, new Set()).get(scope);
    if (s.has(key)) return true;
    s.add(key);
    return false;
  };
  const scopes = (parents) => {
    const els = parents.filter((p) => p.type === "JSXElement" || p.type === "JSXFragment");
    let para = null;
    for (let i = els.length - 1; i >= 0; i--) {
      const nm = nameOf(els[i]);
      if (PROSE.has(nm)) { para = els[i]; break; }
      if (!INLINE.has(nm) && !LINKED.has(nm)) break;
    }
    return { els, para, block: els[0] };
  };
  // What's already linked counts as used, so reruns don't double up.
  visit(ast.program, (n, parents) => {
    const nm = nameOf(n);
    if (!["B", "Term", "Clade"].includes(nm)) return;
    const attr = n.openingElement.attributes.find((a) => a.name && (a.name.name === "c" || a.name.name === "id"));
    const { para, block } = scopes(parents);
    if (block) seen(nm === "B" ? para ?? block : block, `${nm}:${attr?.value?.value}`);
  });
  visit(ast.program, (n, parents) => {
    if (n.type !== "JSXText") return;
    const { els, para, block } = scopes(parents);
    if (!els.length || !para) return;
    if (LINKED.has(nameOf(els[els.length - 1]))) return;
    // The raw source, not n.value: Babel turns \r\n into \n there, which would shift offsets.
    const text = src.slice(n.start, n.end);
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(text))) {
      const p = lookup(m[1]);
      if (!p) continue;
      if (seen(p.kind === "B" ? para : block, `${p.kind}:${p.id}`)) continue;
      const attr = p.kind === "B" ? `c="${p.id}"` : `id="${p.id}"`;
      edits.push({ start: n.start + m.index, end: n.start + m.index + m[1].length, open: `<${p.kind} ${attr}>`, close: `</${p.kind}>`, word: m[1].replace(/\s+/g, " "), p });
    }
  });
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.open + out.slice(e.start, e.end) + e.close + out.slice(e.end);
  // JSX drops whitespace that contains a line break next to a tag, so text that ran across a
  // line ("and\n samoyed") would lose its space once a word at either end becomes a tag.
  out = out
    .replace(/([^\s>}])([ \t]*)(\r?\n[ \t]*)(<(?:B|Term|Clade) )/g, '$1{" "}$3$4')
    .replace(/(<\/(?:B|Term|Clade)>)([ \t]*)(\r?\n[ \t]*)([^\s<{)])/g, '$1{" "}$3$4');
  const counts = edits.reduce((c, e) => ((c[e.p.kind] = (c[e.p.kind] ?? 0) + 1), c), {});
  console.log(`${file}: ${edits.length} links ${JSON.stringify(counts)}`);
  if (!write) {
    const byKind = {};
    for (const e of [...edits].reverse()) (byKind[e.p.kind] ??= []).push(`${e.word}→${e.p.id}`);
    for (const [k, v] of Object.entries(byKind)) console.log(`  ${k}: ${v.join(", ")}`);
  } else if (edits.length) {
    // Make sure the file imports what it now uses.
    const need = ["B", "Clade", "Term"].filter((k) => out.includes(`<${k} `));
    const hasImport = /from "@\/components\/Hints"|from "\.\/Hints"/.test(out);
    if (need.length && !hasImport) {
      const from = file.replace(/\\/g, "/").includes("/components/") ? "./Hints" : "@/components/Hints";
      // On its own line after the last import (edits are all in JSX, below the imports).
      const lastImport = ast.program.body.filter((s) => s.type === "ImportDeclaration").at(-1);
      const at = out.indexOf("\n", lastImport.end) + 1;
      out = out.slice(0, at) + `import { ${need.join(", ")} } from "${from}";\n` + out.slice(at);
    }
    writeFileSync(file, out);
  }
}
