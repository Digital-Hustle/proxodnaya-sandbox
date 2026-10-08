import type { Worker } from "@/shared/api";
import { jsonToB64u } from "@/shared/lib";
import { absoluteUrl, routes } from "@/shared/const/router";

/** Ссылка-инвайт. В песочнице несёт карточку сотрудника, чтобы телефон без общего сервера знал, кого привязывает. */
export const inviteLink = (w: Worker) =>
  absoluteUrl(`${routes.workerActivate}?c=${w.inviteCode}&p=${jsonToB64u({ id: w.id, fullName: w.fullName, position: w.position, contractor: w.contractor, zoneIds: w.zoneIds, code: w.inviteCode })}`);
