/**
 * StorageProvider port — the storage-agnostic contract the app's data layer
 * depends on. The local IndexedDB implementation and (later) the cloud
 * PocketBase implementation both satisfy this shape, so feature code never
 * names a concrete backend.
 *
 * Methods (all async, mirror the existing src/services/storage surface):
 *  open()                       -> Promise<void>     ensure backend ready
 *  get(store, key)              -> Promise<record|undefined>
 *  getAll(store)                -> Promise<record[]>
 *  put(store, record)           -> Promise<record>   upsert
 *  add(store, record)           -> Promise<record>   insert
 *  delete(store, key)           -> Promise<void>
 *  clear(store)                 -> Promise<void>
 *  putBatch(store, records[])   -> Promise<void>
 *  deleteBatch(store, keys[])   -> Promise<void>
 */
export const STORAGE_PROVIDER_METHODS = [
  "open", "get", "getAll", "put", "add", "delete", "clear", "putBatch", "deleteBatch"
];

export function isStorageProvider(candidate) {
  return Boolean(candidate) && STORAGE_PROVIDER_METHODS.every((method) => typeof candidate[method] === "function");
}
