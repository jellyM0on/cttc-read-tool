import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border px-4 py-3 outline-none transition-all duration-150",
        "border-[rgba(196,197,215,0.3)] bg-white/80 text-(--on-surface)",
        "placeholder:text-(--on-surface-muted)",
        "focus:border-[rgba(35,70,213,0.5)] focus:shadow-[0_0_0_4px_rgba(35,70,213,0.08)]",
        className
      )}
      {...props}
    />
  );
}