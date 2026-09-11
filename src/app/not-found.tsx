import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 py-16 text-center">
      <p className="label">404</p>
      <h1 className="num text-4xl md:text-6xl">Nothing here.</h1>
      <p className="max-w-sm text-sm font-light text-muted">
        That page doesn&apos;t exist — but your brain still needs its daily minute.
      </p>
      <div className="flex gap-px bg-[var(--line)]">
        <Link href="/" className="label tap box-fill px-6 py-4">
          Back home
        </Link>
        <Link href="/games" className="label tap bg-[var(--surface)] px-6 py-4">
          All games
        </Link>
      </div>
    </main>
  );
}
