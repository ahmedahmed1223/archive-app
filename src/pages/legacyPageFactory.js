import { legacyJsxRuntime } from "../runtime/legacyAdapter.js";

const { jsx } = legacyJsxRuntime;

export function createLegacyPage(LegacyComponent, metadata = {}) {
  function LegacyPageWrapper(props) {
    return jsx(LegacyComponent, props);
  }

  LegacyPageWrapper.displayName = metadata.displayName || metadata.name || metadata.id || "LegacyPageWrapper";
  LegacyPageWrapper.pageId = metadata.id || null;
  LegacyPageWrapper.pageTitle = metadata.title || "";
  LegacyPageWrapper.legacyComponentName = metadata.legacyComponentName || LegacyComponent?.displayName || LegacyComponent?.name || "LegacyComponent";
  LegacyPageWrapper.migrationStatus = "legacy-wrapper";
  LegacyPageWrapper.migrationNotes = metadata.notes || "Wrapped at the page boundary; JSX still lives in the legacy runtime.";

  return LegacyPageWrapper;
}

export function getLegacyPageMetadata(PageComponent) {
  return {
    id: PageComponent?.pageId || null,
    title: PageComponent?.pageTitle || "",
    legacyComponentName: PageComponent?.legacyComponentName || "",
    migrationStatus: PageComponent?.migrationStatus || "unknown",
    migrationNotes: PageComponent?.migrationNotes || ""
  };
}
