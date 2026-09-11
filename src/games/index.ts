"use client";

import type { ComponentType } from "react";
import type { GameId } from "@/lib/games";
import type { GameProps } from "./util";
import QuickMath from "./quick-math";
import MemoryGrid from "./memory-grid";
import ColorSwitch from "./color-switch";
import NumberSequence from "./number-sequence";
import OddOneOut from "./odd-one-out";
import ReactionTap from "./reaction-tap";
import NumberMemory from "./number-memory";
import LogicTiles from "./logic-tiles";
import FastCount from "./fast-count";
import DirectionChallenge from "./direction-challenge";
import WordMemory from "./word-memory";
import MentalRotation from "./mental-rotation";

export const GAME_COMPONENTS: Record<GameId, ComponentType<GameProps>> = {
  "quick-math": QuickMath,
  "memory-grid": MemoryGrid,
  "color-switch": ColorSwitch,
  "number-sequence": NumberSequence,
  "odd-one-out": OddOneOut,
  "reaction-tap": ReactionTap,
  "number-memory": NumberMemory,
  "logic-tiles": LogicTiles,
  "fast-count": FastCount,
  "direction-challenge": DirectionChallenge,
  "word-memory": WordMemory,
  "mental-rotation": MentalRotation,
};
