import { localStorageProvider } from "./adapters/local-indexeddb/index.js";
import { localFileStore } from "./adapters/files-local/index.js";
import { localAuthProvider } from "./adapters/local-auth/index.js";
import { localSyncProvider } from "./adapters/local-sync/index.js";
import { localAiStubProvider } from "./adapters/ai-local-stub/index.js";
import { isStorageProvider } from "./ports/StorageProvider.js";
import { isFileStore } from "./ports/FileStore.js";
import { isAuthProvider } from "./ports/AuthProvider.js";
import { isSyncProvider } from "./ports/SyncProvider.js";
import { isAiProvider } from "./ports/AiProvider.js";

/**
 * Unified provider registry — the single seam where a build target swaps the
 * offline-local adapters for cloud ones. Feature code calls the getters and
 * never names a concrete backend; the cloud bootstrap calls the matching
 * `register*` once at startup. Defaults are the local (offline SPA) adapters,
 * so importing this module yields today's behavior with no wiring required.
 */

let activeStorageProvider = localStorageProvider;
let activeFileStore = localFileStore;
let activeAuthProvider = localAuthProvider;
let activeSyncProvider = localSyncProvider;
let activeAiProvider = localAiStubProvider;

/** Build a get/register pair for one port, guarded by its shape validator. */
function makeRegistry(label, validate, getActive, setActive) {
  return {
    get: getActive,
    register(provider) {
      if (!validate(provider)) {
        throw new Error(`Provided object does not satisfy the ${label} port.`);
      }
      setActive(provider);
      return provider;
    }
  };
}

const storage = makeRegistry(
  "StorageProvider",
  isStorageProvider,
  () => activeStorageProvider,
  (p) => { activeStorageProvider = p; }
);
const files = makeRegistry(
  "FileStore",
  isFileStore,
  () => activeFileStore,
  (p) => { activeFileStore = p; }
);
const auth = makeRegistry(
  "AuthProvider",
  isAuthProvider,
  () => activeAuthProvider,
  (p) => { activeAuthProvider = p; }
);
const sync = makeRegistry(
  "SyncProvider",
  isSyncProvider,
  () => activeSyncProvider,
  (p) => { activeSyncProvider = p; }
);
const ai = makeRegistry(
  "AiProvider",
  isAiProvider,
  () => activeAiProvider,
  (p) => { activeAiProvider = p; }
);

// StorageProvider (existing API — unchanged signatures).
/** Returns the active StorageProvider (defaults to the local IndexedDB adapter). */
export const getStorageProvider = storage.get;
/** Swap the active provider (cloud target / tests). Throws if shape is invalid. */
export const registerStorageProvider = storage.register;

// FileStore.
export const getFileStore = files.get;
export const registerFileStore = files.register;

// AuthProvider.
export const getAuthProvider = auth.get;
export const registerAuthProvider = auth.register;

// SyncProvider.
export const getSyncProvider = sync.get;
export const registerSyncProvider = sync.register;

// AiProvider.
export const getAiProvider = ai.get;
export const registerAiProvider = ai.register;
