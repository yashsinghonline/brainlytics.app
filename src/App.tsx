import { AppProvider } from "@/components/AppProvider";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import { RouterProvider, usePathname } from "@/lib/router";
import HomePage from "@/app/page";
import GamesPage from "@/app/games/page";
import DailyPage from "@/app/daily/page";
import ProgressPage from "@/app/progress/page";
import ProfilePage from "@/app/profile/page";
import PlayScreen from "@/app/play/[gameId]/PlayScreen";
import NotFound from "@/app/not-found";
import { isGameId, type GameId } from "@/lib/games";

function RouterContent() {
  const pathname = usePathname();

  if (pathname === "/") {
    return <HomePage />;
  }

  if (pathname === "/games") {
    return <GamesPage />;
  }

  if (pathname === "/daily") {
    return <DailyPage />;
  }

  if (pathname === "/progress") {
    return <ProgressPage />;
  }

  if (pathname === "/profile") {
    return <ProfilePage />;
  }

  if (pathname.startsWith("/play/")) {
    const rawId = pathname.slice("/play/".length).split("/")[0];
    if (isGameId(rawId)) {
      return <PlayScreen gameId={rawId as GameId} />;
    }
    return <NotFound />;
  }

  return <NotFound />;
}

export default function App() {
  return (
    <RouterProvider>
      <AppProvider>
        <AppShell>
          <RouterContent />
        </AppShell>
        <PwaRegister />
      </AppProvider>
    </RouterProvider>
  );
}
