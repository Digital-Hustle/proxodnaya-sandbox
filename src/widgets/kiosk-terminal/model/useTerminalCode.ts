import { useCallback, useEffect, useState } from "react";
import { useDb } from "@/shared/api";
import { checkTerminalCode, DEMO_CODES, type TerminalCodeKind } from "@/shared/lib";
import { useOfflinePass } from "@/features/offline-pass";

const TRIES = 5;
const LOCK_MS = 60_000;
const keyOf = (kind: TerminalCodeKind) => `proxodnaya.kiosk.codeLock.${kind}`;
type Lock = { fails: number; until: number };
const readLock = (kind: TerminalCodeKind): Lock => { try { return JSON.parse(localStorage.getItem(keyOf(kind)) ?? "") as Lock; } catch { return { fails: 0, until: 0 }; } };

/**
 * ADR-046: проверка кода на самом терминале. Хэш берётся с сервера, а без связи — из снимка допусков,
 * поэтому охранник может пропустить и офлайн. Не привязанный киоск знает только заводской сервисный код.
 * После 5 ошибок ввод блокируется на минуту — даже после перезагрузки страницы.
 */
export const useTerminalCode = (kind: TerminalCodeKind, { paired, offline = false }: { paired: boolean; offline?: boolean }) => {
  const db = useDb();
  const snap = useOfflinePass((s) => s.snapshot);
  const rec = !paired ? undefined : offline ? (snap?.codes ?? db.terminalCodes)?.[kind] : (db.terminalCodes ?? snap?.codes)?.[kind];
  const [lock, setLock] = useState(() => readLock(kind));
  const [now, setNow] = useState(() => Date.now());
  const lockedMs = Math.max(0, lock.until - now);
  useEffect(() => {
    if (!lockedMs) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [lockedMs]);

  const save = (l: Lock) => { localStorage.setItem(keyOf(kind), JSON.stringify(l)); setLock(l); setNow(Date.now()); };
  const check = useCallback(async (code: string) => {
    if (readLock(kind).until > Date.now()) return false;
    const ok = await checkTerminalCode(code, kind, rec);
    const cur = readLock(kind);
    if (ok) save({ fails: 0, until: 0 });
    else { const fails = cur.fails + 1; save(fails >= TRIES ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 }); }
    return ok;
  }, [kind, rec]);

  return {
    check,
    /** Сколько цифр ждать: у заданного кода длина известна, у заводского — 4. */
    digits: rec?.digits ?? DEMO_CODES[kind].length,
    /** Действует заводской код — показываем подсказку для демо и предупреждение в админке. */
    factory: !rec,
    lockedSec: Math.ceil(lockedMs / 1000),
    left: TRIES - lock.fails,
  };
};
