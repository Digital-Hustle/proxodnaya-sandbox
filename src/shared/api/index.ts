// Экспорт реального HTTP-клиента (замена моков).
// Используйте `import * as api from "@/shared/api"` — вызовы идут на реальный бэкенд.
// Моки остались в `./mock/` для справки и локального демо (import * as api from "@/shared/api/mock/server").
export * from "./types";
export { REASONS, SYSTEM_CODES } from "./mock/reasons";
export { DEMO_INVITES } from "./mock/seed";
// Реальный API-клиент
export * as api from "./client";
// SSE-хелперы
export { getStreamTicket, openSituationStream, openWorkerStream } from "./client";
// Помощник пока на моках (скоро появится адаптер)
export * as assistant from "./mock/assistant";
export type { AssistantAnswer, AssistantTable, LlmConfig } from "./mock/assistant";