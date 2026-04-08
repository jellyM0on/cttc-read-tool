import type { LocalHighlight } from "../../../types/highlights"
import { config } from "../_config";
import { openDatabase } from "../_utils";

export type StoredHighlightRecord = LocalHighlight & {
  documentId: string;
};

export async function getHighlightsByBookId(
  documentId: string
): Promise<LocalHighlight[]> {
  const db = await openDatabase(config)

  return new Promise((resolve, reject) => {
    const tx = db.transaction(config.HIGHLIGHTS_STORE_NAME, "readonly");
    const store = tx.objectStore(config.HIGHLIGHTS_STORE_NAME);
    const index = store.index("documentId");
    const request = index.getAll(documentId);

    request.onsuccess = () => {
      const rows = (request.result as StoredHighlightRecord[]) ?? [];
      resolve(
        rows
          .sort((a, b) => {
            if (a.spineIndex !== b.spineIndex) return a.spineIndex - b.spineIndex;
            return (
              (a.selector?.startOffset ?? 0) - (b.selector?.startOffset ?? 0)
            );
          })
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ documentId: _documentId, ...highlight }) => highlight)
      );
    };

    request.onerror = () =>
      reject(request.error ?? new Error("Failed to load highlights"));
  });
}
