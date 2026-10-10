/** Mescola un colore #rrggbb con un altro (t = 0..1). Usato per le sfumature del mantello. */
export function mixHex(a: string, b: string, t: number): string {
  const parse = (h: string) => {
    const x = h.replace("#", "");
    const f = x.length === 3 ? x.split("").map((c) => c + c).join("") : x;
    return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16));
  };
  const A = parse(a), B = parse(b);
  if (A.some(Number.isNaN) || B.some(Number.isNaN)) return a;
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
