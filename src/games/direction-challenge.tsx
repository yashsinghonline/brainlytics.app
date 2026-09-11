"use client";

import { useEffect, useRef, useState } from "react";
import { randInt, type GameProps } from "./util";

const DIRECTIONS = [
  { key: "up", glyph: "↑", label: "Up" },
  { key: "right", glyph: "→", label: "Right" },
  { key: "down", glyph: "↓", label: "Down" },
  { key: "left", glyph: "←", label: "Left" },
] as const;

type DirKey = (typeof DIRECTIONS)[number]["key"];
const OPPOSITE: Record<DirKey, DirKey> = { up: "down", down: "up", left: "right", right: "left" };

export default function DirectionChallenge({ level, onRound }: GameProps) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<DirKey | null>(null);
  const startRef = useRef(Date.now());

  const [state] = useState(() => {
    const invert = level >= 2 && Math.random() < 0.25 + level * 0.05;
    return { arrow: DIRECTIONS[randInt(0, 3)], invert };
  });

  const handle = (key: DirKey) => {
    if (picked) return;
    setPicked(key);
    const expected = state.invert ? OPPOSITE[state.arrow.key] : state.arrow.key;
    const correct = key === expected;
    window.setTimeout(() => {
      onRound({ correct, reactionMs: Date.now() - startRef.current });
      setPicked(null);
      setRound((r) => r + 1);
      startRef.current = Date.now();
    }, correct ? 90 : 400);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const map: Record<string, DirKey> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const key = map[event.key];
      if (key) {
        event.preventDefault();
        handle(key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, picked]);

  const arrowKey = state.invert ? OPPOSITE[state.arrow.key] : state.arrow.key;

  return (
    <div className="flex w-full flex-1 flex-col justify-between gap-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <span
          className={`label border px-3 py-1.5 ${
            state.invert ? "border-[var(--text)] text-[var(--text)]" : "border-[var(--line)]"
          }`}
        >
          {state.invert ? "Opposite" : "Match"}
        </span>
        <span key={`${round}`} className="animate-pop num text-8xl leading-none">
          {state.arrow.glyph}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--line)]">
        {DIRECTIONS.map((dir) => {
          const tone =
            picked === dir.key ? (dir.key === arrowKey ? "good" : "bad") : "idle";
          return (
            <button
              key={dir.key}
              type="button"
              onClick={() => handle(dir.key)}
              className={`tap flex min-h-[72px] items-center justify-center text-4xl font-light ${
                tone === "good"
                  ? "box-fill"
                  : tone === "bad"
                    ? "animate-shake stripes bg-[var(--surface)]"
                    : "bg-[var(--surface)]"
              }`}
            >
              {dir.glyph}
            </button>
          );
        })}
      </div>
    </div>
  );
}
