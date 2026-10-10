/* Simply — il piccolo aiutante di SimpleBooking */

// Mascotte (non dipende dalla chat)
export { SimplyCompanion } from "./companion/SimplyCompanion";
export type { SimplyCompanionProps, PointState } from "./companion/SimplyCompanion";
export { PROPS } from "./companion/constants";
export { COMPANION_CSS, COMPANION_STYLE_ID } from "./companion/styles";

// Regia: eventi (stream, tool, LLM, app) -> props di Simply; indipendente dal trasporto
export { useSimplyDirector } from "./director/useSimplyDirector";
export type { SimplyDirector, SimplyDirectorEvent, SimplyDirectorOptions, SimplyReaction } from "./director/useSimplyDirector";
export { useChatStatusBridge, serverEventToDirector, simplyToolDefinition } from "./director/adapters";
export type { SimplyServerEvent } from "./director/adapters";

// Tour guidati e voce
export { useSimplyTour } from "./tour/useSimplyTour";
export type { TourStep, TourStepRenderArgs, UseSimplyTourOptions } from "./tour/useSimplyTour";
export { useSpeech } from "./voice/useSpeech";

// Utilità
export { moodFromChatStatus, propFromTool } from "./utils/mapping";
export { seasonalLook, easterDate, ACCESSORIES, HATS } from "./utils/season";
export { readStoredHome, storeHome } from "./utils/storage";

// Chat (opzionale): hook headless per la tua UI + pannello d'esempio nello stile di Simply
export { useChatComposer } from "./chat/useChatComposer";
export type { UseChatComposerOptions, ChatComposer } from "./chat/useChatComposer";
export { SimplyChatPanel } from "./chat/SimplyChatPanel";
export type { SimplyChatPanelProps } from "./chat/SimplyChatPanel";
export { CHAT_CSS, CHAT_STYLE_ID } from "./chat/styles";

// Tipi
export type * from "./types";

// Tema
export { C as SIMPLY_COLORS } from "./theme";
