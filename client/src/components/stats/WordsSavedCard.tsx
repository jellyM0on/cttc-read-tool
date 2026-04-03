type WordsSavedCardProps = {
  wordsSaved?: number | string;
  goalLabel?: string;
  progressPercent?: number;
};

export function WordsSavedCard({
  wordsSaved = "1,284",
  goalLabel = "Goal: 2,000 words this month",
  progressPercent = 65,
}: WordsSavedCardProps) {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-(--primary-container) p-8 text-white">
      <div className="relative z-10">
        <div className="[font-family:var(--font-ui)] text-xs uppercase tracking-[0.18em] text-white/80">
          Words Saved
        </div>

        <div className="mt-3 [font-family:var(--font-ui)] text-5xl font-extrabold tracking-[-0.03em]">
          {wordsSaved}
        </div>

        <div className="mt-8">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-3 [font-family:var(--font-ui)] text-xs text-white/80">
            {goalLabel}
          </p>
        </div>
      </div>

      <div className="absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />
    </div>
  );
}