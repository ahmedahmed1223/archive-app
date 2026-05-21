import { VideoForm } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const AddVideoPage = createLegacyPage(VideoForm, {
  id: "add",
  title: "إضافة فيديو",
  legacyComponentName: "VideoForm"
});

export default AddVideoPage;
