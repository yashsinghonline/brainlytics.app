import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/components/AppProvider";
import AppShell from "@/components/AppShell";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const DESCRIPTION =
  "12 fast brain games for memory, logic, speed, math and focus. Daily challenges, streaks and a brain score that grows with you. Free, works offline, no account needed.";

export const metadata: Metadata = {
  title: {
    default: "Brain Games — Train your brain, one minute at a time",
    template: "%s · Brain Games",
  },
  description: DESCRIPTION,
  keywords: [
    "brain games",
    "brain training",
    "memory games",
    "reaction time test",
    "mental math",
    "logic puzzles",
    "daily challenge",
  ],
  manifest: "/manifest.webmanifest",
  applicationName: "Brain Games",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Brain Games",
  },
  openGraph: {
    type: "website",
    siteName: "Brain Games",
    title: "Brain Games — Train your brain, one minute at a time",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary",
    title: "Brain Games — Train your brain, one minute at a time",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('brain-games:v1');var t='dark';if(s){var p=JSON.parse(s);if(p&&p.settings&&p.settings.theme)t=p.settings.theme;}if(t==='dark')document.documentElement.classList.add('dark');document.documentElement.style.colorScheme=t;}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="page-bg min-h-[100dvh] font-sans antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
          <PwaRegister />
        </AppProvider>
      </body>
    </html>
  );
}
