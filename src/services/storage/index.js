export {
  STORES,
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
