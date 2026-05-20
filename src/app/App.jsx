import {
  App as LegacyRuntimeApp,
  mountVideoArchive as mountLegacyVideoArchive
} from "../runtime/legacyAdapter.js";

/*
 * App shell migration entrypoint.
 *
 * The legacy runtime still owns the rendered shell because it contains a bundled
 * React/ReactDOM copy from the original single-file extraction. Keeping the
 * mount delegated here avoids duplicate-React hook failures while the shell,
 * stores, and services are moved into first-class modules.
 */
export const App = LegacyRuntimeApp;
export const mountVideoArchive = mountLegacyVideoArchive;

export { PAGE_COMPONENTS, PAGE_GROUPS, HEAVY_PAGE_IDS } from "./pageRegistry.js";
export { PAGE_MANIFEST } from "./pageManifest.js";
export { PAGE_CONTEXT_META, getPageContextMeta } from "./pageMeta.js";

export default App;
