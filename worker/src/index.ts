/**
 * domcon Worker — STATELESS.
 * POST /publish  → проверить подпись Telegram → собрать yaml → один коммит → URL.
 * Никакого состояния диалога: его держит Mini App в браузере.
 */
import { defaultTenant } from "./tenants";
import { commitFiles } from "./github";

interface Env {
  GITHUB_TOKEN: string;
  TELEGRAM_BOT_TOKEN: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (req.method !== "POST" || url.pathname !== "/publish") {
      return json({ error: "not found" }, 404);
    }

    const { object, initData } = await req.json() as any;

    // 1. проверка подписи Telegram (HMAC-SHA256) — это и есть авторизация
    const ok = await verifyTelegram(initData, env.TELEGRAM_BOT_TOKEN);
    if (!ok) return json({ error: "bad signature" }, 401);

    // TODO(domcon): проверить user id из initData ∈ tenant.allowedUserIds (lock)

    const t = defaultTenant;
    const id = object.id || nextId(object);
    const yamlText = toYaml({ ...object, id });

    // TODO(domcon): приложить фото (base64-blobs) тем же коммитом
    const { sha } = await commitFiles({
      token: env.GITHUB_TOKEN, owner: t.owner, repo: t.repo, branch: t.branch,
      message: `object: ${id}`,
      files: [{ path: `content/objects/${id}.yaml`, content: yamlText, encoding: "utf-8" }],
    });

    // URL детерминирован — отдаём сразу (страница появится после билда ~1–2 мин)
    const pageUrl = `https://${t.owner.toLowerCase()}.github.io/${t.repo}/objects/${id}/`;
    return json({ ok: true, id, sha, url: pageUrl });
  },
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}

function nextId(o: any): string {
  return `kr-${Date.now().toString(36)}`;
}

// очень простой YAML-эмиттер для плоского объекта (хватает для MVP)
function toYaml(o: Record<string, any>): string {
  const esc = (v: any) => typeof v === "string" && /[:#\n]/.test(v) ? JSON.stringify(v) : v;
  const lines: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(esc).join(", ")}]`);
    else if (v === null) lines.push(`${k}: null`);
    else lines.push(`${k}: ${esc(v)}`);
  }
  return lines.join("\n") + "\n";
}

/**
 * Проверка Telegram WebApp initData по схеме HMAC-SHA256.
 * secret_key = HMAC_SHA256("WebAppData", bot_token); hash = HMAC_SHA256(secret, data_check_string)
 */
async function verifyTelegram(initData: string, botToken: string): Promise<boolean> {
  if (!initData) return false;
  const p = new URLSearchParams(initData);
  const hash = p.get("hash"); p.delete("hash");
  if (!hash) return false;
  const dcs = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");

  const enc = new TextEncoder();
  const secret = await hmac(enc.encode("WebAppData"), enc.encode(botToken));
  const sig = await hmac(secret, enc.encode(dcs));
  return toHex(sig) === hash;
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: Uint8Array): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key as any, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, msg as any);
}
function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
