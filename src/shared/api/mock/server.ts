// Мок-бэкенд в браузере. Решение о проходе принимается ЗДЕСЬ, а не в компонентах (как Д2 в продукте:
// UI только показывает то, что вернул «сервер»).
import type { Attempt, Challenge, Checkpoint, Db, Kiosk, TerminalMode, OfflinePolicy, ManualReview, AdminUser, AccessEvent, Role, DecisionResult, Device, Direction, FrameStat, ReasonCode, Shift, Worker } from "../types";
import { getDb, mutate, resetDb } from "./store";
import { REASONS } from "./reasons";
import { presenceNow, shiftFor, buildIntervals } from "./derived";
import { currentWindow, parsePassQr, signedMessage, buildPassQr } from "../../lib/passQr";
import { verify, createKey, loadKey } from "../../lib/deviceKey";
import { randomId, inviteCode } from "../../lib/id";
import { atTime, todayKey } from "../../lib/time";
import { b64uToJson } from "../../lib/b64";
import { motion as m } from "../../config/tokens";

const latency = (min = 120, max = 380) => new Promise((r) => setTimeout(r, min + Math.random() * (max - min)));

const publicWorker = (w: Worker) => ({ id: w.id, fullName: w.fullName, position: w.position, photo: w.photo, contractor: w.contractor });

const record = (a: Omit<Attempt, "id" | "ts">): DecisionResult => {
  const db = getDb();
  const attempt: Attempt = { id: randomId("a"), ts: Date.now(), ...a };
  mutate((d) => { d.attempts.push(attempt); });
  const w = a.workerId ? db.workers.find((x) => x.id === a.workerId) : undefined;
  const r = REASONS[a.code];
  return {
    attemptId: attempt.id, decision: a.decision, code: a.code,
    message: a.decision === "ALLOW" ? (a.direction === "IN" ? "Проходите" : "Хорошего вечера") : r.message,
    hint: a.decision === "ALLOW" ? (a.direction === "IN" ? "Вход отмечен" : "Выход отмечен, время посчитано") : r.hint,
    worker: w ? publicWorker(w) : undefined, direction: a.direction, score: a.score, ts: attempt.ts,
  };
};

const deny = (code: ReasonCode, base: { checkpointId: string; direction: Direction; workerId?: string; score?: number }) =>
  record({ ...base, decision: REASONS[code].decision, code, source: "QR" });

const CHALLENGES: Omit<Challenge, "timeoutMs">[] = [
  { kind: "turn-left", text: "Медленно поверните голову влево" },
  { kind: "turn-right", text: "Медленно поверните голову вправо" },
  { kind: "blink", text: "Моргните два раза" },
  { kind: "nod", text: "Кивните" },
];

type Pending = { workerId: string; checkpointId: string; direction: Direction; challenge: Challenge; issuedAt: number };
const pending = new Map<string, Pending>();

export type ScanResult =
  | { kind: "decision"; result: DecisionResult }
  | { kind: "challenge"; token: string; challenge: Challenge; worker: ReturnType<typeof publicWorker> };

const recentFailures = (workerId: string) =>
  getDb().attempts.filter((a) => a.workerId === workerId && a.ts > Date.now() - 5 * 60000 && (a.code === "FACE_MISMATCH" || a.code === "LIVENESS_FAILED")).length;

const DEFAULT_COOLDOWN_SEC = 30;
const DEFAULT_PRESENCE_TTL_H = 16;

export type DirectionResolution = { direction: Direction; repeat: boolean };

/**
 * ADR-037. Направление прохода выводится сервером, а не выбирается на киоске:
 * КПП с фиксированным режимом → его направление; иначе «внутри» (открытый интервал моложе presenceTtlHours) → OUT, иначе → IN.
 * repeat = успешный проход этого сотрудника был меньше repeatScanCooldownSec назад (защита от двойного скана «вошёл-вышел»).
 */
export const resolveDirection = (db: Db, workerId: string, checkpointId: string, now = Date.now()): DirectionResolution => {
  const mode = db.checkpoints.find((c) => c.id === checkpointId)?.mode ?? "AUTO";
  const ttl = (db.settings.presenceTtlHours ?? DEFAULT_PRESENCE_TTL_H) * 3600000;
  const p = presenceNow(db).find((x) => x.workerId === workerId);
  const direction: Direction = mode !== "AUTO" ? mode : p && now - p.since < ttl ? "OUT" : "IN";
  const cooldown = (db.settings.repeatScanCooldownSec ?? DEFAULT_COOLDOWN_SEC) * 1000;
  const last = db.attempts.findLast((a) => a.workerId === workerId && (a.decision === "ALLOW" || a.decision === "MANUAL"));
  return { direction, repeat: !!last && now - last.ts < cooldown };
};

/** Направление до идентификации (невалидный QR и т. п.): режим КПП, для AUTO — IN. */
const checkpointDefault = (db: Db, checkpointId: string): Direction => {
  const mode = db.checkpoints.find((c) => c.id === checkpointId)?.mode ?? "AUTO";
  return mode === "AUTO" ? "IN" : mode;
};

/** Правила допуска после идентификации — одни и те же для QR и для режима «Сначала лицо». null = нарушений нет. */
/** Челлендж живости для режима «Сначала лицо»: выдаёт сервер, клиент его не выбирает. */
export const faceChallenge = (): Challenge => ({ ...CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)], timeoutMs: m.kiosk.challengeTimeoutMs });

const checkRules = (db: Db, worker: Worker, checkpointId: string, resolved: DirectionResolution): ReasonCode | null => {
  const direction = resolved.direction;
  if (worker.status === "blocked") return "WORKER_BLOCKED";
  if (recentFailures(worker.id) >= 3) return "TEMP_LOCKED";
  if (worker.permitUntil < todayKey()) return "PERMIT_EXPIRED";
  const zoneId = db.checkpoints.find((c) => c.id === checkpointId)?.zoneId;
  if (zoneId && !worker.zoneIds.includes(zoneId)) return "NO_ZONE_PERMIT";

  if (resolved.repeat) return "REPEAT_SCAN";
  const inside = presenceNow(db).some((p) => p.workerId === worker.id);
  if (direction === "IN") {
    if (db.settings.requireShift) {
      const sh = shiftFor(db, worker.id);
      if (!sh) return "NO_SHIFT";
      const g = db.settings.shiftGraceMin * 60000;
      const now = Date.now();
      if (now < atTime(sh.day, sh.start) - g || now > atTime(sh.day, sh.end)) return "OUTSIDE_SHIFT_WINDOW";
    }
    // В AUTO «внутри» уже дало бы OUT, а забытый выход старше presenceTtlHours — легальный новый вход.
    if (inside && db.checkpoints.find((c) => c.id === checkpointId)?.mode === "IN") return "ALREADY_INSIDE";
  } else if (!inside) return "NOT_INSIDE";
  return null;
};

export const kioskScan = async (raw: string, checkpointId: string): Promise<ScanResult> => {
  await latency();
  const db = getDb();
  const base = { checkpointId, direction: checkpointDefault(db, checkpointId) };
  const qr = parsePassQr(raw);
  if (!qr) return { kind: "decision", result: deny("QR_INVALID", base) };
  const worker = db.workers.find((w) => w.id === qr.workerId);
  if (!worker) return { kind: "decision", result: deny("DEVICE_UNKNOWN", base) };
  const resolved = resolveDirection(db, worker.id, checkpointId);
  const direction = resolved.direction;
  const wb = { checkpointId, direction, workerId: worker.id };
  if (!(await verify(qr.publicKey, qr.signature, signedMessage(qr.workerId, qr.deviceId, qr.window)))) return { kind: "decision", result: deny("QR_INVALID", wb) };

  const nowW = currentWindow();
  const lagSec = (nowW - qr.window) * 30;
  if (qr.window > nowW + 1 || lagSec > db.settings.qrToleranceSec) return { kind: "decision", result: deny("QR_EXPIRED", wb) };

  // Атомарное гашение (device, window): второй раз тот же QR не пройдёт.
  const useKey = `${qr.deviceId}|${qr.window}`;
  if (db.qrUses.includes(useKey)) return { kind: "decision", result: deny("QR_REUSED", wb) };
  mutate((d) => { d.qrUses.push(useKey); });

  const device = db.devices.find((d) => d.id === qr.deviceId);
  if (device) {
    if (device.revokedAt) return { kind: "decision", result: deny("DEVICE_REVOKED", wb) };
    if (device.workerId !== worker.id || device.publicKey !== qr.publicKey) return { kind: "decision", result: deny("DEVICE_MISMATCH", wb) };
  } else {
    // Песочница: киоск и телефон могут быть разными браузерами без общего сервера —
    // первое предъявление привязывает ключ (в продукте ключ приходит при активации).
    mutate((d) => {
      d.devices.forEach((x) => { if (x.workerId === worker.id && !x.revokedAt) x.revokedAt = Date.now(); });
      d.devices.push({ id: qr.deviceId, workerId: worker.id, publicKey: qr.publicKey, createdAt: Date.now(), label: "Телефон (привязан при первом скане)" });
    });
  }

  const rule = checkRules(db, worker, checkpointId, resolved);
  if (rule) return { kind: "decision", result: deny(rule, wb) };

  const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  const token = randomId("ch", 12);
  const challenge = { ...c, timeoutMs: m.kiosk.challengeTimeoutMs };
  pending.set(token, { workerId: worker.id, checkpointId, direction, challenge, issuedAt: Date.now() });
  return { kind: "challenge", token, challenge, worker: publicWorker(worker) };
};

/** Кадры челленджа → решение. В песочнице нет биометрии: живость — по движению в кадре, совпадение — флаг в настройках. */
export const kioskFrames = async (token: string, frames: FrameStat[]): Promise<DecisionResult> => {
  await latency(250, 600);
  const p = pending.get(token);
  if (!p) return record({ checkpointId: "cp_main", direction: "IN", decision: "ERROR", code: "SYSTEM_ERROR", source: "QR" });
  pending.delete(token);
  const base = { checkpointId: p.checkpointId, direction: p.direction, workerId: p.workerId };
  if (Date.now() - p.issuedAt > p.challenge.timeoutMs + 3000) return deny("CHALLENGE_EXPIRED", base);
  if (frames.length < 3) return deny("FACE_NOT_FOUND", base);
  const avg = (k: keyof FrameStat) => frames.reduce((s, f) => s + f[k], 0) / frames.length;
  if (avg("brightness") < 0.08 || avg("contrast") < 0.03) return deny("FACE_LOW_QUALITY", base);
  const motionPeak = Math.max(...frames.map((f) => f.motion));
  if (motionPeak < 0.012) return deny("LIVENESS_FAILED", { ...base, score: 0.5 });
  const { demoFace, faceThreshold } = getDb().settings;
  const score = demoFace === "match" ? 0.78 + Math.random() * 0.17 : 0.18 + Math.random() * 0.2;
  if (score < faceThreshold) return deny("FACE_MISMATCH", { ...base, score });
  return record({ ...base, decision: "ALLOW", code: "OK", source: "QR", score });
};

const livenessCode = (frames: FrameStat[]): ReasonCode | null => {
  if (frames.length < 3) return "FACE_NOT_FOUND";
  const avg = (k: keyof FrameStat) => frames.reduce((s, f) => s + f[k], 0) / frames.length;
  if (avg("brightness") < 0.08 || avg("contrast") < 0.03) return "FACE_LOW_QUALITY";
  if (Math.max(...frames.map((f) => f.motion)) < 0.012) return "LIVENESS_FAILED";
  return null;
};

/** ADR-038: для поиска по всей базе (1:N) порог строже, чем для сверки 1:1 по QR. */
export const FACE_FIRST_MARGIN = 0.1;

/**
 * Режим «Сначала лицо»: кадры челленджа → идентификация на сервере → те же правила. Решение принимает сервер.
 * Не узнали (ниже строгого порога) — FACE_NOT_FOUND, киоск предлагает QR. В песочнице нет биометрии: «кто в кадре» задаёт демо-пульт.
 */
export const kioskIdentify = async (checkpointId: string, frames: FrameStat[], candidateId: string | null): Promise<DecisionResult> => {
  await latency(300, 700);
  const db = getDb();
  const base = { checkpointId, direction: checkpointDefault(db, checkpointId) };
  const live = livenessCode(frames);
  if (live) return deny(live, base);
  const worker = candidateId ? db.workers.find((w) => w.id === candidateId) : undefined;
  const th = Math.min(0.95, db.settings.faceThreshold + FACE_FIRST_MARGIN);
  const score = worker && db.settings.demoFace === "match" ? 0.86 + Math.random() * 0.1 : 0.2 + Math.random() * 0.2;
  if (!worker || score < th) return deny("FACE_NOT_FOUND", { ...base, score });
  const resolved = resolveDirection(db, worker.id, checkpointId);
  const wb = { checkpointId, direction: resolved.direction, workerId: worker.id };
  const rule = checkRules(db, worker, checkpointId, resolved);
  if (rule) return deny(rule, wb);
  return record({ ...wb, decision: "ALLOW", code: "OK", source: "FACE", score });
};

// ——— Терминалы (ADR-038) ———
export const KIOSK_ONLINE_MS = 45000;
const perKiosk = (db: Db) => db.settings.terminalScope === "PER_KIOSK";
/** Логика терминала: общая из настроек или своя у киоска (если включена настройка по терминалам). */
export const terminalModeOf = (db: Db, kiosk?: Kiosk): TerminalMode => (perKiosk(db) ? kiosk?.mode : undefined) ?? db.settings.terminalMode ?? "QR_FACE";
export const offlinePolicyOf = (db: Db, kiosk?: Kiosk): OfflinePolicy => (perKiosk(db) ? kiosk?.offlinePolicy : undefined) ?? db.settings.offlinePolicy ?? "GUARD";

/** Киоск сообщает о себе (при старте и каждые 30 с). Неизвестный — получает код сопряжения. */
export const kioskHello = (id: string) => mutate((d) => {
  d.kiosks ??= [];
  const k = d.kiosks.find((x) => x.id === id);
  if (k) k.lastSeen = Date.now();
  else d.kiosks.push({ id, pairCode: inviteCode(), createdAt: Date.now(), lastSeen: Date.now() });
});

export const pairKiosk = async (code: string, p: { name: string; checkpointId: string; mode?: TerminalMode; offlinePolicy?: OfflinePolicy }) => {
  await latency(200, 450);
  const c = code.trim().toUpperCase();
  const k = (getDb().kiosks ?? []).find((x) => x.pairCode === c && !x.pairedAt);
  if (!k) throw new Error("Код не найден. Проверьте 6 символов на экране терминала.");
  mutate((d) => { const x = d.kiosks?.find((v) => v.id === k.id); if (x) Object.assign(x, { name: p.name.trim() || "Терминал", checkpointId: p.checkpointId, mode: p.mode, offlinePolicy: p.offlinePolicy, pairedAt: Date.now() }); });
  return k.id;
};

export const updateKiosk = async (id: string, patch: Partial<Pick<Kiosk, "name" | "checkpointId" | "mode" | "offlinePolicy">>) => {
  await latency(60, 160);
  mutate((d) => { const x = d.kiosks?.find((v) => v.id === id); if (x) Object.assign(x, patch); });
};

/** Отвязать: терминал сразу перестаёт пропускать и показывает новый код сопряжения. */
export const unpairKiosk = async (id: string) => {
  await latency(60, 160);
  mutate((d) => { d.kiosks = (d.kiosks ?? []).filter((v) => v.id !== id); d.kiosks.push({ id, pairCode: inviteCode(), createdAt: Date.now(), lastSeen: Date.now() }); });
};

/** Ручной пропуск (ADR-040): действует сразу, но запись ждёт подтверждения вторым человеком. */
export const kioskManual = async (workerId: string, checkpointId: string, note: string, guard = "Охранник поста") => {
  await latency();
  const { direction } = resolveDirection(getDb(), workerId, checkpointId);
  return record({ workerId, direction, checkpointId, decision: "MANUAL", code: "MANUAL_GUARD", source: "MANUAL", note, guard });
};

/** Проверка ручного пропуска: подтвердить или оспорить (с комментарием). Один раз, история не переписывается. */
export const reviewManual = async (id: string, status: ManualReview["status"], by: string, comment?: string) => {
  await latency(120, 260);
  const a = getDb().attempts.find((x) => x.id === id);
  if (!a || a.decision !== "MANUAL") throw new Error("Запись не найдена или это не ручной пропуск");
  if (a.review) throw new Error("Запись уже проверена");
  const c = comment?.trim();
  if (status === "DISPUTED" && !c) throw new Error("Напишите, что не так");
  mutate((d) => { const x = d.attempts.find((v) => v.id === id); if (x) x.review = { status, by, at: Date.now(), ...(c ? { comment: c } : {}) }; });
};

// ——— Телефон рабочего ———
type InvitePayload = { id: string; fullName: string; position: string; contractor: string; zoneIds: string[]; code: string };

export const activateDevice = async (code: string, payloadB64?: string) => {
  await latency(300, 700);
  const db = getDb();
  let worker = db.workers.find((w) => w.inviteCode && w.inviteCode === code.trim().toUpperCase());
  if (!worker && payloadB64) {
    // Инвайт со ссылкой с другого устройства: в песочнице данные сотрудника едут в ссылке.
    try {
      const p = b64uToJson<InvitePayload>(payloadB64);
      if (p.code === code.trim().toUpperCase()) {
        const w: Worker = { id: p.id, fullName: p.fullName, position: p.position, contractor: p.contractor, zoneIds: p.zoneIds, status: "active", permitUntil: "2099-01-01", createdAt: Date.now(), inviteCode: p.code };
        mutate((d) => { d.workers = d.workers.filter((x) => x.id !== w.id).concat(w); });
        worker = w;
      }
    } catch { /* битая ссылка */ }
  }
  if (!worker) throw new Error("Код не найден. Проверьте 6 символов или попросите новый у администратора.");
  if (worker.status === "blocked") throw new Error("Доступ заблокирован — обратитесь к администратору.");
  const deviceId = randomId("d", 10);
  const key = await createKey("phone", deviceId, worker.id);
  const wid = worker.id;
  mutate((d) => {
    d.devices.forEach((x) => { if (x.workerId === wid && !x.revokedAt) x.revokedAt = Date.now(); });
    d.devices.push({ id: deviceId, workerId: wid, publicKey: key.publicKey, createdAt: Date.now(), label: navigator.userAgent.includes("Mobile") ? "Телефон" : "Браузер" });
    const w = d.workers.find((x) => x.id === wid);
    if (w) w.inviteCode = undefined; // инвайт одноразовый
  });
  return worker;
};

// ——— Демо: «виртуальный телефон» на этом же устройстве ———
export const virtualPassQr = async (workerId: string, windowOffset = 0) => {
  const slot = `virtual:${workerId}`;
  let key = await loadKey(slot);
  const db = getDb();
  const dev = key && db.devices.find((d) => d.id === key!.deviceId);
  if (!key || !dev || dev.revokedAt) {
    key = await createKey(slot, randomId("d", 10), workerId);
    const k = key;
    mutate((d) => {
      d.devices.forEach((x) => { if (x.workerId === workerId && !x.revokedAt) x.revokedAt = Date.now(); });
      d.devices.push({ id: k.deviceId, workerId, publicKey: k.publicKey, createdAt: Date.now(), label: "Виртуальный телефон (демо)" });
    });
  }
  return buildPassQr(key, currentWindow() + windowOffset);
};

export const forgePassQr = async (workerId: string) => {
  const raw = await virtualPassQr(workerId);
  const parts = raw.split(".");
  parts[4] = parts[4].slice(0, -4) + (parts[4].endsWith("AAAA") ? "BBBB" : "AAAA");
  return parts.join(".");
};

// ——— Админка ———
export type WorkerDraft = Pick<Worker, "fullName" | "position" | "contractor" | "zoneIds"> & { photo?: string };

export const createWorker = async (draft: WorkerDraft) => {
  await latency();
  const w: Worker = { ...draft, id: randomId("w", 6), status: "active", permitUntil: todayKey(new Date(Date.now() + 180 * 86400000)), inviteCode: inviteCode(), createdAt: Date.now() };
  mutate((d) => { d.workers.push(w); });
  return w;
};

export const updateWorker = async (id: string, patch: Partial<Worker>) => {
  await latency(80, 200);
  mutate((d) => { const w = d.workers.find((x) => x.id === id); if (w) Object.assign(w, patch); });
};

export const regenerateInvite = async (id: string) => {
  const code = inviteCode();
  await updateWorker(id, { inviteCode: code });
  return code;
};

export const revokeDevice = async (deviceId: string) => {
  await latency(80, 200);
  mutate((d) => { const x = d.devices.find((v) => v.id === deviceId); if (x) x.revokedAt = Date.now(); });
};

export const upsertShift = async (s: Omit<Shift, "id"> & { id?: string }) => {
  await latency(80, 200);
  mutate((d) => {
    d.shifts = d.shifts.filter((x) => !(x.workerId === s.workerId && x.day === s.day));
    d.shifts.push({ ...s, id: s.id ?? randomId("s") });
  });
};

/** График: сотрудники × дни недели (0 = Пн) в периоде [from, to]. Существующие смены в эти дни заменяются. Возвращает число созданных смен. */
export const assignSchedule = async (p: { workerIds: string[]; weekdays: number[]; from: string; to: string; start: string; end: string }) => {
  await latency(120, 260);
  const days: string[] = [];
  const [y, m, dd] = p.from.split("-").map(Number);
  for (let d = new Date(y, m - 1, dd); todayKey(d) <= p.to && days.length < 366; d.setDate(d.getDate() + 1)) if (p.weekdays.includes((d.getDay() + 6) % 7)) days.push(todayKey(d));
  mutate((d) => {
    d.shifts = d.shifts.filter((x) => !(p.workerIds.includes(x.workerId) && days.includes(x.day)));
    for (const w of p.workerIds) for (const day of days) d.shifts.push({ id: randomId("s"), workerId: w, day, start: p.start, end: p.end });
  });
  return days.length * p.workerIds.length;
};

export const deleteShift = async (id: string) => { await latency(60, 150); mutate((d) => { d.shifts = d.shifts.filter((x) => x.id !== id); }); };

/** ADR-037: режим КПП — авто (по присутствию) или фиксированное направление (отдельные турникеты входа/выхода). */
export const updateCheckpoint = async (id: string, patch: Partial<Pick<Checkpoint, "mode">>) => {
  await latency(60, 150);
  mutate((d) => { const c = d.checkpoints.find((x) => x.id === id); if (c) Object.assign(c, patch); });
};

export const updateSettings = async (patch: Partial<ReturnType<typeof getDb>["settings"]>) => {
  await latency(60, 150);
  mutate((d) => { Object.assign(d.settings, patch); });
};

export const resetDemo = () => resetDb();

export type { Device };


// ---------- ADR-039: постраничные запросы ----------
// UI никогда не тянет коллекцию целиком: только страницы с курсором, фильтры и сортировка — на «сервере».
// В продукте это GET /workers?cursor=&limit=, GET /attempts?…, GET /shifts?day=… с теми же полями ответа.
export type Page<T> = { items: T[]; nextCursor: string | null; total: number };
export const PAGE_MAX = 100;
const clampLimit = (n?: number) => Math.min(Math.max(1, n ?? 40), PAGE_MAX);
/** Офсетный курсор — для списков, отсортированных по имени (вставки редки). */
const pageByOffset = <T,>(all: T[], cursor: string | null | undefined, limit?: number): Page<T> => {
  const off = cursor ? Math.max(0, parseInt(cursor, 36) || 0) : 0;
  const n = clampLimit(limit);
  return { items: all.slice(off, off + n), nextCursor: off + n < all.length ? (off + n).toString(36) : null, total: all.length };
};
const norm = (s?: string) => (s ?? "").trim().toLowerCase().replace(/ё/g, "е");

export type WorkerFilter = "all" | "inside" | "blocked";
export type WorkerQuery = { q?: string; filter?: WorkerFilter; zoneId?: string; contractor?: string; cursor?: string | null; limit?: number };
export type WorkerRow = Worker & { inside: boolean; insideZoneId?: string };
export const queryWorkers = async (p: WorkerQuery): Promise<Page<WorkerRow>> => {
  await latency(80, 220);
  const db = getDb();
  const pres = new Map(presenceNow(db).map((x) => [x.workerId, x.zoneId]));
  const q = norm(p.q);
  const all = db.workers
    .filter((w) => (p.filter === "inside" ? pres.has(w.id) : p.filter === "blocked" ? w.status === "blocked" : true))
    .filter((w) => !p.zoneId || w.zoneIds.includes(p.zoneId))
    .filter((w) => !p.contractor || w.contractor === p.contractor)
    .filter((w) => !q || norm(`${w.fullName} ${w.position} ${w.contractor}`).includes(q))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru") || (a.id < b.id ? -1 : 1))
    .map((w) => ({ ...w, inside: pres.has(w.id), insideZoneId: pres.get(w.id) }));
  return pageByOffset(all, p.cursor, p.limit);
};

export type AttemptQuery = { review?: "PENDING"; day?: string; decision?: string; direction?: string; checkpointId?: string; workerId?: string; q?: string; cursor?: string | null; limit?: number };
const filterAttempts = (db: Db, p: AttemptQuery) => {
  const names = new Map(db.workers.map((w) => [w.id, w.fullName]));
  const q = norm(p.q);
  return db.attempts
    .filter((a) => (!p.day || p.day === "all" || todayKey(new Date(a.ts)) === p.day) && (!p.decision || a.decision === p.decision) && (!p.direction || a.direction === p.direction)
      && (!p.checkpointId || a.checkpointId === p.checkpointId) && (!p.workerId || a.workerId === p.workerId) && (!p.review || (a.decision === "MANUAL" && !a.review)))
    .filter((a) => !q || norm(`${(a.workerId && names.get(a.workerId)) ?? ""} ${REASONS[a.code].message} ${a.code}`).includes(q))
    .sort((a, b) => b.ts - a.ts || (a.id < b.id ? 1 : -1));
};
/** Курсор по ключу (ts~id): новые проходы сверху не сдвигают уже загруженные страницы и не дают дублей. */
export const queryAttempts = async (p: AttemptQuery): Promise<Page<Attempt>> => {
  await latency(80, 220);
  const all = filterAttempts(getDb(), p);
  const n = clampLimit(p.limit);
  let start = 0;
  if (p.cursor) {
    const i = p.cursor.indexOf("~");
    const ts = Number(p.cursor.slice(0, i)), id = p.cursor.slice(i + 1);
    start = all.findIndex((a) => a.ts < ts || (a.ts === ts && a.id < id));
    if (start < 0) start = all.length;
  }
  const items = all.slice(start, start + n);
  const last = items[items.length - 1];
  return { items, nextCursor: last && start + n < all.length ? `${last.ts}~${last.id}` : null, total: all.length };
};
/** Выгрузка CSV: в продукте — отдельный экспорт на сервере (файл по ссылке), здесь — тот же фильтр без страниц. */
export const exportAttempts = async (p: AttemptQuery): Promise<Attempt[]> => { await latency(150, 300); return filterAttempts(getDb(), p); };

export type ShiftFilter = "all" | "planned" | "unplanned";
export type ShiftRow = { worker: Worker; shift?: Shift; intervals: { start: number; end?: number }[] };
export const queryShiftRows = async (p: { day: string; q?: string; filter?: ShiftFilter; cursor?: string | null; limit?: number }): Promise<Page<ShiftRow>> => {
  await latency(80, 220);
  const db = getDb();
  const q = norm(p.q);
  const shifts = new Map(db.shifts.filter((s) => s.day === p.day).map((s) => [s.workerId, s]));
  const all = db.workers
    .filter((w) => !q || norm(`${w.fullName} ${w.position} ${w.contractor}`).includes(q))
    .filter((w) => (p.filter === "planned" ? shifts.has(w.id) : p.filter === "unplanned" ? !shifts.has(w.id) : true))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru") || (a.id < b.id ? -1 : 1));
  const page = pageByOffset(all, p.cursor, p.limit);
  // Интервалы считаем только для людей на странице — так же поступит сервер.
  const ids = new Set(page.items.map((w) => w.id));
  const iv = buildIntervals({ ...db, attempts: db.attempts.filter((a) => a.workerId && ids.has(a.workerId)) });
  return { ...page, items: page.items.map((w) => ({ worker: w, shift: shifts.get(w.id), intervals: iv.filter((i) => i.workerId === w.id && todayKey(new Date(i.start)) === p.day) })) };
};

// ---------- Нагрузочные данные (демо масштаба) ----------
const SCALE_ZONES = [
  { id: "z_c", name: "Корпус В", capacity: 120 }, { id: "z_d", name: "Корпус Г", capacity: 120 },
  { id: "z_park", name: "Площадка техники", capacity: 40 }, { id: "z_lab", name: "Лаборатория", capacity: 15 },
  { id: "z_hq", name: "Штаб строительства", capacity: 60 },
];
const LAST = ["Абрамов", "Белов", "Васильев", "Гусев", "Давыдов", "Егоров", "Жуков", "Зайцев", "Ильин", "Комаров", "Лазарев", "Макаров", "Никитин", "Орлов", "Павлов", "Романов", "Семёнов", "Тарасов", "Уткин", "Филиппов", "Хасанов", "Цветков", "Чернов", "Шарипов", "Яковлев"];
const FIRST = ["Алексей", "Бахтиёр", "Виктор", "Георгий", "Дмитрий", "Евгений", "Захар", "Игорь", "Кирилл", "Леонид", "Михаил", "Николай", "Олег", "Руслан", "Сергей", "Тимофей", "Фёдор", "Шамиль"];
const MID = ["Александрович", "Борисович", "Викторович", "Геннадьевич", "Иванович", "Михайлович", "Олегович", "Петрович", "Сергеевич"];
const JOBS = ["Монтажник", "Сварщик", "Бетонщик", "Арматурщик", "Плотник", "Разнорабочий", "Электромонтажник", "Стропальщик", "Отделочник", "Сантехник"];
const FIRMS = ["СтройМонтаж", "Бетон-Юг", "ЭлектроСеть", "ИнжСистемы", "ТехноКран", "ФасадПро", "ОтделкаСервис", "ГеоТехника", "Генподрядчик"];
export const SCALE_WORKERS = 400;
export const isScaled = (db: Db) => db.workers.some((w) => w.id.startsWith("w_s"));
/** Добавляет 400 человек, 5 зон с КПП, смены на неделю и сегодняшние проходы. Только добавляет — сброс демо возвращает исходные данные. */
export const seedScale = async () => {
  await latency(200, 400);
  mutate((d) => {
    if (d.workers.some((w) => w.id.startsWith("w_s"))) return;
    let seed = 42;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
    const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
    for (const z of SCALE_ZONES) if (!d.zones.some((x) => x.id === z.id)) d.zones.push({ ...z });
    for (const z of SCALE_ZONES) if (!d.checkpoints.some((c) => c.zoneId === z.id)) d.checkpoints.push({ id: `cp_${z.id}`, name: `КПП · ${z.name}`, zoneId: z.id });
    const zoneIds = d.zones.map((z) => z.id);
    const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + i); return todayKey(x); });
    const now = Date.now(), today = todayKey();
    for (let i = 0; i < SCALE_WORKERS; i++) {
      const id = `w_s${i}`;
      const zs = [...new Set([pick(zoneIds), pick(zoneIds), ...(rnd() < 0.3 ? [pick(zoneIds)] : [])])];
      const permit = new Date(); permit.setDate(permit.getDate() + (rnd() < 0.04 ? -3 : 30 + Math.floor(rnd() * 200)));
      d.workers.push({ id, fullName: `${pick(LAST)} ${pick(FIRST)} ${pick(MID)}`, position: pick(JOBS), contractor: pick(FIRMS), status: rnd() < 0.03 ? "blocked" : "active", zoneIds: zs, permitUntil: todayKey(permit), createdAt: now - Math.floor(rnd() * 90) * 86400000 });
      const late = rnd() < 0.3;
      const start = late ? "09:00" : "08:00", end = late ? "20:00" : "17:00";
      for (const day of days) if (new Date(atTime(day, "12:00")).getDay() !== 0 || rnd() < 0.2) d.shifts.push({ id: `s_${id}_${day}`, workerId: id, day, start, end });
      if (rnd() < 0.62) {
        const inTs = atTime(today, start) - 15 * 60000 + Math.floor(rnd() * 40 * 60000);
        if (inTs >= now) continue;
        const z = zs[0];
        const cp = d.checkpoints.find((c) => c.zoneId === z)?.id ?? d.checkpoints[0].id;
        d.attempts.push({ id: randomId("a", 10), ts: inTs, workerId: id, checkpointId: cp, direction: "IN", decision: "ALLOW", code: "OK", source: "QR", score: 0.8 + rnd() * 0.15 });
        const outTs = inTs + (2 + rnd() * 9) * 3600000;
        if (outTs < now && rnd() < 0.5) d.attempts.push({ id: randomId("a", 10), ts: outTs, workerId: id, checkpointId: cp, direction: "OUT", decision: "ALLOW", code: "OK", source: "QR", score: 0.8 + rnd() * 0.15 });
        if (rnd() < 0.08) d.attempts.push({ id: randomId("a", 10), ts: inTs - 60000, workerId: id, checkpointId: cp, direction: "IN", decision: "DENY", code: pick(["FACE_LOW_QUALITY", "QR_EXPIRED", "FACE_MISMATCH"] as ReasonCode[]), source: "QR", score: 0.5 + rnd() * 0.2 });
      }
    }
    d.attempts.sort((a, b) => a.ts - b.ts);
  });
};


// ---------- Доступ к панели (ADR-041) ----------
const adminsOf = (db: Db) => db.admins ?? [];
const activeAdminCount = (db: Db) => adminsOf(db).filter((u) => u.role === "ADMIN" && u.status === "ACTIVE").length;
const isLastAdmin = (db: Db, u: AdminUser) => u.role === "ADMIN" && u.status === "ACTIVE" && activeAdminCount(db) <= 1;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Менять доступ может только действующий администратор — проверка на сервере, не только в интерфейсе. */
const requireAdmin = (db: Db, byId: string) => {
  const u = adminsOf(db).find((x) => x.id === byId);
  if (!u || u.status !== "ACTIVE" || u.role !== "ADMIN") throw new Error("Менять доступ может только администратор");
  return u;
};
const targetOf = (db: Db, id: string) => {
  const u = adminsOf(db).find((x) => x.id === id);
  if (!u) throw new Error("Пользователь не найден");
  return u;
};
const logAccess = (d: Db, e: Omit<AccessEvent, "id" | "ts">) => {
  d.accessLog = [{ id: randomId("ae"), ts: Date.now(), ...e }, ...(d.accessLog ?? [])].slice(0, 500);
};

export const inviteAdmin = async (p: { name: string; email: string; role: Role }, byId: string) => {
  await latency();
  const db = getDb();
  requireAdmin(db, byId);
  const name = p.name.trim().replace(/\s+/g, " ");
  const email = p.email.trim().toLowerCase();
  if (name.length < 2) throw new Error("Укажите имя и фамилию");
  if (!EMAIL.test(email)) throw new Error("Проверьте адрес почты");
  if (adminsOf(db).some((u) => u.email === email)) throw new Error("Пользователь с такой почтой уже есть");
  const u: AdminUser = { id: randomId("u"), name, email, role: p.role, status: "INVITED", createdAt: Date.now() };
  mutate((d) => { d.admins = [...(d.admins ?? []), u]; logAccess(d, { by: byId, target: u.id, action: "INVITE", to: p.role }); });
  return u;
};

export const setAdminRole = async (id: string, role: Role, byId: string) => {
  await latency();
  const db = getDb();
  requireAdmin(db, byId);
  if (id === byId) throw new Error("Свою роль поменять нельзя — это делает другой администратор");
  const u = targetOf(db, id);
  if (u.role === role) return u;
  if (isLastAdmin(db, u)) throw new Error("Это последний администратор — сначала назначьте другого");
  mutate((d) => { const x = d.admins?.find((v) => v.id === id); if (x) { logAccess(d, { by: byId, target: id, action: "ROLE", from: x.role, to: role }); x.role = role; } });
  return { ...u, role };
};

export const setAdminActive = async (id: string, active: boolean, byId: string) => {
  await latency();
  const db = getDb();
  requireAdmin(db, byId);
  if (id === byId) throw new Error("Себе доступ отключить нельзя");
  const u = targetOf(db, id);
  if (!active && isLastAdmin(db, u)) throw new Error("Это последний администратор — сначала назначьте другого");
  mutate((d) => {
    const x = d.admins?.find((v) => v.id === id);
    if (!x) return;
    x.status = active ? (x.lastSeen ? "ACTIVE" : "INVITED") : "DISABLED";
    logAccess(d, { by: byId, target: id, action: active ? "ENABLE" : "DISABLE" });
  });
};

/** Вход в панель (в демо — «войти как»). Приглашённый при первом входе становится активным. */
export const signInAdmin = (id: string) => {
  const u = targetOf(getDb(), id);
  if (u.status === "DISABLED") throw new Error("Доступ отключён администратором");
  mutate((d) => {
    const x = d.admins?.find((v) => v.id === id);
    if (!x) return;
    x.lastSeen = Date.now();
    if (x.status === "INVITED") { x.status = "ACTIVE"; logAccess(d, { by: id, target: id, action: "JOIN" }); }
  });
  return u;
};
