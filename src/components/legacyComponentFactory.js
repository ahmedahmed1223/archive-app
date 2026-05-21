import { legacyJsxRuntime } from "../runtime/legacyAdapter.js";

const { jsx } = legacyJsxRuntime;

export function createLegacyComponent(LegacyComponent, metadata = {}) {
  function LegacyComponentWrapper(props) {
    return jsx(LegacyComponent, props);
  }

  LegacyComponentWrapper.displayName = metadata.displayName || metadata.name || metadata.id || "LegacyComponentWrapper";
  LegacyComponentWrapper.componentId = metadata.id || null;
  LegacyComponentWrapper.legacyComponentName = metadata.legacyComponentName || LegacyComponent?.displayName || LegacyComponent?.name || "LegacyComponent";
  LegacyComponentWrapper.migrationStatus = "legacy-wrapper";

  return LegacyComponentWrapper;
}
