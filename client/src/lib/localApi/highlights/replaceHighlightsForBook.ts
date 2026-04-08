import type { LocalHighlight } from "../../../types/highlights"
import { config } from "../_config";
import { openDatabase } from "../_utils";

export type StoredHighlightRecord = LocalHighlight & {
  documentId: string;
};

export async function replaceHighlightsForBook(
  documentId: string,
  highlights: LocalHighlight[]
): Promise<void> {
  const db = await openDatabase(config);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(config.HIGHLIGHTS_STORE_NAME, "readwrite");
    const store = tx.objectStore(config.HIGHLIGHTS_STORE_NAME);
    const index = store.index("documentId");
    const getRequest = index.getAllKeys(documentId);

    getRequest.onsuccess = () => {
      const existingKeys = (getRequest.result as IDBValidKey[]) ?? [];

      for (const key of existingKeys) {
        store.delete(key);
      }

      for (const highlight of highlights) {
        const record: StoredHighlightRecord = {
          ...highlight,
          documentId,
        };
        store.put(record);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("Failed to save highlights"));
    tx.onabort = () =>
      reject(tx.error ?? new Error("Saving highlights was aborted"));
  });
}