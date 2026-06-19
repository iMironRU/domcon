/**
 * domcon Worker — STATELESS.
 * POST /publish  → проверить подпись Telegram → собрать yaml → один коммит → URL.
 * Никакого состояния диалога: его держит Mini App в браузере.
 */
import yaml from "js-yaml";
import { defaultTenant } from "./tenants";
import { commitFiles } from "./github";

interface Env {
  GITHUB_TOKEN: string;
  TELEGRAM_BOT_TOKEN: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    // CORS preflight (Mini App ходит с другого origin)
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // smoke test: GET /health → { ok: true, tenant: "marina" }
    if (req.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, tenant: defaultTenant.id, repo: `${defaultTenant.owner}/${defaultTenant.repo}` });
    }

    if (req.method !== "POST" || url.pathname !== "/publish") {
      return json({ error: "not found" }, 404);
    }

    // Контракт: multipart/form-data
    //   object   = JSON {type,title,...}
    //   initData = Telegram WebApp signed string
    //   photo_<N>_full  / photo_<N>_thumb  = WebP Blob (0-indexed, N = 0..K-1)
    const form = await req.formData();
    const object = JSON.parse(String(form.get("object") ?? "{}"));
    const initData = String(form.get("initData") ?? "");

    // 1. проверка подписи Telegram (HMAC-SHA256) — это и есть авторизация
    const verified = await verifyTelegram(initData, env.TELEGRAM_BOT_TOKEN);
    if (!verified) return json({ error: "bad signature" }, 401);

    // 2. lock: user из initData должен быть в tenant.allowedUserIds
    const t = defaultTenant;
    if (t.allowedUserIds.length && !t.allowedUserIds.includes(verified.userId)) {
      return json({ error: "user not allowed", userId: verified.userId }, 403);
    }

    const id = object.id || nextId(object);

    // 3. фото: собираем пары full+thumb, генерим ключи для yaml на сервере
    //    (клиент НЕ диктует имена — только индекс).
    const photoFiles: { path: string; content: string; encoding: "base64" }[] = [];
    const photoKeys: string[] = [];
    for (let i = 0; ; i++) {
      const full = form.get(`photo_${i}_full`);
      if (!(full instanceof Blob)) break;
      const thumb = form.get(`photo_${i}_thumb`);
      const key = `${id}/${i + 1}.webp`;
      photoKeys.push(key);
      photoFiles.push({
        path: `content/assets/${key}`,
        content: await blobToBase64(full),
        encoding: "base64",
      });
      if (thumb instanceof Blob) {
        photoFiles.push({
          path: `content/assets/${id}/${i + 1}-thumb.webp`,
          content: await blobToBase64(thumb),
          encoding: "base64",
        });
      }
    }

    // js-yaml корректно сериализует вложенные объекты (mortgage и т.п.);
    // sortKeys:false бережёт визуальный порядок, который привычен риелтору в diff.
    const yamlText = yaml.dump({ ...object, id, photos: photoKeys }, {
      lineWidth: 100, noRefs: true, sortKeys: false, skipInvalid: true,
    });

    const { sha } = await commitFiles({
      token: env.GITHUB_TOKEN, owner: t.owner, repo: t.repo, branch: t.branch,
      message: `object: ${id}${photoKeys.length ? ` (+${photoKeys.length} фото)` : ""}`,
      files: [
        { path: `content/objects/${id}.yaml`, content: yamlText, encoding: "utf-8" },
        ...photoFiles,
      ],
    });

    // URL детерминирован — отдаём сразу (страница появится после билда ~1–2 мин)
    const pageUrl = `https://${t.owner.toLowerCase()}.github.io/${t.repo}/objects/${id}/`;
    return json({ ok: true, id, sha, url: pageUrl });
  },
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

function nextId(_o: any): string {
  return `kr-${Date.now().toString(36)}`;
}

// ArrayBuffer → base64 чанками (btoa со spread'ом падает на больших фото)
async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(s);
}

/**
 * Проверка Telegram WebApp initData по схеме HMAC-SHA256.
 * secret_key = HMAC_SHA256("WebAppData", bot_token); hash = HMAC_SHA256(secret, data_check_string)
 */
async function verifyTelegram(initData: string, botToken: string): Promise<{ userId: number } | null> {
  if (!initData) return null;
  const p = new URLSearchParams(initData);
  const hash = p.get("hash"); p.delete("hash");
  if (!hash) return null;
  const dcs = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");

  const enc = new TextEncoder();
  const secret = await hmac(enc.encode("WebAppData"), enc.encode(botToken));
  const sig = await hmac(secret, enc.encode(dcs));
  if (toHex(sig) !== hash) return null;

  try {
    const user = JSON.parse(p.get("user") ?? "{}");
    if (typeof user.id !== "number") return null;
    return { userId: user.id };
  } catch {
    return null;
  }
}

async function hmac(key: ArrayBuffer | Uint8Array, msg: Uint8Array): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey("raw", key as any, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", k, msg as any);
}
function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
