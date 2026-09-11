"use client";

import { useRef, useState } from "react";
import { Choices, pick, randInt, shuffle, uniqueOptions, type GameProps } from "./util";

function makeQuestion(level: number): { text: string; answer: number } {
  const ops = level <= 1 ? ["+", "-"] : level === 2 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
  const op = pick(ops);
  let a: number;
  let b: number;
  let answer: number;

  switch (op) {
    case "+":
      a = randInt(level >= 3 ? 24 : 6, level >= 3 ? 89 : 25);
      b = randInt(level >= 3 ? 18 : 5, level >= 3 ? 79 : 25);
      answer = a + b;
      break;
    case "-":
      a = randInt(level >= 3 ? 45 : 14, level >= 3 ? 99 : 30);
      b = randInt(4, a - 1);
      answer = a - b;
      break;
    case "×":
      a = randInt(level >= 4 ? 11 : 3, level >= 4 ? 19 : 9);
      b = randInt(level >= 4 ? 11 : 3, level >= 4 ? 15 : 9);
      answer = a * b;
      break;
    case "÷": {
      b = randInt(2, level >= 4 ? 13 : 9);
      answer = randInt(3, level >= 4 ? 14 : 9);
      a = b * answer;
      break;
    }
    default:
      a = randInt(5, 30);
      b = randInt(5, 30);
      answer = a + b;
  }

  if (level >= 5 && Math.random() < 0.4) {
    const c = randInt(3, 25);
    return { text: `${a} ${op} ${b} + ${c}`, answer: answer + c };
  }
  return { text: `${a} ${op} ${b}`, answer };
}

export default function QuickMath({ level, onRound }: GameProps) {
  const [question] = useState(() => makeQuestion(level));
  const [picked, setPicked] = useState<number | null>(null);
  const [values] = useState(() => shuffle(uniqueOptions(question.answer, 4, 6)));
  const startRef = useRef(Date.now());

  const handle = (value: number) => {
    if (picked !== null) return;
    setPicked(value);
    const correct = value === question.answer;
    window.setTimeout(
      () => onRound({ correct, reactionMs: Date.now() - startRef.current }),
      correct ? 120 : 420,
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-between gap-8">
      <div className="flex flex-1 items-center justify-center">
        <div key={question.text} className="animate-pop text-center">
          <p className="num text-5xl">{question.text}</p>
          <p className="label mt-3">= ?</p>
        </div>
      </div>
      <Choices
        options={values.map((value) => ({
          key: value,
          label: value,
          tone:
            picked === null
              ? "idle"
              : value === question.answer
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
