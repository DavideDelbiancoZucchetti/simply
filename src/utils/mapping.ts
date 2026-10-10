import type { ChatStatus, Mood, PropName } from "../types";

/** Mappa lo status della chat (es. `useChat` del Vercel AI SDK) su un mood. */
export function moodFromChatStatus(status: ChatStatus | string, { isTyping = false }: { isTyping?: boolean } = {}): Mood {
  if (status === "submitted") return "thinking";
  if (status === "streaming") return "talking";
  if (status === "error") return "error";
  if (isTyping) return "listening";
  return "idle";
}

/**
 * Mappa il nome del tool che l'agente sta chiamando su un oggetto in mano.
 * Adatta le regex ai nomi reali dei tuoi tool.
 */
export function propFromTool(toolName = ""): PropName | null {
  const t = toolName.toLowerCase();
  if (/aggregat|report|analytic|stat|revenue|kpi/.test(t)) return "chart";
  if (/knowledge|doc|faq|rag|manual|guide/.test(t)) return "book";
  if (/search|find|lookup|query|availability/.test(t)) return "magnifier";
  if (/calendar|date|schedule/.test(t)) return "calendar";
  if (/confirm|create_reservation|book_room|checkin/.test(t)) return "key";
  if (/mail|send|message|notify|reply/.test(t)) return "envelope";
  if (/audio|voice|record|transcri|speech/.test(t)) return "mic";
  return null;
}
