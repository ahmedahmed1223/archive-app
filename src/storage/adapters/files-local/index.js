import { getStorageProvider } from "../../index.js";
import { STORES } from "../../../services/storage/schema.js";

// Thumbnails/small blobs live in the existing SETTINGS store under a prefix,
// keyed by `file:<key>`. Returns object URLs for display. (Large-file support
// and remote adapters arrive in later phases.)
const PREFIX = "file:";

export const localFileStore = {
  async putBlob(key, blob) {
    const provider = getStorageProvider();
    await provider.put(STORES.SETTINGS, { key: PREFIX + key, blob, updatedAt: new Date().toISOString() });
    return { key, url: typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(blob) : "" };
  },
  async getUrl(key) {
    const provider = getStorageProvider();
    const row = await provider.get(STORES.SETTINGS, PREFIX + key);
    if (!row || !row.blob) return null;
    return typeof URL !== "undefined" && URL.createObjectURL ? URL.createObjectURL(row.blob) : null;
  },
  async remove(key) {
    const provider = getStorageProvider();
    await provider.delete(STORES.SETTINGS, PREFIX + key);
  },
  async list() {
    const provider = getStorageProvider();
    const rows = await provider.getAll(STORES.SETTINGS);
    return rows.filter((row) => String(row.key || "").startsWith(PREFIX)).map((row) => row.key.slice(PREFIX.length));
  }
};
