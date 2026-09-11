"use client";

import GamePlayer from "@/components/GamePlayer";
import { useApp } from "@/components/AppProvider";
import type { GameId } from "@/lib/games";

export default function PlayScreen({ gameId }: { gameId: GameId }) {
  const { personalBest, recordSession } = useApp();

  return (
    <GamePlayer
      gameId={gameId}
      best={personalBest(gameId)}
      onSession={recordSession}
    />
  );
}
