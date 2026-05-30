import { localStorageProvider } from "./adapters/local-indexeddb/index.js";
import { isStorageProvider } from "./ports/StorageProvider.js";

let activeProvider = localStorageProvider;

/** Returns the active StorageProvider (defaults to the local IndexedDB adapter). */
export function getStorageProvider() {
  return activeProvider;
}

/** Swap the active provider (cloud target / tests). Throws if shape is invalid. */
export function registerStorageProvider(provider) {
  if (!isStorageProvider(provider)) {
    throw new Error("Provided object does not satisfy the StorageProvider port.");
  }
  activeProvider = provider;
  return activeProvider;
}
