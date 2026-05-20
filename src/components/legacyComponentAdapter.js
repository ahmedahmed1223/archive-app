/*
 * Temporary component boundary for runtime-owned shared UI.
 * New components should be implemented beside their feature and exported
 * directly; legacy re-exports stay centralized here until migrated.
 */
export {
  AppPageContextBar,
  AppSidebar,
  DataCenterTabs,
  EmptyState,
  IconPicker,
  KeyboardShortcutsDialog,
  TokenAutocompleteField,
  appAlert,
  appConfirm,
  appPrompt
} from "../runtime/legacyAdapter.js";
