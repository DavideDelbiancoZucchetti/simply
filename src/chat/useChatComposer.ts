import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent, DragEvent, KeyboardEvent } from "react";
import type { ChatAttachment, ChatAudio, ChatEventName, ChatSendPayload } from "../types";
import { isTouchDevice } from "../utils/geometry";
import { silentWav } from "./silentWav";

export interface UseChatComposerOptions {
  /** Il compositore è visibile (gestisce typing, chiusura per inattività, focus). */
  open: boolean;
  /** Invio: testo, file da caricare, anteprime e vocale. */
  onSend?: (payload: ChatSendPayload) => void;
  /** true mentre l'utente sta scrivendo (per il mood "listening" di Simply). */
  onTyping?: (typing: boolean) => void;
  /** Richiesta di chiusura (Esc o inattività). */
  onClose?: () => void;
  /** Simply sta lavorando: non si invia e non si chiude da solo. */
  busy?: boolean;
  /** Durata massima del vocale in secondi (default 120). */
  maxAudioSeconds?: number;
  /** ms senza interazioni prima di chiedere la chiusura (null = mai). Default 15000. */
  autoCloseAfter?: number | null;
  /** Se false la chiusura per inattività è sospesa (es. chat estesa). Default true. */
  autoCloseEnabled?: boolean;
  /** Dopo l'invio toglie il focus dal campo (chiude la tastiera): "touch" = solo su touch. */
  blurOnSend?: boolean | "touch";
  /** Valore che, cambiando, conta come attività (es. numero di messaggi). */
  activityKey?: unknown;
  /** true/false quando inizia/finisce la registrazione (es. dare il microfono a Simply). */
  onRecordingChange?: (recording: boolean) => void;
  /** Se il microfono non è disponibile (anteprime, iframe senza permessi) simula la registrazione. */
  simulateIfUnavailable?: boolean;
  /**
   * Dettatura nel campo di testo:
   * - "browser": Web Speech API (gratis, testo in tempo reale; Chrome/Edge/Safari, l'audio va al servizio del browser)
   * - (audio) => Promise<string>: registra e manda l'audio a una tua funzione (es. backend C# con Azure Speech o Whisper)
   */
  dictation?: false | "browser" | ((audio: Blob) => Promise<string>);
  /** Lingua della dettatura (default "it-IT"). */
  dictationLang?: string;
  /** Eventi per analytics. */
  onEvent?: (name: ChatEventName, data?: Record<string, unknown>) => void;
}

/**
 * Logica "headless" del compositore di chat: testo, allegati (file, incolla, trascina),
 * messaggio vocale, stato "sta scrivendo", chiusura per inattività e tastiera mobile.
 * Usala per costruire la tua UI; SimplyChatPanel è solo un esempio che la usa.
 */
export function useChatComposer({
  open,
  onSend,
  onTyping,
  onClose,
  busy = false,
  maxAudioSeconds = 120,
  autoCloseAfter = 15000,
  autoCloseEnabled = true,
  blurOnSend = "touch",
  activityKey,
  onRecordingChange,
  simulateIfUnavailable = false,
  dictation = false,
  dictationLang = "it-IT",
  onEvent,
}: UseChatComposerOptions) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const emit = (name: ChatEventName, data?: Record<string, unknown>) => onEventRef.current?.(name, data);
  const [text, setTextState] = useState("");
  const [files, setFiles] = useState<ChatAttachment[]>([]);
  const [audio, setAudio] = useState<ChatAudio | null>(null);
  const [recording, setRecording] = useState<number | null>(null); // secondi registrati, null = non registra
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fading, setFading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const secsRef = useRef(0);
  const cancelRef = useRef(false);
  const lastActRef = useRef(Date.now());

  const shouldBlur = () => blurOnSend === true || (blurOnSend === "touch" && isTouchDevice());
  const stopStream = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };

  // "Sta scrivendo" vale solo a compositore aperto: alla chiusura, al blur con campo vuoto
  // e allo smontaggio comunica sempre onTyping(false), così Simply non resta con la faccia d'ascolto.
  const typingRef = useRef(false);
  const onTypingRef = useRef(onTyping);
  onTypingRef.current = onTyping;
  const reportTyping = (v: boolean) => {
    if (typingRef.current === v && v) return;
    typingRef.current = v;
    onTypingRef.current?.(v);
  };
  useEffect(() => {
    if (!open && typingRef.current) { typingRef.current = false; onTypingRef.current?.(false); }
    if (!open) setTextState((t) => (t.trim() ? t : "")); // via gli spazi vuoti rimasti nel campo
  }, [open]);
  useEffect(() => () => {
    if (typingRef.current) onTypingRef.current?.(false);
    stopStream();
    clearInterval(timerRef.current);
  }, []);

  // Esc chiude
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Su touch, mentre Simply lavora il campo non deve tenere la tastiera aperta
  useEffect(() => {
    if (open && busy && shouldBlur() && document.activeElement === textareaRef.current && !text.trim()) textareaRef.current?.blur();
  }, [busy, open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Campo che cresce fino a 140px, poi scorre senza barra
  useEffect(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 140)}px`;
    t.style.overflowY = t.scrollHeight > 140 ? "auto" : "hidden";
  }, [text, open]);

  // Chiusura per inattività (mai con qualcosa in sospeso); negli ultimi 2,5 s `fading` = true
  const bump = () => { lastActRef.current = Date.now(); setFading(false); };
  useEffect(() => { lastActRef.current = Date.now(); setFading(false); }, [open, activityKey, busy, autoCloseEnabled]);
  useEffect(() => {
    if (!open || autoCloseAfter == null) return;
    const id = setInterval(() => {
      const pending = !!text.trim() || files.length > 0 || !!audio || recording != null || busy;
      if (pending || !autoCloseEnabled) { lastActRef.current = Date.now(); setFading(false); return; }
      const left = autoCloseAfter - (Date.now() - lastActRef.current);
      if (left <= 0) { setFading(false); emit("auto_close"); onClose?.(); }
      else setFading(left <= 2500);
    }, 250);
    return () => clearInterval(id);
  }, [open, autoCloseAfter, autoCloseEnabled, text, files, audio, recording, busy, onClose]);

  const setText = (v: string) => { setTextState(v); reportTyping(v.trim().length > 0); };

  const addFiles = (list: FileList | File[] | null | undefined) => {
    const arr: ChatAttachment[] = [...(list || [])].map((file) => {
      const isImage = file.type.startsWith("image/");
      return { id: Math.random().toString(36).slice(2), file, isImage, url: isImage ? URL.createObjectURL(file) : null };
    });
    if (arr.length) { setFiles((fs) => [...fs, ...arr]); emit("attach", { count: arr.length }); }
  };
  const removeFile = (id: string) => setFiles((fs) => {
    const f = fs.find((x) => x.id === id);
    if (f?.url) URL.revokeObjectURL(f.url);
    return fs.filter((x) => x.id !== id);
  });
  const clearAudio = () => setAudio((a) => { if (a?.url) URL.revokeObjectURL(a.url); return null; });

  // Registrazione simulata: stesso flusso (timer, annulla, stop) e alla fine un vocale muto da riascoltare
  const simRef = useRef(false);
  const [simulated, setSimulated] = useState(false);
  const startSimulated = (why: string) => {
    simRef.current = true;
    setSimulated(true);
    setError(`${why} Registrazione simulata.`);
    secsRef.current = 0;
    setRecording(0);
    timerRef.current = setInterval(() => {
      secsRef.current += 1;
      setRecording(secsRef.current);
      if (secsRef.current >= maxAudioSeconds) stopRecording(false);
    }, 1000);
  };
  const recActive = recording != null;
  const onRecRef = useRef(onRecordingChange);
  onRecRef.current = onRecordingChange;
  const firstRec = useRef(true);
  useEffect(() => {
    if (firstRec.current) { firstRec.current = false; return; }
    onRecRef.current?.(recActive);
    if (recActive) emit("record_start", { simulated: simRef.current });
  }, [recActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      if (simulateIfUnavailable) return startSimulated("Il microfono non è disponibile qui.");
      setError("Il microfono non è supportato da questo browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      cancelRef.current = false;
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stopStream();
        clearInterval(timerRef.current);
        setRecording(null);
        if (cancelRef.current || !chunksRef.current.length) return;
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        const seconds = Math.max(1, secsRef.current);
        setAudio((a) => { if (a?.url) URL.revokeObjectURL(a.url); return { blob, url: URL.createObjectURL(blob), seconds }; });
      };
      mr.start();
      secsRef.current = 0;
      setRecording(0);
      timerRef.current = setInterval(() => {
        secsRef.current += 1;
        setRecording(secsRef.current);
        if (secsRef.current >= maxAudioSeconds && mr.state === "recording") mr.stop();
      }, 1000);
    } catch {
      stopStream();
      if (simulateIfUnavailable) return startSimulated("Il microfono non è accessibile qui.");
      setError("Non riesco ad accedere al microfono: controlla i permessi del browser.");
    }
  };
  function stopRecording(cancel = false) {
    cancelRef.current = cancel;
    emit(cancel ? "record_cancel" : "record_stop", { seconds: secsRef.current });
    if (simRef.current) {
      simRef.current = false;
      setSimulated(false);
      clearInterval(timerRef.current);
      setRecording(null);
      setError("");
      if (cancel) return;
      const seconds = Math.max(1, secsRef.current);
      const blob = silentWav(seconds);
      setAudio((a) => { if (a?.url) URL.revokeObjectURL(a.url); return { blob, url: URL.createObjectURL(blob), seconds }; });
      return;
    }
    if (mrRef.current?.state === "recording") mrRef.current.stop();
  }

  // ---------- Dettatura ----------
  type Recognition = {
    lang: string; continuous: boolean; interimResults: boolean;
    onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
    onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
    start: () => void; stop: () => void;
  };
  const SR: (new () => Recognition) | undefined = typeof window !== "undefined"
    ? ((window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition)
    : undefined;
  const [dictationBlocked, setDictationBlocked] = useState(false);
  const dictationSupported = !dictationBlocked && (dictation === "browser"
    ? !!SR
    : typeof dictation === "function" && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined");
  const [dictating, setDictating] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recogRef = useRef<Recognition | null>(null);
  const dictRecRef = useRef<{ mr: MediaRecorder; stream: MediaStream; chunks: Blob[] } | null>(null);

  const startDictation = async () => {
    if (!dictationSupported || dictating) return;
    setError("");
    const base = text.trim() ? `${text.trim()} ` : "";
    if (dictation === "browser" && SR) {
      const r = new SR();
      r.lang = dictationLang; r.continuous = true; r.interimResults = true;
      let finalText = "";
      r.onresult = (ev) => {
        let interim = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          if (res.isFinal) finalText += res[0].transcript; else interim += res[0].transcript;
        }
        setText(base + finalText + interim);
      };
      r.onerror = (ev) => {
        // permesso negato o servizio assente: niente dettatura per questa sessione, il microfono passa ai vocali
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed" || ev.error === "audio-capture") setDictationBlocked(true);
        setError(ev.error === "not-allowed" ? "Dettatura non consentita qui: il microfono registrerà un vocale." : "Dettatura non disponibile qui.");
      };
      r.onend = () => { setDictating(false); recogRef.current = null; emit("dictation_stop"); };
      recogRef.current = r;
      try { r.start(); setDictating(true); emit("dictation_start", { provider: "browser" }); }
      catch { setDictationBlocked(true); setError("Dettatura non disponibile qui."); }
      return;
    }
    if (typeof dictation === "function") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr = new MediaRecorder(stream);
        const chunks: Blob[] = [];
        mr.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
        mr.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          setDictating(false);
          emit("dictation_stop");
          if (!chunks.length) return;
          setTranscribing(true);
          try {
            const out = await dictation(new Blob(chunks, { type: mr.mimeType || "audio/webm" }));
            if (out?.trim()) setText(base + out.trim());
          } catch { setError("Non sono riuscito a trascrivere l'audio."); }
          finally { setTranscribing(false); }
        };
        dictRecRef.current = { mr, stream, chunks };
        mr.start();
        setDictating(true);
        emit("dictation_start", { provider: "custom" });
      } catch { setError("Non riesco ad accedere al microfono: controlla i permessi del browser."); }
    }
  };
  const stopDictation = () => {
    recogRef.current?.stop();
    if (dictRecRef.current?.mr.state === "recording") dictRecRef.current.mr.stop();
    dictRecRef.current = null;
  };
  useEffect(() => () => { recogRef.current?.stop(); dictRecRef.current?.stream.getTracks().forEach((t) => t.stop()); }, []);

  const hasContent = !!text.trim() || files.length > 0 || !!audio;
  const canSend = !busy && recording == null && hasContent;
  const send = () => {
    if (!canSend) return;
    if (shouldBlur()) textareaRef.current?.blur(); // chiude la tastiera: così si vede la risposta in arrivo
    reportTyping(false); // prima di onSend, così il mood impostato in onSend non viene sovrascritto
    onSend?.({ text: text.trim(), files: files.map((f) => f.file), attachments: files, audio });
    emit("send", { chars: text.trim().length, files: files.length, audio: !!audio });
    setTextState(""); setFiles([]); setAudio(null); setError("");
  };

  /** Props pronte per il <textarea>. */
  const textareaProps = {
    ref: textareaRef,
    value: text,
    rows: 1,
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value),
    onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
    },
    onPaste: (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (e.clipboardData?.files?.length) { e.preventDefault(); addFiles(e.clipboardData.files); }
    },
    onBlur: () => { if (!text.trim()) reportTyping(false); },
  };

  /** Props per l'<input type="file"> nascosto (aprilo con openFilePicker). */
  const fileInputProps = {
    ref: fileInputRef,
    type: "file" as const,
    multiple: true,
    hidden: true,
    onChange: (e: ChangeEvent<HTMLInputElement>) => { addFiles(e.target.files); e.target.value = ""; },
  };

  /** Props per il contenitore: attività (anti-chiusura) e trascina-e-rilascia dei file. */
  const containerProps = {
    onPointerMove: bump, onPointerDown: bump, onKeyDown: bump, onFocusCapture: bump, onWheel: bump,
    onDragOver: (e: DragEvent) => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setDragging(true); } },
    onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false); },
    onDrop: (e: DragEvent) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); },
  };

  return {
    text, setText,
    files, addFiles, removeFile,
    audio, clearAudio,
    recording, startRecording, stopRecording, simulated,
    dictationSupported, dictating, transcribing, startDictation, stopDictation,
    error, setError,
    dragging, fading,
    hasContent, canSend, send,
    focus: () => { if (!isTouchDevice()) textareaRef.current?.focus(); }, // su touch niente tastiera finché non tocchi il campo
    openFilePicker: () => fileInputRef.current?.click(),
    textareaRef, textareaProps, fileInputProps, containerProps,
  };
}

export type ChatComposer = ReturnType<typeof useChatComposer>;
