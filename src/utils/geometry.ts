import type { Point, PointTarget, Rect } from "../types";

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/** Risolve un PointTarget in elemento DOM o punto. */
export function resolveTarget(t: PointTarget): Element | Point | null {
  if (!t || typeof window === "undefined") return null;
  if (typeof t === "string") return document.querySelector(t);
  if (t instanceof Element) return t;
  if ("current" in t) return t.current ?? null;
  if (typeof (t as Point).x === "number" && typeof (t as Point).y === "number") return t as Point;
  return null;
}

/**
 * Area davvero visibile, in coordinate client:
 * esclude la scrollbar (clientWidth) e la tastiera su mobile (visualViewport).
 * min(): in quirks mode clientHeight è l'altezza del documento, non della finestra.
 */
export function vpSize(): { w: number; h: number; top: number } {
  const de = document.documentElement;
  const vv = window.visualViewport;
  const w = Math.min(window.innerWidth, de.clientWidth || Infinity, vv ? vv.offsetLeft + vv.width : Infinity);
  const h = Math.min(window.innerHeight, de.clientHeight || Infinity, vv ? vv.offsetTop + vv.height : Infinity);
  return { w, h, top: vv ? vv.offsetTop : 0 };
}

/** Quota (0-1) di un rettangolo che cade dentro la finestra. */
export function visibleFraction(r: Rect): number {
  const { w: vw, h: vh } = vpSize();
  const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
  const area = (r.right - r.left) * (r.bottom - r.top);
  if (area > 0) return (w * h) / area;
  return r.left >= 0 && r.left <= vw && r.top >= 0 && r.top <= vh ? 1 : 0;
}

/** Rettangolo visibile di un contenitore che scorre (intersecato con la finestra). */
export function viewRect(container: Element | null): Rect {
  const { w: vw, h: vh } = vpSize();
  if (!container) return { left: 0, top: 0, right: vw, bottom: vh };
  const c = container.getBoundingClientRect();
  return { left: Math.max(0, c.left), top: Math.max(0, c.top), right: Math.min(vw, c.right), bottom: Math.min(vh, c.bottom) };
}

/** Angolo in basso a destra, quando non c'è un posto migliore in vista. */
export function cornerSpot(w: number, h: number): { left: number; top: number } {
  const { w: vw, h: vh } = vpSize();
  return { left: Math.round(vw - w - 16), top: Math.round(vh - h - 16) };
}

/** Dove mettersi vicino al bersaglio: a sinistra (indica con la destra), altrimenti a destra, altrimenti sopra/sotto. */
export function nearTarget(t: Rect, w: number, h: number): { left: number; top: number } {
  const { w: vw, h: vh, top: vt } = vpSize();
  const m = 8, gap = 10, topMin = 72 + vt;
  const cy = (t.top + t.bottom) / 2;
  let top = cy - h * 0.6;
  let left = t.left - w * 0.95 - gap;
  if (left < m) left = t.right - w * 0.05 + gap;
  left = clamp(left, m, Math.max(m, vw - w - m));
  if (left < t.right && left + w > t.left) {          // si sovrapporrebbe: sotto, o sopra
    top = t.bottom + gap;
    if (top + h > vh - m) top = t.top - h - gap;
  }
  top = clamp(top, topMin, Math.max(topMin, vh - h - m));
  return { left: Math.round(left), top: Math.round(top) };
}

/** Dispositivo touch senza hover (telefono, tablet). */
export const isTouchDevice = (): boolean =>
  typeof window !== "undefined" && !!window.matchMedia?.("(hover: none) and (pointer: coarse)").matches;
