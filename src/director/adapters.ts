import { useEffect, useRef } from "react";
import type { ChatStatus } from "../types";
import type { SimplyDirectorEvent } from "./useSimplyDirector";

/**
 * Collega lo `status` di una chat in stile Vercel AI SDK (ready | submitted | streaming | error)
 * agli eventi "request" del regista.
 */
export function useChatStatusBridge(status: ChatStatus | string, dispatch: (e: SimplyDirectorEvent) => void): void {
  const prev = useRef(status);
  useEffect(() => {
    const was = prev.current;
    prev.current = status;
    if (status === was) return;
    if (status === "submitted") dispatch({ type: "request", phase: "start" });
    else if (status === "streaming") {
      if (was === "ready" || was === "error") dispatch({ type: "request", phase: "start" });
      dispatch({ type: "request", phase: "stream" });
    } else if (status === "error") dispatch({ type: "request", phase: "error" });
    else if (status === "ready" && (was === "submitted" || was === "streaming")) dispatch({ type: "request", phase: "end" });
  }, [status, dispatch]);
}

/**
 * Protocollo consigliato per un backend proprio (es. C# con SSE o WebSocket):
 * il server manda questi eventi JSON accanto ai pezzi di testo dello stream.
 */
export type SimplyServerEvent =
  | { event: "request_start" }
  | { event: "text_delta"; text?: string }
  | { event: "request_end" }
  | { event: "request_error"; message?: string }
  | { event: "tool_start"; id: string; name: string; label?: string }
  | { event: "tool_end"; id: string; ok?: boolean; error?: string }
  | { event: "simply"; mood?: string; prop?: string; say?: string; point_to?: string; duration_ms?: number }
  | { event: "app"; name: string; payload?: unknown };

/** Traduce un evento del server nel/nei corrispondenti eventi del regista. */
export function serverEventToDirector(e: SimplyServerEvent): SimplyDirectorEvent[] {
  switch (e.event) {
    case "request_start": return [{ type: "request", phase: "start" }];
    case "text_delta": return [{ type: "request", phase: "stream" }];
    case "request_end": return [{ type: "request", phase: "end" }];
    case "request_error": return [{ type: "request", phase: "error", error: e.message }];
    case "tool_start": return [{ type: "tool", phase: "start", id: e.id, name: e.name, label: e.label }];
    case "tool_end": return [{ type: "tool", phase: "end", id: e.id, ok: e.ok, error: e.error }];
    case "simply":
      return [{
        type: "ui",
        mood: e.mood as never, prop: e.prop as never, say: e.say,
        pointTo: e.point_to ? `[data-simply="${e.point_to}"]` : undefined,
        durationMs: e.duration_ms,
      }];
    case "app": return [{ type: "app", name: e.name, payload: e.payload }];
  }
}

/**
 * Definizione del tool "simply" da dare all'LLM (formato JSON Schema, valido per Anthropic/OpenAI e simili).
 * Gli enum chiusi impediscono al modello di inventare stati o bersagli.
 */
export function simplyToolDefinition(targets: string[]) {
  return {
    name: "simply",
    description: "Controlla la mascotte Simply: espressione, oggetto in mano, frase breve, elemento della UI da indicare.",
    input_schema: {
      type: "object",
      properties: {
        mood: { type: "string", enum: ["success", "news", "sad", "laughing", "confused", "love", "surprised", "thinking"] },
        prop: { type: "string", enum: ["ok", "confetti", "key", "lightbulb", "gift", "calendar", "chart"] },
        say: { type: "string", maxLength: 80 },
        point_to: { type: "string", enum: targets },
      },
    },
  } as const;
}
