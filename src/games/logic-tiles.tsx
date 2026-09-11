"use client";

import type { CSSProperties, ReactNode } from "react";
import { useRef, useState } from "react";
import { Prompt, randInt, shuffle, type GameProps } from "./util";

interface TileSpec {
  kind: "circle" | "arrow" | "dots" | "shape";
  rotation: number;
  count: number;
  glyph: string;
  variant: "solid" | "outline" | "half" | "ring";
}

function Tile({ spec, size = 72, filled = false }: { spec: TileSpec; size?: number; filled?: boolean }) {
  const style: CSSProperties = { width: size, height: size };
  const inner: ReactNode = (() => {
    if (spec.kind === "circle") {
      const box = size * 0.5;
      if (spec.variant === "half") {
        return (
          <span
            className="block"
            style={{
              width: box,
              height: box,
              border: "2px solid currentColor",
              background: "linear-gradient(90deg, currentColor 50%, transparent 50%)",
            }}
          />
        );
      }
      if (spec.variant === "ring") {
        return (
          <span
            className="flex items-center justify-center"
            style={{ width: box, height: box, border: "2px solid currentColor" }}
          >
            <span style={{ width: box * 0.3, height: box * 0.3, background: "currentColor" }} />
          </span>
        );
      }
      return (
        <span
          className="block"
          style={{
            width: box,
            height: box,
            background: spec.variant === "solid" ? "currentColor" : "transparent",
            border: "2px solid currentColor",
          }}
        />
      );
    }
    if (spec.kind === "arrow") {
      return (
        <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} style={{ transform: `rotate(${spec.rotation}deg)` }}>
          <path d="M12 20V4M5 11l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      );
    }
    if (spec.kind === "dots") {
      return (
        <span className="flex flex-wrap justify-center gap-1" style={{ width: size * 0.66 }}>
          {Array.from({ length: spec.count }, (_, i) => (
            <span
              key={i}
              style={{ width: size * 0.11, height: size * 0.11, background: "currentColor" }}
            />
          ))}
        </span>
      );
    }
    return <span style={{ fontSize: size * 0.42, lineHeight: 1 }}>{spec.glyph}</span>;
  })();

  return (
    <span
      className={`flex items-center justify-center border ${filled ? "box-fill" : "border-[var(--line)] bg-[var(--surface)]"}`}
      style={style}
    >
      {inner}
    </span>
  );
}

function makePuzzle(level: number) {
  const kinds: TileSpec["kind"][] =
    level <= 1
      ? ["circle", "shape"]
      : level === 2
        ? ["circle", "arrow", "shape"]
        : ["arrow", "dots", "shape", "circle"];
  const kind = shuffle(kinds)[0];
  const base = { rotation: 0, count: 0, glyph: "" };

  let tiles: TileSpec[];
  let answer: TileSpec;
  let options: TileSpec[];

  if (kind === "circle") {
    tiles = [0, 1, 2, 3].map((i) => ({
      kind,
      ...base,
      variant: i % 2 === 0 ? ("solid" as const) : ("outline" as const),
    }));
    answer = { kind, ...base, variant: "solid" };
    options = [
      answer,
      { ...answer, variant: "outline" },
      { ...answer, variant: "half" },
      { ...answer, variant: "ring" },
    ];
  } else if (kind === "arrow") {
    const start = randInt(0, 3) * 90;
    tiles = [0, 1, 2, 3].map((i) => ({
      kind,
      ...base,
      variant: "solid" as const,
      rotation: start + i * 90,
    }));
    answer = { kind, ...base, variant: "solid", rotation: start };
    options = [
      answer,
      { ...answer, rotation: start + 45 },
      { ...answer, rotation: start + 90 },
      { ...answer, rotation: start + 180 },
    ];
  } else if (kind === "dots") {
    const startCount = randInt(1, 2);
    tiles = [0, 1, 2, 3].map((i) => ({
      kind,
      ...base,
      variant: "solid" as const,
      count: startCount + i,
    }));
    answer = { kind, ...base, variant: "solid", count: startCount + 4 };
    options = [
      answer,
      { ...answer, count: startCount + 3 },
      { ...answer, count: startCount + 5 },
      { ...answer, count: startCount + 6 },
    ];
  } else {
    const glyphs = ["▲", "■", "●", "◆", "★"];
    const start = randInt(0, 2);
    tiles = [0, 1, 2, 3].map((i) => ({
      kind,
      ...base,
      variant: "solid" as const,
      glyph: glyphs[(start + i) % glyphs.length],
    }));
    answer = { kind, ...base, variant: "solid", glyph: glyphs[(start + 4) % glyphs.length] };
    options = [
      answer,
      ...shuffle(glyphs.filter((g) => g !== answer.glyph))
        .slice(0, 3)
        .map((g) => ({ ...answer, glyph: g })),
    ];
  }

  return { tiles, answer, options: shuffle(options) };
}

export default function LogicTiles({ level, onRound }: GameProps) {
  const [puzzle] = useState(() => makePuzzle(level));
  const [picked, setPicked] = useState<number | null>(null);
  const startRef = useRef(Date.now());

  const isCorrect = (option: TileSpec) => JSON.stringify(option) === JSON.stringify(puzzle.answer);

  const handle = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    const correct = isCorrect(puzzle.options[index]);
    window.setTimeout(
      () => onRound({ correct, reactionMs: Date.now() - startRef.current }),
      correct ? 160 : 560,
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-8">
      <Prompt>Which tile is next?</Prompt>
      <div className="flex items-center justify-center gap-px bg-[var(--line)]">
        {puzzle.tiles.map((tile, i) => (
          <span key={i} className="animate-pop" style={{ animationDelay: `${i * 60}ms` }}>
            <Tile spec={tile} size={64} />
          </span>
        ))}
      </div>
      <div className="mx-auto grid w-full max-w-[300px] grid-cols-4 gap-px bg-[var(--line)]">
        {puzzle.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handle(index)}
            className="tap flex justify-center bg-[var(--surface)] py-3"
          >
            <Tile spec={option} size={60} filled={picked !== null && isCorrect(option)} />
          </button>
        ))}
      </div>
    </div>
  );
}
