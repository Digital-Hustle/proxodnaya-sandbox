# DESIGN (стенд)

Копия правил — основной репо `proxodnaya/frontend/docs/DESIGN.md`.

<!-- tokens:begin -->
<!-- Сгенерировано gen-tokens.mjs из tokens.ts. Правь tokens.ts и запускай `npm run gen:tokens`. -->

#### Семантические цвета

| Токен | Класс | Светлая | Тёмная | Контраст с -foreground (свет / тём.) |
|---|---|---|---|---|
| `background` | `bg-background` / `text-background` | `#F9F9F9` | `#080808` |  |
| `foreground` | `bg-foreground` / `text-foreground` | `#171717` | `#F5F5F5` |  |
| `card` | `bg-card` / `text-card` | `#FFFFFF` | `#171717` | 17.93 / 16.44 |
| `popover` | `bg-popover` / `text-popover` | `#FFFFFF` | `#171717` | 17.93 / 16.44 |
| `primary` | `bg-primary` / `text-primary` | `#148F2B` | `#24B23E` | 4.21 (только крупный) / 7.16 |
| `primary-hover` | `bg-primary-hover` / `text-primary-hover` | `#0D8523` | `#15D13B` |  |
| `brand` | `bg-brand` / `text-brand` | `#21A038` | `#24B23E` | 3.41 (только крупный) / 7.16 |
| `secondary` | `bg-secondary` / `text-secondary` | `#E8E8E8` | `#262626` | 14.63 / 13.88 |
| `muted` | `bg-muted` / `text-muted` | `#F5F5F5` | `#262626` | 4.54 / 7.14 |
| `accent` | `bg-accent` / `text-accent` | `#E0FFE9` | `#0A2B10` | 7.69 / 10.91 |
| `destructive` | `bg-destructive` / `text-destructive` | `#E31227` | `#FF3D51` | 4.79 / 5.76 |
| `warning` | `bg-warning` / `text-warning` | `#B54300` | `#FA6D20` | 5.57 / 6.94 |
| `info` | `bg-info` / `text-info` | `#0C72B6` | `#199AF0` | 5.12 / 6.60 |
| `border` | `bg-border` / `text-border` | `#DCDCDC` | `#363636` |  |
| `input` | `bg-input` / `text-input` | `#DCDCDC` | `#363636` |  |
| `ring` | `bg-ring` / `text-ring` | `#21A038` | `#24B23E` |  |
| `overlay` | `bg-overlay` / `text-overlay` | `rgb(8 8 8 / 0.5)` | `rgb(0 0 0 / 0.7)` |  |
| `decision-allow` | `bg-decision-allow` / `text-decision-allow` | `#21A038` | `#24B23E` | 3.41 (только крупный) / 7.16 |
| `decision-deny` | `bg-decision-deny` / `text-decision-deny` | `#E31227` | `#FF3D51` | 4.79 / 5.76 |
| `decision-manual` | `bg-decision-manual` / `text-decision-manual` | `#D14D00` | `#FA6D20` | 4.40 (только крупный) / 6.94 |
| `decision-error` | `bg-decision-error` / `text-decision-error` | `#4E4E4E` | `#707070` | 8.32 / 4.95 |
| `chart-1` | `bg-chart-1` / `text-chart-1` | `#21A038` | `#24B23E` |  |
| `chart-2` | `bg-chart-2` / `text-chart-2` | `#00ADEE` | `#00ADEE` |  |
| `chart-3` | `bg-chart-3` / `text-chart-3` | `#42E3B4` | `#42E3B4` |  |
| `chart-4` | `bg-chart-4` / `text-chart-4` | `#0087CD` | `#199AF0` |  |
| `chart-5` | `bg-chart-5` / `text-chart-5` | `#A0E720` | `#A0E720` |  |

Пары `x-foreground` — цвет текста/иконок на фоне `x`. Исключения по контрасту (только крупный текст):

- `primary` — Nova: кнопка #148F2B с белым текстом (≈4.2:1). Текст кнопок — semibold 16px+; мелкий зелёный текст — только text-accent-foreground
- `brand` — «Зелёный СБЕР» #21A038 с белым ≈3.4:1 — только плоскости, иконки и текст ≥ 19px semibold; кнопки — primary
- `decision-allow` — экран вердикта киоска: текст ≥ 48px
- `decision-manual` — экран вердикта киоска: текст ≥ 48px

#### Шкалы (только для токенов, не в className)

| Шкала | Значения |
|---|---|
| white | `#FFFFFF` |
| black | `#080808` |
| green | 50 `#E0FFE9`, 100 `#62F582`, 200 `#2AE853`, 300 `#15D13B`, 400 `#24B23E`, 500 `#21A038`, 600 `#148F2B`, 700 `#0D8523`, 800 `#095C18`, 900 `#0A4014`, 950 `#0A2B10` |
| gray | 50 `#F9F9F9`, 100 `#F5F5F5`, 200 `#E8E8E8`, 300 `#DCDCDC`, 400 `#C7C7C7`, 500 `#B2B2B2`, 600 `#858585`, 650 `#7A7A7A`, 700 `#707070`, 800 `#4E4E4E`, 850 `#363636`, 900 `#262626`, 950 `#171717`, 1000 `#080808` |
| orange | 400 `#FA6D20`, 500 `#F55D05`, 600 `#E35502`, 700 `#D14D00`, 800 `#B54300` |
| red | 400 `#FF3D51`, 500 `#F31B31`, 700 `#E31227` |
| blue | 400 `#199AF0`, 500 `#078BE4`, 700 `#067DCC`, 800 `#0C72B6` |
| teal | 400 `#0C9597`, 500 `#0C8688`, 600 `#05996F`, 700 `#0A8A66` |
| purple | 700 `#722BA1` |
| sber | green `#21A038`, sky `#00ADEE`, blue `#0087CD`, arctic `#42E3B4`, spring `#A0E720`, sun `#FAED00` |

#### Типографика (шкала Nova; дефолтные размеры Tailwind выключены)

| Класс | Размер / интерлиньяж | Для чего |
|---|---|---|
| `text-xs` | 13 / 16 px | подписи, бейджи, легенды графиков |
| `text-sm` | 15 / 20 px | основной текст админки, ячейки таблиц, инпуты |
| `text-base` | 16 / 24 px | основной текст телефона, абзацы |
| `text-lg` | 19 / 24 px | заголовок карточки, h4 |
| `text-xl` | 22 / 28 px | заголовок секции, h3 |
| `text-2xl` | 28 / 36 px | заголовок страницы, h2 |
| `text-3xl` | 34 / 40 px | h1 админки, крупные KPI |
| `text-4xl` | 37 / 44 px | h1 лендинга/телефона |
| `text-5xl` | 48 / 56 px | вердикт киоска: причина (наше, не Nova) |
| `text-6xl` | 64 / 72 px | вердикт киоска: ПРОХОДИТЕ / ОТКАЗ (наше, не Nova) |

Шрифты: `font-sans` — SB Sans Text (весь UI), `font-display` — SB Sans Display (h1–h3, KPI, вердикт). Начертания: `font-regular` 400, `font-medium` 500, `font-semibold` 600, `font-bold` 700.

#### Отступы, контролы, радиусы, тени, слои

- Сетка 4 px. Для `p-* m-* gap-* space-* inset-*` разрешены шаги: `0` (0 px), `0.5` (2 px), `1` (4 px), `2` (8 px), `3` (12 px), `4` (16 px), `5` (20 px), `6` (24 px), `8` (32 px), `10` (40 px), `12` (48 px), `16` (64 px).
- Высота контролов: `h-control-xs` 32, `h-control-sm` 40, `h-control-md` 48, `h-control-lg` 56, `h-control-xl` 64 px.
- Радиусы: `rounded-xs` 6, `rounded-sm` 10, `rounded-md` 14, `rounded-lg` 20, `rounded-xl` 28, `rounded-2xl` 36 px, `rounded-full`.
- Тени: `shadow-xs`, `shadow-sm`, `shadow-card`, `shadow-pop` (свои значения в тёмной теме).
- Safe-area телефона: `pt-safe`, `pb-safe`.
- Слои: `z-base` 0, `z-sticky` 10, `z-dropdown` 40, `z-overlay` 50, `z-modal` 60, `z-toast` 70, `z-kiosk` 80.

#### Движение (motion/react через `@/shared/config/motion`; CSS-переходы — классами)

| Токен | Значение | CSS-класс |
|---|---|---|
| duration.instant | 0.1 с | `duration-instant` |
| duration.fast | 0.2 с | `duration-fast` |
| duration.base | 0.3 с | `duration-base` |
| duration.slow | 0.4 с | `duration-slow` |
| duration.hero | 0.6 с | `duration-hero` |
| ease.out | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-out` |
| ease.in | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` |
| ease.inOut | `cubic-bezier(0.65, 0, 0.35, 1)` | `ease-in-out` |
| ease.emphasized | `cubic-bezier(0.2, 0, 0, 1)` | `ease-emphasized` |
| spring.press | stiffness 600, damping 30, mass 0.6 | — |
| spring.snappy | stiffness 420, damping 34 | — |
| spring.soft | stiffness 240, damping 28 | — |
| spring.sheet | stiffness 320, damping 36, mass 0.9 | — |
| spring.bouncy | bounce 0.35, visualDuration 0.45 | — |
| swipe | offset 80, velocity 500, confirmRatio 0.85 | — |
| toast | durationMs 4000, errorDurationMs 6000 | — |
| kiosk | resultHoldMs 4000, challengeTimeoutMs 10000 | — |
<!-- tokens:end -->
