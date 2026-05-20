export const PAGE_CONTEXT_META = {
  dashboard: { title: "لوحة التحكم", breadcrumb: "الرئيسية", hint: "بداية اليوم: إجراءات سريعة، جاهزية النظام، وآخر العناصر.", helpSection: "dashboard-archive" },
  archive: { title: "الأرشيف", breadcrumb: "الرئيسية / الأرشيف", hint: "تصفية، معاينة، تحديد متعدد، وإضافة فيديو من نفس المسار.", helpSection: "dashboard-archive" },
  add: { title: "إضافة فيديو", breadcrumb: "الأرشيف / إضافة", hint: "احفظ وارجع للأرشيف أو احفظ وأضف فيديو آخر بسرعة.", helpSection: "adding-videos" },
  detail: { title: "تفاصيل الفيديو", breadcrumb: "الأرشيف / التفاصيل", hint: "مراجعة البيانات، التشغيل، الوسوم، وسجل التغييرات.", helpSection: "adding-videos" },
  search: { title: "البحث المتقدم", breadcrumb: "الرئيسية / البحث", hint: "ابحث ثم عد للأرشيف مع حفظ الفلاتر في الرابط.", helpSection: "searching" },
  backup: { title: "مركز البيانات", breadcrumb: "الرئيسية / النسخ والنقل", hint: "تصدير، استيراد، نقل لجهاز آخر، ونسخ احتياطي بخطوات واضحة.", helpSection: "transfer-export" },
  settings: { title: "الإعدادات", breadcrumb: "الإدارة / الإعدادات", hint: "خيارات مجمعة بتبويبات مع حفظ صريح للتغييرات.", helpSection: "reports-settings" },
  help: { title: "المساعدة", breadcrumb: "الدليل / مركز المعرفة", hint: "مساعدة قابلة للبحث وروابط مباشرة للأقسام.", helpSection: "getting-started" },
  types: { title: "إدارة الأنواع", breadcrumb: "التنظيم / الأنواع", hint: "أنواع، فروع، حقول مخصصة، وأيقونات.", helpSection: "content-types" },
  collections: { title: "المجموعات", breadcrumb: "التنظيم / المجموعات", hint: "مجموعات يدوية وذكية لتنظيم الأرشيف.", helpSection: "collections" },
  vocabulary: { title: "القاموس", breadcrumb: "التنظيم / القاموس", hint: "مصطلحات موحدة تظهر في الاستدعاء الذكي.", helpSection: "vocabulary-autocomplete" },
  htags: { title: "الوسوم الهرمية", breadcrumb: "التنظيم / الوسوم", hint: "وسوم جذرية وفرعية للاستدعاء عبر #.", helpSection: "tags" },
  reports: { title: "التقارير", breadcrumb: "البيانات / التقارير", hint: "إحصاءات وسجلات نشاط تساعدك على مراجعة الأرشيف.", helpSection: "reports-settings" },
  users: { title: "المستخدمون", breadcrumb: "الإدارة / المستخدمون", hint: "أدوار وصلاحيات للاستخدام اليومي الآمن.", helpSection: "users" },
  history: { title: "سجل التغييرات", breadcrumb: "الإدارة / السجل", hint: "مراجعة عمليات الإنشاء والتعديل والحذف.", helpSection: "notifications-guide" }
};

export function getPageContextMeta(page, fallbackTitle = "أرشيف الفيديو") {
  return PAGE_CONTEXT_META[page] || {
    title: fallbackTitle,
    breadcrumb: "أرشيف الفيديو",
    hint: "انتقل بين الشاشات من هنا مع مساعدة سياقية عند الحاجة.",
    helpSection: "getting-started"
  };
}
