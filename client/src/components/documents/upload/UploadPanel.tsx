import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { UploadButton } from "./UploadButton";

type UploadPanelProps = {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  error: string | null;
  acceptedTypes?: string[];
  accept?: string;
};

export function UploadPanel({
  onUpload,
  isUploading,
  error,
  acceptedTypes = ["EPUB"],
  accept = ".epub,application/epub+zip",
}: UploadPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const openFilePicker = () => {
    if (isUploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (file: File | null | undefined) => {
    if (!file || isUploading) return;
    await onUpload(file);
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    await handleFile(file);
    event.target.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (isUploading) return;
    setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const relatedTarget = event.relatedTarget as Node | null;

    if (relatedTarget && event.currentTarget.contains(relatedTarget)) return;
    setIsDragging(false);
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    await handleFile(file);
  };

  return (
    <section className="rounded-4xl bg-(--surface-container-low) p-8 md:p-10">
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openFilePicker}
        className={`flex h-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-6 py-12 text-center transition-all ${
          isDragging
            ? "border-(--primary) bg-[rgba(186,195,255,0.18)]"
            : "border-[rgba(196,197,215,0.3)] hover:bg-[rgba(186,195,255,0.14)]"
        } ${isUploading ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(255,255,255,0.8)] shadow-[0_12px_32px_rgba(28,28,24,0.06)]">
          <span className="text-4xl text-(--primary)">↑</span>
        </div>

        <h2 className="[font-family:var(--font-ui)] text-2xl font-semibold tracking-[-0.02em] text-(--on-surface)">
          Upload New File
        </h2>

        <p className="mt-3 max-w-md [font-family:var(--font-ui)] text-sm leading-7 text-(--on-surface-muted)">
          Drag and drop a file here, or click to choose a file.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {acceptedTypes.map((type) => (
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
          accept={accept}
          className="hidden"
          onChange={onFileChange}
        />

        <div
          className="mt-8"
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <UploadButton disabled={isUploading} onClick={openFilePicker}>
            {isUploading ? "Uploading..." : "Choose File"}
          </UploadButton>
        </div>

        {isDragging ? (
          <p className="mt-4 text-sm text-(--primary)">Drop file to upload</p>
        ) : null}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      </div>
    </section>
  );
}