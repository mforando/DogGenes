/**
 * Google Analytics 4 custom events (the gtag snippet is loaded in app/layout.tsx).
 * Safe to call anywhere: does nothing until gtag has loaded, or when it's blocked.
 */
type Gtag = (cmd: "event", name: string, params?: Record<string, string | number | boolean>) => void;

export function track(name: string, params?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  try {
    gtag?.("event", name, params);
  } catch {
    // Analytics must never break the page.
  }
}
