import { useState, useEffect } from "react";
import { Phone, Send, MapPin, ArrowLeft, ChevronLeft, ChevronRight, X, Maximize2, Check } from "lucide-react";
import type { RealtyObject, Realtor, Theme } from "../../schema/types";
import type { ResolvePhoto } from "./resolvePhoto";
import { PhotoFrame } from "./PhotoFrame";
import { MortgageBlock } from "./MortgageBlock";
import { fmtPrice, perM2, specRail } from "./format";

interface Props {
  o: RealtyObject;
  realtor: Realtor;
  theme: Theme;
  resolvePhoto: ResolvePhoto;
  onBack?: () => void;          // превью/SPA; на статике — ссылка назад через backHref
  backHref?: string;
  interactive?: boolean;        // false на статике (без лайтбокса), true в превью
  showContacts?: boolean;       // sticky CTA «Позвонить/Написать»; false в превью риелтора
}

/** Несущий компонент №2. */
export function ObjectPage({ o, realtor, theme: t, resolvePhoto, onBack, backHref, interactive = true, showContacts = true }: Props) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const has = o.photos.length > 0;
  const rail = specRail(o);
  const tg = realtor.telegram ? `https://t.me/${realtor.telegram}` : "#";
  const photo = (i: number) => resolvePhoto(o.photos[i], "full");

  useEffect(() => { setIdx(0); }, [o.id]);
  const move = (d: number) => setIdx((i) => (i + d + o.photos.length) % o.photos.length);

  const Back = backHref
    ? <a href={backHref} style={{ display: "flex", alignItems: "center", gap: 6, color: t.muted, fontSize: 14, marginBottom: t.unit, textDecoration: "none" }}><ArrowLeft size={18} /> Все объекты</a>
    : <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, color: t.muted, fontSize: 14, marginBottom: t.unit }}><ArrowLeft size={18} /> Все объекты</button>;

  return (
    <div style={{ fontFamily: t.body, color: t.ink, paddingBottom: showContacts ? 88 : 0 }}>
      {Back}
      <div style={{ display: "flex", flexDirection: "column", gap: t.unit }}>
        <div>
          <PhotoFrame src={has ? photo(idx) : ""} alt={o.title} theme={t}
            ratio={has ? "16 / 10" : t.photoRatio}
            onClick={interactive && has ? () => setZoom(true) : undefined}>
            <span style={{ position: "absolute", top: 12, left: 12, background: t.surface, color: t.ink, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{o.type}</span>
            {has && (
              <span style={{ position: "absolute", bottom: 12, right: 12, display: "flex", alignItems: "center", gap: 5, background: t.soldBg, color: "#fff", borderRadius: 999, padding: "5px 11px", fontSize: 12 }}>
                <Maximize2 size={13} /> {idx + 1} / {o.photos.length}
              </span>
            )}
          </PhotoFrame>
          {o.photos.length > 1 && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {o.photos.map((p, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{ width: 64, height: 48, borderRadius: t.radius / 2, overflow: "hidden", border: `2px solid ${i === idx ? t.accent : "transparent"}`, flexShrink: 0, padding: 0 }}>
                  <img src={resolvePhoto(p, "thumb")} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div style={{ fontFamily: t.display, fontSize: 34, fontWeight: 600, lineHeight: 1.05 }}>{fmtPrice(o.price)}</div>
          {perM2(o) && <div style={{ color: t.muted, fontSize: 14, marginTop: 3 }}>{fmtPrice(perM2(o)!)} / м²</div>}
          <h1 style={{ fontFamily: t.display, fontSize: 20, fontWeight: 500, marginTop: 12, lineHeight: 1.25 }}>{o.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, color: t.muted, fontSize: 14 }}>
            <MapPin size={15} strokeWidth={1.8} /> {o.district} · {o.street}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 16, border: `1px solid ${t.border}`, borderRadius: t.radius, overflow: "hidden" }}>
            {rail.concat(o.year ? [`${o.year} г.`] : []).map((s, i) => (
              <div key={i} style={{ flex: "1 0 33%", padding: `${t.unit * 0.7}px ${t.unit * 0.8}px`, borderRight: `1px solid ${t.border}`, borderTop: i >= 3 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ color: t.ink, fontSize: 15, fontWeight: 600 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        {o.features && o.features.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {o.features.map((f) => (
              <span key={f} style={{ display: "flex", alignItems: "center", gap: 5, background: t.accentSoft, color: t.ink, borderRadius: 999, padding: "6px 12px", fontSize: 13 }}>
                <Check size={13} style={{ color: t.accent }} /> {f}
              </span>
            ))}
          </div>
        )}

        {o.description ? (
          <p style={{ color: t.ink, fontSize: 15, lineHeight: 1.6, maxWidth: 640 }}>{o.description}</p>
        ) : (
          <p style={{ color: t.muted, fontSize: 14, fontStyle: "italic" }}>Описание скоро добавим — напишите, расскажу всё об объекте.</p>
        )}

        {o.mortgage && <MortgageBlock m={o.mortgage} theme={t} />}
      </div>

      {/* sticky CTA — под большой палец, mobile-first. Скрыт в превью риелтора. */}
      {showContacts && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, padding: 12, background: t.surface, borderTop: `1px solid ${t.border}`, zIndex: 30 }}>
          <div style={{ display: "flex", maxWidth: 920, margin: "0 auto", width: "100%", gap: 10 }}>
            <a href={`tel:${realtor.phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: t.surface, color: t.ink, border: `1.5px solid ${t.accent}`, borderRadius: t.radius, padding: "13px 16px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              <Phone size={18} /> Позвонить
            </a>
            <a href={tg} target="_blank" rel="noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: t.accent, color: t.accentInk, borderRadius: t.radius, padding: "13px 16px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
              <Send size={18} /> Написать
            </a>
          </div>
        </div>
      )}

      {interactive && zoom && has && (
        <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(8,10,12,.92)", zIndex: 50 }} onClick={() => setZoom(false)}>
          <button style={{ position: "absolute", top: 18, right: 18, color: "#fff" }} onClick={() => setZoom(false)}><X size={28} /></button>
          {o.photos.length > 1 && (
            <>
              <button style={{ position: "absolute", left: 14, color: "#fff" }} onClick={(e) => { e.stopPropagation(); move(-1); }}><ChevronLeft size={36} /></button>
              <button style={{ position: "absolute", right: 14, color: "#fff" }} onClick={(e) => { e.stopPropagation(); move(1); }}><ChevronRight size={36} /></button>
            </>
          )}
          <img src={photo(idx)} alt="" style={{ maxWidth: "92%", maxHeight: "88%", objectFit: "contain", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
