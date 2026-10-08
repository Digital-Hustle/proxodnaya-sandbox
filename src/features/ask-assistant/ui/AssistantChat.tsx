import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Send, Sparkles, Settings2, Database } from "lucide-react";
import { assistant, type AssistantAnswer } from "@/shared/api";
import { Badge, Button, Input, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { fadeUp, spring } from "@/shared/config/motion";
import { LlmSettings } from "./LlmSettings";

type Msg = { id: number; role: "user" | "assistant"; text: string; answer?: AssistantAnswer; error?: boolean };

const SUGGEST = ["Кто сейчас на объекте?", "Кто опоздал сегодня?", "Почему были отказы за неделю?", "Сколько часов отработано за неделю?", "Что с Ивановым сегодня?"];

export const AssistantChat = ({ className }: { className?: string }) => {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(false);
  const [llm, setLlm] = useState(() => assistant.loadLlm());
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  const send = async (text = q) => {
    const t = text.trim();
    if (!t || busy) return;
    setQ("");
    const history = msgs.map((m) => ({ role: m.role, text: m.text }));
    setMsgs((m) => [...m, { id: Date.now(), role: "user", text: t }]);
    setBusy(true);
    try {
      const a = await assistant.ask(t, history);
      setMsgs((m) => [...m, { id: Date.now() + 1, role: "assistant", text: a.text, answer: a }]);
    } catch (e) {
      setMsgs((m) => [...m, { id: Date.now() + 1, role: "assistant", text: e instanceof Error ? e.message : "Ошибка", error: true }]);
    } finally { setBusy(false); }
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Badge tone={llm ? "success" : "neutral"}>{llm ? <><Sparkles />{llm.model}</> : <><Database />Без модели · правила</>}</Badge>
          <span className="hidden text-muted-foreground sm:inline">цифры — только из данных</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSettings(true)}><Settings2 />Модель</Button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {msgs.length === 0 && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="mx-auto flex max-w-xl flex-col items-center gap-5 py-10 text-center">
            <div className="flex size-16 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Sparkles className="size-8" /></div>
            <div>
              <div className="font-display text-2xl font-semibold">Помощник руководителя</div>
              <p className="mt-2 text-sm text-muted-foreground">Спросите про обстановку, опоздания, отказы или часы. Ответ — с таблицей и источниками.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGEST.map((s) => <Button key={s} variant="outline" size="sm" onClick={() => send(s)}>{s}</Button>)}
            </div>
          </motion.div>
        )}
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <AnimatePresence initial={false}>
            {msgs.map((m) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                {m.role === "user" ? (
                  <div className="max-w-md rounded-lg rounded-br-xs bg-primary px-4 py-3 text-base text-primary-foreground">{m.text}</div>
                ) : (
                  <div className={cn("w-full max-w-2xl rounded-lg rounded-bl-xs border bg-card p-4", m.error ? "border-destructive/40" : "border-border")}>
                    <p className={cn("whitespace-pre-wrap text-base", m.error && "text-destructive")}>{m.text}</p>
                    {m.answer?.table && m.answer.table.rows.length > 0 && (
                      <div className="mt-3 max-h-72 overflow-auto rounded-md border border-border">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-muted text-left text-muted-foreground"><tr>{m.answer.table.columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}</tr></thead>
                          <tbody>{m.answer.table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-3 py-2 tabular-nums">{c}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                    )}
                    {m.answer && m.answer.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">Источники: {m.answer.sources.map((s) => <Badge key={s}>{s}</Badge>)}</div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner className="size-4" />Считаю по данным…</div>}
          <div ref={end} />
        </div>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2 border-t border-border p-4">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Например: кто опоздал сегодня?" />
        <Button type="submit" size="icon-lg" disabled={!q.trim() || busy} aria-label="Отправить"><Send /></Button>
      </form>
      <LlmSettings open={settings} onClose={() => { setSettings(false); setLlm(assistant.loadLlm()); }} />
    </div>
  );
};
