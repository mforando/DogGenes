"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { track } from "@/lib/track";
import { createPortal } from "react-dom";
import { TERMS, TermBody, TermFigure, type TermId } from "./Primer";
import { data } from "@/lib/tree";
import { cladeVar } from "@/lib/palette";
import { photoOf } from "@/lib/photos";
import { BreedFactsBlock } from "@/lib/breedFacts";

/**
 * Interactive words in the story text. `<B c="EURA">Eurasier</B>` shows the breed's photo and
 * highlights it on whatever chart is beside the text; `<Term id="haplotype">haplotypes</Term>`
 * shows the glossary diagram and definition; `<Clade id="AsianSpitz">Asian spitz</Clade>`
 * highlights a whole family. A page opts in to the chart highlighting by wrapping its text
 * in a `HintProvider` with `onBreed` / `onClade`; without one the words still show their
 * pop-ups. Hover, keyboard focus or a tap opens a pop-up.
 */

type Pop = { kind: "breed" | "term" | "clade"; id: string; rect: DOMRect };

const HintCtx = createContext<{
  open: (p: Pop) => void;
  close: (id: string) => void;
  onBreed?: (code: string | null) => void;
  onClade?: (id: string | null) => void;
  /** The word whose pop-up is open, for aria-expanded. */
  openId: string | null;
} | null>(null);

export function HintProvider({
  children,
  onBreed,
  onClade,
  docked = [],
}: {
  children: ReactNode;
  onBreed?: (code: string | null) => void;
  onClade?: (id: string | null) => void;
  /** Kinds of word whose card the page shows in a panel of its own (no floating pop-up). */
  docked?: Pop["kind"][];
}) {
  const [pop, setPop] = useState<Pop | null>(null);
  // The last word opened, so re-hovering the same word isn't counted twice.
  const lastHint = useRef<string | null>(null);
  const open = useCallback((p: Pop) => {
    if (lastHint.current !== p.id) track("text_hint", { kind: p.kind, id: p.id });
    lastHint.current = p.id;
    setPop(p);
  }, []);
  // Only close if the pop-up still belongs to this word (enter/leave can arrive out of order).
  const close = useCallback((id: string) => setPop((p) => (p && p.id === id ? null : p)), []);
  // The pop-up is pinned to where the word was; scrolling moves the word, so let it go.
  useEffect(() => {
    if (!pop) return;
    const hide = () => {
      setPop(null);
      onBreed?.(null);
      onClade?.(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && hide();
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide);
      window.removeEventListener("keydown", onKey);
    };
  }, [pop, onBreed, onClade]);
  return (
    <HintCtx.Provider value={{ open, close, onBreed, onClade, openId: pop?.id ?? null }}>
      {children}
      {pop && !docked.includes(pop.kind) && typeof document !== "undefined" && createPortal(<HintPop pop={pop} />, document.body)}
    </HintCtx.Provider>
  );
}

// Pages that haven't wrapped their text still get pop-ups, from a provider of their own.
function useHint() {
  return useContext(HintCtx);
}

function Trigger({ kind, id, className, label, children }: { kind: Pop["kind"]; id: string; className: string; label: string; children: ReactNode }) {
  const ctx = useHint();
  const ref = useRef<HTMLSpanElement>(null);
  if (!ctx) return <Standalone kind={kind} id={id} className={className} label={label}>{children}</Standalone>;
  const enter = () => {
    ctx.open({ kind, id, rect: ref.current!.getBoundingClientRect() });
    if (kind === "breed") ctx.onBreed?.(id);
    if (kind === "clade") ctx.onClade?.(id);
  };
  const leave = () => {
    ctx.close(id);
    if (kind === "breed") ctx.onBreed?.(null);
    if (kind === "clade") ctx.onClade?.(null);
  };
  return (
    <span
      ref={ref}
      className={`hint ${className}`}
      tabIndex={0}
      role="button"
      aria-label={label}
      aria-expanded={ctx.openId === id}
      onKeyDown={(e) => {
        // Enter / Space open it like a button; Escape puts it away (WCAG 1.4.13).
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          enter();
        } else if (e.key === "Escape") leave();
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && enter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && leave()}
      onClick={enter}
      onFocus={enter}
      onBlur={leave}
    >
      {children}
    </span>
  );
}

function Standalone(props: { kind: Pop["kind"]; id: string; className: string; label: string; children: ReactNode }) {
  return (
    <HintProvider>
      <Trigger {...props} />
    </HintProvider>
  );
}

export function B({ c, children }: { c: string; children: ReactNode }) {
  const name = data.breeds[c]?.name ?? c;
  return <Trigger kind="breed" id={c} className="hint-breed" label={`${name}: show photo and highlight on the chart`}>{children}</Trigger>;
}

export function Term({ id, children }: { id: TermId; children: ReactNode }) {
  return <Trigger kind="term" id={id} className="hint-term" label={`${TERMS[id].word}: show definition`}>{children}</Trigger>;
}

export function Clade({ id, children }: { id: string; children: ReactNode }) {
  return <Trigger kind="clade" id={id} className="hint-clade" label={`${data.clades[id]} family: highlight on the chart`}>{children}</Trigger>;
}

/** Breeds in a family, in the order the tree draws them. */
const cladeBreeds = (id: string) => Object.entries(data.breeds).filter(([, b]) => b.clade === id).map(([c]) => c);

/**
 * What a word's card shows: a breed's photo, family and facts; a glossary diagram and
 * definition; or a family's breeds. `docked` is the larger version for a side panel.
 */
export function HintBody({ kind, id, docked = false }: { kind: Pop["kind"]; id: string; docked?: boolean }) {
  if (kind === "breed") {
    const b = data.breeds[id];
    const src = photoOf(id);
    return (
      <>
        {src && <img className={docked ? "tip-photo" : "hint-photo"} src={src} alt="" referrerPolicy="no-referrer" />}
        <div className="tip-name">{b?.name}</div>
        <div className="hint-fam">
          <i style={{ background: cladeVar(b?.clade ?? null, id) }} />
          {b?.clade ? `${data.clades[b.clade]} family` : id === "WOLF" || id === "GDJK" ? "Wild relative" : "No clear family"}
        </div>
        <BreedFactsBlock code={id} />
      </>
    );
  }
  if (kind === "term") {
    const t = TERMS[id as TermId];
    return (
      <>
        <div className="hint-fig"><TermFigure id={id as TermId} /></div>
        <div className="tip-name">
          {t.word}
          {t.say && <span className="say"> {t.say}</span>}
        </div>
        <div className="hint-def">
          <TermBody id={id as TermId} />
        </div>
      </>
    );
  }
  const codes = cladeBreeds(id);
  return (
    <>
      <div className="tip-name">
        <i className="hint-swatch" style={{ background: cladeVar(id) }} />
        {data.clades[id]} family
      </div>
      <div className="tip-sub">{codes.length} breeds, highlighted on the chart</div>
      {docked ? (
        <ul className="dock-thumbs">
          {codes.slice(0, 12).map((c) => {
            const src = photoOf(c);
            return (
              <li key={c}>
                {src ? <img src={src} alt="" referrerPolicy="no-referrer" /> : <span />}
                {data.breeds[c].name}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="hint-thumbs">
          {codes.slice(0, 8).map((c) => {
            const src = photoOf(c);
            return src ? <img key={c} src={src} alt={data.breeds[c].name} title={data.breeds[c].name} referrerPolicy="no-referrer" /> : null;
          })}
        </div>
      )}
      {docked && codes.length > 12 && <div className="tip-sub">and {codes.length - 12} more</div>}
    </>
  );
}

function HintPop({ pop }: { pop: Pop }) {
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  useEffect(() => {
    const el = box.current!;
    const { rect } = pop;
    const w = el.offsetWidth, h = el.offsetHeight;
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - w / 2, window.innerWidth - w - 8));
    // Below the word if it fits, otherwise above.
    const top = rect.bottom + 8 + h < window.innerHeight ? rect.bottom + 8 : Math.max(8, rect.top - 8 - h);
    setPos({ left, top });
  }, [pop]);

  const body = <HintBody kind={pop.kind} id={pop.id} />;
  return (
    <div
      ref={box}
      className={`hint-pop hint-pop-${pop.kind}`}
      role="status"
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}
    >
      {body}
    </div>
  );
}
