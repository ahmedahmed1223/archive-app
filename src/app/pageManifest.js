export const PAGE_MANIFEST = [
  { id: "dashboard", group: "daily", heavy: false, meta: { title: "لوحة التحكم", breadcrumb: "الرئيسية", hint: "بداية اليوم: إجراءات سريعة، جاهزية النظام، وآخر العناصر.", helpSection: "dashboard-archive" } },
  { id: "archive", group: "daily", heavy: false, meta: { title: "الأرشيف", breadcrumb: "الرئيسية / الأرشيف", hint: "تصفية، معاينة، تحديد متعدد، وإضافة فيديو من نفس المسار.", helpSection: "dashboard-archive" } },
  { id: "add", group: "daily", heavy: false, meta: { title: "إضافة فيديو", breadcrumb: "الأرشيف / إضافة", hint: "احفظ وارجع للأرشيف أو احفظ وأضف فيديو آخر بسرعة.", helpSection: "adding-videos" } },
  { id: "search", group: "daily", heavy: false, meta: { title: "البحث المتقدم", breadcrumb: "الرئيسية / البحث", hint: "ابحث ثم عد للأرشيف مع حفظ الفلاتر في الرابط.", helpSection: "searching" } },
  { id: "detail", group: "daily", heavy: false, meta: { title: "تفاصيل الفيديو", breadcrumb: "الأرشيف / التفاصيل", hint: "مراجعة البيانات، التشغيل، الوسوم، وسجل التغييرات.", helpSection: "adding-videos" } },
  { id: "collections", group: "organization", heavy: false, meta: { title: "المجموعات", breadcrumb: "التنظيم / المجموعات", hint: "مجموعات يدوية وذكية لتنظيم الأرشيف.", helpSection: "collections" } },
  { id: "types", group: "organization", heavy: false, meta: { title: "إدارة الأنواع", breadcrumb: "التنظيم / الأنواع", hint: "أنواع، فروع، حقول مخصصة، وأيقونات.", helpSection: "content-types" } },
  { id: "vocabulary", group: "organization", heavy: false, meta: { title: "القاموس", breadcrumb: "التنظيم / القاموس", hint: "مصطلحات موحدة تظهر في الاستدعاء الذكي.", helpSection: "vocabulary-autocomplete" } },
  { id: "htags", group: "organization", heavy: false, meta: { title: "الوسوم الهرمية", breadcrumb: "التنظيم / الوسوم", hint: "وسوم جذرية وفرعية للاستدعاء عبر #.", helpSection: "tags" } },
  { id: "graph", group: "organization", heavy: true, meta: { title: "خريطة العلاقات", breadcrumb: "التنظيم / خريطة العلاقات", hint: "شبكة تربط المواد بالوسوم المشتركة والنوع لاكتشاف الصلات.", helpSection: "collections" } },
  { id: "users", group: "administration", heavy: false, meta: { title: "المستخدمون", breadcrumb: "الإدارة / المستخدمون", hint: "أدوار وصلاحيات للاستخدام اليومي الآمن.", helpSection: "users" } },
  { id: "settings", group: "administration", heavy: true, meta: { title: "الإعدادات", breadcrumb: "الإدارة / الإعدادات", hint: "خيارات مجمعة بتبويبات مع حفظ صريح للتغييرات.", helpSection: "reports-settings" } },
  { id: "history", group: "administration", heavy: false, meta: { title: "سجل التغييرات", breadcrumb: "الإدارة / السجل", hint: "مراجعة عمليات الإنشاء والتعديل والحذف.", helpSection: "notifications-guide" } },
  { id: "help", group: "administration", heavy: true, meta: { title: "المساعدة", breadcrumb: "الدليل / مركز المعرفة", hint: "مساعدة قابلة للبحث وروابط مباشرة للأقسام.", helpSection: "getting-started" } },
  { id: "backup", group: "data", heavy: true, meta: { title: "مركز البيانات", breadcrumb: "الرئيسية / النسخ والنقل", hint: "تصدير، استيراد، نقل لجهاز آخر، ونسخ احتياطي بخطوات واضحة.", helpSection: "transfer-export" } },
  { id: "reports", group: "data", heavy: true, meta: { title: "التقارير", breadcrumb: "البيانات / التقارير", hint: "إحصاءات وسجلات نشاط تساعدك على مراجعة الأرشيف.", helpSection: "reports-settings" } },
  { id: "sync-log", group: "data", heavy: true, meta: { title: "سجل المزامنة", breadcrumb: "البيانات / المزامنة", hint: "كل عمليات تصدير ودمج حزم النقل بين الأجهزة مع تفاصيل الـ checksum.", helpSection: "transfer-export" } }
];

export const PAGE_CONTEXT_META = Object.fromEntries(
  PAGE_MANIFEST.map((page) => [page.id, page.meta])
);

export const PAGE_GROUPS = PAGE_MANIFEST.reduce((groups, page) => {
  groups[page.group] = groups[page.group] || [];
  groups[page.group].push(page.id);
  return groups;
}, {});

export const HEAVY_PAGE_IDS = PAGE_MANIFEST.filter((page) => page.heavy).map((page) => page.id);
