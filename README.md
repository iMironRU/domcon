# domcon

Статичная витрина недвижимости для риелтора на GitHub Pages + Mini App
(Telegram/MAX), который из ответов на вопросы создаёт страницу объекта.
Хранилище — git. Никакой БД.

> Архитектура и план реализации: см. **[HANDOFF.md](./HANDOFF.md)** —
> это точка входа.

## Быстрый старт

```bash
npm install
npm run build      # apps/site → dist/
npm run dev:miniapp # Vite dev-сервер Mini App
```

## Раскладка
- `content/` — данные риелтора (источник правды): `realtor.yaml`,
  `theme.json`, `objects/*.yaml`.
- `packages/render` — общие presentational-компоненты (билд + превью).
- `apps/site` — статическая сборка витрины.
- `apps/miniapp` — Mini App: визард + живое превью.
- `worker` — Cloudflare Worker: проверка подписи → коммит в git.

## Лицензия
MIT — см. [LICENSE](./LICENSE).
