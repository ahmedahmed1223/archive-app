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

export const PAGE_GROUPS = {
  daily: ["dashboard", "archive", "add", "search"],
  organization: ["collections", "types", "vocabulary", "htags"],
  administration: ["users", "settings", "history", "help"],
  data: ["backup", "reports"]
};

export const HEAVY_PAGE_IDS = ["settings", "backup", "reports", "help"];
