import { api, type OfflineBatch, type OfflineSyncResult } from "@/shared/api";
import { canonical, createKey, loadKey, randomId, sign, type StoredKey } from "@/shared/lib";
import { useOfflinePass } from "./store";

// ADR-043: отправка проходов без связи пакетами, подписанными ключом терминала.
const SLOT = "kiosk";
/** Сколько записей в одном пакете: длинная очередь уходит частями, каждая подтверждается отдельно. */
export const BATCH_MAX = 50;

let keyP: Promise<StoredKey> | null = null;
/** Ключ терминала: создаётся при первом запуске, закрытая часть неизвлекаемая и живёт в IndexedDB. */
export const kioskKey = (kioskId: string) => {
  keyP ??= loadKey(SLOT).then((k) => (k && k.deviceId === kioskId ? k : createKey(SLOT, kioskId, "kiosk")));
  keyP.catch(() => { keyP = null; });
  return keyP;
};

export const signBatch = async (key: StoredKey, batch: OfflineBatch) => sign(key.privateKey, canonical(batch));

let running: Promise<OfflineSyncResult> | null = null;

/**
 * Отправляет очередь пакетами до первой ошибки. Сервер отвечает списком принятых записей — только их терминал
 * убирает из очереди; остальное уйдёт при следующей попытке. Повторная отправка безопасна: записи идемпотентны по id.
 */
export const syncQueue = (kioskId: string): Promise<OfflineSyncResult> => {
  running ??= (async () => {
    const total: OfflineSyncResult = { ok: true, accepted: [], synced: 0, conflicts: 0, rejected: 0 };
    try {
      const key = await kioskKey(kioskId);
      for (let guard = 0; guard < 100; guard++) {
        const events = useOfflinePass.getState().queue.slice(0, BATCH_MAX);
        if (!events.length) break;
        const batch: OfflineBatch = { v: 1, kioskId, nonce: randomId("b", 10), sentAt: Date.now(), events };
        const r = await api.syncOffline(batch, await signBatch(key, batch));
        useOfflinePass.getState().dropSynced(r.accepted);
        total.accepted.push(...r.accepted); total.synced += r.synced; total.conflicts += r.conflicts; total.rejected += r.rejected;
        if (!r.ok) return { ...total, ok: false, error: r.error };
        if (!r.accepted.length) break;
      }
      return total;
    } catch (e) {
      return { ...total, ok: false, error: e instanceof Error ? e.message : "Сервер недоступен" };
    } finally {
      running = null;
    }
  })();
  return running;
};
