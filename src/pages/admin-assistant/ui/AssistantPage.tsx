import { Card, PageHeader } from "@/shared/ui";
import { AssistantChat } from "@/features/ask-assistant";

export const AssistantPage = () => (
  <div className="flex flex-col">
    <PageHeader title="Помощник" sub="Отвечает только по данным журнала и смен; без модели — правилами" className="mb-4 sm:mb-5" />
    <Card className="flex h-chat flex-col overflow-hidden"><AssistantChat className="min-h-0 flex-1" /></Card>
  </div>
);
