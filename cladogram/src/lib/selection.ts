/**
 * A toy population-genetics model contrasting natural selection with breeding.
 *
 * Each dog has a body-size score (0 = tiny, 1 = huge), one of four founder lines it
 * descends from, and possibly a hidden (recessive) disease variant. Both runs start
 * from the same population and last the same 20 generations:
 *
 * - natural: every dog may breed; slightly smaller dogs leave a few more pups, and
 *   carriers of the disease variant leave slightly fewer.
 * - artificial: a breeder only uses the smaller 60% of dogs as sires, and one
 *   "popular sire" (the smallest dog) fathers a quarter of every litter.
 *
 * Across seeds the pattern is the same: natural changes little and keeps most founder
 * lines; breeding shrinks the dogs fast, loses most founder lines, and the disease
 * variant often spreads because nobody selects against what they can't see. The seed
 * picks a run where all of that shows clearly.
 */

export type Dog = { t: number; lin: number; carrier: boolean; sire?: boolean };
export type Mode = "natural" | "artificial";

export const N_DOGS = 90;
export const GENERATIONS = 20;
export const N_LINES = 4;
const SEED = 24;

function mulberry(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Every generation of one run, generation 0 first. */
export function simulate(mode: Mode, seed = SEED): Dog[][] {
  const r = mulberry(seed);
  const z = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const clamp = (v: number) => Math.max(0.02, Math.min(0.98, v));
  let pop: Dog[] = Array.from({ length: N_DOGS }, (_, i) => ({ t: clamp(0.72 + 0.07 * z()), lin: i % N_LINES, carrier: false }));
  // Two dogs carry the hidden variant, one of them the smallest dog.
  const sorted = [...pop].sort((a, b) => a.t - b.t);
  sorted[0].carrier = true;
  sorted[40].carrier = true;
  const gens: Dog[][] = [pop];
  for (let g = 1; g <= GENERATIONS; g++) {
    const kids: Dog[] = [];
    const child = (a: Dog, b: Dog): Dog => ({
      t: clamp((a.t + b.t) / 2 + 0.05 * z()),
      lin: (r() < 0.5 ? a : b).lin,
      carrier: (r() < 0.5 ? a : b).carrier,
    });
    if (mode === "natural") {
      const w = pop.map((p) => Math.exp(-0.8 * (p.t - 0.72)) * (p.carrier ? 0.85 : 1));
      const W = w.reduce((a, b) => a + b, 0);
      const pick = () => {
        let x = r() * W;
        for (let i = 0; i < N_DOGS; i++) if ((x -= w[i]) <= 0) return pop[i];
        return pop[N_DOGS - 1];
      };
      for (let j = 0; j < N_DOGS; j++) kids.push(child(pick(), pick()));
    } else {
      const s = [...pop].sort((a, b) => a.t - b.t);
      const sires = s.slice(0, Math.round(N_DOGS * 0.6));
      for (let j = 0; j < N_DOGS; j++) {
        const q = r();
        const sire = q < 0.25 ? sires[0] : sires[1 + Math.floor(r() * (sires.length - 1))];
        const dam = pop[Math.floor(r() * N_DOGS)];
        kids.push(child(sire, dam));
      }
      // Mark the popular sire of the generation that produced these pups.
      gens[g - 1] = gens[g - 1].map((d) => (d === s[0] ? { ...d, sire: true } : d));
    }
    pop = kids;
    gens.push(pop);
  }
  return gens;
}

export function summary(pop: Dog[]) {
  const mean = pop.reduce((a, d) => a + d.t, 0) / pop.length;
  return {
    mean,
    lines: new Set(pop.map((d) => d.lin)).size,
    carriers: pop.filter((d) => d.carrier).length / pop.length,
  };
}
