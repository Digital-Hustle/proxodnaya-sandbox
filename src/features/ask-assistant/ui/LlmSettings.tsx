import { useState } from "react";
import { assistant } from "@/shared/api";
import { Button, Dialog, Field, Input, toast } from "@/shared/ui";

const PRESETS = [
  { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
  { name: "Qwen", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", model: "qwen-plus" },
  { name: "GLM", baseUrl: "https://api.z.ai/api/paas/v4", model: "glm-4.6" },
  { name: "Ollama", baseUrl: "http://localhost:11434/v1", model: "qwen2.5:7b" },
];

/** Подключение модели. Ключ хранится только в localStorage этого браузера; для общего стенда — URL своего прокси без ключа. */
export const LlmSettings = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const cur = assistant.loadLlm();
  const [baseUrl, setBaseUrl] = useState(cur?.baseUrl ?? "");
  const [model, setModel] = useState(cur?.model ?? "");
  const [apiKey, setApiKey] = useState(cur?.apiKey ?? "");
  return (
    <Dialog open={open} onClose={onClose} title="Языковая модель" description="Подходит любой OpenAI-совместимый API с поддержкой вызова инструментов">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Шаблоны</span>
          <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <Button key={p.name} size="sm" variant="outline" onClick={() => { setBaseUrl(p.baseUrl); setModel(p.model); }}>{p.name}</Button>)}</div>
        </div>
        <Field label="Base URL"><Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…/v1" /></Field>
        <Field label="Модель"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="deepseek-chat" /></Field>
        <Field label="Ключ API" hint="Хранится только в этом браузере. При работе через прокси не требуется."><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" autoComplete="off" /></Field>
        <p className="rounded-md bg-muted px-3 py-2.5 text-sm text-muted-foreground">Без модели помощник отвечает по встроенным правилам — также только по данным системы.</p>
        <div className="flex justify-between gap-2 pt-1">
          <Button variant="ghost" onClick={() => { assistant.saveLlm(null); toast.info("Модель отключена, работают правила"); onClose(); }}>Отключить</Button>
          <Button disabled={!baseUrl || !model} onClick={() => { assistant.saveLlm({ baseUrl, model, apiKey }); toast.success("Модель подключена"); onClose(); }}>Сохранить</Button>
        </div>
      </div>
    </Dialog>
  );
};
