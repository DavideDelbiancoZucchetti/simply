import { C, SH_L, SH_R } from "../theme";
import { CONFETTI, PUFF } from "./constants";

export const COMPANION_STYLE_ID = "simply-companion-styles";

const PUFF_CSS = PUFF.map(([dx, dy, sz, kind], i) => `
.simply-puff-${i}{width:${sz}px;height:${sz}px;left:${-sz / 2}px;top:${-sz / 2}px;${kind === "s" ? `background:${C.gold};border:none;` : ""}animation:simply-puff-${i} .5s ease-out forwards}
@keyframes simply-puff-${i}{0%{transform:translate(0,0) scale(.2);opacity:1}60%{opacity:1}100%{transform:translate(${dx}px,${dy}px) scale(1.25);opacity:0}}`).join("");

// Un keyframe per coriandolo: niente var() nei keyframes, che alcuni browser (Safari) non animano
const CONFETTI_CSS = CONFETTI.map(([dx, dy], i) => `
.simply-confetti-${i}{animation:simply-burst-${i} 1.4s cubic-bezier(.2,.7,.3,1) ${(i % 4) * 0.12}s infinite}
@keyframes simply-burst-${i}{0%{transform:translate(0,0) scale(.5) rotate(0);opacity:0}8%{opacity:1}70%{opacity:1}100%{transform:translate(${dx}px,${dy}px) scale(1) rotate(${(i % 2 ? -1 : 1) * 220}deg);opacity:0}}`).join("");
export const COMPANION_CSS = `
.simply-root{position:relative;display:inline-block;line-height:0;-webkit-tap-highlight-color:transparent}
.simply-btn{all:unset;cursor:pointer;display:block;border-radius:24px}
.simply-btn:focus-visible{outline:3px solid ${C.purpleLight};outline-offset:4px}
.simply-svg *{transform-box:view-box}
.simply-bob{animation:simply-bob 3.2s ease-in-out infinite;transform-origin:100px 194px}
.simply-shadow{animation:simply-shadow 3.2s ease-in-out infinite;transform-origin:100px 197px}
.simply-eyes{animation:simply-blink 4.6s infinite;transform-origin:100px 98px}
.simply-cape{animation:simply-cape 2.8s ease-in-out infinite;transform-origin:100px 126px}
.simply-pupils{transition:transform .18s ease-out}
.simply-tilt{transition:transform .5s ease;transform-origin:100px 190px}
.simply-sit{transition:transform .45s cubic-bezier(.34,1.56,.64,1)}
.m-sitting .simply-sit{transform:translateY(9px)}
.m-sitting .simply-bob{animation-duration:4.6s}
.simply-soles{animation:simply-pop .35s cubic-bezier(.34,1.56,.64,1) both;transform-origin:100px 194px}
.simply-hang{line-height:0}
.is-dragging .simply-bob,.is-dragging .simply-shadow{animation:none}
.is-dragging .simply-shadow{opacity:0}
.is-dragging .simply-legs{animation:simply-kick .45s ease-in-out infinite alternate;transform-origin:100px 166px}
@keyframes simply-kick{from{transform:translateY(4px) rotate(-6deg)}to{transform:translateY(4px) rotate(6deg)}}
.simply-rest-l,.simply-rest-r{transition:transform .25s ease}
.simply-rest-l{transform-origin:44px 128px}
.simply-rest-r{transform-origin:156px 128px}
.is-dragging .simply-rest-l{transform:rotate(45deg)}
.is-dragging .simply-rest-r{transform:rotate(-45deg)}
.is-land .simply-body{animation:simply-squish .35s ease-out;transform-origin:100px 170px}
.simply-svg{display:block}
.splat-land .simply-svg{animation:simply-splat-v .45s cubic-bezier(.3,1.5,.5,1);transform-origin:50% 100%}
.splat-bottom .simply-svg{animation:simply-splat-v-hard .45s cubic-bezier(.3,1.5,.5,1);transform-origin:50% 100%}
.splat-top .simply-svg{animation:simply-splat-v-hard .45s cubic-bezier(.3,1.5,.5,1);transform-origin:50% 0%}
.splat-left .simply-svg{animation:simply-splat-h .45s cubic-bezier(.3,1.5,.5,1);transform-origin:0% 50%}
.splat-right .simply-svg{animation:simply-splat-h .45s cubic-bezier(.3,1.5,.5,1);transform-origin:100% 50%}
@keyframes simply-splat-v{0%{transform:scale(1)}25%{transform:scale(1.16,.8)}55%{transform:scale(.94,1.07)}80%{transform:scale(1.02,.98)}100%{transform:scale(1)}}
@keyframes simply-splat-v-hard{0%{transform:scale(1)}22%{transform:scale(1.32,.62)}52%{transform:scale(.88,1.14)}78%{transform:scale(1.05,.96)}100%{transform:scale(1)}}
@keyframes simply-splat-h{0%{transform:scale(1)}22%{transform:scale(.62,1.32)}52%{transform:scale(1.14,.88)}78%{transform:scale(.96,1.05)}100%{transform:scale(1)}}
.simply-stage{transition:transform .5s cubic-bezier(.34,1.3,.64,1),opacity .3s}
.simply-knob{transform-origin:100px 54px}
.simply-mouth{transform-origin:100px 110px}
.simply-prop{animation:simply-pop .4s cubic-bezier(.34,1.56,.64,1) both}

.simply-arm-wave{transform-origin:${SH_L[0]}px ${SH_L[1]}px;
  animation:simply-raise-l .35s cubic-bezier(.34,1.56,.64,1) both,simply-wave .5s ease-in-out .35s infinite alternate}
.simply-arm-raise{transform-origin:${SH_R[0]}px ${SH_R[1]}px;animation:simply-raise-r .4s cubic-bezier(.34,1.56,.64,1) both}
.simply-arm-hold,.simply-arm-lens{transform-origin:${SH_R[0]}px ${SH_R[1]}px;animation:simply-raise-hold .35s cubic-bezier(.34,1.56,.64,1) both}
.simply-page-flip{transform-origin:100px 150px;animation:simply-flip 1.8s ease-in-out infinite}
.simply-scan{animation:simply-scan 1.4s ease-in-out infinite alternate}
.simply-bar{animation:simply-grow 2.2s cubic-bezier(.34,1.56,.64,1) infinite}
.simply-swing{transform-origin:183px 62px;animation:simply-swing 1.1s ease-in-out infinite alternate}
.simply-glow{transform-origin:177px 63px;animation:simply-glow 1.1s ease-in-out infinite alternate}
.simply-rays{transform-origin:177px 63px;animation:simply-rays 1.1s ease-in-out infinite alternate}
.simply-fly{transform-origin:182px 130px;animation:simply-fly 2.4s ease-in infinite}
.simply-twist{transform-origin:177px 147px;animation:simply-twist .55s ease-in-out infinite alternate}
.simply-sweat{animation:simply-sweat 1.6s ease-in infinite}
.simply-steam{animation:simply-steam 1.5s ease-out infinite}
.simply-peek{animation:simply-peek 4.2s ease-in-out infinite}
.simply-ok-hand{transform-box:fill-box;transform-origin:50% 100%;animation:simply-ok .9s ease-in-out infinite}
.simply-ok-spark{transform-origin:178px 70px;animation:simply-rays .7s ease-in-out infinite alternate}
@keyframes simply-ok{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
.simply-tear{animation:simply-tear 2.2s ease-in infinite}
@keyframes simply-tear{0%{transform:translateY(-2px);opacity:0}20%,85%{opacity:1}100%{transform:translateY(12px);opacity:0}}
.simply-heart{transform-box:fill-box;transform-origin:center;animation:simply-heart .8s ease-in-out infinite}
@keyframes simply-heart{50%{transform:scale(1.15)}}
.simply-q{transform-box:fill-box;transform-origin:50% 100%;animation:simply-q 1.6s ease-in-out infinite}
@keyframes simply-q{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(8deg) translateY(-2px)}}
.simply-z{animation:simply-zz 2.4s ease-in-out infinite;opacity:0}
@keyframes simply-zz{0%{transform:translate(0,4px);opacity:0}30%{opacity:1}100%{transform:translate(8px,-14px);opacity:0}}
.simply-spiral{animation:simply-spiral-spin 1.1s linear infinite}
@keyframes simply-spiral-spin{to{transform:rotate(360deg)}}
.simply-orbit{transform-origin:100px 57px;animation:simply-orbit 1.2s linear infinite}
@keyframes simply-orbit{0%{transform:translate(38px,0) scale(1);opacity:1}25%{transform:translate(0,9px) scale(1.2);opacity:1}50%{transform:translate(-38px,0) scale(1);opacity:1}75%{transform:translate(0,-8px) scale(.65);opacity:.55}100%{transform:translate(38px,0) scale(1);opacity:1}}
.m-dizzy .simply-sit{animation:simply-wobble 1.2s ease-in-out infinite;transform-origin:100px 190px}
@keyframes simply-wobble{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
.simply-ear-l{transform-origin:80px 68px;animation:simply-ear 3.4s ease-in-out infinite}
.simply-ear-r{transform-origin:120px 68px;animation:simply-ear-r 3.4s ease-in-out infinite .2s}
@keyframes simply-ear{0%,80%,100%{transform:rotate(0)}86%{transform:rotate(-10deg)}92%{transform:rotate(4deg)}}
@keyframes simply-ear-r{0%,80%,100%{transform:rotate(0)}86%{transform:rotate(10deg)}92%{transform:rotate(-4deg)}}
.m-laughing .simply-sit{animation:simply-laugh .3s ease-in-out infinite;transform-origin:100px 190px}
@keyframes simply-laugh{0%,100%{transform:translateY(0) rotate(-1.5deg)}50%{transform:translateY(-3px) rotate(1.5deg)}}
.simply-ponder-finger{animation:simply-ponder 1.6s ease-in-out infinite}
@keyframes simply-ponder{0%,60%,100%{transform:translateY(0)}70%{transform:translateY(1.6px)}80%{transform:translateY(0)}90%{transform:translateY(1.6px)}}
.simply-badge{all:unset;box-sizing:border-box;position:absolute;z-index:3;min-width:22px;height:22px;padding:0 6px;border-radius:11px;
  background:${C.coral};color:#fff;border:2.5px solid #fff;box-shadow:0 0 0 2px ${C.ink};font:800 12px/17px system-ui,sans-serif;text-align:center;
  cursor:pointer;transform:translate(-50%,-50%);animation:simply-badge-in .35s cubic-bezier(.34,1.56,.64,1) both}
.simply-badge.dot{min-width:16px;width:16px;height:16px;padding:0}
@keyframes simply-badge-in{from{transform:translate(-50%,-50%) scale(0)}to{transform:translate(-50%,-50%) scale(1)}}
.simply-tour{display:flex;flex-direction:column;gap:8px;align-items:stretch;text-align:left}
.simply-tour-text{font-weight:600}
.simply-tour-ctrl{display:flex;align-items:center;gap:6px}
.simply-tour-ctrl span{flex:1;font-size:12px;opacity:.6;font-weight:600}
.simply-tour-ctrl button{all:unset;cursor:pointer;padding:4px 10px;border-radius:999px;border:2px solid ${C.ink};font:700 12px system-ui,sans-serif;background:#fff;color:${C.ink}}
.simply-tour-ctrl button.primary{background:${C.purple};border-color:${C.purple};color:#fff}
.simply-tour-ctrl button:focus-visible{outline:2px solid ${C.purpleLight};outline-offset:2px}
.simply-mic-rec{animation:simply-mic-rec 1s steps(2,end) infinite}
@keyframes simply-mic-rec{50%{opacity:.15}}
.simply-mic-waves path{animation:simply-mic-wave 1.1s ease-in-out infinite}
@keyframes simply-mic-wave{0%,100%{opacity:.15}50%{opacity:1}}
.simply-poke{animation:simply-poke .55s ease-in-out infinite alternate}
${CONFETTI_CSS}
.simply-scaler{position:relative;transform-origin:50% 75%}
.simply-scaler.poof-out{animation:simply-poof-out .28s ease-in forwards}
.simply-scaler.nope{animation:simply-nope .45s ease-in-out}
@keyframes simply-nope{0%,100%{transform:rotate(0)}20%{transform:rotate(-7deg)}40%{transform:rotate(6deg)}60%{transform:rotate(-4deg)}80%{transform:rotate(2deg)}}
.simply-scaler.poof-in{animation:simply-poof-in .36s cubic-bezier(.34,1.56,.64,1) both}
.simply-puff{position:absolute;left:50%;top:60%;width:0;height:0;pointer-events:none;z-index:2}
.simply-puff i{position:absolute;border-radius:50%;background:#fff;border:2.5px solid ${C.ink};opacity:0}
${PUFF_CSS}
.simply-flag-cloth{transform-origin:179px 46px;animation:simply-flutter .5s ease-in-out .4s infinite alternate}

.m-listening .simply-tilt{transform:rotate(-5deg)}
.m-talking .simply-mouth{animation:simply-talk .22s ease-in-out infinite alternate}
.m-news .simply-bob{animation:simply-hop .9s cubic-bezier(.3,0,.4,1) infinite}
.m-news .simply-shadow{animation:simply-hop-shadow .9s cubic-bezier(.3,0,.4,1) infinite}

.simply-dot{animation:simply-dot 1.2s ease-in-out infinite}
.simply-dot:nth-child(2){animation-delay:.2s}
.simply-dot:nth-child(3){animation-delay:.4s}
.is-ding .simply-knob{animation:simply-ding .35s ease-out}
.is-ding .simply-body{animation:simply-squish .35s ease-out;transform-origin:100px 170px}
.is-ring .simply-ring{animation:simply-ring .6s ease-out}

.simply-bubble{position:absolute;left:50%;bottom:100%;transform:translate(-50%,8px) scale(.9);opacity:0;
  background:#fff;color:${C.ink};border:2.5px solid ${C.ink};border-radius:16px;padding:8px 12px;
  font:600 14px/1.35 system-ui,-apple-system,"Segoe UI",sans-serif;white-space:normal;width:max-content;max-width:220px;
  text-align:center;pointer-events:none;transition:opacity .25s ease,transform .3s cubic-bezier(.34,1.56,.64,1);
  box-sizing:border-box;max-width:min(220px,calc(100vw - 16px));scrollbar-width:none}
.simply-bubble::-webkit-scrollbar{display:none}
.simply-bubble.on{pointer-events:auto}
.simply-bubble.below{bottom:auto;top:100%;transform:translate(-50%,-8px) scale(.9)}
.simply-bubble.below.on{transform:translate(-50%,0) scale(1)}
.simply-bubble.on{opacity:1;transform:translate(-50%,0) scale(1)}
.simply-bubble.below::after{top:auto;bottom:100%;transform:translate(-50%,6px) rotate(225deg)}
.simply-bubble::after{content:"";position:absolute;left:calc(50% + var(--simply-arrow, 0px));top:100%;width:12px;height:12px;background:#fff;
  border-right:2.5px solid ${C.ink};border-bottom:2.5px solid ${C.ink};transform:translate(-50%,-6px) rotate(45deg)}

@keyframes simply-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px) scale(1.012,.988)}}
@keyframes simply-shadow{0%,100%{transform:scaleX(1);opacity:.9}50%{transform:scaleX(.9);opacity:.65}}
@keyframes simply-blink{0%,93%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}97%{transform:scaleY(1)}}
@keyframes simply-cape{0%,100%{transform:skewX(0) scaleX(1)}50%{transform:skewX(2.5deg) scaleX(1.03)}}
@keyframes simply-raise-l{from{transform:rotate(-110deg)}to{transform:rotate(0)}}
@keyframes simply-raise-r{from{transform:rotate(110deg)}to{transform:rotate(0)}}
@keyframes simply-raise-hold{from{transform:rotate(40deg)}to{transform:rotate(0)}}
@keyframes simply-wave{from{transform:rotate(-7deg)}to{transform:rotate(13deg)}}
@keyframes simply-talk{from{transform:scaleY(1)}to{transform:scaleY(.35)}}
@keyframes simply-hop{0%,100%{transform:translateY(0) scale(1)}12%{transform:translateY(0) scale(1.06,.92)}45%{transform:translateY(-14px) scale(.97,1.04)}80%{transform:translateY(0) scale(1)}}
@keyframes simply-hop-shadow{0%,12%,80%,100%{transform:scaleX(1);opacity:.9}45%{transform:scaleX(.7);opacity:.4}}
@keyframes simply-flutter{from{transform:skewY(-4deg)}to{transform:skewY(5deg)}}
@keyframes simply-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes simply-dot{0%,100%{transform:translateY(0);opacity:.35}50%{transform:translateY(-5px);opacity:1}}
@keyframes simply-ding{0%{transform:translateY(0)}35%{transform:translateY(5px)}100%{transform:translateY(0)}}
@keyframes simply-squish{0%,100%{transform:scale(1)}35%{transform:scale(1.06,.93)}}
@keyframes simply-ring{0%{opacity:.9;transform:scale(.6)}100%{opacity:0;transform:scale(1.5)}}

@keyframes simply-flip{0%,30%{transform:scaleX(1)}70%,100%{transform:scaleX(-1)}}
@keyframes simply-scan{from{transform:translate(-2px,1px)}to{transform:translate(3px,-2px)}}
@keyframes simply-grow{0%{transform:scaleY(0)}35%,85%{transform:scaleY(1)}100%{transform:scaleY(1)}}
@keyframes simply-swing{from{transform:rotate(-12deg)}to{transform:rotate(16deg)}}
@keyframes simply-glow{from{transform:scale(.85);opacity:.2}to{transform:scale(1.12);opacity:.55}}
@keyframes simply-rays{from{transform:scale(.9);opacity:.15}to{transform:scale(1.06);opacity:1}}
@keyframes simply-fly{0%,35%{transform:translate(0,0) rotate(0) scale(1);opacity:1}75%{transform:translate(26px,-64px) rotate(18deg) scale(.55);opacity:0}76%{transform:translate(0,0) scale(.3);opacity:0}100%{transform:translate(0,0) scale(1);opacity:1}}
@keyframes simply-twist{from{transform:rotate(-16deg)}to{transform:rotate(14deg)}}
@keyframes simply-sweat{0%{transform:translateY(-3px);opacity:0}20%{opacity:1}100%{transform:translateY(10px);opacity:0}}
@keyframes simply-steam{0%{transform:translateY(4px);opacity:0}30%{opacity:.7}100%{transform:translateY(-10px);opacity:0}}
@keyframes simply-poof-out{0%{transform:scale(1)}30%{transform:scale(1.14,.86)}100%{transform:scale(0) rotate(-25deg);opacity:0}}
@keyframes simply-poof-in{0%{transform:scale(0) rotate(25deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes simply-peek{0%,62%,100%{transform:translateY(0)}70%,86%{transform:translateY(9px)}}
@keyframes simply-poke{from{transform:translateX(0)}to{transform:translateX(3.5px)}}

/* Movimento ridotto (solo se respectReducedMotion è attivo e il sistema lo chiede):
   via saltelli, oscillazioni e voli; restano ciglia, bocca, puntini, vapore e luce,
   che servono a capire cosa sta facendo Simply. */
.simply-reduced .simply-bob,.simply-reduced .simply-shadow,.simply-reduced .simply-cape,
.simply-reduced .simply-arm-wave,.simply-reduced .simply-arm-raise,.simply-reduced .simply-arm-hold,.simply-reduced .simply-arm-lens,
.simply-reduced .simply-flag-cloth,.simply-reduced .simply-swing,.simply-reduced .simply-twist,.simply-reduced .simply-scan,
.simply-reduced .simply-fly,.simply-reduced .simply-ear-l,.simply-reduced .simply-ear-r,.simply-reduced .simply-svg,.m-laughing.simply-reduced .simply-sit,.simply-reduced .simply-ok-hand,.simply-reduced .simply-ok-spark,.simply-reduced .simply-peek,.simply-reduced .simply-poke,.simply-reduced .simply-prop,.simply-reduced .simply-body,
.simply-reduced .simply-knob,.simply-reduced .simply-ring,.simply-reduced .simply-bar,.simply-reduced .simply-rays,
.simply-reduced [class*="simply-confetti-"],.simply-reduced .simply-scaler:not(.nope),.simply-reduced .simply-puff i{animation:none!important}
.simply-reduced .simply-tilt,.simply-reduced .simply-pupils,.simply-reduced .simply-bubble{transition:none!important}
.simply-reduced .simply-svg g{transition:none!important}

/* Animazioni off: Simply fermo in ogni posa (cambia solo espressione/oggetto) */
.simply-still *{animation:none!important;transition:none!important}
`;

