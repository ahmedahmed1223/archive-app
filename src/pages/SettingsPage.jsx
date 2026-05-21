import { SettingsPanel } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const SettingsPage = createLegacyPage(SettingsPanel, {
  id: "settings",
  title: "الإعدادات",
  legacyComponentName: "SettingsPanel"
});

export default SettingsPage;
