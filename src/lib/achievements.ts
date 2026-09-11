import { GAMES } from "./games";
import type { GlyphName } from "./glyphs";
import type { PlayerStats } from "./scoring";

export interface AchievementDef {
  id: string;
  title: string;
  glyph: GlyphName;
  desc: string;
  check: (stats: PlayerStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-win",
    title: "First Win",
    glyph: "trophy",
    desc: "Complete your first game",
    check: (s) => s.totalGames >= 1,
  },
  {
    id: "streak-3",
    title: "Warming Up",
    glyph: "flame",
    desc: "Reach a 3 day streak",
    check: (s) => s.longestStreak >= 3,
  },
  {
    id: "streak-7",
    title: "7 Day Streak",
    glyph: "flame",
    desc: "Train 7 days in a row",
    check: (s) => s.longestStreak >= 7,
  },
  {
    id: "streak-14",
    title: "Two Week Force",
    glyph: "flame",
    desc: "Reach a 14 day streak",
    check: (s) => s.longestStreak >= 14,
  },
  {
    id: "streak-30",
    title: "Unstoppable",
    glyph: "flame",
    desc: "Reach a 30 day streak",
    check: (s) => s.longestStreak >= 30,
  },
  {
    id: "lightning",
    title: "Lightning Fast",
    glyph: "bolt",
    desc: "Average under 250 ms reaction",
    check: (s) => s.bestReaction !== null && s.bestReaction < 250,
  },
  {
    id: "memory-master",
    title: "Memory Master",
    glyph: "memory",
    desc: "Score 3,000+ in Memory Grid",
    check: (s) => (s.bests["memory-grid"] ?? 0) >= 3000,
  },
  {
    id: "perfect-accuracy",
    title: "Perfect Accuracy",
    glyph: "focus",
    desc: "100% accuracy over 10+ rounds",
    check: (s) => s.bestAccuracy >= 100,
  },
  {
    id: "games-25",
    title: "25 Games Played",
    glyph: "library",
    desc: "Play 25 games",
    check: (s) => s.totalGames >= 25,
  },
  {
    id: "games-100",
    title: "100 Games Played",
    glyph: "library",
    desc: "Play 100 games",
    check: (s) => s.totalGames >= 100,
  },
  {
    id: "top-score",
    title: "Top Score",
    glyph: "crown",
    desc: "Score 10,000+ in one game",
    check: (s) => Object.values(s.bests).some((v) => v >= 10000),
  },
  {
    id: "combo-10",
    title: "Combo 10",
    glyph: "speed",
    desc: "Hit a 10x combo",
    check: (s) => s.maxCombo >= 10,
  },
  {
    id: "combo-25",
    title: "Combo 25",
    glyph: "speed",
    desc: "Hit a 25x combo",
    check: (s) => s.maxCombo >= 25,
  },
  {
    id: "explorer",
    title: "Explorer",
    glyph: "diamond",
    desc: `Play ${Math.min(6, GAMES.length)} different games`,
    check: (s) => s.uniqueGames >= 6,
  },
  {
    id: "all-games",
    title: "Full Tour",
    glyph: "library",
    desc: `Play all ${GAMES.length} games`,
    check: (s) => s.uniqueGames >= GAMES.length,
  },
  {
    id: "daily-1",
    title: "Daily Duty",
    glyph: "calendar",
    desc: "Complete a daily challenge",
    check: (s) => s.dailyCompletions >= 1,
  },
  {
    id: "daily-5",
    title: "Daily Habit",
    glyph: "calendar",
    desc: "Complete 5 daily challenges",
    check: (s) => s.dailyCompletions >= 5,
  },
];

export const ACHIEVEMENT_MAP: Record<string, AchievementDef> = ACHIEVEMENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<string, AchievementDef>,
);

export function evaluateAchievements(stats: PlayerStats): string[] {
  return ACHIEVEMENTS.filter((a) => a.check(stats)).map((a) => a.id);
}
