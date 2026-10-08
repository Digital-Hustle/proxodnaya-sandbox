import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { KeyRound } from "lucide-react";
import { api, DEMO_INVITES } from "@/shared/api";
import { Button, Spinner, toast } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { tween } from "@/shared/config/motion";

const LEN = 6;

/** Активация телефона по коду приглашения. Ключ создаётся на устройстве, наружу — только публичный. */
export const ActivateForm = ({ initialCode = "", payload, onDone }: { initialCode?: string; payload?: string; onDone: () => void }) => {
  const [code, setCode] = useState(initialCode.toUpperCase().slice(0, LEN));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const submit = async (c = code) => {
    if (c.length !== LEN || busy) return;
    setBusy(true); setError(null);
    try {
      const w = await api.activateDevice(c, payload);
      toast.success(`Телефон привязан: ${w.fullName}`);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не получилось");
    } finally { setBusy(false); }
  };

  useEffect(() => { if (initialCode.length === LEN) submit(initialCode.toUpperCase()); /* авто по ссылке */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex size-16 items-center justify-center rounded-lg bg-accent text-accent-foreground"><KeyRound className="size-8" /></div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-semibold">Код приглашения</h1>
        <p className="mt-2 text-base text-muted-foreground">6 символов из QR или от администратора</p>
      </div>
      <motion.button type="button" onClick={() => input.current?.focus()} animate={error ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }} transition={tween.base} className="relative flex gap-2">
        {Array.from({ length: LEN }, (_, i) => (
          <span key={i} className={cn("flex h-control-xl w-12 items-center justify-center rounded-md border-2 bg-card font-display text-3xl font-semibold transition-colors duration-fast",
            error ? "border-destructive" : i === code.length ? "border-ring" : code[i] ? "border-border" : "border-border/60")}>{code[i] ?? ""}</span>
        ))}
        <input ref={input} value={code} autoFocus inputMode="text" autoCapitalize="characters" autoComplete="one-time-code" aria-label="Код приглашения"
          onChange={(e) => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, LEN); setCode(v); setError(null); if (v.length === LEN) submit(v); }}
          className="absolute inset-0 opacity-0" />
      </motion.button>
      {error && <p className="max-w-xs text-center text-sm text-destructive">{error}</p>}
      <Button size="lg" className="w-full max-w-xs" disabled={code.length !== LEN || busy} onClick={() => submit()}>{busy ? <Spinner /> : "Привязать телефон"}</Button>
      <div className="text-center text-xs text-muted-foreground">Демо-коды: {DEMO_INVITES.map((c) => <button key={c} className="mx-1 font-mono font-semibold text-accent-foreground underline" onClick={() => { setCode(c); submit(c); }}>{c}</button>)}</div>
    </div>
  );
};
