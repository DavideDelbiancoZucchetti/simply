import type { RefObject } from "react";

/** Espressione e posa. Alcuni mood li prende anche da solo (vedi SimplyCompanion). */
export type Mood =
  | "idle" | "greeting" | "listening" | "thinking" | "talking" | "news" | "success" | "error"
  | "privacy" | "sitting"
  | "sad" | "surprised" | "love" | "confused" | "sleepy" | "laughing" | "dizzy";

/** Oggetto tenuto in mano. */
export type PropName =
  | "calendar" | "book" | "magnifier" | "chart" | "key" | "lightbulb" | "envelope" | "wrench"
  | "coffee" | "confetti" | "flag" | "ok" | "gift" | "pumpkin" | "egg" | "mic" | "ponder";

/** Cosa indossa. I copricapo (HATS) si indossano uno alla volta. */
export type Accessory =
  | "cape" | "sunglasses" | "scarf" | "earmuffs" | "santa-hat" | "witch-hat" | "bunny-ears" | "party-hat";

export type Season = "christmas" | "halloween" | "easter" | "winter" | "summer";

export interface SeasonLook {
  season: Season | null;
  accessories: Accessory[];
  prop: PropName | null;
}

/** "full" = sempre animato, "auto" = segue "riduci animazioni" del sistema, "off" = fermo. */
export type MotionMode = "full" | "auto" | "off";

export interface Point { x: number; y: number }

/** Cosa indicare: ref React, elemento DOM, selettore CSS o punto in coordinate viewport. */
export type PointTarget = string | Element | RefObject<Element | null> | Point | null | undefined;

export interface HomePosition { left: number; top: number }
export interface HomeRect extends HomePosition { width: number; height: number }
export interface HomeChangeInfo { custom: boolean; fromDrag: boolean }

export interface InterruptContext {
  mood: Mood;
  prop: PropName | "none" | undefined;
  pointing: boolean;
  teleported: boolean;
}

export interface Rect { left: number; top: number; right: number; bottom: number; width?: number; height?: number }

/* ---------- Chat ---------- */

export interface ChatAttachment { id: string; file: File; url: string | null; isImage: boolean }
export interface ChatAudio { blob: Blob; url: string; seconds: number }

export type ToolStepStatus = "running" | "done" | "error";
export interface ToolStep { icon?: string; label: string; status: ToolStepStatus; detail?: string }

export interface ChatMessage {
  role: "user" | "assistant";
  text?: string;
  attachments?: ChatAttachment[];
  audio?: ChatAudio | null;
  steps?: ToolStep[];
}

export interface ChatSendPayload {
  text: string;
  files: File[];
  attachments: ChatAttachment[];
  audio: ChatAudio | null;
}

/** Status in stile Vercel AI SDK `useChat`. */
export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

/** Eventi per analytics emessi da SimplyCompanion (onEvent). */
export type SimplyEventName =
  | "click" | "double_click" | "dismiss" | "idle_click" | "busy_click"
  | "drag_start" | "drag_end" | "throw" | "dizzy" | "hurt"
  | "point_start" | "point_end" | "hidden" | "shown" | "badge_click";

/** Eventi per analytics emessi dal compositore/pannello chat (onEvent). */
export type ChatEventName =
  | "send" | "attach" | "record_start" | "record_stop" | "record_cancel"
  | "dictation_start" | "dictation_stop" | "auto_close" | "expand" | "collapse";
