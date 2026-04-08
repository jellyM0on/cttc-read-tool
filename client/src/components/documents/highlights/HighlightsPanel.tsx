import { useMemo } from "react";

export type HighlightColor = "yellow" | "green" | "pink" | "blue";

export type HighlightSelector = {
  startOffset: number;
  endOffset: number;
  quote: string;
  prefix: string;
  suffix: string;
};

export type LocalHighlight = {
  id: string;
  color: HighlightColor;
  createdAt: string;
  note?: string;
  sectionHref: string;
  spineIndex: number;
  selector: HighlightSelector;
};

export type HighlightItem = {
  highlight: LocalHighlight;
  sectionLabel: string;
  resolvedStartOffset?: number | null;
};

export type HighlightsMap = Record<string, LocalHighlight[]>;

const HIGHLIGHT_COLOR_VALUES: Record<HighlightColor, string> = {
  yellow: "rgba(255, 230, 120, 0.75)",
  green: "rgba(134, 239, 172, 0.55)",
  pink: "rgba(249, 168, 212, 0.55)",
  blue: "rgba(147, 197, 253, 0.55)",
};

type HighlightsPanelProps = {
  highlights: HighlightItem[] | HighlightsMap;
  emptyMessage?: string;
  onJumpToHighlight?: (highlight: LocalHighlight) => void;
  onDeleteHighlight?: (id: string) => void;
  onUpdateHighlightNote?: (id: string, note: string) => void;
  className?: string;
};

function flattenHighlights(input: HighlightItem[] | HighlightsMap): HighlightItem[] {
  if (Array.isArray(input)) return input;

  return Object.entries(input).flatMap(([sectionLabel, items]) =>
    items.map((highlight) => ({
      highlight,
      sectionLabel,
      resolvedStartOffset: highlight.selector.startOffset,
    }))
  );
}

export function HighlightsPanel({
  highlights,
  emptyMessage = "No highlights yet.",
  onJumpToHighlight,
  onDeleteHighlight,
  onUpdateHighlightNote,
  className = "",
}: HighlightsPanelProps) {
  const items = useMemo(() => {
    return flattenHighlights(highlights).sort((a, b) => {
      if (a.highlight.spineIndex !== b.highlight.spineIndex) {
        return a.highlight.spineIndex - b.highlight.spineIndex;
      }

      const aOffset =
        a.resolvedStartOffset ?? a.highlight.selector.startOffset ?? 0;
      const bOffset =
        b.resolvedStartOffset ?? b.highlight.selector.startOffset ?? 0;

      return aOffset - bOffset;
    });
  }, [highlights]);

  return (
    <aside
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden border-l border-[rgba(196,197,215,0.18)] bg-[rgba(255,255,255,0.42)] backdrop-blur-md ${className}`}
      aria-label="Highlights"
    >
      <div className="border-b border-[rgba(196,197,215,0.16)] px-4 py-4">
        <h2 className="[font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.14em] text-(--on-surface-muted)">
          Highlights
        </h2>
      </div>

      <div className="simple-epub-scroll min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(196,197,215,0.18)] bg-[rgba(255,255,255,0.58)] p-3 sm:p-4 shadow-[0_4px_14px_rgba(28,28,24,0.03)]">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(({ highlight, sectionLabel }) => (
              <div
                key={highlight.id}
                className="rounded-2xl border border-[rgba(196,197,215,0.18)] bg-[rgba(255,255,255,0.58)] p-3 sm:p-4 shadow-[0_4px_14px_rgba(28,28,24,0.03)]"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/10"
                      style={{ background: HIGHLIGHT_COLOR_VALUES[highlight.color] }}
                    />
                  </div>

                  <span className="[font-family:var(--font-ui)] text-[11px] text-(--on-surface-muted)">
                    {sectionLabel}
                  </span>
                </div>

                <div className="text-sm leading-6 text-(--on-surface)">
                  {highlight.selector.quote}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {onJumpToHighlight && (
                    <button
                      type="button"
                      onClick={() => onJumpToHighlight(highlight)}
                      className="inline-flex h-8 items-center rounded-xl border border-[rgba(196,197,215,0.22)] bg-[rgba(255,255,255,0.52)] px-3 [font-family:var(--font-ui)] text-xs font-semibold text-(--on-surface) transition-colors hover:bg-(--surface-container-lowest) hover:text-(--primary)"
                    >
                      Jump to text
                    </button>
                  )}

                  {onDeleteHighlight && (
                    <button
                      type="button"
                      onClick={() => onDeleteHighlight(highlight.id)}
                      className="inline-flex h-8 items-center rounded-xl border border-[rgba(196,197,215,0.22)] bg-[rgba(255,255,255,0.52)] px-3 [font-family:var(--font-ui)] text-xs font-semibold text-(--on-surface) transition-colors hover:bg-(--surface-container-lowest) hover:text-(--primary)"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {onUpdateHighlightNote && (
                  <textarea
                    className="mt-3 w-full resize-y rounded-xl border border-[rgba(196,197,215,0.22)] bg-[rgba(255,255,255,0.46)] px-3 py-2 [font-family:var(--font-ui)] text-xs text-(--on-surface) outline-none placeholder:text-(--on-surface-muted) focus:border-[rgba(67,97,238,0.26)] focus:ring-2 focus:ring-[rgba(67,97,238,0.14)]"
                    placeholder="Add note…"
                    rows={3}
                    value={highlight.note ?? ""}
                    onChange={(e) =>
                      onUpdateHighlightNote(highlight.id, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}