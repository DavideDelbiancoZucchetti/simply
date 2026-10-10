import type { SVGProps } from "react";

export type IconName = "clip" | "mic" | "send" | "stop" | "trash" | "expand" | "collapse" | "close" | "dictate" | "wave";

/** Icone del pannello chat predefinito (tratto, 24×24, currentColor). */
export function Icon({ name }: { name: IconName }) {
  const p: SVGProps<SVGSVGElement> = {
    width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
  };
  switch (name) {
    case "clip": return <svg {...p}><path d="M21 11.5l-8.6 8.6a5.2 5.2 0 0 1-7.4-7.4l8.6-8.6a3.5 3.5 0 0 1 4.9 4.9l-8.6 8.6a1.8 1.8 0 0 1-2.5-2.5l7.9-7.9" /></svg>;
    case "mic": return <svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>;
    case "send": return <svg {...p} fill="currentColor" stroke="none"><path d="M3.4 20.4l17.4-7.5a1 1 0 0 0 0-1.8L3.4 3.6a1 1 0 0 0-1.4 1.1L4 11l9 1-9 1-2 6.3a1 1 0 0 0 1.4 1.1z" /></svg>;
    case "stop": return <svg {...p} fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2.5" /></svg>;
    case "trash": return <svg {...p}><path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" /></svg>;
    case "expand": return <svg {...p}><path d="M9 4H6a2 2 0 0 0-2 2v3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M4 15v3a2 2 0 0 0 2 2h3" /></svg>;
    case "collapse": return <svg {...p}><path d="M9 4v3a2 2 0 0 1-2 2H4M15 4v3a2 2 0 0 0 2 2h3M20 15h-3a2 2 0 0 0-2 2v3M4 15h3a2 2 0 0 1 2 2v3" /></svg>;
    case "close": return <svg {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
    case "wave": return <svg {...p}><path d="M3 12h1.5M6.5 8v8M10 5v14M13.5 9v6M17 7v10M20.5 11v2" /></svg>;
    case "dictate": return <svg {...p}><path d="M4 6h10M4 10h7M4 14h5" /><path d="M17 8.5a2.5 2.5 0 0 1 5 0v4a2.5 2.5 0 0 1-5 0zM15 12.5a4.5 4.5 0 0 0 9 0M19.5 17v3" /></svg>;
  }
}
