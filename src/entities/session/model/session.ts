import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/shared/api";

export type Perm = "dashboard" | "people" | "journal" | "shifts" | "analytics" | "assistant" | "terminals" | "settings" | "reviewManual" | "access";

export const PERMS: { id: Perm; label: string }[] = [
  { id: "dashboard", label: "Обстановка" }, { id: "people", label: "Люди" }, { id: "journal", label: "Журнал" }, { id: "shifts", label: "Смены" },
  { id: "analytics", label: "Аналитика" }, { id: "assistant", label: "Помощник" }, { id: "terminals", label: "Терминалы" }, { id: "settings", label: "Настройки" }, { id: "reviewManual", label: "Проверка ручных" }, { id: "access", label: "Выдача ролей" },
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
  SECURITY_OFFICER: ["dashboard", "people", "journal", "analytics", "terminals", "settings", "reviewManual"],
  MANAGER: ["dashboard", "people", "journal", "shifts", "analytics", "assistant"],
  INSTALLER: ["dashboard", "terminals"],
  GUARD: ["dashboard", "journal"],
};

/** Проверка права роли. В песочнице — только интерфейс; в продукте та же матрица проверяется на сервере (FR-60). */
export const can = (role: Role, perm: Perm) => MATRIX[role].includes(perm);
export const roleLabel = (role: Role) => ROLES.find((r) => r.id === role)?.label ?? role;

type SessionState = {
  userId: string; role: Role;
  /** ADR-046: токен сессии после входа по коду из письма. Нет токена — кабинет закрыт. */
  token: string | null; expiresAt: number;
  signIn: (userId: string, role: Role) => void; setRole: (r: Role) => void;
  start: (p: { userId: string; role: Role; token: string; expiresAt: number }) => void;
  signOut: () => void;
};

/** Пользователь кабинета. Вход — только по коду из письма (страница /login), сессия на 12 часов. */
export const useSession = create<SessionState>()(
  persist((set) => ({
    userId: "u_admin", role: "ADMIN", token: null, expiresAt: 0,
    signIn: (userId, role) => set({ userId, role }), setRole: (role) => set({ role }),
    start: (p) => set(p), signOut: () => set({ token: null, expiresAt: 0 }),
  }), { name: "proxodnaya.session", version: 2, migrate: (s) => ({ ...(s as object), token: null, expiresAt: 0 }) as SessionState }),
);