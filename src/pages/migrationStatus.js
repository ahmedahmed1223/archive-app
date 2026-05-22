import { PAGE_MANIFEST } from "../app/pageManifest.js";

export const LEGACY_PAGE_MIGRATION = {
  dashboard: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/DashboardPage.jsx; it still uses legacy React bridge until shared UI primitives are native." },
  archive: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/ArchivePage.jsx with native grid/list/table modes; file import wizard is exposed through a feature adapter while scanner internals remain legacy." },
  add: { legacyComponentName: "VideoForm", status: "legacy-wrapper" },
  detail: { legacyComponentName: "VideoDetail", status: "legacy-wrapper" },
  types: { legacyComponentName: "TypeManager", status: "legacy-wrapper" },
  search: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/SearchPage.jsx with route-backed filters and direct links back to Archive." },
  settings: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/SettingsPage.jsx with native tabs, direct save controls, onboarding replay, and shortcut conflict handling." },
  backup: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/DataCenterPage.jsx; data operations still use legacy store actions and extracted portability services." },
  history: { legacyComponentName: "HistoryPanel", status: "legacy-wrapper" },
  collections: { legacyComponentName: "CollectionsPage", status: "legacy-wrapper" },
  vocabulary: { legacyComponentName: "VocabularyPage", status: "legacy-wrapper" },
  htags: { legacyComponentName: "HierarchicalTagsPage", status: "legacy-wrapper" },
  reports: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/ReportsPage.jsx; export helpers still use legacy SheetJS bridge." },
  users: { legacyComponentName: "UsersPage", status: "legacy-wrapper" },
  help: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/HelpPage.jsx; it still uses legacy React bridge until shared UI primitives are native." }
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
