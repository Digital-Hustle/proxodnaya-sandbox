// Помощник руководителя. Два режима:
// 1) LLM по OpenAI-совместимому API с tool calling (ключ хранится только в этом браузере или за прокси);
// 2) «без модели» — разбор вопроса правилами. В обоих режимах цифры берутся только из инструментов (данных), не из модели.
import { getDb } from "./store";
import { buildIntervals, dailyStats, lastDays, presenceNow, refusalsByCode, shiftFor, workedMs } from "./derived";
import { REASONS } from "./reasons";
import { atTime, dayKey, durationRu, hhmm, todayKey } from "../../lib/time";

export type AssistantTable = { columns: string[]; rows: (string | number)[][] };
export type AssistantAnswer = { text: string; sources: string[]; table?: AssistantTable; mode: "llm" | "rules"; tools: string[] };

export type LlmConfig = { baseUrl: string; model: string; apiKey: string };
const LLM_KEY = "proxodnaya.sandbox.llm";
export const loadLlm = (): LlmConfig | null => { try { return JSON.parse(localStorage.getItem(LLM_KEY) ?? "null"); } catch { return null; } };
export const saveLlm = (c: LlmConfig | null) => (c ? localStorage.setItem(LLM_KEY, JSON.stringify(c)) : localStorage.removeItem(LLM_KEY));

const name = (id?: string) => getDb().workers.find((w) => w.id === id)?.fullName ?? "неизвестный";
const zoneName = (id: string) => getDb().zones.find((z) => z.id === id)?.name ?? id;

// ——— Инструменты (те же для LLM и для правил) ———
const TOOLS = {
  on_site_now: {
    description: "Кто сейчас на объекте: ФИО, зона, с какого времени",
    parameters: { type: "object", properties: {} },
    run: () => {
      const db = getDb();
      const p = presenceNow(db);
      return { count: p.length, people: p.map((x) => ({ name: name(x.workerId), zone: zoneName(x.zoneId), since: hhmm(x.since) })), capacity: db.zones.map((z) => ({ zone: z.name, inside: p.filter((x) => x.zoneId === z.id).length, capacity: z.capacity })) };
    },
  },
  late_today: {
    description: "Кто опоздал сегодня (вход позже начала смены более чем на 5 минут) и кто не пришёл",
    parameters: { type: "object", properties: {} },
    run: () => {
      const db = getDb();
      const day = todayKey();
      const late: { name: string; shift: string; entry: string; lateMin: number }[] = [];
      const absent: { name: string; shift: string }[] = [];
      for (const w of db.workers) {
        const sh = shiftFor(db, w.id, day);
        if (!sh || atTime(day, sh.start) > Date.now()) continue;
        const first = db.attempts.find((a) => a.workerId === w.id && dayKey(a.ts) === day && a.direction === "IN" && a.decision !== "DENY");
        if (!first) { absent.push({ name: w.fullName, shift: `${sh.start}–${sh.end}` }); continue; }
        const lateMin = Math.round((first.ts - atTime(day, sh.start)) / 60000);
        if (lateMin > 5) late.push({ name: w.fullName, shift: `${sh.start}–${sh.end}`, entry: hhmm(first.ts), lateMin });
      }
      return { late, absent };
    },
  },
  refusals: {
    description: "Отказы в проходе за N дней по причинам; system=true — проблемы качества системы, а не нарушения",
    parameters: { type: "object", properties: { days: { type: "integer", minimum: 1, maximum: 14 } } },
    run: ({ days = 7 }: { days?: number }) => {
      const from = atTime(lastDays(days)[0], "00:00");
      return { days, items: refusalsByCode(getDb(), from).map((r) => ({ ...r, text: REASONS[r.code].message })) };
    },
  },
  hours_worked: {
    description: "Отработанные часы по дням за N дней (сумма по всем), опоздания и переработки",
    parameters: { type: "object", properties: { days: { type: "integer", minimum: 1, maximum: 14 } } },
    run: ({ days = 7 }: { days?: number }) => ({ days: dailyStats(getDb(), lastDays(days)) }),
  },
  worker_today: {
    description: "Сводка по одному сотруднику за сегодня: смена, входы/выходы, отработано",
    parameters: { type: "object", properties: { query: { type: "string", description: "фамилия или часть ФИО" } }, required: ["query"] },
    run: ({ query }: { query: string }) => {
      const db = getDb();
      const q = query.toLowerCase();
      const w = db.workers.find((x) => x.fullName.toLowerCase().includes(q));
      if (!w) return { found: false };
      const day = todayKey();
      const sh = shiftFor(db, w.id, day);
      const events = db.attempts.filter((a) => a.workerId === w.id && dayKey(a.ts) === day).map((a) => ({ time: hhmm(a.ts), direction: a.direction === "IN" ? "вход" : "выход", decision: a.decision, reason: REASONS[a.code].message }));
      return { found: true, name: w.fullName, position: w.position, status: w.status, shift: sh ? `${sh.start}–${sh.end}` : "нет", worked: durationRu(workedMs(db, w.id, day, buildIntervals(db))), events };
    },
  },
} as const;
type ToolName = keyof typeof TOOLS;
const runTool = (n: string, args: unknown) => (n in TOOLS ? (TOOLS[n as ToolName].run as (a: unknown) => unknown)(args ?? {}) : { error: "unknown tool" });

// ——— Режим «без модели» ———
const rules = (q: string): AssistantAnswer => {
  const s = q.toLowerCase();
  const base = { mode: "rules" as const };
  if (/опозд|не приш|прогул/.test(s)) {
    const r = TOOLS.late_today.run();
    return { ...base, tools: ["late_today"], sources: ["журнал проходов за сегодня", "смены на сегодня"],
      text: `Сегодня опоздали ${r.late.length}, не пришли ${r.absent.length} из тех, чья смена уже началась.`,
      table: { columns: ["Сотрудник", "Смена", "Вход", "Опоздание, мин"], rows: [...r.late.map((x) => [x.name, x.shift, x.entry, x.lateMin]), ...r.absent.map((x) => [x.name, x.shift, "—", "не пришёл"])] } };
  }
  if (/отказ|не пуст|не прош|ошиб/.test(s)) {
    const r = TOOLS.refusals.run({ days: 7 });
    const total = r.items.reduce((a, b) => a + b.count, 0);
    const sys = r.items.filter((i) => i.system).reduce((a, b) => a + b.count, 0);
    return { ...base, tools: ["refusals"], sources: ["журнал проходов за 7 дней"],
      text: `За 7 дней ${total} отказов. Из них ${sys} — системные (качество кадра, лицо не найдено), остальные ${total - sys} — правомерные: правила и попытки пройти не по своему пропуску.`,
      table: { columns: ["Причина", "Кол-во", "Тип"], rows: r.items.map((i) => [i.text, i.count, i.system ? "системный" : "правомерный"]) } };
  }
  if (/час|отработ|переработ|табел/.test(s)) {
    const r = TOOLS.hours_worked.run({ days: 7 });
    const sum = r.days.reduce((a, b) => a + b.hours, 0);
    return { ...base, tools: ["hours_worked"], sources: ["интервалы присутствия", "смены"],
      text: `За 7 дней отработано ${Math.round(sum)} ч в пределах смен (±${getDb().settings.shiftGraceMin} мин допуска). Опозданий — ${r.days.reduce((a, b) => a + b.late, 0)}, переработок — ${r.days.reduce((a, b) => a + b.overtime, 0)}.`,
      table: { columns: ["День", "Часы", "Опоздания", "Переработки"], rows: r.days.map((d) => [d.day, d.hours, d.late, d.overtime]) } };
  }
  const who = getDb().workers.find((w) => s.includes(w.fullName.split(" ")[0].toLowerCase().slice(0, -1)));
  if (who) {
    const r = TOOLS.worker_today.run({ query: who.fullName.split(" ")[0] });
    if (r.found) return { ...base, tools: ["worker_today"], sources: ["журнал проходов за сегодня"],
      text: `${r.name}, ${r.position?.toLowerCase()}. Смена сегодня: ${r.shift}. Отработано: ${r.worked}.`,
      table: { columns: ["Время", "Направление", "Решение", "Причина"], rows: (r.events ?? []).map((e) => [e.time, e.direction, e.decision, e.reason]) } };
  }
  if (/сейчас|на объект|сколько.*(люд|челов)|кто/.test(s)) {
    const r = TOOLS.on_site_now.run();
    return { ...base, tools: ["on_site_now"], sources: ["журнал проходов (последний вход без выхода)"],
      text: `Сейчас на объекте ${r.count}. ${r.capacity.map((c) => `${c.zone}: ${c.inside}/${c.capacity}`).join(", ")}.`,
      table: { columns: ["Сотрудник", "Зона", "С"], rows: r.people.map((p) => [p.name, p.zone, p.since]) } };
  }
  return { ...base, tools: [], sources: [], text: "Без модели я понимаю вопросы про: кто сейчас на объекте, опоздания, отказы, отработанные часы и конкретного сотрудника по фамилии. Ответов «из головы» не даю — только по данным." };
};

// ——— Режим LLM ———
const SYSTEM = `Ты — помощник руководителя стройплощадки в системе «Проходная». Отвечай по-русски, кратко.
Любые числа и имена бери ТОЛЬКО из результатов инструментов. Если данных нет — так и скажи, не выдумывай.
Сегодня ${todayKey()}. В конце ответа не перечисляй инструменты.`;

type Msg = { role: string; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[]; tool_call_id?: string };

const llm = async (cfg: LlmConfig, question: string, history: { role: "user" | "assistant"; text: string }[]): Promise<AssistantAnswer> => {
  const messages: Msg[] = [{ role: "system", content: SYSTEM }, ...history.slice(-6).map((h) => ({ role: h.role, content: h.text })), { role: "user", content: question }];
  const tools = Object.entries(TOOLS).map(([n, t]) => ({ type: "function", function: { name: n, description: t.description, parameters: t.parameters } }));
  const used: string[] = [];
  let lastTable: AssistantTable | undefined;
  for (let step = 0; step < 4; step++) {
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) },
      body: JSON.stringify({ model: cfg.model, messages, tools, temperature: 0.2 }),
    });
    if (!res.ok) throw new Error(`LLM ответила ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const msg = (await res.json()).choices?.[0]?.message as Msg | undefined;
    if (!msg) throw new Error("Пустой ответ модели");
    if (!msg.tool_calls?.length) {
      return { mode: "llm", text: msg.content ?? "", tools: used, sources: used.map((u) => `инструмент ${u}`), table: lastTable };
    }
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });
    for (const c of msg.tool_calls) {
      let args: unknown = {};
      try { args = JSON.parse(c.function.arguments || "{}"); } catch { /* пустые аргументы */ }
      const out = runTool(c.function.name, args);
      used.push(c.function.name);
      lastTable = rules(c.function.name === "late_today" ? "опоздания" : c.function.name === "refusals" ? "отказы" : c.function.name === "hours_worked" ? "часы" : "кто сейчас").table;
      messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(out) });
    }
  }
  throw new Error("Модель не уложилась в 4 шага");
};

export const ask = async (question: string, history: { role: "user" | "assistant"; text: string }[] = []): Promise<AssistantAnswer> => {
  const cfg = loadLlm();
  if (!cfg?.baseUrl) {
    await new Promise((r) => setTimeout(r, 450));
    return rules(question);
  }
  return llm(cfg, question, history);
};
