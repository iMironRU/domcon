/**
 * SSG публичной витрины. Источник — content/*. Выход — dist/.
 * Публичные страницы НЕ содержат React: renderToStaticMarkup → строка HTML.
 *
 * Запуск: `tsx apps/site/build.ts`  (из корня репо)
 *
 * TODO(domcon):
 *  - копирование ассетов content → dist/assets (git-режим resolvePhoto)
 *  - остров gallery.js для лайтбокса на статике (interactive=false сейчас)
 *  - sitemap.xml / og-теги на страницах объектов
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import yaml from "js-yaml";
import { PropertyCard, ObjectPage, Visitka, makeResolvePhoto } from "@domcon/render";
import { shell } from "./templates/shell";
import type { RealtyObject, Realtor, Theme } from "../../schema/types";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CONTENT = join(ROOT, "content");
const DIST = join(ROOT, "dist");

// Префикс деплоя. На project-Pages (https://user.github.io/<repo>/) нужен /<repo>;
// на user/org-site или своём домене — пустой. CI задаёт через env, локально пусто.
const BASE = (process.env.BASE_PATH
  ?? (process.env.GITHUB_REPOSITORY ? "/" + process.env.GITHUB_REPOSITORY.split("/")[1] : "")
).replace(/\/$/, "");

const realtor = yaml.load(readFileSync(join(CONTENT, "realtor.yaml"), "utf8")) as Realtor;
const theme = JSON.parse(readFileSync(join(CONTENT, "theme.json"), "utf8")) as Theme;
const objects: RealtyObject[] = readdirSync(join(CONTENT, "objects"))
  .filter((f) => f.endsWith(".yaml"))
  .map((f) => yaml.load(readFileSync(join(CONTENT, "objects", f), "utf8")) as RealtyObject);

// git-режим: ассеты лежат под <BASE>/assets. (R2 → makeResolvePhoto({ r2Base }))
const resolvePhoto = makeResolvePhoto({ base: `${BASE}/assets` });

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node);
}

// ── листинг ───────────────────────────────────────────────────────────────
const active = objects.filter((o) => o.status !== "sold");
const sold = objects.filter((o) => o.status === "sold");
const ordered = [...active, ...sold];

const cardsHtml = ordered
  .map((o) => `<div data-id="${o.id}">` +
    render(createElement(PropertyCard, { o, theme, resolvePhoto, href: `${BASE}/objects/${o.id}/` })) +
    `</div>`)
  .join("");

const visitkaHtml = render(createElement(Visitka, { realtor, theme, resolvePhoto }));

const TYPES = ["все", "квартира", "дом", "участок", "коммерция"];
const filtersHtml = `
<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:2px">
  ${TYPES.map((v, i) => `<button data-type="${v}" ${i === 0 ? 'data-on="1"' : ""} class="chip" style="border-radius:999px;padding:7px 14px;font-size:13px;border:1px solid ${theme.border};background:${theme.surface};color:${theme.ink};text-transform:capitalize;flex-shrink:0">${v}</button>`).join("")}
</div>
<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px">
  <span data-count style="color:${theme.muted};font-size:13px">${ordered.length} объектов</span>
  <select data-sort style="background:${theme.surface};color:${theme.ink};border:1px solid ${theme.border};border-radius:${theme.radius}px;padding:7px 10px;font-size:13px">
    <option value="new">Сначала новые</option>
    <option value="priceUp">Дешевле</option>
    <option value="priceDown">Дороже</option>
    <option value="area">Больше площадь</option>
  </select>
</div>`;

const listingBody = `<div class="stack">
  ${visitkaHtml}
  <div>${filtersHtml}</div>
  <div class="grid" data-grid>${cardsHtml}</div>
  <div style="text-align:center;color:${theme.muted};font-size:12px;padding:12px 0">
    ${realtor.name} · ${realtor.district ?? ""}
  </div>
</div>`;

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, "index.html"), shell({
  title: `${realtor.name} — недвижимость`,
  bodyHtml: listingBody,
  theme,
  base: BASE,
  scripts: `<script src="${BASE}/filters.js" defer></script>`,
}));

// ── страницы объектов ───────────────────────────────────────────────────────
for (const o of objects) {
  const body = render(createElement(ObjectPage, { o, realtor, theme, resolvePhoto, backHref: `${BASE}/`, interactive: false }));
  const dir = join(DIST, "objects", o.id);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), shell({ title: `${o.title} — ${fmtTitlePrice(o.price)}`, bodyHtml: body, theme, base: BASE }));
}

// ── objects.json (для фильтров) + статика ───────────────────────────────────
writeFileSync(join(DIST, "objects.json"), JSON.stringify(
  objects.map(({ id, type, status, price, area, rooms, created }) => ({ id, type, status, price, area, rooms, created })),
));
cpSync(join(import.meta.dirname ?? dirname(fileURLToPath(import.meta.url)), "public"), DIST, { recursive: true });

// ── ассеты (фото объектов) — git-режим: content/assets → dist/assets ────────
const ASSETS = join(CONTENT, "assets");
if (existsSync(ASSETS)) cpSync(ASSETS, join(DIST, "assets"), { recursive: true });

function fmtTitlePrice(n: number) { return new Intl.NumberFormat("ru-RU").format(n) + " ₽"; }

console.log(`✓ собрано: ${objects.length} объектов → ${DIST}${BASE ? ` (base="${BASE}")` : ""}`);
