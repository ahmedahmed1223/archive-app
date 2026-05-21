import { VocabularyPage as LegacyVocabularyPage } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const VocabularyPage = createLegacyPage(LegacyVocabularyPage, {
  id: "vocabulary",
  title: "القاموس",
  legacyComponentName: "VocabularyPage"
});

export default VocabularyPage;
