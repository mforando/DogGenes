"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** A centered dialog over a dimmed page; Escape, the × or a backdrop click closes it. */
export default function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, []);
  return (
    <div className="gloss-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gloss-dialog modal-dialog" role="dialog" aria-modal="true" aria-label={label}>
        <button ref={closeBtn} type="button" className="gloss-close modal-close" aria-label="Close" onClick={onClose}>
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
