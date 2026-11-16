/**
 * Light mode. Dark is the default and is drawn exactly as before; light mode is opt-in with
 * the switch in the top-right corner and is remembered on this device. The choice lives on
 * <html data-theme="light"> (absent in dark mode), set before first paint by a small inline
 * script in app/layout.tsx so a reader who chose light never sees a dark flash.
 *
 * CSS reads the attribute. Chart code, which paints its own colors, asks `tone()` at draw
 * time and redraws when the switch changes (`useTheme()` from lib/useTheme.ts in an effect's
 * dependencies, or `onThemeChange()` for canvases). This module has no React in it, so server
 * components can import the palette that depends on it.
 */
export type Theme = "light" | "dark";
const KEY = "dg-theme";
const EVENT = "dg-theme-change";

export const isLight = () => typeof document !== "undefined" && document.documentElement.dataset.theme === "light";
export const getTheme = (): Theme => (isLight() ? "light" : "dark");

export function setTheme(t: Theme) {
  if (t === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  try {
    if (t === "light") localStorage.setItem(KEY, "light");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the switch still works for this page view.
  }
  window.dispatchEvent(new CustomEvent<Theme>(EVENT, { detail: t }));
}

/** Calls `fn(theme)` whenever the switch changes. Returns an unsubscribe function. */
export function onThemeChange(fn: (t: Theme) => void) {
  const h = (e: Event) => fn((e as CustomEvent<Theme>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}

/** The dark value (today's literal, untouched) unless light mode is on. For draw-time code. */
export const tone = (dark: string, light: string) => (isLight() ? light : dark);
/** Same, for render code that already holds the theme from useTheme() (no hydration mismatch). */
export const pick = (theme: Theme, dark: string, light: string) => (theme === "light" ? light : dark);

/** Light-surface counterparts of the colors the charts draw with (the dark ones stay inline). */
export const LIGHT = {
  bg: "#f3f8f5",
  raise: "#e5efea",
  card: "#d9e6e0", // image placeholders, photo frames (was #1a211e)
  rule: "#c7d9d0",
  grid: "#d2e2da", // faint chart grid lines (was #1b2320 / #171e1b / #1c2420 / #18201c)
  band: "#dcebe4", // row hover bands (was #161d1a)
  ink: "#0d1f18", // bone-white ink becomes deep green-black, mirroring the dark ground
  ink2: "#24453a",
  muted: "#3e5f53",
  dim: "#9fb3aa", // labels that recede (was #4a524c / #3a423d / #2c3430)
  hi: "#04120d", // the brightest labels (was #fffaf0 / #ffffff)
  gold: "#9c5800",
  goldDim: "#b07400",
  goldSoft: "rgba(232, 183, 74, 0.28)",
  ice: "#1f6a94", // the Ice Age blue (was #8fb3c9)
  theory: "#a03c8c", // "where it may have started" (was #c58fb8)
  cyan: "#00737f", // DNA-sharing partner labels (was #5fd3e2)
  ocean0: "#d6ebf0",
  ocean1: "#bcdbe4",
  land: "#b5d0c0", // (was #26302b / #28322d)
  border: "#86a99a", // (was #3a4741 / #3d4a44)
  grat: "#c6dde3", // (was #1d2a27)
  shadow: "rgba(13, 31, 24, 0.18)",
  unclustered: "#76877f",
  outgroup: "#1d3a30",
} as const;
