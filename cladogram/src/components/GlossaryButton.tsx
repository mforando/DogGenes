"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { TermCard, type TermId } from "./Primer";

/**
 * A red "?" fixed in the top-right corner while the glossary or the scroller is on screen.
 * Clicking it opens the glossary (the same term cards and diagrams) centered on screen.
 */
export default function GlossaryButton({ terms, watch }: { terms: TermId[]; watch: string[] }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // Show it while any watched section (the glossary, the scroller) is in view.
  useEffect(() => {
    const els = watch.map((sel) => document.querySelector(sel)).filter((e): e is Element => !!e);
    const onScreen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) onScreen.add(e.target);
          else onScreen.delete(e.target);
        }
        setVisible(onScreen.size > 0);
      },
      // A section only counts once it's 80px into the screen (not just touching an edge).
      { rootMargin: "-80px 0px -80px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [watch]);

  // While open: Escape closes, the page behind doesn't scroll, and focus moves into the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const opener = btn.current;
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  return (
    <>
      <div className={`gloss${visible ? " on" : ""}`}>
        <button
          ref={btn}
          type="button"
          className="gloss-btn"
          aria-label="Glossary: five words you’ll need"
          aria-haspopup="dialog"
          aria-expanded={open}
          tabIndex={visible ? 0 : -1}
          onClick={() => setOpen(true)}
        >
          ?
        </button>
      </div>
      {open && (
        <div className="gloss-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="gloss-dialog" role="dialog" aria-modal="true" aria-labelledby="gloss-h">
            <div className="gloss-head">
              <div>
                <p className="eyebrow">Quick glossary</p>
                <h2 id="gloss-h">Five words you&rsquo;ll need</h2>
              </div>
              <button ref={closeBtn} type="button" className="gloss-close" aria-label="Close glossary" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>
            <ul className="terms" style={{ "--n": terms.length } as CSSProperties}>
              {terms.map((id) => (
                <TermCard key={id} id={id} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
