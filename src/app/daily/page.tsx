"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import GamePlayer, { type SessionResult } from "@/components/GamePlayer";
import { useApp } from "@/components/AppProvider";
import Icon from "@/components/Icon";
import { dailyGamesFor, GAME_MAP, todayKey } from "@/lib/games";

export default function DailyPage() {
  const day = todayKey();
  const games = useMemo(() => dailyGamesFor(day), [day]);
  const { recordSession, completeDaily, dailies, personalBest } = useApp();
  const existing = dailies.find((d) => d.day === day);

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [done, setDone] = useState(false);

  const current = games[step];

  const handleSession = (result: SessionResult) => {
    recordSession(result);
    setResults((prev) => [...prev, result]);
  };

  const advance = () => {
    if (step < games.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const rounds = results.reduce((sum, r) => sum + r.rounds, 0);
    const correct = results.reduce((sum, r) => sum + r.correct, 0);
    const accuracy = rounds ? Math.round((correct / rounds) * 1000) / 10 : 0;
    completeDaily({ totalScore, accuracy, games });
    setDone(true);
  };

  if (done) {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const rounds = results.reduce((sum, r) => sum + r.rounds, 0);
    const correct = results.reduce((sum, r) => sum + r.correct, 0);
    const accuracy = rounds ? Math.round((correct / rounds) * 1000) / 10 : 0;
    const previous = existing?.totalScore ?? 0;

    return (
      <main className="game-frame px-5 pb-10 pt-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
          <p className="label">Daily challenge complete</p>
          <p className="animate-pop num text-6xl">{totalScore.toLocaleString()}</p>
          <div className="grid w-full grid-cols-3 gap-px bg-[var(--line)]">
            <Cell label="Accuracy" value={`${accuracy}%`} />
            <Cell label="Games" value={String(results.length)} />
            <Cell label="Best" value={Math.max(previous, totalScore).toLocaleString()} />
          </div>
          <div className="card w-full">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0"
              >
                <Icon name={GAME_MAP[result.gameId].glyph} className="h-5 w-5" strokeWidth={1.1} />
                <span className="flex-1 text-left text-sm font-light">
                  {GAME_MAP[result.gameId].title}
                </span>
                <span className="num text-sm">{result.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <p className="text-sm font-light text-muted">
            {previous && totalScore > previous
              ? `You beat your last run by ${(totalScore - previous).toLocaleString()} points.`
              : "Streak protected. See you tomorrow?"}
          </p>
        </div>
        <div className="flex flex-col gap-px bg-[var(--line)]">
          <Link href="/" className="label tap box-fill w-full py-5 text-[11px]">
            Back home
          </Link>
          <button
            type="button"
            onClick={() => {
              setResults([]);
              setStep(0);
              setDone(false);
            }}
            className="label tap bg-[var(--surface)] w-full py-4 text-[11px]"
          >
            Run it again
          </button>
        </div>
      </main>
    );
  }

  return (
    <GamePlayer
      key={current}
      gameId={current}
      best={personalBest(current)}
      autoStart
      onSession={handleSession}
      onNext={advance}
      nextLabel={step < games.length - 1 ? "Next game" : "Finish"}
      exitHref="/"
      banner={
        <div className="mb-4 flex items-center gap-4">
          <span className="label whitespace-nowrap">
            Daily · {step + 1}/{games.length}
          </span>
          <div className="flex flex-1 gap-px">
            {games.map((id, index) => (
              <span
                key={id}
                className={`h-1 flex-1 ${index <= step ? "bg-[var(--fill)]" : "bg-[var(--line)]"}`}
              />
            ))}
          </div>
        </div>
      }
    />
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] px-2 py-4">
      <p className="label">{label}</p>
      <p className="num mt-1 text-lg">{value}</p>
    </div>
  );
}
