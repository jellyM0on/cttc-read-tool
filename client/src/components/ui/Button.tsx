import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[image:var(--gradient-primary)] text-white hover:-translate-y-0.5",
  secondary:
    "bg-transparent text-[var(--primary)] hover:bg-[var(--surface-container-highest)]",
  ghost:
    "bg-[var(--surface-container-low)] text-[var(--on-surface)] hover:bg-[var(--surface-container-highest)]",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-xl border-0 px-4 py-3 font-semibold transition-all duration-150",
        "font-(--font-ui) focus:outline-none",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}