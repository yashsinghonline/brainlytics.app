"use client";

import { useRef, useState } from "react";
import { Prompt, randInt, shuffle, type GameProps } from "./util";

const SHAPES = [
  "M22 18 H62 V40 H44 V78 H22 Z",
  "M20 20 H60 L78 50 L60 80 H20 L38 50 Z",
  "M50 16 L82 40 L70 80 H30 L18 40 Z",
];

function Shape({
  path,
  rotation,
  mirrored,
  size = 84,
}: {
  path: string;
  rotation: number;
  mirrored: boolean;
  size?: number;
}) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <g transform={`rotate(${rotation} 50 50) ${mirrored ? "translate(100 0) scale(-1 1)" : ""}`}>
        <path
          d={path}
          fill="currentColor"
          fillOpacity="0.12"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinejoin="miter"
        />
      </g>
    </svg>
  );
}

export default function MentalRotation({ level, onRound }: GameProps) {
  const [data] = useState(() => {
    const path = SHAPES[randInt(0, SHAPES.length - 1)];
    const baseRotation = randInt(0, 3) * 90;
    const answerRotation = (baseRotation + randInt(1, 3) * 90) % 360;
    const correct = { rotation: answerRotation, mirrored: false };
    const wrongs = shuffle([
      { rotation: (baseRotation + randInt(0, 3) * 90) % 360, mirrored: true },
      { rotation: (baseRotation + 180) % 360, mirrored: true },
      { rotation: randInt(0, 3) * 90, mirrored: true },
    ]);
    return { path, baseRotation, options: shuffle([correct, ...wrongs]) };
  });
  const [picked, setPicked] = useState<number | null>(null);
  const startRef = useRef(Date.now());

  const isCorrect = (index: number) => !data.options[index].mirrored;

  const handle = (index: number) => {
    if (picked !== null) return;
    setPicked(index);
    const correct = isCorrect(index);
    window.setTimeout(
      () => onRound({ correct, reactionMs: Date.now() - startRef.current }),
      correct ? 180 : 600,
    );
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center gap-8">
      <Prompt>Same shape, rotated?</Prompt>
      <div className="flex flex-col items-center gap-3">
        <span className="label">Reference</span>
        <span className="card flex items-center justify-center p-3">
          <Shape path={data.path} rotation={data.baseRotation} mirrored={false} size={100} />
        </span>
      </div>
      <div className="mx-auto grid w-full max-w-[300px] grid-cols-2 gap-px bg-[var(--line)]">
        {data.options.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => handle(index)}
            className={`tap flex items-center justify-center py-3 ${
              picked !== null && isCorrect(index)
                ? "box-fill"
                : picked === index
                  ? "animate-shake stripes bg-[var(--surface)]"
                  : "bg-[var(--surface)]"
            }`}
          >
            <Shape path={data.path} rotation={option.rotation} mirrored={option.mirrored} size={68} />
          </button>
        ))}
      </div>
    </div>
  );
}
