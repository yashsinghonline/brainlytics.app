"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { recommendedGames, useApp } from "@/components/AppProvider";
import Hero from "@/components/Hero";
import Icon from "@/components/Icon";
import Mark from "@/components/Mark";
import SkillBar from "@/components/SkillBar";
import { dailyGamesFor, GAME_MAP, GAMES, SKILLS, todayKey, type GameId } from "@/lib/games";

const WELCOME_KEY = "brain-games:welcomed";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { ready, stats, streak, sessions, dailies, personalBest, avatar, name } = useApp();
  const day = todayKey();
  const daily = dailies.find((d) => d.day === day);
  const dailyGames = useMemo(() => dailyGamesFor(day), [day]);

  const [welcomed, setWelcomed] = useState(true);
  useEffect(() => {
    try {
      setWelcomed(Boolean(window.localStorage.getItem(WELCOME_KEY)));
    } catch {
      setWelcomed(false);
    }
  }, []);
  const dismissHero = () => {
    try {
      window.localStorage.setItem(WELCOME_KEY, "1");
    } catch {
      /* ignore */
    }
    setWelcomed(true);
  };
  const showHero = ready && !welcomed && stats.totalGames === 0;

  const recent = useMemo(() => {
    const ids: GameId[] = [];
    for (const s of sessions) {
      if (!ids.includes(s.gameId)) ids.push(s.gameId);
      if (ids.length >= 4) break;
    }
    return ids;
  }, [sessions]);
  const recommended = useMemo(() => recommendedGames(sessions, 6), [sessions]);

  const todayStats = useMemo(() => {
    const todays = sessions.filter((s) => s.day === day);
    const best = todays.reduce((m, s) => Math.max(m, s.score), 0);
    const reactions = todays
      .map((s) => s.avgReactionMs)
      .filter((r): r is number => typeof r === "number" && r > 0);
    const avgReaction = reactions.length
      ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length)
      : null;
    return { played: todays.length, best, avgReaction };
  }, [sessions, day]);

  return (
    <main className="flex flex-col gap-8 pt-8 md:gap-10 md:pt-12">
      {showHero ? (
        <Hero onDismiss={dismissHero} />
      ) : (
        <header className="animate-fade-up grid gap-px bg-[var(--line)] md:grid-cols-12">
          <div className="flex items-start justify-between gap-4 bg-[var(--page)] pb-2 md:col-span-7 md:pr-8">
            <div>
              <p className="label">{greeting()}</p>
              <h1 className="num mt-2 text-3xl leading-tight md:text-5xl">
                Ready to train
                <br />
                your brain?
              </h1>
            </div>
            <Link
              href="/profile"
              className="tap card flex h-11 w-11 items-center justify-center md:hidden"
            >
              <Mark value={avatar} className="h-5 w-5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px bg-[var(--line)] md:col-span-5">
            <div className="bg-[var(--surface)] p-4 md:p-5">
              <p className="label">Brain score</p>
              <p className="num mt-2 text-4xl">{stats.brainScore.toLocaleString()}</p>
            </div>
            <div className="flex flex-col justify-between bg-[var(--surface)] p-4 md:p-5">
              <p className="label flex items-center gap-2">
                <Icon name="flame" className="h-3.5 w-3.5" /> Streak
              </p>
              <p className="num text-3xl">
                {streak}
                <span className="text-sm"> d</span>
              </p>
              <p className="label">
                {stats.totalGames} games · {name}
              </p>
            </div>
          </div>
        </header>
      )}

      <section className="animate-fade-up grid gap-px bg-[var(--line)] lg:grid-cols-12">
        <div className="flex flex-col bg-[var(--surface)] lg:col-span-7">
          <div className="flex items-start justify-between p-4 pb-3 md:p-6 md:pb-4">
            <div>
              <p className="label">Daily challenge</p>
              <p className="num mt-2 text-4xl md:text-5xl">3 games</p>
              <p className="label mt-1">3:00 · beat your score</p>
            </div>
            <p className="label text-right">
              {daily?.completed ? "Done" : "Open"}
              <br />
              {daily?.completed ? daily.totalScore.toLocaleString() : "—"}
            </p>
          </div>
          <div className="flex-1 border-t border-[var(--line)]">
            {dailyGames.map((id, index) => {
              const game = GAME_MAP[id];
              return (
                <Link
                  key={id}
                  href={`/play/${id}`}
                  className="tap flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0 md:px-6"
                >
                  <span className="label w-3">{index + 1}</span>
                  <Icon name={game.glyph} className="h-5 w-5" />
                  <span className="flex-1 text-sm font-light">{game.title}</span>
                  <span className="label">{SKILLS[game.skill].label}</span>
                </Link>
              );
            })}
          </div>
          <Link href="/daily" className="label tap box-fill block w-full py-4 text-center text-[11px]">
            {daily?.completed ? "Play again" : "Play now"}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px bg-[var(--line)] lg:col-span-5">
          <Cell label="Games today" value={String(todayStats.played)} />
          <Cell label="Best today" value={todayStats.best ? todayStats.best.toLocaleString() : "—"} />
          <Cell label="Streak" value={`${streak} d`} />
          <Cell
            label="Avg reaction"
            value={todayStats.avgReaction ? `${todayStats.avgReaction} ms` : "—"}
          />
        </div>
      </section>

      {recent.length ? (
        <section className="animate-fade-up">
          <p className="label mb-3">Continue training</p>
          <div className="grid grid-cols-2 gap-px bg-[var(--line)] sm:grid-cols-4">
            {recent.map((id) => {
              const game = GAME_MAP[id];
              return (
                <Link
                  key={id}
                  href={`/play/${id}`}
                  className="tap flex flex-col gap-3 bg-[var(--surface)] p-4"
                >
                  <Icon name={game.glyph} className="h-6 w-6" strokeWidth={1.1} />
                  <span className="text-sm font-light leading-tight">{game.title}</span>
                  <span className="label">Best {personalBest(game.id).toLocaleString()}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="animate-fade-up">
        <div className="flex items-center justify-between">
          <p className="label">Recommended</p>
          <Link href="/games" className="label label-strong tap">
            All {GAMES.length} games →
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-px overflow-x-auto bg-[var(--line)] px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6">
          {recommended.map((id) => {
            const game = GAME_MAP[id];
            return (
              <Link
                key={id}
                href={`/play/${id}`}
                className="tap flex w-[132px] shrink-0 flex-col gap-3 bg-[var(--surface)] p-4 md:w-auto"
              >
                <Icon name={game.glyph} className="h-6 w-6" strokeWidth={1.1} />
                <span className="text-sm font-light leading-tight">{game.title}</span>
                <span className="label">{SKILLS[game.skill].label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="animate-fade-up grid gap-px bg-[var(--line)] lg:grid-cols-2">
        <div className="bg-[var(--surface)] p-4 md:p-6">
          <div className="flex items-center justify-between">
            <p className="label">Your skills</p>
            <Link href="/progress" className="label label-strong tap">
              Progress →
            </Link>
          </div>
          <div className="mt-5 space-y-3.5">
            {(Object.keys(SKILLS) as (keyof typeof SKILLS)[]).map((key) => (
              <SkillBar
                key={key}
                label={SKILLS[key].label}
                glyph={SKILLS[key].glyph}
                value={stats.skillRatings[key]}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col bg-[var(--surface)] p-4 md:p-6">
          <p className="label">How scoring works</p>
          <ul className="mt-5 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm font-light">
            <li className="flex justify-between py-2.5">
              <span>Correct answer</span>
              <span className="num">+100</span>
            </li>
            <li className="flex justify-between py-2.5">
              <span>Fast answer</span>
              <span className="num">+50</span>
            </li>
            <li className="flex justify-between py-2.5">
              <span>Combo streak</span>
              <span className="num">+25 each</span>
            </li>
            <li className="flex justify-between py-2.5">
              <span>Wrong answer</span>
              <span className="num">−50</span>
            </li>
          </ul>
          <p className="mt-5 text-sm font-light leading-relaxed text-muted">
            Difficulty climbs from Easy to Legend as you answer correctly. Better + faster =
            higher score. Play daily to keep your streak alive.
          </p>
          <p className="label mt-auto pt-6">
            {GAMES.length} games · {Object.keys(SKILLS).length} skills · offline ready
          </p>
        </div>
      </section>
    </main>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between bg-[var(--surface)] p-4 md:p-5">
      <p className="label">{label}</p>
      <p className="num mt-4 text-3xl">{value}</p>
    </div>
  );
}
