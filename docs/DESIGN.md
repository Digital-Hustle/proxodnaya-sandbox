# DESIGN (стенд)

Копия правил — основной репо `proxodnaya/frontend/docs/DESIGN.md`.

<!-- tokens:begin -->
<!-- Сгенерировано gen-tokens.mjs из tokens.ts. Правь tokens.ts и запускай `npm run gen:tokens`. -->

#### Семантические цвета

| Токен | Класс | Светлая | Тёмная | Контраст с -foreground (свет / тём.) |
|---|---|---|---|---|
| `background` | `bg-background` / `text-background` | `#E2F5E9` | `#121417` |  |
| `foreground` | `bg-foreground` / `text-foreground` | `#172419` | `#EDF1EF` |  |
| `card` | `bg-card` / `text-card` | `#FFFFFF` | `#1A1D21` | 16.12 / 14.84 |
| `popover` | `bg-popover` / `text-popover` | `#FFFFFF` | `#212429` | 16.12 / 13.66 |
| `surface` | `bg-surface` / `text-surface` | `#EDF8F1` | `#212429` | 14.81 / 13.66 |
| `surface-hover` | `bg-surface-hover` / `text-surface-hover` | `#D6F2E1` | `#292D33` |  |
| `muted` | `bg-muted` / `text-muted` | `#F5FBF7` | `#212429` | 5.69 / 5.87 |
| `border` | `bg-border` / `text-border` | `#D6F2E1` | `#292D33` |  |
| `border-strong` | `bg-border-strong` / `text-border-strong` | `#A9DDC0` | `#33383F` |  |
| `input` | `bg-input` / `text-input` | `#A9DDC0` | `#33383F` |  |
| `ring` | `bg-ring` / `text-ring` | `#21A038` | `#3FC86A` |  |
| `primary` | `bg-primary` / `text-primary` | `#0E8429` | `#3FC86A` | 4.83 / 8.74 |
| `primary-hover` | `bg-primary-hover` / `text-primary-hover` | `#0B7323` | `#7EE29A` |  |
| `brand` | `bg-brand` / `text-brand` | `#21A038` | `#3FC86A` |  |
| `accent` | `bg-accent` / `text-accent` | `#EEF9F0` | `#0B2614` | 6.18 / 10.17 |
| `success` | `bg-success` / `text-success` | `#21A038` | `#3FC86A` |  |
| `success-soft` | `bg-success-soft` / `text-success-soft` | `#DDF3E2` | `#103A1F` | 5.72 / 8.03 |
| `success-border` | `bg-success-border` / `text-success-border` | `#7EE29A` | `#0B6B26` |  |
| `warning` | `bg-warning` / `text-warning` | `#9A5200` | `#F5B86B` |  |
| `warning-soft` | `bg-warning-soft` / `text-warning-soft` | `#FFF1DC` | `#3A2A12` | 6.11 / 7.86 |
| `warning-border` | `bg-warning-border` / `text-warning-border` | `#F5B86B` | `#8A4B00` |  |
| `danger` | `bg-danger` / `text-danger` | `#C9302C` | `#FF8A80` | 5.33 / 8.30 |
| `danger-soft` | `bg-danger-soft` / `text-danger-soft` | `#FDECEA` | `#3D1A1A` | 5.75 / 9.09 |
| `danger-border` | `bg-danger-border` / `text-danger-border` | `#FFB4AB` | `#B42318` |  |
| `info` | `bg-info` / `text-info` | `#175CD3` | `#8AB4F8` |  |
| `info-soft` | `bg-info-soft` / `text-info-soft` | `#E8F0FE` | `#17263D` | 5.22 / 7.22 |
| `info-border` | `bg-info-border` / `text-info-border` | `#8AB4F8` | `#175CD3` |  |
| `inverse` | `bg-inverse` / `text-inverse` | `#172419` | `#EDF1EF` | 14.56 / 16.19 |
| `overlay` | `bg-overlay` / `text-overlay` | `rgb(23 36 25 / 0.36)` | `rgb(0 0 0 / 0.6)` |  |
| `decision-allow` | `bg-decision-allow` / `text-decision-allow` | `#0F7A2E` | `#0F7A2E` | 5.46 / 5.46 |
| `decision-deny` | `bg-decision-deny` / `text-decision-deny` | `#B42318` | `#B42318` | 6.57 / 6.57 |
| `decision-manual` | `bg-decision-manual` / `text-decision-manual` | `#9A5200` | `#9A5200` | 5.86 / 5.86 |
| `decision-error` | `bg-decision-error` / `text-decision-error` | `#292D33` | `#292D33` | 13.84 / 13.84 |
| `chart-1` | `bg-chart-1` / `text-chart-1` | `#21A038` | `#3FC86A` |  |
| `chart-2` | `bg-chart-2` / `text-chart-2` | `#14A3A8` | `#39C0C3` |  |
| `chart-3` | `bg-chart-3` / `text-chart-3` | `#7EE29A` | `#7EE29A` |  |
| `chart-4` | `bg-chart-4` / `text-chart-4` | `#6B7C8F` | `#8FA0B3` |  |
| `chart-5` | `bg-chart-5` / `text-chart-5` | `#9A5200` | `#F5B86B` |  |

Пары `x-foreground` — цвет текста/иконок на фоне `x`. Исключения по контрасту (только крупный текст):


#### Шкалы (только для токенов, не в className)

| Шкала | Значения |
|---|---|
| white | `#FFFFFF` |
| black | `#08130B` |
| ink | 400 `#8C9590`, 600 `#5C665E`, 700 `#3A453D`, 900 `#172419` |
| mint | 25 `#F5FBF7`, 50 `#EDF8F1`, 100 `#E2F5E9`, 150 `#D6F2E1`, 200 `#C4EDD6`, 300 `#A9DDC0`, 400 `#86C9A4`, sber1 `#BBF2D5`, sber2 `#D4F7E0`, sber3 `#EEF7FB` |
| mist | 25 `#F7F9F8`, 50 `#F1F4F3`, 100 `#EBEFEE`, 150 `#E3E9E7`, 200 `#D9E0DE`, 300 `#C5CFCC`, 400 `#A6B1AD` |
| graphite | 100 `#EDF1EF`, 200 `#D5DBD8`, 400 `#98A19D`, 600 `#454B53`, 700 `#33383F`, 750 `#292D33`, 800 `#212429`, 850 `#1A1D21`, 900 `#121417`, 950 `#0E1013` |
| green | 50 `#EEF9F0`, 100 `#DDF3E2`, 300 `#7EE29A`, 400 `#3FC86A`, 500 `#21A038`, 600 `#0F7A2E`, 650 `#0E8429`, 700 `#0B7323`, 800 `#0B6B26`, 900 `#103A1F`, 950 `#0B2614` |
| teal | 300 `#7CD9DA`, 400 `#39C0C3`, 500 `#14A3A8` |
| amber | 100 `#FFF1DC`, 300 `#F5B86B`, 700 `#9A5200`, 800 `#8A4B00`, 900 `#3A2A12` |
| red | 100 `#FDECEA`, 300 `#FFB4AB`, 400 `#FF8A80`, 700 `#C9302C`, 800 `#B42318`, 900 `#3D1A1A` |
| blue | 100 `#E8F0FE`, 400 `#8AB4F8`, 800 `#175CD3`, 900 `#17263D` |
| slate | 400 `#8FA0B3`, 500 `#6B7C8F` |
| sber | green `#21A038`, sky `#00ADEE`, blue `#0087CD`, arctic `#42E3B4`, spring `#A0E720`, sun `#FAED00`, mint `#54DC87`, lagoon `#39C0C3`, lime `#64EE61`, cyan `#32B8D3`, deep `#0B5E2A`, ocean `#0A4F6B` |

#### Типографика (шкала Nova; дефолтные размеры Tailwind выключены)

| Класс | Размер / интерлиньяж | Для чего |
|---|---|---|
| `text-xs` | 12 / 16 px | подписи, бейджи, оси графиков |
| `text-sm` | 14 / 20 px | основной текст админки, ячейки, кнопки sm |
| `text-base` | 16 / 24 px | текст телефона, инпуты (на мобиле ≥16, иначе iOS зумит) |
| `text-lg` | 18 / 26 px | лид, заголовок карточки |
| `text-xl` | 22 / 28 px | заголовок секции |
| `text-2xl` | 26 / 32 px | заголовок страницы на мобиле, крупные цифры |
| `text-3xl` | 32 / 40 px | заголовок страницы, KPI |
| `text-4xl` | 42 / 50 px | герой на мобиле, вердикт-подсказка |
| `text-5xl` | 56 / 62 px | герой лендинга, вердикт киоска |
| `text-6xl` | 72 / 76 px | вердикт киоска на больших экранах |

Шрифты: `font-sans` — SB Sans Text (весь UI), `font-display` — SB Sans Display (h1–h3, KPI, вердикт). Начертания: `font-regular` 400, `font-medium` 500, `font-semibold` 600, `font-bold` 700.

#### Отступы, контролы, радиусы, тени, слои

- Сетка 4 px. Для `p-* m-* gap-* space-* inset-*` разрешены шаги: `0` (0 px), `0.5` (2 px), `1` (4 px), `1.5` (6 px), `2` (8 px), `2.5` (10 px), `3` (12 px), `3.5` (14 px), `4` (16 px), `5` (20 px), `6` (24 px), `7` (28 px), `8` (32 px), `10` (40 px), `12` (48 px), `14` (56 px), `16` (64 px), `20` (80 px), `24` (96 px).
- Высота контролов: `h-control-xs` 32, `h-control-sm` 36, `h-control-md` 44, `h-control-lg` 52, `h-control-xl` 64 px.
- Радиусы: `rounded-xs` 10, `rounded-sm` 14, `rounded-md` 18, `rounded-lg` 26, `rounded-xl` 34, `rounded-2xl` 44, `rounded-3xl` 56 px, `rounded-full`.
- Тени: `shadow-xs`, `shadow-card`, `shadow-float`, `shadow-pop`, `shadow-glow`, `shadow-scrim` (свои значения в тёмной теме).
- Safe-area телефона: `pt-safe`, `pb-safe`.
- Слои: `z-base` 0, `z-raised` 1, `z-sticky` 10, `z-nav` 20, `z-overlay` 50, `z-modal` 60, `z-dropdown` 65, `z-toast` 70, `z-kiosk` 80.

#### Движение (motion/react через `@/shared/config/motion`; CSS-переходы — классами)

| Токен | Значение | CSS-класс |
|---|---|---|
| duration.instant | 0.12 с | `duration-instant` |
| duration.fast | 0.2 с | `duration-fast` |
| duration.base | 0.3 с | `duration-base` |
| duration.slow | 0.45 с | `duration-slow` |
| duration.loop | 2.4 с | `duration-loop` |
| ease.out | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-out` |
| ease.in | `cubic-bezier(0.4, 0, 1, 1)` | `ease-in` |
| ease.inOut | `cubic-bezier(0.65, 0, 0.35, 1)` | `ease-in-out` |
| spring.press | stiffness 520, damping 22, mass 0.6 | — |
| spring.snappy | bounce 0.28, visualDuration 0.32 | — |
| spring.soft | bounce 0.22, visualDuration 0.5 | — |
| spring.pop | bounce 0.45, visualDuration 0.45 | — |
| spring.sheet | bounce 0.16, visualDuration 0.42 | — |
| spring.page | bounce 0.18, visualDuration 0.45 | — |
| spring.bar | bounce 0.3, visualDuration 0.7 | — |
| spring.counter | stiffness 110, damping 13, mass 0.9 | — |
| swipe | offset 96, velocity 500 | — |
| toast | durationMs 3600, errorDurationMs 6000 | — |
| kiosk | resultHoldMs 4000, challengeTimeoutMs 10000, motion-sampleMs 200, motion-holdMs 6000, motion-pixelDelta 26, motion-ratio 0.02, motion-width 64, motion-height 48 | — |
<!-- tokens:end -->

## Редизайн v3 — по живым скриншотам sberbank.ru (октябрь 2026)

Сняты стили sberbank.ru/ru/person: мятный градиентный фон `#BBF2D5 → #D4F7E0 → #EEF7FB`, шапка-пилюля 60 px (радиус 20, внутренние элементы 48 px / 16), заголовки SB Sans Display 600 с трекингом ≈ −0.06em, панели 32 px, плитки-иллюстрации 30–40 px, мягкие зелёные тени `rgb(8 92 24 / .15)`, подвал — белая панель со скруглённым верхом.

- **Скругления** — суперэллипс (`corner-shape: squircle`) для всех `rounded-*`, кроме `rounded-full`; радиусы увеличены (`xs 10 … 3xl 56`).
- **Живой фон** — `<Aurora>` (WebGL, ogl): светлая тема — мята/бирюза/лайм, тёмная — зелёный/бирюза на графите (как «сияние» в СберБанк Онлайн), киоск — `tone="kiosk"`. Скорость и разрешение — `motion.aurora` в tokens.ts.
- **Шапка** — `HeaderBar` + `NavTrack` (мятная дорожка, белая пилюля активного раздела). Тема — не в шапке, а в «Оформлении» (`PreferencesButton` / `ThemePicker`).
- **Знак** — конус брендбука, размытый внутри суперэллипса + блик (`bg-sheen`).
- **QR** — `StyledQr` + `shared/lib/qrShape`: модули сливаются в группы, внешние углы групп скруглены, во внутренних — галтели; один `path` без швов. Тёмное на белом, проверено zxing.
- **Иллюстрации** — `public/art/*.webp` (3D в стилистике плиток Сбера).

### Работа над ошибками v3.1
- **Индикаторы дорожек** — `TrackIndicator` / `useTrackIndicator` (`shared/ui`) для `NavTrack`, `Segmented`, нижних таб-баров админки и пропуска. Левый и правый края — независимые пружины `spring.snappy`, каждый зажат между первым и последним пунктом: у крайних пунктов индикатор сжимается о стенку, а не вылетает за дорожку. `layoutId` для индикаторов не используем.
- **Дорожка навигации** — `bg-surface` без градиента; на главной вместо дорожки — обычные ссылки (активного раздела там нет).
- **Киоск** — без камеры: Aurora + виньетка `bg-vignette`; с камерой — затемнение вокруг рамки сканера тенью `shadow-scrim`. Выбора «вход/выход» нет (ADR-037).
- **QR пропуска** — смена кода без `popLayout`: старый и новый код лежат в одной grid-ячейке плашки с `overflow-hidden`, размер и центр не меняются.
- **Помощник** — шапка со знаком и режимом (правила / модель), стартовый экран с карточками-вопросами, ответы без рамки-пузыря рядом со знаком, поле ввода — авто-растущая пилюля, Enter отправляет.
- **Тексты** — продуктовый тон: без разговорных оборотов («пощупать», «песочница на моках»), «кабинет руководителя» вместо «админки прораба».
