import type { Mortgage, Theme } from "../../schema/types";

interface Props { m: Mortgage; theme: Theme; }

/**
 * Блок ипотеки на странице объекта. Все поля — строки, заполняет риелтор.
 * Движок не считает аннуитет (см. обсуждение): меньше кода, меньше ошибок,
 * никакой ответственности за неверный расчёт.
 */
export function MortgageBlock({ m, theme: t }: Props) {
  const hasPromo = m.promo && m.promo.label;
  const hasOptions = m.options && m.options.length > 0;
  if (!hasPromo && !m.down_payment && !hasOptions && !m.delivery) return null;

  return (
    <div style={{ border: `1px solid ${t.border}`, borderRadius: t.radius, overflow: "hidden", background: t.surface }}>
      {hasPromo && (
        <div style={{ background: t.accent, color: t.accentInk, padding: `${t.unit * 0.8}px ${t.unit}px`, textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, opacity: 0.85, textTransform: "uppercase" }}>{m.promo!.label}</div>
          <div style={{ fontFamily: t.display, fontSize: 30, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>Ставка {m.promo!.rate}</div>
          {m.promo!.note && <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{m.promo!.note}</div>}
          {m.delivery && <div style={{ display: "inline-block", marginTop: 10, background: "rgba(0,0,0,.18)", borderRadius: 999, padding: "4px 12px", fontSize: 12 }}>{m.delivery}</div>}
        </div>
      )}

      {(m.down_payment || hasOptions) && (
        <div style={{ padding: t.unit }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: t.muted, textTransform: "uppercase", textAlign: "center", marginBottom: t.unit * 0.6 }}>Расчёт</div>
          {m.down_payment && (
            <Row label="Первоначальный взнос" value={m.down_payment} t={t} bold />
          )}
          {hasOptions && m.options!.map((o, i) => (
            <Row key={i} label={`Платёж · ${o.term}`} value={o.monthly} sub="в месяц" t={t} />
          ))}
        </div>
      )}

      {m.promo?.until && (
        <div style={{ background: t.accentSoft, color: t.ink, fontSize: 12, padding: `${t.unit * 0.5}px ${t.unit}px`, textAlign: "center", fontWeight: 600, letterSpacing: 0.4 }}>
          ТОЛЬКО ДО {m.promo.until}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, sub, t, bold }: { label: string; value: string; sub?: string; t: Theme; bold?: boolean; }) {
  return (
    <div style={{ borderTop: `1px solid ${t.border}`, padding: `${t.unit * 0.7}px 0`, textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: t.muted, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: t.display, fontSize: bold ? 26 : 24, fontWeight: 700, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
