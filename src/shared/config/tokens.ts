// ЕДИНСТВЕННЫЙ источник дизайн-токенов «Проходной» (ADR-033).
// Из него генерируются src/app/styles/theme.css (Tailwind 4 @theme) и таблицы в docs/DESIGN.md:
// `npm run gen:tokens`. Руками theme.css не правим. Motion берёт значения отсюда через ./motion.ts.
//
// Визуальный язык — по живым сайтам Сбера 2026 (sberbank.ru/ru/person, /person_young):
// холодный мятно-серый фон, белые панели с крупными скруглениями, «чернильный» зеленовато-чёрный текст,
// SB Sans Display medium с плотным трекингом, плавающая шапка-пилюля, градиент зелёный→бирюзовый — только акцентом.
// Тёмная тема — графит футера Сбера, не чёрный. Обязательное от Сбера — зелёный и SB Sans (ADR-036).
// Только синтаксис, который стирается при strip-types: никаких enum/namespace/импортов.

/** Шкалы (сырые цвета). В компонентах НЕ используются — только через semantic. */
export const palette = {
  white: "#FFFFFF",
  black: "#08130B",
  /** «Чернила» Сбера: основной текст светлой темы */
  ink: { 900: "#172419", 700: "#3A453D", 600: "#5C665E", 400: "#8C9590" },
  /** Холодный мятно-серый (фон сайтов Сбера) */
  mist: { 25: "#F7F9F8", 50: "#F1F4F3", 100: "#EBEFEE", 150: "#E3E9E7", 200: "#D9E0DE", 300: "#C5CFCC", 400: "#A6B1AD" },
  /** Графит (футер Сбера) для тёмной темы */
  graphite: { 950: "#0E1013", 900: "#121417", 850: "#1A1D21", 800: "#212429", 750: "#292D33", 700: "#33383F", 600: "#454B53", 400: "#98A19D", 200: "#D5DBD8", 100: "#EDF1EF" },
  green: { 950: "#0B2614", 900: "#103A1F", 800: "#0B6B26", 700: "#0B7323", 650: "#0E8429", 600: "#0F7A2E", 500: "#21A038", 400: "#3FC86A", 300: "#7EE29A", 100: "#DDF3E2", 50: "#EEF9F0" },
  teal: { 500: "#14A3A8", 400: "#39C0C3", 300: "#7CD9DA" },
  amber: { 900: "#3A2A12", 800: "#8A4B00", 700: "#9A5200", 300: "#F5B86B", 100: "#FFF1DC" },
  red: { 900: "#3D1A1A", 800: "#B42318", 700: "#C9302C", 400: "#FF8A80", 300: "#FFB4AB", 100: "#FDECEA" },
  blue: { 900: "#17263D", 800: "#175CD3", 400: "#8AB4F8", 100: "#E8F0FE" },
  slate: { 500: "#6B7C8F", 400: "#8FA0B3" },
  /** Мастер-цвета брендбука Сбера: иллюстрации, градиенты, графики */
  sber: { green: "#21A038", sky: "#00ADEE", blue: "#0087CD", arctic: "#42E3B4", spring: "#A0E720", sun: "#FAED00", mint: "#54DC87", lagoon: "#39C0C3" },
} as const;

const p = palette;

/**
 * Семантические цвета → CSS-переменные `--<name>` и классы `bg-<name>`, `text-<name>` и т. д.
 * Пара `x` / `x-foreground` проверяется генератором на контраст WCAG (≥ 4.5:1),
 * исключения — в `contrastLargeTextOnly` с причиной.
 * Статусы — триадой: `-soft` (фон-тинт), `-soft-foreground` (текст на нём), `-border`; сплошные заливки — только danger-кнопка.
 */
export const semantic = {
  light: {
    background: p.mist[100],
    foreground: p.ink[900],
    card: p.white,
    "card-foreground": p.ink[900],
    popover: p.white,
    "popover-foreground": p.ink[900],
    surface: p.mist[150],                 // дорожка сегментов, заливка вторичных кнопок, утопленные блоки
    "surface-foreground": p.ink[900],
    "surface-hover": p.mist[200],
    muted: p.mist[50],                    // ховер строк, фон внутри карточек
    "muted-foreground": p.ink[600],
    "subtle-foreground": p.ink[400],      // только иконки и неважные подписи ≥ 14px
    border: p.mist[150],
    "border-strong": p.mist[300],
    input: p.mist[300],
    ring: p.green[500],
    primary: p.green[650],
    "primary-foreground": p.white,
    "primary-hover": p.green[700],
    brand: p.green[500],                  // «Зелёный СБЕР»: иконки, точки, крупный текст, графики
    accent: p.green[50],                  // активный пункт навигации, выделение
    "accent-foreground": p.green[800],
    success: p.green[500],
    "success-soft": p.green[100],
    "success-soft-foreground": p.green[800],
    "success-border": p.green[300],
    warning: p.amber[700],
    "warning-soft": p.amber[100],
    "warning-soft-foreground": p.amber[800],
    "warning-border": p.amber[300],
    danger: p.red[700],
    "danger-foreground": p.white,
    "danger-soft": p.red[100],
    "danger-soft-foreground": p.red[800],
    "danger-border": p.red[300],
    info: p.blue[800],
    "info-soft": p.blue[100],
    "info-soft-foreground": p.blue[800],
    "info-border": p.blue[400],
    inverse: p.ink[900],                  // тёмные плашки на светлом (киоск, подсказки)
    "inverse-foreground": p.mist[50],
    overlay: "rgb(23 36 25 / 0.36)",
    // экран вердикта киоска: глубокие тона, не кислотные; цвет по типу решения с сервера
    "decision-allow": p.green[600],
    "decision-allow-foreground": p.white,
    "decision-deny": p.red[800],
    "decision-deny-foreground": p.white,
    "decision-manual": p.amber[700],
    "decision-manual-foreground": p.white,
    "decision-error": p.graphite[750],
    "decision-error-foreground": p.white,
    "chart-1": p.sber.green,
    "chart-2": p.teal[500],
    "chart-3": p.green[300],
    "chart-4": p.slate[500],
    "chart-5": p.amber[700],
  },
  dark: {
    background: p.graphite[900],
    foreground: p.graphite[100],
    card: p.graphite[850],
    "card-foreground": p.graphite[100],
    popover: p.graphite[800],
    "popover-foreground": p.graphite[100],
    surface: p.graphite[800],
    "surface-foreground": p.graphite[100],
    "surface-hover": p.graphite[750],
    muted: p.graphite[800],
    "muted-foreground": p.graphite[400],
    "subtle-foreground": p.graphite[600],
    border: p.graphite[750],
    "border-strong": p.graphite[700],
    input: p.graphite[700],
    ring: p.green[400],
    primary: p.green[400],
    "primary-foreground": p.black,
    "primary-hover": p.green[300],
    brand: p.green[400],
    accent: p.green[950],
    "accent-foreground": p.green[300],
    success: p.green[400],
    "success-soft": p.green[900],
    "success-soft-foreground": p.green[300],
    "success-border": p.green[800],
    warning: p.amber[300],
    "warning-soft": p.amber[900],
    "warning-soft-foreground": p.amber[300],
    "warning-border": p.amber[800],
    danger: p.red[400],
    "danger-foreground": p.black,
    "danger-soft": p.red[900],
    "danger-soft-foreground": p.red[300],
    "danger-border": p.red[800],
    info: p.blue[400],
    "info-soft": p.blue[900],
    "info-soft-foreground": p.blue[400],
    "info-border": p.blue[800],
    inverse: p.graphite[100],
    "inverse-foreground": p.graphite[900],
    overlay: "rgb(0 0 0 / 0.6)",
    "decision-allow": p.green[600],
    "decision-allow-foreground": p.white,
    "decision-deny": p.red[800],
    "decision-deny-foreground": p.white,
    "decision-manual": p.amber[700],
    "decision-manual-foreground": p.white,
    "decision-error": p.graphite[750],
    "decision-error-foreground": p.white,
    "chart-1": p.green[400],
    "chart-2": p.teal[400],
    "chart-3": p.green[300],
    "chart-4": p.slate[400],
    "chart-5": p.amber[300],
  },
} as const;

/** Пары с контрастом < 4.5:1, допустимые только для крупного текста. Сейчас таких нет. */
export const contrastLargeTextOnly = {} as const;

export const gradient = {
  /** Фирменный градиент кнопки «СберБанк Онлайн»: знак, полоса пропуска, прогресс */
  brand: `linear-gradient(100deg, ${p.sber.mint} 0%, ${p.sber.green} 45%, ${p.teal[500]} 100%)`,
  /** Мягкое мятное свечение фона героя (как на sberbank.ru/person_young) */
  glow: `radial-gradient(60% 50% at 50% 0%, rgb(84 220 135 / 0.22) 0%, rgb(57 192 195 / 0.10) 45%, transparent 75%)`,
  "glow-dark": `radial-gradient(60% 50% at 50% 0%, rgb(63 200 106 / 0.14) 0%, rgb(57 192 195 / 0.06) 45%, transparent 75%)`,
} as const;

export const font = {
  sans: `"SB Sans Text", "SBSansText", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`,
  display: `"SB Sans Display", "SBSansDisplay", "SB Sans Text", system-ui, sans-serif`,
  mono: `ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace`,
} as const;

/** CSS со шрифтами SB Sans (CDN Сбера, как в Plasma). Файлы шрифтов в git не кладём. */
export const fontImports = [
  "https://cdn-app.sberdevices.ru/shared-static/0.0.0/styles/SBSansText.0.2.0.css",
  "https://cdn-app.sberdevices.ru/shared-static/0.0.0/styles/SBSansDisplay.0.2.0.css",
] as const;

/** Типографика (px). Заголовки — SB Sans Display 500 с трекингом −0.02em, как на sberbank.ru. */
export const text = {
  xs:   { size: 12, lineHeight: 16, role: "подписи, бейджи, оси графиков" },
  sm:   { size: 14, lineHeight: 20, role: "основной текст админки, ячейки, кнопки sm" },
  base: { size: 16, lineHeight: 24, role: "текст телефона, инпуты (на мобиле ≥16, иначе iOS зумит)" },
  lg:   { size: 18, lineHeight: 26, role: "лид, заголовок карточки" },
  xl:   { size: 22, lineHeight: 28, role: "заголовок секции" },
  "2xl": { size: 26, lineHeight: 32, role: "заголовок страницы на мобиле, крупные цифры" },
  "3xl": { size: 32, lineHeight: 40, role: "заголовок страницы, KPI" },
  "4xl": { size: 42, lineHeight: 50, role: "герой на мобиле, вердикт-подсказка" },
  "5xl": { size: 56, lineHeight: 62, role: "герой лендинга, вердикт киоска" },
  "6xl": { size: 72, lineHeight: 76, role: "вердикт киоска на больших экранах" },
} as const;

export const fontWeight = { regular: 400, medium: 500, semibold: 600, bold: 700 } as const;

/** Сетка 4 px. Tailwind: --spacing = 4px, поэтому p-4 = 16px. */
export const spacingBase = 4;
/** Разрешённые шаги для p/m/gap/space/inset (проверяет fsd-check, правило spacing-scale). */
export const spacingSteps = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24] as const;

/** Высоты контролов → h-control-md и т. п. Цель касания ≥ 44 px (md) на телефоне. */
export const control = { xs: 32, sm: 36, md: 44, lg: 52, xl: 64 } as const;

/** Радиусы (px), как у Сбера: чипы 8, кнопки/инпуты 12, плитки 16, панели 24, крупные контейнеры 32. Вложенный = внешний − отступ. */
export const radius = { xs: 6, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32 } as const;

export const shadow = {
  light: {
    xs: "0 1px 2px rgb(23 36 25 / 0.06)",
    card: "0 1px 2px rgb(23 36 25 / 0.04), 0 6px 20px -12px rgb(23 36 25 / 0.14)",
    float: "0 1px 2px rgb(23 36 25 / 0.05), 0 12px 32px -14px rgb(23 36 25 / 0.22)",
    pop: "0 2px 6px rgb(23 36 25 / 0.06), 0 28px 64px -20px rgb(23 36 25 / 0.32)",
  },
  dark: {
    xs: "0 0 0 1px rgb(255 255 255 / 0.04)",
    card: "inset 0 0 0 1px rgb(255 255 255 / 0.05)",
    float: "inset 0 0 0 1px rgb(255 255 255 / 0.06), 0 16px 40px -16px rgb(0 0 0 / 0.7)",
    pop: "inset 0 0 0 1px rgb(255 255 255 / 0.07), 0 28px 64px -16px rgb(0 0 0 / 0.8)",
  },
} as const;

/** Слои по оси Z → классы z-dropdown, z-modal … */
export const zIndex = { base: 0, raised: 1, sticky: 10, nav: 20, overlay: 50, modal: 60, dropdown: 65, toast: 70, kiosk: 80 } as const;

/** Движение. Всё живое — пружины с отскоком; твины только для цвета/прозрачности и таймеров. */
export const motion = {
  ease: {
    out: [0.22, 1, 0.36, 1],
    in: [0.4, 0, 1, 1],
    inOut: [0.65, 0, 0.35, 1],
  },
  duration: {
    instant: 0.12,
    fast: 0.2,
    base: 0.3,
    slow: 0.45,
    loop: 2.4,     // зацикленные подсказки (сканер, челлендж)
  },
  spring: {
    press: { type: "spring", stiffness: 520, damping: 22, mass: 0.6 },     // нажатие: лёгкий отскок
    snappy: { type: "spring", bounce: 0.28, visualDuration: 0.32 },       // индикаторы сегментов, поповеры, свитч
    soft: { type: "spring", bounce: 0.22, visualDuration: 0.5 },          // появление карточек, layout
    pop: { type: "spring", bounce: 0.45, visualDuration: 0.45 },          // успех, иконка вердикта, бейдж
    sheet: { type: "spring", bounce: 0.16, visualDuration: 0.42 },        // шторка, модалка
    page: { type: "spring", bounce: 0.18, visualDuration: 0.45 },         // смена страницы
    bar: { type: "spring", bounce: 0.3, visualDuration: 0.7 },            // полосы прогресса, графики
    counter: { stiffness: 110, damping: 13, mass: 0.9 },                  // useSpring для счётчиков: заметный перелёт
  },
  stagger: { step: 0.045, max: 0.3 },
  distance: { enter: 14, exit: 8 },
  scale: { hover: 1.015, tap: 0.96, popIn: 0.94, popOut: 0.98 },
  swipe: { offset: 96, velocity: 500 },
  kiosk: { resultHoldMs: 4000, challengeTimeoutMs: 10000 },
  toast: { durationMs: 3600, errorDurationMs: 6000 },
} as const;

/** Ссылка на CSS-переменную для мест, где нужен цвет строкой (recharts, canvas, SVG). */
export const cssVar = (name: keyof typeof semantic.light) => `var(--${name})` as const;

export type SemanticColor = keyof typeof semantic.light;
