export type LocalDocumentRecord = {
  id: string;
  title: string;
  author: string | null;
  cover: string | null;
  file_type: "epub";
  created_at: string;
  file: File;
};