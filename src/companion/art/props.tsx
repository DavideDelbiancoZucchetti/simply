import type { PropName } from "../../types";
import { C } from "../../theme";
import { CONFETTI } from "../constants";

/** Il librone: tenuto a due mani davanti alla pancia. */
export function BigBook() {
  return (
    <g className="simply-prop" style={{ transformOrigin: "100px 150px" }}>
      <path d="M50 139Q75 129 100 139Q125 129 150 139V170Q125 160 100 170Q75 160 50 170Z" fill={C.purple} stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M54 136Q77 127 100 136V165Q77 156 54 165Z" fill="#fff" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M100 136Q123 127 146 136V165Q123 156 100 165Z" fill="#fff" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
      <g stroke="#CFCAD6" strokeWidth="2" strokeLinecap="round">
        <path d="M62 141Q75 136 92 140M62 148Q75 143 92 147M62 155Q72 151 86 154M108 140Q125 136 138 141M108 147Q125 143 138 148M108 154Q120 150 132 154" />
      </g>
      <path className="simply-page-flip" d="M100 136Q123 127 146 136V165Q123 156 100 165Z" fill={C.cream} stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
    </g>
  );
}

export function PropArt({ prop }: { prop: PropName | null }) {
  switch (prop) {
    case "calendar":
      return (
        <g transform="rotate(8 186 124)">
          <rect x="166" y="102" width="40" height="44" rx="5" fill="#fff" stroke={C.ink} strokeWidth="3" />
          <path d="M166 113V107A5 5 0 0 1 171 102H201A5 5 0 0 1 206 107V113Z" fill={C.teal} stroke={C.ink} strokeWidth="3" />
          {[174, 182, 190, 198].map((x) => <rect key={x} x={x - 1.5} y="97" width="3" height="9" rx="1.5" fill={C.ink} />)}
          {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
            <rect key={`${r}${c}`} x={171 + c * 8.5} y={118 + r * 8.5} width="6" height="6" rx="1.2"
              fill={r === 1 && c === 2 ? C.coral : "#E7E3DD"} />
          )))}
        </g>
      );

    case "magnifier":
      return (
        <>
          <path d="M139 124L129 110" stroke={C.ink} strokeWidth="7" strokeLinecap="round" />
          <circle cx="121" cy="98" r="15" fill="#E8F6FF" />
          <ellipse cx="121" cy="99" rx="9" ry="11" fill={C.ink} />
          <circle cx="124.5" cy="94.5" r="3.2" fill="#fff" />
          <path d="M110 92A12 12 0 0 1 117 85" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="121" cy="98" r="15" fill="none" stroke={C.ink} strokeWidth="4.5" />
        </>
      );

    case "chart":
      return (
        <g transform="rotate(6 187 122)">
          <rect x="165" y="100" width="44" height="44" rx="6" fill="#fff" stroke={C.ink} strokeWidth="3" />
          <path d="M171 138H203" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
          {([[172, 12, C.purpleLight], [183, 20, C.teal], [194, 30, C.coral]] as const).map(([x, h, c], i) => (
            <rect key={x} className="simply-bar" x={x} y={138 - h} width="8" height={h} rx="2" fill={c}
              style={{ transformOrigin: `${x + 4}px 138px`, animationDelay: `${i * 0.15}s` }} />
          ))}
        </g>
      );

    case "key":
      return (
        <>
          <g className="simply-swing">
            <path d="M183 62Q192 64 194 74" stroke={C.ink} strokeWidth="2" fill="none" />
            <g transform="rotate(-10 196 86)">
              <rect x="188" y="73" width="17" height="25" rx="4.5" fill={C.coral} stroke={C.ink} strokeWidth="2.5" />
              <circle cx="196.5" cy="78" r="1.9" fill={C.ink} />
              <text x="196.5" y="92" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="system-ui,sans-serif">12</text>
            </g>
          </g>
          <rect x="174.5" y="70" width="5" height="24" rx="2" fill={C.gold} stroke={C.ink} strokeWidth="2.2" />
          <path d="M179.5 80h5v3.5h-5M179.5 86h4v3h-4" fill={C.gold} stroke={C.ink} strokeWidth="2" />
          <circle cx="177" cy="62" r="10" fill={C.gold} stroke={C.ink} strokeWidth="2.8" />
          <circle cx="177" cy="62" r="3.5" fill="#fff" stroke={C.ink} strokeWidth="2" />
          <path d="M171 58A7 7 0 0 1 176 54" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      );

    case "lightbulb":
      return (
        <>
          <circle className="simply-glow" cx="177" cy="63" r="25" fill="#FFE66D" />
          <g className="simply-rays" stroke={C.goldDark} strokeWidth="3" strokeLinecap="round">
            {[-90, -45, -135, 0, 180].map((a) => {
              const r = (a * Math.PI) / 180;
              return <line key={a} x1={177 + 21 * Math.cos(r)} y1={63 + 21 * Math.sin(r)} x2={177 + 28 * Math.cos(r)} y2={63 + 28 * Math.sin(r)} />;
            })}
          </g>
          <path d="M170 72H184L182 81H172Z" fill="#FFF7B0" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <circle cx="177" cy="63" r="14" fill="#FFF7B0" stroke={C.ink} strokeWidth="3" />
          <path d="M172 66Q174.5 58 177 66Q179.5 58 182 66" stroke={C.goldDark} strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M171 69A8 8 0 0 1 170 60" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <rect x="171" y="81" width="12" height="9" rx="2" fill="#BFC3CC" stroke={C.ink} strokeWidth="2.5" />
        </>
      );

    case "envelope":
      return (
        <g className="simply-fly">
          <rect x="165" y="119" width="34" height="23" rx="3" fill="#fff" stroke={C.ink} strokeWidth="3" />
          <path d="M166 121L182 133L198 121" fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="182" cy="133" r="3.2" fill={C.coral} />
        </g>
      );

    case "wrench":
      return (
        <g className="simply-twist">
          <rect x="173.5" y="110" width="8" height="40" rx="4" fill="#A3A9B4" stroke={C.ink} strokeWidth="2.5" />
          <path d="M168.5 104A9 9 0 0 1 174 95.7V102H181V95.7A9 9 0 0 1 186.5 104A9 9 0 0 1 168.5 104Z"
            fill="#A3A9B4" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
        </g>
      );

    case "coffee":
      return (
        <>
          {[171, 178, 185].map((x, i) => (
            <path key={x} className="simply-steam" d={`M${x} 116q-3 -4 0 -8q3 -4 0 -8`} stroke={C.ink} strokeOpacity=".6"
              strokeWidth="3" fill="none" strokeLinecap="round" style={{ animationDelay: `${i * 0.5}s` }} />
          ))}
          <path d="M190 125q8 0 7.5 6q-.5 6 -7.5 6" fill="none" stroke={C.ink} strokeWidth="3" />
          <path d="M166 120H190V134Q190 143 178 143Q166 143 166 134Z" fill="#fff" stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M167.5 126H188.5" stroke={C.purple} strokeWidth="4" />
        </>
      );

    case "confetti":
      return (
        <>
          {CONFETTI.map(([, , c, shape], i) => {
            const style = { transformOrigin: "197px 67px" };
            return shape === "c"
              ? <circle key={i} className={`simply-confetti-${i}`} cx="197" cy="67" r="3.6" fill={c} style={style} />
              : <rect key={i} className={`simply-confetti-${i}`} x="193" y="65" width="8" height="4" rx="1.2" fill={c} style={style} />;
          })}
          <path d="M177 97L189 63Q198 62 205 71Z" fill={C.coral} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d="M181.8 83.4L188.2 86.6M185.4 73.2L196.6 78.8" stroke={C.gold} strokeWidth="3" strokeLinecap="round" />
        </>
      );

    case "ok":
      return (
        <>
          <g className="simply-ok-spark" fill={C.gold} stroke={C.ink} strokeWidth="1.5" strokeLinejoin="round">
            <path d="M199 62l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
            <path d="M156 66l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4Z" />
          </g>
          {/* gesto dell'OK: pollice e indice ad anello, le altre tre dita in su */}
          <g transform="translate(177 90) rotate(8)">
            <g className="simply-ok-hand" fill={C.ink}>
              <rect x="-9" y="-6" width="18" height="17" rx="7.5" />
              <rect x="-0.5" y="-19" width="4.6" height="15" rx="2.3" />
              <rect x="4.4" y="-17.5" width="4.4" height="14" rx="2.2" transform="rotate(6 6.6 -10)" />
              <rect x="8.6" y="-14" width="4" height="11" rx="2" transform="rotate(14 10.6 -8)" />
              <circle cx="-7" cy="-9" r="5.6" fill="none" stroke={C.ink} strokeWidth="4.2" />
            </g>
          </g>
        </>
      );

    case "gift":
      return (
        <g transform="rotate(6 184 128)">
          <rect x="166" y="114" width="36" height="30" rx="4" fill="#D7263D" stroke={C.ink} strokeWidth="3" />
          <rect x="163" y="107" width="42" height="10" rx="3" fill="#E8485C" stroke={C.ink} strokeWidth="3" />
          <path d="M184 107V144" stroke={C.gold} strokeWidth="6" />
          <path d="M184 107C176 96 168 100 172 106C175 109 184 107 184 107ZM184 107C192 96 200 100 196 106C193 109 184 107 184 107Z" fill={C.gold} stroke={C.ink} strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      );

    case "pumpkin":
      return (
        <g>
          <path d="M185 108q2-7 7-8" stroke="#3E7D2E" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="185" cy="126" rx="21" ry="17" fill="#F28C28" stroke={C.ink} strokeWidth="3" />
          <path d="M178 110Q172 126 178 142M192 110Q198 126 192 142" stroke="#D96F12" strokeWidth="2.5" fill="none" />
          <path d="M175 120l4-4 4 4ZM187 120l4-4 4 4Z" fill={C.ink} />
          <path d="M174 129q11 9 22 0q-3 6-5 5l-2-3-2 3-3-3-2 3-3-3q-3 1-5-2Z" fill={C.ink} />
        </g>
      );

    case "egg":
      return (
        <g transform="rotate(8 184 126)">
          <path d="M184 104C196 104 202 120 202 130C202 140 194 147 184 147C174 147 166 140 166 130C166 120 172 104 184 104Z" fill="#B9E4F5" stroke={C.ink} strokeWidth="3" />
          <path d="M167.5 124l5.5-4 5.5 4 5.5-4 5.5 4 5.5-4 5.5 4" stroke="#FF8FB0" strokeWidth="3" fill="none" strokeLinejoin="round" />
          <path d="M167 134h34" stroke={C.gold} strokeWidth="3" />
          <circle cx="178" cy="141" r="2" fill="#7A3FB5" /><circle cx="190" cy="141" r="2" fill="#7A3FB5" /><circle cx="184" cy="113" r="2.2" fill="#7A3FB5" />
        </g>
      );

    case "ponder":
      // 🤔 mano sotto il mento: pugno chiuso con l'indice che tamburella sulla guancia
      return (
        <g transform="translate(117 129) rotate(-14)">
          <g className="simply-ponder-finger">
            <rect x="-8.5" y="-17" width="5.4" height="13" rx="2.7" fill={C.ink} />
          </g>
          <ellipse cx="0" cy="0" rx="9" ry="8" fill={C.ink} />
          <path d="M-3 -2.5h7M-2.5 1.5h6.5" stroke="#45454D" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="6.5" cy="-5" rx="3.4" ry="4.4" transform="rotate(25 6.5 -5)" fill={C.ink} />
        </g>
      );

    case "mic":
      // microfono da intervista tenuto alzato: luce REC che lampeggia e onde sonore
      return (
        <>
          <g className="simply-mic-waves" stroke={C.purpleLight} strokeWidth="2.6" fill="none" strokeLinecap="round">
            <path d="M193 58Q198 66 193 74" />
            <path d="M199 53Q207 66 199 79" style={{ animationDelay: ".25s" }} />
            <path d="M161 58Q156 66 161 74" />
            <path d="M155 53Q147 66 155 79" style={{ animationDelay: ".25s" }} />
          </g>
          <path d="M172 76H182L180 100H174Z" fill="#2C2C31" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" />
          <circle className="simply-mic-rec" cx="177" cy="83" r="2.4" fill={C.coral} />
          <rect x="169.5" y="72" width="15" height="6" rx="2" fill="#8C8F99" stroke={C.ink} strokeWidth="2.2" />
          <circle cx="177" cy="64" r="10.5" fill="#B9BDC7" stroke={C.ink} strokeWidth="2.8" />
          <path d="M169 61.5h16M168 66.5h18M171 57h12M171.5 71h11" stroke="#8C8F99" strokeWidth="1.4" />
          <path d="M172 60A6 6 0 0 1 176 56" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
        </>
      );

    case "flag":
      return (
        <>
          <rect x="175" y="30" width="4" height="76" rx="2" fill={C.ink} />
          <circle cx="177" cy="30" r="3.5" fill={C.ink} />
          <g className="simply-flag-cloth">
            <path d="M179 34L210 45 179 57Z" fill={C.coral} stroke={C.coral} strokeWidth="2" strokeLinejoin="round" />
            <path d="M190 40l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5Z" fill="#fff" />
          </g>
        </>
      );

    default:
      return null;
  }
}
