import type { Mood, PropName } from "../types";
import { C } from "../theme";

/** Coriandoli della trombetta: [dx, dy, colore, forma]. */
export const CONFETTI: ReadonlyArray<readonly [number, number, string, "r" | "c"]> = [
  [-28, -30, C.gold, "r"], [-12, -44, C.teal, "c"], [4, -40, C.purpleLight, "r"], [14, -26, C.coral, "c"],
  [16, -10, C.gold, "r"], [-20, -14, C.purpleLight, "c"], [-4, -26, C.coral, "r"], [10, -46, C.teal, "r"],
];


// Nuvolette del teletrasporto: [dx, dy, dimensione, tipo]
export const PUFF: ReadonlyArray<readonly [number, number, number, "c" | "s"]> = [
  [-36, -8, 18, "c"], [-22, -32, 14, "c"], [2, -42, 17, "c"], [26, -30, 14, "c"], [38, -4, 18, "c"],
  [24, 18, 13, "c"], [-24, 18, 13, "c"], [-44, -30, 7, "s"], [46, -26, 7, "s"], [0, 30, 6, "s"],
];


export const PROPS: readonly PropName[] = ["calendar", "book", "magnifier", "chart", "key", "lightbulb", "envelope", "wrench", "coffee", "confetti", "flag", "ok", "gift", "pumpkin", "egg", "mic", "ponder"];

// Oggetto di default per mood (sovrascrivibile con la prop `prop`)
export const DEFAULT_PROP: Partial<Record<Mood, PropName>> = { thinking: "ponder", news: "flag", success: "ok", error: "wrench" };

// Sopracciglia per espressione
export const BROWS: Record<string, readonly [string, string]> = {
  normal:    ["M70 82Q78 76 86 81", "M114 81Q122 76 130 82"],
  happy:     ["M70 82Q78 76 86 81", "M114 81Q122 76 130 82"],
  love:      ["M70 80Q78 74 86 79", "M114 79Q122 74 130 80"],
  worried:   ["M70 79Q78 80 87 85", "M113 85Q122 80 130 79"],
  sad:       ["M70 85Q78 82 86 77", "M114 77Q122 82 130 85"],
  surprised: ["M70 76Q78 68 86 74", "M114 74Q122 68 130 76"],
  confused:  ["M70 83L86 81", "M114 75Q122 68 130 76"],
  sleepy:    ["M71 86Q78 84 85 86", "M115 86Q122 84 129 86"],
  laughing:  ["M70 80Q78 73 86 78", "M114 78Q122 73 130 80"],
  thinking:  ["M70 78Q78 72 86 77", "M114 83Q122 81 130 83"],
  dizzy:     ["M70 81Q78 85 86 80", "M114 80Q122 85 130 81"],
};
export const FACE_MOODS: readonly Mood[] = ["sad", "surprised", "love", "confused", "sleepy", "laughing", "dizzy"];

// Occhi a spirale (stordito / KO)
export function spiralPath(cx: number, cy: number, r = 9, turns = 2.4): string {
  let d = "";
  for (let i = 0; i <= 44; i++) {
    const t = i / 44, a = t * turns * 2 * Math.PI, rr = t * r;
    d += `${i ? "L" : "M"}${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }
  return d;
}
export const SPIRAL_L = spiralPath(80, 98);
export const SPIRAL_R = spiralPath(120, 98);
export const ORBIT_STAR = "M100 51l1.9 4.1 4.4.5-3.3 3 .9 4.4-3.9-2.3-3.9 2.3.9-4.4-3.3-3 4.4-.5Z";

export type Pose = "rest" | "hold" | "raise" | "lens" | "book" | "ok" | "chin";
export const PROP_POSE: Record<PropName, Pose> = {
  gift: "hold", pumpkin: "hold", egg: "hold",
  calendar: "hold", book: "book", chart: "hold", envelope: "hold", wrench: "hold", coffee: "hold",
  flag: "raise", key: "raise", lightbulb: "raise", confetti: "raise", magnifier: "lens", ok: "ok", mic: "raise", ponder: "chin",
};

export const POSES: Record<Pose, { d: string; hand: readonly [number, number] | null; cls: string }> = {
  rest:  { d: "M156 128Q169 142 162 155", hand: [160, 158], cls: "" },
  hold:  { d: "M156 128Q174 132 176 144", hand: [177, 147], cls: "simply-arm-hold" },
  raise: { d: "M156 128Q180 126 176 100", hand: [177, 94],  cls: "simply-arm-raise" },
  ok:    { d: "M156 128Q180 126 176 102", hand: null,       cls: "simply-arm-raise" }, // la mano la disegna il gesto
  chin:  { d: "M156 128Q162 148 127 135", hand: null,       cls: "simply-arm-hold" },  // 🤔 mano al mento (la disegna "ponder")
  lens:  { d: "M156 128Q158 142 144 131", hand: [141, 127], cls: "simply-arm-lens" },
  book:  { d: "M156 128Q162 146 147 153", hand: [145, 155], cls: "" },
};



