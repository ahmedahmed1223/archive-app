import { KeyboardShortcutsDialog as LegacyKeyboardShortcutsDialog } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const KeyboardShortcutsDialog = createLegacyComponent(LegacyKeyboardShortcutsDialog, {
  id: "keyboard-shortcuts-dialog",
  legacyComponentName: "KeyboardShortcutsDialog"
});

export default KeyboardShortcutsDialog;
