// Clade hues for the dark "night herbarium" surface (#0d1110), in ring order.
// Generated in OKLCH (L 0.56-0.67, C>=0.1) stepping ~165deg of hue between ring
// neighbours, then checked with the dataviz validator: adjacent normal-vision dE>=25,
// worst adjacent CVD dE 5.8. Twenty-three classes cannot all be told apart by hue, so
// identity never rests on color alone: clade arcs are direct-labelled and the
// tooltip names the clade.
import { isLight, type Theme } from "./theme";

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

/**
 * The same hues for light mode's surface (#f3f8f5). Each dark color is kept where it already
 * reads at >= 3:1 against it (the WCAG minimum for graphics) and otherwise darkened in OKLCH
 * lightness only, so 14 of 23 are identical to the dark set. Adjacent normal-vision dE >= 25.7,
 * worst adjacent CVD dE 4.5; as in dark mode, families are also named, never color alone.
 */
export const CLADE_COLOR_LIGHT: Record<string, string> = {
  Alpine: "#d35e2c",
  EuropeanMastiff: "#169caa",
  Drover: "#d4556c",
  UKRural: "#11a189",
  ContinentalHerder: "#c459a1",
  Retriever: "#309f47",
  PointerSetter: "#a665cb",
  Spaniel: "#87960b",
  ScentHound: "#7976e3",
  Mediterranean: "#b2890d",
  NewWorld: "#2d88e2",
  Terrier: "#c76a00",
  Pinscher: "#1694b5",
  AmericanTerrier: "#e5665c",
  AmericanToy: "#0a9a97",
  Poodle: "#df6597",
  Hungarian: "#199e6e",
  SmallSpitz: "#b75fb8",
  ToySpitz: "#60991d",
  Schnauzer: "#9f7be8",
  NordicSpitz: "#968800",
  AsianToy: "#658af2",
  AsianSpitz: "#b6770b",
};

export const UNCLUSTERED = "#7d847e";
export const OUTGROUP = "#d9d3c4";
const UNCLUSTERED_LIGHT = "#76877f";
const OUTGROUP_LIGHT = "#1d3a30";

/**
 * A clade's color as a hex string, for code that paints (D3, canvas). Dark unless light mode
 * is on; pass `theme` from useTheme() in render code so the server and first client render
 * agree. Charts redraw when the switch changes.
 */
export const cladeColor = (clade: string | null, code?: string, theme?: Theme) => {
  const light = theme ? theme === "light" : isLight();
  if (clade) return (light ? CLADE_COLOR_LIGHT : CLADE_COLOR)[clade];
  if (code === "WOLF" || code === "GDJK") return light ? OUTGROUP_LIGHT : OUTGROUP;
  return light ? UNCLUSTERED_LIGHT : UNCLUSTERED;
};

/**
 * The same color as a CSS variable (`var(--clade-Alpine, #d35e2c)`), for inline styles and
 * SVG attributes in React: the stylesheet switches it with the theme, so it needs no hook,
 * works in server components, and never mismatches on hydration. The fallback is the dark
 * value, so the result is identical in dark mode.
 */
export const cladeVar = (clade: string | null, code?: string) => {
  const key = clade ?? (code === "WOLF" || code === "GDJK" ? "wild" : "none");
  return `var(--clade-${key}, ${cladeColor(clade, code, "dark")})`;
};
