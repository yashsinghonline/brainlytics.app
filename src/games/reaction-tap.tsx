"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { randInt, type GameProps } from "./util";

export default function ReactionTap({ round, onRound }: GameProps) {
  const [phase, setPhase] = useState<"wait" | "go" | "done">("wait");
  const [reaction, setReaction] = useState<number | null>(null);
  const goAt = useRef<number>(0);
  const reported = useRef(false);

  const report = useCallback(
    (correct: boolean, ms?: number) => {
      if (reported.current) return;
      reported.current = true;
      const points = correct && ms ? Math.max(60, Math.round(1150 - ms)) : undefined;
      onRound({ correct, reactionMs: ms, points });
    },
    [onRound],
  );

  useEffect(() => {
    const delay = randInt(1100, 3000);
    const id = window.setTimeout(() => {
      goAt.current = Date.now();
      setPhase("go");
    }, delay);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== " " && event.key !== "Enter")) return;
      event.preventDefault();
      handleTap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleTap = () => {
    if (phase === "wait") {
      setPhase("done");
      setReaction(null);
      report(false);
      return;
    }
    if (phase === "go") {
      const ms = Date.now() - goAt.current;
      setReaction(ms);
      setPhase("done");
      report(true, ms);
    }
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className={`flex w-full flex-1 flex-col items-center justify-center gap-4 border ${
        phase === "go"
          ? "box-fill"
          : phase === "wait"
            ? "border-[var(--line)] bg-[var(--surface-2)]"
            : "stripes border-[var(--line)] bg-[var(--surface-2)]"
      }`}
    >
      <span className="num text-4xl uppercase tracking-[0.12em]">
        {phase === "wait" ? "Wait" : phase === "go" ? "Tap" : "Too early"}
      </span>
      <span className="label">
        {phase === "wait" ? `Round ${round}` : phase === "go" ? "Now" : "Keep going"}
      </span>
      <span className="label hidden md:block">Space or click</span>
      {reaction !== null ? (
        <span className="animate-pop num text-3xl">{reaction} ms</span>
      ) : null}
    </button>
  );
}
