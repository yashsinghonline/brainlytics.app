"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import Icon from "@/components/Icon";
import Mark from "@/components/Mark";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { GAMES } from "@/lib/games";
import type { GlyphName } from "@/lib/glyphs";

const AVATARS: GlyphName[] = [
  "diamond",
  "target",
  "bolt",
  "grid",
  "star",
  "focus",
  "pattern",
  "logic",
  "memory",
  "crown",
];

interface LeaderRow {
  rank: number;
  name: string;
  avatar: string;
  score: number;
  isYou: boolean;
}

export default function ProfilePage() {
  const {
    name,
    avatar,
    stats,
    streak,
    achievements,
    settings,
    updateSettings,
    updateProfile,
    resetProgress,
    playerId,
  } = useApp();
  const [draftName, setDraftName] = useState(name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [range, setRange] = useState<"today" | "week" | "month" | "all">("today");
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);

  useEffect(() => setDraftName(name), [name]);

  useEffect(() => {
    const BOT_PLAYERS = [
      { name: "NeuroPulse", avatar: "crown", base: 4200 },
      { name: "Synapse-9", avatar: "bolt", base: 3850 },
      { name: "CortexAlpha", avatar: "star", base: 3400 },
      { name: "MindDrift", avatar: "target", base: 2950 },
      { name: "AxonRider", avatar: "focus", base: 2600 },
      { name: "LogicLoop", avatar: "logic", base: 2100 },
      { name: "GridMaster", avatar: "grid", base: 1750 },
      { name: "ChronoTap", avatar: "pattern", base: 1400 },
      { name: "NovaThink", avatar: "memory", base: 950 },
    ];
    const userScore = stats.brainScore || 0;
    const multiplier = range === "today" ? 0.4 : range === "week" ? 1 : range === "month" ? 3 : 4.2;
    const all = [
      { rank: 1, name: name || "You", avatar: avatar || "diamond", score: Math.round(userScore * (range === "today" ? 0.6 : 1)), isYou: true },
      ...BOT_PLAYERS.map((b) => ({
        rank: 0,
        name: b.name,
        avatar: b.avatar,
        score: Math.round(b.base * multiplier),
        isYou: false,
      })),
    ]
      .sort((a, b) => b.score - a.score)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    setLeaders(all);
  }, [range, name, avatar, stats.brainScore]);

  const unlocked = new Set(achievements);

  return (
    <main className="flex flex-col gap-8 pt-8 md:gap-10 md:pt-12">
      <header className="animate-fade-up">
        <p className="label">Profile</p>
        <h1 className="num mt-2 text-3xl leading-tight md:text-5xl">Your brain gym</h1>
      </header>

      <div className="grid gap-8 lg:grid-cols-12 lg:gap-px lg:bg-[var(--line)]">
        {/* left column */}
        <div className="flex flex-col gap-8 lg:col-span-4 lg:gap-px lg:bg-[var(--line)]">
          <section className="animate-fade-up card flex items-center gap-4 p-4 lg:border-0 md:p-6">
            <Mark value={avatar} className="h-8 w-8" box />
            <div className="min-w-0 flex-1">
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value.slice(0, 18))}
                onBlur={() => updateProfile({ name: draftName.trim() || "Player" })}
                className="num w-full bg-transparent text-xl outline-none"
                aria-label="Your name"
              />
              <p className="label mt-1">
                {stats.brainScore.toLocaleString()} · {stats.totalGames} games · {streak} d
              </p>
            </div>
          </section>

          <section className="animate-fade-up bg-[var(--surface)] lg:p-6">
            <p className="label mb-3">Mark</p>
            <div className="grid grid-cols-5 gap-px bg-[var(--line)]">
              {AVATARS.map((glyph) => (
                <button
                  key={glyph}
                  type="button"
                  onClick={() => updateProfile({ avatar: glyph })}
                  className={`tap flex aspect-square items-center justify-center ${
                    avatar === glyph ? "box-fill" : "bg-[var(--surface)]"
                  }`}
                  aria-label={`Choose ${glyph} mark`}
                >
                  <Icon name={glyph} className="h-5 w-5" />
                </button>
              ))}
            </div>
          </section>

          <section className="animate-fade-up card lg:border-0">
            <p className="label p-4 pb-3 md:p-6 md:pb-4">Settings</p>
            <Toggle
              label="Sound"
              hint="Feedback beeps"
              value={settings.sound}
              onChange={(v) => updateSettings({ sound: v })}
            />
            <Toggle
              label="Haptics"
              hint="Vibration on taps"
              value={settings.haptics}
              onChange={(v) => updateSettings({ haptics: v })}
            />
            <Toggle
              label="Dark mode"
              hint="Invert the palette"
              value={settings.theme === "dark"}
              onChange={(v) => updateSettings({ theme: v ? "dark" : "light" })}
            />
            <Toggle
              label="Notifications"
              hint="Daily challenge reminder"
              value={settings.notifications}
              onChange={(v) => updateSettings({ notifications: v })}
            />
          </section>

          <section className="animate-fade-up card p-4 lg:border-0 md:p-6">
            <p className="label">Data</p>
            <p className="mt-3 text-xs font-light leading-relaxed text-muted">
              Scores are saved on this device and synced to your private profile — no account
              needed. All {GAMES.length} games work fully offline.
            </p>
            {confirmReset ? (
              <div className="mt-4 grid grid-cols-2 gap-px bg-[var(--line)]">
                <button
                  type="button"
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                  }}
                  className="label tap box-fill py-3"
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="label tap bg-[var(--surface)] py-3"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="label tap mt-4 w-full border border-[var(--line)] py-3"
              >
                Reset progress
              </button>
            )}
          </section>
        </div>

        {/* right column */}
        <div className="flex flex-col gap-8 lg:col-span-8 lg:gap-px lg:bg-[var(--line)]">
          <section className="animate-fade-up card lg:border-0">
            <div className="flex items-center justify-between p-4 pb-3 md:p-6 md:pb-4">
              <p className="label">Leaderboard</p>
              <div className="flex gap-px bg-[var(--line)]">
                {(["today", "week", "month", "all"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRange(option)}
                    className={`label tap px-2.5 py-1.5 md:px-3.5 ${
                      range === option ? "box-fill" : "bg-[var(--surface)]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            {leaders.length === 0 ? (
              <p className="label border-t border-[var(--line)] p-6 text-center">
                Play a game to enter the board
              </p>
            ) : (
              <div className="grid border-t border-[var(--line)] md:grid-cols-2 md:gap-px md:bg-[var(--line)]">
                {leaders.map((row) => (
                  <div
                    key={`${row.rank}-${row.name}`}
                    className={`flex items-center gap-3 border-b border-[var(--line)] px-4 py-3 last:border-b-0 md:border-b-0 md:px-6 ${
                      row.isYou ? "box-outline" : "bg-[var(--surface)]"
                    }`}
                  >
                    <span className="label w-5 tabular-nums">{row.rank}</span>
                    <Mark value={row.avatar} className="h-4 w-4" />
                    <span className="flex-1 truncate text-sm font-light">
                      {row.name}
                      {row.isYou ? " · you" : ""}
                    </span>
                    <span className="num text-sm">{row.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="animate-fade-up bg-[var(--surface)] lg:p-6">
            <p className="label mb-3">
              Achievements · {unlocked.size}/{ACHIEVEMENTS.length}
            </p>
            <div className="grid grid-cols-2 gap-px bg-[var(--line)] md:grid-cols-3">
              {ACHIEVEMENTS.map((achievement) => {
                const got = unlocked.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`flex gap-3 bg-[var(--surface)] p-3 md:p-4 ${got ? "" : "opacity-40"}`}
                  >
                    <Icon name={achievement.glyph} className="h-5 w-5 shrink-0" strokeWidth={1.1} />
                    <span>
                      <span className="block text-[11px] font-light leading-tight md:text-xs">
                        {achievement.title}
                      </span>
                      <span className="label mt-1 block">{achievement.desc}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <p className="label pb-2 text-center">Brain Games · v1.2 · built for one more round</p>
    </main>
  );
}

function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="tap flex w-full items-center justify-between border-t border-[var(--line)] px-4 py-3 text-left md:px-6"
      aria-pressed={value}
    >
      <span>
        <span className="block text-sm font-light">{label}</span>
        <span className="label mt-0.5 block">{hint}</span>
      </span>
      <span
        className={`flex h-6 w-11 shrink-0 items-center border p-0.5 ${
          value ? "box-fill justify-end" : "justify-start border-[var(--line)]"
        }`}
      >
        <span className={`h-3.5 w-3.5 ${value ? "bg-[var(--fill-text)]" : "bg-[var(--line)]"}`} />
      </span>
    </button>
  );
}
