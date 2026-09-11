"use client";

import Icon from "@/components/Icon";
import { GLYPHS, type GlyphName } from "@/lib/glyphs";

/** Renders a glyph name (or falls back to a plain initial) inside a bordered square. */
export default function Mark({
  value,
  className = "h-5 w-5",
  box = false,
}: {
  value: string;
  className?: string;
  box?: boolean;
}) {
  const isGlyph = (GLYPHS as readonly string[]).includes(value);
  const inner = isGlyph ? (
    <Icon name={value as GlyphName} className={className} />
  ) : (
    <span className="font-light uppercase">{value.slice(0, 1)}</span>
  );
  if (!box) return <span className="inline-flex items-center justify-center">{inner}</span>;
  return (
    <span className={`card inline-flex items-center justify-center p-2.5 ${isGlyph ? "" : "text-base"}`}>
      {inner}
    </span>
  );
}
