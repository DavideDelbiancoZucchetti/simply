import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { CSSProperties } from "react";
import type { ChatEventName, ChatMessage, ChatSendPayload, HomeRect } from "../types";
import { clamp, vpSize } from "../utils/geometry";
import { useInjectStyles } from "../hooks/useInjectStyles";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { useChatComposer } from "./useChatComposer";
import { Icon } from "./icons";
import { fmtSize, fmtTime } from "./format";
import { CHAT_CSS, CHAT_STYLE_ID } from "./styles";

export interface SimplyChatPanelProps {
  open: boolean;
  onClose?: () => void;
  messages?: ChatMessage[];
  onSend?: (payload: ChatSendPayload) => void;
  onTyping?: (typing: boolean) => void;
  /** Simply sta lavorando (pensa o streamma). */
  busy?: boolean;
  title?: string;
  placeholder?: string;
  /** Tipi di file accettati dalla graffetta. */
  accept?: string;
  maxAudioSeconds?: number;
  /** Controllato: compatta (nuvoletta) o estesa. */
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  /** Si espande da sola quando arriva la risposta (default true). */
  expandOnReply?: boolean;
  /** ms senza interazioni prima che la nuvoletta si richiuda (null = mai). Default 15000. */
  autoCloseAfter?: number | null;
  /** Si richiude da sola anche la chat estesa (default false). */
  autoCloseExpanded?: boolean;
  /** Rettangolo di Simply (da onHomeChange): il pannello si apre nel posto migliore. */
  anchorRect?: HomeRect | null;
  blurOnSend?: boolean | "touch";
  /** true/false quando inizia/finisce la registrazione vocale (es. dare il microfono a Simply). */
  onRecordingChange?: (recording: boolean) => void;
  /** Se il microfono non è disponibile (anteprime, iframe) simula la registrazione. */
  simulateIfUnavailable?: boolean;
  /** Dettatura nel campo: "browser" (Web Speech API) o una funzione che trascrive l'audio (es. backend). */
  dictation?: false | "browser" | ((audio: Blob) => Promise<string>);
  dictationLang?: string;
  /** Eventi per analytics. */
  onEvent?: (name: ChatEventName, data?: Record<string, unknown>) => void;
  /**
   * Cosa fa il microfono:
   * - "both" (default): tocco = detta il testo, tieni premuto = messaggio vocale (con suggerimento le prime volte)
   * - "menu": il tocco apre la scelta tra le due
   * - "dictation" / "voice": solo una delle due
   */
  voiceInput?: "both" | "menu" | "dictation" | "voice";
  /** Posizione manuale (usata se non c'è anchorRect). */
  style?: CSSProperties & Record<string, string | number | undefined>;
}

/**
 * Pannello chat predefinito, nello stile di Simply: nuvoletta compatta che si espande in chat completa.
 * È un esempio costruito su useChatComposer: se la tua app ha una sua chat, usa direttamente l'hook
 * (o niente: SimplyCompanion non dipende dalla chat).
 */
export function SimplyChatPanel({
  open,
  onClose,
  messages = [],
  onSend,
  onTyping,
  busy = false,
  title = "Simply",
  placeholder = "Scrivi a Simply…",
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt",
  maxAudioSeconds = 120,
  expanded: expandedProp,
  onExpandedChange,
  expandOnReply = true,
  autoCloseAfter = 15000,
  autoCloseExpanded = false,
  anchorRect,
  blurOnSend = "touch",
  onRecordingChange,
  simulateIfUnavailable = false,
  dictation = false,
  dictationLang,
  onEvent,
  voiceInput = "both",
  style: styleProp,
}: SimplyChatPanelProps) {
  useInjectStyles(CHAT_STYLE_ID, CHAT_CSS);
  const keyboardInset = useKeyboardInset();
  const [expandedState, setExpandedState] = useState(false);
  const expanded = expandedProp ?? expandedState;
  const setExpanded = (v: boolean) => { setExpandedState(v); onExpandedChange?.(v); onEvent?.(v ? "expand" : "collapse"); };
  const listRef = useRef<HTMLDivElement>(null);

  const c = useChatComposer({
    open, onSend, onTyping, onClose, busy, maxAudioSeconds, autoCloseAfter, blurOnSend, onRecordingChange, simulateIfUnavailable, dictation, dictationLang, onEvent,
    autoCloseEnabled: !expanded || autoCloseExpanded,
    activityKey: `${messages.length}-${expanded}`,
  });

  // All'apertura il focus va nel campo (non su touch, per non aprire la tastiera)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(c.focus, 60);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { const l = listRef.current; if (l) l.scrollTop = l.scrollHeight; }, [messages, open, expanded]);

  // Quando arriva una nuova risposta (inizio dello streaming) la nuvoletta diventa chat completa
  const lastCount = useRef(messages.length);
  useEffect(() => {
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    if (open && expandOnReply && grew && messages[messages.length - 1]?.role === "assistant" && !expanded) setExpanded(true);
  }, [messages, open, expandOnReply, expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chiudendo, alla prossima apertura riparte compatta
  useEffect(() => { if (!open && expandedProp === undefined) setExpandedState(false); }, [open, expandedProp]);

  // Un solo microfono. Con "menu" il tocco apre una scelta esplicita: "Detta il testo" o "Messaggio vocale".
  // Se c'è una sola possibilità (es. dettatura non supportata o non consentita) parte direttamente quella.
  const [micMenu, setMicMenu] = useState(false);
  const micWrapRef = useRef<HTMLDivElement>(null);
  const canDictate = c.dictationSupported && voiceInput !== "voice";
  const canVoice = voiceInput !== "dictation";
  const both = canDictate && canVoice;

  // "both": tocco = dettatura, tieni premuto = vocale. Mentre tieni premuto l'anello si riempie (si vede che succede
  // qualcosa) e il vocale parte DURANTE la pressione, non al rilascio.
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const guardUntil = useRef(0);
  const guarded = (fn: () => void) => () => { if (Date.now() < guardUntil.current) return; fn(); };
  const HOLD_MS = 420;
  const micDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (voiceInput !== "both" || !both || c.dictating) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    heldRef.current = false;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      heldRef.current = true; setHolding(false); hideHint();
      // su touch, al rilascio il browser genera un "click" sul bottone che ora c'è sotto il dito (lo stop): va ignorato
      guardUntil.current = Date.now() + 700;
      c.startRecording();
    }, HOLD_MS);
  };
  const micUp = () => { setHolding(false); if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; } };

  // Suggerimento le prime volte (max 3): "Tocca per dettare · tieni premuto per un vocale"
  const HINT_KEY = "simply-mic-hint";
  const [hint, setHint] = useState(false);
  const hideHint = () => setHint(false);
  useEffect(() => {
    if (!open || voiceInput !== "both" || !both) return;
    let n = 0;
    try { n = Number(window.localStorage.getItem(HINT_KEY) || 0); } catch { /* storage non disponibile */ }
    if (n >= 3) return;
    try { window.localStorage.setItem(HINT_KEY, String(n + 1)); } catch { /* ignore */ }
    const t1 = setTimeout(() => setHint(true), 500);
    const t2 = setTimeout(() => setHint(false), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [open, voiceInput, both]);

  const micClick = () => {
    hideHint();
    if (heldRef.current) { heldRef.current = false; return; } // era una pressione lunga: il vocale è già partito
    if (c.dictating) { c.stopDictation(); return; }
    if (both && voiceInput === "menu") { setMicMenu((v) => !v); return; }
    if (canDictate) c.startDictation(); else c.startRecording();
  };
  const pick = (what: "dictation" | "voice") => { setMicMenu(false); if (what === "dictation") c.startDictation(); else c.startRecording(); };
  useEffect(() => {
    if (!micMenu) return;
    const close = (e: Event) => { if (!micWrapRef.current?.contains(e.target as Node)) setMicMenu(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setMicMenu(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc, true);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc, true); };
  }, [micMenu]);
  useEffect(() => { if (!open || c.hasContent || busy) setMicMenu(false); }, [open, c.hasContent, busy]);

  if (!open) return null;

  // Posizione: ancorata a Simply (sopra o sotto, dove c'è più spazio) oppure manuale + tastiera
  let style: CSSProperties & Record<string, string | number | undefined> = { ...styleProp };
  let placeCls = "";
  if (anchorRect && typeof window !== "undefined") {
    const { w: vw, h: vh } = vpSize();
    const layoutH = Math.min(window.innerHeight, document.documentElement.clientHeight || Infinity);
    const a = anchorRect;
    const lift = keyboardInset ? Math.max(0, a.top + a.height - vh + 8) : 0;
    const aTop = a.top - lift, aBottom = aTop + a.height;
    const pw = Math.min(expanded ? 400 : 340, vw - 24);
    const gap = 12;
    const spaceAbove = aTop - gap - 8, spaceBelow = vh - aBottom - gap - 8;
    const above = spaceAbove >= (expanded ? 420 : 90) || spaceAbove >= spaceBelow;
    const cx = a.left + a.width / 2;
    const left = clamp(cx > vw / 2 ? cx - pw + 46 : cx - 46, 12, Math.max(12, vw - pw - 12));
    const tailX = clamp(cx - left, 26, pw - 26);
    const avail = Math.floor(above ? spaceAbove : spaceBelow);
    style = {
      ...style,
      left, right: "auto", width: pw, "--simply-tail-x": `${tailX}px`,
      ...(above ? { bottom: layoutH - aTop + gap, top: "auto" } : { top: aBottom + gap, bottom: "auto" }),
      ...(expanded ? { height: Math.max(200, Math.min(560, avail)) } : {}),
      transformOrigin: `${tailX}px ${above ? "100%" : "0%"}`,
    };
    placeCls = `anchored ${above ? "above" : "below"}`;
  } else if (keyboardInset) {
    const baseBottom = typeof styleProp?.bottom === "number" ? styleProp.bottom : 16;
    const vvH = window.visualViewport?.height;
    style = { ...style, bottom: baseBottom + keyboardInset, ...(expanded && vvH ? { height: Math.max(220, Math.min(560, vvH - baseBottom - 16)) } : {}) };
  }

  const tray = (c.files.length > 0 || c.audio) && (
    <div className="simply-chat-tray">
      {c.files.map((f) => (
        <div key={f.id} className="simply-chip">
          {f.isImage && f.url ? <img src={f.url} alt="" /> : <span aria-hidden="true">📄</span>}
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span>{f.file.name}</span><small>{fmtSize(f.file.size)}</small>
          </div>
          <button className="simply-chip-x" onClick={() => c.removeFile(f.id)} aria-label={`Rimuovi ${f.file.name}`}>×</button>
        </div>
      ))}
      {c.audio && (
        <div className="simply-chip">
          <audio controls src={c.audio.url} />
          <small>{fmtTime(c.audio.seconds)}</small>
          <button className="simply-chip-x" onClick={c.clearAudio} aria-label="Rimuovi il vocale">×</button>
        </div>
      )}
    </div>
  );

  const input = (
    <div className="simply-input">
      {c.recording != null ? (
        <>
          <button className="simply-ico danger" onClick={guarded(() => c.stopRecording(true))} aria-label="Annulla registrazione"><Icon name="trash" /></button>
          <div className="simply-rec" aria-live="polite"><i />{fmtTime(c.recording)}</div>
          <button className="simply-ico primary" onClick={guarded(() => c.stopRecording(false))} aria-label="Fine registrazione"><Icon name="stop" /></button>
        </>
      ) : (
        <>
          <button className="simply-ico" onClick={c.openFilePicker} aria-label="Allega immagini o file"><Icon name="clip" /></button>
          <input {...c.fileInputProps} accept={accept} />
          <textarea {...c.textareaProps} aria-label="Messaggio"
            placeholder={c.transcribing ? "Trascrivo…" : c.dictating ? "Ti ascolto…" : busy ? "Simply ci sta pensando…" : placeholder} />
          {c.hasContent && !c.dictating ? (
            <button className="simply-ico primary" onClick={c.send} disabled={!c.canSend} aria-label="Invia"><Icon name="send" /></button>
          ) : (
            <div className="simply-mic-wrap" ref={micWrapRef}>
              {micMenu && (
                <div className="simply-mic-menu" role="menu" aria-label="Usa il microfono per">
                  <button role="menuitem" onClick={() => pick("dictation")}>
                    <Icon name="dictate" /><span><strong>Detta il testo</strong><small>parli e scrivo io nel campo</small></span>
                  </button>
                  <button role="menuitem" onClick={() => pick("voice")}>
                    <Icon name="wave" /><span><strong>Messaggio vocale</strong><small>registro e invio l'audio</small></span>
                  </button>
                </div>
              )}
              {hint && <div className="simply-mic-hint" role="status">Tocca per dettare · tieni premuto per un vocale</div>}
              <button className={`simply-ico simply-mic ${c.dictating ? "primary listening" : micMenu ? "active" : ""} ${holding ? "holding" : ""}`}
                style={{ ["--hold-ms" as string]: `${HOLD_MS}ms` }}
                onClick={micClick} onPointerDown={micDown} onPointerUp={micUp} onPointerCancel={micUp} onContextMenu={(e) => e.preventDefault()}
                disabled={busy || c.transcribing} aria-pressed={c.dictating} aria-expanded={voiceInput === "menu" && both ? micMenu : undefined}
                aria-haspopup={voiceInput === "menu" && both ? "menu" : undefined}
                aria-label={c.dictating ? "Ferma la dettatura" : both && voiceInput === "menu" ? "Usa il microfono" : both ? "Detta il messaggio (tieni premuto per un vocale)" : canDictate ? "Detta il messaggio" : "Registra un messaggio vocale"}
                title={c.dictating ? "Ferma la dettatura" : both && voiceInput === "menu" ? "Detta il testo o registra un vocale" : both ? "Tocca per dettare, tieni premuto per un vocale" : canDictate ? "Detta il messaggio" : "Registra un vocale"}>
                <Icon name="mic" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const err = c.error && <div className="simply-chat-err" role="alert">{c.error}</div>;
  const drop = c.dragging && <div className="simply-chat-drop">Rilascia qui i file</div>;

  if (!expanded) {
    return (
      <div className={`simply-chat compact ${placeCls} ${c.fading ? "fading" : ""}`} role="dialog" aria-label={`Scrivi a ${title}`} style={style} {...c.containerProps}>
        {err}
        {tray}
        <div className="simply-chat-bottom">
          {input}
          <button className="simply-hbtn" onClick={() => setExpanded(true)} aria-label="Apri la chat completa" title="Apri la chat completa">
            <Icon name="expand" />
          </button>
        </div>
        {drop}
      </div>
    );
  }

  return (
    <div className={`simply-chat full ${placeCls} ${c.fading ? "fading" : ""}`} role="dialog" aria-label={`Chat con ${title}`} style={style} {...c.containerProps}>
      <div className="simply-chat-head">
        <strong>{title}</strong>
        <span className="simply-chat-sub">{busy ? "sta scrivendo…" : "online"}</span>
        <button className="simply-hbtn" onClick={() => setExpanded(false)} aria-label="Riduci a nuvoletta" title="Riduci"><Icon name="collapse" /></button>
        <button className="simply-hbtn" onClick={onClose} aria-label="Chiudi la chat" title="Chiudi"><Icon name="close" /></button>
      </div>

      <div className="simply-chat-list" ref={listRef}>
        {messages.length === 0 && (
          <p className="simply-chat-empty">Ciao! Scrivimi, mandami una foto o un file, oppure registra un messaggio vocale.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`simply-msg ${m.role === "user" ? "me" : "bot"}`}>
            {!!m.attachments?.length && (
              <div className="simply-msg-att">
                {m.attachments.map((a) => (a.isImage && a.url
                  ? <img key={a.id} src={a.url} alt={a.file.name} />
                  : <span key={a.id} className="simply-file">📄 {a.file.name}</span>))}
              </div>
            )}
            {m.audio && <audio controls src={m.audio.url} />}
            {!!m.steps?.length && (
              <div className="simply-steps">
                {m.steps.map((st, j) => (
                  <div key={j} className={`simply-step ${st.status}`}>
                    <span aria-hidden="true">{st.icon || "⚙️"}</span>
                    <span className="lbl">{st.label}{st.detail && <small>{st.detail}</small>}</span>
                    <span className="st" aria-label={st.status}>
                      {st.status === "running" ? <i className="simply-spin" /> : st.status === "error" ? "!" : "✓"}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {m.text ? <div>{m.text}</div> : (!m.attachments?.length && !m.audio && !m.steps?.length && <div>…</div>)}
          </div>
        ))}
      </div>

      {tray}
      {err}
      <div className="simply-chat-bottom">{input}</div>
      {drop}
    </div>
  );
}
