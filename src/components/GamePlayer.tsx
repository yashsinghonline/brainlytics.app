"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { GAME_MAP, levelLabel, type GameId } from "@/lib/games";
import { buzz, sfx } from "@/lib/sound";
import { gameAccuracy, scoreForRound } from "@/lib/scoring";
import { GAME_COMPONENTS } from "@/games";
import type { RoundResult } from "@/games/util";
import Icon from "@/components/Icon";

export interface SessionResult {
  gameId: GameId;
  score: number;
  accuracy: number;
  maxCombo: number;
  level: number;
  rounds: number;
  correct: number;
  avgReactionMs: number | null;
  durationMs: number;
}

interface ReactionTally {
  sum: number;
  count: number;
}

interface RunState {
  score: number;
  combo: number;
  maxCombo: number;
  correct: number;
  rounds: number;
  lives: number;
  level: number;
  roundIndex: number;
  flash: "good" | "bad" | null;
  floatKey: number;
  reaction?: ReactionTally;
}

type Phase = "intro" | "countdown" | "playing" | "over";

const EMPTY: RunState = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  correct: 0,
  rounds: 0,
  lives: 3,
  level: 1,
  roundIndex: 0,
  flash: null,
  floatKey: 0,
};

export default function GamePlayer({
  gameId,
  best = 0,
  autoStart = false,
  onSession,
  onNext,
  nextLabel,
  onExit,
  exitHref = "/games",
  banner,
}: {
  gameId: GameId;
  best?: number;
  autoStart?: boolean;
  onSession?: (result: SessionResult) => void;
  onNext?: () => void;
  nextLabel?: string;
  onExit?: () => void;
  exitHref?: string;
  /** rendered at the top of every phase (e.g. daily challenge progress) */
  banner?: ReactNode;
}) {
  const game = GAME_MAP[gameId];
  const Component = GAME_COMPONENTS[gameId];
  const config = game.config;
  const duration = config.durationSec;

  const initialRun = { ...EMPTY, lives: config.lives ?? 3 };
  const [phase, setPhase] = useState<Phase>(autoStart ? "countdown" : "intro");
  const [countdown, setCountdown] = useState(3);
  const [run, setRun] = useState<RunState>(initialRun);
  const runRef = useRef<RunState>(initialRun);
  const [timeLeft, setTimeLeft] = useState(duration ?? 0);
  const [endReason, setEndReason] = useState("Run complete");
  const [result, setResult] = useState<SessionResult | null>(null);
  const [isPB, setIsPB] = useState(false);
  const startedAt = useRef(Date.now());
  const reported = useRef(false);

  const levelUpEvery = config.levelUpEvery ?? 4;

  const commit = useCallback((next: RunState) => {
    runRef.current = next;
    setRun(next);
  }, []);

  const reset = useCallback(() => {
    reported.current = false;
    startedAt.current = Date.now();
    commit({ ...EMPTY, lives: config.lives ?? 3 });
    setTimeLeft(duration ?? 0);
    setResult(null);
    setIsPB(false);
    setCountdown(3);
    setPhase("countdown");
  }, [commit, config.lives, duration]);

  // countdown ticker
  useEffect(() => {
    if (phase !== "countdown") return;
    sfx.countdown(countdown === 0);
    if (countdown === 0) {
      const id = window.setTimeout(() => setPhase("playing"), 450);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setCountdown((c) => c - 1), 700);
    return () => window.clearTimeout(id);
  }, [phase, countdown]);

  const finish = useCallback(
    (reason: string, state: RunState) => {
      const score = Math.max(0, state.score);
      const final: SessionResult = {
        gameId,
        score,
        accuracy: gameAccuracy(state.correct, state.rounds),
        maxCombo: state.maxCombo,
        level: state.level,
        rounds: state.rounds,
        correct: state.correct,
        avgReactionMs: state.reaction
          ? Math.round(state.reaction.sum / Math.max(1, state.reaction.count))
          : null,
        durationMs: Date.now() - startedAt.current,
      };
      setEndReason(reason);
      setResult(final);
      setIsPB(score > best && score > 0);
      setPhase("over");
      sfx.finish();
      buzz([18, 40, 18]);
      if (!reported.current) {
        reported.current = true;
        onSession?.(final);
      }
    },
    [best, gameId, onSession],
  );

  // countdown timer for timed games
  useEffect(() => {
    if (phase !== "playing" || !duration) return;
    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = Math.max(0, prev - 0.1);
        if (next <= 0) {
          window.clearInterval(id);
          window.setTimeout(() => finish("Time's up", runRef.current), 0);
        }
        return Math.round(next * 10) / 10;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [phase, duration, finish]);

  const handleRound = useCallback(
    (input: RoundResult) => {
      if (input.correct) {
        sfx.correct();
        buzz(14);
      } else {
        sfx.wrong();
        buzz([12, 40, 12]);
      }

      const prev = runRef.current;
      const points = scoreForRound({
        correct: input.correct,
        reactionMs: input.reactionMs,
        points: input.points,
        combo: input.correct ? prev.combo : 0,
        level: prev.level,
      });
      const nextCorrect = prev.correct + (input.correct ? 1 : 0);
      const nextCombo = input.correct ? prev.combo + 1 : 0;
      const nextRounds = prev.rounds + 1;
      const nextLives = prev.lives - (input.correct ? 0 : 1);
      const nextLevel = Math.min(6, 1 + Math.floor(nextCorrect / levelUpEvery));

      if (input.correct && nextCombo > 1 && nextCombo % 5 === 0) {
        sfx.combo(nextCombo);
        buzz([10, 30, 10, 30, 10]);
      }

      const next: RunState = {
        ...prev,
        score: Math.max(0, prev.score + points),
        combo: nextCombo,
        maxCombo: Math.max(prev.maxCombo, nextCombo),
        correct: nextCorrect,
        rounds: nextRounds,
        lives: nextLives,
        level: nextLevel,
        roundIndex: prev.roundIndex + 1,
        flash: input.correct ? "good" : "bad",
        floatKey: prev.floatKey + 1,
        reaction: input.reactionMs
          ? {
              sum: (prev.reaction?.sum ?? 0) + input.reactionMs,
              count: (prev.reaction?.count ?? 0) + 1,
            }
          : prev.reaction,
      };
      commit(next);

      if (config.lives && nextLives <= 0) {
        window.setTimeout(() => finish("Out of lives", next), 420);
      } else if (config.rounds && nextRounds >= config.rounds) {
        window.setTimeout(() => finish("Run complete", next), 420);
      }
    },
    [commit, config.lives, config.rounds, finish, levelUpEvery],
  );

  // Escape quits back to the intro screen (desktop convenience)
  useEffect(() => {
    if (phase !== "playing") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setPhase("intro");
      commit({ ...EMPTY, lives: config.lives ?? 3 });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, commit, config.lives]);

  const timePct = duration ? (timeLeft / duration) * 100 : 100;
  const scored = useMemo(() => run.score.toLocaleString(), [run.score]);

  if (phase === "intro") {
    return (
      <div className="game-frame px-5 pb-10 pt-6">
        {banner}
        <div className="flex items-center justify-between">
          <Link
            href={exitHref}
            onClick={onExit}
            className="tap card flex h-10 w-10 items-center justify-center"
            aria-label="Back"
          >
            <Icon name="back" className="h-4 w-4" />
          </Link>
          <span className="label">Game {String(game.n).padStart(2, "0")}</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
          <div className="animate-pop card flex h-24 w-24 items-center justify-center">
            <Icon name={game.glyph} className="h-11 w-11" />
          </div>
          <div>
            <h1 className="num text-3xl uppercase tracking-[0.04em]">{game.title}</h1>
            <p className="mt-3 text-sm font-light leading-relaxed text-muted">{game.howTo}</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-px bg-[var(--line)]">
            <div className="bg-[var(--surface)] px-4 py-4">
              <p className="label">Personal best</p>
              <p className="num mt-1 text-2xl">{best.toLocaleString()}</p>
            </div>
            <div className="bg-[var(--surface)] px-4 py-4">
              <p className="label">
                {duration ? "Timer" : config.lives ? "Lives" : "Rounds"}
              </p>
              <p className="num mt-1 text-2xl">
                {duration ? `${duration}s` : config.lives ? config.lives : config.rounds}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="label tap box-fill w-full py-5 text-[11px]"
        >
          Start
        </button>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="game-frame px-5 pt-6">
        {banner}
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <span key={countdown} className="animate-count num text-8xl">
            {countdown === 0 ? "GO" : countdown}
          </span>
          <p className="label">{game.title}</p>
        </div>
      </div>
    );
  }

  if (phase === "over" && result) {
    return (
      <div className="game-frame px-5 pb-10 pt-6">
        {banner}
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
          <p className="label">Game complete</p>
          {isPB ? <p className="label animate-pop border border-[var(--text)] px-3 py-1">New best</p> : null}
          <p className="animate-pop num text-6xl">{result.score.toLocaleString()}</p>
          <p className="label">{endReason}</p>

          <div className="grid w-full grid-cols-3 gap-px bg-[var(--line)]">
            <Stat label="Accuracy" value={`${result.accuracy}%`} />
            <Stat label="Combo" value={`×${result.maxCombo}`} />
            <Stat label="Level" value={levelLabel(result.level)} />
            <Stat label="Rounds" value={String(result.rounds)} />
            <Stat label="Best" value={Math.max(best, result.score).toLocaleString()} />
            <Stat
              label="Reaction"
              value={result.avgReactionMs ? `${result.avgReactionMs}ms` : "—"}
            />
          </div>

          <p className="text-sm font-light text-muted">{encourage(result, best)}</p>
        </div>

        <div className="flex flex-col gap-px bg-[var(--line)]">
          {onNext ? (
            <button
              type="button"
              onClick={onNext}
              className="label tap box-fill w-full py-5 text-[11px]"
            >
              {nextLabel ?? "Continue"}
            </button>
          ) : (
            <button
              type="button"
              onClick={reset}
              className="label tap box-fill w-full py-5 text-[11px]"
            >
              Play again
            </button>
          )}
          <Link
            href={exitHref}
            onClick={onExit}
            className="label tap bg-[var(--surface)] w-full py-5 text-[11px]"
          >
            Back to games
          </Link>
        </div>
      </div>
    );
  }

  // playing
  return (
    <div className="game-frame px-4 pb-4 pt-4 md:px-6">
      {banner}
      <div className="flex items-center justify-between gap-3 pb-3">
        <button
          type="button"
          onClick={() => {
            setPhase("intro");
            commit({ ...EMPTY, lives: config.lives ?? 3 });
          }}
          className="tap card flex h-8 w-8 items-center justify-center"
          aria-label="Quit game"
        >
          <Icon name="back" className="h-3.5 w-3.5" />
        </button>
        <span className="label">{game.title}</span>
        <span className="num min-w-14 text-right text-2xl">{scored}</span>
      </div>

      <div className="flex h-px bg-[var(--line)]">
        {duration ? (
          <div
            className="h-px bg-[var(--fill)] transition-[width] duration-100"
            style={{ width: `${timePct}%` }}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 py-3">
        <div className="flex items-center gap-3">
          {duration ? (
            <span className="num text-sm">{timeLeft.toFixed(1)}s</span>
          ) : (
            <span className="label">Round {run.rounds + 1}</span>
          )}
          {config.lives ? (
            <span className="flex items-center gap-1" aria-label={`${run.lives} lives`}>
              {Array.from({ length: config.lives }, (_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 ${i < run.lives ? "bg-[var(--fill)]" : "bg-[var(--line)]"}`}
                />
              ))}
            </span>
          ) : null}
        </div>
        <span className="label">{levelLabel(run.level)}</span>
      </div>

      <div key={`${run.flash ?? "none"}-${run.floatKey}`} className="flex flex-1 flex-col">
        <Component
          key={run.roundIndex}
          level={run.level}
          round={run.rounds + 1}
          timeLeft={timeLeft}
          onRound={handleRound}
        />
      </div>

      <div className="flex h-7 items-center justify-center">
        {run.combo >= 3 ? (
          <span key={run.combo} className="animate-pop label">
            Combo ×{run.combo}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] px-2 py-4">
      <p className="label">{label}</p>
      <p className="num mt-1 text-lg">{value}</p>
    </div>
  );
}

function encourage(result: SessionResult, best: number): string {
  if (result.score > best && result.score > 0) return "New personal best.";
  if (best > 0 && result.score > 0) {
    const pct = Math.round((result.score / best) * 100);
    if (pct >= 95) return "So close to your best — one more round?";
    if (pct >= 75) return `${pct}% of your best. Your brain is warming up.`;
    return "Every round trains you. Try again.";
  }
  if (result.accuracy >= 80) return "Sharp round — think faster for more points.";
  return "Not quite — keep going. Speed comes with reps.";
}
