"use client";

import { useRef, useState } from "react";
import { Choices, randInt, shuffle, uniqueOptions, type GameProps } from "./util";

function makeSequence(level: number): { terms: number[]; answer: number } {
  const kinds =
    level <= 1
      ? ["add", "sub"]
      : level === 2
        ? ["add", "sub", "mul", "alt"]
        : ["mul", "alt", "square", "fib", "mixed"];

  const kind = shuffle(kinds)[0];
  switch (kind) {
    case "add": {
      const step = randInt(2, 4 + level * 2);
      const start = randInt(1, 12);
      const terms = [start, start + step, start + step * 2, start + step * 3];
      return { terms, answer: start + step * 4 };
    }
    case "sub": {
      const step = randInt(2, 5 + level);
      const start = randInt(60, 120);
      const terms = [start, start - step, start - step * 2, start - step * 3];
      return { terms, answer: start - step * 4 };
    }
    case "mul": {
      const ratio = level >= 4 ? randInt(2, 3) : 2;
      const start = randInt(2, 5);
      const terms = [start, start * ratio, start * ratio ** 2, start * ratio ** 3];
      return { terms, answer: start * ratio ** 4 };
    }
    case "alt": {
      const up = randInt(4, 12);
      const down = randInt(2, 6);
      const start = randInt(3, 20);
      const terms = [start, start + up, start + up - down, start + up * 2 - down];
      return { terms, answer: start + up * 2 };
    }
    case "square": {
      const offset = randInt(0, 2);
      const start = randInt(1, 4);
      const terms = [0, 1, 2, 3].map((i) => (start + i) ** 2 + offset);
      return { terms, answer: (start + 4) ** 2 + offset };
    }
    case "fib": {
      let a = randInt(1, 4);
      let b = randInt(2, 6);
      const terms: number[] = [];
      for (let i = 0; i < 4; i += 1) {
        terms.push(a);
        const next = a + b;
        a = b;
        b = next;
      }
      return { terms, answer: a };
    }
    default: {
      const step = randInt(3, 7);
      const start = randInt(2, 9);
      const terms = [start, start * 2, start * 2 + step, (start * 2 + step) * 2];
      return { terms, answer: (start * 2 + step) * 2 + step };
    }
  }
}

export default function NumberSequence({ level, onRound }: GameProps) {
  const [data] = useState(() => makeSequence(level));
  const [values] = useState(() => shuffle(uniqueOptions(data.answer, 4, Math.max(3, 9 - level))));
  const [picked, setPicked] = useState<number | null>(null);
  const startRef = useRef(Date.now());

  const handle = (value: number) => {
    if (picked !== null) return;
    setPicked(value);
    const correct = value === data.answer;
    window.setTimeout(
      () => onRound({ correct, reactionMs: Date.now() - startRef.current }),
      correct ? 150 : 550,
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-between gap-8">
      <div className="flex flex-1 items-center justify-center">
        <div className="grid w-full max-w-[320px] grid-cols-5 gap-px bg-[var(--line)]">
          {data.terms.map((term, i) => (
            <span
              key={`${term}-${i}`}
              className="animate-pop flex aspect-square items-center justify-center bg-[var(--surface)] num text-xl"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {term}
            </span>
          ))}
          <span className="flex aspect-square animate-blink items-center justify-center border border-dashed border-[var(--text)] bg-[var(--surface)] text-xl font-light">
            ?
          </span>
        </div>
      </div>
      <Choices
        options={values.map((value) => ({
          key: value,
          label: value,
          tone:
            picked === null
              ? "idle"
              : value === data.answer
                ? "good"
                : value === picked
                  ? "bad"
                  : "idle",
        }))}
        onPick={handle}
        disabled={picked !== null}
      />
    </div>
  );
}
