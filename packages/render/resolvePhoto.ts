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
  return function resolvePhoto(key: string, _size: PhotoSize = "full"): string {
    if (!key) return "";
    if (/^https?:\/\//.test(key)) return key; // уже абсолютный URL
    if (cfg.r2Base) return `${cfg.r2Base.replace(/\/$/, "")}/${key}`;
    // TODO(domcon): два размера — thumb/full — когда заведём R2/варианты
    return `${base.replace(/\/$/, "")}/${key}`;
  };
}

export type ResolvePhoto = ReturnType<typeof makeResolvePhoto>;
