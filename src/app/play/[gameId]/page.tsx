import { notFound } from "next/navigation";
import PlayScreen from "./PlayScreen";
import { GAME_MAP, isGameId } from "@/lib/games";

export function generateStaticParams() {
  return Object.keys(GAME_MAP).map((gameId) => ({ gameId }));
}

export default async function PlayPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  if (!isGameId(gameId)) notFound();
  return <PlayScreen gameId={gameId} />;
}
