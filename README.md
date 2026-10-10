# Simply · il piccolo aiutante di SimpleBooking

Mascotte animata in SVG per React + TypeScript. Simply è solo **interfaccia**: il comportamento (mood, indicare,
trascinamento…) è nel componente, la **regia** (cosa fare quando arriva uno stream, un tool, un evento dell'app)
è in un hook separato e non dipende dal trasporto: AI SDK lato client, server C# con SSE/WebSocket, o altro.

## Struttura

```
src/
  companion/   SimplyCompanion: disegno + comportamento (portal sotto <body>, casa ricordata, badge, onEvent)
  director/    useSimplyDirector: eventi -> props di Simply, priorità, coda dei messaggi, badge da nascosto
               adapters: useChatStatusBridge (AI SDK), serverEventToDirector (protocollo per backend proprio),
               simplyToolDefinition (tool "simply" per l'LLM)
  tour/        useSimplyTour: tour guidati (indica un elemento dopo l'altro)
  voice/       useSpeech: lettura ad alta voce (Web Speech API)
  chat/        OPZIONALE: useChatComposer (headless) + SimplyChatPanel (esempio cartoon)
  hooks/ utils/ types.ts theme.ts
demo/          demo completa, pilotata dal regista
scripts/build-preview.mjs  genera l'anteprima single-file .jsx dagli stessi sorgenti
```

## Collegamento tipico

```tsx
const director = useSimplyDirector({
  appEvents: {
    "reservation.created": (p) => ({ mood: "news", prop: "key", say: t("simply.newBooking", p) }),
  },
});
const tour = useSimplyTour(steps);

<SimplyCompanion
  {...director.companion}
  {...(tour.companion ?? {})}
  persistHome="simply-home"
  onIdleClick={() => setChatOpen(true)}
  onBusyClick={() => setChatOpen(true)}
  onHomeChange={(rect) => setSimplyRect(rect)}
  onEvent={(name, data) => analytics.track(`simply_${name}`, data)}
/>
```

### Eventi del regista

| evento | quando |
|---|---|
| `{ type: "request", phase: "start" \| "stream" \| "end" \| "error" }` | ciclo della risposta |
| `{ type: "tool", phase: "start", id, name, label? }` / `{ type: "tool", phase: "end", id, ok?, error? }` | chiamate ai tool (oggetto in mano da `propFromTool`) |
| `{ type: "ui", mood?, prop?, say?, pointTo?, durationMs? }` | gesti decisi dall'LLM (tool `simply`) o dall'app |
| `{ type: "app", name, payload }` | eventi dell'app, tradotti da `appEvents`; da nascosto -> badge |
| `{ type: "typing", value }`, `{ type: "speaking", value }`, `{ type: "say", text }`, `stop`, `clearGesture`, `reset` | varie |

Priorità: errore > tool in corso > "fatto!" > streaming/voce > richiesta > gesto > scrittura > riposo.
I messaggi vanno in coda e si mostrano uno alla volta. `director.steps` sono i passi dei tool da mostrare in chat.

### Con l'AI SDK (client)

```tsx
const { status } = useChat(/* … */);
useChatStatusBridge(status, director.dispatch);           // submitted/streaming/ready/error -> request
// per i tool: quando nei messaggi compare/si chiude una parte tool, dispatch({ type: "tool", … })
// (verifica i nomi dei campi delle parti tool sulla tua versione dell'SDK)
```

### Con un server C# (SSE / WebSocket)

Il server manda accanto al testo eventi JSON con il protocollo `SimplyServerEvent`:

```json
{"event":"request_start"}
{"event":"tool_start","id":"t1","name":"run_reservation_aggregation","label":"Compilo il report"}
{"event":"tool_end","id":"t1","ok":true}
{"event":"text_delta","text":"Report pronto…"}
{"event":"simply","mood":"success","say":"Fatto!","point_to":"rate-plans"}
{"event":"request_end"}
```

```ts
source.onmessage = (m) => serverEventToDirector(JSON.parse(m.data)).forEach(director.dispatch);
```

Il tool `simply` per l'LLM: `simplyToolDefinition(["rate-plans", "calendar", …])` (gli elementi indicabili
sono marcati in pagina con `data-simply="…"`).

## Chat con Tailwind

`useChatComposer` ha tutta la logica; la grafica è vostra.

```tsx
const c = useChatComposer({ open, onSend, onClose, busy, dictation: "browser",
  onTyping: (v) => director.dispatch({ type: "typing", value: v }),
  onRecordingChange: (on) => director.dispatch(on ? { type: "ui", prop: "mic", mood: "listening", durationMs: null } : { type: "clearGesture" }) });

<div {...c.containerProps} className={cn("rounded-2xl border bg-white p-2 shadow-lg", c.fading && "opacity-50")}>
  <div className="flex items-end gap-1 rounded-full border px-1">
    <button className="p-2" onClick={c.openFilePicker}><PaperclipIcon /></button>
    <input {...c.fileInputProps} accept="image/*,.pdf" />
    <textarea {...c.textareaProps} className="flex-1 resize-none bg-transparent py-2 outline-none" />
    {c.dictationSupported && <button onClick={c.dictating ? c.stopDictation : c.startDictation}>…</button>}
    {c.hasContent ? <button onClick={c.send} disabled={!c.canSend}>…</button> : <button onClick={c.startRecording}>…</button>}
  </div>
</div>
```

**Microfono** (pannello d'esempio): un solo bottone. Default `voiceInput="both"`: tocco = detta il testo, tieni premuto = messaggio vocale (anello che si riempie, il vocale parte durante la pressione; suggerimento le prime 3 volte). In alternativa `"menu"`, `"dictation"`, `"voice"`.

**Dettatura**: `dictation: "browser"` usa la Web Speech API (niente server; Chrome/Edge/Safari; l'audio va al servizio
del browser). Per un backend: `dictation: async (audio) => (await fetch("/api/stt", { method: "POST", body: audio })).text()`
(es. Azure Speech o Whisper lato C#).

## Stili

- Il CSS di Simply (animazioni SVG, classi prefissate `simply-`) è iniettato da solo. Con `injectStyles={false}` lo includete
  voi: è esportato come `COMPANION_CSS`.
- `classNames={{ bubble, badge }}` aggiunge vostre classi (es. Tailwind) a fumetto e badge.
- Tour: `useSimplyTour(steps, { renderStep })` per disegnare i controlli come volete.
- Le stringhe visibili sono ancora in italiano nel codice: da esporre nell'interfaccia per l'i18n.

## Pubblicare la demo su GitHub Pages

1. Crea un repository e carica il contenuto di questa cartella (il `.gitignore` esclude `node_modules`, `dist`, `preview`).
2. Su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Fai push su `main`: il workflow `.github/workflows/pages.yml` installa, controlla i tipi, fa `npm run build` e pubblica `dist/`.
   La demo sarà su `https://<utente-o-org>.github.io/<repo>/`.

In locale: `npm install`, poi `npm run dev` (sviluppo) o `npm run build && npm run serve` (anteprima del sito statico).
Su Pages (https) funziona anche ciò che la preview di Claude blocca: portal, localStorage, microfono e dettatura (con permesso).
Nota: con un repository privato, GitHub Pages richiede un piano a pagamento; in alternativa vanno bene Netlify, Vercel o
Azure Static Web Apps (stesso `npm run build`, cartella `dist`).

## Altro

- **Portal**: Simply vive in un livello sotto `<body>` (`portal`, `portalTarget`, `zIndex`); il wrapper resta nel layout come
  segnaposto della casa di default, e Simply lo segue anche se scorre.
- **Casa ricordata**: `persistHome="chiave"` (casa non controllata) oppure `readStoredHome` / `storeHome` se la controllate voi.
- **Badge**: `badge` + `onBadgeClick`; il regista lo gestisce da solo per gli eventi app arrivati mentre Simply era nascosto.
- **Analytics**: `onEvent` su SimplyCompanion, useChatComposer e SimplyChatPanel.
- `npm run dev` · `npm run build` · `npm run typecheck` (TypeScript strict) · `npm run preview` (genera l'anteprima .jsx per Claude).
