/**
 * Входной адаптер по мессенджерам. Платформенно-специфично ТОЛЬКО это.
 * Возвращает «сырой» initData/launch-params для отправки на worker —
 * валидация подписи делается на сервере (там секрет).
 */
export type Platform = "telegram" | "max" | "vk";

export interface Launch {
  platform: Platform;
  initData: string;       // строка для проверки HMAC на worker
  userId?: string | number;
  userName?: string;
}

export function detectLaunch(): Launch {
  // Telegram WebApp
  const tg = (globalThis as any).Telegram?.WebApp;
  if (tg?.initData) {
    return {
      platform: "telegram",
      initData: tg.initData,
      userId: tg.initDataUnsafe?.user?.id,
      userName: tg.initDataUnsafe?.user?.username,
    };
  }
  // TODO(domcon): MAX / VK launch-params — тот же контракт Launch
  return { platform: "telegram", initData: "", userName: "dev" };
}
