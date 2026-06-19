import type { RealtyObject } from "../../schema/types";

export const fmtPrice = (n: number): string =>
  new Intl.NumberFormat("ru-RU").format(n) + " ₽";

export const perM2 = (o: RealtyObject): number | null =>
  o.area ? Math.round(o.price / o.area) : null;

export const roomsLabel = (r: number | null | undefined): string | null =>
  r === null || r === undefined ? null : r === 0 ? "Студия" : `${r}-комн.`;

/** Сканируемая строка спеков — одна и та же на карточке и странице объекта. */
export function specRail(o: RealtyObject): string[] {
  const out: string[] = [];
  const rl = roomsLabel(o.rooms);
  if (rl) out.push(rl);
  if (o.area) {
    out.push(
      o.type === "участок"
        ? `${(o.area / 100).toFixed(o.area % 100 ? 1 : 0)} сот.`
        : `${o.area} м²`,
    );
  }
  if (o.floor) out.push(`${o.floor}/${o.totalFloors ?? "?"} эт.`);
  else if (o.totalFloors && o.type !== "участок") out.push(`${o.totalFloors} этажа`);
  return out;
}
