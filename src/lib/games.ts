import type { GlyphName } from "./glyphs";

export type SkillKey = "memory" | "logic" | "speed" | "math" | "focus" | "pattern";

export const SKILLS: Record<SkillKey, { label: string; glyph: GlyphName }> = {
  memory: { label: "Memory", glyph: "memory" },
  logic: { label: "Logic", glyph: "logic" },
  speed: { label: "Speed", glyph: "speed" },
  math: { label: "Math", glyph: "math" },
  focus: { label: "Focus", glyph: "focus" },
  pattern: { label: "Pattern", glyph: "pattern" },
};

export type GameId =
  | "quick-math"
  | "memory-grid"
  | "color-switch"
  | "number-sequence"
  | "odd-one-out"
  | "reaction-tap"
  | "number-memory"
  | "logic-tiles"
  | "fast-count"
  | "direction-challenge"
  | "word-memory"
  | "mental-rotation";

export interface GameConfig {
  /** seconds; when set the game runs on a countdown timer */
  durationSec?: number;
  /** lives; when set the game ends when they run out */
  lives?: number;
  /** fixed number of rounds; when set the game ends after N rounds */
  rounds?: number;
  /** correct answers needed to level up */
  levelUpEvery?: number;
}

export interface GameDef {
  id: GameId;
  n: number;
  title: string;
  glyph: GlyphName;
  skill: SkillKey;
  secondary?: SkillKey;
  tagline: string;
  howTo: string;
  /** reference score considered "excellent" — used for skill rating */
  target: number;
  config: GameConfig;
}

export const GAMES: GameDef[] = [
  {
    id: "quick-math",
    n: 1,
    title: "Quick Math",
    glyph: "plus",
    skill: "math",
    secondary: "speed",
    tagline: "Solve fast, score big",
    howTo: "Solve the arithmetic problem as fast as you can. Faster answers earn bonus points.",
    target: 6000,
    config: { durationSec: 60, levelUpEvery: 5 },
  },
  {
    id: "memory-grid",
    n: 2,
    title: "Memory Grid",
    glyph: "grid",
    skill: "memory",
    secondary: "focus",
    tagline: "Remember the squares",
    howTo: "Memorise the highlighted squares, then tap them once they hide.",
    target: 4000,
    config: { lives: 3, levelUpEvery: 3 },
  },
  {
    id: "color-switch",
    n: 3,
    title: "Ink Match",
    glyph: "overlap",
    skill: "focus",
    secondary: "speed",
    tagline: "Ink, not the word",
    howTo: "Tap the colour of the INK — ignore the word that is written.",
    target: 5000,
    config: { durationSec: 45, levelUpEvery: 6 },
  },
  {
    id: "number-sequence",
    n: 4,
    title: "Number Sequence",
    glyph: "sequence",
    skill: "logic",
    secondary: "pattern",
    tagline: "What comes next?",
    howTo: "Work out the rule behind the numbers and pick the next value.",
    target: 3000,
    config: { lives: 3, levelUpEvery: 3 },
  },
  {
    id: "odd-one-out",
    n: 5,
    title: "Odd One Out",
    glyph: "odd",
    skill: "pattern",
    secondary: "focus",
    tagline: "Spot the difference",
    howTo: "One tile has a different shade. Find it as quickly as you can.",
    target: 3500,
    config: { lives: 3, levelUpEvery: 3 },
  },
  {
    id: "reaction-tap",
    n: 6,
    title: "Reaction Tap",
    glyph: "target",
    skill: "speed",
    tagline: "Wait... then tap!",
    howTo: "Wait for the screen to fill, then tap instantly. Tapping early costs you.",
    target: 3500,
    config: { rounds: 5 },
  },
  {
    id: "number-memory",
    n: 7,
    title: "Number Memory",
    glyph: "digits",
    skill: "memory",
    tagline: "Recall the digits",
    howTo: "A number flashes on screen. Type it back from memory. It gets longer.",
    target: 3500,
    config: { lives: 3, levelUpEvery: 1 },
  },
  {
    id: "logic-tiles",
    n: 8,
    title: "Logic Tiles",
    glyph: "tiles",
    skill: "logic",
    secondary: "pattern",
    tagline: "Which tile is next?",
    howTo: "Study the sequence of tiles and choose the one that continues it.",
    target: 3000,
    config: { lives: 3, levelUpEvery: 3 },
  },
  {
    id: "fast-count",
    n: 9,
    title: "Fast Count",
    glyph: "dots",
    skill: "focus",
    secondary: "speed",
    tagline: "Count at a glance",
    howTo: "Symbols flash by. Count how many match the target symbol.",
    target: 3500,
    config: { lives: 3, levelUpEvery: 3 },
  },
  {
    id: "direction-challenge",
    n: 10,
    title: "Direction",
    glyph: "arrow-up",
    skill: "speed",
    secondary: "focus",
    tagline: "Tap the right way",
    howTo: "Tap the button matching the arrow. Watch out — sometimes you must invert it.",
    target: 5000,
    config: { durationSec: 45, levelUpEvery: 6 },
  },
  {
    id: "word-memory",
    n: 11,
    title: "Word Memory",
    glyph: "lines",
    skill: "memory",
    secondary: "pattern",
    tagline: "Old words or new?",
    howTo: "Memorise the word list, then pick out only the words you saw before.",
    target: 3500,
    config: { lives: 3, levelUpEvery: 2 },
  },
  {
    id: "mental-rotation",
    n: 12,
    title: "Mental Rotation",
    glyph: "rotate",
    skill: "logic",
    secondary: "memory",
    tagline: "Rotate it in your mind",
    howTo: "Find the option that is the same shape rotated — not mirrored.",
    target: 3000,
    config: { lives: 3, levelUpEvery: 3 },
  },
];

export const GAME_MAP: Record<GameId, GameDef> = GAMES.reduce(
  (acc, game) => {
    acc[game.id] = game;
    return acc;
  },
  {} as Record<GameId, GameDef>,
);

export function isGameId(value: string): value is GameId {
  return Object.prototype.hasOwnProperty.call(GAME_MAP, value);
}

export const LEVEL_LABELS = ["Easy", "Normal", "Hard", "Expert", "Master", "Legend"];

export function levelLabel(level: number): string {
  return LEVEL_LABELS[Math.min(LEVEL_LABELS.length - 1, Math.max(0, level - 1))];
}

export const CATEGORIES: { key: SkillKey; label: string; glyph: GlyphName }[] = (
  Object.keys(SKILLS) as SkillKey[]
).map((key) => ({ key, ...SKILLS[key] }));

/** Deterministic daily challenge: 3 games picked from the date. */
export function dailyGamesFor(dayKey: string): GameId[] {
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) % 100000;
  }
  const pool = GAMES.map((g) => g.id);
  const picked: GameId[] = [];
  let cursor = hash;
  while (picked.length < 3) {
    cursor = (cursor * 1103515245 + 12345) % 2147483647;
    const index = cursor % pool.length;
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}
