"use client";

import { useEffect, useState } from "react";
import { Prompt, type GameProps } from "./util";

function makeNumber(level: number): string {
  const digits = Math.min(9, 2 + level);
  let value = "";
  for (let i = 0; i < digits; i += 1) value += String(Math.floor(Math.random() * 10));
  return value;
}

export default function NumberMemory({ level, onRound }: GameProps) {
  const [target] = useState(() => makeNumber(level));
  const [phase, setPhase] = useState<"show" | "input">("show");
  const [entry, setEntry] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setPhase("input"), 650 + target.length * 240);
    return () => window.clearTimeout(id);
  }, [target.length]);

  const submit = () => {
    if (entry.length === 0) return;
    const correct = entry === target;
    setPhase("show");
    window.setTimeout(() => onRound({ correct }), correct ? 250 : 900);
  };

  const press = (digit: string) => {
    if (entry.length >= 12) return;
    setEntry((prev) => prev + digit);
  };

  useEffect(() => {
    if (phase !== "input") return;
    const onKey = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        setEntry((prev) => (prev.length >= 12 ? prev : prev + event.key));
      } else if (event.key === "Backspace") {
        event.preventDefault();
        setEntry((prev) => prev.slice(0, -1));
      } else if (event.key === "Enter") {
        event.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, entry, target]);

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-6">
      <Prompt>{phase === "show" ? "Memorise the number" : "Type it back"}</Prompt>
      <div className="flex min-h-[80px] items-center justify-center border-b border-[var(--line)] pb-4">
        {phase === "show" ? (
          <p key={target} className="animate-pop num text-4xl tracking-[0.18em]">
            {target}
          </p>
        ) : entry ? (
          <p className="num text-4xl tracking-[0.18em]">{entry}</p>
        ) : (
          <p className="num text-3xl text-muted tracking-[0.18em]">·····</p>
        )}
      </div>

      {phase === "input" ? (
        <div className="mx-auto grid w-full max-w-[280px] grid-cols-3 gap-px bg-[var(--line)]">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => press(digit)}
              className="tap num flex aspect-square items-center justify-center bg-[var(--surface)] text-2xl"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEntry("")}
            className="label tap flex aspect-square items-center justify-center bg-[var(--surface-2)]"
          >
            Clr
          </button>
          <button
            type="button"
            onClick={() => press("0")}
            className="tap num flex aspect-square items-center justify-center bg-[var(--surface)] text-2xl"
          >
            0
          </button>
          <button
            type="button"
            onClick={submit}
            className="label tap box-fill flex aspect-square items-center justify-center"
          >
            OK
          </button>
        </div>
      ) : null}
    </div>
  );
}
