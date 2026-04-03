import { useRef, type ChangeEvent } from "react";

export function UploadPanel({
  onUpload,
  isUploading,
  error,
}: {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await onUpload(file);
    event.target.value = "";
  };

  return (
    <section className="rounded-4xl bg-(--surface-container-low) p-8 md:p-10">
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-dashed border-[rgba(196,197,215,0.3)] px-6 py-12 text-center transition-colors hover:bg-[rgba(186,195,255,0.14)]">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(255,255,255,0.8)] shadow-[0_12px_32px_rgba(28,28,24,0.06)]">
          <span className="text-4xl text-(--primary)">↑</span>
        </div>

        <h2 className="[font-family:var(--font-ui)] text-2xl font-semibold tracking-[-0.02em] text-(--on-surface)">
          Upload New File
        </h2>

        <p className="mt-3 max-w-md [font-family:var(--font-ui)] text-sm leading-7 text-(--on-surface-muted)">
          Upload an EPUB to add it to your library.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {["EPUB"].map((type) => (
            <span
              key={type}
              className="rounded-xl bg-(--surface-container-high) px-4 py-2 [font-family:var(--font-ui)] text-[11px] font-bold uppercase tracking-[0.16em] text-(--on-surface-muted)"
            >
              {type}
            </span>
          ))}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          className="hidden"
          onChange={onFileChange}
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          className="mt-8 rounded-xl bg-(image:--gradient-primary) px-5 py-3 [font-family:var(--font-ui)] text-sm font-bold text-white transition-all hover:-translate-y-0.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Choose File"}
        </button>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}