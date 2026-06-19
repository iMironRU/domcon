import { useMemo, useState } from "react";
import { ObjectPage, makeResolvePhoto } from "@domcon/render";
import type { RealtyObject, Realtor, Theme, ObjectType, Mortgage } from "../../../schema/types";
import { detectLaunch } from "./verifyLaunch";
import { compressPhoto, type CompressedPhoto } from "./compressPhoto";

// В реальности realtor+theme приходят из конфигурации арендатора (по launch).
// Для дев-режима — заглушки; на проде worker знает tenant по подписи.
const DEMO_REALTOR: Realtor = {
  name: "Марина Соколова", phone: "+79881234567", telegram: "marina_realty",
  whatsapp: "79881234567", district: "Краснодар", tagline: null, photo: null, facts: [],
};
const DEMO_THEME: Theme = {
  label: "Пихта", bg: "#ecefea", surface: "#ffffff", ink: "#16201a", muted: "#5c6b62",
  accent: "#1f5132", accentInk: "#ffffff", accentSoft: "#e3ece5", border: "#dde2da",
  soldBg: "rgba(22,32,26,.55)", display: "'Fraunces', Georgia, serif",
  body: "'Inter', system-ui, sans-serif", radius: 14, unit: 20, photoRatio: "4 / 3",
};

const TYPES: ObjectType[] = ["квартира", "дом", "участок", "коммерция"];
const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? "/publish";

// Состояние живёт В БРАУЗЕРЕ — worker остаётся stateless.
// _photos — сжатые blob'ы, отправляются multipart'ом; previewUrl только для UI.
// _m_* — плоский черновик блока ипотеки; перед отправкой собирается в mortgage.
type Draft = Partial<RealtyObject> & {
  _photos?: CompressedPhoto[];
  _m_enabled?: boolean;
  _m_promo_label?: string;
  _m_promo_rate?: string;
  _m_promo_note?: string;
  _m_promo_until?: string;
  _m_delivery?: string;
  _m_down_payment?: string;
  _m_opt1_term?: string; _m_opt1_monthly?: string;
  _m_opt2_term?: string; _m_opt2_monthly?: string;
};

function buildMortgage(d: Draft): Mortgage | null {
  if (!d._m_enabled) return null;
  const m: Mortgage = {};
  if (d._m_promo_label && d._m_promo_rate) {
    m.promo = { label: d._m_promo_label, rate: d._m_promo_rate };
    if (d._m_promo_note) m.promo.note = d._m_promo_note;
    if (d._m_promo_until) m.promo.until = d._m_promo_until;
  }
  if (d._m_delivery) m.delivery = d._m_delivery;
  if (d._m_down_payment) m.down_payment = d._m_down_payment;
  const options = [
    d._m_opt1_term && d._m_opt1_monthly ? { term: d._m_opt1_term, monthly: d._m_opt1_monthly } : null,
    d._m_opt2_term && d._m_opt2_monthly ? { term: d._m_opt2_term, monthly: d._m_opt2_monthly } : null,
  ].filter(Boolean) as { term: string; monthly: string }[];
  if (options.length) m.options = options;
  // если ничего не заполнено — не сохраняем пустой блок
  return Object.keys(m).length ? m : null;
}

export function App() {
  const [d, setD] = useState<Draft>({ type: "квартира", status: "active", features: [], photos: [] });
  const [sending, setSending] = useState(false);
  const [doneUrl, setDoneUrl] = useState<string | null>(null);

  const set = (patch: Partial<Draft>) => setD((p) => ({ ...p, ...patch }));

  // живое превью использует ТОТ ЖЕ компонент, что и публичный билд → WYSIWYG
  const resolvePhoto = useMemo(() => makeResolvePhoto({ base: "" }), []);
  const previewObj: RealtyObject = {
    id: "preview", type: (d.type as ObjectType) ?? "квартира", status: "active",
    title: d.title || "Новый объект", district: d.district, street: d.street,
    price: Number(d.price) || 0, rooms: d.rooms ?? null, area: d.area ?? null,
    floor: d.floor ?? null, totalFloors: d.totalFloors ?? null, year: d.year ?? null,
    features: d.features ?? [], description: d.description ?? null,
    photos: (d._photos ?? []).map((p) => p.previewUrl),
    mortgage: buildMortgage(d),
  };

  async function onPhotos(files: FileList | null) {
    if (!files) return;
    const fresh = await Promise.all([...files].map(compressPhoto));
    set({ _photos: [...(d._photos ?? []), ...fresh] });
  }

  async function publish() {
    setSending(true);
    try {
      const launch = detectLaunch();
      const fd = new FormData();
      const payload = { ...stripLocal(d), mortgage: buildMortgage(d) };
      fd.set("object", JSON.stringify(payload));
      fd.set("initData", launch.initData ?? "");
      (d._photos ?? []).forEach((p, i) => {
        fd.set(`photo_${i}_full`, p.full, `${i + 1}.webp`);
        fd.set(`photo_${i}_thumb`, p.thumb, `${i + 1}-thumb.webp`);
      });
      const res = await fetch(WORKER_URL, { method: "POST", body: fd });
      const { url } = await res.json();
      setDoneUrl(url);
    } finally {
      setSending(false);
    }
  }

  if (doneUrl) {
    return (
      <Center>
        <h2>Объект отправлен ✓</h2>
        <p style={{ color: "#555" }}>Страница появится через минуту:</p>
        <a href={doneUrl} target="_blank" rel="noreferrer">{doneUrl}</a>
      </Center>
    );
  }

  return (
    <div style={{ fontFamily: DEMO_THEME.body, maxWidth: 760, margin: "0 auto", padding: 16, display: "grid", gap: 20, gridTemplateColumns: "1fr" }}>
      {/* форма */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <h1 style={{ fontFamily: DEMO_THEME.display, fontSize: 22 }}>Новый объект</h1>
        <Field label="Заголовок"><input value={d.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></Field>
        <Field label="Тип">
          <select value={d.type} onChange={(e) => set({ type: e.target.value as ObjectType })}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Row>
          <Field label="Цена, ₽"><input type="number" value={d.price ?? ""} onChange={(e) => set({ price: +e.target.value })} /></Field>
          <Field label="Площадь, м²"><input type="number" value={d.area ?? ""} onChange={(e) => set({ area: +e.target.value })} /></Field>
        </Row>
        <Row>
          <Field label="Комнат"><input type="number" value={d.rooms ?? ""} onChange={(e) => set({ rooms: +e.target.value })} /></Field>
          <Field label="Этаж"><input type="number" value={d.floor ?? ""} onChange={(e) => set({ floor: +e.target.value })} /></Field>
          <Field label="Этажей"><input type="number" value={d.totalFloors ?? ""} onChange={(e) => set({ totalFloors: +e.target.value })} /></Field>
        </Row>
        <Row>
          <Field label="Район"><input value={d.district ?? ""} onChange={(e) => set({ district: e.target.value })} /></Field>
          <Field label="Улица"><input value={d.street ?? ""} onChange={(e) => set({ street: e.target.value })} /></Field>
        </Row>
        <Field label="Описание"><textarea rows={3} value={d.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></Field>
        <Field label="Фото"><input type="file" accept="image/*" multiple onChange={(e) => onPhotos(e.target.files)} /></Field>

        {/* ── ипотека (опционально) ──────────────────────────────────────── */}
        <details open={!!d._m_enabled} style={{ border: `1px solid ${DEMO_THEME.border}`, borderRadius: DEMO_THEME.radius, padding: 10 }}>
          <summary style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 4 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={!!d._m_enabled} onChange={(e) => set({ _m_enabled: e.target.checked })} onClick={(e) => e.stopPropagation()} />
              Блок ипотеки
            </label>
          </summary>
          {d._m_enabled && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              <div style={{ fontSize: 12, color: DEMO_THEME.muted }}>Промо-предложение (опционально):</div>
              <Row>
                <Field label="Название (напр. «Семейная ипотека»)"><input value={d._m_promo_label ?? ""} onChange={(e) => set({ _m_promo_label: e.target.value })} /></Field>
                <Field label="Ставка (напр. «5%»)"><input value={d._m_promo_rate ?? ""} onChange={(e) => set({ _m_promo_rate: e.target.value })} /></Field>
              </Row>
              <Row>
                <Field label="Подпись («На весь срок…»)"><input value={d._m_promo_note ?? ""} onChange={(e) => set({ _m_promo_note: e.target.value })} /></Field>
                <Field label="Действует до («30.06.2026»)"><input value={d._m_promo_until ?? ""} onChange={(e) => set({ _m_promo_until: e.target.value })} /></Field>
              </Row>
              <Field label="Сдача («Сдача — 4 кв. 2026»)"><input value={d._m_delivery ?? ""} onChange={(e) => set({ _m_delivery: e.target.value })} /></Field>
              <div style={{ fontSize: 12, color: DEMO_THEME.muted, marginTop: 4 }}>Расчёт:</div>
              <Field label="Первоначальный взнос («844 200 ₽»)"><input value={d._m_down_payment ?? ""} onChange={(e) => set({ _m_down_payment: e.target.value })} /></Field>
              <Row>
                <Field label="Срок 1 («30 лет»)"><input value={d._m_opt1_term ?? ""} onChange={(e) => set({ _m_opt1_term: e.target.value })} /></Field>
                <Field label="Платёж 1 («18 015 ₽»)"><input value={d._m_opt1_monthly ?? ""} onChange={(e) => set({ _m_opt1_monthly: e.target.value })} /></Field>
              </Row>
              <Row>
                <Field label="Срок 2 («20 лет»)"><input value={d._m_opt2_term ?? ""} onChange={(e) => set({ _m_opt2_term: e.target.value })} /></Field>
                <Field label="Платёж 2 («22 147 ₽»)"><input value={d._m_opt2_monthly ?? ""} onChange={(e) => set({ _m_opt2_monthly: e.target.value })} /></Field>
              </Row>
            </div>
          )}
        </details>

        <button onClick={publish} disabled={sending || !d.title || !d.price}
          style={{ background: DEMO_THEME.accent, color: "#fff", border: "none", borderRadius: DEMO_THEME.radius, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
          {sending ? "Отправляю…" : "Опубликовать"}
        </button>
      </div>

      {/* живое превью — тот же ObjectPage, что на сайте */}
      <div style={{ border: `1px dashed ${DEMO_THEME.border}`, borderRadius: DEMO_THEME.radius, padding: 12, background: DEMO_THEME.bg }}>
        <div style={{ fontSize: 11, color: DEMO_THEME.muted, marginBottom: 8 }}>превью (тот же рендер, что на сайте)</div>
        <ObjectPage o={previewObj} realtor={DEMO_REALTOR} theme={DEMO_THEME} resolvePhoto={resolvePhoto} interactive />
      </div>
    </div>
  );
}

// ── мелкие хелперы UI ───────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "grid", gap: 4, fontSize: 13, color: "#444", flex: 1 }}>{label}{children}</label>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 10 }}>{children}</div>;
}
function Center({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", gap: 10, padding: 24, fontFamily: "system-ui" }}>{children}</div>;
}

function stripLocal(d: Draft): Partial<RealtyObject> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(d)) if (!k.startsWith("_")) out[k] = v;
  return out;
}
