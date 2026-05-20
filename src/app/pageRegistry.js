import {
  AddVideoPage,
  ArchivePage,
  CollectionsPage,
  DashboardPage,
  DataCenterPage,
  DetailPage,
  HelpPage,
  HierarchicalTagsPage,
  HistoryPage,
  ReportsPage,
  SearchPage,
  SettingsPage,
  TypesPage,
  UsersPage,
  VocabularyPage
} from "../pages/index.js";
import {
  HEAVY_PAGE_IDS,
  PAGE_GROUPS
} from "./pageManifest.js";

export const PAGE_COMPONENTS = {
  dashboard: DashboardPage,
  archive: ArchivePage,
  add: AddVideoPage,
  detail: DetailPage,
  types: TypesPage,
  search: SearchPage,
  settings: SettingsPage,
  backup: DataCenterPage,
  history: HistoryPage,
  collections: CollectionsPage,
  vocabulary: VocabularyPage,
  htags: HierarchicalTagsPage,
  reports: ReportsPage,
  users: UsersPage,
  help: HelpPage
};

export { HEAVY_PAGE_IDS, PAGE_GROUPS };
