import { VideoGrid } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const ArchivePage = createLegacyPage(VideoGrid, {
  id: "archive",
  title: "الأرشيف",
  legacyComponentName: "VideoGrid"
});

export default ArchivePage;
