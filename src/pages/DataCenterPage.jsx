import { BackupPanel } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const DataCenterPage = createLegacyPage(BackupPanel, {
  id: "backup",
  title: "مركز البيانات",
  legacyComponentName: "BackupPanel"
});

export default DataCenterPage;
