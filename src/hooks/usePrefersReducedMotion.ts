import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** true se il sistema chiede "riduci animazioni" (si aggiorna in tempo reale). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(QUERY).matches);
  useEffect(() => {
    const mq = typeof window !== "undefined" ? window.matchMedia?.(QUERY) : undefined;
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}
