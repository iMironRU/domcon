import { Phone, Send, MessageCircle, UserPlus, Share2 } from "lucide-react";
import type { Realtor, Theme } from "../../schema/types";
import type { ResolvePhoto } from "./resolvePhoto";
import { PhotoFrame } from "./PhotoFrame";

interface Props {
  realtor: Realtor;
  theme: Theme;
  resolvePhoto: ResolvePhoto;
}

/** Визитка риелтора. realtor.yaml → этот блок. */
export function Visitka({ realtor: r, theme: t, resolvePhoto }: Props) {
  const btn = (href: string, Icon: typeof Phone, label: string, primary: boolean) => (
    <a href={href} target="_blank" rel="noreferrer" style={{
      display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
      borderRadius: t.radius, padding: "10px 14px", fontSize: 14, fontWeight: 600,
      textDecoration: "none",
      background: primary ? t.accent : t.surface, color: primary ? t.accentInk : t.ink,
      border: primary ? "none" : `1px solid ${t.border}`,
    }}><Icon size={17} /> {label}</a>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: t.unit * 0.8, background: t.surface, border: `1px solid ${t.border}`, borderRadius: t.radius, padding: t.unit, fontFamily: t.body }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 84, flexShrink: 0 }}>
          <PhotoFrame src={r.photo ? resolvePhoto(r.photo, "thumb") : ""} alt={r.name} theme={t} ratio="1 / 1" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: t.display, fontSize: 22, fontWeight: 600, color: t.ink, lineHeight: 1.1 }}>{r.name}</div>
          {r.tagline && <div style={{ color: t.muted, fontSize: 13, marginTop: 6, lineHeight: 1.4 }}>{r.tagline}</div>}
        </div>
      </div>
      {r.facts && r.facts.length > 0 && (
        <div style={{ display: "flex", border: `1px solid ${t.border}`, borderRadius: t.radius, overflow: "hidden" }}>
          {r.facts.map((f, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "10px 6px", borderRight: i < r.facts!.length - 1 ? `1px solid ${t.border}` : "none" }}>
              <div style={{ fontFamily: t.display, fontSize: 18, fontWeight: 600, color: t.ink }}>{f.k}</div>
              <div style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{f.v}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {btn(`tel:${r.phone}`, Phone, "Звонок", false)}
        {r.telegram && btn(`https://t.me/${r.telegram}`, Send, "Telegram", true)}
        {r.whatsapp && btn(`https://wa.me/${r.whatsapp}`, MessageCircle, "WhatsApp", false)}
      </div>
      {/* vCard и share — обрабатывает share.js на статике (делегированно через data-*) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button data-vcard
          data-name={r.name}
          data-tel={r.phone}
          data-org="domcon"
          data-note={r.tagline ?? ""}
          data-telegram={r.telegram ?? ""}
          data-whatsapp={r.whatsapp ?? ""}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: t.radius, padding: "10px 14px", fontSize: 14, fontWeight: 600, background: t.surface, color: t.ink, border: `1px solid ${t.border}`, cursor: "pointer" }}>
          <UserPlus size={17} /> В контакты
        </button>
        <button data-share
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: t.radius, padding: "10px 14px", fontSize: 14, fontWeight: 600, background: t.surface, color: t.ink, border: `1px solid ${t.border}`, cursor: "pointer" }}>
          <Share2 size={17} /> Поделиться
        </button>
      </div>
    </div>
  );
}
