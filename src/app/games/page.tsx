"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AppProvider";
import Icon from "@/components/Icon";
import { GAMES, SKILLS, type GameDef, type SkillKey } from "@/lib/games";

type Filter = "all" | SkillKey;

function modeLabel(game: GameDef): string {
  if (game.config.durationSec) return `${game.config.durationSec}s timer`;
  if (game.config.lives) return `${game.config.lives} lives`;
  return `${game.config.rounds} rounds`;
}

export default function GamesPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const { personalBest } = useApp();

  const grouped =
    filter === "all"
      ? (Object.keys(SKILLS) as SkillKey[]).map((key) => ({
          key,
          items: GAMES.filter((g) => g.skill === key),
        }))
      : [
          {
            key: filter,
            items: GAMES.filter((g) => g.skill === filter || g.secondary === filter),
          },
        ];

  return (
    <main className="flex flex-col gap-8 pt-8 md:gap-10 md:pt-12">
      <header className="animate-fade-up flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label">Library</p>
          <h1 className="num mt-2 text-3xl leading-tight md:text-5xl">
            {GAMES.length} games.
            <br />
            One brain.
          </h1>
        </div>
        <p className="max-w-sm text-sm font-light leading-relaxed text-muted">
          Every game trains a different cognitive skill. Pick one, play for a minute, and
          watch your personal bests climb.
        </p>
      </header>

      <div className="no-scrollbar -mx-4 flex gap-px overflow-x-auto bg-[var(--line)] px-4 md:mx-0 md:px-0">
        <Chip active={filter === "all"} onClick={() => setFilter("all")} label="All" glyph="pattern" />
        {(Object.keys(SKILLS) as SkillKey[]).map((key) => (
          <Chip
            key={key}
            active={filter === key}
            onClick={() => setFilter(key)}
            label={SKILLS[key].label}
            glyph={SKILLS[key].glyph}
          />
        ))}
      </div>

      {grouped.map((group) => (
        <section key={group.key} className="animate-fade-up">
          <div className="mb-3 flex items-center justify-between">
            <p className="label flex items-center gap-2">
              <Icon name={SKILLS[group.key].glyph} className="h-3.5 w-3.5" strokeWidth={1.1} />
              {SKILLS[group.key].label} · {group.items.length}
            </p>
          </div>
          <div className="grid gap-px bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((game) => {
              const best = personalBest(game.id);
              return (
                <Link
                  key={game.id}
                  href={`/play/${game.id}`}
                  className="tap flex min-h-[172px] flex-col bg-[var(--surface)] p-5"
                >
                  <div className="flex items-start justify-between">
                    <Icon name={game.glyph} className="h-7 w-7" strokeWidth={1.05} />
                    <span className="label">
                      {String(game.n).padStart(2, "0")} · {SKILLS[game.skill].label}
                    </span>
                  </div>
                  <div className="mt-auto pt-6">
                    <p className="text-base font-light">{game.title}</p>
                    <p className="mt-1 text-[11px] font-light text-muted">{game.tagline}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
                    <span className="label">{modeLabel(game)}</span>
                    <span className="num text-sm">{best ? best.toLocaleString() : "—"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}

      <p className="label pb-2 text-center">Difficulty adapts as you improve</p>
    </main>
  );
}

function Chip({
  active,
  onClick,
  label,
  glyph,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  glyph: Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`label tap flex shrink-0 items-center gap-2 px-4 py-3 md:flex-1 md:justify-center ${
        active ? "box-fill" : "bg-[var(--surface)]"
      }`}
    >
      <Icon name={glyph} className="h-4 w-4" strokeWidth={active ? 1.5 : 1.1} />
      {label}
    </button>
  );
}
