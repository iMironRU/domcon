import { MapPin } from "lucide-react";
import type { RealtyObject, Theme } from "../../schema/types";
import type { ResolvePhoto } from "./resolvePhoto";
import { PhotoFrame } from "./PhotoFrame";
import { fmtPrice, perM2, specRail } from "./format";

interface Props {
  o: RealtyObject;
  theme: Theme;
  resolvePhoto: ResolvePhoto;
  onOpen?: (o: RealtyObject) => void;
  href?: string; // на статике карточка — ссылка; в превью — onOpen
}

/** Несущий компонент №1. Та же сканируемая модель, что и на странице объекта. */
export function PropertyCard({ o, theme: t, resolvePhoto, onOpen, href }: Props) {
  const sold = o.status === "sold";
  const rail = specRail(o);
  const cover = o.photos[0] ? resolvePhoto(o.photos[0], "thumb") : "";

  const inner = (
    <>
      <PhotoFrame src={cover} alt={o.title} theme={t} rounded={false}>
        <span style={{ position: "absolute", top: 10, left: 10, background: t.surface, color: t.ink, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{o.type}</span>
        {sold && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.soldBg }}>
            <span style={{ color: "#fff", border: "1.5px solid #fff", borderRadius: 999, padding: "5px 16px", fontSize: 13, fontWeight: 600, letterSpacing: ".06em" }}>ПРОДАНО</span>
          </div>
        )}
      </PhotoFrame>
      <div style={{ padding: t.unit }}>
        <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 600, color: t.ink, lineHeight: 1.1 }}>{fmtPrice(o.price)}</div>
        {perM2(o) && <div style={{ color: t.muted, fontSize: 12, marginTop: 2 }}>{fmtPrice(perM2(o)!)} / м²</div>}
        <div style={{ color: t.ink, fontSize: 14, fontWeight: 500, marginTop: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{o.title}</div>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {rail.map((s, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <span style={{ width: 3, height: 3, borderRadius: 999, background: t.border }} />}
              <span style={{ color: t.muted, fontSize: 13 }}>{s}</span>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, color: t.muted, fontSize: 13 }}>
          <MapPin size={14} strokeWidth={1.8} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.district} · {o.street}</span>
        </div>
      </div>
    </>
  );

  const shell: React.CSSProperties = {
    display: "block", textAlign: "left", width: "100%",
    background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius,
    fontFamily: t.body, overflow: "hidden", opacity: sold ? 0.92 : 1,
    textDecoration: "none", transition: "transform .15s, border-color .15s",
  };

  // Статика → <a href>. Превью → <button onOpen>.
  return href
    ? <a href={href} style={shell}>{inner}</a>
    : <button onClick={() => onOpen?.(o)} style={{ ...shell, cursor: "pointer" }}>{inner}</button>;
}
