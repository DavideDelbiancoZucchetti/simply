import type { ChatSendPayload, PropName, Mood } from "../src";

export interface ScenarioStep { icon: string; label: string; prop: PropName; ms: number; fail?: string; mood?: Mood }
export interface Scenario { ask: string; steps: ScenarioStep[]; final: string }

// Sequenze di tool simulate: ogni passo ha un oggetto in mano, un'etichetta e una durata
export const SCENARIOS: Record<"report" | "retry", Scenario> = {
  report: {
    ask: "Mi prepari il report di ottobre?",
    steps: [
      { icon: "🔍", label: "Cerco le prenotazioni di ottobre", prop: "magnifier", ms: 1500 },
      { icon: "📊", label: "Compilo il report", prop: "chart", ms: 1800 },
    ],
    final: "Report pronto: 312 notti vendute, ADR 128 €, occupazione al 72% (+6 punti sull'anno scorso).",
  },
  retry: {
    ask: "Che disponibilità ho a metà ottobre?",
    steps: [
      { icon: "🔍", label: "Cerco le camere libere", prop: "magnifier", ms: 1300 },
      { icon: "📅", label: "Apro il calendario disponibilità", prop: "calendar", ms: 1300, fail: "Il servizio non risponde (timeout)" },
      { icon: "🔧", label: "Riprovo la connessione", prop: "wrench", mood: "error", ms: 1500 },
      { icon: "📅", label: "Apro il calendario disponibilità", prop: "calendar", ms: 1300 },
    ],
    final: "Ecco la disponibilità: 14–16 ottobre 3 camere libere, 17–19 ottobre 1 camera, 20–22 ottobre tutto esaurito.",
  },
};

export const CAPE_SWATCHES: [string, string][] = [["#5E2A92", "viola SB"], ["#1F5FBF", "blu"], ["#C8322B", "rosso"], ["#1E8A5A", "verde"], ["#E2007A", "magenta"], ["#2C2C31", "nero"]];


const fmtTime = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

export function fakeReply({ text, attachments, audio }: ChatSendPayload): string {
  const imgs = attachments.filter((a) => a.isImage).length;
  const docs = attachments.length - imgs;
  const parts = [];
  if (imgs) parts.push(imgs === 1 ? "Ho guardato la foto" : `Ho guardato le ${imgs} foto`);
  if (docs) parts.push(docs === 1 ? "ho letto il file" : `ho letto i ${docs} file`);
  if (audio) parts.push(`ho ascoltato il tuo vocale di ${fmtTime(audio.seconds)}`);
  const intro = parts.length ? parts.join(", ").replace(/^./, (c) => c.toUpperCase()) + ". " : "";
  const body = [
    "Hai 3 arrivi oggi e una richiesta in attesa.",
    "Ottobre è al 72% di occupazione, avanti rispetto all'anno scorso.",
    "Ho trovato 2 date chiuse con camere ancora libere.",
  ][Math.floor(Math.random() * 3)];
  return (intro + (text || !parts.length ? body : "Dimmi pure cosa vuoi che faccia.")).trim();
}

