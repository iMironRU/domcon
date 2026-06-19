import type { PhotoSize } from "../../schema/types";

/**
 * Storage-адаптер. В yaml лежит КЛЮЧ ассета (например "kr-0142/1.webp"),
 * а не URL. Этот резолвер — единственное место, знающее, где байты.
 *
 * MVP: git-в-репо → `${base}/${key}`.
 * Позже: R2 → `https://<bucket>.r2.dev/${key}` (или с учётом size).
 * Смена бэкенда = правка только здесь. Модель и компоненты не трогаются.
 */
export interface PhotoConfig {
  base?: string;           // git-режим: префикс ассетов
  r2Base?: string | null;  // R2-режим: если задан, имеет приоритет
}

export function makeResolvePhoto(cfg: PhotoConfig = {}) {
  const base = cfg.base ?? "/assets";
  return function resolvePhoto(key: string, size: PhotoSize = "full"): string {
    if (!key) return "";
    if (/^https?:\/\//.test(key)) return key; // уже абсолютный URL
    // В yaml лежит full-ключ ("kr-0142/1.webp"); thumb выводится суффиксом ("...-thumb.webp").
    const finalKey = size === "thumb" ? key.replace(/\.([^.]+)$/, "-thumb.$1") : key;
    if (cfg.r2Base) return `${cfg.r2Base.replace(/\/$/, "")}/${finalKey}`;
    return `${base.replace(/\/$/, "")}/${finalKey}`;
  };
}

export type ResolvePhoto = ReturnType<typeof makeResolvePhoto>;
