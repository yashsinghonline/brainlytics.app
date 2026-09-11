"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SiteFooter from "@/components/SiteFooter";
import TopNav from "@/components/TopNav";

/** Site chrome (header, footer, mobile tabs) for regular pages; a bare stage for gameplay. */
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const immersive = pathname.startsWith("/play") || pathname.startsWith("/daily");

  if (immersive) {
    return <div className="min-h-[100dvh] w-full md:px-6">{children}</div>;
  }

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopNav />
      <div className="container-site flex-1 pb-24 md:pb-8">{children}</div>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
