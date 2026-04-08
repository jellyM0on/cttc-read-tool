import type { StoredDocument } from "../../../types/documents";
import { DocumentCard } from "./DocumentCard";

export function LibrarySection({ docs, hasPagination = false }: { docs: StoredDocument[], hasPagination?: boolean }) {
  if (docs.length === 0) {
    return (
      <div className="rounded-xl bg-(--surface-container-low) px-8 py-16 text-center">
        <p className="[font-family:var(--font-ui)] text-sm text-(--on-surface-muted)">
          No documents in your collection yet.
        </p>
      </div>
    );
  }

  const visibleDocs = hasPagination ? docs : docs.slice(0, 3);

  return (
    <>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {visibleDocs.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
    
        {hasPagination && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1 px-4 py-2 [font-family:var(--font-ui)] text-xs font-bold text-[rgba(28,28,24,0.4)] transition-colors hover:text-(--primary)"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Previous
            </button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--primary) text-white [font-family:var(--font-ui)] text-xs font-bold"
              >
                1
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[rgba(28,28,24,0.6)] transition-colors hover:bg-(--surface-container-low) [font-family:var(--font-ui)] text-xs font-bold"
              >
                2
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[rgba(28,28,24,0.6)] transition-colors hover:bg-(--surface-container-low) [font-family:var(--font-ui)] text-xs font-bold"
              >
                3
              </button>
              <span className="flex h-9 w-9 items-center justify-center text-[rgba(28,28,24,0.3)] [font-family:var(--font-ui)] text-xs font-bold">
                ...
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[rgba(28,28,24,0.6)] transition-colors hover:bg-(--surface-container-low) [font-family:var(--font-ui)] text-xs font-bold"
              >
                12
              </button>
            </div>

            <button
              type="button"
              className="flex items-center gap-1 px-4 py-2 [font-family:var(--font-ui)] text-xs font-bold text-[rgba(28,28,24,0.6)] transition-colors hover:text-(--primary)"
            >
              Next
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
    </>
  );
}