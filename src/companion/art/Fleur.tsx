import { C } from "../../theme";

/** Il giglio sul mantello. */
export function Fleur({ x, y, s = 1, r = 0 }: { x: number; y: number; s?: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r} 10 11) scale(${s})`} fill={C.fleur} stroke={C.ink} strokeWidth="1.2" strokeLinejoin="round">
      <path d="M10 0C14 5 14 10 10 14 6 10 6 5 10 0Z" />
      <path d="M9 13C4 14 0 10 1.5 5.5 3 9 6 10.5 9 11Z" />
      <path d="M11 13C16 14 20 10 18.5 5.5 17 9 14 10.5 11 11Z" />
      <rect x="4" y="12.5" width="12" height="2.6" rx="1.2" />
      <path d="M7.5 15.5 10 21.5 12.5 15.5Z" />
    </g>
  );
}
