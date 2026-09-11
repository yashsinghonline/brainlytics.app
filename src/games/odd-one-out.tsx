"use client";

import { useMemo, useState } from "react";
import { Prompt, randInt, type GameProps } from "./util";

const SIZES = [3, 3, 4, 4, 5, 6];

export default function OddOneOut({ level, onRound }: GameProps) {
  const size = SIZES[Math.min(SIZES.length - 1, level - 1)];
  const { baseLight, delta, oddIndex } = useMemo(
    () => ({
      baseLight: randInt(40, 62),
      delta: Math.max(3, 22 - level * 3),
      oddIndex: randInt(0, size * size - 1),
    }),
    [size, level],
  );

  const [locked, setLocked] = useState(false);

  const tap = (index: number) => {
    if (locked) return;
    setLocked(true);
    const correct = index === oddIndex;
    window.setTimeout(() => onRound({ correct }), correct ? 120 : 550);
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-6">
      <Prompt>Tap the odd shade</Prompt>
      <div
        className="mx-auto grid w-full max-w-[320px] gap-px bg-[var(--line)]"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: size * size }, (_, index) => {
          const isOdd = index === oddIndex;
          return (
            <button
              key={index}
              type="button"
              aria-label={`tile ${index + 1}`}
              onClick={() => tap(index)}
              className={`tap aspect-square ${locked && isOdd ? "box-outline" : ""}`}
              style={{
                background: `hsl(0 0% ${isOdd ? baseLight + delta : baseLight}%)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
