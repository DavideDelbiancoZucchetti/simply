import { useEffect } from "react";

/**
 * Inserisce (o aggiorna) un <style> nel <head>. Aggiorna sempre il contenuto:
 * dopo un hot reload il vecchio <style> resterebbe con le regole vecchie.
 */
export function useInjectStyles(id: string, css: string, enabled = true): void {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    if (el.textContent !== css) el.textContent = css;
  }, [id, css, enabled]);
}
