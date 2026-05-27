export const ONBOARDING_STEPS = [
  { id: "welcome", label: "البدء", detail: "فهم أين تحفظ البيانات وكيف تبدأ أول مهمة." },
  { id: "security", label: "الحماية", detail: "اختيار الإعداد الآمن أو البدء السريع." },
  { id: "admin", label: "المدير", detail: "تعريف كلمة مرور المدير عند اختيار الإعداد الآمن." },
  { id: "appearance", label: "المظهر", detail: "اختيار Ink Slate أو Warm Off-white ولون التفاعل." },
  { id: "interface", label: "الواجهة", detail: "شرح الشريط الجانبي، شريط السياق، لوحة التحكم، ومركز البيانات." },
  { id: "shortcuts", label: "الاختصارات", detail: "أهم اختصارات لوحة المفاتيح لتسريع العمل اليومي." },
  { id: "data", label: "البيانات", detail: "كيف تحفظ نسخة احتياطية، تستورد، أو تنقل لجهاز آخر." }
];

// Power-user keyboard shortcuts surfaced during onboarding so first-time
// users discover them without having to dig into the Help page.
export const ONBOARDING_SHORTCUTS = [
  { keys: ["Ctrl", "K"], label: "لوحة الأوامر", detail: "بحث سريع في كل الإجراءات والصفحات." },
  { keys: ["A"], label: "إضافة فيديو سريع", detail: "افتح نافذة الإضافة المنبثقة من أي صفحة." },
  { keys: ["/"], label: "تركيز البحث", detail: "اقفز إلى حقل البحث في الأرشيف." },
  { keys: ["?"], label: "قائمة الاختصارات", detail: "افتح قائمة كل الاختصارات الكاملة." }
];

// Data-center capabilities introduced during onboarding so users know
// where backup, import, and transfer flows live before they need them.
export const ONBOARDING_DATA_TOPICS = [
  { id: "backup", label: "النسخ الاحتياطي", detail: "صدّر كل أرشيفك كملف JSON يمكن استعادته لاحقاً." },
  { id: "import", label: "الاستيراد", detail: "ادمج نسخة سابقة أو استورد من ملف Excel." },
  { id: "transfer", label: "النقل بين الأجهزة", detail: "أنشئ ملف نقل مع checksum لاستعادته على جهاز آخر." },
  { id: "audit", label: "سجل العمليات", detail: "تتبع من غيّر ماذا ومتى لكل عملية على الأرشيف." }
];

export const ONBOARDING_THEME_OPTIONS = [
  { id: "dark", label: "ليلي حبري", detail: "Ink Slate مريح للفهرسة الطويلة." },
  { id: "light", label: "نهاري دافئ", detail: "Warm Off-white لتقليل إجهاد العين." },
  { id: "system", label: "حسب النظام", detail: "يتبع إعداد المتصفح تلقائيًا." }
];

export const ONBOARDING_ACCENT_OPTIONS = [
  { id: "teal", label: "فيروزي هادئ", color: "#14b8a6" },
  { id: "indigo", label: "نيلي هادئ", color: "#6366f1" }
];

export const CORE_UI_TOUR_ITEMS = [
  { label: "الشريط الجانبي", detail: "مرتكز يمينًا للوصول السريع إلى الشاشات الأساسية." },
  { label: "شريط السياق", detail: "يعرض عنوان الصفحة، مسارها، الإجراء الأساسي، والمساعدة." },
  { label: "لوحة التحكم", detail: "بداية يومية للجاهزية، الإضافة، البحث، والنقل." },
  { label: "مركز البيانات", detail: "تصدير، استيراد، وملف نقل لجهاز آخر." }
];
