// Общий контракт. Зеркалит schema/*.schema.json.
// Источник правды для render, build, miniapp и worker.

export type ObjectType = "квартира" | "дом" | "участок" | "коммерция";
export type ObjectStatus = "active" | "sold";

export interface RealtyObject {
  id: string;
  type: ObjectType;
  status: ObjectStatus;
  title: string;
  district?: string | null;
  street?: string | null;
  price: number;
  rooms?: number | null;
  area?: number | null;
  floor?: number | null;
  totalFloors?: number | null;
  year?: number | null;
  features?: string[];
  description?: string | null;
  photos: string[]; // ключи ассетов, не URL
  created?: string | null;
  mortgage?: Mortgage | null;
}

/**
 * Блок ипотеки на странице объекта. Все поля — строки, заполняет риелтор
 * в визарде, движок ничего не считает. Никаких чисел = никаких опечаток
 * в формулах и нулевая ответственность за корректность расчёта.
 */
export interface Mortgage {
  promo?: {
    label: string;             // "Семейная ипотека"
    rate: string;              // "5%"
    note?: string | null;      // "На весь срок кредитования"
    until?: string | null;     // "30.06.2026"
  } | null;
  down_payment?: string | null; // "844 200 ₽"
  options?: MortgageOption[];   // ["30 лет → 18 015 ₽/мес", ...]
  delivery?: string | null;     // "Сдача — 4 кв. 2026"
}
export interface MortgageOption { term: string; monthly: string; }

export interface RealtorFact { k: string; v: string; }
export interface Realtor {
  name: string;
  tagline?: string | null;
  phone: string;
  telegram?: string | null;
  whatsapp?: string | null;
  photo?: string | null;
  district?: string | null;
  facts?: RealtorFact[];
}

export interface Theme {
  label: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  accentSoft: string;
  border: string;
  soldBg: string;
  display: string;
  body: string;
  radius: number;
  unit: number;
  photoRatio: string;
}

export type PhotoSize = "thumb" | "full";
