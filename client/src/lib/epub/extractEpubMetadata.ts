import "../../vendor/foliate-js/view.js"

type LocalizedText = string | Record<string, string> | undefined | null;
type Contributor =
  | string
  | { name?: string | Record<string, string> }
  | Array<string | { name?: string | Record<string, string> }>
  | undefined
  | null;

export type EpubExtractedMetadata = {
  title: string;
  author: string | null;
  cover: string | null; // base64 data URL
};

function formatLanguageMap(value: LocalizedText): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;

  const keys = Object.keys(value);
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function formatOneContributor(
  contributor: string | { name?: string | Record<string, string> } | null | undefined
): string | null {
  if (!contributor) return null;
  if (typeof contributor === "string") return contributor.trim() || null;

  return formatLanguageMap(contributor.name);
}

function formatContributor(contributor: Contributor): string | null {
  if (!contributor) return null;

  if (Array.isArray(contributor)) {
    const parts = contributor
      .map(formatOneContributor)
      .filter((value): value is string => Boolean(value));

    return parts.length ? parts.join(", ") : null;
  }

  return formatOneContributor(contributor);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read cover image"));
    reader.readAsDataURL(blob);
  });
}

export async function extractEpubMetadata(file: File): Promise<EpubExtractedMetadata> {
  const view = document.createElement("foliate-view") as HTMLElement & {
    open: (input: File) => Promise<void>;
    book?: {
      metadata?: {
        title?: string | Record<string, string>;
        author?:
          | string
          | { name?: string | Record<string, string> }
          | Array<string | { name?: string | Record<string, string> }>;
      };
      getCover?: () => Promise<Blob | null> | Blob | null;
    };
  };

  view.style.position = "fixed";
  view.style.width = "0";
  view.style.height = "0";
  view.style.opacity = "0";
  view.style.pointerEvents = "none";

  document.body.appendChild(view);

  try {
    await view.open(file);

    const book = view.book;
    const title =
      formatLanguageMap(book?.metadata?.title) ??
      file.name.replace(/\.epub$/i, "") ??
      "Untitled Book";

    const author = formatContributor(book?.metadata?.author);

    let cover: string | null = null;
    const coverBlob = await Promise.resolve(book?.getCover?.());

    if (coverBlob) {
      cover = await blobToDataUrl(coverBlob);
    }

    return {
      title,
      author,
      cover,
    };
  } finally {
    view.remove();
  }
}