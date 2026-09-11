"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";
import type { GlyphName } from "@/lib/glyphs";

const TABS: { href: string; label: string; glyph: GlyphName }[] = [
  { href: "/", label: "Home", glyph: "home" },
  { href: "/games", label: "Games", glyph: "library" },
  { href: "/progress", label: "Progress", glyph: "chart" },
  { href: "/profile", label: "Profile", glyph: "user" },
];

/** Mobile-only tab bar; the desktop header takes over from `md` up. */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-[var(--surface)] md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tap flex flex-col items-center gap-1.5 border-t-2 py-2.5 ${
                active ? "border-[var(--fill)]" : "border-transparent text-muted"
              }`}
            >
              <Icon name={tab.glyph} className="h-5 w-5" strokeWidth={active ? 1.6 : 1.1} />
              <span className={`label ${active ? "label-strong" : ""}`}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
