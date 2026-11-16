"use client";

import { setTheme } from "@/lib/theme";
import { useTheme } from "@/lib/useTheme";
import { track } from "@/lib/track";

/**
 * Light mode on / off: a switch with a lightbulb beside it, in the top-right corner of every
 * page. The bulb is an outline in dark mode and lit (filled, with rays) in light mode.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const light = theme === "light";
  const flip = () => {
    const next = light ? "dark" : "light";
    setTheme(next);
    track("theme", { theme: next });
  };
  return (
    <span className={`theme-toggle${light ? " is-light" : ""} ${className}`.trim()}>
      <svg className="tt-bulb" viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        {light && (
          <g className="tt-rays" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 1.5v2M4.6 4.6l1.4 1.4M19.4 4.6L18 6M2 11.5h2M20 11.5h2" />
          </g>
        )}
        <path
          className="tt-glass"
          d="M12 4.5a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V18h5v-.7c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 4.5z"
          fill={light ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path className="tt-base" d="M9.8 20h4.4M10.5 22.2h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <button type="button" role="switch" aria-checked={light} aria-label="Light mode" className="tt-switch" onClick={flip}>
        <span className="tt-knob" aria-hidden />
      </button>
    </span>
  );
}
