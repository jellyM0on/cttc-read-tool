type StreakDay = {
  key: string;
  label: string;
  active?: boolean;
  warm?: boolean;
};

type ReadingStreakCardProps = {
  streakCount?: number | string;
  days?: StreakDay[];
};

export function ReadingStreakCard({
  streakCount = 12,
  days = [
    { key: "mon", label: "M", active: true },
    { key: "tue", label: "T", active: true },
    { key: "wed", label: "W", active: true },
    { key: "thu", label: "T", warm: true },
    { key: "fri", label: "F" },
    { key: "sat", label: "S" },
    { key: "sun", label: "S" },
  ],
}: ReadingStreakCardProps) {
  return (
    <div className="rounded-4xl bg-(--surface-container-high) p-8">
      <div className="[font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.18em] text-(--on-surface-muted)">
        Reading Streak
      </div>

      <div className="mt-3 [font-family:var(--font-ui)] text-5xl font-extrabold tracking-[-0.03em] text-(--tertiary)">
        {streakCount}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {days.map((day) => (
          <div
            key={day.key}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-full [font-family:var(--font-ui)] text-xs font-bold",
              day.active
                ? "bg-(--tertiary) text-white"
                : day.warm
                  ? "bg-[rgba(147,60,0,0.75)] text-white"
                  : "bg-(--surface-container) text-(--on-surface-muted)",
            ].join(" ")}
          >
            {day.label}
          </div>
        ))}
      </div>
    </div>
  );
}