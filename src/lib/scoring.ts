import { GAMES, GAME_MAP, SKILLS, type GameId, type SkillKey } from "./games";

export interface SessionRecord {
  id: string;
  gameId: GameId;
  score: number;
  accuracy: number;
  maxCombo: number;
  level: number;
  rounds: number;
  correct: number;
  avgReactionMs: number | null;
  durationMs: number;
  day: string;
  at: number;
}

export interface DailyRecord {
  day: string;
  totalScore: number;
  accuracy: number;
  completed: boolean;
  games: GameId[];
}

export interface Settings {
  sound: boolean;
  haptics: boolean;
  theme: "dark" | "light";
  notifications: boolean;
}

export interface PlayerStats {
  totalGames: number;
  bests: Record<string, number>;
  skillRatings: Record<SkillKey, number>;
  brainScore: number;
  longestStreak: number;
  bestReaction: number | null;
  bestAccuracy: number;
  uniqueGames: number;
  maxCombo: number;
  dailyCompletions: number;
}

export const SKILL_ORDER: SkillKey[] = ["memory", "logic", "speed", "math", "focus", "pattern"];

export function computeStats(
  sessions: SessionRecord[],
  dailies: DailyRecord[],
  streakBest: number,
): PlayerStats {
  const bests: Record<string, number> = {};
  let bestReaction: number | null = null;
  let bestAccuracy = 0;
  let maxCombo = 0;
  const gameIds = new Set<string>();

  for (const session of sessions) {
    if (session.score > (bests[session.gameId] ?? 0)) bests[session.gameId] = session.score;
    if (session.avgReactionMs && session.avgReactionMs > 80) {
      if (bestReaction === null || session.avgReactionMs < bestReaction) {
        bestReaction = session.avgReactionMs;
      }
    }
    if (session.rounds >= 5 && session.accuracy > bestAccuracy) bestAccuracy = session.accuracy;
    if (session.maxCombo > maxCombo) maxCombo = session.maxCombo;
    gameIds.add(session.gameId);
  }

  const skillRatings = {} as Record<SkillKey, number>;
  for (const key of SKILL_ORDER) {
    const relevant = GAMES.filter((g) => g.skill === key || g.secondary === key);
    let total = 0;
    for (const game of relevant) {
      const best = bests[game.id] ?? 0;
      const primary = game.skill === key;
      const rating = Math.max(0, Math.min(100, Math.round((best / game.target) * 100)));
      total += primary ? rating : rating * 0.4;
    }
    const primaries = relevant.filter((g) => g.skill === key).length || 1;
    const secondaries = relevant.length - primaries;
    const weighted = total / (primaries + secondaries * 0.4);
    skillRatings[key] = Math.max(0, Math.min(100, Math.round(weighted)));
  }

  const skillSum = SKILL_ORDER.reduce((sum, key) => sum + skillRatings[key], 0);
  const dailyCompletions = dailies.filter((d) => d.completed).length;

  return {
    totalGames: sessions.length,
    bests,
    skillRatings,
    brainScore: Math.round(skillSum * 24),
    longestStreak: streakBest,
    bestReaction,
    bestAccuracy,
    uniqueGames: gameIds.size,
    maxCombo,
    dailyCompletions,
  };
}

export function personalBest(sessions: SessionRecord[], gameId: GameId): number {
  return sessions.reduce((best, s) => (s.gameId === gameId && s.score > best ? s.score : best), 0);
}

export interface ScoreInput {
  correct: boolean;
  reactionMs?: number;
  points?: number;
  combo: number;
  level: number;
}

export const SPEED_BONUS_MS = 1500;

export function scoreForRound({ correct, reactionMs, points, combo, level }: ScoreInput): number {
  if (points !== undefined) return points;
  if (!correct) return -50;
  const base = 100 + (level - 1) * 20;
  const speedBonus =
    reactionMs && reactionMs < SPEED_BONUS_MS
      ? Math.round(50 * (1 - reactionMs / SPEED_BONUS_MS))
      : 0;
  const comboBonus = Math.min(combo, 20) * 25;
  return base + speedBonus + comboBonus;
}

export function gameAccuracy(correct: number, rounds: number): number {
  if (rounds <= 0) return 0;
  return Math.round((correct / rounds) * 1000) / 10;
}

export function gameTitle(gameId: string): string {
  return GAME_MAP[gameId as GameId]?.title ?? gameId;
}

export function skillLabel(key: SkillKey): string {
  return SKILLS[key].label;
}
