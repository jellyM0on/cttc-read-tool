type UploadButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
};

export function UploadButton({
  onClick,
  disabled = false,
  children = "Choose File",
  className = "",
}: UploadButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-xl bg-(image:--gradient-primary) px-5 py-3 [font-family:var(--font-ui)] text-sm font-bold text-white transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}