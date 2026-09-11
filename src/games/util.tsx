"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";

export interface RoundResult {
  correct: boolean;
  reactionMs?: number;
  /** override the default scoring formula */
  points?: number;
}

export interface GameProps {
  /** difficulty level, starts at 1 and grows with performance */
  level: number;
  /** 1-based index of the current round */
  round: number;
  /** remaining seconds for timed games */
  timeLeft: number;
  onRound: (result: RoundResult) => void;
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function uniqueOptions(answer: number, count: number, spread = 4): number[] {
  const options = new Set<number>([answer]);
  let guard = 0;
  while (options.size < count && guard < 200) {
    guard += 1;
    const delta = randInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
    const candidate = answer + delta;
    if (candidate !== answer) options.add(candidate);
  }
  while (options.size < count) options.add(answer + options.size * 7 + 1);
  return shuffle([...options]);
}

/** Runs a callback after a delay, cleared on unmount. */
export function useDelayed(fn: () => void, ms: number) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(fn, [ms]);
  useEffect(() => {
    const id = window.setTimeout(callback, ms);
    return () => window.clearTimeout(id);
  }, [callback, ms]);
}

export interface ChoiceOption<K> {
  key: K;
  label: ReactNode;
  sub?: ReactNode;
  tone?: "good" | "bad" | "idle";
}

export function Choices<K extends string | number>({
  options,
  onPick,
  cols = 2,
  disabled = false,
  className = "",
}: {
  options: ChoiceOption<K>[];
  onPick: (key: K) => void;
  cols?: number;
  disabled?: boolean;
  className?: string;
}) {
  // desktop: number keys 1..n pick the matching option
  const optionsRef = useRef(options);
  optionsRef.current = options;
  useEffect(() => {
    if (disabled) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const n = Number(event.key);
      const current = optionsRef.current;
      if (!Number.isInteger(n) || n < 1 || n > current.length) return;
      event.preventDefault();
      onPick(current[n - 1].key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [disabled, onPick]);

  return (
    <div
      className={`grid gap-px bg-[var(--line)] ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {options.map((option, index) => (
        <button
          key={String(option.key)}
          type="button"
          disabled={disabled}
          onClick={() => onPick(option.key)}
          className={`tap relative flex min-h-[64px] items-center justify-center gap-2 px-3 py-3 text-center font-light ${
            option.tone === "good"
              ? "box-fill"
              : option.tone === "bad"
                ? "animate-shake stripes bg-[var(--surface)]"
                : "bg-[var(--surface)]"
          } disabled:opacity-100`}
        >
          {index < 9 ? (
            <kbd className="label absolute left-2 top-1.5 hidden font-sans md:block">{index + 1}</kbd>
          ) : null}
          {option.tone === "good" || option.tone === "bad" ? (
            <Icon
              name={option.tone === "good" ? "check" : "cross"}
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={1.6}
            />
          ) : null}
          <span className="num text-2xl">{option.label}</span>
          {option.sub ? <span className="label">{option.sub}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Prompt({ children }: { children: ReactNode }) {
  return <p className="label text-center">{children}</p>;
}
