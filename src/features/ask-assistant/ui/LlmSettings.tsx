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
    <Dialog open={open} onClose={onClose} title="Модель помощника">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Любой OpenAI-совместимый API с вызовом инструментов. Без настройки помощник отвечает правилами — тоже только по данным.</p>
        <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <Button key={p.name} size="sm" variant="outline" onClick={() => { setBaseUrl(p.baseUrl); setModel(p.model); }}>{p.name}</Button>)}</div>
        <Field label="Base URL"><Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://…/v1" /></Field>
        <Field label="Модель"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="deepseek-chat" /></Field>
        <Field label="Ключ API" hint="Остаётся только в этом браузере. Через прокси стенда ключ не нужен."><Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-…" autoComplete="off" /></Field>
        <div className="flex justify-between gap-2 pt-2">
          <Button variant="ghost" onClick={() => { assistant.saveLlm(null); toast.info("Помощник работает без модели"); onClose(); }}>Отключить</Button>
          <Button disabled={!baseUrl || !model} onClick={() => { assistant.saveLlm({ baseUrl, model, apiKey }); toast.success("Модель подключена"); onClose(); }}>Сохранить</Button>
        </div>
      </div>
    </Dialog>
  );
};
