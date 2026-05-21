import { Dashboard } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const DashboardPage = createLegacyPage(Dashboard, {
  id: "dashboard",
  title: "لوحة التحكم",
  legacyComponentName: "Dashboard"
});

export default DashboardPage;
