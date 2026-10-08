import type { Attempt, Db, ReasonCode, Shift, Site, Worker } from "../types";
import { atTime, todayKey } from "../../lib/time";
import { mulberry32 } from "../../lib/id";

export const DB_VERSION = 4;

/** Пользователи панели для демо: по одному на каждую роль. */
export const seedAdmins = (): import("../types").AdminUser[] => {
  const t = Date.now() - 30 * 86400000;
  return [
    { id: "u_admin", name: "Ольга Смирнова", email: "o.smirnova@proxodnaya.ru", role: "ADMIN", status: "ACTIVE", createdAt: t, lastSeen: Date.now() },
    { id: "u_sec", name: "Игорь Ковалёв", email: "i.kovalev@proxodnaya.ru", role: "SECURITY_OFFICER", status: "ACTIVE", createdAt: t, lastSeen: Date.now() - 3600000 },
    { id: "u_mgr", name: "Марина Белова", email: "m.belova@proxodnaya.ru", role: "MANAGER", status: "ACTIVE", createdAt: t, lastSeen: Date.now() - 86400000 },
    { id: "u_inst", name: "Артём Зайцев", email: "a.zaitsev@proxodnaya.ru", role: "INSTALLER", status: "ACTIVE", createdAt: t, lastSeen: Date.now() - 3 * 86400000 },
    { id: "u_guard", name: "Сергей Попов", email: "s.popov@proxodnaya.ru", role: "GUARD", status: "ACTIVE", createdAt: t, lastSeen: Date.now() - 7200000 },
  ];
};

const PEOPLE: [string, string, string][] = [
  ["Иванов Пётр Сергеевич", "Монтажник", "СтройМонтаж"],
  ["Ахмедов Рустам Каримович", "Сварщик", "СтройМонтаж"],
  ["Кузнецова Анна Викторовна", "Инженер ПТО", "Генподрядчик"],
  ["Смирнов Алексей Игоревич", "Бетонщик", "Бетон-Юг"],
  ["Ковалёв Денис Андреевич", "Электромонтажник", "ЭлектроСеть"],
  ["Юсупов Тимур Ренатович", "Арматурщик", "Бетон-Юг"],
  ["Морозова Екатерина Олеговна", "Прораб", "Генподрядчик"],
  ["Попов Никита Валерьевич", "Крановщик", "ТехноКран"],
  ["Соколов Илья Дмитриевич", "Плотник", "СтройМонтаж"],
  ["Назаров Фарид Ильдарович", "Разнорабочий", "Бетон-Юг"],
  ["Волков Артём Павлович", "Сантехник", "ИнжСистемы"],
  ["Лебедев Максим Юрьевич", "Электромонтажник", "ЭлектроСеть"],
  ["Григорьев Олег Витальевич", "Монтажник", "СтройМонтаж"],
  ["Белова Мария Сергеевна", "Геодезист", "Генподрядчик"],
  ["Каримов Азамат Бахтиярович", "Сварщик", "ИнжСистемы"],
  ["Фёдоров Роман Алексеевич", "Стропальщик", "ТехноКран"],
];

/** Коды приглашения для демо: вводятся на телефоне вручную. */
export const DEMO_INVITES = ["PETR01", "ANNA03", "DENIS5"];
/** Индексы демо-сотрудников (с инвайтами) — Иванов, Кузнецова, Ковалёв, плюс Ахмедов для «виртуального телефона». */
const DEMO_IDX = [0, 1, 2, 4];

const dayShift = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return todayKey(d);
};

/** ADR-044: объекты по умолчанию и привязка зон — для баз, созданных до появления объектов. */
export const DEFAULT_SITES: Site[] = [
  { id: "s_north", name: "ЖК «Северный»", address: "ул. Заводская, 14" },
  { id: "s_south", name: "Склад «Южный»", address: "Промзона, стр. 3" },
];
export const DEFAULT_ZONE_SITE: Record<string, string> = { z_a: "s_north", z_b: "s_north", z_s: "s_south" };

export const createSeed = (): Db => {
  const rnd = mulberry32(20261010);
  const now = Date.now();
  const zones = [
    { id: "z_a", name: "Корпус А", capacity: 40, siteId: "s_north" },
    { id: "z_b", name: "Корпус Б", capacity: 25, siteId: "s_north" },
    { id: "z_s", name: "Склад", capacity: 6, siteId: "s_south" },
  ];
  const checkpoints = [
    { id: "cp_main", name: "КПП-1 · Главный вход", zoneId: "z_a" },
    { id: "cp_b", name: "КПП-2 · Корпус Б", zoneId: "z_b" },
    { id: "cp_store", name: "КПП-3 · Склад", zoneId: "z_s" },
  ];

  const workers: Worker[] = PEOPLE.map(([fullName, position, contractor], i) => ({
    id: `w_${String(i + 1).padStart(2, "0")}`,
    fullName, position, contractor,
    status: i === 9 ? "blocked" : "active",
    zoneIds: i % 4 === 3 ? ["z_a"] : i % 5 === 0 ? ["z_a", "z_b", "z_s"] : ["z_a", "z_b"],
    permitUntil: i === 13 ? dayShift(-3) : dayShift(90 + i),
    inviteCode: i === 0 ? DEMO_INVITES[0] : i === 2 ? DEMO_INVITES[1] : i === 4 ? DEMO_INVITES[2] : undefined,
    createdAt: now - 20 * 86400000,
  }));

  const shifts: Shift[] = [];
  const attempts: Attempt[] = [];
  let n = 0;
  const push = (a: Omit<Attempt, "id">) => attempts.push({ id: `a_seed_${n++}`, ...a });
  const denyCodes: ReasonCode[] = ["FACE_MISMATCH", "QR_EXPIRED", "QR_REUSED", "LIVENESS_FAILED", "FACE_LOW_QUALITY", "NO_SHIFT", "FACE_NOT_FOUND"];

  for (let off = -13; off <= 6; off++) {
    const day = dayShift(off);
    const wd = new Date(atTime(day, "12:00")).getDay();
    if (wd === 0 && off !== 0) continue; // воскресенье — выходной (кроме сегодняшнего дня, чтобы демо работало)
    workers.forEach((w, i) => {
      if (wd === 6 && i % 3 !== 0 && !(off === 0 && DEMO_IDX.includes(i))) return; // в субботу работает треть
      if (w.status === "blocked" && off >= -2) return;
      const night = i === 7 && off % 2 === 0;
      const demo = off === 0 && DEMO_IDX.includes(i);
      const hNow = new Date(now).getHours();
      // Демо-сотрудники сегодня ещё не приходили, а их смена покрывает текущее время — чтобы проход можно было проверить в любое время суток.
      const start = demo ? `${String(Math.max(0, Math.min(8, hNow - 1))).padStart(2, "0")}:00` : night ? "20:00" : i === 2 || i === 6 || i === 13 ? "09:00" : "08:00";
      const end = demo ? `${String(Math.min(23, Math.max(17, hNow + 3))).padStart(2, "0")}:${hNow + 3 >= 23 ? "59" : "00"}` : night ? "23:59" : i === 2 || i === 6 || i === 13 ? "18:00" : "17:00";
      shifts.push({ id: `s_${day}_${w.id}`, workerId: w.id, day, start, end });
      if (off > 0 || demo) return;
      if (rnd() < 0.06) return; // прогул
      const cp = w.zoneIds.includes("z_b") && rnd() < 0.3 ? "cp_b" : "cp_main";
      const lateMin = rnd() < 0.15 ? 5 + rnd() * 40 : -25 + rnd() * 22;
      const inTs = atTime(day, start) + lateMin * 60000;
      if (inTs > now) return;
      if (rnd() < 0.07) push({ ts: inTs - 60000 * (1 + rnd() * 3), workerId: w.id, checkpointId: cp, direction: "IN", decision: "DENY", code: denyCodes[Math.floor(rnd() * denyCodes.length)], source: "QR", score: 0.2 + rnd() * 0.3 });
      push({ ts: inTs, workerId: w.id, checkpointId: cp, direction: "IN", ...(rnd() < 0.03 ? { decision: "MANUAL" as const, code: "MANUAL_GUARD" as const, source: "MANUAL" as const, note: "сел телефон" } : { decision: "ALLOW" as const, code: "OK" as const, source: "QR" as const }), score: 0.8 + rnd() * 0.15 });
      const overMin = rnd() < 0.2 ? 15 + rnd() * 90 : -10 + rnd() * 20;
      const outTs = atTime(day, end) + overMin * 60000;
      if (outTs > now) return;
      push({ ts: outTs, workerId: w.id, checkpointId: cp, direction: "OUT", decision: "ALLOW", code: "OK", source: "QR", score: 0.8 + rnd() * 0.15 });
    });
  }
  // Пара свежих отказов «сегодня», чтобы журнал не был пустым утром.
  const t = Math.min(now - 5 * 60000, atTime(todayKey(), "08:40"));
  push({ ts: t, checkpointId: "cp_main", direction: "IN", decision: "DENY", code: "QR_INVALID", source: "QR" });
  push({ ts: t + 90000, workerId: "w_10", checkpointId: "cp_main", direction: "IN", decision: "DENY", code: "WORKER_BLOCKED", source: "QR" });

  attempts.sort((a, b) => a.ts - b.ts);
  return {
    version: DB_VERSION,
    workers, devices: [], sites: DEFAULT_SITES, zones, checkpoints, shifts, attempts, qrUses: [], kiosks: [], admins: seedAdmins(), accessLog: [],
    settings: { faceThreshold: 0.6, qrToleranceSec: 45, shiftGraceMin: 60, requireShift: true, demoFace: "match" },
  };
};
