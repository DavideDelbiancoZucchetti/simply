import type { SVGProps } from "react";

/** Palette di Simply. */
export const C = {
  ink: "#1F1F23",
  gold: "#F7C325",
  goldDark: "#E0A812",
  purple: "#5E2A92",
  purpleLight: "#7A3FB5",
  cream: "#FFF3CF",
  fleur: "#F2DE96",
  coral: "#FF5A3C",
  tongue: "#FF6F6F",
  blush: "#FF8A7A",
  teal: "#1E9C95",
} as const;

/** viewBox del disegno: tutte le coordinate SVG sono in questo sistema. */
export const VB = { x: -16, y: 8, w: 236, h: 198 } as const;

/** Spalle: i pivot di tutte le pose delle braccia. */
export const SH_L: readonly [number, number] = [44, 128];
export const SH_R: readonly [number, number] = [156, 128];

/** Stile comune dei tratti delle braccia. */
export const ARM: SVGProps<SVGPathElement> = { stroke: C.ink, strokeWidth: 9, fill: "none", strokeLinecap: "round" };
