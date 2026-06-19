import type { Theme } from "../../../schema/types";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700" +
  "&family=Fraunces:opsz,wght@9..144,500;9..144,600" +
  "&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap";

/** HTML-оболочка. Публичная страница = чистая разметка + минимум ванили. */
export function shell(opts: {
  title: string;
  bodyHtml: string;
  theme: Theme;
  base?: string;        // префикс деплоя (project-Pages: "/domcon"; root/CNAME: "")
  head?: string;
  scripts?: string;
}): string {
  const { title, bodyHtml, theme: t, base = "", head = "", scripts = "" } = opts;
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${base}/styles.css">
<style>
  :root { --accent:${t.accent}; --ink:${t.ink}; --border:${t.border}; }
  body { background:${t.bg}; color:${t.ink}; font-family:${t.body}; }
  *:focus-visible { outline:2px solid ${t.accent}; outline-offset:2px; }
  @media (prefers-reduced-motion: reduce){ *{transition:none!important} }
</style>
<script>window.__BASE__=${JSON.stringify(base)};addEventListener("error",function(e){if(e.target&&e.target.tagName==="IMG")e.target.style.visibility="hidden"},true)</script>
${head}
</head>
<body>
<div class="wrap">${bodyHtml}</div>
${scripts}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}
