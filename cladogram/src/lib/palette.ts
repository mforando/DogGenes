// Clade hues for the dark "night herbarium" surface (#0d1110), in ring order.
// Generated in OKLCH (L 0.56-0.67, C>=0.1) stepping ~165deg of hue between ring
// neighbours, then checked with the dataviz validator: adjacent normal-vision dE>=25,
// worst adjacent CVD dE 5.8. Twenty-three classes cannot all be told apart by hue, so
// identity never rests on color alone: clade arcs are direct-labelled and the
// tooltip names the clade.
export const CLADE_COLOR: Record<string, string> = {
  Alpine: "#d35e2c",
  EuropeanMastiff: "#1ca8b7",
  Drover: "#d4556c",
  UKRural: "#19ad94",
  ContinentalHerder: "#c459a1",
  Retriever: "#309f47",
  PointerSetter: "#a665cb",
  Spaniel: "#90a013",
  ScentHound: "#7976e3",
  Mediterranean: "#b88f1b",
  NewWorld: "#2d88e2",
  Terrier: "#c76a00",
  Pinscher: "#1794b5",
  AmericanTerrier: "#e7685d",
  AmericanToy: "#1f9996",
  Poodle: "#df6597",
  Hungarian: "#199e6e",
  SmallSpitz: "#b75fb8",
  ToySpitz: "#60991d",
  Schnauzer: "#a17dea",
  NordicSpitz: "#968800",
  AsianToy: "#698ff7",
  AsianSpitz: "#b6770b",
};

export const UNCLUSTERED = "#7d847e";
export const OUTGROUP = "#d9d3c4";

export const cladeColor = (clade: string | null, code?: string) =>
  clade ? CLADE_COLOR[clade] : code === "WOLF" || code === "GDJK" ? OUTGROUP : UNCLUSTERED;
