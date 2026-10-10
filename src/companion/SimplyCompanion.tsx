import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { MouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import type {
  Accessory, HomeChangeInfo, HomePosition, HomeRect, InterruptContext, Mood, MotionMode, PointTarget, PropName, Rect, SimplyEventName,
} from "../types";
import { ARM, C, SH_L, SH_R, VB } from "../theme";
import { mixHex } from "../utils/color";
import { clamp, cornerSpot, nearTarget, resolveTarget, viewRect, visibleFraction, vpSize } from "../utils/geometry";
import { playDing } from "../utils/sound";
import { HATS } from "../utils/season";
import { readStoredHome, storeHome } from "../utils/storage";
import { useInjectStyles } from "../hooks/useInjectStyles";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { COMPANION_CSS, COMPANION_STYLE_ID } from "./styles";
import {
  BROWS, DEFAULT_PROP, FACE_MOODS, ORBIT_STAR, POSES, PROP_POSE, PUFF, SPIRAL_L, SPIRAL_R,
} from "./constants";
import { Fleur } from "./art/Fleur";
import { CoverArm, PointingArm, WaveHand } from "./art/arms";
import { BigBook, PropArt } from "./art/props";
import { HatArt, ScarfArt, SunglassesArt } from "./art/accessories";

/**
 * Simply — il piccolo aiutante di SimpleBooking
 * Companion animato in SVG puro, nessuna dipendenza oltre React.
 *
 * Moods:
 *   "idle"      respira e sbatte le palpebre
 *   "greeting"  saluta con la mano ("Eccomi!")
 *   "listening" si inclina, attento mentre l'utente scrive
 *   "thinking"  mano al mento come 🤔 + puntini (oggetto "ponder"; passa prop per sostituirlo)
 *   "talking"   bocca animata mentre la risposta arriva in streaming
 *   "news"      bandierina e saltello ("C'è una novità")
 *   "success"   occhi felici + gesto dell'OK (missione compiuta)
 *   "error"     fronte corrugata, goccia di sudore, chiave inglese (qualcosa è andato storto)
 *   "sad"       triste, con una lacrima (es. se lo insulti)
 *   "surprised" sorpreso (lo fa anche quando lo trascini)
 *   "love"      occhi a cuore (es. per un complimento)
 *   "confused"  confuso, con il punto di domanda
 *   "sleepy"    assonnato, con le zeta
 *   (triste anche da solo se lo lanci o maltratti troppe volte in un minuto: vedi onHurt)
 *   "dizzy"     stordito, KO: occhi a spirale e stelline che girano (anche quando lo scuoti o sbatte forte)
 *   "laughing"  ride a crepapelle: occhi strizzati, bocca spalancata, lacrime di gioia
 *   "sitting"   seduto (lo fa anche da solo dopo un po' di riposo)
 *   "privacy"   si copre gli occhi (e ogni tanto sbircia). Scatta da solo quando
 *               indica un campo password o quando l'utente ci sta scrivendo.
 *
 * Esempio:
 *   <SimplyCompanion mood={moodFromChatStatus(status)} message="Ciao!" sound />
 */

export interface PointState { side: "l" | "r"; deg: number; ex: number; ey: number; pwd: boolean }

export interface SimplyCompanionProps {
  /** Espressione e posa (default "idle"). */
  mood?: Mood;
  /** Oggetto in mano; undefined = default del mood, "none" = mani libere. */
  prop?: PropName | "none";
  /** Cosa indicare: ref, elemento, selettore CSS o punto {x, y}. null = niente. */
  pointAt?: PointTarget;
  /** Se il bersaglio è lontano si teletrasporta vicino (default true). */
  teleport?: boolean;
  /** Distanza in px oltre la quale si teletrasporta (default 260). */
  teleportDistance?: number;
  /** Se il bersaglio è fuori vista, all'inizio lo porta in vista (default true). */
  scrollToTarget?: boolean;
  /** Contenitore da far scorrere; di default scrollIntoView sugli antenati. */
  scrollContainer?: PointTarget;
  /** Ha finito di scorrere/teletrasportarsi e inizia a indicare. */
  onPointStart?: () => void;
  /** Dopo quanti ms smette da solo di indicare (default 8000; null = finché non togli pointAt). */
  pointDuration?: number | null;
  /** Ha smesso da solo di indicare perché è scaduto il tempo. */
  onPointEnd?: () => void;
  /** Si copre gli occhi davanti a un campo password (default true). */
  coverEyesOnPassword?: boolean;
  /** Larghezza in px (default 160). */
  size?: number;
  /** Contenuto del fumetto (testo o nodi React, es. pulsanti di un tour). */
  message?: ReactNode;
  /** Abilita il campanello: solo doppio tocco e ringOnMoods, mai al tocco singolo. */
  sound?: boolean;
  /** A riposo gli occhi seguono il cursore (default true). */
  trackPointer?: boolean;
  /** "full" (default), "auto" = segue "riduci animazioni", "off" = fermo. */
  motion?: MotionMode;
  /** @deprecated usa motion="auto". */
  respectReducedMotion?: boolean;
  /** @deprecated usa interruptible. */
  dismissOnClick?: boolean;
  /** Il tocco può fermarlo mentre lavora? */
  interruptible?: boolean | ((ctx: InterruptContext) => boolean);
  /** Tocco mentre è occupato e non interrompibile. */
  onBusyClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Doppio tocco (easter egg: suona il campanello). */
  onDoubleClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Mood che fanno suonare il campanello (serve sound). Default ["news"]. */
  ringOnMoods?: Mood[];
  /** Tocco che lo ha fermato: azzera lo stato nel padre. */
  onDismiss?: () => void;
  /** Tocco quando è a riposo a casa (es. aprire la chat). */
  onIdleClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Routine di riposo: si siede, poi beve il caffè da seduto (default true). */
  idleRoutine?: boolean;
  idleCoffeeAfter?: number | null;
  idleSitAfter?: number | null;
  /** ms di riposo prima di nascondersi (default 60000; null = mai). */
  autoHideAfter?: number | null;
  /** Nascosto forzato: sbuca solo con la testa. */
  hidden?: boolean;
  onHiddenChange?: (hidden: boolean) => void;
  /** Sospende caffè/seduto/auto-nascondi (es. a chat aperta). */
  keepAwake?: boolean;
  /** Colore del mantello e del colletto (#rrggbb). */
  capeColor?: string;
  /** Cosa indossa (default ["cape"]); vedi seasonalLook(). */
  accessories?: Accessory[];
  /** Si può trascinare per cambiargli casa (default true). */
  draggable?: boolean;
  /** Casa controllata: { left, top } in px; null = posto originale. */
  home?: HomePosition | null;
  /** Quando cambia casa (anche al montaggio e al resize). */
  onHomeChange?: (rect: HomeRect, info: HomeChangeInfo) => void;
  onDragStart?: () => void;
  onDragEnd?: (rect: HomeRect) => void;
  /** Lasciato di slancio vola e rimbalza sui bordi (default true). */
  throwable?: boolean;
  /** È andato KO. */
  onDizzy?: () => void;
  /** Trattato male troppe volte: diventa triste. */
  onHurt?: () => void;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  /** Etichetta accessibile. */
  label?: string;
  /** Monta Simply in un portal sotto <body> (default true): niente problemi con transform/overflow degli antenati. */
  portal?: boolean;
  /** Dove montare il portal (default document.body). */
  portalTarget?: Element | null;
  /** z-index del livello di Simply quando è nel portal (default 2147482500). */
  zIndex?: number;
  /** false = invisibile e non cliccabile, ma resta montato (es. durante un'intro). Default true. */
  visible?: boolean;
  /** Chiave localStorage: ricorda la casa scelta trascinandolo (solo casa non controllata). */
  persistHome?: string;
  /** Badge sulla testa (numero, testo o true per un pallino). Si vede anche quando è nascosto. */
  badge?: number | string | boolean | null;
  onBadgeClick?: () => void;
  /** Cambia visibilità: nascosto (forzato o auto-nascondi) / visibile. */
  onVisibilityChange?: (hidden: boolean) => void;
  /** Eventi per analytics. */
  onEvent?: (name: SimplyEventName, data?: Record<string, unknown>) => void;
  /** Classi aggiuntive (es. Tailwind) per le parti di interfaccia. */
  classNames?: { bubble?: string; badge?: string };
  /** false = non inietta il CSS (lo includi tu: esportato come COMPANION_CSS). Default true. */
  injectStyles?: boolean;
}

export function SimplyCompanion({
  mood: moodIn = "idle",
  prop: propIn,    // oggetto in mano; undefined = default del mood, "none" = mani libere
  pointAt: pointAtIn, // ref, Element, selettore CSS o {x, y} in coordinate viewport
  teleport = true, // se il bersaglio è lontano, Simply si teletrasporta vicino
  teleportDistance = 260, // px oltre i quali si teletrasporta
  scrollToTarget = true,  // se il bersaglio è fuori schermo, porta la pagina fino a lì
  scrollContainer,        // contenitore da far scorrere (ref, Element o selettore); di default scrollIntoView sugli antenati
  onPointStart,           // chiamato quando Simply ha finito di scorrere/teletrasportarsi e inizia a indicare
  pointDuration = 8000,   // dopo quanti ms smette da solo di indicare (null = finché non togli pointAt)
  onPointEnd,             // ha smesso da solo di indicare (scaduto il tempo): azzera il bersaglio nel padre
  coverEyesOnPassword = true, // si copre gli occhi quando indica o quando si scrive in un campo password
  size = 160,
  message: messageIn = "",
  sound = false,   // abilita il suono del campanello (solo doppio tocco e ringOnMoods, mai al tocco singolo)
  trackPointer = true,
  motion,          // "full" (default) | "auto" = segue "riduci animazioni" del sistema | "off" = nessuna animazione
  respectReducedMotion = false, // compatibilità: true equivale a motion="auto"
  dismissOnClick = true, // compatibilità: equivale a interruptible
  interruptible,   // il tocco può fermarlo? true | false | ({ mood, prop, pointing, teleported }) => boolean
  onBusyClick,     // tocco mentre è occupato e non interrompibile (es. aprire la chat per vedere la risposta)
  onDoubleClick,   // doppio tocco (easter egg: suona il campanello)
  ringOnMoods = ["news"] as Mood[], // mood che fanno suonare il campanello per attirare l'attenzione (serve sound)
  onDismiss,       // chiamato al tocco, per azzerare lo stato nel componente padre
  onIdleClick,     // tocco quando Simply è a riposo a casa (es. aprire la chat)
  idleRoutine = true,      // a riposo, ogni tanto beve il caffè e poi si siede
  idleSitAfter = 20000,    // ms di riposo prima di sedersi (null = mai)
  idleCoffeeAfter = 45000, // ms di riposo prima del caffè, bevuto da seduto (null = mai)
  autoHideAfter = 60000,   // ms di riposo prima di nascondersi (default 1 minuto; null = mai)
  hidden: hiddenProp = false, // nascosto forzato: sbuca solo con la testa, si mostra se indica qualcosa
  onHiddenChange,          // chiamato quando l'utente lo tocca per farlo riapparire
  keepAwake = false,       // sospende caffè/seduto/auto-nascondi (es. mentre la chat è aperta)
  capeColor = C.purple,    // colore del mantello e del colletto (#rrggbb)
  accessories = ["cape"] as Accessory[],  // cosa indossa: vedi ACCESSORIES (es. ["cape", "sunglasses", "santa-hat"]); seasonalLook() suggerisce quelli del periodo
  draggable = true,        // si può trascinare per cambiargli casa
  home: homeProp,          // opzionale, controllato: { left, top } in px (null = posto originale)
  onHomeChange,            // (rect, { custom, fromDrag }) quando cambia casa (anche al montaggio)
  onDragStart,             // inizio trascinamento (es. chiudere la chat, che resterebbe nella vecchia posizione)
  onDragEnd,               // fine trascinamento, con il nuovo rettangolo
  throwable = true,        // se lo lasci andare di slancio vola, rimbalza sui bordi e si ferma lì
  onDizzy,                 // è andato KO (scossone mentre lo trascini o botta forte contro un bordo)
  onHurt,                  // trattato male troppe volte di fila (lanci, botte, scossoni): diventa triste
  onClick,
  label = "Simply, il tuo aiutante",
  portal = true,
  portalTarget,
  zIndex = 2147482500,
  visible = true,
  persistHome,
  badge,
  onBadgeClick,
  onVisibilityChange,
  onEvent,
  classNames,
  injectStyles = true,
}: SimplyCompanionProps) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const emit = (name: SimplyEventName, data?: Record<string, unknown>) => onEventRef.current?.(name, data);
  useInjectStyles(COMPANION_STYLE_ID, COMPANION_CSS, injectStyles);
  const cape = { base: capeColor, light: mixHex(capeColor, "#ffffff", 0.22), dark: mixHex(capeColor, "#000000", 0.22) };

  // Tocco = "basta così": ignora mood/oggetto/bersaglio/messaggio finché il padre non li cambia
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => { setDismissed(false); }, [moodIn, propIn, pointAtIn, messageIn]);
  const mood: Mood = dismissed ? "idle" : moodIn;
  const prop: PropName | "none" | undefined = dismissed ? undefined : propIn;
  // Indicare scade da solo: finito il tempo smette (e tace il fumetto che accompagnava l'indicazione)
  const [pointExpired, setPointExpired] = useState(false);
  useEffect(() => { setPointExpired(false); }, [pointAtIn]);
  const pointAt: PointTarget = dismissed || pointExpired ? null : pointAtIn;
  const message = dismissed || (pointExpired && !!pointAtIn) ? "" : messageIn;

  // Routine di riposo: prima si siede, poi (da seduto) beve il caffè, poi eventualmente si nasconde
  const [idleSit, setIdleSit] = useState(false);
  const [idleCoffee, setIdleCoffee] = useState(false);
  const [idleHidden, setIdleHidden] = useState(false);
  const [activity, setActivity] = useState(0);
  const poke = useCallback(() => setActivity((n) => n + 1), []);
  const baseIdle = mood === "idle" && (!prop || prop === "none") && !pointAt && !message;
  useEffect(() => {
    setIdleSit(false); setIdleCoffee(false); setIdleHidden(false);
    if (!idleRoutine || keepAwake || !baseIdle) return;
    const ts: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number | null | undefined, fn: () => void) => { if (ms != null) ts.push(setTimeout(fn, ms)); };
    at(idleSitAfter, () => setIdleSit(true));
    at(idleCoffeeAfter, () => setIdleCoffee(true));
    at(idleCoffeeAfter != null ? idleCoffeeAfter + 6000 : null, () => setIdleCoffee(false));
    at(autoHideAfter, () => setIdleHidden(true));
    return () => ts.forEach(clearTimeout);
  }, [baseIdle, idleRoutine, keepAwake, idleCoffeeAfter, idleSitAfter, autoHideAfter, activity]);

  // Nascosto (forzato o dopo un po' di riposo): se deve indicare qualcosa riappare comunque
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { setRevealed(false); }, [hiddenProp]);
  const hiddenNow = ((hiddenProp && !revealed) || idleHidden) && !pointAt;
  const onVisRef = useRef(onVisibilityChange);
  onVisRef.current = onVisibilityChange;
  const firstVis = useRef(true);
  useEffect(() => {
    if (firstVis.current) { firstVis.current = false; if (!hiddenNow) return; }
    onVisRef.current?.(hiddenNow);
    onEventRef.current?.(hiddenNow ? "hidden" : "shown");
  }, [hiddenNow]);
  const keyboardInset = useKeyboardInset();
  const svgRef = useRef<SVGSVGElement>(null);
  const systemReduced = usePrefersReducedMotion();
  const motionMode = motion ?? (respectReducedMotion ? "auto" : "full");
  const still = motionMode === "off";
  const reduced = still || (motionMode === "auto" && systemReduced);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [ding, setDing] = useState(false);
  const [nope, setNope] = useState(false);
  const [customHome, setCustomHome] = useState<HomePosition | null>(() =>
    persistHome && homeProp === undefined && typeof window !== "undefined" ? readStoredHome(persistHome) : null);
  const homePos = homeProp !== undefined ? homeProp : customHome;
  // La casa scelta non viene mai riscritta per colpa della finestra: se si restringe (tastiera, rotazione,
  // resize) Simply viene solo MOSTRATO dentro lo schermo, e quando torna lo spazio torna esattamente dov'era.
  const [, setVpTick] = useState(0);
  useEffect(() => {
    const on = () => setVpTick((n) => n + 1);
    window.addEventListener("resize", on);
    window.visualViewport?.addEventListener("resize", on);
    return () => { window.removeEventListener("resize", on); window.visualViewport?.removeEventListener("resize", on); };
  }, []);
  const homeShown = homePos && typeof window !== "undefined"
    ? (() => {
        // area di layout (non quella visibile): la tastiera non sposta la casa, la gestisce il "lift" temporaneo
        const lw = Math.min(window.innerWidth, document.documentElement.clientWidth || Infinity);
        const lh = Math.min(window.innerHeight, document.documentElement.clientHeight || Infinity);
        const h = size * (VB.h / VB.w);
        return { left: clamp(homePos.left, 8, Math.max(8, lw - size - 8)), top: clamp(homePos.top, 8, Math.max(8, lh - h - 8)) };
      })()
    : homePos;
  const homePosRef = useRef(homeShown);
  homePosRef.current = homeShown;
  const [dragging, setDragging] = useState(false);
  const [throwing, setThrowing] = useState(false);
  const airborne = dragging || throwing;     // tenuto in mano o in volo
  const [dizzy, setDizzy] = useState(false);
  const dizzyTimer = useRef<ReturnType<typeof setTimeout>>();
  const [hurt, setHurt] = useState(false);
  const hurtTimer = useRef<ReturnType<typeof setTimeout>>();
  const abuseRef = useRef<number[]>([]);
  const [splat, setSplat] = useState<string | null>(null); // "land" | "top" | "bottom" | "left" | "right"
  useEffect(() => () => { clearTimeout(dizzyTimer.current); clearTimeout(hurtTimer.current); }, []);
  const [landed] = useState(false); // (la schiacciata ora è `splat`)
  const draggingRef = useRef(false);
  const justDraggedRef = useRef(false);
  const [focusPwd, setFocusPwd] = useState(false);

  // Privacy: se l'utente sta scrivendo in un campo password, Simply non guarda
  useEffect(() => {
    if (!coverEyesOnPassword || typeof document === "undefined") { setFocusPwd(false); return; }
    const isPwd = (el: Element | null): boolean => !!el && el.tagName === "INPUT" && (el as HTMLInputElement).type === "password";
    const upd = () => setFocusPwd(isPwd(document.activeElement));
    const onOut = () => setTimeout(upd, 0);
    document.addEventListener("focusin", upd);
    document.addEventListener("focusout", onOut);
    upd();
    return () => { document.removeEventListener("focusin", upd); document.removeEventListener("focusout", onOut); };
  }, [coverEyesOnPassword]);

  useEffect(() => {
    if (!trackPointer || reduced || typeof window === "undefined") return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = svgRef.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height * 0.45);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 300);
        setLook({ x: (dx / d) * 2.8 * k, y: (dy / d) * 2.8 * k });
      });
    };
    window.addEventListener("pointermove", onMove);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [trackPointer, reduced]);

  // A ogni tocco il pomello si abbassa; suono e cerchietto solo col doppio tocco
  // (easter egg) o per attirare l'attenzione (vedi ringOnMoods).
  const flashDing = () => {
    setDing(false);
    requestAnimationFrame(() => setDing(true));
    setTimeout(() => setDing(false), 650);
  };
  // Suono + cerchietto dell'anello: solo quando il campanello suona davvero
  const [ringing, setRinging] = useState(false);
  const ring = () => {
    if (!sound) return;
    playDing();
    setRinging(false);
    requestAnimationFrame(() => setRinging(true));
    setTimeout(() => setRinging(false), 650);
  };
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (clickTimerRef.current) clearTimeout(clickTimerRef.current); }, []);

  // Attirare l'attenzione: quando entra in un mood di ringOnMoods (es. "news") il campanello suona da solo.
  // I browser fanno partire l'audio solo dopo una prima interazione con la pagina: prima resta solo il "ding" visivo.
  const prevMoodRef = useRef(mood);
  useEffect(() => {
    const prev = prevMoodRef.current;
    prevMoodRef.current = mood;
    if (mood !== prev && ringOnMoods?.includes(mood)) {
      flashDing();
      ring();
    }
  }, [mood]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (justDraggedRef.current) { justDraggedRef.current = false; return; } // era un trascinamento, non un tocco
      flashDing();
      // Doppio tocco: easter egg (suona il campanello), e il primo tocco non fa la sua azione
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        ring();
        poke();
        onDoubleClick?.(e);
        emit("double_click");
        return;
      }
      clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null; singleClickRef.current(e); }, 240);
    },
    [sound, onDoubleClick, poke] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const singleClick = (e: MouseEvent<HTMLButtonElement>) => {
      poke();
      // Nascosto? Il tocco lo fa riapparire e basta.
      if (hiddenNow) {
        if (hiddenProp) { setRevealed(true); onHiddenChange?.(false); }
        emit("click", { hidden: true });
        onClick?.(e);
        return;
      }
      // Sta facendo qualcosa? Il tocco lo ferma. È a riposo a casa? Il tocco apre (es. la chat).
      const busyNow = !dismissed && (
        !!pointAtIn || !!placeRef.current ||
        ["thinking", "talking", "news", "privacy"].includes(moodIn) ||
        (propIn && propIn !== "none")
      );
      if (busyNow) {
        const rule = interruptible ?? dismissOnClick;
        const canStop = typeof rule === "function"
          ? !!rule({ mood: moodIn, prop: propIn, pointing: !!pointAtIn, teleported: !!placeRef.current })
          : !!rule;
        if (canStop) {
          setDismissed(true);
          onDismiss?.();
          emit("dismiss", { mood: moodIn, pointing: !!pointAtIn });
        } else {
          // Non si può interrompere: scuote la testa ("sto lavorando!") e lo segnala al padre
          setNope(false);
          requestAnimationFrame(() => setNope(true));
          setTimeout(() => setNope(false), 500);
          onBusyClick?.(e);
          emit("busy_click", { mood: moodIn });
        }
      } else {
        onIdleClick?.(e);
        emit("idle_click");
      }
      onClick?.(e);
  };
  const singleClickRef = useRef(singleClick);
  singleClickRef.current = singleClick;

  // Cognizione dello spazio: dove sta Simply sullo schermo e dove sta il bersaglio
  const [point, setPoint] = useState<PointState | null>(null);
  const [place, setPlace] = useState<HomePosition | null>(null);   // null = a casa; { left, top } = teletrasportato (position: fixed)
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle"); // "idle" | "out" | "in"
  const [puffN, setPuffN] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const onPointStartRef = useRef(onPointStart);
  onPointStartRef.current = onPointStart;
  const placeRef = useRef<HomePosition | null>(null);
  const busyRef = useRef(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const fastRef = useRef(false);
  fastRef.current = reduced;
  const svgH = size * (VB.h / VB.w);

  // Spostamento verticale dello "stage": su se la tastiera lo coprirebbe, giù (sbuca) se nascosto
  const [shift, setShift] = useState({ y: 0, mini: false });
  useEffect(() => {
    const st = stageRef.current;
    if (!st || typeof window === "undefined") return;
    const r = st.getBoundingClientRect();
    const baseTop = r.top - shift.y;            // posizione senza lo spostamento attuale
    const baseBottom = baseTop + r.height;
    const { h: vh } = vpSize();
    let next = { y: 0, mini: false };
    if (hiddenNow) {
      const layoutH = Math.min(window.innerHeight, document.documentElement.clientHeight || Infinity);
      if (layoutH - baseBottom <= 48) next = { y: Math.max(0, layoutH - baseTop - svgH * 0.56), mini: false }; // sbuca dal fondo
      else next = { y: 0, mini: true };                                                                    // lontano dal fondo: si rimpicciolisce
    } else if (keyboardInset && baseBottom > vh - 8) {
      next = { y: -(baseBottom - vh + 8), mini: false };
    }
    if (next.y !== shift.y || next.mini !== shift.mini) setShift(next);
  }, [hiddenNow, keyboardInset, place, size, svgH, homeShown?.left, homeShown?.top]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------- Trascinamento: appeso per il campanello come un pendolo vero ----------
  // Il perno è il pomello: muovendolo velocemente oscilla, facendo cerchi lo fai volteggiare,
  // scuotendolo va KO, lasciandolo di slancio vola per lo schermo e rimbalza sui bordi.
  const hangRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<HomePosition | null>(null);            // posizione libera dello stage (mentre lo tieni o vola)
  const heldRef = useRef(false);           // lo stai tenendo col dito o col mouse
  const throwRef = useRef<{ vx: number; vy: number } | null>(null);           // { vx, vy } durante il volo
  const physRef = useRef<{ th: number; om: number; raf: number; last: number; px: number | null; py: number | null; vx: number; vy: number; ax: number; ay: number }>({ th: 0, om: 0, raf: 0, last: 0, px: null, py: null, vx: 0, vy: 0, ax: 0, ay: 0 });
  const stillRef = useRef(still);
  stillRef.current = still;
  const kx = ((100 - VB.x) / VB.w) * size;   // il pomello del campanello, in px dentro lo stage
  const ky = ((40 - VB.y) / VB.h) * svgH;
  const PEND_L = svgH * 0.55;                // distanza perno -> baricentro
  const GRAV = 3200;                         // px/s²
  const onHomeChangeRef = useRef(onHomeChange);
  onHomeChangeRef.current = onHomeChange;
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const onDizzyRef = useRef(onDizzy);
  onDizzyRef.current = onDizzy;

  const onHurtRef = useRef(onHurt);
  onHurtRef.current = onHurt;

  // Maltrattamenti: lanci, botte forti e KO si sommano; troppi in un minuto e si intristisce
  const hurtRef = useRef(false);
  const mistreat = (weight = 1) => {
    if (hurtRef.current) return; // mentre è triste non si conta: il conteggio riparte da zero dopo
    const now = performance.now();
    for (let i = 0; i < weight; i++) abuseRef.current.push(now);
    abuseRef.current = abuseRef.current.filter((t) => now - t < 60000);
    if (abuseRef.current.length >= 6) {
      abuseRef.current = [];
      hurtRef.current = true;
      setHurt(true);
      clearTimeout(hurtTimer.current);
      hurtTimer.current = setTimeout(() => {
        hurtRef.current = false;
        abuseRef.current = []; // finita la tristezza, si riparte da zero
        setHurt(false);
      }, 8000);
      onHurtRef.current?.();
      emit("hurt");
    }
  };

  const goDizzy = () => {
    setDizzy(true);
    clearTimeout(dizzyTimer.current);
    dizzyTimer.current = setTimeout(() => setDizzy(false), 4500);
    poke();
    mistreat(2);
    onDizzyRef.current?.();
    emit("dizzy");
  };

  // Schiacciata: all'atterraggio e, più forte e nella direzione giusta, quando sbatte contro un bordo
  const bump = (side = "land") => {
    setSplat(null);
    requestAnimationFrame(() => setSplat(side));
    setTimeout(() => setSplat((s) => (s === side ? null : s)), 460);
  };

  // Atterraggio: quella diventa la nuova casa
  const landAt = (x: number, y: number) => {
    const { w: vw, h: vh } = vpSize();
    const nh = {
      left: Math.round(clamp(x, 8, Math.max(8, vw - size - 8))),
      top: Math.round(clamp(y, 8, Math.max(8, vh - svgH - 8))),
    };
    if (homeProp === undefined) {
      setCustomHome(nh);
      if (persistHome) storeHome(persistHome, nh);
    }
    dragRef.current = null;
    throwRef.current = null;
    draggingRef.current = false;
    setDragging(false);
    setThrowing(false);
    bump();
    onHomeChangeRef.current?.({ ...nh, width: size, height: svgH }, { custom: true, fromDrag: true });
    onDragEndRef.current?.({ ...nh, width: size, height: svgH });
    emit("drag_end", { left: nh.left, top: nh.top });
  };

  const runPhysics = () => {
    const ph = physRef.current;
    if (ph.raf) return;
    ph.last = performance.now();
    ph.px = null;
    const step = (now: number) => {
      const dt = Math.min(0.033, Math.max(0.001, (now - ph.last) / 1000));
      ph.last = now;
      const d = dragRef.current;

      // Volo: scivola con attrito e rimbalza sui bordi; una botta forte lo manda KO
      const t = throwRef.current;
      if (t && d) {
        const { w: vw, h: vh } = vpSize();
        const fr = Math.exp(-1.8 * dt);
        t.vx *= fr; t.vy *= fr;
        d.left += t.vx * dt; d.top += t.vy * dt;
        const maxX = Math.max(8, vw - size - 8), maxY = Math.max(8, vh - svgH - 8);
        let hit = 0, side = null;
        if (d.left < 8) { d.left = 8; hit = Math.abs(t.vx); side = "left"; t.vx = Math.abs(t.vx) * 0.55; }
        else if (d.left > maxX) { d.left = maxX; hit = Math.abs(t.vx); side = "right"; t.vx = -Math.abs(t.vx) * 0.55; }
        if (d.top < 8) { if (Math.abs(t.vy) > hit) side = "top"; hit = Math.max(hit, Math.abs(t.vy)); d.top = 8; t.vy = Math.abs(t.vy) * 0.55; }
        else if (d.top > maxY) { if (Math.abs(t.vy) > hit) side = "bottom"; hit = Math.max(hit, Math.abs(t.vy)); d.top = maxY; t.vy = -Math.abs(t.vy) * 0.55; }
        if (hit > 1500) goDizzy();
        else if (hit > 900) mistreat(1);
        if (hit > 200 && side) bump(side);
        const st = stageRef.current;
        if (st) { st.style.left = `${d.left}px`; st.style.top = `${d.top}px`; }
        if (Math.hypot(t.vx, t.vy) < 40) landAt(d.left, d.top);
      }

      // Pendolo con perno che si muove: θ'' = (ax·cosθ − (g − ay)·sinθ) / L − smorzamento·θ'
      let ax = 0, ay = 0;
      const dd = dragRef.current;
      if (dd) {
        const x = dd.left + kx, y = dd.top + ky;
        if (ph.px != null) {
          const vx = (x - ph.px) / dt, vy = (y - (ph.py ?? y)) / dt;
          ph.ax = ph.ax * 0.5 + ((vx - ph.vx) / dt) * 0.5;
          ph.ay = ph.ay * 0.5 + ((vy - ph.vy) / dt) * 0.5;
          ph.vx = vx; ph.vy = vy;
        }
        ph.px = x; ph.py = y;
        ax = clamp(ph.ax * 0.5, -30000, 30000);   // meno sensibile ai movimenti della mano
        ay = clamp(ph.ay * 0.5, -30000, 30000);
      } else { ph.px = null; ph.vx = 0; ph.vy = 0; ph.ax = 0; ph.ay = 0; }
      const damp = heldRef.current ? 2 : 3.2;
      const alpha = (ax * Math.cos(ph.th) - (GRAV - ay) * Math.sin(ph.th)) / PEND_L - damp * ph.om;
      ph.om = clamp(ph.om + alpha * dt, -45, 45);
      ph.th += ph.om * dt;
      const hang = hangRef.current;
      if (hang) hang.style.transform = `rotate(${((ph.th * 180) / Math.PI).toFixed(2)}deg)`;

      // A riposo torna dritto (anche dopo tanti giri)
      const rest = ph.th - Math.round(ph.th / (2 * Math.PI)) * 2 * Math.PI;
      if (!dragRef.current && Math.abs(rest) < 0.004 && Math.abs(ph.om) < 0.02) {
        ph.th = 0; ph.om = 0; ph.raf = 0;
        if (hang) hang.style.transform = "";
        return;
      }
      ph.raf = requestAnimationFrame(step);
    };
    ph.raf = requestAnimationFrame(step);
  };
  useEffect(() => () => cancelAnimationFrame(physRef.current.raf), []);

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!draggable || (e.pointerType === "mouse" && e.button !== 0)) return;
    if (throwRef.current) { throwRef.current = null; setThrowing(false); } // lo riprendi al volo
    const sx = e.clientX, sy = e.clientY, id = e.pointerId, btn = e.currentTarget;
    const samples: { t: number; x: number; y: number }[] = [];
    const shake: { sign: number; rev: number[] } = { sign: 0, rev: [] };
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      if (!draggingRef.current || !heldRef.current) {
        if (!dragRef.current && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return; // sotto i 6px è un tocco
        draggingRef.current = true;
        heldRef.current = true;
        try { btn.setPointerCapture(id); } catch {}
        dragRef.current = { left: ev.clientX - kx, top: ev.clientY - ky };
        placeRef.current = null;
        setPlace(null);
        setDragging(true);
        poke();
        if (!stillRef.current) runPhysics();
        onDragStartRef.current?.();
        emit("drag_start");
      }
      if (ev.cancelable) ev.preventDefault();
      const now = performance.now();
      const prev = samples[samples.length - 1];
      samples.push({ t: now, x: ev.clientX, y: ev.clientY });
      while (samples.length && now - samples[0].t > 120) samples.shift();
      // Scossone: tante inversioni veloci di direzione in poco tempo
      if (prev && now > prev.t) {
        const vx = ((ev.clientX - prev.x) / (now - prev.t)) * 1000;
        const vy = ((ev.clientY - prev.y) / (now - prev.t)) * 1000;
        const v = Math.abs(vx) > Math.abs(vy) ? vx : vy;
        if (Math.abs(v) > 850) {
          const sg = Math.sign(v);
          if (shake.sign && sg !== shake.sign) shake.rev.push(now);
          shake.sign = sg;
          shake.rev = shake.rev.filter((tt) => now - tt < 1000);
          if (shake.rev.length >= 6) { shake.rev = []; goDizzy(); }
        }
      }
      const d = dragRef.current;
      if (!d) return;
      d.left = ev.clientX - kx;
      d.top = ev.clientY - ky;
      const st = stageRef.current;
      if (st) { st.style.left = `${d.left}px`; st.style.top = `${d.top}px`; }
    };
    const up = (ev: PointerEvent) => {
      if (ev.pointerId !== id) return;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!heldRef.current) return;
      heldRef.current = false;
      justDraggedRef.current = true;
      setTimeout(() => { justDraggedRef.current = false; }, 350);
      const d = dragRef.current;
      // Velocità di rilascio dagli ultimi ~100 ms: se è alta parte il lancio
      const first = samples[0], last = samples[samples.length - 1];
      const span = first && last ? (last.t - first.t) / 1000 : 0;
      const vx = span > 0.01 ? (last.x - first.x) / span : 0;
      const vy = span > 0.01 ? (last.y - first.y) / span : 0;
      if (throwable && !stillRef.current && Math.hypot(vx, vy) > 1100 && performance.now() - (last?.t || 0) < 80) {
        throwRef.current = { vx: clamp(vx, -5000, 5000), vy: clamp(vy, -5000, 5000) };
        mistreat(1);
        emit("throw", { speed: Math.round(Math.hypot(vx, vy)) });
        setDragging(false);
        setThrowing(true);
        return;
      }
      if (d) landAt(d.left, d.top);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Comunica dov'è casa (serve per aprire la chat nel posto migliore), anche dopo un resize
  useEffect(() => {
    const emit = () => {
      const h = homePosRef.current;
      let r = null;
      if (h) r = { left: h.left, top: h.top, width: size, height: svgH };
      else if (wrapRef.current) { const b = wrapRef.current.getBoundingClientRect(); r = { left: b.left, top: b.top, width: b.width, height: b.height }; }
      if (r) onHomeChangeRef.current?.(r, { custom: !!h, fromDrag: false });
    };
    emit();
    const onResize = () => emit(); // comunica solo la posizione mostrata, non cambia la casa scelta
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [homeShown?.left, homeShown?.top, size, svgH]); // eslint-disable-line react-hooks/exhaustive-deps
  // Il conto alla rovescia parte quando è arrivato e sta indicando (dopo scroll e teletrasporto)
  const pointingNow = !!point && phase === "idle";
  const onPointEndRef = useRef(onPointEnd);
  onPointEndRef.current = onPointEnd;
  useEffect(() => {
    if (!pointingNow || pointDuration == null) return;
    const t = setTimeout(() => { setPointExpired(true); onPointEndRef.current?.(); emit("point_end", { reason: "timeout" }); }, pointDuration);
    return () => clearTimeout(t);
  }, [pointingNow, pointDuration, pointAtIn]);
  const bubbleRef = useRef<HTMLDivElement>(null);
  // Con un bersaglio, il fumetto compare solo quando Simply è arrivato e sta indicando
  const showMessage = !!message && !hiddenNow && !airborne && (!pointAt || (!!point && phase === "idle"));

  // Il fumetto conosce la propria grandezza: sta sopra Simply se c'è spazio, altrimenti sotto;
  // scivola di lato per non uscire dallo schermo e, se proprio non entra, diventa scorrevole.
  // Ricalcolato a ogni frame mentre è visibile (segue teletrasporti, scroll, testo in streaming, resize).
  useEffect(() => {
    const b = bubbleRef.current;
    if (!b || !showMessage) return;
    let raf = 0;
    let prev = "";
    const M = 8, TAIL = 12;
    const fit = () => {
      raf = requestAnimationFrame(fit);
      const svg = svgRef.current;
      if (!svg) return;
      const sr = svg.getBoundingClientRect();
      const { w: vw, h: vh, top: vt } = vpSize();
      const w = b.offsetWidth;
      b.style.maxHeight = "none";
      const h = b.scrollHeight + 5; // bordi inclusi
      const above = sr.top - vt - M - TAIL;
      const below = vh - sr.bottom - M - TAIL;
      const pos = h <= above ? "above" : h <= below ? "below" : above >= below ? "above" : "below";
      const room = Math.max(60, Math.floor(pos === "above" ? above : below));
      const cx = sr.left + sr.width / 2;
      const left = clamp(cx - w / 2, M, Math.max(M, vw - M - w));
      const shift = Math.round(left - (cx - w / 2));
      const arrow = clamp(-shift, -w / 2 + 18, w / 2 - 18);
      const key = `${pos}|${shift}|${arrow}|${h > room ? room : 0}`;
      if (key !== prev) {
        prev = key;
        b.classList.toggle("below", pos === "below");
        b.style.marginLeft = `${shift}px`;
        b.style.setProperty("--simply-arrow", `${arrow}px`);
      }
      b.style.maxHeight = h > room ? `${room}px` : "none";
      b.style.overflowY = h > room ? "auto" : "visible";
    };
    fit();
    return () => cancelAnimationFrame(raf);
  }, [showMessage]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  // Puff! sparisce, si sposta, riappare
  const jump = useCallback((dest: HomePosition | null) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const fast = fastRef.current;
    const later = (fn: () => void, ms: number) => timersRef.current.push(setTimeout(fn, ms));
    setPuffN((n) => n + 1);
    setPhase("out");
    later(() => {
      placeRef.current = dest;
      setPlace(dest);
      setPuffN((n) => n + 1);
      setPhase("in");
      later(() => { setPhase("idle"); busyRef.current = false; }, fast ? 0 : 380);
    }, fast ? 0 : 300);
  }, []);

  useEffect(() => {
    let raf = 0;
    let last: PointState | null = null;
    let scrolledFor: Element | { x: number; y: number } | null = null;
    let settling: { top: number; left: number; stableSince: number; deadline: number } | null = null; // attesa della fine dello scroll: { top, left, stableSince, deadline }
    let started = false;
    let decided = false; // la scelta casa/teletrasporto si fa una volta per bersaglio, non a ogni scroll
    let anchor: { ox: number; oy: number } | null = null;   // se teletrasportato: offset rispetto al bersaglio, così Simply scorre insieme a lui
    let outSince = 0;    // da quando Simply è fuori dalla finestra
    const goHome = () => { if (placeRef.current && !busyRef.current) jump(null); };
    const clearPoint = () => { if (last) { last = null; setPoint(null); } };
    if (!pointAt) { setPoint(null); goHome(); return; }

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (draggingRef.current) return; // mentre lo trascini non decide nulla
      const svg = svgRef.current;
      if (!svg || !wrapRef.current) return;
      const homeRect = () => {
        const h = homePosRef.current;
        return h ? { left: h.left, top: h.top, right: h.left + size, bottom: h.top + svgH, width: size, height: svgH }
          : wrapRef.current!.getBoundingClientRect();
      };
      const target = resolveTarget(pointAt);
      if (!target) { clearPoint(); goHome(); return; } // il bersaglio è sparito: giù il braccio, si torna a casa

      let tx: number, ty: number, rect: Required<Rect>;
      if (target instanceof Element) {
        rect = target.getBoundingClientRect();
        if (!rect.width && !rect.height) { clearPoint(); goHome(); return; }
        tx = rect.left + rect.width / 2;
        ty = rect.top + rect.height / 2;
      } else {
        tx = target.x; ty = target.y;
        rect = { left: tx, right: tx, top: ty, bottom: ty, width: 0, height: 0 };
      }
      if (busyRef.current) return;

      // 0) Sta ancora scorrendo? Aspetta che il bersaglio stia fermo prima di fare qualsiasi altra cosa
      if (settling) {
        const now = performance.now();
        if (Math.abs(rect.top - settling.top) > 0.5 || Math.abs(rect.left - settling.left) > 0.5) {
          settling.top = rect.top; settling.left = rect.left; settling.stableSince = now;
        }
        if (now - settling.stableSince < 160 && now < settling.deadline) return;
        settling = null;
      }

      // 1) Solo all'inizio, quando riceve il bersaglio: se è fuori vista lo porta in vista e aspetta la fine dello scroll.
      //    Dopo non scorre mai più: se è l'utente a scrollare, è Simply che si sposta (vedi 2c), non la pagina.
      const firstLook = scrolledFor !== target;
      if (firstLook) scrolledFor = target;
      const container = scrollContainer ? (resolveTarget(scrollContainer) || null) : null;
      const view = viewRect(container instanceof Element ? container : null);
      const outOfView = rect.bottom < view.top || rect.top > view.bottom || rect.right < view.left || rect.left > view.right;
      if (firstLook && scrollToTarget && target instanceof Element && outOfView) {
        const behavior = fastRef.current ? "auto" : "smooth";
        if (container instanceof Element) {
          const c = container.getBoundingClientRect();
          container.scrollBy({
            top: rect.top + rect.height / 2 - (c.top + c.height / 2),
            left: rect.left + rect.width / 2 - (c.left + c.width / 2),
            behavior,
          });
        } else {
          target.scrollIntoView({ behavior, block: "center", inline: "nearest" });
        }
        const now = performance.now();
        // stableSince nel futuro: lascia allo scroll fluido il tempo di partire
        settling = { top: rect.top, left: rect.left, stableSince: now + 120, deadline: now + 2500 };
        return;
      }

      // 2) Lontano: teletrasporto vicino al bersaglio (deciso una volta sola per bersaglio)
      if (teleport && !decided) {
        decided = true;
        const fx = (x: number) => ((x - VB.x) / VB.w) * size;
        const fy = (y: number) => ((y - VB.y) / VB.h) * svgH;
        const dist = (ox: number, oy: number) => Math.min(...[SH_L, SH_R].map(([x, y]) => Math.hypot(tx - (ox + fx(x)), ty - (oy + fy(y)))));
        const home = homeRect();
        const cur = placeRef.current;
        // Lontano da casa: se è già teletrasportato abbastanza vicino al nuovo bersaglio resta dov'è, altrimenti si sposta
        const want = dist(home.left, home.top) <= teleportDistance ? null
          : cur && dist(cur.left, cur.top) <= teleportDistance ? cur
          : nearTarget(rect, size, svgH);
        if (want) anchor = { ox: want.left - rect.left, oy: want.top - rect.top };
        const differs = !want !== !cur || (want && cur && Math.hypot(want.left - cur.left, want.top - cur.top) > 40);
        if (differs) { clearPoint(); jump(want); return; }
        if (want && cur) anchor = { ox: cur.left - rect.left, oy: cur.top - rect.top }; // era già lì vicino
      }

      // 2b) Teletrasportato: segue il bersaglio mentre la pagina (o un contenitore) scorre
      if (anchor && placeRef.current && stageRef.current) {
        const left = Math.round(rect.left + anchor.ox);
        const top = Math.round(rect.top + anchor.oy);
        const curPos = placeRef.current;
        if (left !== curPos.left || top !== curPos.top) {
          placeRef.current = { left, top };
          stageRef.current.style.left = `${left}px`;
          stageRef.current.style.top = `${top}px`;
        }
      }

      // 2c) Sempre in vista: se Simply esce dalla finestra, ricompare dove si vede
      if (teleport && stageRef.current) {
        const now = performance.now();
        if (visibleFraction(stageRef.current.getBoundingClientRect()) < 0.35) {
          if (!outSince) outSince = now;
          else if (now - outSince > 250) {
            outSince = 0;
            const cur = placeRef.current;
            let dest;
            if (visibleFraction(rect) > 0.3) {
              dest = nearTarget(rect, size, svgH);                     // il bersaglio si vede: accanto a lui
              anchor = { ox: dest.left - rect.left, oy: dest.top - rect.top };
            } else {
              const homeVisible = visibleFraction(homeRect()) >= 0.6;
              dest = homeVisible ? null : cornerSpot(size, svgH);     // a casa, o nell'angolo se casa non si vede
              anchor = null;
            }
            const differs = !dest !== !cur || (dest && cur && Math.hypot(dest.left - cur.left, dest.top - cur.top) > 40);
            if (differs) { clearPoint(); jump(dest); return; }
          }
        } else outSince = 0;
      }

      // 3) Indica
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const pt = svg.createSVGPoint();
      const toScreen = ([x, y]: readonly [number, number]) => { pt.x = x; pt.y = y; return pt.matrixTransform(ctm); };
      const center = toScreen([100, 110]);
      const left = tx < center.x;
      const sh = toScreen(left ? SH_L : SH_R);
      const ang = (Math.atan2(ty - sh.y, tx - sh.x) * 180) / Math.PI;
      let deg;
      if (!left) deg = clamp(ang, -110, 75);
      else {
        let phi = ang - 180;
        while (phi < -180) phi += 360;
        while (phi > 180) phi -= 360;
        deg = clamp(phi, -75, 110);
      }
      const eye = toScreen([100, 98]);
      const dx = tx - eye.x, dy = ty - eye.y, d = Math.hypot(dx, dy) || 1;
      const pwd = coverEyesOnPassword && typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement && target.type === "password";
      const next: PointState = { pwd, side: left ? "l" : "r", deg: Math.round(deg), ex: Math.round((dx / d) * 28) / 10, ey: Math.round((dy / d) * 28) / 10 };
      if (!started) { started = true; onPointStartRef.current?.(); onEventRef.current?.("point_start"); }
      if (!last || last.pwd !== next.pwd || last.side !== next.side || Math.abs(last.deg - next.deg) >= 1 || last.ex !== next.ex || last.ey !== next.ey) {
        last = next;
        setPoint(next);
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [pointAt, teleport, teleportDistance, scrollToTarget, scrollContainer, coverEyesOnPassword, size, svgH, jump]);

  // Se l'utente scrive nella password che Simply stava indicando: smette di indicare e si copre entrambi gli occhi
  const pt = focusPwd ? null : point;
  const sitting = mood === "sitting" || (baseIdle && idleSit);
  let activeProp: PropName | null = prop === "none" ? null : (prop ?? DEFAULT_PROP[mood] ?? (baseIdle && idleCoffee ? "coffee" : null));
  if (pt && activeProp === "book") activeProp = null; // il librone vuole due mani
  if (pt?.side === "r") activeProp = null;          // la destra è impegnata a indicare
  const privacy = mood === "privacy" || focusPwd || !!point?.pwd;
  if (privacy) activeProp = null;
  const coverL = privacy && pt?.side !== "l";
  const coverR = privacy && pt?.side !== "r";
  const pose = POSES[activeProp ? PROP_POSE[activeProp] : "rest"];
  const hand = pose.hand ?? POSES.rest.hand!;
  const PROP_LOOK: Partial<Record<PropName, { x: number; y: number }>> = { book: { x: 0, y: 3.2 }, chart: { x: 2.6, y: 1.2 }, coffee: { x: 1.4, y: 2.4 }, wrench: { x: 2.6, y: 1.6 } };
  const pupil =
    (pt && { x: pt.ex, y: pt.ey }) ??
    (mood === "sad" || (hurt && !dizzy) ? { x: 0, y: 2.6 } : mood === "confused" ? { x: -2.2, y: -2.6 } : null) ??
    (activeProp ? PROP_LOOK[activeProp] : undefined) ??
    (mood === "thinking" ? { x: 2.6, y: -2.8 } :
     mood === "listening" ? { x: -1.6, y: 1.6 } : look);
  const happyEyes = mood === "news" || mood === "success";
  const wear = new Set(accessories || []);
  const hat = HATS.find((h) => wear.has(h));
  const dizzyNow = dizzy || mood === "dizzy";
  const face = dizzyNow ? "dizzy"
    : hurt ? "sad"
    : airborne ? "surprised"
    : FACE_MOODS.includes(mood) ? mood
    : happyEyes ? "happy"
    : activeProp === "wrench" || mood === "error" ? "worried"
    : mood === "thinking" ? "thinking"
    : "normal";

  // ---------- Portal: Simply vive in un livello sotto <body>; il wrapper resta nel layout come "segnaposto di casa" ----------
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // (createPortal può mancare in ambienti ridotti, es. l'anteprima di Claude: allora resta nel layout)
  const usePortal = portal && mounted && typeof document !== "undefined" && typeof createPortal === "function";
  const atDefaultHome = !(airborne && dragRef.current) && !(place && placeRef.current) && !homeShown;
  const anchorRef = useRef<{ left: number; top: number }>({ left: 0, top: 0 });
  if (usePortal && atDefaultHome && wrapRef.current) {
    const r = wrapRef.current.getBoundingClientRect();
    anchorRef.current = { left: r.left, top: r.top };
  }
  const atHomeRef = useRef(atDefaultHome);
  atHomeRef.current = atDefaultHome;
  // A casa, nel portal, lo stage segue il segnaposto (scroll, layout che cambia, contenitori che si muovono)
  useEffect(() => {
    if (!usePortal) return;
    let raf = 0;
    const follow = () => {
      raf = requestAnimationFrame(follow);
      if (!atHomeRef.current || !wrapRef.current || !stageRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const a = anchorRef.current;
      if (Math.abs(r.left - a.left) > 0.5 || Math.abs(r.top - a.top) > 0.5) {
        anchorRef.current = { left: r.left, top: r.top };
        stageRef.current.style.left = `${r.left}px`;
        stageRef.current.style.top = `${r.top}px`;
      }
    };
    follow();
    return () => cancelAnimationFrame(raf);
  }, [usePortal]);

  const rootCls = `simply-root ${ringing ? "is-ring" : ""} ${airborne ? "is-dragging" : ""} ${landed ? "is-land" : ""} ${splat ? `splat-${splat}` : ""} m-${privacy ? "privacy" : dizzyNow ? "dizzy" : sitting ? "sitting" : mood} ${ding ? "is-ding" : ""} ${still ? "simply-still" : reduced ? "simply-reduced" : ""}`;
  const badgeText = badge === true ? "" : badge === false || badge == null || badge === 0 ? null : String(badge);

  const stageEl = (
      <div ref={stageRef} className="simply-stage" style={{
        ...(airborne && dragRef.current
          ? { position: "fixed", left: dragRef.current.left, top: dragRef.current.top, width: size, zIndex: 2147483000 }
          : place && placeRef.current
          ? { position: "fixed", left: placeRef.current.left, top: placeRef.current.top, width: size, zIndex: 2147483000 }
          : homeShown
          ? { position: "fixed", left: homeShown.left, top: homeShown.top, width: size, zIndex: 2147482500 }
          : usePortal
          ? { position: "fixed", left: anchorRef.current.left, top: anchorRef.current.top, width: size }
          : { position: "absolute", left: 0, top: 0, width: size }),
        transform: shift.mini ? "scale(.45)" : shift.y ? `translateY(${shift.y}px)` : undefined,
        transformOrigin: "100% 100%",
        opacity: !visible ? 0 : shift.mini ? 0.85 : 1,
        pointerEvents: visible ? undefined : "none",
      }}
        aria-hidden={visible ? undefined : true}
        onPointerEnter={poke}>
      {badgeText !== null && (
        <button type="button" className={`simply-badge ${badgeText === "" ? "dot" : ""} ${classNames?.badge ?? ""}`}
          style={{ left: size * 0.68, top: svgH * 0.2 }}
          onClick={(e) => { e.stopPropagation(); onBadgeClick?.(); emit("badge_click"); }}
          aria-label={badgeText === "" ? "Novità" : `${badgeText} novità`}>
          {badgeText}
        </button>
      )}
      {phase !== "idle" && (
        <div className="simply-puff" key={`puff-${puffN}`} aria-hidden="true">
          {PUFF.map((_, i) => <i key={i} className={`simply-puff-${i}`} />)}
        </div>
      )}
      <div className={`simply-scaler ${phase === "out" ? "poof-out" : phase === "in" ? "poof-in" : nope ? "nope" : ""}`}>
      <div ref={bubbleRef} className={`simply-bubble ${showMessage ? "on" : ""} ${classNames?.bubble ?? ""}`} aria-live="polite">{showMessage ? message : ""}</div>
      <div ref={hangRef} className="simply-hang" style={{ transformOrigin: `${kx}px ${ky}px` }}>
      <button type="button" className="simply-btn" onClick={handleClick} onPointerDown={onPointerDown}
        style={{ touchAction: draggable ? "none" : undefined, cursor: dragging ? "grabbing" : undefined }}
        aria-label={hiddenNow ? "Mostra Simply" : label}>
        <svg ref={svgRef} className="simply-svg" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`}
          width={size} height={svgH} role="img" aria-hidden="true">
          <ellipse className="simply-shadow" cx="100" cy="199" rx={sitting ? 74 : 64} ry="6" fill={C.ink} opacity=".12" />

          <g className="simply-bob"><g className="simply-tilt" style={pt ? { transform: `rotate(${pt.side === "r" ? 3 : -3}deg)` } : undefined}><g className="simply-sit">
            {/* Mantello */}
            {wear.has("cape") && <g className="simply-cape">
              {/* drappeggio morbido: scende dietro al corpo e si apre poco, orlo ondulato */}
              <path d="M50 122C30 130 15 156 10 180Q17 192 32 187Q46 182 57 191Q72 198 86 190Q100 184 114 190Q128 198 143 191Q154 182 168 187Q183 192 190 180C185 156 170 130 150 122Z"
                fill={cape.base} stroke={C.ink} strokeWidth="3.5" strokeLinejoin="round" />
              <path d="M24 148Q17 166 22 184M176 148Q183 166 178 184" stroke={cape.light} strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M50 172Q52 182 57 190M150 172Q148 182 143 190" stroke={cape.dark} strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <Fleur x={19} y={164} s={0.9} r={-8} />
              <Fleur x={163} y={164} s={0.9} r={8} />
            </g>}

            {/* Gambe corte e cicciotte (nascoste da seduto) */}
            <g className="simply-legs" fill={C.ink} style={sitting ? { display: "none" } : undefined}>
              <rect x="73" y="166" width="13" height="18" rx="6.5" />
              <rect x="114" y="166" width="13" height="18" rx="6.5" />
              <ellipse cx="77" cy="188" rx="15" ry="7.5" />
              <ellipse cx="123" cy="188" rx="15" ry="7.5" />
            </g>

            <g className="simply-body">
              <circle className="simply-ring" cx="100" cy="46" r="22" fill="none" stroke={C.coral} strokeWidth="3" opacity="0" />
              <g className="simply-knob">
                <rect x="93" y="46" width="14" height="18" rx="3.5" fill={C.gold} stroke={C.ink} strokeWidth="3.5" />
                <ellipse cx="100" cy="46" rx="20" ry="6.5" fill={C.gold} stroke={C.ink} strokeWidth="3.5" />
              </g>
              {/* Cupola larga e bassa */}
              <path d="M40 150V118C40 80 66 62 100 62S160 80 160 118V150Z" fill={C.gold} stroke={C.ink} strokeWidth="4" strokeLinejoin="round" />
              <path d="M54 110C53 92 65 77 84 71" stroke="#fff" strokeOpacity=".6" strokeWidth="7" fill="none" strokeLinecap="round" />
              <rect x="36" y="147" width="128" height="16" rx="7" fill="#2C2C31" stroke={C.ink} strokeWidth="3.5" />
              <rect x="40" y="161" width="120" height="8" rx="4" fill={C.gold} stroke={C.ink} strokeWidth="3" />

              {/* Colletto + medaglia */}
              {wear.has("cape") && <path d="M41 124Q100 140 159 124L161 135Q100 153 39 135Z" fill={cape.base} stroke={C.ink} strokeWidth="3" strokeLinejoin="round" />}
              {wear.has("scarf") && <ScarfArt />}
              <circle className="simply-medal" cx="100" cy="139" r="10.5" fill={C.cream} stroke={C.ink} strokeWidth="2.8" />
              <text x="100" y="142.6" textAnchor="middle" fontSize="9.5" fontWeight="800" fontFamily="system-ui,sans-serif" fill={C.ink}>SB</text>

              {/* Viso */}
              <ellipse cx="65" cy="112" rx="7.5" ry="4.5" fill={C.blush} opacity={privacy || face === "love" ? ".8" : face === "sad" ? ".25" : ".45"} />
              <ellipse cx="135" cy="112" rx="7.5" ry="4.5" fill={C.blush} opacity={privacy || face === "love" ? ".8" : face === "sad" ? ".25" : ".45"} />
              <g stroke={C.ink} strokeWidth="3" fill="none" strokeLinecap="round">
                {(BROWS[face] || BROWS.normal).map((d) => <path key={d} d={d} />)}
              </g>
              {face === "happy" ? (
                <g stroke={C.ink} strokeWidth="3.8" fill="none" strokeLinecap="round">
                  <path d="M72 101Q80 92 88 101" />
                  <path d="M112 101Q120 92 128 101" />
                </g>
              ) : face === "sleepy" ? (
                <g stroke={C.ink} strokeWidth="3.8" fill="none" strokeLinecap="round">
                  <path d="M72 98Q80 104 88 98" />
                  <path d="M112 98Q120 104 128 98" />
                </g>
              ) : face === "dizzy" ? (
                <g stroke={C.ink} strokeWidth="2.6" fill="none" strokeLinecap="round">
                  <path className="simply-spiral" d={SPIRAL_L} style={{ transformOrigin: "80px 98px" }} />
                  <path className="simply-spiral" d={SPIRAL_R} style={{ transformOrigin: "120px 98px", animationDirection: "reverse" }} />
                </g>
              ) : face === "laughing" ? (
                <g stroke={C.ink} strokeWidth="3.8" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M73 92L86 98L73 104" />
                  <path d="M127 92L114 98L127 104" />
                </g>
              ) : face === "love" ? (
                <g fill={C.coral} stroke={C.ink} strokeWidth="2" strokeLinejoin="round">
                  {[80, 120].map((x) => (
                    <path key={x} className="simply-heart"
                      d={`M${x} 107C${x - 11} 99 ${x - 10} 88 ${x - 4} 89C${x - 2} 89 ${x} 91 ${x} 93C${x} 91 ${x + 2} 89 ${x + 4} 89C${x + 10} 88 ${x + 11} 99 ${x} 107Z`} />
                  ))}
                </g>
              ) : (
                <g className="simply-eyes">
                  <g className="simply-pupils" style={{ transform: `translate(${pupil.x}px, ${pupil.y}px)` }}>
                    {face === "surprised" ? (
                      <>
                        <ellipse cx="80" cy="97" rx="9" ry="12" fill={C.ink} />
                        <ellipse cx="120" cy="97" rx="9" ry="12" fill={C.ink} />
                        <circle cx="83" cy="92" r="3.2" fill="#fff" />
                        <circle cx="123" cy="92" r="3.2" fill="#fff" />
                      </>
                    ) : (
                      <>
                        <ellipse cx="80" cy="98" rx="8" ry="10" fill={C.ink} />
                        <ellipse cx="120" cy="98" rx="8" ry="10" fill={C.ink} />
                        <circle cx="83" cy="94" r={face === "sad" ? 3.4 : 2.8} fill="#fff" />
                        <circle cx="123" cy="94" r={face === "sad" ? 3.4 : 2.8} fill="#fff" />
                        {face === "sad" && <><circle cx="77" cy="101" r="1.6" fill="#fff" /><circle cx="117" cy="101" r="1.6" fill="#fff" /></>}
                      </>
                    )}
                  </g>
                </g>
              )}
              <g className="simply-mouth">
                {face === "sad" ? (
                  <path d="M89 121Q100 111 111 121" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
                ) : face === "surprised" ? (
                  <ellipse cx="100" cy="117" rx="5.5" ry="7" fill={C.ink} />
                ) : face === "thinking" ? (
                  <path d="M88 118Q96 114.5 105 117.5" stroke={C.ink} strokeWidth="3.6" fill="none" strokeLinecap="round" />
                ) : face === "confused" ? (
                  <path d="M89 117q5.5-5 11 0t11 0" stroke={C.ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                ) : face === "sleepy" ? (
                  <ellipse cx="100" cy="117" rx="3.6" ry="3" fill={C.ink} />
                ) : face === "dizzy" ? (
                  <>
                    <path d="M87 117q4.3-4.5 8.6 0t8.6 0t8.6 0" stroke={C.ink} strokeWidth="3.4" fill="none" strokeLinecap="round" />
                    <path d="M104 119q2 7 6 6.5q3-.6 1.5-6.5Z" fill={C.tongue} stroke={C.ink} strokeWidth="1.6" />
                  </>
                ) : face === "laughing" ? (
                  <>
                    <path d="M85 108Q100 111 115 108Q114 129 100 129Q86 129 85 108Z" fill={C.ink} />
                    <path d="M91 122Q100 115 109 122Q105 128 100 128Q95 128 91 122Z" fill={C.tongue} />
                  </>
                ) : (
                  <>
                    <path d="M89 110Q100 112 111 110Q109 123 100 123Q91 123 89 110Z" fill={C.ink} />
                    <path d="M94 118Q100 113 106 118Q103 122 100 122Q97 122 94 118Z" fill={C.tongue} />
                  </>
                )}
              </g>
              {face === "sad" && (
                <path className="simply-tear" d="M73 107q-4 6 0 8.5q4-2.5 0-8.5Z" fill="#8FD3FF" stroke={C.ink} strokeWidth="1.8" />
              )}
              {face === "confused" && (
                <text className="simply-q" x="150" y="66" fontSize="24" fontWeight="900" fill={C.purpleLight} stroke={C.ink} strokeWidth="1.2" fontFamily="system-ui,sans-serif">?</text>
              )}
              {face === "sleepy" && [0, 1].map((i) => (
                <text key={i} className="simply-z" x={142 + i * 11} y={66 - i * 10} fontSize={12 + i * 4} fontWeight="900" fill={C.purpleLight}
                  fontFamily="system-ui,sans-serif" style={{ animationDelay: `${i * 1.2}s` }}>z</text>
              ))}
              {face === "dizzy" && [0, 1, 2].map((i) => (
                <path key={i} className="simply-orbit" d={ORBIT_STAR} fill={C.gold} stroke={C.ink} strokeWidth="1.3" strokeLinejoin="round"
                  style={{ animationDelay: `${-i * 0.4}s` }} />
              ))}
              {face === "laughing" && (
                <>
                  <path className="simply-tear" d="M66 103q-4 6 0 8.5q4-2.5 0-8.5Z" fill="#8FD3FF" stroke={C.ink} strokeWidth="1.6" />
                  <path className="simply-tear" d="M134 103q-4 6 0 8.5q4-2.5 0-8.5Z" fill="#8FD3FF" stroke={C.ink} strokeWidth="1.6" style={{ animationDelay: ".5s" }} />
                  {[0, 1].map((i) => (
                    <text key={i} className="simply-z" x={i ? 148 : 30} y={i ? 62 : 70} fontSize="12" fontWeight="900" fill={C.purpleLight}
                      fontFamily="system-ui,sans-serif" style={{ animationDelay: `${i * 0.6}s`, animationDuration: "1.4s" }}>ha</text>
                  ))}
                </>
              )}
              {face === "love" && (
                <path className="simply-z" d="M150 64c-5-3.5-5-8.5-2-9c1.2-.2 2 .8 2 1.8c0-1 .8-2 2-1.8c3 .5 3 5.5-2 9Z" fill={C.coral} style={{ animationDelay: ".3s" }} />
              )}
              {wear.has("sunglasses") && !privacy && <SunglassesArt />}
              {activeProp === "book" && !wear.has("sunglasses") && (
                <g stroke={C.ink} strokeWidth="3" fill="#fff" fillOpacity=".18">
                  <circle cx="80" cy="98" r="12" />
                  <circle cx="120" cy="98" r="12" />
                  <path d="M92 97Q100 92 108 97" fill="none" />
                </g>
              )}
              {activeProp === "wrench" && (
                <path className="simply-sweat" d="M58 72q-5 8 0 11q5-3 0-11Z" fill="#8FD3FF" stroke={C.ink} strokeWidth="2" />
              )}
            </g>

            {hat && <HatArt kind={hat} />}

            {activeProp === "book" && <BigBook />}

            {/* Braccio sinistro (lato di chi guarda) */}
            {pt?.side === "l" ? (
              <PointingArm key="point-l" side="l" deg={pt.deg} />
            ) : coverL ? (
              <CoverArm side="l" peek={coverR} />
            ) : activeProp === "book" ? (
              <g key="book-l">
                <path d="M44 128Q38 146 53 153" {...ARM} />
                <circle cx="55" cy="155" r="8.5" fill={C.ink} />
              </g>
            ) : mood === "greeting" ? (
              <g className="simply-arm-wave" key="wave">
                {/* gomito verso l'esterno, mano in alto */}
                <path d="M44 128Q20 126 25 99" {...ARM} />
                <WaveHand x={25} y={90} />
              </g>
            ) : (
              <g key="rest-l" className="simply-rest-l">
                <path d="M44 128Q31 142 38 155" {...ARM} />
                <circle cx="40" cy="158" r="8.5" fill={C.ink} />
              </g>
            )}

            {/* Braccio destro + oggetto */}
            {pt?.side === "r" ? (
              <PointingArm key="point-r" side="r" deg={pt.deg} />
            ) : coverR ? (
              <CoverArm side="r" />
            ) : (
            <g className={`${pose.cls} ${!activeProp ? "simply-rest-r" : ""}`} key={`r-${activeProp || "rest"}`}>
              <g className={activeProp === "magnifier" ? "simply-scan" : undefined}>
                {activeProp && PROP_POSE[activeProp] === "hold" ? (
                  <>
                    {/* oggetto tenuto: la mano sta dietro, l'oggetto davanti e il pollice sopra per la presa */}
                    <path d={pose.d} {...ARM} />
                    <circle cx={hand[0]} cy={hand[1]} r="8.5" fill={C.ink} />
                    <PropArt prop={activeProp} />
                    <ellipse cx={hand[0] - 6} cy={hand[1] - 6} rx="3.6" ry="5.2" transform={`rotate(-30 ${hand[0] - 6} ${hand[1] - 6})`} fill={C.ink} />
                  </>
                ) : (
                  <>
                    <PropArt prop={activeProp} />
                    <path d={pose.d} {...ARM} />
                    {pose.hand && <circle cx={pose.hand[0]} cy={pose.hand[1]} r="8.5" fill={C.ink} />}
                  </>
                )}
              </g>
            </g>
            )}

            {mood === "thinking" && (
              <g fill={C.purpleLight}>
                <circle className="simply-dot" cx="120" cy="32" r="4" />
                <circle className="simply-dot" cx="133" cy="25" r="4" />
                <circle className="simply-dot" cx="146" cy="18" r="4" />
              </g>
            )}

            {mood === "greeting" && (
              <g className="simply-prop" stroke={C.coral} strokeWidth="4" strokeLinecap="round" style={{ transformOrigin: "20px 80px" }}>
                <path d="M3 84l8 4M8 69l5 8M24 62l0 9" />
              </g>
            )}
          </g>
            {/* Seduto: gambe distese verso di noi, si vedono le suole */}
            {sitting && (
              <g className="simply-soles">
                {[78, 122].map((x) => (
                  <g key={x}>
                    <ellipse cx={x} cy="194" rx="12.5" ry="10" fill={C.ink} />
                    <ellipse cx={x} cy="195" rx="7.5" ry="6" fill="#5A5A64" />
                  </g>
                ))}
              </g>
            )}
          </g></g>
        </svg>
      </button>
      </div>
      </div>
      </div>
  );

  if (usePortal) {
    return (
      <div ref={wrapRef} className="simply-anchor" style={{ width: size, height: svgH, display: "inline-block", position: "relative", lineHeight: 0 }}>
        {createPortal(
          <div className={rootCls} style={{ position: "fixed", left: 0, top: 0, width: 0, height: 0, zIndex }}>{stageEl}</div>,
          portalTarget ?? document.body,
        )}
      </div>
    );
  }
  return (
    <div className={rootCls} ref={wrapRef} style={{ width: size, height: svgH }}>
      {stageEl}
    </div>
  );
}
