import { useEffect, useRef, useState } from "react";
import { SIMPLY_COLORS as C } from "../src";
import { HIND_500, HIND_700 } from "./hindFont";

/* Intro della demo (non fa parte del componente) */
// Brand SimpleBooking: icona ufficiale, giallo #F2C812, scuro #232735 / #16191D, font Hind (simplebooking.travel)
export const SB = { yellow: "#F2C812", ink: "#232735", dark: "#16191D", font: "'Hind', system-ui, -apple-system, 'Segoe UI', sans-serif" };

function SBIconPaths() {
  return (
    <svg viewBox="0 0 192 192" width="100%" height="100%" aria-hidden="true" style={{ display: "block" }}>
      <path fill={SB.ink} d="M122.643 100.819H111.631V121.993H123.29C128.148 121.993 131.873 121.059 134.14 119.346C136.407 117.478 137.702 114.831 137.702 111.095C137.54 104.244 132.52 100.819 122.643 100.819ZM132.035 71.2368C129.606 69.8355 125.881 69.2127 120.861 69.2127H111.469V87.2733H121.833C126.691 87.2733 130.253 86.4949 132.358 85.0936C134.464 83.6923 135.597 81.2012 135.597 77.9316C135.597 74.8177 134.464 72.638 132.035 71.2368ZM140.941 93.1897V93.8125C146.284 94.9024 150.171 97.0821 152.438 100.196C154.867 103.31 156 107.514 156 112.652C156 119.969 153.247 125.73 147.742 129.934C142.236 134.137 134.625 136.161 125.072 136.161H93.4953V55.2002H119.728C131.711 55.2002 140.293 56.9128 145.799 60.0267C151.142 63.2963 153.895 68.4343 153.895 75.5962C153.895 80.4228 152.762 84.4708 150.333 87.5847C148.066 90.6986 144.989 92.5669 140.941 93.1897Z" />
      <path fill={SB.ink} d="M48.6305 83.009C50.8975 81.6077 54.2981 80.9849 58.8321 80.9849C64.0138 80.9849 69.6814 82.2305 75.9966 84.7216L79.3972 77.2483C72.92 74.6014 66.2809 73.2002 59.4798 73.2002C52.193 73.2002 46.5254 74.7571 42.3153 77.5597C38.1051 80.3622 36 84.2545 36 89.2368C36 92.0393 36.6477 94.3747 37.7812 96.3987C38.9147 98.2671 40.8579 100.135 43.2868 101.692C45.7158 103.249 49.926 104.962 55.7554 107.142C61.9088 109.321 66.1189 111.345 68.224 113.058C70.3291 114.771 71.4626 116.795 71.4626 119.13C71.4626 122.244 70.1672 124.58 67.4144 126.136C64.8235 127.693 60.9372 128.472 55.9173 128.472C52.6788 128.472 49.2782 128.005 45.8777 127.226C42.4772 126.448 39.2386 125.358 36.1619 123.801V132.364C40.8579 135.011 47.3351 136.257 55.7554 136.257C63.69 136.257 69.8433 134.7 74.2154 131.586C78.5875 128.472 80.8545 124.112 80.8545 118.507C80.8545 114.615 79.5591 111.19 76.9682 108.543C74.3773 105.896 69.1956 103.249 61.7468 100.602C56.4031 98.5785 52.6788 97.1772 50.7356 96.0873C48.7924 94.9975 47.3351 93.9076 46.5254 92.8177C45.7158 91.5722 45.23 90.1709 45.23 88.614C45.23 86.2786 46.3635 84.4102 48.6305 83.009Z" />
    </svg>
  );
}

/**
 * Fase 0: brand SimpleBooking (sfondo scuro, icona sB, "Simple Booking" in Hind bianco).
 * Fase 1: diventa "Simply the Best" e passa ai colori di Simply (lo sfondo si schiarisce).
 * Fase 3: l'icona vola sul fermaglio del mantello trasformandosi in medaglia, la S e la B ci atterrano sopra.
 * Fase 4: compare Simply.
 */
export function DemoIntro({ onLand, onDone, target = ".simply-medal", tagline = "Il piccolo aiutante di SimpleBooking" }: {
  onLand?: () => void; onDone?: () => void; target?: string; tagline?: string;
}) {
  const [phase, setPhase] = useState(0);
  const [fly, setFly] = useState<{ s: string; b: string; icon: string } | null>(null);
  const sRef = useRef<HTMLSpanElement>(null), bRef = useRef<HTMLSpanElement>(null), iconRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false), landedRef = useRef(false);
  const cb = useRef({ onLand, onDone });
  cb.current = { onLand, onDone };
  const land = () => { if (!landedRef.current) { landedRef.current = true; cb.current.onLand?.(); } };
  const finish = () => { if (doneRef.current) return; doneRef.current = true; land(); cb.current.onDone?.(); };


  useEffect(() => {
    const ts: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => ts.push(setTimeout(fn, ms));
    at(1500, () => setPhase(1));
    at(2700, () => setPhase(2));
    // Posizioni di partenza (prima di qualsiasi trasformazione) e mira sul fermaglio di Simply, ricalcolata
    // durante il volo: se Simply si sposta (resize, layout) le lettere lo seguono invece di atterrare nel vuoto
    let base: { s: DOMRect; b: DOMRect; i: DOMRect } | null = null;
    let lastAim: [number, number] | null = null;
    const aim = () => {
      const medal = document.querySelector(target);
      if (!medal || !base) return;
      const m = medal.getBoundingClientRect();
      if (!m.width) return;
      const cx = m.left + m.width / 2, cy = m.top + m.height / 2;
      // ricalcola solo se il fermaglio si è davvero spostato: ogni nuova mira riavvia la transizione
      if (lastAim && Math.hypot(cx - lastAim[0], cy - lastAim[1]) < 6) return;
      lastAim = [cx, cy];
      const toCenter = (r: DOMRect, tx: number, sc: number) => `translate(${tx - (r.left + r.width / 2)}px, ${cy - (r.top + r.height / 2)}px) scale(${sc})`;
      const letterSc = Math.max(0.04, (m.height * 0.46) / base.s.height);
      const off = m.width * 0.16;
      setFly({
        s: toCenter(base.s, cx - off, letterSc),
        b: toCenter(base.b, cx + off, letterSc),
        icon: toCenter(base.i, cx, Math.max(0.04, m.width / base.i.width)),
      });
    };
    at(3900, () => {
      const sr = sRef.current?.getBoundingClientRect();
      const br = bRef.current?.getBoundingClientRect();
      const ir = iconRef.current?.getBoundingClientRect();
      if (sr && br && ir) base = { s: sr, b: br, i: ir };
      aim();
      setPhase(3);
    });
    [4150, 4400, 4650].forEach((ms) => at(ms, aim));
    at(4900, () => { setPhase(4); land(); });
    at(5600, finish);
    return () => ts.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cls = ["demo-intro", phase >= 1 && "morphed", phase >= 2 && "tag", phase >= 3 && "fly", phase >= 4 && "out"].filter(Boolean).join(" ");
  return (
    <div className={cls} onClick={finish} role="presentation">
      <style>{DEMO_INTRO_CSS}</style>
      <div className="demo-intro-row">
        <div ref={iconRef} className="demo-intro-icon" style={fly ? { transform: fly.icon } : undefined}>
          <div className="demo-intro-icon-paths"><SBIconPaths /></div>
        </div>
        <div className="demo-intro-word" aria-label={phase >= 1 ? "Simply the Best" : "Simple Booking"}>
          <span ref={sRef} className="seg keep s" style={fly ? { transform: fly.s } : undefined}>S</span>
          <span className="seg fade">impl</span>
          <span className="seg fade sw out-1">e</span>
          <span className="seg fade sw in-1">y</span>
          <span className="seg fade"> </span>
          <span className="seg fade sw in-2">the </span>
          <span ref={bRef} className="seg keep b" style={fly ? { transform: fly.b } : undefined}>B</span>
          <span className="seg fade sw out-1">ooking</span>
          <span className="seg fade sw in-3">est</span>
        </div>
      </div>
      <p className="demo-intro-tag">{tagline}</p>
      <button className="demo-intro-skip" onClick={(e) => { e.stopPropagation(); finish(); }}>Salta ›</button>
    </div>
  );
}


const DEMO_INTRO_CSS = `
@font-face{font-family:'Hind';font-style:normal;font-weight:500;font-display:block;src:url(data:font/woff2;base64,${HIND_500}) format('woff2')}
@font-face{font-family:'Hind';font-style:normal;font-weight:700;font-display:block;src:url(data:font/woff2;base64,${HIND_700}) format('woff2')}
.demo-intro{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;
  font-family:${SB.font};color:#fff;cursor:pointer;overflow:hidden}
/* niente dissolvenza incrociata (a metà si vedrebbe la pagina sotto): il chiaro sfuma SOPRA lo scuro,
   e lo scuro sparisce di colpo solo quando il chiaro è già pieno */
.demo-intro::before,.demo-intro::after{content:"";position:absolute;inset:0;z-index:-1}
.demo-intro::before{background:radial-gradient(circle at 50% 45%,#2B2F3D 0%,${SB.dark} 70%);transition:opacity 0s linear}
.demo-intro::after{background:radial-gradient(circle at 50% 42%,#fff 0%,#F3ECFB 70%);opacity:0;transition:opacity .9s ease}
.demo-intro.morphed::before{opacity:0;transition-delay:.95s}
.demo-intro.morphed::after{opacity:1}
.demo-intro.out::after{opacity:0}
.demo-intro-row{display:flex;align-items:center;gap:clamp(12px,2.4vw,24px);animation:demo-intro-in .8s cubic-bezier(.34,1.56,.64,1) both}
@keyframes demo-intro-in{from{opacity:0;transform:translateY(16px) scale(.94)}to{opacity:1;transform:none}}
.demo-intro-icon{flex:0 0 auto;width:clamp(56px,11vw,104px);aspect-ratio:1;border-radius:17%;background:#F6D959;position:relative;overflow:hidden;
  box-shadow:0 8px 24px rgba(0,0,0,.25);transform-origin:center;
  transition:transform 1s cubic-bezier(.65,0,.25,1),border-radius 1s ease,background-color .8s ease,box-shadow .6s,border-color .6s;
  border:0 solid ${C.ink}}
.demo-intro-icon-paths{position:absolute;inset:0;transition:opacity .5s ease}
.demo-intro.fly .demo-intro-icon{border-radius:50%;background:${C.cream};box-shadow:none}
.demo-intro.fly .demo-intro-icon-paths{opacity:0}
.demo-intro.out .demo-intro-icon{opacity:0;transition:opacity .3s ease .2s}
.demo-intro-word{font-weight:700;font-size:clamp(32px,8vw,84px);letter-spacing:-.01em;line-height:1;white-space:nowrap;padding-top:.12em;
  transition:color .8s ease}
.demo-intro.morphed .demo-intro-word{color:${C.ink}}
.demo-intro .seg{display:inline-block;white-space:pre;overflow:hidden;vertical-align:bottom;
  padding:.12em 0 .3em;margin:-.12em 0 -.3em;
  transition:max-width .55s cubic-bezier(.6,0,.2,1),opacity .4s ease,transform 1s cubic-bezier(.65,0,.25,1),color .8s,-webkit-text-stroke-color .8s}
.demo-intro .sw{max-width:0;opacity:0}
.demo-intro .out-1{max-width:4em;opacity:1}
.demo-intro.morphed .out-1{max-width:0;opacity:0}
.demo-intro.morphed .in-1{max-width:1em;opacity:1}
.demo-intro.morphed .in-2{max-width:2.6em;opacity:1;transition-delay:.12s}
.demo-intro.morphed .in-3{max-width:2.2em;opacity:1;transition-delay:.25s}
.demo-intro .seg.keep{overflow:visible;-webkit-text-stroke:2px transparent}
.demo-intro.morphed .in-2{color:${C.purpleLight}}
.demo-intro.morphed .seg.s{color:${C.purple}}
.demo-intro.morphed .seg.b{color:${C.gold};-webkit-text-stroke-color:${C.ink}}
.demo-intro-tag{margin:0;font-size:clamp(15px,2.4vw,21px);font-weight:500;opacity:0;transform:translateY(8px);transition:opacity .5s,transform .5s;color:${C.ink}}
.demo-intro.tag .demo-intro-tag{opacity:.75;transform:none}
.demo-intro.fly .seg.fade,.demo-intro.fly .demo-intro-tag{opacity:0!important;transition-delay:0s}
.demo-intro.fly .seg.keep{color:${C.ink};-webkit-text-stroke-color:transparent}
.demo-intro.out .seg.keep{opacity:0;transition:opacity .3s ease .2s}
.demo-intro-skip{position:absolute;right:20px;top:16px;border:1.5px solid rgba(255,255,255,.6);background:transparent;border-radius:999px;padding:6px 14px;
  font:600 13px ${SB.font};color:#fff;cursor:pointer;transition:opacity .3s,color .8s,border-color .8s}
.demo-intro.morphed .demo-intro-skip{color:${C.ink};border-color:${C.ink}}
.demo-intro.fly .demo-intro-skip{opacity:0}
@media (max-width:520px){.demo-intro-row{flex-direction:column}}
`;

