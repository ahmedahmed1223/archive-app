export const SETTINGS_TABS = [
  { id: "general", label: "عام" },
  { id: "interface", label: "الواجهة" },
  { id: "icons", label: "الأيقونات والأغلفة" },
  { id: "smart", label: "الاستدعاء الذكي" },
  { id: "data", label: "النسخ والبيانات" },
  { id: "security", label: "الأمان" },
  { id: "shortcuts", label: "الاختصارات" },
  { id: "maintenance", label: "الصيانة والربط" }
];

export const SETTINGS_TAB_IDS = SETTINGS_TABS.map((tab) => tab.id);

export const SETTINGS_TAB_LABELS = Object.fromEntries(
  SETTINGS_TABS.map((tab) => [tab.id, tab.label])
);
