import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { duration, ease } from "@/shared/config/motion";

// Одна и та же кривая из четырёх кубических сегментов: в виде отрезка (все точки на одной высоте) и в виде круга.
// Совпадающая структура пути позволяет плавно «надуть» линию в кольцо и сдуть обратно, без подмены элементов.
const line = (y: number) =>
  `M 50 ${y} C 68 ${y} 86 ${y} 86 ${y} C 86 ${y} 68 ${y} 50 ${y} C 32 ${y} 14 ${y} 14 ${y} C 14 ${y} 32 ${y} 50 ${y}`;
const RING = "M 50 20 C 66.57 20 80 33.43 80 50 C 80 66.57 66.57 80 50 80 C 33.43 80 20 66.57 20 50 C 20 33.43 33.43 20 50 20";
const CHECK = "M 36 51 L 46 61 L 65 41";
const TOP = 16;
const BOTTOM = 84;

const glide = { duration: duration.loop / 2, ease: ease.inOut };
const settle = { duration: duration.slow * 1.4, ease: ease.inOut };
const morph = { duration: duration.slow * 1.8, ease: ease.inOut };
const draw = { duration: duration.slow * 1.2, ease: ease.out };
const erase = { duration: duration.slow, ease: ease.in, delay: duration.loop / 2 };

type Step = { d: string; check: 0 | 1; t: { duration: number; ease: readonly [number, number, number, number]; delay?: number } };

/** Цикл: луч дважды проходит рамку → собирается в центр → раскрывается в кольцо → галочка → обратно в луч. */
const STEPS: Step[] = [
  { d: line(BOTTOM), check: 0, t: glide },
  { d: line(TOP), check: 0, t: glide },
  { d: line(BOTTOM), check: 0, t: glide },
  { d: line(50), check: 0, t: settle },
  { d: RING, check: 0, t: morph },
  { d: RING, check: 1, t: draw },
  { d: RING, check: 0, t: erase },
  { d: line(50), check: 0, t: morph },
  { d: line(TOP), check: 0, t: settle },
];

/** Знак сканера для экрана «Покажите QR-пропуск». Без свечения: только линия, кольцо и галочка. */
export const ScanMark = ({ children }: { children?: ReactNode }) => {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const step = STEPS[i];
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setI((x) => (x + 1) % STEPS.length), (step.t.duration + (step.t.delay ?? 0)) * 1000);
    return () => clearTimeout(t);
  }, [i, reduce, step]);
  const ring = i >= 4 && i <= 6;
  return (
    <>
      {children && (
        <motion.div className="absolute inset-0 flex items-center justify-center text-white/50" initial={false}
          animate={{ opacity: ring ? 0 : 1, scale: ring ? 0.9 : 1 }} transition={morph}>{children}</motion.div>
      )}
      <svg aria-hidden viewBox="0 0 100 100" fill="none" className="absolute inset-0 size-full overflow-visible">
        <motion.path d={reduce ? line(50) : line(TOP)} initial={false} animate={reduce ? undefined : { d: step.d }} transition={step.t}
          className="stroke-white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <motion.path d={CHECK} initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: step.check, opacity: step.check }} transition={step.t}
          className="stroke-brand" strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
};
