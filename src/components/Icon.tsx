import type { JSX } from "react";
import type { GlyphName } from "@/lib/glyphs";

const PATHS: Record<GlyphName, JSX.Element> = {
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="7" height="7" />
      <rect x="13" y="4" width="7" height="7" />
      <rect x="4" y="13" width="7" height="7" />
      <rect x="13" y="13" width="7" height="7" fill="currentColor" stroke="none" />
    </>
  ),
  overlap: (
    <>
      <circle cx="9.5" cy="12" r="5.5" />
      <circle cx="14.5" cy="12" r="5.5" />
    </>
  ),
  sequence: (
    <>
      <path d="M3 19l6-6 4 2 8-9" />
      <circle cx="21" cy="6" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  odd: (
    <>
      <rect x="4" y="4" width="6" height="6" />
      <rect x="14" y="4" width="6" height="6" />
      <rect x="4" y="14" width="6" height="6" />
      <path d="M17 14l3 3-3 3-3-3z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    </>
  ),
  digits: (
    <>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
    </>
  ),
  tiles: (
    <>
      <rect x="3" y="10" width="6" height="6" />
      <rect x="10" y="10" width="6" height="6" />
      <rect x="17" y="10" width="4" height="6" />
    </>
  ),
  dots: (
    <>
      <circle cx="6" cy="7" r="1.7" />
      <circle cx="12" cy="5" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="18" cy="8" r="1.7" />
      <circle cx="5" cy="17" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="1.7" />
      <circle cx="19" cy="18" r="1.7" />
    </>
  ),
  "arrow-up": (
    <>
      <path d="M12 20V4" />
      <path d="M5 11l7-7 7 7" />
    </>
  ),
  lines: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h13" />
    </>
  ),
  rotate: (
    <>
      <rect x="3" y="8" width="8" height="8" />
      <path d="M16.5 6.5L21 11l-4.5 4.5L12 11z" />
    </>
  ),
  memory: (
    <>
      <rect x="7" y="3" width="10" height="8" />
      <rect x="7" y="13" width="10" height="8" />
    </>
  ),
  logic: (
    <>
      <circle cx="5" cy="6" r="2" />
      <circle cx="19" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <path d="M7 6h10M6.5 7.5l4 8M17.5 7.5l-4 8" />
    </>
  ),
  speed: (
    <>
      <path d="M5 5l7 7-7 7" />
      <path d="M13 5l7 7-7 7" />
    </>
  ),
  math: (
    <>
      <path d="M4 12h16" />
      <circle cx="12" cy="6" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  focus: (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
    </>
  ),
  pattern: (
    <>
      <circle cx="6" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="6" r="1.8" />
      <circle cx="18" cy="6" r="1.8" />
      <circle cx="6" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.8" />
      <circle cx="6" cy="18" r="1.8" />
      <circle cx="12" cy="18" r="1.8" />
      <circle cx="18" cy="18" r="1.8" fill="currentColor" stroke="none" />
    </>
  ),
  home: <path d="M4 11l8-7 8 7v9H4z" />,
  library: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V12M10 20V4M16 20v-7" />
      <path d="M2 21h20" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3-6 7-6s7 2 7 6" />
    </>
  ),
  check: <path d="M5 13l4 4L19 7" />,
  cross: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  lock: (
    <>
      <rect x="6" y="11" width="12" height="9" />
      <path d="M9 11V8a3 3 0 016 0v3" />
    </>
  ),
  flame: <path d="M12 3c3 4 6 6 6 10a6 6 0 01-12 0c0-2 1-3.5 2-5 1 1.5 2 2 3 2 0-3 0-5 1-7z" />,
  bolt: <path d="M13 3L5 14h6l-1 7 8-11h-6l1-7z" />,
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0V4z" />
      <path d="M8 5H5v2a3 3 0 003 3M16 5h3v2a3 3 0 01-3 3" />
      <path d="M12 13v4M9 20h6" />
    </>
  ),
  crown: <path d="M4 8l4 4 4-8 4 8 4-4v10H4z" />,
  calendar: (
    <>
      <rect x="4" y="6" width="16" height="14" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </>
  ),
  star: <path d="M12 4l2.4 5.4 5.6.6-4 4 1 6-5-3-5 3 1-6-4-4 5.6-.6z" />,
  diamond: <path d="M12 3l8 9-8 9-8-9z" />,
  back: <path d="M15 5l-7 7 7 7" />,
};

export default function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.2,
}: {
  name: GlyphName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
