export {
  dbDeleteBatch,
  dbPutBatch,
  getIndexedDbDataSnapshot,
  persistEntityAcrossStores,
  rebuildSQLiteFromNormalizedData,
  sqliteDb,
  withStoreOperation,
  writeNormalizedDataToIndexedDb,
  writeStorageManifest
} from "../../runtime/legacyAdapter.js";
export { DB_NAME, DB_VERSION, STORES } from "./schema.js";
