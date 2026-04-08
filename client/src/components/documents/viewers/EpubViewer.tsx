import JSZip from "jszip";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type {
  HighlightColor,
  HighlightItem,
  LocalHighlight,
} from "../highlights/HighlightsPanel";

type EpubManifestItem = {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
};

type EpubSpineItem = {
  idref: string;
};

type EpubNavItem = {
  id: string;
  href: string;
  label: string;
};

type ParsedEpub = {
  title: string;
  htmlSections: Array<{
    id: string;
    href: string;
    label: string;
    html: string;
    spineIndex: number;
    manifestId: string;
  }>;
};

type TextNodeSpan = {
  node: Text;
  start: number;
  end: number;
};

type SectionTextModel = {
  root: HTMLElement;
  text: string;
  spans: TextNodeSpan[];
};

const HIGHLIGHT_COLOR_VALUES: Record<HighlightColor, string> = {
  yellow: "rgba(255, 230, 120, 0.75)",
  green: "rgba(134, 239, 172, 0.55)",
  pink: "rgba(249, 168, 212, 0.55)",
  blue: "rgba(147, 197, 253, 0.55)",
};

const HIGHLIGHT_COLOR_LABELS: Record<HighlightColor, string> = {
  yellow: "Yellow",
  green: "Green",
  pink: "Pink",
  blue: "Blue",
};

const HIGHLIGHT_REGISTRY_NAMES: Record<HighlightColor, string> = {
  yellow: "reader-highlight-yellow",
  green: "reader-highlight-green",
  pink: "reader-highlight-pink",
  blue: "reader-highlight-blue",
};

function getHighlightCss() {
  return `
    ::highlight(${HIGHLIGHT_REGISTRY_NAMES.yellow}) { background: rgba(255, 230, 120, 0.75); }
    ::highlight(${HIGHLIGHT_REGISTRY_NAMES.green}) { background: rgba(134, 239, 172, 0.55); }
    ::highlight(${HIGHLIGHT_REGISTRY_NAMES.pink}) { background: rgba(249, 168, 212, 0.55); }
    ::highlight(${HIGHLIGHT_REGISTRY_NAMES.blue}) { background: rgba(147, 197, 253, 0.55); }
  `;
}

function parseXml(xml: string): Document {
  const doc = new DOMParser().parseFromString(xml, "application/xml");

  if (doc.querySelector("parsererror")) {
    throw new Error("Failed to parse EPUB XML/XHTML");
  }

  return doc;
}

function textContent(node: Element | null | undefined): string {
  return node?.textContent?.trim() ?? "";
}

function dirname(path: string): string {
  const clean = path.split("#")[0].split("?")[0];
  const index = clean.lastIndexOf("/");
  return index >= 0 ? clean.slice(0, index + 1) : "";
}

function joinPath(base: string, relative: string): string {
  if (!relative) return base;
  if (/^[a-z]+:/i.test(relative)) return relative;

  const stack = base.split("/").filter(Boolean);
  const parts = relative.split("/");

  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }

  return stack.join("/");
}

function normalizeZipPath(path: string): string {
  return path.replace(/^\/+/, "");
}

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "section"
  );
}

function getHtmlBody(doc: Document): string {
  const body = doc.querySelector("body");
  return body ? body.innerHTML : doc.documentElement?.innerHTML ?? "";
}

function stripScripts(root: ParentNode) {
  root.querySelectorAll("script").forEach((node) => node.remove());
}

function absolutizeAttributes(root: ParentNode, sectionDir: string) {
  const attrs = ["src", "href", "poster"];

  for (const attr of attrs) {
    root.querySelectorAll(`[${attr}]`).forEach((el) => {
      const value = el.getAttribute(attr);
      if (!value) return;

      if (
        value.startsWith("data:") ||
        value.startsWith("blob:") ||
        value.startsWith("http://") ||
        value.startsWith("https://") ||
        value.startsWith("#")
      ) {
        return;
      }

      const resolved = joinPath(sectionDir, value);
      el.setAttribute(attr, resolved);
    });
  }
}

async function loadBlobUrlMap(
  zip: JSZip,
  manifest: Map<string, EpubManifestItem>,
  opfDir: string
) {
  const blobUrls = new Map<string, string>();

  for (const item of manifest.values()) {
    const zipPath = normalizeZipPath(joinPath(opfDir, item.href));
    const file = zip.file(zipPath);
    if (!file) continue;

    if (
      item.mediaType.startsWith("image/") ||
      item.mediaType === "text/css" ||
      item.mediaType.startsWith("font/")
    ) {
      const blob = await file.async("blob");
      const url = URL.createObjectURL(blob);
      blobUrls.set(zipPath, url);
    }
  }

  return blobUrls;
}

function replaceAssetUrls(root: ParentNode, blobUrls: Map<string, string>) {
  for (const attr of ["src", "poster"]) {
    root.querySelectorAll(`[${attr}]`).forEach((el) => {
      const value = el.getAttribute(attr);
      if (!value) return;

      const clean = normalizeZipPath(value.split("#")[0]);
      const blobUrl = blobUrls.get(clean);
      if (!blobUrl) return;

      const hash = value.includes("#") ? `#${value.split("#")[1]}` : "";
      el.setAttribute(attr, `${blobUrl}${hash}`);
    });
  }

  root.querySelectorAll("link[href]").forEach((el) => {
    const value = el.getAttribute("href");
    if (!value) return;

    const clean = normalizeZipPath(value.split("#")[0]);
    const blobUrl = blobUrls.get(clean);
    if (!blobUrl) return;

    const hash = value.includes("#") ? `#${value.split("#")[1]}` : "";
    el.setAttribute("href", `${blobUrl}${hash}`);
  });
}

async function parseNavDocument(
  zip: JSZip,
  manifest: Map<string, EpubManifestItem>,
  opfDir: string
): Promise<EpubNavItem[]> {
  const navItem = Array.from(manifest.values()).find(
    (item) =>
      item.properties?.includes("nav") ||
      (item.mediaType === "application/xhtml+xml" &&
        item.href.toLowerCase().includes("nav"))
  );

  if (!navItem) return [];

  const zipPath = normalizeZipPath(joinPath(opfDir, navItem.href));
  const file = zip.file(zipPath);
  if (!file) return [];

  const navText = await file.async("string");
  const navDoc = parseXml(navText);

  const navRoot =
    navDoc.querySelector('nav[epub\\:type="toc"]') ||
    navDoc.querySelector('nav[*|type="toc"]') ||
    navDoc.querySelector("nav");

  if (!navRoot) return [];

  const items: EpubNavItem[] = [];
  navRoot.querySelectorAll("a[href]").forEach((a, index) => {
    items.push({
      id: `nav-${index}`,
      href: a.getAttribute("href") ?? "",
      label: textContent(a),
    });
  });

  return items;
}

async function parseEpub(data: ArrayBuffer): Promise<{
  book: ParsedEpub;
  blobUrls: string[];
}> {
  const zip = await JSZip.loadAsync(data);

  const containerFile = zip.file("META-INF/container.xml");
  if (!containerFile) {
    throw new Error("Invalid EPUB: META-INF/container.xml not found");
  }

  const containerXml = await containerFile.async("string");
  const containerDoc = parseXml(containerXml);
  const rootfilePath =
    containerDoc.querySelector("rootfile")?.getAttribute("full-path") ?? "";

  if (!rootfilePath) {
    throw new Error("Invalid EPUB: rootfile full-path not found");
  }

  const opfFile = zip.file(normalizeZipPath(rootfilePath));
  if (!opfFile) {
    throw new Error(`Invalid EPUB: OPF file not found at ${rootfilePath}`);
  }

  const opfXml = await opfFile.async("string");
  const opfDoc = parseXml(opfXml);
  const opfDir = dirname(rootfilePath);

  const manifest = new Map<string, EpubManifestItem>();
  opfDoc.querySelectorAll("manifest > item").forEach((item) => {
    const id = item.getAttribute("id") ?? "";
    if (!id) return;

    manifest.set(id, {
      id,
      href: item.getAttribute("href") ?? "",
      mediaType: item.getAttribute("media-type") ?? "",
      properties: item.getAttribute("properties") ?? "",
    });
  });

  const spine: EpubSpineItem[] = [];
  opfDoc.querySelectorAll("spine > itemref").forEach((itemref) => {
    const idref = itemref.getAttribute("idref") ?? "";
    if (idref) spine.push({ idref });
  });

  const title =
    textContent(opfDoc.querySelector("metadata > title")) ||
    textContent(opfDoc.querySelector("dc\\:title")) ||
    "Untitled EPUB";

  const blobUrlMap = await loadBlobUrlMap(zip, manifest, opfDir);
  const blobUrls = Array.from(blobUrlMap.values());
  const nav = await parseNavDocument(zip, manifest, opfDir);

  const htmlSections: ParsedEpub["htmlSections"] = [];

  for (let i = 0; i < spine.length; i += 1) {
    const spineItem = spine[i];
    const manifestItem = manifest.get(spineItem.idref);
    if (!manifestItem) continue;

    const zipPath = normalizeZipPath(joinPath(opfDir, manifestItem.href));
    const file = zip.file(zipPath);
    if (!file) continue;

    const mediaType = manifestItem.mediaType;
    const isHtml =
      mediaType === "application/xhtml+xml" ||
      mediaType === "text/html" ||
      manifestItem.href.endsWith(".xhtml") ||
      manifestItem.href.endsWith(".html");

    if (!isHtml) continue;

    const rawHtml = await file.async("string");
    const doc = parseXml(rawHtml);

    stripScripts(doc);
    absolutizeAttributes(doc, dirname(zipPath));
    replaceAssetUrls(doc, blobUrlMap);

    const navLabel =
      nav.find((item) => {
        const normalizedNavHref = normalizeZipPath(
          joinPath(opfDir, item.href.split("#")[0])
        );
        return normalizedNavHref === zipPath;
      })?.label ?? `Section ${htmlSections.length + 1}`;

    htmlSections.push({
      id: `section-${htmlSections.length}-${slugify(navLabel)}`,
      href: manifestItem.href,
      label: navLabel,
      html: getHtmlBody(doc),
      spineIndex: i,
      manifestId: manifestItem.id,
    });
  }

  return {
    book: {
      title,
      htmlSections,
    },
    blobUrls,
  };
}

function buildSectionTextModel(root: HTMLElement): SectionTextModel {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const spans: TextNodeSpan[] = [];
  let text = "";
  let pos = 0;

  let current = walker.nextNode();
  while (current) {
    const node = current as Text;
    const value = node.textContent ?? "";
    const start = pos;
    const end = start + value.length;

    spans.push({ node, start, end });
    text += value;
    pos = end;
    current = walker.nextNode();
  }

  return { root, text, spans };
}

function getLiveSectionModel(sectionRoot: HTMLElement | null): SectionTextModel | null {
  if (!sectionRoot) return null;
  return buildSectionTextModel(sectionRoot);
}

function resolveFlatOffset(
  model: SectionTextModel,
  flatOffset: number
): { node: Text; offset: number } | null {
  for (const span of model.spans) {
    if (flatOffset >= span.start && flatOffset <= span.end) {
      return {
        node: span.node,
        offset: flatOffset - span.start,
      };
    }
  }

  if (
    model.spans.length > 0 &&
    flatOffset === model.spans[model.spans.length - 1].end
  ) {
    const last = model.spans[model.spans.length - 1];
    return {
      node: last.node,
      offset: last.node.textContent?.length ?? 0,
    };
  }

  return null;
}

function getFlatOffsetFromBoundary(
  model: SectionTextModel,
  container: Node,
  offset: number
): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const textNode = container as Text;
    const span = model.spans.find((item) => item.node === textNode);
    if (!span) return null;
    return span.start + Math.min(offset, textNode.textContent?.length ?? 0);
  }

  const range = document.createRange();
  try {
    range.setStart(model.root, 0);
    range.setEnd(container, offset);
    return range.toString().length;
  } catch {
    return null;
  }
}

function selectorFromRange(
  model: SectionTextModel,
  range: Range
): LocalHighlight["selector"] | null {
  const startOffset = getFlatOffsetFromBoundary(
    model,
    range.startContainer,
    range.startOffset
  );
  const endOffset = getFlatOffsetFromBoundary(
    model,
    range.endContainer,
    range.endOffset
  );

  if (startOffset == null || endOffset == null || endOffset <= startOffset) {
    return null;
  }

  const quote = model.text.slice(startOffset, endOffset);
  if (!quote.trim()) return null;

  return {
    startOffset,
    endOffset,
    quote,
    prefix: model.text.slice(Math.max(0, startOffset - 20), startOffset),
    suffix: model.text.slice(
      endOffset,
      Math.min(model.text.length, endOffset + 20)
    ),
  };
}

function scoreCandidate(
  text: string,
  quote: string,
  prefix: string,
  suffix: string,
  start: number
) {
  const end = start + quote.length;
  const actualPrefix = text.slice(Math.max(0, start - prefix.length), start);
  const actualSuffix = text.slice(end, Math.min(text.length, end + suffix.length));

  let score = 0;
  if (actualPrefix === prefix) score += 100;
  if (actualSuffix === suffix) score += 100;

  let prefixOverlap = 0;
  for (let len = Math.min(actualPrefix.length, prefix.length); len >= 0; len -= 1) {
    if (actualPrefix.slice(-len) === prefix.slice(-len)) {
      prefixOverlap = len;
      break;
    }
  }

  let suffixOverlap = 0;
  for (let len = Math.min(actualSuffix.length, suffix.length); len >= 0; len -= 1) {
    if (actualSuffix.slice(0, len) === suffix.slice(0, len)) {
      suffixOverlap = len;
      break;
    }
  }

  score += prefixOverlap;
  score += suffixOverlap;

  return score;
}

function resolveSelectorToOffsets(
  model: SectionTextModel,
  selector: LocalHighlight["selector"]
): { startOffset: number; endOffset: number } | null {
  const { startOffset, endOffset, quote, prefix, suffix } = selector;
  const expectedLength = endOffset - startOffset;

  const exactAtStoredLocation = model.text.slice(startOffset, endOffset);
  if (exactAtStoredLocation === quote) {
    return { startOffset, endOffset };
  }

  const matches: number[] = [];
  let fromIndex = 0;
  while (true) {
    const found = model.text.indexOf(quote, fromIndex);
    if (found === -1) break;
    matches.push(found);
    fromIndex = found + Math.max(1, quote.length);
  }

  if (!matches.length) return null;

  let bestStart = matches[0];
  let bestScore = -Infinity;

  for (const candidateStart of matches) {
    let score = scoreCandidate(model.text, quote, prefix, suffix, candidateStart);
    const candidateEnd = candidateStart + quote.length;
    const distance =
      Math.abs(candidateStart - startOffset) + Math.abs(candidateEnd - endOffset);

    score -= distance * 0.01;

    if (quote.length === expectedLength) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestStart = candidateStart;
    }
  }

  return {
    startOffset: bestStart,
    endOffset: bestStart + quote.length,
  };
}

function rangeFromSelector(
  model: SectionTextModel,
  selector: LocalHighlight["selector"]
): Range | null {
  const resolved = resolveSelectorToOffsets(model, selector);
  if (!resolved) return null;

  const start = resolveFlatOffset(model, resolved.startOffset);
  const end = resolveFlatOffset(model, resolved.endOffset);
  if (!start || !end) return null;

  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset);

  return range.toString() === selector.quote ? range : null;
}

function dedupeHighlights(highlights: LocalHighlight[]) {
  const seen = new Set<string>();

  return highlights.filter((item) => {
    const key = `${item.sectionHref}:${item.selector.startOffset}:${item.selector.endOffset}:${item.selector.quote}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const readerCss = `
  .simple-epub-root {
    position: relative;
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: transparent;
    color: inherit;
  }

  .simple-epub-toolbar {
    position: relative;
    z-index: 29;
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    backdrop-filter: blur(12px);
  }

  .simple-epub-toolbar-left,
  .simple-epub-toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .simple-epub-toolbar-center {
    min-width: 0;
    text-align: center;
  }

  .simple-epub-current-section {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 600;
    color: inherit;
  }

  .simple-epub-reader-shell {
    position: relative;
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
  }

  .simple-epub-layout {
    position: relative;
    height: 100%;
    min-height: 0;
  }

  .simple-epub-spine-overlay {
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 20;
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .simple-epub-spine-overlay[data-open="false"] {
    visibility: hidden;
  }

  .simple-epub-spine-panel {
    pointer-events: auto;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    border-right: 1px solid rgba(196,197,215,0.18);
    backdrop-filter: blur(16px);
    box-shadow: 16px 0 40px rgba(28,28,24,0.08);
  }

  .simple-epub-spine-scroll {
    height: 100%;
    overflow-y: auto;
    padding: 12px;
  }

  .simple-epub-spine-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .simple-epub-spine-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 10px;
    border: 1px solid transparent;
    border-radius: 14px;
    background: transparent;
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    color: inherit;
    font: inherit;
  }

  .simple-epub-spine-item:hover {
    background: rgba(255,255,255,0.62);
  }

  .simple-epub-spine-item[data-active="true"] {
    border-color: rgba(196,197,215,0.24);
    background: rgba(255,255,255,0.72);
  }

  .simple-epub-spine-index {
    flex: 0 0 auto;
    font-size: 11px;
    opacity: 0.6;
  }

  .simple-epub-spine-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 500;
  }

  .simple-epub-spine-scrim {
    pointer-events: none;
  }

  .simple-epub-scroll {
    position: relative;
    z-index: 1;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
  }

  .simple-epub-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    min-width: 36px;
    border: 1px solid rgba(196,197,215,0.24);
    border-radius: 12px;
    padding: 0 12px;
    background: rgba(255,255,255,0.58);
    color: inherit;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .simple-epub-button:hover:not(:disabled) {
    background: var(--surface-container-lowest, rgba(255,255,255,0.9));
    color: var(--primary, inherit);
  }

  .simple-epub-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .simple-epub-hamburger {
    padding: 10px 10px;
    font-size: 16px;
    line-height: 1;
  }

  .simple-epub-button-reader {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    min-width: 36px;
    border-radius: 12px;
    padding: 0 12px;
    color: inherit;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .simple-epub-button-reader:hover:not(:disabled) {
    background: var(--surface-container-lowest, rgba(255,255,255,0.9));
    color: var(--primary, inherit);
  }

  .simple-epub-button-reader:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .simple-epub-progress {
    font-size: 12px;
    opacity: 0.72;
    white-space: nowrap;
  }

  .simple-epub-content {
    max-width: 80%;
    margin: 0 auto;
    padding: 24px 20px;
  }

  .simple-epub-section {
    margin-bottom: 40px;
  }

  .simple-epub-body {
    line-height: 1.8;
    word-break: break-word;
  }

  .simple-epub-body p,
  .simple-epub-body li,
  .simple-epub-body blockquote,
  .simple-epub-body dd {
    line-height: 1.8;
  }

  .simple-epub-body img,
  .simple-epub-body svg,
  .simple-epub-body video {
    display: block;
    max-width: 100%;
    height: auto;
    margin-left: auto;
    margin-right: auto;
  }

  .simple-epub-body figure {
    margin-left: auto;
    margin-right: auto;
    text-align: center;
  }

  .simple-epub-body pre {
    white-space: pre-wrap !important;
  }

  .simple-epub-side-nav {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 10;
  }

  .simple-epub-side-button {
    pointer-events: auto;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(196,197,215,0.24);
    border-radius: 999px;
    background: rgba(255,255,255,0.72);
    color: inherit;
    font: inherit;
    font-size: 18px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(28,28,24,0.08);
    cursor: pointer;
    transition: all 0.2s ease, opacity 0.2s ease;
    opacity: 0;
  }

  .simple-epub-reader-shell:hover .simple-epub-side-button,
  .simple-epub-reader-shell:focus-within .simple-epub-side-button {
    opacity: 1;
  }

  .simple-epub-side-button:hover:not(:disabled) {
    background: var(--surface-container-lowest, rgba(255,255,255,0.95));
    color: var(--primary, inherit);
  }

  .simple-epub-side-button:disabled {
    opacity: 0;
    cursor: not-allowed;
    pointer-events: none;
  }

  .simple-epub-side-button--left {
    left: 16px;
  }

  .simple-epub-side-button--right {
    right: 16px;
  }

  .simple-epub-scroll,
  .simple-epub-spine-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0,0,0,0.55) transparent;
  }

  .simple-epub-scroll::-webkit-scrollbar,
  .simple-epub-spine-scroll::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  .simple-epub-scroll::-webkit-scrollbar-track,
  .simple-epub-spine-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .simple-epub-scroll::-webkit-scrollbar-thumb,
  .simple-epub-spine-scroll::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.55);
    border-radius: 999px;
  }

  .simple-epub-color-picker {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .simple-epub-color-picker button {
    width: 20px;
    height: 20px;
    border-radius: 999px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
  }

  .simple-epub-color-picker button[data-active="true"] {
    border-color: currentColor;
  }

  @media (max-width: 768px) {
    .simple-epub-spine-overlay {
      grid-template-columns: min(280px, 82vw) minmax(0, 1fr);
    }
  }

  @media (max-width: 640px) {
    .simple-epub-toolbar {
      padding: 10px 12px;
      gap: 8px;
    }

    .simple-epub-content {
      max-width: 100%;
      padding: 18px 14px 24px;
    }

    .simple-epub-section {
      margin-bottom: 28px;
    }

    .simple-epub-current-section {
      font-size: 12px;
    }

    .simple-epub-side-button {
      width: 38px;
      height: 38px;
      font-size: 16px;
    }

    .simple-epub-side-button--left {
      left: 10px;
    }

    .simple-epub-side-button--right {
      right: 10px;
    }
  }
`;

type SimpleEpubViewerProps = {
  data: ArrayBuffer | null;
  highlights: LocalHighlight[];
  onHighlightsChange: (highlights: LocalHighlight[]) => void;
  onResolvedHighlightsChange?: (items: HighlightItem[]) => void;
  jumpToHighlight?: LocalHighlight | null;
};

export function SimpleEpubViewer({
  data,
  highlights,
  onHighlightsChange,
  onResolvedHighlightsChange,
  jumpToHighlight,
}: SimpleEpubViewerProps) {
  const [book, setBook] = useState<ParsedEpub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isSpineOpen, setIsSpineOpen] = useState(false);
  const [activeColor, setActiveColor] = useState<HighlightColor>("yellow");

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let urlsToRevoke: string[] = [];

    async function run() {
      if (!data) {
        setBook(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        setBook(null);
        setCurrentSectionIndex(0);
        setIsSpineOpen(false);

        const parsed = await parseEpub(data);
        if (cancelled) {
          parsed.blobUrls.forEach((url) => URL.revokeObjectURL(url));
          return;
        }

        urlsToRevoke = parsed.blobUrls;
        setBook(parsed.book);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to parse EPUB");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [data]);

  const totalSections = book?.htmlSections.length ?? 0;
  const currentSection = book?.htmlSections[currentSectionIndex] ?? null;

  const applyHighlights = useCallback(() => {
    for (const name of Object.values(HIGHLIGHT_REGISTRY_NAMES)) {
      CSS.highlights.delete(name);
    }

    if (!currentSection || !sectionBodyRef.current) return;

    const model = getLiveSectionModel(sectionBodyRef.current);
    if (!model) return;

    const sectionHighlights = highlights.filter(
      (highlight) => highlight.sectionHref === currentSection.href
    );

    const rangesByColor: Record<HighlightColor, Range[]> = {
      yellow: [],
      green: [],
      pink: [],
      blue: [],
    };

    for (const highlight of sectionHighlights) {
      const range = rangeFromSelector(model, highlight.selector);
      if (!range) continue;
      rangesByColor[highlight.color].push(range);
    }

    for (const color of Object.keys(rangesByColor) as HighlightColor[]) {
      const ranges = rangesByColor[color];
      if (!ranges.length) continue;

      CSS.highlights.set(
        HIGHLIGHT_REGISTRY_NAMES[color],
        new Highlight(...ranges)
      );
    }
  }, [currentSection, highlights]);
 
  useLayoutEffect(() => {
    applyHighlights();
  }, [applyHighlights, currentSectionIndex]);

  useEffect(() => {
    return () => {
      for (const name of Object.values(HIGHLIGHT_REGISTRY_NAMES)) {
        CSS.highlights.delete(name);
      }
    };
  }, []);

  const resolvedHighlightItems = useMemo<HighlightItem[]>(() => {
    if (!book) return [];

    return highlights
      .map((highlight) => {
        const section = book.htmlSections.find(
          (item) => item.href === highlight.sectionHref
        );

        const resolved =
          section && currentSection?.href === section.href && sectionBodyRef.current
            ? resolveSelectorToOffsets(
                buildSectionTextModel(sectionBodyRef.current),
                highlight.selector
              )
            : null;

        return {
          highlight,
          sectionLabel: section?.label ?? `Section ${highlight.spineIndex + 1}`,
          resolvedStartOffset: resolved?.startOffset ?? highlight.selector.startOffset,
        };
      })
      .sort((a, b) => {
        if (a.highlight.spineIndex !== b.highlight.spineIndex) {
          return a.highlight.spineIndex - b.highlight.spineIndex;
        }

        const aOffset = a.resolvedStartOffset ?? a.highlight.selector.startOffset;
        const bOffset = b.resolvedStartOffset ?? b.highlight.selector.startOffset;

        return aOffset - bOffset;
      });
  }, [book, highlights, currentSection]);

  useEffect(() => {
    onResolvedHighlightsChange?.(resolvedHighlightItems);
  }, [resolvedHighlightItems, onResolvedHighlightsChange]);

  const goToSection = (index: number) => {
    if (!book) return;

    const nextIndex = Math.max(0, Math.min(book.htmlSections.length - 1, index));
    setCurrentSectionIndex(nextIndex);
    setIsSpineOpen(false);

    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: 0 });
    });
  };

  const goToPreviousSection = () => {
    if (!book || currentSectionIndex <= 0) return;
    goToSection(currentSectionIndex - 1);
  };

  const goToNextSection = () => {
    if (!book || currentSectionIndex >= book.htmlSections.length - 1) return;
    goToSection(currentSectionIndex + 1);
  };

  const createHighlightFromSelection = () => {
    if (!book || !currentSection || !sectionBodyRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!range.toString().trim()) return;

    const root = sectionBodyRef.current;
    if (
      !root.contains(range.commonAncestorContainer) ||
      !root.contains(range.startContainer) ||
      !root.contains(range.endContainer)
    ) {
      return;
    }

    const model = getLiveSectionModel(root);
    if (!model) return;

    const selector = selectorFromRange(model, range);
    if (!selector) return;

    const newHighlight: LocalHighlight = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      color: activeColor,
      createdAt: new Date().toISOString(),
      sectionHref: currentSection.href,
      spineIndex: currentSection.spineIndex,
      selector,
    };

    onHighlightsChange(dedupeHighlights([...highlights, newHighlight]));
    selection.removeAllRanges();

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyHighlights();
      });
    });
  };

  useEffect(() => {
    if (!jumpToHighlight || !book) return;

    const sectionIndex = book.htmlSections.findIndex(
      (section) => section.href === jumpToHighlight.sectionHref
    );

    if (sectionIndex === -1) return;

    if (sectionIndex !== currentSectionIndex) {
      setCurrentSectionIndex(sectionIndex);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: 0 });
      });
      return;
    }

    requestAnimationFrame(() => {
      const root = sectionBodyRef.current;
      const scroller = scrollRef.current;
      if (!root || !scroller) return;

      const model = getLiveSectionModel(root);
      if (!model) return;

      const range = rangeFromSelector(model, jumpToHighlight.selector);
      if (!range) return;

      const rect = range.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      const delta = rect.top - scrollerRect.top - scroller.clientHeight * 0.35;

      scroller.scrollBy({
        top: delta,
        behavior: "smooth",
      });
    });
  }, [jumpToHighlight, book, currentSectionIndex]);

  useEffect(() => {
  const root = sectionBodyRef.current;
  if (!root) return;

  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      applyHighlights();
    });
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return () => observer.disconnect();
}, [applyHighlights, currentSectionIndex]);

  if (!data) {
    return (
      <div className="flex h-full min-h-150 items-center justify-center text-sm text-(--on-surface-muted)">
        No EPUB loaded.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-150 items-center justify-center text-sm text-(--on-surface-muted)">
        Loading EPUB…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-150 items-center justify-center p-6 text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="h-full min-h-0 w-full overflow-hidden">
      <style>{readerCss + getHighlightCss()}</style>

      <div className="simple-epub-root">
        <div className="simple-epub-toolbar">
          <div className="simple-epub-toolbar-left">
            <button
              type="button"
              className="simple-epub-button-reader simple-epub-hamburger"
              onClick={() => setIsSpineOpen((open) => !open)}
              aria-label="Open section navigator"
              aria-expanded={isSpineOpen}
            >
              ☰
            </button>

            <div className="simple-epub-progress">
              Section {totalSections > 0 ? `${currentSectionIndex + 1} / ${totalSections}` : ""}
            </div>
          </div>

          <div className="simple-epub-toolbar-center">
           
          </div>

          <div className="simple-epub-toolbar-right">
             <div className="simple-epub-color-picker" aria-label="Highlight color">
              {(Object.keys(HIGHLIGHT_COLOR_VALUES) as HighlightColor[]).map((color) => (
                <button
                  key={color}
                  type="button"
                  data-active={activeColor === color}
                  title={`Next highlight: ${HIGHLIGHT_COLOR_LABELS[color]}`}
                  aria-label={`Next highlight: ${HIGHLIGHT_COLOR_LABELS[color]}`}
                  onClick={() => setActiveColor(color)}
                  style={{ background: HIGHLIGHT_COLOR_VALUES[color] }}
                />
              ))}
            </div>

           <button
            type="button"
            className="simple-epub-button-reader"
            onClick={createHighlightFromSelection}
            aria-label="Highlight selection"
            title="Highlight selection"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="m15 5 4 4" />
              <path d="M4 20l4.5-1 9-9-3.5-3.5-9 9L4 20Z" />
              <path d="M13 7l4 4" />
            </svg>
          </button>
          </div>
        </div>

        <div className="simple-epub-reader-shell">
          <div
            className="simple-epub-layout"
            data-spine-open={isSpineOpen ? "true" : "false"}
          >
            <div
              className="simple-epub-spine-overlay"
              data-open={isSpineOpen ? "true" : "false"}
              aria-hidden={!isSpineOpen}
            >
              <aside className="simple-epub-spine-panel" aria-label="Table of contents">
                <div className="simple-epub-spine-scroll">
                  <div className="simple-epub-spine-list">
                    {book.htmlSections.map((section, index) => (
                      <button
                        key={section.id}
                        type="button"
                        className="simple-epub-spine-item"
                        data-active={index === currentSectionIndex}
                        onClick={() => goToSection(index)}
                      >
                        <span className="simple-epub-spine-index">#{index + 1}</span>
                        <span className="simple-epub-spine-label">{section.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div className="simple-epub-spine-scrim" />
            </div>

            <div className="simple-epub-side-nav" aria-hidden="true">
              <button
                type="button"
                className="simple-epub-side-button simple-epub-side-button--left"
                onClick={goToPreviousSection}
                disabled={currentSectionIndex === 0}
                aria-label="Previous section"
              >
                ←
              </button>

              <button
                type="button"
                className="simple-epub-side-button simple-epub-side-button--right"
                onClick={goToNextSection}
                disabled={currentSectionIndex >= totalSections - 1}
                aria-label="Next section"
              >
                →
              </button>
            </div>

            <div ref={scrollRef} className="simple-epub-scroll">
              <div className="simple-epub-content">
                {currentSection && (
                  <section key={currentSection.id} className="simple-epub-section">
                    <div
                      ref={sectionBodyRef}
                      className="simple-epub-body"
                      dangerouslySetInnerHTML={{ __html: currentSection.html }}
                    />
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}