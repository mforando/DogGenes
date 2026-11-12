"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import ExplorerMosaic, { type Arrange } from "./ExplorerMosaic";
import { SiteNav } from "./shared";
import { BREEDS, EX, JOB_GROUPS, photoUrl } from "@/lib/explorer";
import { cladeColor } from "@/lib/palette";
import { Lv } from "@/lib/readingLevel";
import { B, Term } from "./Hints";

const fmt = d3.format(",");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const ARRANGE: { id: Arrange; label: string }[] = [
  { id: "cluster", label: "Clustered" },
  { id: "family", label: "Family" },
  { id: "job", label: "Job" },
  { id: "region", label: "Region" },
  { id: "color", label: "Photo color" },
  { id: "map", label: "Map" },
];
const dogBreeds = BREEDS.filter((b) => b.family !== "_wild" && b.path !== "mix").length;
const byName = [...BREEDS].sort((a, b) => a.name.localeCompare(b.name));

/** CSS for drawing one thumbnail straight out of a sprite sheet. */
function spriteStyle(tile: number, size: number) {
  const sheet = Math.floor(tile / EX.perSheet);
  const slot = tile % EX.perSheet;
  const k = size / EX.tile;
  return {
    width: size,
    height: size,
    backgroundImage: `url(${BASE}/explorer/sheet-${sheet}.jpg)`,
    backgroundSize: `${EX.cols * EX.tile * k}px auto`,
    backgroundPosition: `-${(slot % EX.cols) * EX.tile * k}px -${Math.floor(slot / EX.cols) * EX.tile * k}px`,
  };
}

function Drawer({
  sel,
  onClose,
  onPhoto,
}: {
  sel: { breed: number; photo: number };
  onClose: () => void;
  onPhoto: (p: number) => void;
}) {
  const b = BREEDS[sel.breed];
  const [loaded, setLoaded] = useState(false);
  const url = photoUrl(b, sel.photo);
  useEffect(() => setLoaded(false), [url]);
  const job = JOB_GROUPS.find((j) => j.id === b.job)!.name;
  const color = b.family.startsWith("_") ? "#7d847e" : cladeColor(b.family);

  return (
    <aside className="ex-drawer" aria-label={`${b.name} photos`}>
      <div className="ex-drawer-top">
        <p className="ex-count">
          Photo {sel.photo + 1} of {b.files.length}
        </p>
        <button type="button" className="ex-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      <div className={`ex-photo${loaded ? " loaded" : ""}`}>
        <img src={url} alt={`${b.name}, photo ${sel.photo + 1}`} referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} />
        <button type="button" className="ex-prev" onClick={() => onPhoto((sel.photo - 1 + b.files.length) % b.files.length)} aria-label="Previous photo">‹</button>
        <button type="button" className="ex-next" onClick={() => onPhoto((sel.photo + 1) % b.files.length)} aria-label="Next photo">›</button>
      </div>
      <h2>{b.name}</h2>
      <dl className="ex-facts">
        <dt>Family</dt>
        <dd>
          <i style={{ background: color }} aria-hidden />
          {b.familyName}
        </dd>
        <dt>Original job</dt>
        <dd>{job}</dd>
        <dt>From</dt>
        <dd>
          {b.place}
          {b.place !== b.country && b.country !== "Designer cross" && b.country !== "Mixed breed" ? `, ${b.country}` : ""}
        </dd>
      </dl>
      {!b.code && b.family !== "_wild" && (
        <p className="ex-note">
          <Lv
            puppy={<>Scientists didn&rsquo;t test this breed&rsquo;s <Term id="dna">DNA</Term> in the 2017 study, so it isn&rsquo;t on the family tree.</>}
            pro={<>Not sampled in Parker et&nbsp;al. 2017, so it has no position in the <Term id="dna">genomic</Term> phylogeny.</>}
          >
            This breed wasn&rsquo;t sampled in the 2017 <Term id="dna">DNA</Term> study, so it isn&rsquo;t on the family tree.
          </Lv>
        </p>
      )}
      {b.family === "_wild" && <p className="ex-note"><Lv puppy="A wild cousin of dogs, not a dog breed. It’s in the photo collection anyway." pro="A wild canid, not a domestic breed; included in the Dog CEO collection.">A wild relative of dogs, not a dog breed. The Dog CEO collection includes it.</Lv></p>}
      <p className="ex-strip-h">All {b.files.length} photos</p>
      <ul className="ex-strip">
        {b.files.map((_, k) => (
          <li key={k}>
            <button
              type="button"
              className={k === sel.photo ? "on" : ""}
              onClick={() => onPhoto(k)}
              aria-label={`Photo ${k + 1}`}
              style={spriteStyle(b.start + k, 46)}
            />
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function BreedExplorer() {
  const [arrange, setArrange] = useState<Arrange>("cluster");
  const [showTree, setShowTree] = useState(true);
  const [size, setSize] = useState(22);
  // The clustered circle is too small to read on a phone; start phones on Family instead, with
  // smaller photos so the wall is about a third as long to scroll (the Size slider still works).
  useEffect(() => {
    if (window.innerWidth < 700) {
      setArrange("family");
      setSize(14);
    }
  }, []);
  const [loaded, setLoaded] = useState(0);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<{ breed: number; photo: number } | null>(null);

  const spotlight = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return byName.find((b) => b.name.toLowerCase() === q)?.index
      ?? byName.find((b) => b.name.toLowerCase().includes(q))?.index ?? null;
  }, [query]);

  const open = useCallback((breed: number, photo: number) => setSel({ breed, photo }), []);

  // Arrow keys flip through the open breed's photos; Escape closes.
  useEffect(() => {
    if (!sel) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      const n = BREEDS[sel.breed].files.length;
      if (e.key === "Escape") setSel(null);
      else if (e.key === "ArrowRight") setSel({ ...sel, photo: (sel.photo + 1) % n });
      else if (e.key === "ArrowLeft") setSel({ ...sel, photo: (sel.photo - 1 + n) % n });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel]);

  const done = loaded >= EX.total;

  return (
    <>
      <SiteNav />
      <main className={`explorer${sel ? " has-drawer" : ""}`}>
        <header className="ex-head">
          <p className="eyebrow">Breed Explorer</p>
          <h1>
            {fmt(EX.total)} dogs, <em>one wall</em>
          </h1>
          <p className="pairs-lede">
            <Lv
              puppy={<>Here are {fmt(EX.total)} dog photos of {dogBreeds} breeds, plus mixed breeds and a few wild cousins, all in one giant family picture! Breeds from the same part of the family tree sit together, and the oldest kinds of dogs sit closest to the <B c="WOLF">grey wolf</B> in the middle. Try sorting the wall by family, job, where they come from, or color, or put every dog on the map. Point at a photo to see the breed, and click to open it.</>}
              pro={<>The full Dog CEO image collection ({fmt(EX.total)} images of {dogBreeds} breeds, plus mixed breeds and wild canids), arranged as a single mosaic. Clusters follow clade membership in the phylogeny, with basal lineages placed nearest the <B c="WOLF">grey wolf</B> at the center. Re-sort by clade, original function, region of origin or mean image color, or project every image to its breed&rsquo;s origin on the map.</>}
            >
              Every photo in the Dog CEO collection: {fmt(EX.total)} pictures of {dogBreeds} breeds,
              plus mixed breeds and a few wild cousins, gathered into one family portrait. Breeds
              that share a branch of the family tree cluster together, and the oldest lineages sit
              closest to the <B c="WOLF">grey wolf</B> in the middle. Rearrange the wall by family group, original
              job, region, or photo color, or send every dog home on the map. Hover over a photo to
              see its breed and click to open it.
            </Lv>
          </p>
        </header>

        <div className="ex-bar" role="toolbar" aria-label="Arrange the photos">
          <div className="seg ex-seg">
            <span>Arrange by</span>
            {ARRANGE.map((a) => (
              <button key={a.id} type="button" aria-pressed={arrange === a.id} onClick={() => setArrange(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
          <label className="ex-size">
            <span>Size</span>
            <input
              type="range"
              min={12}
              max={48}
              step={2}
              value={size}
              disabled={arrange === "map" || arrange === "cluster"}
              onChange={(e) => setSize(+e.target.value)}
              aria-label="Photo size"
            />
          </label>
          {arrange === "cluster" && (
            <label className="check ex-tree">
              <input type="checkbox" checked={showTree} onChange={(e) => setShowTree(e.target.checked)} /> Family tree
            </label>
          )}
          <label className="ex-search">
            <span className="sr-only">Find a breed</span>
            <input
              type="search"
              list="ex-breeds"
              placeholder="Find a breed…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <datalist id="ex-breeds">
              {byName.map((b) => (
                <option key={b.path} value={b.name} />
              ))}
            </datalist>
          </label>
          {spotlight != null && (
            <button type="button" className="ex-open" onClick={() => open(spotlight, 0)}>
              Open {BREEDS[spotlight].name} ({BREEDS[spotlight].files.length})
            </button>
          )}
          <p className={`ex-loading${done ? " done" : ""}`} aria-live="polite">
            {done ? `${fmt(EX.total)} photos` : `Loading ${fmt(loaded)} of ${fmt(EX.total)} photos`}
            <span className="ex-loadbar" aria-hidden>
              <span style={{ width: `${(loaded / EX.total) * 100}%` }} />
            </span>
          </p>
        </div>

        <ExplorerMosaic
          arrange={arrange}
          tileSize={size}
          spotlight={spotlight}
          selected={sel}
          onOpen={open}
          onProgress={setLoaded}
          showTree={showTree}
        />

        {sel && <Drawer sel={sel} onClose={() => setSel(null)} onPhoto={(p) => setSel({ ...sel, photo: p })} />}

        <footer className="pairs-foot ex-foot">
          {/* Credits stay in full at every reading level. */}
          <p>
            Photos: the <a href="https://dog.ceo/dog-api/">Dog CEO API</a>, built on the
            Stanford Dogs dataset, shown as small thumbnails and loaded at full size when opened.
            Families come from Parker et&nbsp;al. 2017 for the breeds it sampled. Jobs and origins
            come from standard breed histories. &ldquo;Photo color&rdquo; sorts by the average
            color at the center of each photo, which is usually the dog but sometimes the grass.
          </p>
        </footer>
      </main>
    </>
  );
}
