"use client";

import { useEffect, useMemo, useState } from "react";
import { Choices, Prompt, randInt, shuffle, uniqueOptions, type GameProps } from "./util";

const SYMBOLS = ["▲", "●", "■", "◆", "★", "✚"];

export default function FastCount({ level, onRound }: GameProps) {
  const cols = Math.min(7, 4 + Math.floor(level / 2));
  const rows = Math.min(6, 3 + Math.floor(level / 3));
  const variety = Math.min(SYMBOLS.length, 2 + Math.floor(level / 2));

  const data = useMemo(() => {
    const pool = shuffle(SYMBOLS).slice(0, variety);
    const target = pool[0];
    const cells: string[] = [];
    let targetCount = 0;
    for (let i = 0; i < cols * rows; i += 1) {
      const symbol = Math.random() < 0.32 ? target : shuffle(pool)[0];
      if (symbol === target) targetCount += 1;
      cells.push(symbol);
    }
    if (targetCount === 0) {
      cells[0] = target;
      targetCount = 1;
    }
    return { target, cells, targetCount, options: shuffle(uniqueOptions(targetCount, 4, 3)) };
  }, [cols, rows, variety]);

  const [phase, setPhase] = useState<"show" | "answer">("show");
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setPhase("answer"), Math.max(520, 1300 - level * 110));
    return () => window.clearTimeout(id);
  }, [level, data.targetCount]);

  const handle = (value: number) => {
    if (picked !== null) return;
    setPicked(value);
    const correct = value === data.targetCount;
    window.setTimeout(() => onRound({ correct }), correct ? 130 : 520);
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-6">
      <Prompt>
        {phase === "show" ? `Remember the ${data.target}` : `How many ${data.target} ?`}
      </Prompt>
      <div
        className="mx-auto grid w-full max-w-[320px] gap-px bg-[var(--line)]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {data.cells.map((symbol, index) => (
          <span
            key={index}
            className="flex aspect-square items-center justify-center bg-[var(--surface)] text-lg font-light"
          >
            {phase === "show" ? symbol : ""}
          </span>
        ))}
      </div>
      {phase === "answer" ? (
        <Choices
          options={data.options.map((value) => ({
            key: value,
            label: value,
            tone:
              picked === null
                ? "idle"
                : value === data.targetCount
                  ? "good"
                  : value === picked
                    ? "bad"
                    : "idle",
          }))}
          onPick={handle}
          disabled={picked !== null}
        />
      ) : null}
    </div>
  );
}
