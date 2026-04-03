
import { type LocalDocumentRecord } from "../../types/documents";
import { extractEpubMetadata } from "../epub/extractEpubMetadata";
import { config } from "./_config";
import { openDatabase } from "./_utils";

export async function saveLocalDocument(file: File): Promise<LocalDocumentRecord> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension !== "epub") {
    throw new Error("Only EPUB files are supported right now");
  }

  const metadata = await extractEpubMetadata(file);

  const record: LocalDocumentRecord = {
    id: crypto.randomUUID(),
    title: metadata.title,
    author: metadata.author,
    cover: metadata.cover,
    file_type: "epub",
    created_at: new Date().toISOString(),
    file,
  };

  const db = await openDatabase(config);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(config.STORE_NAME, "readwrite");
    const store = tx.objectStore(config.STORE_NAME);
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(new Error("Failed to save local document"));
  });
}