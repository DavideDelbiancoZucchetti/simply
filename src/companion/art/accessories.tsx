import type { Accessory } from "../../types";
import { C } from "../../theme";

// Cappelli e orecchie: appoggiati di sbieco sulla cupola, il pomello resta libero
export function HatArt({ kind }: { kind: Accessory }) {
  switch (kind) {
    case "santa-hat":
      return (
        <g transform="translate(80 67) rotate(-18)">
          <path d="M-16 -2C-12 -26 -2 -38 -22 -42C0 -48 14 -30 16 -2Z" fill="#D7263D" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M-9 -12C-7 -22 -2 -30 -12 -36" stroke="#F06476" strokeWidth="3" fill="none" strokeLinecap="round" />
          <rect x="-20" y="-6" width="40" height="11" rx="5.5" fill="#fff" stroke={C.ink} strokeWidth="3" />
          <circle cx="-23" cy="-42" r="6.5" fill="#fff" stroke={C.ink} strokeWidth="3" />
        </g>
      );
    case "witch-hat":
      return (
        <g transform="translate(80 66) rotate(-16)">
          <ellipse cx="0" cy="0" rx="27" ry="6.5" fill="#3B2A55" stroke={C.ink} strokeWidth="3" />
          <path d="M-13 -2L-4 -38Q0 -46 7 -42Q3 -38 3 -34L13 -2Z" fill="#3B2A55" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M-12.2 -7L12.2 -7L11.2 -12.5L-11 -12.5Z" fill="#F28C28" stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />
          <rect x="-3.5" y="-13.5" width="7" height="7.5" rx="1.5" fill="none" stroke={C.gold} strokeWidth="2" />
        </g>
      );
    case "party-hat":
      return (
        <g transform="translate(80 66) rotate(-16)">
          <path d="M-14 -2L0 -38L14 -2Z" fill={C.gold} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M-9 -14L9 -14M-5 -25L5 -25" stroke={C.coral} strokeWidth="4" strokeLinecap="round" />
          <circle cx="-4" cy="-8" r="1.8" fill={C.teal} /><circle cx="5" cy="-19" r="1.6" fill={C.teal} />
          <circle cx="0" cy="-40" r="5" fill={C.coral} stroke={C.ink} strokeWidth="2.5" />
          <path d="M-15 -1Q0 4 15 -1" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "earmuffs": {
      // archetto sopra la cupola (passa davanti alla base del pomello) e due cuffie di pelo ai lati
      const muff = (cx: number) => (
        <g>
          {Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2;
            return <circle key={i} cx={cx + Math.cos(a) * 10.5} cy={98 + Math.sin(a) * 10.5} r="5" fill="#fff" stroke={C.ink} strokeWidth="2.2" />;
          })}
          <circle cx={cx} cy="98" r="11.5" fill="#fff" />
          <circle cx={cx} cy="98" r="6.5" fill="#FFC2D4" />
          <circle cx={cx - 2} cy="96" r="2" fill="#fff" opacity=".8" />
        </g>
      );
      return (
        <g>
          <path d="M42 92C42 48 158 48 158 92" stroke={C.ink} strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M42 92C42 48 158 48 158 92" stroke={C.purpleLight} strokeWidth="5.5" fill="none" strokeLinecap="round" />
          {muff(41)}
          {muff(159)}
        </g>
      );
    }

    case "bunny-ears":
      return (
        <g>
          <g className="simply-ear-l">
            <path d="M74 70C64 52 60 26 69 17C78 10 86 40 86 68Z" fill="#fff" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
            <path d="M76 63C70 48 68 30 72 24C76 21 81 42 81 63Z" fill="#FFB3C7" />
          </g>
          <g className="simply-ear-r">
            <path d="M126 70C136 52 140 26 131 17C122 10 114 40 114 68Z" fill="#fff" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
            <path d="M124 63C130 48 132 30 128 24C124 21 119 42 119 63Z" fill="#FFB3C7" />
          </g>
        </g>
      );
    default:
      return null;
  }
}

// Sciarpa a righe: avvolge il collo (sopra il colletto), il fermaglio SB resta in vista
export function ScarfArt() {
  return (
    <g>
      <path d="M41 119Q100 135 159 119L161 131Q100 149 39 131Z" fill="#E8483A" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M56 125.5L58 135M72 129L73.5 139M128 129L126.5 139M144 125.5L142 135" stroke="#FFF3CF" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 129L52 166L66 168L71 133Z" fill="#E8483A" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M55.5 146L68.5 148M54.5 155L67.5 157" stroke="#FFF3CF" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M53 167v4M57 167.5v4M61 168v4M65 168.5v4" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

// Occhiali da sole: coprono gli occhi, con riflesso
export function SunglassesArt() {
  return (
    <g>
      <path d="M67 95L51 91M133 95L149 91" stroke={C.ink} strokeWidth="3" strokeLinecap="round" />
      <rect x="66" y="88.5" width="28" height="18" rx="7.5" fill="#1F1F23" stroke={C.ink} strokeWidth="2.5" />
      <rect x="106" y="88.5" width="28" height="18" rx="7.5" fill="#1F1F23" stroke={C.ink} strokeWidth="2.5" />
      <path d="M94 95Q100 91 106 95" stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M71 101L78 92M111 101L118 92" stroke="#fff" strokeOpacity=".55" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}
