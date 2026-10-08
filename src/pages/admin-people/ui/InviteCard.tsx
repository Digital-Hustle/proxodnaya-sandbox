import { QRCodeSVG } from "qrcode.react";
import { Copy, ExternalLink } from "lucide-react";
import type { Worker } from "@/shared/api";
import { Button, toast } from "@/shared/ui";
import { inviteLink } from "../lib/invite";

export const InviteCard = ({ w }: { w: Worker }) => {
  if (!w.inviteCode) return null;
  const link = inviteLink(w);
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="rounded-lg bg-white p-4 shadow-card"><QRCodeSVG value={link} size={208} marginSize={0} /></div>
      <div>
        <div className="text-sm text-muted-foreground">Код приглашения</div>
        <div className="font-mono text-3xl font-semibold tracking-widest">{w.inviteCode}</div>
      </div>
      <p className="max-w-xs text-sm text-muted-foreground">Сотрудник сканирует QR камерой телефона — откроется приложение и привяжет телефон. Код одноразовый.</p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Ссылка скопирована"))}><Copy />Ссылка</Button>
        <a href={link} target="_blank" rel="noreferrer"><Button variant="ghost" size="sm"><ExternalLink />Открыть</Button></a>
      </div>
    </div>
  );
};
