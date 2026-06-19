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
}

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
