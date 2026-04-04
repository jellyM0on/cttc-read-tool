import JSZip from "jszip";

export type EpubExtractedMetadata = {
  title: string;
  author: string | null;
  cover: string | null; // base64 data URL
};

function parseXml(xmlText: string): Document {
  return new DOMParser().parseFromString(xmlText, "application/xml");
}

function normalizeZipPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/\\/g, "/");
}

async function getRootOpfPath(zip: JSZip): Promise<string> {
  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("Invalid EPUB: META-INF/container.xml not found");
  }

  const containerXml = await containerFile.async("text");
  const containerDoc = parseXml(containerXml);

  const rootfile = Array.from(containerDoc.getElementsByTagName("*")).find(
    (el) => el.localName === "rootfile"
  );

  const fullPath = rootfile?.getAttribute("full-path")?.trim();
  if (!fullPath) {
    throw new Error("Invalid EPUB: rootfile full-path not found");
  }

  return normalizeZipPath(fullPath);
}

type ManifestItem = {
  id: string;
  href: string;
  mediaType: string | null;
  properties: string | null;
};

type ParsedPackage = {
  title: string | null;
  author: string | null;
  manifest: ManifestItem[];
  metadataElement: Element | null;
  opfPath: string;
};

function getFirstElementByLocalName(doc: Document | Element, localName: string): Element | null {
  const all = Array.from(doc.getElementsByTagName("*"));
  return all.find((el) => el.localName === localName) ?? null;
}


function getElementsByLocalName(doc: Document | Element, localName: string): Element[] {
  return Array.from(doc.getElementsByTagName("*")).filter((el) => el.localName === localName);
}

function getTextContent(el: Element | null | undefined): string | null {
  const value = el?.textContent?.trim();
  return value || null;
}

async function parsePackageDocument(zip: JSZip, opfPath: string): Promise<ParsedPackage> {
  const opfFile = zip.file(opfPath);
  if (!opfFile) {
    throw new Error(`Invalid EPUB: package document not found at ${opfPath}`);
  }

  const opfXml = await opfFile.async("text");
  const opfDoc = parseXml(opfXml);

  const metadataEl = getFirstElementByLocalName(opfDoc, "metadata");

  const title =
    getTextContent(getElementsByLocalName(opfDoc, "title")[0]) ??
    getTextContent(getElementsByLocalName(opfDoc, "identifier")[0]);

  const creators = getElementsByLocalName(opfDoc, "creator")
    .map((el) => getTextContent(el))
    .filter((value): value is string => Boolean(value));

  const author = creators.length ? creators.join(", ") : null;

  const manifestEl = getFirstElementByLocalName(opfDoc, "manifest");
  const manifest: ManifestItem[] = manifestEl
    ? Array.from(manifestEl.children)
        .filter((el) => el.localName === "item")
        .map((el) => ({
          id: el.getAttribute("id") || "",
          href: el.getAttribute("href") || "",
          mediaType: el.getAttribute("media-type"),
          properties: el.getAttribute("properties"),
        }))
    : [];

  return {
    title,
    author,
    manifest,
    metadataElement: metadataEl,
    opfPath,
  };
}

type LocalizedText = string | Record<string, string> | undefined | null;

type Contributor =
  | string
  | { name?: string | Record<string, string> }
  | Array<string | { name?: string | Record<string, string> }>
  | undefined
  | null;

function formatLanguageMap(value: LocalizedText): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;

  for (const key of Object.keys(value)) {
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

function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index + 1) : "";
}

function joinPath(baseDir: string, relativePath: string): string {
  const baseParts = baseDir.split("/").filter(Boolean);
  const relParts = relativePath.split("/").filter(Boolean);
  const out = [...baseParts];

  for (const part of relParts) {
    if (part === ".") continue;
    if (part === "..") {
      out.pop();
    } else {
      out.push(part);
    }
  }

  return out.join("/");
}

function findCoverManifestPath(pkg: ParsedPackage): { path: string; mediaType?: string } | null {
  const opfDir = dirname(pkg.opfPath);

  // EPUB 3: manifest item with properties="cover-image"
  const coverPropItem = pkg.manifest.find((item) =>
    item.properties?.split(/\s+/).includes("cover-image")
  );
  if (coverPropItem?.href) {
    return {
      path: joinPath(opfDir, coverPropItem.href),
      mediaType: coverPropItem.mediaType || undefined,
    };
  }

  // EPUB 2: <meta name="cover" content="cover-image-id" />
  const coverMeta = pkg.metadataElement
    ? Array.from(pkg.metadataElement.children).find(
        (el) => el.localName === "meta" && el.getAttribute("name") === "cover"
      )
    : null;

  const coverId = coverMeta?.getAttribute("content");
  if (coverId) {
    const coverItem = pkg.manifest.find((item) => item.id === coverId);
    if (coverItem?.href) {
      return {
        path: joinPath(opfDir, coverItem.href),
        mediaType: coverItem.mediaType || undefined,
      };
    }
  }

  // Fallback
  const heuristicItem =
    pkg.manifest.find((item) => item.id.toLowerCase().includes("cover") && !!item.href) ||
    pkg.manifest.find(
      (item) =>
        !!item.href &&
        !!item.mediaType &&
        item.mediaType.startsWith("image/") &&
        /cover/i.test(item.href)
    );

  if (heuristicItem?.href) {
    return {
      path: joinPath(opfDir, heuristicItem.href),
      mediaType: heuristicItem.mediaType || undefined,
    };
  }

  return null;
}

function getMimeTypeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".svg")) return "image/svg+xml";

  return "application/octet-stream";
}

async function getFileAsBlob(zip: JSZip, path: string, mediaType?: string): Promise<Blob | null> {
  const normalized = normalizeZipPath(path);
  const file = zip.file(normalized);
  if (!file) return null;

  const buffer = await file.async("arraybuffer");
  return new Blob([buffer], { type: mediaType || getMimeTypeFromFilename(normalized) });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob as data URL"));
    reader.readAsDataURL(blob);
  });
}

// Open epub as zip
// Read META-INF/container.xml -> this will point to the .opf file
// .opf file -> gives us metadata 

export async function extractEpubMetadata(file: File): Promise<EpubExtractedMetadata> {
    const zip = await JSZip.loadAsync(file);
    const opfPath = await getRootOpfPath(zip);
    const pkg = await parsePackageDocument(zip, opfPath); 

    const title = pkg.title?.trim() || file.name.replace(/\.epub$/i, "") || "Untitled Book";
    const author = formatContributor(pkg.author);

    let cover: string | null = null;
    const coverRef = findCoverManifestPath(pkg);

    if (coverRef) {
        const coverBlob = await getFileAsBlob(zip, coverRef.path, coverRef.mediaType);
        
        if (coverBlob) {
            cover = await blobToDataUrl(coverBlob);
        }
    }

   return { title, author, cover, };
}