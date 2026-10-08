import { WifiOff } from "lucide-react";
import { Skeleton, StyledQr, CountdownBar } from "@/shared/ui";
import { windowEndsAt, QR_WINDOW_SEC } from "@/shared/lib";
import { usePassQr } from "../model/usePassQr";

/**
 * QR пропуска на белой плашке (тёмное на белом в обеих темах — так его читает любая камера) и полоса отсчёта.
 * Подпись ставится на телефоне, поэтому код меняется и без сети. При смене код перестраивается волной от центра.
 */
export const PassQr = ({ slot = "phone" }: { slot?: string }) => {
  const { qr, left } = usePassQr(slot);
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full max-w-72 rounded-lg bg-white p-4 shadow-card ring-1 ring-border">
        {qr ? <StyledQr value={qr.value} morph label="QR-код пропуска" className="w-full" /> : <Skeleton className="aspect-square w-full rounded-sm" />}
      </div>
      <div className="flex w-full max-w-72 flex-col gap-2">
        {qr ? <CountdownBar endsAt={windowEndsAt(qr.window)} total={QR_WINDOW_SEC * 1000} /> : <div className="h-1.5 rounded-full bg-surface" />}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>Обновится через <span className="font-medium tabular-nums text-foreground">{Math.ceil(left)} с</span></span>
          <span className="inline-flex items-center gap-1"><WifiOff className="size-3.5" />Работает без сети</span>
        </div>
      </div>
    </div>
  );
};
