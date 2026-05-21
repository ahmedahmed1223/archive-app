import { PAGE_MANIFEST } from "../app/pageManifest.js";

export const LEGACY_PAGE_MIGRATION = {
  dashboard: { legacyComponentName: "", status: "native", notes: "Page JSX lives in src/pages/DashboardPage.jsx; it still uses legacy React bridge until shared UI primitives are native." },
  archive: { legacyComponentName: "VideoGrid", status: "legacy-wrapper" },
  add: { legacyComponentName: "VideoForm", status: "legacy-wrapper" },
  detail: { legacyComponentName: "VideoDetail", status: "legacy-wrapper" },
  types: { legacyComponentName: "TypeManager", status: "legacy-wrapper" },
  search: { legacyComponentName: "SearchPanel", status: "legacy-wrapper" },
  settings: { legacyComponentName: "SettingsPanel", status: "legacy-wrapper" },
  backup: { legacyComponentName: "BackupPanel", status: "legacy-wrapper" },
  history: { legacyComponentName: "HistoryPanel", status: "legacy-wrapper" },
  collections: { legacyComponentName: "CollectionsPage", status: "legacy-wrapper" },
  vocabulary: { legacyComponentName: "VocabularyPage", status: "legacy-wrapper" },
  htags: { legacyComponentName: "HierarchicalTagsPage", status: "legacy-wrapper" },
  reports: { legacyComponentName: "ReportsPage", status: "legacy-wrapper" },
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
