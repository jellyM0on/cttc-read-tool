import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { deleteLocalDocument } from "../../../lib/localApi/deleteLocalDocument";
import type { StoredDocument } from "../../../types/documents";

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

type DocumentCardProps = {
  doc: StoredDocument;
  onViewDetails?: (doc: StoredDocument) => void;
  onRemove?: (id: string) => void;
};

export function DocumentCard({
  doc,
  onViewDetails,
  onRemove,
}: DocumentCardProps) {
  const progress = 0; // TODO
  const author = doc.author ?? "Unknown author";
  const format = doc.file_type.toUpperCase();

  const [menuOpen, setMenuOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const handleOpenAnotherMenu = (event: Event) => {
      const customEvent = event as CustomEvent<string>;

      if (customEvent.detail !== doc.id) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("document-card-menu-open", handleOpenAnotherMenu);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener(
        "document-card-menu-open",
        handleOpenAnotherMenu,
      );
    };
  }, [doc.id]);

  const toggleMenu = () => {
    if (!menuOpen) {
      window.dispatchEvent(
        new CustomEvent("document-card-menu-open", {
          detail: doc.id,
        }),
      );
    }

    setMenuOpen((prev) => !prev);
  };

  const handleRemove = async () => {
    if (isRemoving) return;

    try {
      setIsRemoving(true);
      await deleteLocalDocument(doc.id);
      setMenuOpen(false);
      onRemove?.(doc.id);
    } catch (error) {
      console.error("Failed to remove document:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleViewDetails = () => {
    setMenuOpen(false);
    onViewDetails?.(doc);
  };

  return (
    <article className="group relative rounded-4xl bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_12px_32px_rgba(28,28,24,0.06)] transition-all duration-200 hover:-translate-y-0.5">
      <div
        ref={menuRef}
        className="absolute top-4 right-4 z-20"
      >
        <button
          type="button"
          aria-label={`Open menu for ${doc.title}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={toggleMenu}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(196,197,215,0.24)] bg-[rgba(252,249,242,0.92)] text-(--on-surface-muted) shadow-[0_6px_18px_rgba(28,28,24,0.08)] transition-all hover:bg-(--surface-container-high) hover:text-(--on-surface)"
        >
          <span className="text-lg leading-none">⋯</span>
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute top-full right-0 mt-2 w-52 overflow-hidden rounded-2xl border border-[rgba(196,197,215,0.22)] bg-(--surface) py-1 shadow-[0_20px_40px_rgba(28,28,24,0.14)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleViewDetails}
              className="flex w-full items-center gap-3 px-4 py-3 text-left [font-family:var(--font-ui)] text-xs font-semibold text-(--on-surface) transition-colors hover:bg-(--surface-container-high)"
            >
              <span>View Details</span>
            </button>

            <div className="my-1 h-px bg-[rgba(196,197,215,0.16)]" />

            <button
              type="button"
              role="menuitem"
              onClick={handleRemove}
              disabled={isRemoving}
              className="flex w-full items-center gap-3 px-4 py-3 text-left [font-family:var(--font-ui)] text-xs font-bold text-(--error) transition-colors hover:bg-[rgba(179,38,30,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{isRemoving ? "Removing..." : "Remove from Library"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-5">
        <div className="relative h-44 w-28 shrink-0 overflow-hidden rounded-xl bg-(--surface-container)">
          {doc.cover ? (
            <img
              src={doc.cover}
              alt={`${doc.title} cover`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(180deg,var(--surface-container-high),var(--surface-container))] px-3 text-center">
              <span className="[font-family:var(--font-ui)] text-[10px] font-bold uppercase tracking-[0.14em] text-(--on-surface-muted)">
                {format}
              </span>
            </div>
          )}

          <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(28,28,24,0.18),transparent_40%)]" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <span className="inline-flex rounded-md bg-[rgba(178,189,255,0.28)] px-2.5 py-1 [font-family:var(--font-ui)] text-[10px] font-bold uppercase tracking-[0.16em] text-(--on-surface-muted)">
              {format}
            </span>

            <h3 className="mt-3 line-clamp-2 [font-family:var(--font-reading)] text-2xl leading-tight font-medium text-(--on-surface) transition-colors group-hover:text-(--primary)">
              {doc.title}
            </h3>

            <p className="mt-1 line-clamp-1 [font-family:var(--font-ui)] text-xs text-(--on-surface-muted)">
              {author}
            </p>

            <p className="mt-3 [font-family:var(--font-ui)] text-xs text-(--on-surface-muted)">
              Added {formatDate(doc.created_at)}
            </p>

            {doc.source === "local" && (
              <p className="mt-1 [font-family:var(--font-ui)] text-[11px] text-(--on-surface-muted)">
                Saved offline on this device
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-1.5 w-full rounded-full bg-(--surface-container-high)">
              <div
                className="h-full rounded-full bg-(--primary)"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="[font-family:var(--font-ui)] text-[10px] font-bold uppercase tracking-[0.14em] text-(--on-surface-muted)">
                {progress}% read
              </span>

              <Link
                to={`/library/${doc.id}`}
                className="rounded-full bg-(--primary) px-4 py-2 [font-family:var(--font-ui)] text-xs font-bold text-white transition-all hover:-translate-y-0.5"
              >
                Open
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}