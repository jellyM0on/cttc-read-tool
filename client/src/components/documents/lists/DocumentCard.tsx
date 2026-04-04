import { Link } from "react-router-dom";
import type { StoredDocument } from "../../../types/documents";

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function DocumentCard({ doc }: { doc: StoredDocument }) {
  const progress = 0; //TODO
  const author = doc.author ?? "Unknown author";
  const format = doc.file_type.toUpperCase();

  return (
    <article className="group rounded-4xl bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_12px_32px_rgba(28,28,24,0.06)] transition-all duration-200 hover:-translate-y-0.5">
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