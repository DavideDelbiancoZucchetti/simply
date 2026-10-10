import { useEffect, useMemo, useReducer, useRef } from "react";
import type { ReactNode } from "react";
import type { Mood, PointTarget, PropName, ToolStep } from "../types";
import type { SimplyCompanionProps } from "../companion/SimplyCompanion";
import { propFromTool } from "../utils/mapping";

/** Una reazione di Simply: espressione, oggetto, cosa dire, cosa indicare. */
export interface SimplyReaction {
  mood?: Mood;
  prop?: PropName | "none";
  say?: ReactNode;
  pointTo?: PointTarget;
  /** Quanto dura il gesto (mood/prop). null = finché non arriva altro. Default 4000. */
  durationMs?: number | null;
  /** Se Simply è nascosto: "badge" (default) aggiunge un badge e rimanda la reazione, "show" lo fa riapparire. */
  whenHidden?: "badge" | "show";
}

/**
 * Eventi che il "regista" capisce. Non dipendono dal trasporto: arrivano dall'AI SDK,
 * da uno stream SSE/WebSocket di un server C#, da eventi dell'app…
 */
export type SimplyDirectorEvent =
  | { type: "typing"; value: boolean }
  | { type: "request"; phase: "start" | "stream" | "end" | "error"; error?: string }
  | { type: "tool"; phase: "start"; id: string; name: string; label?: string; icon?: string }
  | { type: "tool"; phase: "end"; id: string; ok?: boolean; error?: string }
  | ({ type: "ui" } & SimplyReaction)
  | { type: "app"; name: string; payload?: unknown }
  | { type: "say"; text: ReactNode; durationMs?: number; priority?: "normal" | "high" }
  | { type: "speaking"; value: boolean }
  /** Toglie il gesto corrente (mood/oggetto impostati da "ui" o "app"). */
  | { type: "clearGesture" }
  /** Smette di indicare, chiude il fumetto e svuota la coda (come il tocco su Simply). */
  | { type: "stop" }
  | { type: "reset" };

export interface SimplyDirectorOptions {
  /** Come reagire agli eventi dell'app: { "reservation.created": (p) => ({ mood: "news", prop: "key", say: … }) } */
  appEvents?: Record<string, (payload: any) => SimplyReaction | null | undefined>;
  /** Oggetto in mano per un tool (default propFromTool). */
  toolProp?: (name: string) => PropName | null;
  /** Etichetta di un passo (default il nome del tool). */
  toolLabel?: (name: string) => string;
  /** Icona di un passo. */
  toolIcon?: (name: string, prop: PropName | null) => string;
  /** Racconta i passi nel fumetto (utile a chat chiusa). */
  narrate?: boolean;
  /** Testo del fumetto in caso di errore della richiesta. */
  errorText?: string;
  /** Durata dei lampi "success"/"error" (default 1400 ms). */
  flashMs?: number;
  /** Durata di un messaggio del fumetto (default in base alla lunghezza). */
  messageMs?: (text: ReactNode) => number;
}

type Msg = { text: ReactNode; ms: number; token: number; withPoint?: boolean };
interface State {
  typing: boolean;
  request: "idle" | "thinking" | "streaming";
  tools: { id: string; name: string; prop: PropName | null }[];
  steps: (ToolStep & { id?: string })[];
  flash: { mood: Mood; token: number } | null;
  gesture: (SimplyReaction & { token: number }) | null;
  speaking: boolean;
  queue: Msg[];
  current: Msg | null;
  pointAt: PointTarget;
  badge: number;
  hidden: boolean;
  pending: SimplyReaction[];
  seq: number;
}
type Internal =
  | SimplyDirectorEvent
  | { type: "_flashEnd"; token: number }
  | { type: "_gestureEnd"; token: number }
  | { type: "_msgEnd"; token: number }
  | { type: "_dismiss" }
  | { type: "_pointEnd" }
  | { type: "_visibility"; hidden: boolean }
  | { type: "_badge" };

const INITIAL: State = {
  typing: false, request: "idle", tools: [], steps: [], flash: null, gesture: null, speaking: false,
  queue: [], current: null, pointAt: null, badge: 0, hidden: false, pending: [], seq: 0,
};

const textLen = (t: ReactNode) => (typeof t === "string" ? t.length : 40);
const defaultMessageMs = (t: ReactNode) => Math.min(7000, 1800 + textLen(t) * 45);

/**
 * Il "regista" di Simply: riceve eventi (stream, tool, gesti decisi dall'LLM, eventi dell'app),
 * risolve le priorità e restituisce le props pronte per <SimplyCompanion />.
 *
 *   const director = useSimplyDirector({ appEvents });
 *   director.dispatch({ type: "request", phase: "start" });
 *   <SimplyCompanion {...director.companion} />
 */
export function useSimplyDirector(options: SimplyDirectorOptions = {}) {
  const opts = useRef(options);
  opts.current = options;

  const reducer = (s: State, e: Internal): State => {
    const o = opts.current;
    const seq = s.seq + 1;
    const msgMs = (t: ReactNode, ms?: number) => ms ?? (o.messageMs ?? defaultMessageMs)(t);
    const enqueue = (st: State, text: ReactNode, ms?: number, high = false, withPoint = false): State => {
      const m: Msg = { text, ms: msgMs(text, ms), token: seq, withPoint };
      if (!st.current) return { ...st, current: m };
      if (high) return { ...st, current: m, queue: [st.current, ...st.queue] };
      return { ...st, queue: [...st.queue, m] };
    };
    const applyReaction = (st: State, r: SimplyReaction): State => {
      let next: State = { ...st, gesture: r.mood || r.prop ? { ...r, token: seq } : st.gesture };
      if (r.pointTo) next = { ...next, pointAt: r.pointTo };
      if (r.say) next = enqueue(next, r.say, undefined, false, !!r.pointTo);
      return next;
    };

    switch (e.type) {
      case "typing": return { ...s, typing: e.value };
      case "speaking": return { ...s, speaking: e.value };
      case "request":
        if (e.phase === "start") return { ...s, seq, request: "thinking", tools: [], steps: [], flash: null, gesture: null, pointAt: null };
        // Il "fatto!" (OK) arriva una volta sola: quando, finiti i tool, parte la risposta (o finisce la richiesta)
        if (e.phase === "stream") {
          const celebrate = s.request !== "streaming" && !s.tools.length && s.steps.some((st) => st.status === "done") && s.flash?.mood !== "error";
          return { ...s, seq, request: "streaming", flash: celebrate ? { mood: "success", token: seq } : s.flash };
        }
        if (e.phase === "end") {
          const celebrate = s.request === "thinking" && s.steps.some((st) => st.status === "done") && s.flash?.mood !== "error";
          return { ...s, seq, request: "idle", tools: [], flash: celebrate ? { mood: "success", token: seq } : s.flash };
        }
        return enqueue({ ...s, seq, request: "idle", tools: [], flash: { mood: "error", token: seq } }, o.errorText ?? "Ops, qualcosa è andato storto.", undefined, true);
      case "tool": {
        if (e.phase === "start") {
          const prop = (o.toolProp ?? propFromTool)(e.name);
          const label = e.label ?? o.toolLabel?.(e.name) ?? e.name;
          const icon = e.icon ?? o.toolIcon?.(e.name, prop);
          let next: State = {
            ...s, seq, flash: s.flash?.mood === "success" ? null : s.flash,
            tools: [...s.tools, { id: e.id, name: e.name, prop }],
            steps: [...s.steps, { id: e.id, label, icon, status: "running" }],
          };
          if (o.narrate) next = enqueue(next, `${label}…`, undefined, true);
          return next;
        }
        const tools = s.tools.filter((t) => t.id !== e.id);
        const failed = e.ok === false || !!e.error;
        const steps = s.steps.map((st) => (st.id === e.id ? { ...st, status: failed ? "error" as const : "done" as const, detail: e.error } : st));
        let next: State = { ...s, seq, tools, steps };
        if (failed) {
          next = { ...next, flash: { mood: "error", token: seq } };
          if (o.narrate && e.error) next = enqueue(next, `Ops: ${e.error}`, undefined, true);
        }
        return next;
      }
      case "ui": {
        const { type: _t, ...r } = e;
        return applyReaction({ ...s, seq }, r);
      }
      case "app": {
        const r = o.appEvents?.[e.name]?.(e.payload);
        if (!r) return s;
        if (s.hidden && (r.whenHidden ?? "badge") === "badge") return { ...s, badge: s.badge + 1, pending: [...s.pending, r] };
        return applyReaction({ ...s, seq }, r);
      }
      case "say": return enqueue({ ...s, seq }, e.text, e.durationMs, e.priority === "high");
      case "reset": return { ...INITIAL, hidden: s.hidden, seq };
      case "clearGesture": return { ...s, gesture: null };
      case "stop": return { ...s, gesture: null, pointAt: null, current: null, queue: [] };
      case "_flashEnd": return s.flash?.token === e.token ? { ...s, flash: null } : s;
      case "_gestureEnd": return s.gesture?.token === e.token ? { ...s, gesture: null } : s;
      case "_msgEnd": {
        if (s.current?.token !== e.token) return s;
        const [head, ...rest] = s.queue;
        return { ...s, current: head ? { ...head, token: seq } : null, queue: rest, seq };
      }
      case "_dismiss": return { ...s, gesture: null, pointAt: null, current: null, queue: [] };
      case "_pointEnd": return { ...s, pointAt: null, current: s.current?.withPoint ? null : s.current };
      case "_visibility": {
        if (e.hidden) return { ...s, hidden: true };
        // Torna visibile: via il badge e si recuperano le reazioni rimandate
        let next: State = { ...s, hidden: false, badge: 0, pending: [], seq };
        for (const r of s.pending) next = applyReaction(next, r);
        return next;
      }
      case "_badge": {
        let next: State = { ...s, badge: 0, pending: [], seq };
        for (const r of s.pending) next = applyReaction(next, r);
        return next;
      }
    }
  };

  const [s, dispatch] = useReducer(reducer, INITIAL);

  // Timer: lampi, gesti a tempo, scorrimento della coda dei messaggi
  useEffect(() => {
    if (!s.flash) return;
    const t = setTimeout(() => dispatch({ type: "_flashEnd", token: s.flash!.token }), options.flashMs ?? 1400);
    return () => clearTimeout(t);
  }, [s.flash?.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const g = s.gesture;
    const ms = g?.durationMs === undefined ? 4000 : g.durationMs;
    if (!g || ms == null) return;
    const t = setTimeout(() => dispatch({ type: "_gestureEnd", token: g.token }), ms);
    return () => clearTimeout(t);
  }, [s.gesture?.token]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const c = s.current;
    if (!c) return;
    const t = setTimeout(() => dispatch({ type: "_msgEnd", token: c.token }), c.ms);
    return () => clearTimeout(t);
  }, [s.current?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = s.request !== "idle" || s.tools.length > 0;
  const steps = useMemo(() => s.steps.map(({ id: _id, ...st }) => st) as ToolStep[], [s.steps]);

  const companion = useMemo<Partial<SimplyCompanionProps>>(() => {
    const runningTool = s.tools[s.tools.length - 1];
    const flash = s.flash;
    // Priorità: errore > tool in corso > successo > streaming > richiesta > voce > gesto > scrittura > riposo
    let mood: Mood = "idle";
    let prop: PropName | "none" | undefined;
    if (flash?.mood === "error") mood = "error";
    else if (runningTool) { mood = "thinking"; prop = runningTool.prop ?? undefined; }
    else if (flash?.mood === "success") mood = "success";
    else if (s.request === "streaming" || s.speaking) mood = "talking";
    else if (s.request === "thinking") mood = "thinking";
    else if (s.gesture) { mood = s.gesture.mood ?? "idle"; prop = s.gesture.prop; }
    else if (s.typing) mood = "listening";
    return {
      mood,
      prop,
      pointAt: s.pointAt,
      message: s.current?.text,
      badge: s.badge || null,
      interruptible: !busy,
      onDismiss: () => dispatch({ type: "_dismiss" }),
      onPointEnd: () => dispatch({ type: "_pointEnd" }),
      onVisibilityChange: (hidden: boolean) => dispatch({ type: "_visibility", hidden }),
      onBadgeClick: () => dispatch({ type: "_badge" }),
    };
  }, [s, busy]);

  return {
    /** Props pronte per <SimplyCompanion {...companion} />. */
    companion,
    /** Invia un evento al regista. */
    dispatch: dispatch as (e: SimplyDirectorEvent) => void,
    /** Passi dei tool della richiesta corrente (per la chat). */
    steps,
    /** C'è una richiesta in corso. */
    busy,
    badge: s.badge,
    hidden: s.hidden,
  };
}

export type SimplyDirector = ReturnType<typeof useSimplyDirector>;
