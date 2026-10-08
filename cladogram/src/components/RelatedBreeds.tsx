"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
import { dnaRelatives, treeRelatives } from "@/lib/relatives";

const MAX_DNA = 8;

function BreedButton({ code, onSelect }: { code: string; onSelect: (c: string) => void }) {
  return (
    <button type="button" className="rel-name" onClick={() => onSelect(code)}>
      <i style={{ background: cladeColor(data.breeds[code].clade, code) }} aria-hidden />
      {data.breeds[code].name}
    </button>
  );
}

/** Related breeds for the explore panel: tree cousins, then DNA-sharing partners as % of genome. */
export default function RelatedBreeds({ code, onSelect }: { code: string; onSelect: (c: string) => void }) {
  const cousins = useMemo(() => treeRelatives(code, 5), [code]);
  const dna = useMemo(() => dnaRelatives(code), [code]);
  // Bars share one scale across breeds so a long bar always means the same amount.
  const x = useMemo(() => d3.scaleLinear().domain([0, 18]).range([0, 100]).clamp(true), []);
  const name = data.breeds[code].name;

  return (
    <div className="related">
      <h3 className="rel-h">Closest cousins on the family tree</h3>
      <ol className="rel-list">
        {cousins.map((c) => (
          <li key={c.code}>
            <BreedButton code={c.code} onSelect={onSelect} />
            <span className="rel-meta">
              {c.splits === 1 ? "next branch over" : `${c.splits} splits back`}
            </span>
          </li>
        ))}
      </ol>

      <h3 className="rel-h">Shares the most DNA with</h3>
      {dna.length ? (
        <>
          <ol className="rel-list rel-bars">
            {dna.slice(0, MAX_DNA).map((r) => (
              <li key={r.code}>
                <BreedButton code={r.code} onSelect={onSelect} />
                <span className="rel-bar" aria-hidden>
                  <span style={{ width: `${x(r.pct)}%`, background: cladeColor(data.breeds[r.code].clade, r.code) }} />
                </span>
                <span className="rel-pct">{r.pct < 1 ? r.pct.toFixed(1) : Math.round(r.pct)}%</span>
              </li>
            ))}
          </ol>
          {dna.length > MAX_DNA && <p className="rel-more">+ {dna.length - MAX_DNA} more breeds with smaller overlaps</p>}
          <p className="rel-note">
            The percent is how much of their DNA a typical {name} and a typical dog of the other
            breed share in long, identical chunks, the kind that only survive a few generations. For scale,
            the most closely tied pair in the whole study, the bull terrier and miniature bull
            terrier, share about 17%. Between two separate breeds, even 1% points to a fairly
            recent cross or shared founding dogs.
          </p>
        </>
      ) : (
        <p className="rel-note">
          No other breed shares big chunks of DNA with the {name}. It has kept to itself, with
          no recent crosses that show up in the data.
        </p>
      )}
    </div>
  );
}
