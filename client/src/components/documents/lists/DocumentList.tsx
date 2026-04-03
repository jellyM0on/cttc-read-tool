import type { StoredDocument } from "../../../types/documents";
import { DocumentCard } from "./DocumentCard";

export function LibrarySection({ docs }: { docs: StoredDocument[] }) {
  return (
    <section className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="[font-family:var(--font-ui)] text-3xl font-semibold tracking-[-0.02em] text-(--on-surface)">
          Your Books
        </h2>
        <p className="mt-2 [font-family:var(--font-ui)] text-sm leading-7 text-(--on-surface-muted)">
          Pick up where you left off, revisit older uploads, or open a newer text.
        </p>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-4xl bg-[rgba(255,255,255,0.72)] p-8 text-center shadow-[0_12px_32px_rgba(28,28,24,0.06)]">
          <p className="[font-family:var(--font-ui)] text-sm text-(--on-surface-muted)">
            No uploads yet. Add your first EPUB to begin building your library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {docs.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </section>
  );
}