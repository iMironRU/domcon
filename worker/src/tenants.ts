/**
 * Реестр арендаторов = control plane. MVP — один арендатор.
 * При выносе движка это станет KV/конфигом, а worker — мультитенантным:
 * один Worker обслуживает всех, маршрутизируя по подписи launch.
 */
export interface Tenant {
  id: string;
  owner: string;            // github owner
  repo: string;             // github repo
  branch: string;
  allowedUserIds: number[]; // Telegram user id — кто может публиковать
  botTokenSecret: string;   // имя секрета с токеном бота этого арендатора
}

export const TENANTS: Record<string, Tenant> = {
  marina: {
    id: "marina",
    owner: "iMironRU",
    repo: "domcon",
    branch: "main",
    allowedUserIds: [151112153],
    botTokenSecret: "TELEGRAM_BOT_TOKEN",
  },
};

// MVP: один арендатор по умолчанию. Позже — резолвить по launch/подписи.
export const defaultTenant = TENANTS.marina;
