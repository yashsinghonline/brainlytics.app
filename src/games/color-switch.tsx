"use client";

import { useEffect, useRef, useState } from "react";
import { Choices, pick, shuffle, type GameProps } from "./util";

interface InkColor {
  name: string;
  hex: string;
}

/** Ink hues are the game content — everything around them stays greyscale. */
const PALETTE: InkColor[] = [
  { name: "RED", hex: "#e11d48" },
  { name: "BLUE", hex: "#2563eb" },
  { name: "GREEN", hex: "#16a34a" },
  { name: "YELLOW", hex: "#ca8a04" },
  { name: "PURPLE", hex: "#7c3aed" },
  { name: "ORANGE", hex: "#ea580c" },
];

export default function ColorSwitch({ level, onRound }: GameProps) {
  const poolSize = Math.min(PALETTE.length, 4 + Math.floor(level / 2));
  const [data] = useState(() => {
    const pool = shuffle(PALETTE).slice(0, poolSize);
    const ink = pick(pool);
    const conflicting = level < 2 && Math.random() < 0.3;
    const word = conflicting ? ink : pick(pool.filter((c) => c.name !== ink.name));
    const distractors = shuffle(pool.filter((c) => c.name !== ink.name)).slice(0, 3);
    return { ink, word, options: shuffle([ink, ...distractors]) };
  });
  const [picked, setPicked] = useState<string | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (picked) return;
    const onKey = (event: KeyboardEvent) => {
      const n = Number(event.key);
      if (!Number.isInteger(n) || n < 1 || n > data.options.length) return;
      event.preventDefault();
      handle(data.options[n - 1].name);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked, data.options]);

  const handle = (name: string) => {
    if (picked) return;
    setPicked(name);
    const correct = name === data.ink.name;
    window.setTimeout(
      () => onRound({ correct, reactionMs: Date.now() - startRef.current }),
      correct ? 110 : 380,
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-between gap-8">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <p className="label">Tap the ink colour</p>
        <p
          key={`${data.word.name}-${data.ink.hex}`}
          className="animate-pop num text-6xl uppercase"
          style={{ color: data.ink.hex }}
        >
          {data.word.name}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[var(--line)]">
        {data.options.map((color, index) => {
          const tone =
            picked === null
              ? "idle"
              : color.name === data.ink.name
                ? "good"
                : color.name === picked
                  ? "bad"
                  : "idle";
          return (
            <button
              key={color.name}
              type="button"
              disabled={picked !== null}
              onClick={() => handle(color.name)}
              className={`tap relative flex min-h-[64px] items-center justify-center gap-2.5 ${
                tone === "good" ? "box-fill" : tone === "bad" ? "stripes bg-[var(--surface)]" : "bg-[var(--surface)]"
              }`}
            >
              <kbd className="label absolute left-2 top-1.5 hidden font-sans md:block">{index + 1}</kbd>
              <span
                aria-hidden
                className="inline-block h-4 w-4 border border-black/20"
                style={{ background: color.hex }}
              />
              <span className="text-sm font-light uppercase tracking-[0.14em]">{color.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
