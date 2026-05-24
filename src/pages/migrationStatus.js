import { PAGE_MANIFEST } from "../app/pageManifest.js";

export const LEGACY_PAGE_MIGRATION = {
  dashboard: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/DashboardPage.jsx; shared UI wrappers have been removed and only runtime bridge primitives remain." },
  archive: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/ArchivePage.jsx with native grid/list/table modes; file import wizard is exposed through a feature adapter while scanner internals remain legacy." },
  add: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/AddVideoPage.jsx with a native multi-step form and localFile metadata support." },
  detail: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/DetailPage.jsx with native preview, editing, custom fields, and history summary." },
  types: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/TypesPage.jsx with native type, subtype, and custom-field management including localFile." },
  search: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/SearchPage.jsx with route-backed filters and direct links back to Archive." },
  settings: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/SettingsPage.jsx with native tabs, direct save controls, onboarding replay, and shortcut conflict handling." },
  backup: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/DataCenterPage.jsx; data operations still use legacy store actions and extracted portability services." },
  history: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/HistoryPage.jsx with route-backed search, action filters, and pagination." },
  collections: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/CollectionsPage.jsx with native cards, detail preview, and manual item management." },
  vocabulary: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/VocabularyPage.jsx; vocabulary filtering and @ autocomplete data are now driven by src/features/vocabulary." },
  htags: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/HierarchicalTagsPage.jsx; tree helpers and # autocomplete paths are now driven by src/features/hierarchical-tags." },
  reports: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/ReportsPage.jsx; export helpers still use legacy SheetJS bridge." },
  users: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/UsersPage.jsx with native role filtering, account status controls, and protected admin handling." },
  help: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/HelpPage.jsx; shared UI wrappers have been removed and only runtime bridge primitives remain." }
};

export function getPageMigrationStatus() {
  return PAGE_MANIFEST.map((page) => {
    const metadata = LEGACY_PAGE_MIGRATION[page.id] || {};
    return {
      id: page.id,
      title: page.meta?.title || "",
      group: page.group,
      heavy: !!page.heavy,
      status: metadata.status || "unknown",
      legacyComponentName: metadata.legacyComponentName,
      notes: metadata.notes || "Wrapped at the page boundary; JSX still lives in the legacy runtime."
    };
  });
}

export function getPageMigrationSummary(statusRows = getPageMigrationStatus()) {
  const total = statusRows.length;
  const legacyWrapped = statusRows.filter((page) => page.status === "legacy-wrapper").length;
  const native = statusRows.filter((page) => page.status === "native").length;
  const heavyLegacy = statusRows.filter((page) => page.heavy && page.status === "legacy-wrapper").length;

  return {
    total,
    native,
    legacyWrapped,
    heavyLegacy,
    percentNative: total === 0 ? 0 : Math.round(native / total * 100)
  };
}
