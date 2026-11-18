import { puppyGlyph } from "@/lib/puppyGlyph";

/** A single breed's swatch: its LilPuppies dog in its color, or the usual square without one. */
export default function PuppySwatch({ code, color }: { code: string | undefined; color: string }) {
  const g = puppyGlyph(code);
  return g ? (
    <span className="pup-swatch" style={{ color }} aria-hidden>
      {g}
    </span>
  ) : (
    <i style={{ background: color }} aria-hidden />
  );
}
