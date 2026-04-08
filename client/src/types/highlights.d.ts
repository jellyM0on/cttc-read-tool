export type HighlightColor = "yellow" | "green" | "pink" | "blue";

export type HighlightSelector = {
  startOffset: number;
  endOffset: number;
  quote: string;
  prefix: string;
  suffix: string;
};

export type LocalHighlight = {
  id: string;
  color: HighlightColor;
  createdAt: string;
  note?: string;
  sectionHref: string;
  spineIndex: number;
  selector: HighlightSelector;
};

export type StoredHighlight = {
  id: string;
  documentId: string;
  color: HighlightColor;
  createdAt: string;
  note?: string;
  sectionHref: string;
  spineIndex: number;
  selector: HighlightSelector;
};