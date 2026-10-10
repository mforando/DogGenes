"use client";

import { photoOf } from "@/lib/photos";
import { agoLabel, ANCIENT_BREEDS } from "@/lib/history";

/** Breeds whose lineage predates modern breeding, with an approximate origin or "Unknown". */
export default function AncientBreeds() {
  const dated = ANCIENT_BREEDS.filter((b) => b.ago).length;
  return (
    <div className="ancient">
      <p className="ancient-h">
        <span className="ancient-badge">Older than 200 years</span>
        A dozen breeds with roots far older than modern breeding
      </p>
      <ul className="ancient-grid">
        {ANCIENT_BREEDS.map((b) => {
          const url = photoOf(b.code);
          return (
            <li key={b.code} className="ancient-card">
              {url && <img src={url} alt={b.name} loading="lazy" referrerPolicy="no-referrer" />}
              <div className="ancient-text">
                <p className="ancient-name">{b.name}</p>
                <p className="ancient-from">{b.from}</p>
                <p className={`ancient-age${b.ago ? "" : " unknown"}`} title={b.dateNote}>
                  {agoLabel(b)}
                </p>
                <p className="ancient-note">{b.note}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="ancient-fine">
        Dates are for the <em>type</em> of dog, from the earliest dated evidence on Wikipedia: a
        genetic lineage, a skeleton, or a dated artwork. {dated} of the 12 have one; for the
        rest the origin is unknown. Written breed standards are modern, and most of these breeds
        have been mixed with others along the way.
      </p>
    </div>
  );
}
