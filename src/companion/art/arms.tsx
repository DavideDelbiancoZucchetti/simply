import { ARM, C, SH_L, SH_R } from "../../theme";

/** Manina a muffola col palmo verso chi guarda: dita in su, pollice verso il corpo. */
export function WaveHand({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-12)`} fill={C.ink}>
      <rect x="-8" y="-11" width="16" height="21" rx="8" />
      <ellipse cx="8.5" cy="3" rx="4.5" ry="6" transform="rotate(35 8.5 3)" />
    </g>
  );
}

/** Mano che copre l'occhio (mood "privacy" o quando indica una password). */
export function CoverArm({ side, peek }: { side: "l" | "r"; peek?: boolean }) {
  const r = side === "r";
  const [ex, ey] = r ? [120, 97] : [80, 97];
  return (
    <g key={`cover-${side}`} className="simply-prop" style={{ transformOrigin: `${r ? SH_R[0] : SH_L[0]}px 128px` }}>
      <path d={r ? "M156 128Q154 110 130 103" : "M44 128Q46 110 70 103"} {...ARM} />
      <g className={peek ? "simply-peek" : undefined}>
        <g transform={`translate(${ex} ${ey}) scale(${r ? -1 : 1} 1)`}>
          <ellipse cx="0" cy="0" rx="13" ry="12" fill={C.ink} />
          <ellipse cx="-11" cy="7" rx="4" ry="6" transform="rotate(35 -11 7)" fill={C.ink} />
          <path d="M-3 -10V3M3 -10V3M9 -8V3" stroke="#45454D" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
}

/** Braccio teso con l'indice, ruotato attorno alla spalla. */
export function PointingArm({ side, deg }: { side: "l" | "r"; deg: number }) {
  const [sx, sy] = side === "r" ? SH_R : SH_L;
  return (
    <g style={{ transform: `translate(${sx}px, ${sy}px) rotate(${deg}deg)`, transformOrigin: "0 0", transition: "transform .25s ease-out" }}>
      <g transform={side === "l" ? "scale(-1 1)" : undefined}>
        <path d="M0 0Q15 6 30 0" {...ARM} />
        <g className="simply-poke">
          <rect x="34" y="-3.2" width="15" height="6.5" rx="3.2" fill={C.ink} />
          <circle cx="32" cy="0.5" r="8.5" fill={C.ink} />
          <ellipse cx="33.5" cy="-7.2" rx="4.2" ry="2.6" fill={C.ink} />
        </g>
      </g>
    </g>
  );
}
