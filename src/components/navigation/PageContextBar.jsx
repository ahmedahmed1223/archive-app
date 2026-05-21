import { AppPageContextBar } from "../legacyComponentAdapter.js";
import { createLegacyComponent } from "../legacyComponentFactory.js";

export const PageContextBar = createLegacyComponent(AppPageContextBar, {
  id: "page-context-bar",
  legacyComponentName: "AppPageContextBar"
});

export default PageContextBar;
