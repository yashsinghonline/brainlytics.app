/** Monochrome glyph vocabulary shared by games, skills, achievements and UI. */
export const GLYPHS = [
  // games
  "plus",
  "grid",
  "overlap",
  "sequence",
  "odd",
  "target",
  "digits",
  "tiles",
  "dots",
  "arrow-up",
  "lines",
  "rotate",
  // skills
  "memory",
  "logic",
  "speed",
  "math",
  "focus",
  "pattern",
  // ui
  "home",
  "library",
  "chart",
  "user",
  "check",
  "cross",
  "lock",
  "flame",
  "bolt",
  "trophy",
  "crown",
  "calendar",
  "star",
  "diamond",
  "back",
] as const;

export type GlyphName = (typeof GLYPHS)[number];
