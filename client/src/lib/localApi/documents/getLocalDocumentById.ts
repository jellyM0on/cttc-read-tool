import type { LocalDocumentRecord } from "../../../types/documents";
import { config } from "../_config";
import { openDatabase } from "../_utils";

export async function getLocalDocumentById(
  id: string
): Promise<LocalDocumentRecord | null> {
  const db = await openDatabase(config);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(config.DOC_STORE_NAME, "readonly");
    const store = tx.objectStore(config.DOC_STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as LocalDocumentRecord) ?? null);
    
    request.onerror = () => reject(new Error("Failed to load local document"));
  });
}