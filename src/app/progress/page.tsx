"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp } from "@/components/AppProvider";
import Icon from "@/components/Icon";
import SkillBar from "@/components/SkillBar";
import { GAMES, SKILLS, todayKey, type SkillKey } from "@/lib/games";

const RANGES = [
  { key: 7, label: "7d" },
  { key: 30, label: "30d" },
  { key: 90, label: "90d" },
] as const;

export default function ProgressPage() {
  const { stats, sessions, streak, playDays, personalBest } = useApp();
  const [range, setRange] = useState<7 | 30 | 90>(7);

  const series = useMemo(() => {
    const days: { day: string; score: number }[] = [];
    for (let i = range - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      const todays = sessions.filter((s) => s.day === key);
      days.push({
        day: key,
        score: todays.length
          ? Math.round(todays.reduce((a, b) => a + b.score, 0) / todays.length)
          : 0,
      });
    }
    return days;
  }, [range, sessions]);

  const played = series.filter((s) => s.score > 0);
  const trend = useMemo(() => {
    if (played.length < 2) return null;
    const half = Math.floor(played.length / 2);
    const older = played.slice(0, half);
    const newer = played.slice(half);
    const avg = (arr: typeof played) =>
      Math.round(arr.reduce((a, b) => a + b.score, 0) / arr.length);
    const diff = avg(newer) - avg(older);
    if (diff === 0) return null;
    return { diff, pct: Math.round((Math.abs(diff) / Math.max(1, avg(older))) * 100) };
  }, [played]);

  const week = useMemo(() => {
    const labels = ["M", "T", "W", "T", "F", "S", "S"];
    const marks: boolean[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      marks.push(playDays.includes(todayKey(d)));
    }
    return { labels, marks };
  }, [playDays]);

  const topGames = useMemo(
    () =>
      [...GAMES]
        .map((g) => ({
          game: g,
          rating: Math.min(100, Math.round((personalBest(g.id) / g.target) * 100)),
        }))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 6),
    [personalBest],
  );

  return (
    <main className="flex flex-col gap-8 pt-8 md:gap-10 md:pt-12">
      <header className="animate-fade-up">
        <p className="label">Progress</p>
        <h1 className="num mt-2 text-3xl leading-tight md:text-5xl">Your brain score</h1>
      </header>

      <section className="animate-fade-up grid gap-px bg-[var(--line)] lg:grid-cols-12">
        <div className="flex flex-col bg-[var(--surface)] p-4 md:p-6 lg:col-span-4">
          <p className="label">Brain score</p>
          <p className="num mt-3 text-6xl md:text-7xl">{stats.brainScore.toLocaleString()}</p>
          <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3">
            <p className="label">{stats.totalGames} games played</p>
            <p className="label flex items-center gap-2">
              <Icon name="flame" className="h-3.5 w-3.5" /> {streak} d streak
            </p>
          </div>
          {trend ? (
            <p className="label mt-3">
              {trend.diff > 0 ? "+" : "−"}
              {trend.pct}% vs earlier {range}d
            </p>
          ) : null}
        </div>

        <div className="bg-[var(--surface)] p-4 md:p-6 lg:col-span-8">
          <div className="flex items-center justify-between">
            <p className="label">Performance · average score per day</p>
            <div className="flex gap-px bg-[var(--line)]">
              {RANGES.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className={`label tap px-3 py-1.5 ${
                    range === option.key ? "box-fill" : "bg-[var(--surface)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <Chart data={series.map((s) => s.score)} />
          <p className="label text-center">{played.length} active days</p>
        </div>
      </section>

      <section className="animate-fade-up grid gap-px bg-[var(--line)] lg:grid-cols-2">
        <div className="bg-[var(--surface)] p-4 md:p-6">
          <p className="label">Skills</p>
          <div className="mt-5 space-y-3.5">
            {(Object.keys(SKILLS) as SkillKey[]).map((key) => (
              <SkillBar
                key={key}
                label={SKILLS[key].label}
                glyph={SKILLS[key].glyph}
                value={stats.skillRatings[key]}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-px bg-[var(--line)]">
          <div className="bg-[var(--surface)] p-4 md:p-6">
            <p className="label mb-4">This week</p>
            <div className="grid grid-cols-7 gap-px bg-[var(--line)]">
              {week.marks.map((mark, i) => (
                <div
                  key={i}
                  className={`flex aspect-square items-center justify-center ${
                    mark ? "box-fill" : "bg-[var(--surface)]"
                  }`}
                >
                  <span className="label">{mark ? "✓" : week.labels[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-px bg-[var(--line)]">
            <Record
              label="Fastest reaction"
              value={stats.bestReaction ? `${stats.bestReaction} ms` : "—"}
            />
            <Record
              label="Highest score"
              value={Math.max(0, ...Object.values(stats.bests)).toLocaleString()}
            />
            <Record
              label="Best accuracy"
              value={stats.bestAccuracy ? `${stats.bestAccuracy}%` : "—"}
            />
            <Record label="Longest streak" value={`${stats.longestStreak || streak} d`} />
          </div>
        </div>
      </section>

      <section className="animate-fade-up grid gap-px bg-[var(--line)] lg:grid-cols-12">
        <div className="bg-[var(--surface)] lg:col-span-5">
          <div className="flex items-center justify-between p-4 pb-3 md:p-6 md:pb-4">
            <p className="label">Top games</p>
            <Link href="/games" className="label label-strong tap">
              Play →
            </Link>
          </div>
          {topGames.map(({ game, rating }) => (
            <Link
              key={game.id}
              href={`/play/${game.id}`}
              className="tap flex items-center gap-3 border-t border-[var(--line)] px-4 py-3 md:px-6"
            >
              <Icon name={game.glyph} className="h-5 w-5" strokeWidth={1.1} />
              <span className="flex-1 text-sm font-light">{game.title}</span>
              <span className="h-px w-24 bg-[var(--line)]">
                <span className="block h-px bg-[var(--fill)]" style={{ width: `${rating}%` }} />
              </span>
              <span className="label w-8 text-right tabular-nums">{rating}</span>
            </Link>
          ))}
        </div>

        <div className="bg-[var(--surface)] lg:col-span-7">
          <p className="label p-4 pb-3 md:p-6 md:pb-4">Best per game</p>
          <div className="grid grid-cols-2 gap-px border-t border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
            {GAMES.map((game) => {
              const best = personalBest(game.id);
              return (
                <Link
                  key={game.id}
                  href={`/play/${game.id}`}
                  className="tap flex items-center justify-between bg-[var(--surface)] px-3 py-3 md:px-4"
                >
                  <span className="flex items-center gap-2 text-[11px] font-light">
                    <Icon name={game.glyph} className="h-3.5 w-3.5" strokeWidth={1.1} />
                    {game.title}
                  </span>
                  <span className="num text-xs">{best ? best.toLocaleString() : "—"}</span>
                </Link>
              );
            })}
          </div>
          <p className="label border-t border-[var(--line)] p-4 md:px-6">
            {GAMES.filter((g) => personalBest(g.id) > 0).length}/{GAMES.length} games tried
          </p>
        </div>
      </section>
    </main>
  );
}

function Record({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-between bg-[var(--surface)] p-4 md:p-5">
      <p className="label">{label}</p>
      <p className="num mt-3 text-2xl">{value}</p>
    </div>
  );
}

function Chart({ data }: { data: number[] }) {
  const width = 640;
  const height = 180;
  const max = Math.max(10, ...data);
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 16) - 8;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = points.join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-4 h-36 w-full md:h-48"
      preserveAspectRatio="none"
      role="img"
      aria-label="Score chart"
    >
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1="0"
          x2={width}
          y1={height * f}
          y2={height * f}
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="1"
        />
      ))}
      <polygon points={area} fill="currentColor" fillOpacity="0.08" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      />
      {data.map((value, index) =>
        value > 0 ? (
          <rect
            key={index}
            x={index * step - 2}
            y={height - (value / max) * (height - 16) - 10}
            width="4"
            height="4"
            fill="currentColor"
          />
        ) : null,
      )}
    </svg>
  );
}
