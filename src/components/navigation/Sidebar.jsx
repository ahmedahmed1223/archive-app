import { AppSidebar } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const Sidebar = createLegacyComponent(AppSidebar, {
  id: "sidebar",
  legacyComponentName: "AppSidebar"
});

export default Sidebar;
