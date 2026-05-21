import { VideoDetail } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const DetailPage = createLegacyPage(VideoDetail, {
  id: "detail",
  title: "تفاصيل الفيديو",
  legacyComponentName: "VideoDetail"
});

export default DetailPage;
