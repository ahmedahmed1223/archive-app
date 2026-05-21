import { DataCenterTabs } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const DataTabs = createLegacyComponent(DataCenterTabs, {
  id: "data-tabs",
  legacyComponentName: "DataCenterTabs"
});

export default DataTabs;
