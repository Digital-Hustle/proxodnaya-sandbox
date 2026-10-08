import { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowRight, ScanLine, LayoutGrid } from "lucide-react";
import { Logo, ThemeSwitcher, Status, Button, AnimatedNumber } from "@/shared/ui";
import { DEMO_INVITES, useDb, presenceNow, dailyStats } from "@/shared/api";
import { todayKey } from "@/shared/lib";
import { routes, absoluteUrl } from "@/shared/const/router";
import { fadeUp, stagger, lift, spring, inView, duration } from "@/shared/config/motion";

const KioskArt = () => (
  <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-md bg-inverse">
    <div className="relative size-20">
      {["left-0 top-0 border-l-2 border-t-2 rounded-tl-sm", "right-0 top-0 border-r-2 border-t-2 rounded-tr-sm", "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm", "bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm"].map((c) => (
        <span key={c} className={`absolute size-5 border-inverse-foreground ${c}`} />
      ))}
      <motion.span className="absolute inset-x-2 h-0.5 rounded-full bg-brand-gradient" animate={{ top: ["15%", "85%", "15%"] }} transition={{ duration: duration.loop, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  </div>
);

const PhoneArt = () => (
  <div className="flex h-36 items-center justify-center rounded-md bg-surface">
    <div className="flex w-28 flex-col items-center gap-2 rounded-md bg-card p-2.5 shadow-card">
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface"><motion.div className="h-full origin-left bg-brand-gradient" animate={{ scaleX: [1, 0.15, 1] }} transition={{ duration: duration.loop * 2, repeat: Infinity, ease: "easeInOut" }} /></div>
      <div className="rounded-xs bg-white p-1.5"><QRCodeSVG value="PX1.demo" size={64} marginSize={0} /></div>
    </div>
  </div>
);

const BARS = [0.45, 0.7, 0.55, 0.9, 0.62, 0.8, 0.38];
const AdminArt = () => (
  <div className="flex h-36 items-end gap-2 rounded-md bg-surface px-5 pb-5 pt-8">
    {BARS.map((h, i) => (
      <motion.span key={i} className={i === 3 ? "flex-1 origin-bottom rounded-t-xs bg-brand" : "flex-1 origin-bottom rounded-t-xs bg-border-strong"}
        style={{ height: `${h * 100}%` }} initial={{ scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true }} transition={{ ...spring.bar, delay: i * 0.05 }} />
    ))}
  </div>
);

const ZONES = [
  { to: routes.kiosk, art: KioskArt, title: "Киоск на проходной", text: "Скан QR, проверка живости и вердикт за пару секунд", device: "Ноутбук или планшет с камерой" },
  { to: routes.worker, art: PhoneArt, title: "Телефон рабочего", text: "Код меняется каждые 30 секунд и работает без интернета", device: "Откройте на телефоне" },
  { to: routes.admin, art: AdminArt, title: "Админка прораба", text: "Кто на объекте, журнал, смены, аналитика и помощник", device: "Компьютер или планшет" },
];

export const HomePage = () => {
  const db = useDb();
  const onSite = useMemo(() => presenceNow(db).length, [db]);
  const [today] = useMemo(() => dailyStats(db, [todayKey()]), [db]);
  const stats = [
    { value: onSite, label: "на объекте сейчас" },
    { value: today.allow, label: "проходов сегодня" },
    { value: db.workers.length, label: "человек в базе" },
    { value: 30, label: "секунд живёт QR" },
  ];

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-160 bg-glow" />
      <header className="sticky top-0 z-nav px-3 pt-safe sm:px-6">
        <div className="mx-auto mt-2 flex h-14 max-w-6xl items-center gap-3 rounded-lg bg-card/90 px-2.5 shadow-float backdrop-blur-md sm:mt-3 sm:h-16 sm:px-3">
          <Logo className="px-1" />
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {ZONES.map((z) => <Link key={z.to} to={z.to} className="rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-fast hover:bg-surface hover:text-foreground">{z.title.split(" ")[0]}</Link>)}
          </nav>
          <ThemeSwitcher className="ml-auto" />
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <motion.section variants={stagger(0.07)} initial="hidden" animate="show" className="flex flex-col items-center pb-10 pt-12 text-center sm:pb-14 sm:pt-20">
          <motion.div variants={fadeUp}><Status tone="success" dot>Кейс «Проходная» · песочница на моках</Status></motion.div>
          <motion.h1 variants={fadeUp} className="mt-5 max-w-4xl text-balance font-display text-4xl font-medium tracking-display sm:text-5xl lg:text-6xl">
            Проход на стройку без чужих пропусков
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Телефон рабочего показывает живой QR, киоск сверяет лицо, прораб видит всё в реальном времени. Бэкенд — моки в браузере: откройте киоск и админку в разных вкладках.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-7 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3">
            <Link to={routes.kiosk} tabIndex={-1}><Button size="lg" block><ScanLine />Открыть киоск</Button></Link>
            <Link to={routes.admin} tabIndex={-1}><Button size="lg" variant="secondary" block className="bg-card shadow-xs hover:bg-muted"><LayoutGrid />Админка</Button></Link>
          </motion.div>
        </motion.section>

        <motion.section {...inView} className="rounded-lg bg-card shadow-card sm:rounded-xl">
          <dl className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col gap-1 px-5 py-5 sm:px-8 sm:py-7 ${i % 2 ? "border-l border-border" : ""} ${i > 1 ? "border-t border-border lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                <dt className="order-2 text-sm text-muted-foreground">{s.label}</dt>
                <dd className="font-display text-3xl font-medium tabular-nums tracking-display sm:text-4xl"><AnimatedNumber value={s.value} /></dd>
              </div>
            ))}
          </dl>
        </motion.section>

        <section className="mt-12 sm:mt-16">
          <motion.h2 {...inView} className="mb-5 text-balance font-display text-2xl font-medium tracking-display sm:mb-6 sm:text-3xl">Три места системы</motion.h2>
          <motion.div variants={stagger(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {ZONES.map(({ to, art: Art, title, text, device }) => (
              <motion.div key={to} variants={fadeUp}>
                <motion.div {...lift} className="h-full">
                  <Link to={to} className="group flex h-full flex-col gap-4 rounded-lg bg-card p-3 shadow-card outline-none transition-shadow duration-base hover:shadow-float focus-visible:ring-2 focus-visible:ring-ring sm:rounded-xl sm:p-4">
                    <Art />
                    <div className="flex flex-1 flex-col gap-1.5 px-1">
                      <h3 className="font-display text-xl font-medium tracking-display">{title}</h3>
                      <p className="text-pretty text-sm text-muted-foreground">{text}</p>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-border px-1 pt-3 text-sm text-muted-foreground">
                      <span className="truncate">{device}</span>
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-foreground transition-colors duration-fast group-hover:bg-primary group-hover:text-primary-foreground"><ArrowRight className="size-4" /></span>
                    </div>
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        <motion.section {...inView} className="mt-12 grid gap-6 rounded-lg bg-card p-5 shadow-card sm:mt-16 sm:rounded-xl sm:p-8 md:grid-cols-5 md:gap-10">
          <div className="flex flex-col items-center gap-3 md:col-span-2 md:items-start">
            <div className="rounded-lg bg-white p-4 shadow-card"><QRCodeSVG value={absoluteUrl(routes.worker)} size={168} marginSize={0} /></div>
            <p className="text-center text-sm text-muted-foreground md:text-left">Наведите камеру телефона — откроется пропуск</p>
          </div>
          <div className="min-w-0 md:col-span-3">
            <h2 className="text-balance font-display text-2xl font-medium tracking-display sm:text-3xl">Пощупать за две минуты</h2>
            <ol className="mt-5 flex flex-col">
              {[
                <>Привяжите телефон кодом {DEMO_INVITES.map((c, i) => <span key={c}>{i ? " или " : " "}<code className="rounded-xs bg-surface px-1.5 py-0.5 font-mono text-sm text-foreground">{c}</code></span>)}. Или заведите сотрудника в админке и отсканируйте его приглашение.</>,
                <>Откройте киоск на ноутбуке и покажите QR с телефона. Второго устройства нет — нажмите «Демо» на киоске.</>,
                <>В демо-пульте попробуйте обмануть систему: повтор QR, старый скриншот, подделка, чужое лицо, фото.</>,
              ].map((t, i) => (
                <li key={i} className="flex gap-4 border-t border-border py-4 first:border-t-0 first:pt-0 last:pb-0">
                  <span className="w-7 shrink-0 font-display text-lg font-medium tabular-nums text-brand">0{i + 1}</span>
                  <span className="min-w-0 text-pretty text-base text-muted-foreground">{t}</span>
                </li>
              ))}
            </ol>
          </div>
        </motion.section>

        <footer className="mt-10 flex flex-col items-center justify-between gap-2 px-1 text-sm text-muted-foreground sm:flex-row">
          <span>Хакатон «СберБизнесВайб» · 2026</span>
          <span>Данные живут только в этом браузере</span>
        </footer>
      </main>
    </div>
  );
};
