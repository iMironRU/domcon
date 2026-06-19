import { useMemo, useState } from "react";
import { ObjectPage, makeResolvePhoto } from "@domcon/render";
import type { RealtyObject, Realtor, Theme, ObjectType } from "../../../schema/types";
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
type Draft = Partial<RealtyObject> & { _photos?: CompressedPhoto[] };

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
      fd.set("object", JSON.stringify(stripLocal(d)));
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

function stripLocal(d: Draft) { const { _photos, ...rest } = d; return rest; }
