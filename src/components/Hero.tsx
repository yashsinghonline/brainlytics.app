"use client";

import Link from "next/link";
import Icon from "@/components/Icon";
import { GAMES } from "@/lib/games";

const STEPS = [
  { glyph: "library" as const, title: "Choose a game", text: "12 games across 6 cognitive skills." },
  { glyph: "bolt" as const, title: "Play 1–5 minutes", text: "Short rounds. Difficulty adapts to you." },
  { glyph: "chart" as const, title: "Beat your score", text: "Streaks, records and a growing brain score." },
];

export default function Hero({ onDismiss }: { onDismiss: () => void }) {
  return (
    <section className="animate-fade-up card grid lg:grid-cols-12">
      <div className="flex flex-col gap-8 p-6 md:p-10 lg:col-span-7">
        <p className="label">Brain training · Free · Works offline</p>
        <h1 className="num text-5xl uppercase leading-[0.98] md:text-7xl">
          Train your
          <br />
          brain.
        </h1>
        <p className="max-w-md text-sm font-light leading-relaxed text-muted md:text-base">
          One minute at a time. Fast games for memory, logic, speed, math and focus — with a
          daily challenge, streaks and a brain score that grows with you. No account needed.
        </p>
        <div className="flex flex-col gap-px bg-[var(--line)] sm:flex-row">
          <Link
            href="/games"
            onClick={onDismiss}
            className="label tap box-fill flex-1 px-8 py-5 text-center text-[11px]"
          >
            Start training
          </Link>
          <Link
            href="/daily"
            onClick={onDismiss}
            className="label tap flex-1 bg-[var(--surface)] px-8 py-5 text-center text-[11px]"
          >
            Daily challenge
          </Link>
        </div>
        <ol className="grid gap-px bg-[var(--line)] sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <Icon name={step.glyph} className="h-5 w-5" strokeWidth={1.1} />
                <span className="label">0{index + 1}</span>
              </div>
              <div>
                <p className="text-sm font-light">{step.title}</p>
                <p className="label mt-1 normal-case tracking-normal">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-[var(--line)] lg:col-span-5 lg:border-l lg:border-t-0">
        <div className="grid h-full grid-cols-3 gap-px bg-[var(--line)] sm:grid-cols-4 lg:grid-cols-3">
          {GAMES.map((game) => (
            <Link
              key={game.id}
              href={`/play/${game.id}`}
              onClick={onDismiss}
              className="tap flex aspect-square flex-col items-center justify-center gap-3 bg-[var(--surface)] p-3"
            >
              <Icon name={game.glyph} className="h-7 w-7" strokeWidth={1.05} />
              <span className="label text-center">{game.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
