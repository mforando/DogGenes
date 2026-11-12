"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TERMS, TermBody, TermFigure, type TermId } from "./Primer";
import { data } from "@/lib/tree";
import { cladeColor } from "@/lib/palette";
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
} | null>(null);

export function HintProvider({
  children,
  onBreed,
  onClade,
}: {
  children: ReactNode;
  onBreed?: (code: string | null) => void;
  onClade?: (id: string | null) => void;
}) {
  const [pop, setPop] = useState<Pop | null>(null);
  const open = useCallback((p: Pop) => setPop(p), []);
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
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [pop, onBreed, onClade]);
  return (
    <HintCtx.Provider value={{ open, close, onBreed, onClade }}>
      {children}
      {pop && typeof document !== "undefined" && createPortal(<HintPop pop={pop} />, document.body)}
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
      aria-label={label}
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

  let body: ReactNode;
  if (pop.kind === "breed") {
    const b = data.breeds[pop.id];
    const src = photoOf(pop.id);
    body = (
      <>
        {src && <img className="hint-photo" src={src} alt="" referrerPolicy="no-referrer" />}
        <div className="tip-name">{b?.name}</div>
        <div className="hint-fam">
          <i style={{ background: cladeColor(b?.clade ?? null, pop.id) }} />
          {b?.clade ? `${data.clades[b.clade]} family` : pop.id === "WOLF" || pop.id === "GDJK" ? "Wild relative" : "No clear family"}
        </div>
        <BreedFactsBlock code={pop.id} />
      </>
    );
  } else if (pop.kind === "term") {
    const t = TERMS[pop.id as TermId];
    body = (
      <>
        <div className="hint-fig"><TermFigure id={pop.id as TermId} /></div>
        <div className="tip-name">
          {t.word}
          {t.say && <span className="say"> {t.say}</span>}
        </div>
        <div className="hint-def">
          <TermBody id={pop.id as TermId} />
        </div>
      </>
    );
  } else {
    const codes = cladeBreeds(pop.id);
    body = (
      <>
        <div className="tip-name">
          <i className="hint-swatch" style={{ background: cladeColor(pop.id) }} />
          {data.clades[pop.id]} family
        </div>
        <div className="tip-sub">{codes.length} breeds, highlighted on the chart</div>
        <div className="hint-thumbs">
          {codes.slice(0, 8).map((c) => {
            const src = photoOf(c);
            return src ? <img key={c} src={src} alt={data.breeds[c].name} title={data.breeds[c].name} referrerPolicy="no-referrer" /> : null;
          })}
        </div>
      </>
    );
  }
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
