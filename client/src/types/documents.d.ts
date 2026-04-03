export type LocalDocumentRecord = {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  file_type: "epub";
  created_at: string;
  source: "local";
  file: File;
};

export type StoredDocument = {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  file_type: "epub";
  created_at: string;
  source: "remote" | "local";
  signed_url?: string;
  storage_path?: string;
};