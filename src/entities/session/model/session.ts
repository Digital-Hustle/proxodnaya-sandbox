import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/shared/api";

export type Perm = "dashboard" | "people" | "journal" | "shifts" | "analytics" | "assistant" | "terminals" | "settings";

export const PERMS: { id: Perm; label: string }[] = [
  { id: "dashboard", label: "Обстановка" }, { id: "people", label: "Люди" }, { id: "journal", label: "Журнал" }, { id: "shifts", label: "Смены" },
  { id: "analytics", label: "Аналитика" }, { id: "assistant", label: "Помощник" }, { id: "terminals", label: "Терминалы" }, { id: "settings", label: "Настройки" },
];

export const ROLES: { id: Role; label: string; text: string }[] = [
  { id: "ADMIN", label: "Администратор", text: "Все разделы, роли и настройки системы" },
  { id: "SECURITY_OFFICER", label: "Служба безопасности", text: "Журнал, инциденты, терминалы и правила прохода" },
  { id: "MANAGER", label: "Руководитель участка", text: "Люди, смены, табель и помощник" },
  { id: "INSTALLER", label: "Инженер терминалов", text: "Подключение и обслуживание киосков, без доступа к людям" },
  { id: "GUARD", label: "Охранник", text: "Обстановка и журнал проходов" },
];

const MATRIX: Record<Role, Perm[]> = {
  ADMIN: PERMS.map((p) => p.id),
  SECURITY_OFFICER: ["dashboard", "people", "journal", "analytics", "terminals", "settings"],
  MANAGER: ["dashboard", "people", "journal", "shifts", "analytics", "assistant"],
  INSTALLER: ["dashboard", "terminals"],
  GUARD: ["dashboard", "journal"],
};

/** Проверка права роли. В песочнице — только интерфейс; в продукте та же матрица проверяется на сервере (FR-60). */
export const can = (role: Role, perm: Perm) => MATRIX[role].includes(perm);
export const roleLabel = (role: Role) => ROLES.find((r) => r.id === role)?.label ?? role;

/** Роль текущего пользователя панели. В демо переключается в шапке. */
export const useSession = create<{ role: Role; setRole: (r: Role) => void }>()(
  persist((set) => ({ role: "ADMIN", setRole: (role) => set({ role }) }), { name: "proxodnaya.session" }),
);
