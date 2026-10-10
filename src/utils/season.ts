import type { Accessory, SeasonLook } from "../types";

export const ACCESSORIES: readonly Accessory[] = ["cape", "sunglasses", "scarf", "earmuffs", "santa-hat", "witch-hat", "bunny-ears", "party-hat"];
/** Copricapo: uno alla volta. */
export const HATS: readonly Accessory[] = ["santa-hat", "witch-hat", "bunny-ears", "party-hat", "earmuffs"];

/** Data di Pasqua (algoritmo gregoriano anonimo). */
export function easterDate(y: number): Date {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, month - 1, day);
}

/**
 * Look per il periodo dell'anno.
 * Natale (1 dic–6 gen), Halloween (15 ott–1 nov), Pasqua (2 settimane prima–Pasquetta),
 * inverno (gen–feb: sciarpa e paraorecchie), estate (lug–ago).
 */
export function seasonalLook(date: Date = new Date()): SeasonLook {
  const y = date.getFullYear(), md = (date.getMonth() + 1) * 100 + date.getDate();
  const easter = easterDate(y);
  const fromEaster = Math.round((new Date(y, date.getMonth(), date.getDate()).getTime() - easter.getTime()) / 86400000);
  if (md >= 1201 || md <= 106) return { season: "christmas", accessories: ["cape", "santa-hat", "scarf"], prop: "gift" };
  if (md >= 1015 && md <= 1101) return { season: "halloween", accessories: ["cape", "witch-hat"], prop: "pumpkin" };
  if (fromEaster >= -14 && fromEaster <= 1) return { season: "easter", accessories: ["cape", "bunny-ears"], prop: "egg" };
  if (md <= 229) return { season: "winter", accessories: ["cape", "scarf", "earmuffs"], prop: null };
  if (md >= 701 && md <= 831) return { season: "summer", accessories: ["cape", "sunglasses"], prop: null };
  return { season: null, accessories: ["cape"], prop: null };
}
