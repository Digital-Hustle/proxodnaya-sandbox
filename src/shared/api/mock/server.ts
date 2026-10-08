// Мок-бэкенд в браузере. Решение о проходе принимается ЗДЕСЬ, а не в компонентах (как Д2 в продукте:
// UI только показывает то, что вернул «сервер»).
import type { Attempt, Challenge, Checkpoint, Db, DecisionResult, Device, Direction, FrameStat, ReasonCode, Shift, Worker } from "../types";
import { getDb, mutate, resetDb } from "./store";
import { REASONS } from "./reasons";
import { presenceNow, shiftFor } from "./derived";
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

  if (worker.status === "blocked") return { kind: "decision", result: deny("WORKER_BLOCKED", wb) };
  if (recentFailures(worker.id) >= 3) return { kind: "decision", result: deny("TEMP_LOCKED", wb) };
  if (worker.permitUntil < todayKey()) return { kind: "decision", result: deny("PERMIT_EXPIRED", wb) };
  const zoneId = db.checkpoints.find((c) => c.id === checkpointId)?.zoneId;
  if (zoneId && !worker.zoneIds.includes(zoneId)) return { kind: "decision", result: deny("NO_ZONE_PERMIT", wb) };

  if (resolved.repeat) return { kind: "decision", result: deny("REPEAT_SCAN", wb) };
  const inside = presenceNow(db).some((p) => p.workerId === worker.id);
  if (direction === "IN") {
    if (db.settings.requireShift) {
      const sh = shiftFor(db, worker.id);
      if (!sh) return { kind: "decision", result: deny("NO_SHIFT", wb) };
      const g = db.settings.shiftGraceMin * 60000;
      const now = Date.now();
      if (now < atTime(sh.day, sh.start) - g || now > atTime(sh.day, sh.end)) return { kind: "decision", result: deny("OUTSIDE_SHIFT_WINDOW", wb) };
    }
    // В AUTO «внутри» уже дало бы OUT, а забытый выход старше presenceTtlHours — легальный новый вход.
    if (inside && db.checkpoints.find((c) => c.id === checkpointId)?.mode === "IN") return { kind: "decision", result: deny("ALREADY_INSIDE", wb) };
  } else if (!inside) return { kind: "decision", result: deny("NOT_INSIDE", wb) };

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

export const kioskManual = async (workerId: string, checkpointId: string, note: string) => {
  await latency();
  const { direction } = resolveDirection(getDb(), workerId, checkpointId);
  return record({ workerId, direction, checkpointId, decision: "MANUAL", code: "MANUAL_GUARD", source: "MANUAL", note });
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
