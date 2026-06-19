// Делегированный обработчик для двух кнопок на статике:
//   [data-share]                      → модалка «поделиться» (URL + copy + QR + native share)
//   [data-vcard][data-name][data-tel] → скачать .vcf
// Зависит от глобального qrcode() из qrcode-generator (подключён <script>'ом до этого).
(() => {
  const TG = window.Telegram?.WebApp;

  document.addEventListener("click", (e) => {
    const share = e.target.closest("[data-share]");
    if (share) { e.preventDefault(); openShareModal(share.dataset.shareUrl || location.href); return; }
    const vcard = e.target.closest("[data-vcard]");
    if (vcard) { e.preventDefault(); downloadVCard(vcard.dataset); }
  });

  function openShareModal(url) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(8,10,12,.78);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px";
    overlay.addEventListener("click", (e) => { if (e.target === overlay) document.body.removeChild(overlay); });

    const box = document.createElement("div");
    box.style.cssText = "background:#fff;color:#16201a;border-radius:18px;padding:24px;max-width:340px;width:100%;text-align:center;font-family:'Inter',system-ui,sans-serif";
    box.innerHTML = `
      <div style="font-size:18px;font-weight:600;margin-bottom:6px">Поделиться</div>
      <div style="color:#666;font-size:12px;word-break:break-all;margin-bottom:18px">${escapeHtml(url)}</div>
      <div data-qr style="display:flex;justify-content:center;margin-bottom:18px"></div>
      <div style="display:flex;gap:8px;flex-direction:column">
        <button data-copy style="background:#1f5132;color:#fff;border:none;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer">Скопировать ссылку</button>
        ${navigator.share ? `<button data-native style="background:#fff;color:#16201a;border:1.5px solid #dde2da;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer">Системное «поделиться»</button>` : ""}
        ${TG ? `<button data-tgshare style="background:#fff;color:#16201a;border:1.5px solid #dde2da;border-radius:12px;padding:13px;font-size:14px;font-weight:600;cursor:pointer">Через Telegram</button>` : ""}
        <button data-close style="background:transparent;color:#888;border:none;padding:8px;font-size:13px;cursor:pointer">Закрыть</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // QR-код через qrcode-generator. Type:0 = auto-fit, 'M' — средний уровень коррекции.
    try {
      const qr = window.qrcode(0, "M");
      qr.addData(url);
      qr.make();
      box.querySelector("[data-qr]").innerHTML = qr.createSvgTag({ scalable: true, margin: 2 });
      const svg = box.querySelector("[data-qr] svg");
      if (svg) { svg.style.width = "180px"; svg.style.height = "180px"; }
    } catch (err) { console.warn("qr failed", err); }

    box.querySelector("[data-copy]").addEventListener("click", async (ev) => {
      try {
        await navigator.clipboard.writeText(url);
        ev.target.textContent = "Скопировано ✓";
        ev.target.style.background = "#0a8a4f";
      } catch { ev.target.textContent = "Не удалось скопировать"; }
    });
    box.querySelector("[data-native]")?.addEventListener("click", () => {
      navigator.share({ url, title: document.title }).catch(() => {});
    });
    box.querySelector("[data-tgshare]")?.addEventListener("click", () => {
      const shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(url);
      if (TG?.openTelegramLink) TG.openTelegramLink(shareUrl); else window.open(shareUrl, "_blank");
    });
    box.querySelector("[data-close]").addEventListener("click", () => document.body.removeChild(overlay));
  }

  function downloadVCard(d) {
    const escape = (s) => String(s || "").replace(/([\\,;])/g, "\\$1").replace(/\n/g, "\\n");
    const lines = ["BEGIN:VCARD", "VERSION:3.0"];
    if (d.name) { lines.push(`FN:${escape(d.name)}`); lines.push(`N:${escape(d.name)};;;;`); }
    if (d.org) lines.push(`ORG:${escape(d.org)}`);
    if (d.tel) lines.push(`TEL;TYPE=CELL,VOICE:${escape(d.tel)}`);
    if (d.note) lines.push(`NOTE:${escape(d.note)}`);
    if (d.url) lines.push(`URL:${escape(d.url)}`);
    if (d.telegram) lines.push(`URL;TYPE=Telegram:${escape("https://t.me/" + d.telegram)}`);
    if (d.max) lines.push(`URL;TYPE=MAX:${escape("https://max.ru/" + d.max)}`);
    if (d.vk) lines.push(`URL;TYPE=VK:${escape("https://vk.com/" + d.vk)}`);
    if (d.whatsapp) lines.push(`URL;TYPE=WhatsApp:${escape("https://wa.me/" + d.whatsapp)}`);
    lines.push("END:VCARD");
    const blob = new Blob([lines.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(d.name || "contact").replace(/\s+/g, "_")}.vcf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
})();
