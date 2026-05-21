import { HelpPage as LegacyHelpPage } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const HelpPage = createLegacyPage(LegacyHelpPage, {
  id: "help",
  title: "المساعدة",
  legacyComponentName: "HelpPage"
});

export default HelpPage;
