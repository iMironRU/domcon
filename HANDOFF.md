# domcon — HANDOFF

Движок-витрина для риелтора: визитка + объекты недвижимости на GitHub Pages,
плюс Mini App (Telegram/MAX), который из ответов на вопросы чеканит новую
страницу объекта. **Без БД — состояние живёт в git.**

Это MVP-бета на одного арендатора (демо: Марина Соколова, Краснодар). Движок
и tenant пока в одном репо; вынос движка в версионируемый пакет — после первого
рабочего риелтора (см. «Дорожная карта»).

---

## Принципы (не нарушать без причины)

1. **Список — это проекция, не таблица.** Канон — `content/objects/*.yaml`,
   по файлу на объект. Витрина, `objects.json` и страницы объектов
   вычисляются из этих файлов на билде. «Записи в списке» как действия нет.
2. **Один рендер, два рантайма (изоморфность).** `packages/render` — чистые
   presentational React-компоненты `(data, theme) => JSX`. Их использует И
   билд (`renderToStaticMarkup`, ноль JS на публичных страницах), И Mini App
   (живое превью). Поэтому в `render` **запрещены** `window`, `document`,
   `fetch`, браузерные хуки. Только props → разметка.
3. **theme-as-data.** Каркас заморожен (Tailwind-структура), всё цветное/
   типографика/скругления/плотность/фото-ratio — из `content/theme.json`
   инлайн-стилями. Граница frozen↔themed проходит ровно по `style={...}`.
4. **Адаптеры на обоих концах.** Вход: мессенджер — это входной адаптер
   (`verifyLaunch(platform) => identity`). Выход: storage — адаптер
   (`resolvePhoto(key)`), git-в-репо сейчас, R2 потом, без правки модели.
5. **Worker stateless.** Никакого состояния диалога на сервере. Mini App
   собирает объект в браузере и шлёт один POST. Worker: проверил подпись →
   один атомарный коммит через Git Data API → вернул URL.

---

## Поток данных

```
Mini App (визард + живое превью, состояние в браузере)
   │  POST {object, photos[], initData}   (фото сжаты на клиенте, canvas→WebP)
   ▼
Worker (stateless)  ──verify initData (HMAC)──>  Git Data API: 1 коммит
   │                                              (yaml + assets одним tree)
   ▼ push
GitHub Action  ──build (renderToStaticMarkup)──>  dist/  ──>  GitHub Pages
   objects/*.yaml → index.html + objects/{id}/index.html + objects.json
```

Латентность коммит→живая страница ~1–2 мин (билд + деплой Pages). Mini App
честно показывает «страница появится через минуту», URL детерминирован.

---

## Структура

```
content/            ← ИСТОЧНИК ПРАВДЫ (tenant data)
  realtor.yaml      ← визитка
  theme.json        ← активная тема (пресеты Пихта/Кобальт/Сталь — ниже)
  objects/*.yaml    ← по файлу на объект; фото = ключи, не пути
schema/             ← JSON Schema + types.ts (общий контракт)
packages/render/    ← FROZEN PRESENTATION: чистые компоненты (shared билд+превью)
apps/site/          ← SSG: build.ts → dist (ноль React на выходе)
  public/filters.js ← ванильный остров фильтров над objects.json
apps/miniapp/       ← Vite+React: визард + живое превью + POST
worker/             ← Cloudflare Worker: verify → commit → url
.github/workflows/  ← build.yml: push content → build → deploy Pages
```

## Контракт фото (важно)
В yaml лежит **ключ**, не URL: `photos: ["kr-0142/1.webp"]`. Рендер и превью
зовут `resolvePhoto(key, size)`. Резолвер маппит ключ в `/assets/...` (git)
или в `https://…r2.dev/…` (R2). Переезд git→R2 = одна строка в резолвере +
разовое копирование байтов. Модель и компоненты не трогаются.

---

## Чеклист реализации (для сессии кодинга)

- [ ] `packages/render` — допилить вёрстку (мелкие помарки из MVP), вынести
      common-стили, проверить `renderToStaticMarkup` без хуков-ошибок.
- [ ] `apps/site/build.ts` — загрузка yaml → рендер → dist; копирование
      assets (git-режим); эмит `objects.json`; html-shell с `<link>` шрифтов.
- [ ] `apps/site/public/filters.js` — фильтр по типу + сортировка над
      `objects.json`, прогрессивно (страница работает и без JS).
- [ ] Галерея на статике: `renderToStaticMarkup` даёт первое фото; лёгкий
      ванильный остров `gallery.js` гидрирует переключение/лайтбокс. (post-MVP ок)
- [ ] `apps/miniapp` — шаги визарда, живое превью через `@domcon/render`,
      клиентское сжатие фото (canvas, 2 размера: thumb/full), POST на worker.
- [ ] `worker` — проверка Telegram `initData` (Web Crypto HMAC), сборка yaml,
      `github.ts` коммит (blobs→tree→commit→ref), tenant-реестр, lock по user id.
- [ ] `build.yml` — `actions/checkout` c `fetch-depth: 1`, node, build, deploy.

## Стек
Vite + React + TypeScript. Билд публички — `tsx apps/site/build.ts` +
`react-dom/server`. Worker — Cloudflare (free tier с запасом). Pages — деплой
из `dist`. Фото — git-в-репо (сжатие на клиенте), R2 — опция позже.

## Дорожная карта (после первого риелтора)
Вынести `packages/render` + `apps/*` + `worker` в версионируемый движок
(reusable GitHub workflow или npm-пакет). Репо риелтора станет тонким:
только `content/` + строка темы + вызов движка `@vN`. Worker — мультитенантный,
реестр `tenant → {repo, storage, allowedUserIds}` (см. `worker/src/tenants.ts`).
