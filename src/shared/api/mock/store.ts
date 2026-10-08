// «База» песочницы: один JSON в localStorage + синхронизация вкладок через BroadcastChannel.
// Это замена PostgreSQL на время чернового стенда — продуктовый бэкенд живёт в основном репо.
import { useSyncExternalStore } from "react";
import type { Db } from "../types";
import { createSeed, seedAdmins, DB_VERSION } from "./seed";

const KEY = "proxodnaya.sandbox.db";
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("proxodnaya-db") : null;
const listeners = new Set<() => void>();

const load = (): Db => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw) as Db;
      if (db.version === DB_VERSION) return { ...db, kiosks: db.kiosks ?? [], admins: db.admins ?? seedAdmins(), accessLog: db.accessLog ?? [] }; // поля ADR-038 добавляются без сброса данных
    }
  } catch { /* битые данные — пересоздаём */ }
  const seed = createSeed();
  localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
};

let db: Db = load();
const emit = () => listeners.forEach((l) => l());

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Переполнение квоты: режем старый журнал и пробуем ещё раз.
    db = { ...db, attempts: db.attempts.slice(-400), qrUses: db.qrUses.slice(-500) };
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  channel?.postMessage("changed");
};

channel?.addEventListener("message", () => { db = load(); emit(); });

export const getDb = () => db;

/** Транзакция: функция меняет копию, затем копия атомарно становится базой. */
export const mutate = <T>(fn: (draft: Db) => T): T => {
  const draft = structuredClone(db);
  const result = fn(draft);
  db = draft;
  save();
  emit();
  return result;
};

export const resetDb = () => { db = createSeed(); save(); emit(); };

const subscribe = (cb: () => void) => { listeners.add(cb); return () => listeners.delete(cb); };

/** Подписка компонента на базу. Селектор должен возвращать стабильные ссылки (части db) — или использовать useMemo снаружи. */
export const useDb = () => useSyncExternalStore(subscribe, getDb, getDb);
