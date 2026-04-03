import type { LocalConfig } from "./_config";

export function openDatabase(config: LocalConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(config.DB_NAME, config.DB_VERSION);

    request.onerror = () => reject(new Error("Failed to open IndexedDB"));

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(config.STORE_NAME)) {
        const store = db.createObjectStore(config.STORE_NAME, { keyPath: "id" });
        store.createIndex("created_at", "created_at", { unique: false });
      }
    };
  });
}