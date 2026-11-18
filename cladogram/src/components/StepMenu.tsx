"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * The step read-out above a scroller's chart ("05 / 18 · Title"), as a button that opens a list
 * of every step; picking one scrolls the page to it.
 */
export default function StepMenu({ steps, active }: { steps: { id: string; title: string }[]; active: number }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const menuId = useId();
  const step = steps[active];

  // Close on a click outside or Escape; opening puts focus on the current step.
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLButtonElement>('[aria-current="step"]')?.focus({ preventScroll: true });
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      wrap.current?.querySelector<HTMLButtonElement>(".step-menu-btn")?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const go = (i: number) => {
    setOpen(false);
    const el = document.getElementById(steps[i].id);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${steps[i].id}`);
  };

  // Up and down arrows move through the list.
  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const items = [...(list.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === "Home" ? 0 : e.key === "End" ? items.length - 1 : Math.min(items.length - 1, Math.max(0, at + (e.key === "ArrowDown" ? 1 : -1)));
    items[next]?.focus();
  };

  return (
    <div className="figure-meta" ref={wrap}>
      <button
        type="button"
        className="step-menu-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Step ${active + 1} of ${steps.length}: ${step.title}. Jump to another step`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="counter">
          {String(active + 1).padStart(2, "0")}
          <span> / {steps.length}</span>
        </span>
        <span className="figure-title">{step.title}</span>
        <span className="step-menu-caret" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <ol className="step-menu" id={menuId} ref={list} aria-label="Steps" onKeyDown={onListKey}>
          {steps.map((s, i) => (
            <li key={s.id}>
              <button type="button" aria-current={i === active ? "step" : undefined} onClick={() => go(i)}>
                <span className="step-menu-n">{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
