import { config } from "../_config";
import { openDatabase } from "../_utils";

export async function deleteLocalDocument(id: string): Promise<void> {
  const db = await openDatabase(config);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(config.DOC_STORE_NAME, "readwrite");
    const store = tx.objectStore(config.DOC_STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    
    request.onerror = () => reject(new Error("Failed to delete local document"));
  });
}