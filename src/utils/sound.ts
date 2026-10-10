let dingCtx: AudioContext | null = null;

/** Il "ding" del campanello, sintetizzato con Web Audio (nessun file audio). */
export function playDing(): void {
  try {
    const Ctx: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    if (!dingCtx || dingCtx.state === "closed") dingCtx = new Ctx();
    const ctx = dingCtx;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    ([[1568, 0.22], [2093, 0.12], [3136, 0.05]] as const).forEach(([f, v]) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(v, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      o.connect(g).connect(ctx.destination);
      o.start(now);
      o.stop(now + 1.35);
    });
  } catch {
    /* audio non disponibile: pazienza */
  }
}
