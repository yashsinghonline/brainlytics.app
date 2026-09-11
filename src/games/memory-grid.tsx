"use client";

import { useEffect, useMemo, useState } from "react";
import { Prompt, shuffle, type GameProps } from "./util";

const SIZES = [3, 4, 4, 5, 5, 6];

export default function MemoryGrid({ level, onRound }: GameProps) {
  const size = SIZES[Math.min(SIZES.length - 1, level - 1)];
  const target = Math.min(size * size - 3, 2 + level);

  const { highlighted } = useMemo(() => {
    const cells = Array.from({ length: size * size }, (_, i) => i);
    const chosen = shuffle(cells).slice(0, target);
    return { highlighted: new Set(chosen) };
  }, [size, target]);

  const [phase, setPhase] = useState<"show" | "recall" | "reveal">("show");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [wrongPicks, setWrongPicks] = useState<Set<number>>(new Set());

  useEffect(() => {
    const showMs = Math.max(700, 500 + target * 380);
    const id = window.setTimeout(() => setPhase("recall"), showMs);
    return () => window.clearTimeout(id);
  }, [target]);

  const submit = (picks: Set<number>) => {
    const misses = [...highlighted].filter((c) => !picks.has(c)).length;
    const wrong = [...picks].filter((c) => !highlighted.has(c));
    setWrongPicks(new Set(wrong));
    setPhase("reveal");
    const correct = misses === 0 && wrong.length === 0;
    window.setTimeout(() => onRound({ correct }), correct ? 320 : 900);
  };

  const tap = (index: number) => {
    if (phase !== "recall" || selected.has(index)) return;
    const next = new Set(selected).add(index);
    setSelected(next);
    if (next.size >= target) submit(next);
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-6">
      <Prompt>
        {phase === "show" ? "Memorise" : phase === "recall" ? "Tap the squares" : "Like this"}
      </Prompt>
      <div
        className="mx-auto grid w-full max-w-[320px] gap-px bg-[var(--line)]"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, index) => {
          const isTarget = highlighted.has(index);
          const isPicked = selected.has(index);
          const isWrong = wrongPicks.has(index);
          const lit = phase === "show" ? isTarget : phase === "reveal" ? isTarget : isPicked;
          return (
            <button
              key={index}
              type="button"
              aria-label={`cell ${index + 1}`}
              onClick={() => tap(index)}
              className={`tap aspect-square ${
                isWrong ? "stripes" : lit ? "box-fill" : "bg-[var(--surface)]"
              }`}
            />
          );
        })}
      </div>
      <p className="label text-center">
        {selected.size}/{target} selected
      </p>
    </div>
  );
}
