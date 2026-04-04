import { useEffect, useRef, useState } from "react";
import { LibrarySection } from "../../components/documents/lists/DocumentList";
import { UploadButton } from "../../components/documents/upload/UploadButton";
import { NavBar } from "../../components/shared/NavBar";
import { useAuth } from "../../context/useAuth";
import { getLocalDocuments } from "../../lib/localApi/getLocalDocuments";
import type { StoredDocument } from "../../types/documents";

export function LibraryPage() {
  const { isAuthenticated } = useAuth();
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    async function loadDocuments() {
      try {
        if (!isAuthenticated) {
          const localDocs = await getLocalDocuments();

          setDocuments(
            localDocs.map((doc) => ({
              id: doc.id,
              title: doc.title,
              author: doc.author,
              cover: doc.cover,
              file_type: doc.file_type,
              created_at: doc.created_at,
              source: doc.source,
              progress: 0, // TODO
            }))
          );
        }
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : "Failed to load documents"
        );
      }
    }

    loadDocuments();
  }, [isAuthenticated]);

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-(--surface) text-(--on-surface)">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 lg:px-8 lg:py-10">
          <header className="mb-10">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="mb-3 [font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.18em] text-(--on-surface-muted)">
                  Library
                </div>
                <h1 className="[font-family:var(--font-reading)] text-3xl font-semibold tracking-[-0.02em] text-(--on-surface) sm:text-4xl">
                  Your Books
                </h1>
              </div>
             
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".epub,application/epub+zip"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    console.log(file);
                    e.target.value = "";
                  }}
                />

                <UploadButton
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 sm:px-5"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 5v14" strokeLinecap="round" />
                    <path d="M5 12h14" strokeLinecap="round" />
                  </svg>

                  <span>Upload Book</span>
                </UploadButton>
              </>
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--on-surface-muted)">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" strokeLinecap="round" />
                  </svg>
                </span>

                <input
                  type="text"
                  placeholder="Search..."
                  className="h-11 w-full rounded-xl border border-[rgba(196,197,215,0.3)] bg-(--surface-container-lowest) py-3 pl-11 pr-4 shadow-[0_4px_14px_rgba(28,28,24,0.04)] outline-none transition-all placeholder:text-[rgba(28,28,24,0.32)] [font-family:var(--font-ui)] text-sm focus:border-[rgba(67,97,238,0.26)] focus:ring-2 focus:ring-[rgba(67,97,238,0.14)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-11 items-center rounded-xl border border-[rgba(196,197,215,0.24)] bg-(--surface-container-low) p-1 shadow-[0_4px_14px_rgba(28,28,24,0.03)]">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-lg bg-(--surface-container-lowest) px-4 text-(--primary) shadow-sm [font-family:var(--font-ui)] text-xs font-semibold"
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-9 items-center rounded-lg px-4 text-[rgba(28,28,24,0.52)] transition-colors hover:text-(--on-surface) [font-family:var(--font-ui)] text-xs font-semibold"
                  >
                    List
                  </button>
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[rgba(196,197,215,0.24)] bg-(--surface-container-low) px-4 shadow-[0_4px_14px_rgba(28,28,24,0.03)] transition-colors hover:bg-(--surface-container-high) [font-family:var(--font-ui)] text-xs font-semibold text-(--on-surface)"
                >
                  <span>Date Added</span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-(--on-surface-muted)"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="m6 9 6 6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {loadError ? (
            <div className="mb-8 rounded-xl border border-[rgba(186,26,26,0.12)] bg-[rgba(255,255,255,0.72)] px-5 py-4 shadow-sm">
              <p className="[font-family:var(--font-ui)] text-sm text-(--error)">
                {loadError}
              </p>
            </div>
          ) : null}

          <LibrarySection docs={documents} hasPagination={true} />
        </div>
      </main>
    </>
  );
}