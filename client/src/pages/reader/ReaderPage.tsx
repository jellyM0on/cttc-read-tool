import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HighlightsPanel,
  type HighlightItem,
  type LocalHighlight,
} from "../../components/documents/highlights/HighlightsPanel";
import { SimpleEpubViewer } from "../../components/documents/viewers/EpubViewer";
import { getLocalDocumentById } from "../../lib/localApi/documents/getLocalDocumentById";
import { getHighlightsByBookId } from "../../lib/localApi/highlights/getHighlightsByBookId";
import { replaceHighlightsForBook } from "../../lib/localApi/highlights/replaceHighlightsForBook";

type ReaderDocument = {
  id: string;
  title: string;
  file_type: string;
  source: "local";
  file: File;
};

export function ReaderPage() {
  const { id } = useParams<{ id: string }>();

  const [documentRecord, setDocumentRecord] = useState<ReaderDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [readerFont, setReaderFont] = useState("var(--font-ui)");
  const [readerTextSize, setReaderTextSize] = useState(16);
  const [readerBackground, setReaderBackground] = useState("#f5f1e8");

  const [epubData, setEpubData] = useState<ArrayBuffer | null>(null);
  const [epubLoading, setEpubLoading] = useState(false);

  const [highlights, setHighlights] = useState<LocalHighlight[]>([]);
  const [resolvedHighlightItems, setResolvedHighlightItems] = useState<HighlightItem[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [jumpToHighlight, setJumpToHighlight] = useState<LocalHighlight | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument() {
      if (!id) {
        setError("Missing document id");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setDocumentRecord(null);

        const local = await getLocalDocumentById(id);
        if (!local) {
          throw new Error("Document not found in offline storage");
        }

        if (!cancelled) setDocumentRecord(local);
      } catch (err) {
        if (!cancelled) {
          console.log(err)
          setError(err instanceof Error ? err.message : "Failed to load document");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadEpubBinary() {
      const fileType = documentRecord?.file_type?.toLowerCase().trim();

      if (fileType !== "epub" || !documentRecord) {
        setEpubData(null);
        return;
      }

      try {
        setEpubLoading(true);

        if (documentRecord.source === "local") {
          const buffer = await documentRecord.file.arrayBuffer();
          if (!cancelled) setEpubData(buffer);
          return;
        }
      } catch (err) {
        if (!cancelled) {
             console.log(err)
          setError(err instanceof Error ? err.message : "Failed to load EPUB file");
        }
      } finally {
        if (!cancelled) setEpubLoading(false);
      }
    }

    void loadEpubBinary();

    return () => {
      cancelled = true;
    };
  }, [documentRecord]);

  useEffect(() => {
    let cancelled = false;

    async function loadHighlights() {
      if (!documentRecord?.id) {
        setHighlights([]);
        return;
      }

      try {
        setHighlightsLoading(true);
        const stored = await getHighlightsByBookId(documentRecord.id);
        if (!cancelled) setHighlights(stored);
      } catch (err) {
        if (!cancelled) {
          console.log(err)
          setError(
            err instanceof Error ? err.message : "Failed to load highlights"
          );
        }
      } finally {
        if (!cancelled) setHighlightsLoading(false);
      }
    }

    void loadHighlights();

    return () => {
      cancelled = true;
    };
  }, [documentRecord?.id]);

  useEffect(() => {
    let cancelled = false;

    async function persistHighlights() {
      if (!documentRecord?.id) return;

      try {
        await replaceHighlightsForBook(documentRecord.id, highlights);
      } catch (err) {
        if (!cancelled) {
          console.log(err)
          setError(
            err instanceof Error ? err.message : "Failed to save highlights"
          );
        }
      }
    }

    void persistHighlights();

    return () => {
      cancelled = true;
    };
  }, [documentRecord?.id, highlights]);

  const pageStyle = useMemo(
    () => ({
      backgroundColor: readerBackground,
    }),
    [readerBackground]
  );

  const readerStyle = useMemo(
    () => ({
      fontFamily: readerFont,
      fontSize: `${readerTextSize}px`,
    }),
    [readerFont, readerTextSize]
  );

  const handleDeleteHighlight = (highlightId: string) => {
    setHighlights((prev) => prev.filter((item) => item.id !== highlightId));
  };

  const handleUpdateHighlightNote = (highlightId: string, note: string) => {
    setHighlights((prev) =>
      prev.map((item) => (item.id === highlightId ? { ...item, note } : item))
    );
  };

  const handleJumpToHighlight = (highlight: LocalHighlight) => {
    setJumpToHighlight(highlight);
  };

  return (
    <main
      className="min-h-screen overflow-hidden text-(--on-surface) transition-colors duration-200"
      style={pageStyle}
    >
      <div className="mx-auto flex min-h-screen w-full flex-col px-2 py-2 sm:px-3 sm:py-3">
        <nav className="sticky top-3 z-30 mb-4 sm:top-4 sm:mb-6">
          <div className="group w-full">
            <div className="relative flex w-full items-center justify-between rounded-xl px-3 py-1.5 backdrop-blur-xl transition-all duration-200">
              <div className="flex items-center">
                <Link
                  to="/library"
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 [font-family:var(--font-ui)] text-xs font-semibold text-(--on-surface-muted) opacity-100 transition-all duration-200 hover:text-(--primary) sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Library</span>
                </Link>
              </div>

              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
                <h1 className="max-w-[60vw] truncate text-center [font-family:var(--font-ui)] text-sm font-normal text-(--on-surface) sm:font-light sm:text-(--on-surface-muted) sm:group-hover:font-normal sm:group-hover:text-(--on-surface)">
                  {documentRecord?.title || "Untitled"}
                </h1>
              </div>

              <div className="flex items-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsReaderSettingsOpen((open) => !open)}
                    className="inline-flex h-9 cursor-pointer items-center rounded-xl px-3 text-(--on-surface-muted) opacity-100 transition-all duration-200 hover:bg-[rgba(255,255,255,0.46)] hover:text-(--on-surface) sm:opacity-0 sm:group-hover:opacity-100 [font-family:var(--font-ui)] text-xs font-semibold"
                  >
                    aA
                  </button>

                  {isReaderSettingsOpen && (
                    <div className="absolute right-0 top-[calc(100%+0.6rem)] z-20 w-80 overflow-hidden rounded-3xl border border-[rgba(196,197,215,0.22)] bg-[rgba(255,255,255)] shadow-[0_18px_48px_rgba(28,28,24,0.12)] backdrop-blur-2xl">
                      <div className="border-b border-[rgba(196,197,215,0.16)] px-5 py-4">
                        <div className="[font-family:var(--font-ui)] text-sm font-semibold text-(--on-surface)">
                          Reader Settings
                        </div>
                      </div>

                      <div className="space-y-4 px-5 py-5">
                        <label className="block">
                          <div className="mb-2 [font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.14em] text-(--on-surface-muted)">
                            Font
                          </div>
                          <select
                            value={readerFont}
                            onChange={(e) => setReaderFont(e.target.value)}
                            className="h-11 w-full rounded-xl border border-[rgba(196,197,215,0.24)] bg-[rgba(255,255,255,0.58)] px-4 shadow-[0_4px_14px_rgba(28,28,24,0.03)] outline-none transition-all [font-family:var(--font-ui)] text-sm text-(--on-surface) focus:border-[rgba(67,97,238,0.26)] focus:ring-2 focus:ring-[rgba(67,97,238,0.14)]"
                          >
                            <option value="var(--font-ui)">UI</option>
                            <option value="var(--font-reading)">Reading</option>
                            <option value="var(--font-opendys)">Open Dyslexic</option>
                            <option value="var(--font-lexend)">Lexend</option>
                            <option value="Georgia, serif">Georgia</option>
                            <option value="'Times New Roman', serif">Times New Roman</option>
                            <option value="Arial, sans-serif">Arial</option>
                          </select>
                        </label>

                        <label className="block">
                          <div className="mb-2 [font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.14em] text-(--on-surface-muted)">
                            Text size
                          </div>
                          <div className="rounded-2xl border border-[rgba(196,197,215,0.2)] bg-[rgba(255,255,255,0.4)] px-4 py-3 shadow-[0_4px_14px_rgba(28,28,24,0.03)]">
                            <input
                              type="range"
                              min={14}
                              max={24}
                              step={1}
                              value={readerTextSize}
                              onChange={(e) => setReaderTextSize(Number(e.target.value))}
                              className="w-full accent-(--primary)"
                            />
                            <div className="mt-2 [font-family:var(--font-ui)] text-xs text-(--on-surface-muted)">
                              {readerTextSize}px
                            </div>
                          </div>
                        </label>

                        <label className="block">
                          <div className="mb-2 [font-family:var(--font-ui)] text-xs font-semibold uppercase tracking-[0.14em] text-(--on-surface-muted)">
                            Background
                          </div>
                          <select
                            value={readerBackground}
                            onChange={(e) => setReaderBackground(e.target.value)}
                            className="h-11 w-full rounded-xl border border-[rgba(196,197,215,0.24)] bg-[rgba(255,255,255,0.58)] px-4 shadow-[0_4px_14px_rgba(28,28,24,0.03)] outline-none transition-all [font-family:var(--font-ui)] text-sm text-(--on-surface) focus:border-[rgba(67,97,238,0.26)] focus:ring-2 focus:ring-[rgba(67,97,238,0.14)]"
                          >
                            <option value="#f5f1e8">Warm</option>
                            <option value="#ffffff">White</option>
                            <option value="#f3f4f6">Gray</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {loading || epubLoading || highlightsLoading ? (
          <div className="mx-auto w-full max-w-3xl animate-pulse space-y-4 pt-6">
            <div className="h-4 w-28 rounded bg-black/10" />
            <div className="h-[60vh] rounded-3xl bg-black/8" />
          </div>
        ) : error ? (
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-[rgba(186,26,26,0.12)] bg-[rgba(255,255,255,0.58)] px-5 py-4 shadow-[0_4px_14px_rgba(28,28,24,0.03)] backdrop-blur-md">
            <p className="[font-family:var(--font-ui)] text-sm text-(--error)">
              {error}
            </p>
          </div>
        ) : (
         <section
            className="mx-auto flex h-[calc(100vh-6.5rem)] min-h-0 w-full flex-col gap-3 overflow-hidden px-2 sm:px-4 lg:h-[calc(100vh-7rem)] lg:flex-row lg:gap-4 lg:px-6"
            style={readerStyle}
          >
            <div className="flex h-[58vh] min-h-0 w-full overflow-hidden rounded-2xl lg:h-auto lg:min-w-0 lg:flex-1">
              <SimpleEpubViewer
                data={epubData}
                highlights={highlights}
                onHighlightsChange={setHighlights}
                onResolvedHighlightsChange={setResolvedHighlightItems}
                jumpToHighlight={jumpToHighlight}
              />
            </div>

            <div className="flex h-[32vh] min-h-0 w-full shrink-0 overflow-hidden rounded-2xl border border-[rgba(196,197,215,0.18)] bg-[rgba(255,255,255,0.28)] shadow-[0_8px_28px_rgba(28,28,24,0.05)] lg:h-auto lg:w-80">
              <HighlightsPanel
                highlights={resolvedHighlightItems}
                onJumpToHighlight={handleJumpToHighlight}
                onDeleteHighlight={handleDeleteHighlight}
                onUpdateHighlightNote={handleUpdateHighlightNote}
              />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}