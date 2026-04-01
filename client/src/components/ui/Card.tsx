import type { PropsWithChildren } from "react";
import clsx from "clsx";

export function Card({
  elevated = false,
  className,
  children,
}: PropsWithChildren<{ elevated?: boolean; className?: string }>) {
  return (
    <section
      className={clsx(
        "rounded-xl bg-(--surface-container-low) p-4",
        elevated && "shadow-[0_12px_32px_rgba(28,28,24,0.06)]",
        className
      )}
    >
      {children}
    </section>
  );
}