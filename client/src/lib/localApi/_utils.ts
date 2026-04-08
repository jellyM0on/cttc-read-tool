import type { LocalConfig } from "./_config";

export function openDatabase(config: LocalConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.DB_NAME, config.DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open IndexedDB"));

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(config.DOC_STORE_NAME)) {
        db.createObjectStore(config.DOC_STORE_NAME, { keyPath: "id" });
      }

      let highlightsStore: IDBObjectStore;

      if (!db.objectStoreNames.contains(config.HIGHLIGHTS_STORE_NAME)) {
        highlightsStore = db.createObjectStore(config.HIGHLIGHTS_STORE_NAME, {
          keyPath: "id",
        });
      } else {
        const transaction = request.transaction;
        if (!transaction) return;
        highlightsStore = transaction.objectStore(config.HIGHLIGHTS_STORE_NAME);
      }

      if (!highlightsStore.indexNames.contains("documentId")) {
        highlightsStore.createIndex("documentId", "documentId", {
          unique: false,
        });
      }

      if (!highlightsStore.indexNames.contains("documentId_createdAt")) {
        highlightsStore.createIndex(
          "documentId_createdAt",
          ["documentId", "createdAt"],
          { unique: false }
        );
      }
    };
  });
}