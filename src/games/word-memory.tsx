"use client";

import { useEffect, useMemo, useState } from "react";
import { Prompt, shuffle, type GameProps } from "./util";

const POOL = [
  "APPLE", "TRAIN", "MOON", "CHAIR", "RIVER", "CLOUD", "STONE", "LEMON", "TIGER", "PLANT",
  "BREAD", "SMILE", "GLASS", "STORM", "PIANO", "CANDLE", "ROBOT", "ISLAND", "FEATHER", "MIRROR",
  "GARDEN", "BUTTON", "ORANGE", "SILVER", "THUNDER", "MARBLE", "VIOLET", "HORIZON",
];

export default function WordMemory({ level, onRound }: GameProps) {
  const count = Math.min(8, 3 + level);

  const data = useMemo(() => {
    const words = shuffle(POOL).slice(0, count * 2);
    const originals = words.slice(0, count);
    return { originals: new Set(originals), list: shuffle(words) };
  }, [count]);

  const [phase, setPhase] = useState<"show" | "select">("show");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setPhase("select"), 1200 + count * 550);
    return () => window.clearTimeout(id);
  }, [count]);

  const check = () => {
    if (checked) return;
    setChecked(true);
    let hits = 0;
    let falseAlarms = 0;
    for (const word of selected) {
      if (data.originals.has(word)) hits += 1;
      else falseAlarms += 1;
    }
    const correct = hits === data.originals.size && falseAlarms === 0;
    const points = Math.max(0, hits * 120 - falseAlarms * 60);
    window.setTimeout(() => onRound({ correct, points }), correct ? 400 : 900);
  };

  const toggle = (word: string) => {
    if (checked) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-5">
      <Prompt>{phase === "show" ? `Memorise ${count} words` : "Select the words you saw"}</Prompt>

      {phase === "show" ? (
        <div className="flex flex-wrap justify-center gap-px bg-[var(--line)]">
          {[...data.originals].map((word, i) => (
            <span
              key={word}
              className="animate-pop bg-[var(--surface)] px-3 py-2 text-sm font-light tracking-[0.08em]"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {word}
            </span>
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap justify-center gap-px bg-[var(--line)]">
            {data.list.map((word) => {
              const isOriginal = data.originals.has(word);
              const isSelected = selected.has(word);
              const tone = checked
                ? isOriginal
                  ? "box-fill"
                  : isSelected
                    ? "stripes bg-[var(--surface)]"
                    : "bg-[var(--surface)]"
                : isSelected
                  ? "box-fill"
                  : "bg-[var(--surface)]";
              return (
                <button
                  key={word}
                  type="button"
                  onClick={() => toggle(word)}
                  className={`tap px-3 py-2 text-sm font-light tracking-[0.08em] ${tone}`}
                >
                  {word}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={check}
            disabled={selected.size === 0 || checked}
            className="label tap box-fill w-full py-4 disabled:opacity-40"
          >
            {checked ? "Checking" : `Check ${selected.size}`}
          </button>
        </>
      )}
    </div>
  );
}
