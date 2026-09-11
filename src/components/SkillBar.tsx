import Icon from "@/components/Icon";
import type { GlyphName } from "@/lib/glyphs";

export default function SkillBar({
  label,
  glyph,
  value,
}: {
  label: string;
  glyph: GlyphName;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-light">
          <Icon name={glyph} className="h-4 w-4" strokeWidth={1.1} />
          {label}
        </span>
        <span className="label tabular-nums">{value}</span>
      </div>
      <div className="mt-2 h-px w-full bg-[var(--line)]">
        <div
          className="h-px bg-[var(--fill)] transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
