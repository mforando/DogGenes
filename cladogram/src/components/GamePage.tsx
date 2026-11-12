"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import raw from "@/data/game.json";
import { SiteNav } from "./shared";
import { Lv } from "@/lib/readingLevel";

type Photo = { u: string; ai: [string, number][]; ok: boolean };
type Breed = {
  id: string;
  name: string;
  akc: number | null;
  pools: string[];
  aiKnows: boolean;
  photos: Photo[];
  /** Other breeds in its clade (family group) in the 2017 study, from all the study's breeds. */
  clade: string[];
  /** Breeds in other clades that share significant DNA with it, most shared first. */
  dna: string[];
};
const G = raw as unknown as { model: string; breeds: Breed[] };

type Level = "easy" | "medium" | "hard";
type Mode = "choice" | "search";
const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "AKC top 30" },
  { id: "medium", label: "Medium", hint: "AKC top 60" },
  { id: "hard", label: "Hard", hint: "All 120 breeds the AI was trained on" },
];
const MODES: { id: Mode; label: string }[] = [
  { id: "choice", label: "Multiple choice" },
  { id: "search", label: "Type the breed" },
];
const LENGTH = 20;
const CHOICES = 4;
const HISTORY_KEY = "dg-game-history";

type Question = { breed: Breed; photo: Photo; options: string[] };
type Answer = { pick: string; right: boolean; aiRight: boolean };
type Result = { when: string; level: Level; mode: Mode; pct: number; ai: number };

/** Fisher–Yates shuffle (a copy). */
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const pickOne = <T,>(xs: T[]): T | undefined => xs[Math.floor(Math.random() * xs.length)];

/**
 * Three wrong answers, hardest first: a breed from the same clade, a breed from another
 * clade that shares DNA with it (both drawn from all of the study's breeds, not just this
 * difficulty), and a random breed from this difficulty. Missing ones are filled at random.
 */
function wrongAnswers(breed: Breed, pool: Breed[]): string[] {
  const out: string[] = [];
  const add = (n?: string) => {
    if (n && n !== breed.name && !out.includes(n)) out.push(n);
  };
  add(pickOne(breed.clade));
  add(pickOne(breed.dna.filter((n) => !out.includes(n))));
  const rest = shuffle(pool.map((b) => b.name));
  for (const n of rest) {
    if (out.length === CHOICES - 1) break;
    add(n);
  }
  return out;
}

/** 20 random breeds from the pool, one random photo each, and 3 wrong answers each. */
function makeQuiz(level: Level): Question[] {
  const pool = G.breeds.filter((b) => b.pools.includes(level));
  return shuffle(pool)
    .slice(0, LENGTH)
    .map((breed) => {
      const wrong = wrongAnswers(breed, pool);
      return {
        breed,
        photo: breed.photos[Math.floor(Math.random() * breed.photos.length)],
        options: shuffle([breed.name, ...wrong]),
      };
    });
}

function readHistory(): Result[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

function Toggle<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; label: string; hint?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="dg-toggle" role="radiogroup" aria-label={label}>
      <span className="dg-toggle-label">{label}</span>
      <div className="level-toggle">
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} title={o.hint} className={value === o.id ? "on" : ""} onClick={() => onChange(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** What the AI saw: its top three guesses as bars. */
function AiPanel({ q }: { q: Question }) {
  const top = q.photo.ai;
  return (
    <div className="dg-ai">
      <p className="dg-ai-h">The AI&rsquo;s guesses</p>
      <ol>
        {top.map(([name, p], i) => (
          <li key={i} className={name === q.breed.name || (i === 0 && q.photo.ok) ? "hit" : ""}>
            <span className="dg-ai-name">{name}</span>
            <span className="dg-ai-bar" aria-hidden>
              <span style={{ width: `${Math.max(2, p * 100)}%` }} />
            </span>
            <span className="dg-ai-p">{pct(p)}</span>
          </li>
        ))}
      </ol>
      {!q.breed.aiKnows && (
        <p className="dg-ai-note">
          <Lv
            puppy={<>Nobody ever taught the AI what a {q.breed.name} looks like, so it had no chance on this one.</>}
            pro={<>{q.breed.name} is not among the classifier&rsquo;s 120 ImageNet dog classes, so a correct top-1 prediction was impossible.</>}
          >
            The AI was never taught the {q.breed.name}, so it couldn&rsquo;t get this one right.
          </Lv>
        </p>
      )}
    </div>
  );
}

export default function GamePage() {
  const [level, setLevel] = useState<Level>("easy");
  const [mode, setMode] = useState<Mode>("choice");
  const [quiz, setQuiz] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [typed, setTyped] = useState("");
  const [typedError, setTypedError] = useState("");
  const [history, setHistory] = useState<Result[]>([]);

  // Quizzes are random per visit, so build them in the browser (not at build time).
  const restart = useCallback((l: Level) => {
    setQuiz(makeQuiz(l));
    setAnswers([]);
    setTyped("");
    setTypedError("");
  }, []);
  useEffect(() => {
    restart(level);
    setHistory(readHistory());
  }, [level, restart]);

  const poolNames = useMemo(() => G.breeds.filter((b) => b.pools.includes(level)).map((b) => b.name).sort(), [level]);
  const i = answers.length;

  // ---- answering ----
  const [revealed, setRevealed] = useState(false);
  const current = quiz?.[revealed ? i - 1 : i];
  const submit = (pick: string) => {
    if (!quiz || revealed || !current) return;
    setAnswers((a) => [...a, { pick, right: pick === current.breed.name, aiRight: current.photo.ok }]);
    setRevealed(true);
  };
  const next = () => {
    setRevealed(false);
    setTyped("");
    setTypedError("");
    if (answers.length === LENGTH) {
      const you = answers.filter((a) => a.right).length / LENGTH;
      const ai = answers.filter((a) => a.aiRight).length / LENGTH;
      const r: Result = { when: new Date().toISOString(), level, mode, pct: you, ai };
      const h = [r, ...readHistory()].slice(0, 50);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
      } catch {}
      setHistory(h);
      setFinished(r);
    }
  };
  const [finished, setFinished] = useState<Result | null>(null);
  useEffect(() => setFinished(null), [level, mode, quiz]);

  const you = answers.filter((a) => a.right).length;
  const ai = answers.filter((a) => a.aiRight).length;
  const last = answers[answers.length - 1];
  const shown = revealed ? quiz?.[i - 1] : current;

  const onType = () => {
    const match = poolNames.find((n) => n.toLowerCase() === typed.trim().toLowerCase());
    if (!match) {
      setTypedError("Pick a breed from the list as you type.");
      return;
    }
    submit(match);
  };

  const best = (l: Level, m: Mode) => history.filter((h) => h.level === l && h.mode === m).reduce((x, h) => Math.max(x, h.pct), -1);

  return (
    <>
      <SiteNav />
      <main className="purpose dg">
        <header className="pairs-head">
          <p className="eyebrow">Dog Breed Game</p>
          <h1>Can you beat the AI?</h1>
          <p className="pairs-lede">
            <Lv
              puppy={<>Guess the breed in each photo! After you answer, you&rsquo;ll see what a computer program (an AI) guessed for the same picture. Each round has 20 dogs, picked at random just for you.</>}
              pro={<>Classify the breed in each image, then compare with a pretrained convolutional image classifier&rsquo;s top-3 predictions for the same image. Twenty images per round, sampled at random.</>}
            >
              Name the breed in each photo. After every answer you&rsquo;ll see what an image-recognition
              AI guessed for the same photo. Twenty dogs per round, picked at random for you.
            </Lv>
          </p>
          <div className="dg-controls">
            <Toggle label="Difficulty" value={level} options={LEVELS.map((l) => ({ ...l, label: `${l.label} · ${l.hint}` }))} onChange={(l) => setLevel(l)} />
            <Toggle
              label="Answer by"
              value={mode}
              options={MODES}
              onChange={(m) => {
                setMode(m);
                restart(level);
              }}
            />
          </div>
        </header>

        {!quiz ? (
          <p className="dg-loading">Shuffling the dogs…</p>
        ) : finished ? (
          <section className="dg-card dg-end" aria-live="polite">
            <p className="dg-kicker">Round complete</p>
            <p className="dg-final">
              You got <strong>{pct(finished.pct)}</strong> right
              <span> ({you} of {LENGTH})</span>
            </p>
            <p className="dg-vs">
              The AI got {pct(finished.ai)} ({ai} of {LENGTH}) on the same photos.{" "}
              <strong>{finished.pct > finished.ai ? "You beat the AI!" : finished.pct === finished.ai ? "It’s a tie." : "The AI wins this round."}</strong>
            </p>
            <button type="button" className="dg-primary" onClick={() => restart(level)}>
              Play another round
            </button>
            {history.length > 0 && (
              <div className="dg-history">
                <p className="dg-kicker">Your scores on this device</p>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">When</th>
                      <th scope="col">Difficulty</th>
                      <th scope="col">Answer by</th>
                      <th scope="col" className="num">You</th>
                      <th scope="col" className="num">AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 10).map((h, k) => (
                      <tr key={k}>
                        <td>{new Date(h.when).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
                        <td>{LEVELS.find((l) => l.id === h.level)?.label}</td>
                        <td>{MODES.find((m) => m.id === h.mode)?.label}</td>
                        <td className="num">{pct(h.pct)}</td>
                        <td className="num">{pct(h.ai)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="dg-best">
                  Best at this setting: {best(level, mode) >= 0 ? pct(best(level, mode)) : "—"}
                </p>
              </div>
            )}
          </section>
        ) : shown ? (
          <section className="dg-card" aria-live="polite">
            <div className="dg-top">
              <p className="dg-kicker">
                Dog {revealed ? i : i + 1} of {LENGTH}
              </p>
              <p className="dg-score">
                You <strong>{you}</strong> · AI <strong>{ai}</strong>
              </p>
            </div>
            <div className="dg-progress" aria-hidden>
              <span style={{ width: `${(answers.length / LENGTH) * 100}%` }} />
            </div>
            <div className="dg-photo">
              <img src={shown.photo.u} alt="A dog. Which breed is it?" referrerPolicy="no-referrer" />
            </div>

            {!revealed ? (
              mode === "choice" ? (
                <div className="dg-options">
                  {shown.options.map((o) => (
                    <button key={o} type="button" onClick={() => submit(o)}>
                      {o}
                    </button>
                  ))}
                </div>
              ) : (
                <form
                  className="dg-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    onType();
                  }}
                >
                  <label htmlFor="dg-input">Which breed is it?</label>
                  <div>
                    <input
                      id="dg-input"
                      list="dg-names"
                      value={typed}
                      autoComplete="off"
                      placeholder="Start typing a breed…"
                      onChange={(e) => {
                        setTyped(e.target.value);
                        setTypedError("");
                      }}
                    />
                    <datalist id="dg-names">
                      {poolNames.map((n) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                    <button type="submit" className="dg-primary">
                      Answer
                    </button>
                  </div>
                  {typedError && <p className="dg-error">{typedError}</p>}
                </form>
              )
            ) : (
              <div className="dg-reveal">
                <p className={`dg-verdict ${last.right ? "yes" : "no"}`}>
                  {last.right ? "Correct!" : "Not quite."} It&rsquo;s a <strong>{shown.breed.name}</strong>
                  {!last.right && <> (you said {last.pick})</>}.
                </p>
                <AiPanel q={shown} />
                <p className="dg-vs">
                  {last.right && !last.aiRight
                    ? "You beat the AI on this one!"
                    : !last.right && last.aiRight
                      ? "The AI got this one."
                      : last.right
                        ? "You and the AI both got it."
                        : "Neither of you got it."}
                </p>
                <button type="button" className="dg-primary" onClick={next} autoFocus>
                  {answers.length === LENGTH ? "See your score" : "Next dog →"}
                </button>
              </div>
            )}
          </section>
        ) : null}

        <footer className="pairs-foot">
          <p>
            Photos: <a href="https://dog.ceo/dog-api/">Dog CEO API</a>, mostly from the Stanford Dogs dataset. The AI is a{" "}
            {G.model}, an image classifier trained on ImageNet, which includes 120 dog breeds; its guesses
            were computed ahead of time for every photo. Most of these photos come from ImageNet, so the AI
            may have seen some of them while it was being trained. Easy and Medium use the 30 and 60
            highest-ranked AKC breeds of 2025 that have photos (the Cane Corso and a few others have none);
            Hard uses the AI&rsquo;s 120 breeds. Scores are saved only in this browser.
          </p>
        </footer>
      </main>
    </>
  );
}
