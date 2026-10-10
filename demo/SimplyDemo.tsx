import { useEffect, useRef, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import {
  SimplyCompanion, SimplyChatPanel, PROPS, ACCESSORIES, HATS, seasonalLook, SIMPLY_COLORS as C,
  useSimplyDirector, useSimplyTour, useSpeech, readStoredHome, storeHome, propFromTool,
} from "../src";
import type {
  Accessory, ChatMessage, ChatSendPayload, HomePosition, HomeRect, MotionMode, Mood, PropName, SimplyDirectorEvent, TourStep,
} from "../src";
import { DemoIntro } from "./DemoIntro";
import { CAPE_SWATCHES, SCENARIOS, fakeReply } from "./scenarios";

type TargetKey = "notif" | "settings" | "pwd" | "rates" | "help" | "feedback";
type SeasonKey = "auto" | "christmas" | "halloween" | "easter" | "winter" | "summer" | "none";

const HOME_KEY = "simply-demo-home";
const PROP_LABEL: Record<PropName, string> = { calendar: "📅", book: "📖", magnifier: "🔍", chart: "📊", key: "🔑", lightbulb: "💡", envelope: "✉️", wrench: "🔧", coffee: "☕", confetti: "🎉", flag: "🚩", ok: "👌", gift: "🎁", pumpkin: "🎃", egg: "🥚", mic: "🎤", ponder: "🤔" };
const ACC_LABEL: Record<Accessory, string> = { cape: "🦸 mantello", sunglasses: "🕶️ occhiali", scarf: "🧣 sciarpa", "santa-hat": "🎅 cappello Natale", "witch-hat": "🧙 cappello Halloween", "bunny-ears": "🐰 orecchie Pasqua", "party-hat": "🥳 cappellino festa", earmuffs: "🎧 paraorecchie" };
const SEASON_DATES: Record<Exclude<SeasonKey, "auto" | "none">, Date> = { christmas: new Date(2026, 11, 20), halloween: new Date(2026, 9, 28), easter: new Date(2026, 3, 1), winter: new Date(2026, 0, 20), summer: new Date(2026, 6, 15) };
const MOODS: [Mood, string][] = [
  ["idle", ""], ["greeting", "Ciao, sono Simply!"], ["listening", "Ti ascolto"], ["thinking", "Mmh…"], ["talking", "Ecco cosa ho trovato"],
  ["news", "C'è una novità!"], ["privacy", "Non guardo!"], ["sitting", ""], ["success", "Fatto!"], ["error", "Ops, riprovo…"],
  ["sad", "Mi dispiace…"], ["surprised", "Oh!"], ["love", "Che carino!"], ["confused", "Non ho capito…"], ["sleepy", ""], ["laughing", "Ahahah!"], ["dizzy", "Mi gira la testa…"],
];

/* Demo: tutte le capacità di Simply, pilotate dal "regista". Non fa parte del pacchetto. */
export default function SimplyDemo() {
  // ---------- aspetto ----------
  const [intro, setIntro] = useState(true);
  const [showSimply, setShowSimply] = useState(false);
  const [sound, setSound] = useState(true);
  const [motion, setMotion] = useState<MotionMode>("full");
  const [size, setSize] = useState(130);
  const [hidden, setHidden] = useState(false);
  const [autoHide, setAutoHide] = useState(true);
  const [capeColor, setCapeColor] = useState<string>(C.purple);
  const [accessories, setAccessories] = useState<Accessory[]>(() => seasonalLook().accessories);
  const [season, setSeason] = useState<SeasonKey>("auto");
  const [home, setHome] = useState<HomePosition | null>(() => readStoredHome(HOME_KEY));
  const [simplyRect, setSimplyRect] = useState<HomeRect | null>(null);
  const [manual, setManual] = useState<{ mood?: Mood; prop?: PropName | "none"; point?: TargetKey | null }>({});

  // ---------- chat ----------
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [readAloud, setReadAloud] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const track = (name: string, data?: Record<string, unknown>) =>
    setLog((l) => [`${new Date().toLocaleTimeString("it-IT")}  ${name}${data ? " " + JSON.stringify(data) : ""}`, ...l].slice(0, 8));

  const notifRef = useRef<HTMLSpanElement>(null), settingsRef = useRef<HTMLSpanElement>(null), ratesRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLButtonElement>(null), feedbackRef = useRef<HTMLButtonElement>(null), pwdRef = useRef<HTMLInputElement>(null);
  const TARGETS: Record<TargetKey, [RefObject<Element>, string]> = {
    notif: [notifRef, "Qui trovi le notifiche"],
    settings: [settingsRef, "Le impostazioni sono qui"],
    pwd: [pwdRef, "Qui la password: io non guardo!"],
    rates: [ratesRef, "Le tariffe le cambi qui"],
    help: [helpRef, "Se serve, chiedi aiuto qui"],
    feedback: [feedbackRef, "Qui mi lasci un feedback"],
  };

  // ---------- il regista: tutto passa da qui ----------
  const director = useSimplyDirector({
    narrate: !chatOpen,
    // nella demo i tool simulati si chiamano "demo:<oggetto>"; con tool veri basta il default (propFromTool)
    toolProp: (name) => (name.startsWith("demo:") ? (name.slice(5) as PropName) : propFromTool(name)),
    appEvents: {
      "reservation.created": (p: { guest: string; nights: number }) => ({ mood: "news", prop: "key", say: `Nuova prenotazione: ${p.guest}, ${p.nights} notti`, durationMs: 4500 }),
      "report.ready": () => ({ mood: "success", prop: "chart", say: "Il report di ottobre è pronto", durationMs: 4000 }),
    },
  });
  const d = director.dispatch;
  const busy = director.busy;
  const speech = useSpeech({ onSpeakingChange: (v) => d({ type: "speaking", value: v }) });

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => clear, []);

  // ---------- tour guidato ----------
  const tourSteps: TourStep[] = [
    { target: notifRef, text: "Qui arrivano le notifiche delle prenotazioni.", mood: "greeting" },
    { target: settingsRef, text: "Dalle impostazioni configuri la struttura." },
    { target: pwdRef, text: "Qui la password (non guardo!)." },
    { target: ratesRef, text: "E qui gestisci i piani tariffari.", prop: "lightbulb" },
    { target: helpRef, text: "Se ti serve, chiedi aiuto qui. Buon lavoro!", mood: "success" },
  ];
  const tour = useSimplyTour(tourSteps, { onFinish: (done) => track(done ? "tour_done" : "tour_stop") });

  const greet = () => d({ type: "ui", mood: "greeting", say: "Ciao, sono Simply! Toccami per scrivermi", durationMs: 4000 });
  const replayIntro = () => { clear(); setChatOpen(false); d({ type: "reset" }); setShowSimply(false); setIntro(true); window.scrollTo({ top: 0 }); };
  useEffect(() => { if (motion === "off" && intro) { setIntro(false); setShowSimply(true); greet(); } }, [motion]); // eslint-disable-line react-hooks/exhaustive-deps

  // Passi dei tool del regista -> messaggio di Simply in chat
  const liveIdx = useRef<number | null>(null);
  useEffect(() => {
    if (liveIdx.current == null) return;
    const i = liveIdx.current;
    setMessages((ms) => ms.map((m, j) => (j === i ? { ...m, steps: director.steps } : m)));
  }, [director.steps]);

  const streamText = (text: string, start: number, done?: () => void) => {
    const words = text.split(" ");
    later(() => d({ type: "request", phase: "stream" }), start);
    words.forEach((_w, i) => later(() => setMessages((ms) => {
      const n = [...ms];
      const idx = liveIdx.current ?? n.length - 1;
      n[idx] = { ...n[idx], role: "assistant", text: words.slice(0, i + 1).join(" ") };
      return n;
    }), start + i * 100));
    later(() => {
      d({ type: "request", phase: "end" });
      liveIdx.current = null;
      if (readAloud) speech.speak(text);
      done?.();
    }, start + words.length * 100 + 300);
  };

  const beginAnswer = (userMsg: ChatMessage) => {
    clear();
    setMessages((ms) => {
      liveIdx.current = ms.length + 1;
      return [...ms, userMsg, { role: "assistant", text: "", steps: [] }];
    });
    d({ type: "request", phase: "start" });
  };

  // Uno scenario = la sequenza di eventi che arriverebbe da uno stream vero (AI SDK o server C#)
  const runScenario = (key: keyof typeof SCENARIOS, userMsg?: ChatMessage) => {
    const sc = SCENARIOS[key];
    setChatOpen(true);
    beginAnswer(userMsg || { role: "user", text: sc.ask, attachments: [] });
    let t = 600;
    sc.steps.forEach((st, i) => {
      const id = `t${i}`;
      later(() => d({ type: "tool", phase: "start", id, name: `demo:${st.prop}`, label: st.label, icon: st.icon }), t);
      t += st.ms;
      later(() => d({ type: "tool", phase: "end", id, ok: !st.fail, error: st.fail }), t);
      t += st.fail ? 1300 : 250;
    });
    streamText(sc.final, t + 1300);
  };

  const reactWith = (mood: Mood, userMsg: ChatMessage, reply: string) => {
    beginAnswer(userMsg);
    d({ type: "request", phase: "end" });           // niente "thinking": prima la faccia, poi la risposta
    d({ type: "ui", mood, durationMs: 1800 });
    streamText(reply, 1800, () => d({ type: "ui", mood, durationMs: 2500 }));
  };

  const onSend = (payload: ChatSendPayload) => {
    const q = payload.text.toLowerCase();
    const userMsg: ChatMessage = { role: "user", text: payload.text, attachments: payload.attachments, audio: payload.audio };
    if (/stupid|scem|idiot|cretin|inutile|fai schifo|incapace|deficiente/.test(q)) return reactWith("sad", userMsg, "Ahi… mi dispiace se ti ho deluso. Dimmi cosa non va e provo a fare meglio.");
    if (/(ah){2,}|(ha){2,}|lol|😂|🤣|barzelletta|che ridere/.test(q)) return reactWith("laughing", userMsg, "Ahahah! Questa era bella 😄");
    if (/brav|grazie|ti adoro|sei (forte|fantastico|il migliore)|ottimo lavoro/.test(q)) return reactWith("love", userMsg, "Che bello sentirlo! Grazie a te 💜");
    if (/^\s*(boh|mah|\?+|asdf)/.test(q)) return reactWith("confused", userMsg, "Non sono sicuro di aver capito… puoi spiegarmi meglio?");
    if (/report|riepilogo/.test(q)) return runScenario("report", userMsg);
    if (/disponibil|camere libere|calendario/.test(q)) return runScenario("retry", userMsg);
    // Risposta generica: un tool di ricerca (lente o librone) e poi il testo
    beginAnswer(userMsg);
    const hasMedia = payload.attachments.length || payload.audio;
    later(() => d({ type: "tool", phase: "start", id: "k", name: hasMedia ? "image_search" : "knowledge_search", label: hasMedia ? "Guardo gli allegati" : "Cerco nella guida" }), 400);
    later(() => d({ type: "tool", phase: "end", id: "k", ok: true }), 1700);
    streamText(fakeReply(payload), 2600);
  };

  // ---------- controlli manuali (anche loro passano dal regista) ----------
  const setMood = (m: Mood, say: string) => { setManual((x) => ({ ...x, mood: m })); d({ type: "ui", mood: m, say: say || undefined, durationMs: null }); };
  const setProp = (p: PropName | "none" | undefined) => {
    setManual((x) => ({ ...x, prop: p }));
    if (p === undefined) d({ type: "clearGesture" }); else d({ type: "ui", prop: p, mood: manual.mood, durationMs: null });
  };
  const choosePoint = (k: TargetKey | null) => {
    setManual((x) => ({ ...x, point: k }));
    if (!k) d({ type: "stop" }); else d({ type: "ui", pointTo: TARGETS[k][0], say: TARGETS[k][1], durationMs: null });
  };
  const toggleAcc = (a: Accessory) => setAccessories((list) => {
    if (list.includes(a)) return list.filter((x) => x !== a);
    const base = HATS.includes(a) ? list.filter((x) => !HATS.includes(x)) : list; // un copricapo alla volta
    return [...base, a];
  });
  const applySeason = (k: SeasonKey) => {
    setSeason(k);
    const look = k === "auto" ? seasonalLook() : k === "none" ? { accessories: ["cape"] as Accessory[], prop: null } : seasonalLook(SEASON_DATES[k]);
    setAccessories(look.accessories);
    setProp(look.prop || undefined);
  };
  const appEvent = (name: string, payload?: unknown) => { d({ type: "app", name, payload } as SimplyDirectorEvent); track(`app:${name}`); };

  const pill = (active: boolean): CSSProperties => ({
    padding: "7px 13px", borderRadius: 999, border: `2px solid ${C.ink}`, cursor: "pointer",
    background: active ? C.gold : "#fff", fontWeight: 600, fontSize: 13, color: C.ink,
  });
  const row: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", alignItems: "center" };
  const label: CSSProperties = { fontSize: 13, fontWeight: 600 };
  const note: CSSProperties = { margin: 0, fontSize: 12, opacity: .65, textAlign: "center" };
  const simplyH = size * (198 / 236);
  const companion = { ...director.companion, ...(tour.companion ?? {}) };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7FF", fontFamily: "system-ui,sans-serif", color: C.ink,
      display: "flex", justifyContent: "center", padding: "16px 12px 200px", boxSizing: "border-box" }}>
      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span ref={notifRef} style={{ ...pill(manual.point === "notif"), cursor: "default" }}>🔔 Notifiche</span>
          <span ref={settingsRef} style={{ ...pill(manual.point === "settings"), cursor: "default" }}>⚙️ Impostazioni</span>
        </div>

        <div style={row}>
          <button onClick={replayIntro} style={pill(false)}>▶ rivedi l'intro</button>
          <button onClick={() => (tour.active ? tour.stop() : tour.start())} style={pill(tour.active)}>🧭 {tour.active ? "ferma il tour" : "tour guidato"}</button>
        </div>

        <p style={{ margin: "4px 0 0", fontSize: 14, textAlign: "center" }}>
          <strong>Trascinalo</strong> per cambiargli casa (se lo storage è disponibile la ricorda al prossimo caricamento):
          fai cerchi e volteggia, scuotilo e va KO, lancialo e rimbalza sui bordi. <strong>Tocca Simply</strong>: a riposo apre la chat,
          se sta facendo qualcosa smette. Mentre risponde non si lascia interrompere. Doppio tocco: campanello.
        </p>

        <div style={row}>
          <span style={label}>🧪 Simula in chat:</span>
          <button disabled={busy} onClick={() => runScenario("report")} style={{ ...pill(false), opacity: busy ? .5 : 1 }}>cerca → report</button>
          <button disabled={busy} onClick={() => runScenario("retry")} style={{ ...pill(false), opacity: busy ? .5 : 1 }}>cerca → errore → riprova → calendario</button>
          <button onClick={() => { setReadAloud((v) => !v); if (readAloud) speech.stop(); }} disabled={!speech.supported}
            style={{ ...pill(readAloud), opacity: speech.supported ? 1 : .5 }}>🔊 leggi le risposte</button>
        </div>
        <p style={note}>In chat: "report di ottobre", "disponibilità", un insulto, un complimento, "ahahah", "boh". Il microfono della chat: detta il testo o registra un vocale.</p>

        <div style={row}>
          <span style={label}>📣 Eventi dell'app:</span>
          <button onClick={() => appEvent("reservation.created", { guest: "Rossi", nights: 3 })} style={pill(false)}>nuova prenotazione</button>
          <button onClick={() => appEvent("report.ready")} style={pill(false)}>report pronto</button>
        </div>
        <p style={note}>Se Simply è nascosto non salta fuori: compare un badge sulla testa, e la novità arriva quando lo tocchi.</p>

        <div style={row}>
          <span style={label}>🎨 Mantello:</span>
          {CAPE_SWATCHES.map(([c, name]) => (
            <button key={c} onClick={() => setCapeColor(c)} title={name} aria-label={`Mantello ${name}`}
              style={{ width: 30, height: 30, borderRadius: "50%", cursor: "pointer", background: c,
                border: `3px solid ${capeColor.toLowerCase() === c.toLowerCase() ? C.gold : C.ink}` }} />
          ))}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="color" value={capeColor} onChange={(e) => setCapeColor(e.target.value)}
              style={{ width: 36, height: 30, border: "none", background: "none", padding: 0, cursor: "pointer" }} />
            altro…
          </label>
        </div>

        <div style={row}>
          <span style={label}>😀 Mood:</span>
          {MOODS.map(([m, t]) => <button key={m} onClick={() => setMood(m, t)} style={pill(manual.mood === m)}>{m}</button>)}
          <button onClick={() => { setManual({}); d({ type: "reset" }); }} style={pill(false)}>↺ azzera</button>
          <button onClick={() => setSound((v) => !v)} style={pill(sound)}>{sound ? "🔔 suono on" : "🔕 suono off"}</button>
        </div>

        <div style={row}>
          <span style={label}>✋ In mano:</span>
          <button onClick={() => setProp(undefined)} style={pill(manual.prop === undefined)}>auto</button>
          <button onClick={() => setProp("none")} style={pill(manual.prop === "none")}>mani libere</button>
          {PROPS.map((p) => <button key={p} onClick={() => setProp(p)} style={pill(manual.prop === p)} title={p} aria-label={p}>{PROP_LABEL[p]}</button>)}
        </div>

        <div style={row}>
          <span style={label}>👉 Indica:</span>
          {([[null, "niente"], ["notif", "notifiche"], ["settings", "impostazioni"], ["pwd", "password"], ["rates", "tariffe (lontano)"], ["help", "aiuto (angolo)"], ["feedback", "feedback"]] as [TargetKey | null, string][])
            .map(([k, l]) => <button key={l} onClick={() => choosePoint(k)} style={pill(manual.point === k)}>{l}</button>)}
        </div>

        <div style={row}>
          <span style={label}>🎩 Accessori:</span>
          {ACCESSORIES.map((a) => <button key={a} onClick={() => toggleAcc(a)} style={pill(accessories.includes(a))}>{ACC_LABEL[a]}</button>)}
        </div>
        <div style={row}>
          <span style={label}>📅 Periodo:</span>
          {([["auto", "oggi"], ["christmas", "Natale"], ["halloween", "Halloween"], ["easter", "Pasqua"], ["winter", "inverno"], ["summer", "estate"], ["none", "nessuno"]] as [SeasonKey, string][])
            .map(([k, l]) => <button key={k} onClick={() => applySeason(k)} style={pill(season === k)}>{l}</button>)}
        </div>

        <div style={row}>
          <span style={label}>📏 Dimensione:</span>
          {([[90, "S"], [130, "M"], [170, "L"]] as [number, string][]).map(([v, l]) => <button key={v} onClick={() => setSize(v)} style={pill(size === v)}>{l} · {v}px</button>)}
        </div>

        <div style={row}>
          <span style={label}>🙈 Visibilità:</span>
          <button onClick={() => setHidden((h) => !h)} style={pill(hidden)}>{hidden ? "nascosto (forzato)" : "nascondi"}</button>
          <button onClick={() => setAutoHide((v) => !v)} style={pill(autoHide)}>auto-nascondi dopo 30s</button>
          <button onClick={() => { setHome(null); storeHome(HOME_KEY, null); }} disabled={!home} style={{ ...pill(false), opacity: home ? 1 : .5 }}>🏠 rimetti a casa</button>
        </div>
        <p style={note}>A riposo: si siede dopo 8 s e beve il caffè dopo 18 s (default nel componente: 20 s e 45 s).</p>

        <div style={row}>
          <span style={label}>🎬 Animazioni:</span>
          {([["full", "sempre"], ["auto", "segui il sistema"], ["off", "off"]] as [MotionMode, string][]).map(([k, l]) => <button key={k} onClick={() => setMotion(k)} style={pill(motion === k)}>{l}</button>)}
        </div>

        <input ref={pwdRef} type="password" placeholder="Password (prova a scriverci)" autoComplete="new-password"
          style={{ padding: "11px 14px", borderRadius: 12, border: `2px solid ${C.ink}`, fontSize: 15 }} />

        <div style={{ background: "#fff", border: `2px solid ${C.ink}`, borderRadius: 14, padding: "10px 12px" }}>
          <strong style={{ fontSize: 13 }}>📈 Eventi (onEvent)</strong>
          <pre style={{ margin: "6px 0 0", fontSize: 11.5, lineHeight: 1.45, whiteSpace: "pre-wrap", opacity: .8, minHeight: 40 }}>
            {log.length ? log.join("\n") : "tocca, trascina, apri la chat…"}
          </pre>
        </div>

        <div style={{ height: 900, display: "grid", placeItems: "center", fontSize: 13, opacity: .45 }}>↓ un elemento lontano più in basso ↓</div>
        <div ref={ratesRef} style={{ background: "#fff", border: `2px solid ${C.ink}`, borderRadius: 16, padding: 16, alignSelf: "flex-end", width: "60%" }}>
          <strong>🏷️ Piani tariffari</strong>
          <p style={{ margin: "6px 0 0", fontSize: 13, opacity: .7 }}>Non rimborsabile, Flessibile, B&B</p>
        </div>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} style={{ ...pill(false), alignSelf: "center", marginTop: 8 }}>↑ torna su</button>
        <button ref={feedbackRef} style={{ ...pill(manual.point === "feedback"), position: "fixed", left: 12, bottom: 56, zIndex: 10 }}>💬 Feedback</button>
        <button ref={helpRef} style={{ ...pill(manual.point === "help"), position: "fixed", left: 12, bottom: 12, zIndex: 10 }}>❓ Aiuto</button>
      </div>

      <SimplyChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        onSend={onSend}
        onTyping={(t) => d({ type: "typing", value: t })}
        busy={busy}
        autoCloseAfter={12000}
        anchorRect={simplyRect}
        simulateIfUnavailable
        dictation="browser"
        onEvent={(n, data) => track(`chat:${n}`, data)}
        onRecordingChange={(on) => (on ? d({ type: "ui", prop: "mic", mood: "listening", durationMs: null }) : d({ type: "clearGesture" }))}
        style={{ right: 16, bottom: 16 + simplyH + 10, "--simply-tail-right": `${size / 2 - 7}px` }}
      />

      {intro && <DemoIntro onLand={() => setShowSimply(true)} onDone={() => { setIntro(false); setShowSimply(true); greet(); }} />}

      {/* Segnaposto della casa di default (in basso a destra): Simply vive in un portal sotto <body> */}
      <div style={{ position: "fixed", right: 16, bottom: 16 }}>
        <SimplyCompanion
          {...companion}
          message={chatOpen && !tour.active ? undefined : companion.message}
          visible={showSimply}
          motion={motion} size={size} sound={sound} capeColor={capeColor} accessories={accessories}
          home={home}
          onHomeChange={(r, info) => { setSimplyRect(r); if (info.fromDrag) { setHome({ left: r.left, top: r.top }); storeHome(HOME_KEY, { left: r.left, top: r.top }); } }}
          onDragStart={() => setChatOpen(false)}
          onDizzy={() => d({ type: "say", text: "Mi gira la testa…", durationMs: 4000 })}
          onHurt={() => d({ type: "say", text: "Ahia… trattami bene, per favore 🥺", durationMs: 5000, priority: "high" })}
          idleSitAfter={8000} idleCoffeeAfter={18000} autoHideAfter={autoHide ? 30000 : null}
          hidden={hidden} onHiddenChange={setHidden} keepAwake={chatOpen}
          onBusyClick={() => setChatOpen(true)}
          onIdleClick={() => setChatOpen((o) => !o)}
          onPointEnd={() => { companion.onPointEnd?.(); setManual((x) => ({ ...x, point: null })); }}
          onDismiss={() => { companion.onDismiss?.(); setManual({}); }}
          onEvent={(n, data) => track(n, data)}
        />
      </div>
    </div>
  );
}
