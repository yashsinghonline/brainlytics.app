"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ACHIEVEMENT_MAP, evaluateAchievements } from "@/lib/achievements";
import { GAMES, GAME_MAP, todayKey, type GameId } from "@/lib/games";
import { computeStats, type DailyRecord, type PlayerStats, type SessionRecord, type Settings } from "@/lib/scoring";
import { configureAudio, sfx } from "@/lib/sound";
import Icon from "@/components/Icon";
import type { GlyphName } from "@/lib/glyphs";
import type { SessionResult } from "@/components/GamePlayer";

const STORAGE_KEY = "brain-games:v1";

interface PersistState {
  playerId: string;
  name: string;
  avatar: string;
  settings: Settings;
  sessions: SessionRecord[];
  dailies: DailyRecord[];
  playDays: string[];
  streak: number;
  achievements: string[];
}

const DEFAULT_STATE: PersistState = {
  playerId: "",
  name: "Player",
  avatar: "diamond",
  settings: { sound: true, haptics: true, theme: "dark", notifications: false },
  sessions: [],
  dailies: [],
  playDays: [],
  streak: 0,
  achievements: [],
};

interface Toast {
  id: number;
  glyph: GlyphName;
  title: string;
  desc: string;
}

interface AppValue {
  ready: boolean;
  playerId: string;
  name: string;
  avatar: string;
  settings: Settings;
  sessions: SessionRecord[];
  dailies: DailyRecord[];
  playDays: string[];
  streak: number;
  achievements: string[];
  stats: PlayerStats;
  bests: Record<string, number>;
  toasts: Toast[];
  recordSession: (result: SessionResult) => void;
  completeDaily: (payload: { totalScore: number; accuracy: number; games: GameId[] }) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateProfile: (patch: { name?: string; avatar?: string }) => void;
  resetProgress: () => void;
  dismissToast: (id: number) => void;
  personalBest: (gameId: GameId) => number;
}

const AppContext = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  const rnd = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${rnd()}-${rnd()}-4${rnd().slice(1)}-8${rnd().slice(1)}-${rnd()}${rnd()}${rnd()}`;
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

function nextStreak(playDays: string[], day: string, current: number): number {
  if (playDays.includes(day)) return current;
  if (playDays.includes(yesterdayKey())) return current + 1;
  return 1;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);

  // hydrate from localStorage
  useEffect(() => {
    let loaded: PersistState | null = null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) loaded = { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<PersistState>) };
    } catch {
      loaded = null;
    }
    const next: PersistState = {
      ...DEFAULT_STATE,
      ...(loaded ?? {}),
      playerId: loaded?.playerId || makeId(),
    };
    setState(next);
    persist(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) persist(state);
  }, [state, ready]);

  useEffect(() => {
    configureAudio(state.settings.sound, state.settings.haptics);
    const root = document.documentElement;
    root.classList.toggle("dark", state.settings.theme === "dark");
    root.style.colorScheme = state.settings.theme;
  }, [state.settings.sound, state.settings.haptics, state.settings.theme]);

  const stats = useMemo(
    () => computeStats(state.sessions, state.dailies, state.streak),
    [state.sessions, state.dailies, state.streak],
  );

  const bests = useMemo(() => stats.bests, [stats]);

  const pushToast = useCallback((glyph: GlyphName, title: string, desc: string) => {
    const id = toastId.current++;
    setToasts((prev) => [...prev, { id, glyph, title, desc }]);
    sfx.achievement();
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const recordSession = useCallback(
    (result: SessionResult) => {
      const day = todayKey();
      setState((prev) => {
        const record: SessionRecord = {
          id: `${result.gameId}-${Date.now()}`,
          gameId: result.gameId,
          score: result.score,
          accuracy: result.accuracy,
          maxCombo: result.maxCombo,
          level: result.level,
          rounds: result.rounds,
          correct: result.correct,
          avgReactionMs: result.avgReactionMs,
          durationMs: result.durationMs,
          day,
          at: Date.now(),
        };
        const sessions = [record, ...prev.sessions].slice(0, 400);
        const playDays = prev.playDays.includes(day) ? prev.playDays : [...prev.playDays, day];
        const streak = nextStreak(prev.playDays, day, prev.streak);
        const dailies = prev.dailies;
        const computed = computeStats(sessions, dailies, Math.max(prev.streak, streak));
        const unlocked = evaluateAchievements(computed).filter((id) => !prev.achievements.includes(id));
        if (unlocked.length) {
          unlocked.forEach((id) => {
            const def = ACHIEVEMENT_MAP[id];
            if (def) pushToast(def.glyph, def.title, def.desc);
          });
        }
        return {
          ...prev,
          sessions,
          playDays,
          streak,
          achievements: [...prev.achievements, ...unlocked],
        };
      });
    },
    [pushToast],
  );

  const completeDaily = useCallback(
    ({ totalScore, accuracy, games }: { totalScore: number; accuracy: number; games: GameId[] }) => {
      const day = todayKey();
      setState((prev) => {
        const others = prev.dailies.filter((d) => d.day !== day);
        const dailies: DailyRecord[] = [
          ...others,
          { day, totalScore, accuracy, completed: true, games },
        ];
        const streak = nextStreak(prev.playDays, day, prev.streak);
        const computed = computeStats(prev.sessions, dailies, Math.max(prev.streak, streak));
        const unlocked = evaluateAchievements(computed).filter((id) => !prev.achievements.includes(id));
        unlocked.forEach((id) => {
          const def = ACHIEVEMENT_MAP[id];
          if (def) pushToast(def.glyph, def.title, def.desc);
        });
        return {
          ...prev,
          dailies,
          streak,
          achievements: [...prev.achievements, ...unlocked],
        };
      });
    },
    [pushToast],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const updateProfile = useCallback((patch: { name?: string; avatar?: string }) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...DEFAULT_STATE,
      playerId: prev.playerId,
      name: prev.name,
      avatar: prev.avatar,
      settings: prev.settings,
    }));
  }, []);

  const personalBest = useCallback(
    (gameId: GameId) => bests[gameId] ?? 0,
    [bests],
  );

  const value: AppValue = {
    ready,
    playerId: state.playerId,
    name: state.name,
    avatar: state.avatar,
    settings: state.settings,
    sessions: state.sessions,
    dailies: state.dailies,
    playDays: state.playDays,
    streak: state.streak,
    achievements: state.achievements,
    stats,
    bests,
    toasts,
    recordSession,
    completeDaily,
    updateSettings,
    updateProfile,
    resetProgress,
    dismissToast: (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)),
    personalBest,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </AppContext.Provider>
  );
}

function persist(state: PersistState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="animate-slide-in card pointer-events-auto flex w-full max-w-sm items-center gap-3 px-4 py-3 text-left"
        >
          <Icon name={toast.glyph} className="h-5 w-5 shrink-0" strokeWidth={1.3} />
          <span>
            <span className="label block">{toast.title}</span>
            <span className="block text-xs font-light text-muted">{toast.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function recentGames(sessions: SessionRecord[], limit = 4): GameId[] {
  const seen: GameId[] = [];
  for (const session of sessions) {
    if (!seen.includes(session.gameId)) seen.push(session.gameId);
    if (seen.length >= limit) break;
  }
  return seen;
}

export function recommendedGames(sessions: SessionRecord[], limit = 6): GameId[] {
  const played = new Set(sessions.map((s) => s.gameId));
  const fresh = GAMES.filter((g) => !played.has(g.id)).map((g) => g.id);
  const known = recentGames(sessions, limit);
  const pool = [...fresh, ...known];
  return pool.slice(0, limit);
}

export function gameById(gameId: GameId) {
  return GAME_MAP[gameId];
}
