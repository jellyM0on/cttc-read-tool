import { type LocalDocumentRecord } from "../../types/documents";
import { config } from "./_config";
import { openDatabase } from "./_utils";

export async function getLocalDocuments(): Promise<LocalDocumentRecord[]> {
  const db = await openDatabase(config);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(config.STORE_NAME, "readonly");
    const store = tx.objectStore(config.STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const result = (request.result as LocalDocumentRecord[]).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      resolve(result);
    };

    request.onerror = () => reject(new Error("Failed to load local documents"));
  });
}