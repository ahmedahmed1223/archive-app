import {
  useAppStore
} from "../stores/index.js";
import {
  PenLine,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users
} from "lucide-react";
import * as React from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "framer-motion";
import { appConfirm } from "../components/common/ConfirmDialog.js";
import { EmptyState } from "../components/common/EmptyState.jsx";
import { PageHero } from "../components/ui/V1Primitives.jsx";
import { hashPassword } from "../utils/passwordHash.js";
import {
  USER_ROLES,
  canDeactivateUser,
  createUserValue,
  getFilteredUsers,
  getUserSummary,
  normalizeUserRole
} from "../features/users/viewModel.js";
import { formatDateTime, formatNumber } from "../utils/formatting.js";


function getRole(roleId) {
  return USER_ROLES.find((role) => role.id === roleId) || USER_ROLES[USER_ROLES.length - 1];
}

function UserForm({ user, users, onCancel, onSave }) {
  const [username, setUsername] = React.useState(user?.username || "");
  const [displayName, setDisplayName] = React.useState(user?.displayName || "");
  const [role, setRole] = React.useState(normalizeUserRole(user?.role || "viewer"));
  const [password, setPassword] = React.useState("");

  const usernameExists = !user && users.some((item) => item.username.trim().toLowerCase() === username.trim().toLowerCase());
  const canSave = username.trim() && displayName.trim() && !usernameExists && (user || password.length >= 6);

  const save = () => {
    if (!canSave) return;
    onSave({ ...user, username, displayName, role, password });
  };

  return jsxs("section", {
    className: "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-right",
    dir: "rtl",
    children: [
      jsx("h2", { className: "text-base font-bold text-white", children: user ? "تعديل مستخدم" : "مستخدم جديد" }),
      jsx("p", { className: "mt-1 text-xs leading-relaxed text-gray-500", children: user ? "لا يتم تغيير كلمة المرور من هنا؛ استخدم تبويب الأمان عند الحاجة." : "سيتم إنشاء كلمة مرور أولية لهذا المستخدم دون تغيير المستخدم الحالي." }),
      jsxs("div", {
        className: "mt-4 grid gap-3 lg:grid-cols-2",
        children: [
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "اسم المستخدم" }),
            jsx("input", {
              value: username,
              onChange: (event) => setUsername(event.target.value),
              disabled: !!user,
              dir: "ltr",
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40 disabled:opacity-60",
              placeholder: "username"
            }),
            usernameExists && jsx("span", { className: "text-xs text-red-300", children: "اسم المستخدم موجود بالفعل" })
          ] }),
          jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "الاسم المعروض" }),
            jsx("input", {
              value: displayName,
              onChange: (event) => setDisplayName(event.target.value),
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40",
              placeholder: "اسم المستخدم داخل الواجهة"
            })
          ] }),
          !user && jsxs("label", { className: "space-y-1 text-sm text-gray-300", children: [
            jsx("span", { children: "كلمة المرور الأولية" }),
            jsx("input", {
              value: password,
              onChange: (event) => setPassword(event.target.value),
              type: "password",
              dir: "ltr",
              className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none focus:border-emerald-500/40",
              placeholder: "6 أحرف على الأقل"
            })
          ] }),
          jsxs("div", { className: `space-y-2 ${user ? "lg:col-span-2" : ""}`, children: [
            jsx("span", { className: "text-sm text-gray-300", children: "الدور" }),
            jsx("div", { className: "flex flex-wrap gap-2", children: USER_ROLES.map((item) => jsxs("button", {
              type: "button",
              onClick: () => setRole(item.id),
              className: `rounded-xl border px-3 py-2 text-sm transition-colors ${role === item.id ? "text-white" : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5"}`,
              style: role === item.id ? { borderColor: `${item.color}55`, backgroundColor: `${item.color}18` } : undefined,
              children: [
                jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full", style: { backgroundColor: item.color } }),
                item.label
              ]
            }, item.id)) })
          ] })
        ]
      }),
      jsxs("div", { className: "mt-4 flex flex-wrap justify-end gap-2", children: [
        jsx("button", { type: "button", onClick: onCancel, className: "rounded-xl border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5", children: "إلغاء" }),
        jsx("button", { type: "button", onClick: save, disabled: !canSave, className: "va-primary-button rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40", children: user ? "حفظ التعديل" : "إنشاء المستخدم" })
      ] })
    ]
  });
}

function UserCard({ user, currentUser, users, index, onEdit, onToggle, onDelete }) {
  const role = getRole(user.role);
  const isCurrent = currentUser?.id === user.id;
  const canToggle = canDeactivateUser(user, users) && !isCurrent;
  return jsxs(motion.article, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.18, delay: Math.min(index, 10) * 0.025 },
    className: "va-entity-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right transition-colors hover:border-emerald-500/25",
    dir: "rtl",
    children: [
      jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
          jsx("span", { className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", style: { backgroundColor: `${role.color}22`, color: role.color }, children: user.role === "admin" ? jsx(ShieldCheck, { className: "h-5 w-5" }) : jsx(Users, { className: "h-5 w-5" }) }),
          jsxs("div", { className: "min-w-0", children: [
            jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              jsx("h3", { className: "truncate text-base font-bold text-white", children: user.displayName || user.username }),
              jsx("span", { className: "rounded-full border px-2 py-0.5 text-xs", style: { borderColor: `${role.color}55`, backgroundColor: `${role.color}18`, color: role.color }, children: role.label }),
              !user.isActive && jsx("span", { className: "rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-200", children: "معطل" }),
              isCurrent && jsx("span", { className: "rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-200", children: "الحالي" })
            ] }),
            jsx("p", { className: "mt-1 truncate text-sm text-gray-500", dir: "ltr", children: `@${user.username}` }),
            user.lastLoginAt && jsx("p", { className: "mt-2 text-xs text-gray-600", children: `آخر دخول: ${formatDateTime(user.lastLoginAt)}` })
          ] })
        ] }),
        jsxs("div", { className: "flex shrink-0 gap-1", children: [
          jsx("button", { type: "button", onClick: onToggle, disabled: !canToggle, className: "rounded-lg px-3 py-2 text-xs text-gray-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40", children: user.isActive ? "تعطيل" : "تفعيل" }),
          jsx("button", { type: "button", onClick: onEdit, className: "rounded-lg p-2 text-gray-500 hover:bg-white/5 hover:text-white", "aria-label": `تعديل ${user.displayName || user.username || "المستخدم"}`, children: jsx(PenLine, { className: "h-4 w-4" }) }),
          jsx("button", { type: "button", onClick: onDelete, disabled: !canToggle, className: "rounded-lg p-2 text-gray-500 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40", "aria-label": `حذف ${user.displayName || user.username || "المستخدم"}`, children: jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }),
      jsx("p", { className: "mt-4 text-xs leading-relaxed text-gray-600", children: role.description })
    ]
  }, user.id);
}

export function UsersPage() {
  const {
    users = [],
    currentUser,
    settings = {},
    addUser,
    updateUser,
    deleteUser,
    showToast
  } = useAppStore();

  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [showForm, setShowForm] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState(null);

  const summary = React.useMemo(() => getUserSummary(users), [users]);
  const filteredUsers = React.useMemo(() => getFilteredUsers(users, query, roleFilter), [query, roleFilter, users]);

  const saveUser = async (draft) => {
    try {
      if (editingUser) {
        await updateUser?.(createUserValue({
          ...editingUser,
          displayName: draft.displayName,
          role: draft.role,
          createdAt: editingUser.createdAt
        }));
        showToast?.("تم تحديث المستخدم", "success");
      } else {
        const passwordHash = hashPassword(draft.password);
        await addUser?.(createUserValue({
          username: draft.username,
          displayName: draft.displayName,
          passwordHash,
          role: draft.role,
          isActive: true,
          mustChangePassword: true
        }));
        showToast?.("تم إنشاء المستخدم", "success");
      }
      setShowForm(false);
      setEditingUser(null);
    } catch (error) {
      showToast?.("تعذر حفظ المستخدم", "error");
    }
  };

  const toggleUser = async (user) => {
    if (!canDeactivateUser(user, users) || currentUser?.id === user.id) {
      showToast?.("لا يمكن تعطيل المستخدم الحالي أو آخر مدير نشط", "error");
      return;
    }
    await updateUser?.({ ...user, isActive: !user.isActive, updatedAt: new Date().toISOString() });
  };

  const disableUser = async (user) => {
    if (!canDeactivateUser(user, users) || currentUser?.id === user.id) return;
    const confirmed = await appConfirm(`هل تريد تعطيل المستخدم "${user.displayName || user.username}"؟`, {
      title: "تعطيل مستخدم",
      kind: "warning",
      confirmLabel: "تعطيل"
    });
    if (!confirmed) return;
    await deleteUser?.(user.id);
  };

  return jsxs(motion.div, {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.2 },
    className: "va-page-shell space-y-6 p-4 sm:p-6",
    dir: "rtl",
    children: [
      jsx(PageHero, {
        icon: jsx(Users, { className: "h-6 w-6 text-emerald-400" }),
        title: "المستخدمون",
        description: "إدارة الحسابات والأدوار مع حماية آخر مدير نشط ومنع تغيير كلمات المرور من صفحة المستخدمين.",
        actions: jsxs("button", { type: "button", onClick: () => { setEditingUser(null); setShowForm(true); }, className: "va-primary-button inline-flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white", children: [jsx(Plus, { className: "h-4 w-4" }), "مستخدم جديد"] })
      }),
      showForm && jsx(UserForm, { user: editingUser, users, onCancel: () => { setShowForm(false); setEditingUser(null); }, onSave: saveUser }),
      jsx("section", { className: "grid gap-3 sm:grid-cols-4", children: [
        ["كل المستخدمين", summary.total, Users],
        ["نشط", summary.active, ShieldCheck],
        ["معطل", summary.inactive, Trash2],
        ["مدير نشط", summary.activeAdmins, Shield]
      ].map(([label, value, Icon]) => jsxs("div", { className: "va-metric-card rounded-2xl border border-white/10 bg-gray-900/45 p-4 text-right", children: [
        jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          jsx("span", { className: "text-sm text-gray-500", children: label }),
          jsx(Icon, { className: "h-5 w-5 text-emerald-400" })
        ] }),
        jsx("p", { className: "mt-2 text-2xl font-bold text-white", children: formatNumber(value, settings.numberSystem) })
      ] }, label)) }),
      jsxs("section", { className: "va-filter-surface rounded-2xl border border-white/10 bg-gray-900/45 p-4", children: [
        jsxs("div", { className: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]", children: [
          jsxs("label", { className: "relative block", children: [
            jsx(Search, { className: "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" }),
            jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "بحث بالاسم أو اسم المستخدم...", className: "min-h-11 w-full rounded-xl border border-white/10 bg-gray-950/45 py-2 pl-3 pr-10 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-emerald-500/40" })
          ] }),
          jsx("select", { value: roleFilter, onChange: (event) => setRoleFilter(event.target.value), className: "min-h-11 rounded-xl border border-white/10 bg-gray-950/45 px-3 text-sm text-white outline-none", children: [
            jsx("option", { value: "all", children: "كل الأدوار" }),
            ...USER_ROLES.map((role) => jsx("option", { value: role.id, children: role.label }, role.id))
          ] })
        ] }),
        jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: USER_ROLES.map((role) => jsxs("button", { type: "button", onClick: () => setRoleFilter(role.id), className: `rounded-xl border px-3 py-2 text-sm ${roleFilter === role.id ? "text-white" : "border-white/10 bg-gray-950/35 text-gray-400 hover:bg-white/5"}`, style: roleFilter === role.id ? { borderColor: `${role.color}55`, backgroundColor: `${role.color}18` } : undefined, children: [
          jsx("span", { className: "inline-block h-2.5 w-2.5 rounded-full", style: { backgroundColor: role.color } }),
          role.label,
          jsx("span", { className: "rounded-full bg-black/20 px-2 py-0.5 text-xs", children: formatNumber(summary.byRole[role.id] || 0) })
        ] }, role.id)) })
      ] }),
      filteredUsers.length ? jsx("section", { className: "grid gap-3 lg:grid-cols-2", children: filteredUsers.map((user, index) => jsx(UserCard, {
        user,
        users,
        currentUser,
        index,
        onEdit: () => { setEditingUser(user); setShowForm(true); },
        onToggle: () => toggleUser(user),
        onDelete: () => disableUser(user)
      }, user.id)) }) : jsx("section", { className: "rounded-2xl border border-dashed border-white/10 bg-gray-900/35", children: jsx(EmptyState, {
        icon: jsx(Users, { className: "h-16 w-16" }),
        title: users.length ? "لا توجد نتائج مطابقة" : "لا يوجد مستخدمون بعد",
        description: users.length ? "خفف البحث أو اختر كل الأدوار." : "أنشئ مستخدمًا جديدًا وحدد دوره الأولي."
      }) })
    ]
  });
}

UsersPage.pageId = "users";
UsersPage.migrationStatus = "native";

export default UsersPage;
