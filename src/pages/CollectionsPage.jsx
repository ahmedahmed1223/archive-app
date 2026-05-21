import { CollectionsPage as LegacyCollectionsPage } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const CollectionsPage = createLegacyPage(LegacyCollectionsPage, {
  id: "collections",
  title: "المجموعات",
  legacyComponentName: "CollectionsPage"
});

export default CollectionsPage;
