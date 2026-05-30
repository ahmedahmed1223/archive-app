import {
  openStorageDb,
  dbGet,
  dbGetAll,
  dbPut,
  dbAdd,
  dbDelete,
  dbClear,
  dbPutBatch,
  dbDeleteBatch
} from "../../../services/storage/index.js";

/**
 * The offline SPA data adapter: the existing IndexedDB implementation exposed
 * through the StorageProvider port shape. No behavior change — these are the
 * same functions the app already uses.
 */
export const localStorageProvider = {
  open: openStorageDb,
  get: dbGet,
  getAll: dbGetAll,
  put: dbPut,
  add: dbAdd,
  delete: dbDelete,
  clear: dbClear,
  putBatch: dbPutBatch,
  deleteBatch: dbDeleteBatch
};
