import {
  STORES,
  dbDelete,
  dbGet,
  dbPut,
  writeNormalizedDataToIndexedDb
} from "../../services/storage/index.js";
import { generateId, nowIso } from "../storeCore.js";
import { mergeSettings } from "../settingsDefaults.js";
import { makeExportPayload, persistSettings } from "../storePersistence.js";

export const dataTransferActionKeys = [
  "createBackup",
  "restoreBackup",
  "exportData",
  "importData",
  "exportTransferPackage",
  "importTransferPackage"
];

export function createDataTransferActions({ set, get }) {
  return {
    buildExportPayload: (options = {}) => makeExportPayload(get(), options),
    estimateExportSize: (options = {}) => new Blob([JSON.stringify(makeExportPayload(get(), options))]).size,
    exportData: (options = {}) => JSON.stringify(makeExportPayload(get(), options), null, options.pretty ? 2 : 0),
    createBackup: async (name = "نسخة احتياطية") => {
      const payload = makeExportPayload(get());
      const backup = {
        id: generateId("backup"),
        name,
        timestamp: nowIso(),
        size: new Blob([JSON.stringify(payload)]).size,
        itemCount: payload.videoItems.length,
        data: payload
      };
      await dbPut(STORES.BACKUPS, backup);
      const settings = mergeSettings(get().settings, { lastBackupAt: backup.timestamp });
      set({ settings });
      await persistSettings(settings);
      return backup;
    },
    restoreBackup: async (id) => {
      const backup = await dbGet(STORES.BACKUPS, id);
      if (!backup?.data) return false;
      await writeNormalizedDataToIndexedDb(backup.data);
      await get().loadAllData();
      return true;
    },
    deleteBackup: async (id) => {
      await dbDelete(STORES.BACKUPS, id);
      return true;
    },
    importData: async (data) => {
      await writeNormalizedDataToIndexedDb(data);
      await get().loadAllData();
      return true;
    },
    exportTransferPackage: () => makeExportPayload(get()),
    importTransferPackage: async (payload) => get().importData(payload)
  };
}
