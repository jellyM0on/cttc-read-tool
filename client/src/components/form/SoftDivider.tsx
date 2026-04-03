export function SoftDivider({ label }: { label: string }) {
  return (
    <div className="relative my-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full bg-[linear-gradient(to_right,transparent,rgba(196,197,215,0.35),transparent)] h-px" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[rgba(255,255,255,0.82)] px-4 [font-family:var(--font-ui)] text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(68,70,85,0.5)]">
          {label}
        </span>
      </div>
    </div>
  );
}