// QR со стилем: соседние модули сливаются в группы со скруглёнными краями (см. shared/lib/qrShape),
// глазки — скруглённые квадраты, в центре — знак «Проходной». Тёмное на белом: сканируется камерой киоска и телефоном.
import { useId, useMemo } from "react";
import { palette as P } from "@/shared/config/tokens";
import { cn, qrShape } from "@/shared/lib";

export const StyledQr = ({ value, className, mark = true, label = "QR-код" }: { value: string; className?: string; mark?: boolean; label?: string }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = useMemo(() => qrShape(value, { level: "M", holeRatio: mark ? 0.2 : 0 }), [value, mark]);
  const n = s.size, c = n / 2, m = s.hole - 1.2;
  return (
    <svg viewBox={`0 0 ${n} ${n}`} role="img" aria-label={label} className={cn("block aspect-square", className)}>
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={P.green[900]} /><stop offset="1" stopColor={P.sber.ocean} />
        </linearGradient>
        <linearGradient id={`m${id}`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor={P.sber.spring} /><stop offset="0.45" stopColor={P.sber.green} /><stop offset="1" stopColor={P.sber.lagoon} />
        </linearGradient>
      </defs>
      <path d={s.body} fill={`url(#b${id})`} />
      <path d={s.finders.ring} fill={P.green[800]} fillRule="evenodd" />
      <path d={s.finders.eye} fill={P.green[800]} />
      {mark && s.hole > 0 && (
        <g>
          <rect x={c - m / 2} y={c - m / 2} width={m} height={m} rx={m * 0.32} fill={`url(#m${id})`} />
          <path d={`M${c - m * 0.24} ${c + m * 0.02}l${m * 0.15} ${m * 0.15}l${m * 0.3} -${m * 0.32}`} fill="none" stroke={P.white} strokeWidth={m * 0.12} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};
