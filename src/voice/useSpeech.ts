import { useEffect, useRef, useState } from "react";

export interface SpeakOptions { lang?: string; rate?: number; pitch?: number; voiceName?: string }

/**
 * Lettura ad alta voce con la Web Speech API (speechSynthesis), senza server.
 * `speaking` serve a far parlare Simply (mood "talking") mentre legge.
 */
export function useSpeech({ onSpeakingChange }: { onSpeakingChange?: (speaking: boolean) => void } = {}) {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const cb = useRef(onSpeakingChange);
  cb.current = onSpeakingChange;
  const set = (v: boolean) => { setSpeaking(v); cb.current?.(v); };

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  const speak = (text: string, { lang = "it-IT", rate = 1.05, pitch = 1.1, voiceName }: SpeakOptions = {}) => {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = rate; u.pitch = pitch;
    const voice = window.speechSynthesis.getVoices().find((v) => (voiceName ? v.name === voiceName : v.lang.startsWith(lang.slice(0, 2))));
    if (voice) u.voice = voice;
    u.onstart = () => set(true);
    u.onend = () => set(false);
    u.onerror = () => set(false);
    window.speechSynthesis.speak(u);
  };
  const stop = () => { if (supported) window.speechSynthesis.cancel(); set(false); };

  return { supported, speaking, speak, stop };
}
