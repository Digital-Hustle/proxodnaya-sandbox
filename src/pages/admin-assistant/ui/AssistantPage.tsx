import { Card } from "@/shared/ui";
import { AssistantChat } from "@/features/ask-assistant";
import { PageHeader } from "@/widgets/admin-shell";

export const AssistantPage = () => (
  <div className="flex h-full flex-col">
    <PageHeader title="Помощник" sub="Отвечает только по данным журнала и смен; без модели — правилами" />
    <Card className="flex h-dvh flex-col overflow-hidden"><AssistantChat className="flex-1" /></Card>
  </div>
);
