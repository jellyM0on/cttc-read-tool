import clsx from "clsx";

type VocabItemProps = {
  term: string;
  translation: string;
  note?: string;
  active?: boolean;
  onClick?: () => void;
};

export function VocabItem({
  term,
  translation,
  note,
  active = false,
  onClick,
}: VocabItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "w-full rounded-xl border-0 px-4 py-4 text-left transition-colors duration-150",
        active
          ? "bg-(--surface-container-high)"
          : "bg-transparent hover:bg-(--surface-container-low)"
      )}
    >
      <div className="font-(--font-reading) text-base text-(--on-surface)">
        {term}
      </div>
      <div className="mt-1 font-(--font-ui) text-xs text-(--secondary)">
        {translation}
      </div>
      {note ? (
        <div className="mt-1 font-(--font-ui) text-sm text-(--on-surface-muted)">
          {note}
        </div>
      ) : null}
    </button>
  );
}