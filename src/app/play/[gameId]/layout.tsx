import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GAME_MAP, isGameId } from "@/lib/games";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ gameId: string }>;
}): Promise<Metadata> {
  const { gameId } = await params;
  if (!isGameId(gameId)) return { title: "Play" };
  const game = GAME_MAP[gameId];
  return { title: `${game.title} — ${game.tagline}`, description: game.howTo };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
