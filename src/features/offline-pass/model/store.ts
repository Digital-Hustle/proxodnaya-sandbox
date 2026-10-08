import { create } from "zustand";
import type { OfflineEvent, OfflineSnapshot } from "@/shared/api";

// Хранилище терминала (ADR-042): снимок допусков с сервера, очередь проходов без связи и погашенные коды.
// Живёт на самом устройстве и переживает перезагрузку — иначе один и тот же QR можно было бы предъявить после рестарта.
const SNAP = "proxodnaya.kiosk.snapshot";
const QUEUE = "proxodnaya.kiosk.queue";
const USED = "proxodnaya.kiosk.used";
const USED_MAX = 2000;

const read = <T,>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const write = (k: string, v: unknown) => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* квота хранилища: снимок без фото невелик */ }
};

type OfflinePassState = {
  snapshot: OfflineSnapshot | null;
  queue: OfflineEvent[];
  used: string[];
  setSnapshot: (s: OfflineSnapshot) => void;
  push: (e: OfflineEvent) => void;
  dropSynced: (ids: string[]) => void;
  reset: () => void;
};

export const useOfflinePass = create<OfflinePassState>((set, get) => ({
  snapshot: read<OfflineSnapshot | null>(SNAP, null),
  queue: read<OfflineEvent[]>(QUEUE, []),
  used: read<string[]>(USED, []),
  setSnapshot: (snapshot) => { write(SNAP, snapshot); set({ snapshot }); },
  push: (e) => {
    const queue = [...get().queue, e];
    const used = e.useKey ? [...get().used, e.useKey].slice(-USED_MAX) : get().used;
    write(QUEUE, queue); write(USED, used);
    set({ queue, used });
  },
  dropSynced: (ids) => {
    const queue = get().queue.filter((e) => !ids.includes(e.id));
    write(QUEUE, queue);
    set({ queue });
  },
  reset: () => {
    [SNAP, QUEUE, USED].forEach((k) => localStorage.removeItem(k));
    set({ snapshot: null, queue: [], used: [] });
  },
}));

/** Сколько ещё терминал может пропускать сам: срок считается от момента последнего снимка. */
export const localLeftMs = (s: OfflineSnapshot | null, now = Date.now()) => (s ? Math.max(0, s.at + s.rules.maxHours * 3600000 - now) : 0);
