// Формат офлайн-QR: PX1.<workerId>.<deviceId>.<window>.<signature>.<publicKey>
// Подписывается строка v1|workerId|deviceId|window. В продукте публичный ключ сервер знает с активации,
// в песочнице он едет внутри QR, чтобы киоск на другом устройстве мог проверить подпись без общего сервера.
import { sign, type StoredKey } from "./deviceKey";

export const QR_WINDOW_SEC = 30;
export const currentWindow = (now = Date.now()) => Math.floor(now / 1000 / QR_WINDOW_SEC);
export const windowEndsAt = (w: number) => (w + 1) * QR_WINDOW_SEC * 1000;
export const signedMessage = (workerId: string, deviceId: string, window: number) => `v1|${workerId}|${deviceId}|${window}`;

export type PassQr = { workerId: string; deviceId: string; window: number; signature: string; publicKey: string };

export const buildPassQr = async (key: StoredKey, window = currentWindow()) => {
  const signature = await sign(key.privateKey, signedMessage(key.workerId, key.deviceId, window));
  return ["PX1", key.workerId, key.deviceId, window, signature, key.publicKey].join(".");
};

export const parsePassQr = (raw: string): PassQr | null => {
  const parts = raw.trim().split(".");
  if (parts.length !== 6 || parts[0] !== "PX1") return null;
  const window = Number(parts[3]);
  if (!Number.isInteger(window)) return null;
  return { workerId: parts[1], deviceId: parts[2], window, signature: parts[4], publicKey: parts[5] };
};
