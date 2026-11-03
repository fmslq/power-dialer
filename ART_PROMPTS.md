# ART_PROMPTS v2 — картинки для генератора (R2: карта мира, районы, гербы, Звонарь)

Основа: `docs/03_MAP_REFERENCES_PROMPT.md` и `docs/02_DESIGN_REFERENCES_PROMPT.md`. Старые промпты (пиксель-арт, боссы, предметы базы) лежат в `old/ART_PROMPTS.md`, для карты они **не подходят**.
Не копируем чужие картинки, гербы и надписи: берём только принципы. Всё, что двигается или меняется (туман, маркеры, фигурка, путь, проценты, зум), игра рисует кодом **поверх** картинки. Поэтому на картинках **нет текста, маркеров, тумана и фигурок**.

**Общий стиль (в начало каждого промпта):**
`hand-painted illustrated game map, rich painterly textures, warm lamp light from above, deep teal-black water, cyberpunk city districts built as islands, readable silhouettes, no text, no letters, no UI, no markers, no characters, high detail, 16:9`

## 1. Карта мира (уровень 1 — весь мир), 3840×2160, PNG
`<стиль> top-down 3/4 view of a chain of 12 small city islands on dark water, connected by bridges and one continuous winding road from bottom-left to the top-right mountain, each island has one recognizable landmark (listed below), the last island is a tall mountain with a glowing tower "The Summit" on top, light fog between islands, vignette edges`
Острова по порядку (достопримечательность): 1 Scrapyard — горы ржавого металлолома и кран; 2 Industrial Zone — трубы и градирни; 3 Neon Docks — портовые краны и контейнеры в неоне; 4 Night Market — бумажные фонари и навесы; 5 Commercial Hub — торговый центр со стеклянным куполом; 6 Chrome Plaza — зеркальная площадь с хромовой скульптурой; 7 Cyber-Downtown — плотные небоскрёбы с голограммами; 8 Financial Spire — один чёрно-золотой шпиль; 9 Sky District — дома на подвесных платформах; 10 Aerospace Ring — кольцевой космодром; 11 Orbital Station — купол-станция с антенной; 12 The Summit — гора с башней.
Дай **ещё одну версию той же карты без маршрута и мостов** (для слоя «открытые дороги»), если генератор умеет держать композицию.

## 2. Фоны районов (уровень 2 — остров вблизи), 12 штук, 2560×1440
Шаблон: `<стиль> one island district "<имя района>", closer view, bridges in and out on the left and right edge, a winding path with 5–7 empty small clearings for level points, small houses and props of <тема района>, landmark <достопримечательность> in the center-back, dark water around`
Пустые площадки на тропе нужны: на них игра ставит точки-уровни и флажки.

## 3. Деталь района (уровень 3 — вблизи, как Cuphead вид в игре), 12 штук, 2560×1440
`<стиль> close-up ground-level map view of a path in "<имя района>", path goes from left to right, 3 empty spots for flags, bridge or river crossing, props of <тема района>, foreground objects at top and bottom edges for depth`

## 4. Гербы районов, 12 штук, 1024×1024, прозрачный фон
Шаблон: `heraldic shield emblem, hand-painted, metal rim, single bold symbol: <символ>, palette <цвета>, transparent background, no text`
1 Scrapyard — шестерня в цепи, ржавчина/оранж · 2 Industrial Zone — молот и труба, оранж/сталь · 3 Neon Docks — якорь из неоновой трубки, пурпур/циан · 4 Night Market — фонарь, янтарь · 5 Commercial Hub — купол и монета, синий · 6 Chrome Plaza — зеркальный ромб, серебро · 7 Cyber-Downtown — катана поверх микросхемы, чёрный/золото · 8 Financial Spire — шпиль и ключ, золото · 9 Sky District — облако с колонной, небо/золото · 10 Aerospace Ring — кольцо с ракетой, голубой · 11 Orbital Station — глаз-антенна, зелёный · 12 The Summit — корона над горой, белое золото.

## 5. Звонарь (фигурка на карте), 1024×1024, прозрачный фон
Три кадра одной фигурки: `small chibi courier character with an old telephone handset on a cord over the shoulder, long coat, glowing green visor, hand-painted, 3/4 view, transparent background` — (а) стоит, (б) шаг левой, (в) шаг правой. Ещё один кадр «машет рукой» для захвата района.

## 6. Тема «Радар» (по Fallout: New Vegas)
Генератор **не нужен**: тему рисует код (зелёный монохром, сетка, уголки-рамка, линии дорог, шум). Нужна только текстура местности 2048×2048: `monochrome topographic terrain texture, height shading, subtle noise, seamless, no text`.

## 7. Карта на столе базы (по Inscryption)
`<стиль> dark wooden table in a small room, single warm lamp from above, an empty unfolded paper map lying on the table (blank paper, no drawings), a few props at the edges: old phone, coffee mug, ashtray, low light, no text` — 2560×1440. Маршрут и узлы на бумаге рисует игра.

## 8. Карточки наград и магазина (Inscryption / Hearthstone, НЕ Balatro)
Рамку, название, эффект и иконки рисует код. От генератора нужна только картинка в окне карточки, 768×1024: `<стиль> card illustration of <предмет>, centered object, dark background, warm rim light, no text, no frame`.

Куда класть: `assets/map/world.png`, `assets/map/d01.png`…`d12.png`, `assets/map/x01.png`…, `assets/map/crest01.png`…, `assets/map/caller_*.png`, `assets/map/table.png`. Формат WebP или PNG, до 1,5 МБ за файл.
