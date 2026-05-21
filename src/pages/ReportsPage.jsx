import { ReportsPage as LegacyReportsPage } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const ReportsPage = createLegacyPage(LegacyReportsPage, {
  id: "reports",
  title: "التقارير",
  legacyComponentName: "ReportsPage"
});

export default ReportsPage;
