import { HistoryPanel } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const HistoryPage = createLegacyPage(HistoryPanel, {
  id: "history",
  title: "سجل التغييرات",
  legacyComponentName: "HistoryPanel"
});

export default HistoryPage;
