import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, Settings2, Users, AlarmClock, ShieldAlert, Timer, UserSearch } from "lucide-react";
import { assistant, type AssistantAnswer } from "@/shared/api";
import { Badge, Button, LogoMark, Spinner } from "@/shared/ui";
import { cn } from "@/shared/lib";
import { fadeUp, press, spring, stagger } from "@/shared/config/motion";
import { LlmSettings } from "./LlmSettings";

type Msg = { id: number; role: "user" | "assistant"; text: string; answer?: AssistantAnswer; error?: boolean };

const SUGGEST = [
  { q: "Кто сейчас на объекте?", icon: Users },
  { q: "Кто опоздал сегодня?", icon: AlarmClock },
  { q: "Почему были отказы за неделю?", icon: ShieldAlert },
  { q: "Сколько часов отработано за неделю?", icon: Timer },
  { q: "Что с Ивановым сегодня?", icon: UserSearch },
];

const Table = ({ t }: { t: NonNullable<AssistantAnswer["table"]> }) => (
  <div className="max-h-72 overflow-auto rounded-md bg-card ring-1 ring-border">
    <table className="w-full text-sm">
      <thead className="sticky top-0 bg-muted text-left text-muted-foreground"><tr>{t.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">{c}</th>)}</tr></thead>
      <tbody>{t.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className="px-3 py-2 tabular-nums">{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
);

/** Чат помощника: лента сообщений по центру, поле ввода — плавающая пилюля внизу. Цифры — только из данных. */
export const AssistantChat = ({ className }: { className?: string }) => {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState(false);
  const [llm, setLlm] = useState(() => assistant.loadLlm());
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { const el = scroller.current; if (msgs.length) el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [msgs, busy]);

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
      setMsgs((m) => [...m, { id: Date.now() + 1, role: "assistant", text: e instanceof Error ? e.message : "Не удалось получить ответ", error: true }]);
    } finally { setBusy(false); input.current?.focus(); }
  };

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
        <LogoMark className="size-9" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">Помощник руководителя</div>
          <div className="truncate text-xs text-muted-foreground">{llm ? `Модель ${llm.model}` : "Режим правил · без языковой модели"}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSettings(true)}><Settings2 /><span className="hidden sm:inline">Модель</span></Button>
      </div>

      <div ref={scroller} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        {msgs.length === 0 ? (
          <motion.div variants={stagger(0.05)} initial="hidden" animate="show" className="mx-auto flex min-h-full max-w-3xl flex-col justify-center gap-6">
            <motion.div variants={fadeUp} className="flex flex-col gap-2">
              <h2 className="font-display text-2xl font-semibold tracking-display sm:text-3xl">Чем помочь?</h2>
              <p className="hidden text-base text-muted-foreground sm:block">Задайте вопрос об обстановке, опозданиях, отказах или отработанных часах. Каждый ответ сопровождается таблицей и источниками.</p>
            </motion.div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGEST.map(({ q: s, icon: Icon }, i) => (
                <motion.button key={s} type="button" variants={fadeUp} {...press} onClick={() => send(s)}
                  className={cn("flex min-h-control-lg items-center gap-3 rounded-md bg-muted px-3.5 py-3 text-left text-sm font-medium outline-none transition-colors duration-fast hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring", i > 2 && "hidden sm:flex")}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-card text-brand shadow-xs"><Icon className="size-4" /></span>{s}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            <AnimatePresence initial={false}>
              {msgs.map((m) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring.soft}
                  className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}>
                  {m.role === "user" ? (
                    <div className="ml-10 max-w-md whitespace-pre-wrap rounded-lg rounded-br-xs bg-primary px-4 py-2.5 text-base text-primary-foreground">{m.text}</div>
                  ) : (<>
                    <LogoMark className="mt-0.5 hidden size-8 sm:flex" />
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <p className={cn("whitespace-pre-wrap text-base leading-relaxed", m.error && "text-destructive")}>{m.text}</p>
                      {m.answer?.table && m.answer.table.rows.length > 0 && <Table t={m.answer.table} />}
                      {m.answer && m.answer.sources.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">Источники:{m.answer.sources.map((s) => <Badge key={s}>{s}</Badge>)}</div>
                      )}
                    </div>
                  </>)}
                </motion.div>
              ))}
            </AnimatePresence>
            {busy && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <LogoMark className="hidden size-8 sm:flex" /><Spinner className="size-4" />Собираю данные…
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 pb-3 sm:px-5 sm:pb-5">
        <form onSubmit={(e) => { e.preventDefault(); send(); }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-lg bg-muted p-1.5 pl-4 ring-1 ring-border transition-shadow duration-fast focus-within:ring-2 focus-within:ring-ring">
          <textarea ref={input} rows={1} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Вопрос помощнику"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Задайте вопрос…"
            className="field-sizing-content max-h-40 min-h-control-md flex-1 resize-none bg-transparent py-2.5 text-base outline-none placeholder:text-subtle-foreground" />
          <Button type="submit" size="icon" variant="brand" disabled={!q.trim() || busy} aria-label="Отправить" className="rounded-md"><ArrowUp /></Button>
        </form>
      </div>
      <LlmSettings open={settings} onClose={() => { setSettings(false); setLlm(assistant.loadLlm()); }} />
    </div>
  );
};
