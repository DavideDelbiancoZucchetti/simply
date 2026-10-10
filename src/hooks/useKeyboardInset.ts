import { useEffect, useState } from "react";

/** Quanto la tastiera (o altro) copre il fondo della finestra, in px. 0 se niente. */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;
    const upd = () => {
      const i = Math.round(window.innerHeight - (vv.offsetTop + vv.height));
      setInset(i > 80 ? i : 0); // sotto 80px è solo la barra del browser che si muove
    };
    upd();
    vv.addEventListener("resize", upd);
    vv.addEventListener("scroll", upd);
    return () => { vv.removeEventListener("resize", upd); vv.removeEventListener("scroll", upd); };
  }, []);
  return inset;
}
