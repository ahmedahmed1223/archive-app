import { SearchPanel } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const SearchPage = createLegacyPage(SearchPanel, {
  id: "search",
  title: "البحث المتقدم",
  legacyComponentName: "SearchPanel"
});

export default SearchPage;
