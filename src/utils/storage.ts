import type { HomePosition } from "../types";

/** Legge una casa salvata (null se assente o se lo storage non è disponibile, es. iframe/anteprima). */
export function readStoredHome(key: string): HomePosition | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<HomePosition>;
    return typeof v.left === "number" && typeof v.top === "number" ? { left: v.left, top: v.top } : null;
  } catch {
    return null;
  }
}

/** Salva (o cancella con null) la casa. Silenzioso se lo storage non è disponibile. */
export function storeHome(key: string, home: HomePosition | null): void {
  try {
    if (home) window.localStorage.setItem(key, JSON.stringify({ left: Math.round(home.left), top: Math.round(home.top) }));
    else window.localStorage.removeItem(key);
  } catch {
    /* storage non disponibile */
  }
}
