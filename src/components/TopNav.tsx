"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppProvider";
import Icon from "@/components/Icon";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/progress", label: "Progress" },
  { href: "/profile", label: "Profile" },
];

export default function TopNav() {
  const pathname = usePathname();
  const { ready, stats, streak } = useApp();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="container-site flex h-14 items-stretch justify-between gap-6">
        <Link href="/" className="tap flex items-center gap-3" aria-label="Brain Games home">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 border border-[var(--line)]"
          />
          <span className="text-xs font-light uppercase tracking-[0.3em]">Brain Games</span>
        </Link>

        <nav className="hidden items-stretch md:flex" aria-label="Primary">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`label tap flex items-center border-b-2 px-5 ${
                  active ? "label-strong border-[var(--fill)]" : "border-transparent"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-5">
          <div className="hidden items-center gap-5 lg:flex">
            <span className="label">
              Score{" "}
              <span className="num ml-1 text-sm text-[var(--text)]">
                {ready ? stats.brainScore.toLocaleString() : "—"}
              </span>
            </span>
            <span className="label flex items-center gap-1.5">
              <Icon name="flame" className="h-3.5 w-3.5" />
              {ready ? streak : "—"} d
            </span>
          </div>
          <Link href="/daily" className="label tap box-fill px-4 py-2.5">
            Daily challenge
          </Link>
        </div>
      </div>
    </header>
  );
}
