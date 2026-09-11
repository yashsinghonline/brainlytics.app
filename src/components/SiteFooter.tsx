import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/Icon";
import { GAMES, SKILLS, type SkillKey } from "@/lib/games";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="container-site grid gap-10 py-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 border border-[var(--line)]"
            />
            <span className="text-xs font-light uppercase tracking-[0.3em]">Brain Games</span>
          </div>
          <p className="mt-5 max-w-sm text-sm font-light leading-relaxed text-muted">
            Train your brain, one minute at a time. {GAMES.length} fast games for memory,
            logic, speed, math and focus — with a daily challenge, streaks and a brain score
            that grows with you.
          </p>
          <p className="label mt-6">Works offline · Installable · No account needed</p>
        </div>

        <div className="md:col-span-2">
          <p className="label">Explore</p>
          <ul className="mt-4 space-y-2.5 text-sm font-light">
            <li>
              <Link href="/" className="tap">
                Home
              </Link>
            </li>
            <li>
              <Link href="/games" className="tap">
                All games
              </Link>
            </li>
            <li>
              <Link href="/daily" className="tap">
                Daily challenge
              </Link>
            </li>
            <li>
              <Link href="/progress" className="tap">
                Progress
              </Link>
            </li>
            <li>
              <Link href="/profile" className="tap">
                Profile
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="label">Skills</p>
          <ul className="mt-4 space-y-2.5 text-sm font-light">
            {(Object.keys(SKILLS) as SkillKey[]).map((key) => (
              <li key={key}>
                <Link href="/games" className="tap flex items-center gap-2">
                  <Icon name={SKILLS[key].glyph} className="h-3.5 w-3.5" strokeWidth={1.1} />
                  {SKILLS[key].label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="label">Scoring</p>
          <ul className="mt-4 divide-y divide-[var(--line)] border-y border-[var(--line)] text-sm font-light">
            <li className="flex justify-between py-2">
              <span>Correct answer</span>
              <span className="num">+100</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Fast answer</span>
              <span className="num">+50</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Combo</span>
              <span className="num">+25</span>
            </li>
            <li className="flex justify-between py-2">
              <span>Wrong answer</span>
              <span className="num">−50</span>
            </li>
          </ul>
          <p className="label mt-4">Better + faster = higher score</p>
        </div>
      </div>

      <div className="border-t border-[var(--line)]">
        <div className="container-site flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="label">© {new Date().getFullYear()} Brain Games</p>
          <p className="label">Brain score is a game metric — not a medical measure.</p>
        </div>
      </div>
    </footer>
  );
}
