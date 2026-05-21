import { HierarchicalTagsPage as LegacyHierarchicalTagsPage } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const HierarchicalTagsPage = createLegacyPage(LegacyHierarchicalTagsPage, {
  id: "htags",
  title: "الوسوم الهرمية",
  legacyComponentName: "HierarchicalTagsPage"
});

export default HierarchicalTagsPage;
