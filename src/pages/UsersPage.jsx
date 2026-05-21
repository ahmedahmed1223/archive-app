import { UsersPage as LegacyUsersPage } from "./legacyPageAdapter.js";
import { createLegacyPage } from "./legacyPageFactory.js";

export const UsersPage = createLegacyPage(LegacyUsersPage, {
  id: "users",
  title: "المستخدمون",
  legacyComponentName: "UsersPage"
});

export default UsersPage;
