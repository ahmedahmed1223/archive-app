import { TypeManager } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const TypesPage = createLegacyPage(TypeManager, {
  id: "types",
  title: "إدارة الأنواع",
  legacyComponentName: "TypeManager"
});

export default TypesPage;
