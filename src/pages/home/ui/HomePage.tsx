import { Link } from "react-router";
import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { ScanLine, Smartphone, LayoutDashboard, ArrowRight, FlaskConical } from "lucide-react";
import { Aurora, Logo, ThemeToggle, Badge } from "@/shared/ui";
import { DEMO_INVITES } from "@/shared/api";
import { routes, absoluteUrl } from "@/shared/const/router";
import { fadeUp, stagger, press } from "@/shared/config/motion";

const ZONES = [
  { to: routes.kiosk, icon: ScanLine, title: "Киоск", text: "Проходная: скан QR, проверка живости, вердикт за 2 секунды", device: "ноутбук или планшет с камерой" },
  { to: routes.worker, icon: Smartphone, title: "Телефон рабочего", text: "Активация по коду, динамический QR без интернета, статус и смены", device: "откройте на телефоне" },
  { to: routes.admin, icon: LayoutDashboard, title: "Админка", text: "Обстановка, люди, журнал, смены, аналитика и помощник", device: "десктоп или планшет" },
];

export const HomePage = () => (
  <div className="relative min-h-dvh overflow-hidden">
    <Aurora intensity={0.55} />
    <div className="absolute inset-0 bg-background/40" />
    <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-5 pb-10 pt-safe sm:px-8">
      <header className="flex items-center justify-between py-5">
        <Logo />
        <div className="flex items-center gap-2"><Badge tone="warning"><FlaskConical />Песочница на моках</Badge><ThemeToggle /></div>
      </header>
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="flex flex-1 flex-col justify-center gap-10 py-10">
        <motion.div variants={fadeUp} className="max-w-3xl">
          <h1 className="font-display text-4xl font-bold sm:text-6xl">Проход на стройку <span className="text-brand">без чужих пропусков</span></h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Черновой стенд кейса «Проходная»: весь бэкенд — моки в браузере, данные сохраняются локально. Откройте киоск в одной вкладке и админку в другой — обстановка обновится сама.</p>
        </motion.div>
        <div className="grid gap-4 md:grid-cols-3">
          {ZONES.map(({ to, icon: Icon, title, text, device }) => (
            <motion.div key={to} variants={fadeUp}>
              <motion.div {...press} className="h-full">
                <Link to={to} className="group flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-card backdrop-blur-md transition-colors duration-fast hover:border-ring">
                  <div className="flex size-14 items-center justify-center rounded-lg bg-brand-gradient-conic text-white shadow-sm"><Icon className="size-7" /></div>
                  <div>
                    <div className="font-display text-2xl font-semibold">{title}</div>
                    <p className="mt-2 text-base text-muted-foreground">{text}</p>
                  </div>
                  <div className="mt-auto flex items-center justify-between text-sm text-muted-foreground">{device}<ArrowRight className="size-5 text-brand transition-transform duration-fast group-hover:translate-x-1" /></div>
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>
        <motion.div variants={fadeUp} className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/80 p-6 backdrop-blur-md sm:flex-row sm:items-center">
          <div className="rounded-lg bg-white p-3 shadow-sm"><QRCodeSVG value={absoluteUrl(routes.worker)} size={128} marginSize={0} /></div>
          <div className="flex flex-col gap-2 text-base">
            <div className="font-display text-xl font-semibold">Как пощупать за 2 минуты</div>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>Отсканируйте QR телефоном → привяжите его кодом <b className="font-mono text-foreground">{DEMO_INVITES[0]}</b> (или создайте сотрудника в админке и отсканируйте его инвайт).</li>
              <li>Откройте киоск на ноутбуке и покажите в камеру QR с телефона. Нет второго устройства — «Демо-пропуск» на киоске.</li>
              <li>В демо-пульте попробуйте обмануть: повтор QR, старый скриншот, подделка, чужое лицо, фото.</li>
            </ol>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </div>
);
