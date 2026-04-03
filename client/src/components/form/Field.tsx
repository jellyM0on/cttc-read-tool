export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="ml-1 block [font-family:var(--font-ui)] text-[11px] font-semibold uppercase tracking-[0.18em] text-(--on-surface-muted)"
      >
        {label}
      </label>
      {children}
    </div>
  );
}