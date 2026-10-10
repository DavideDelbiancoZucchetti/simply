import { useState } from "react";
import type { ReactNode } from "react";
import type { Mood, PointTarget, PropName } from "../types";
import type { SimplyCompanionProps } from "../companion/SimplyCompanion";

export interface TourStep {
  target: PointTarget;
  text: ReactNode;
  mood?: Mood;
  prop?: PropName | "none";
}

export interface TourStepRenderArgs {
  step: TourStep;
  index: number;
  total: number;
  next: () => void;
  prev: () => void;
  stop: () => void;
}

export interface UseSimplyTourOptions {
  /** Disegna tu il contenuto del fumetto (es. con Tailwind e i18n). */
  renderStep?: (args: TourStepRenderArgs) => ReactNode;
  /** Etichette del rendering predefinito. */
  labels?: { prev?: string; next?: string; done?: string };
  onFinish?: (completed: boolean) => void;
}

/**
 * Tour guidato: Simply indica un elemento dopo l'altro, con avanti/indietro nel fumetto.
 *   const tour = useSimplyTour(steps);
 *   <SimplyCompanion {...director.companion} {...(tour.companion ?? {})} />
 */
export function useSimplyTour(steps: TourStep[], { renderStep, labels, onFinish }: UseSimplyTourOptions = {}) {
  const [index, setIndex] = useState<number | null>(null);
  const active = index !== null && index < steps.length;

  const stop = (completed = false) => { setIndex(null); onFinish?.(completed); };
  const next = () => setIndex((i) => {
    if (i === null) return i;
    if (i + 1 >= steps.length) { onFinish?.(true); return null; }
    return i + 1;
  });
  const prev = () => setIndex((i) => (i === null ? i : Math.max(0, i - 1)));
  const start = (from = 0) => setIndex(Math.max(0, Math.min(from, steps.length - 1)));

  let companion: Partial<SimplyCompanionProps> | null = null;
  if (active) {
    const step = steps[index];
    const args: TourStepRenderArgs = { step, index, total: steps.length, next, prev, stop: () => stop(false) };
    const L = { prev: "Indietro", next: "Avanti", done: "Fine", ...labels };
    const message = renderStep ? renderStep(args) : (
      <div className="simply-tour">
        <div className="simply-tour-text">{step.text}</div>
        <div className="simply-tour-ctrl">
          <span>{index + 1}/{steps.length}</span>
          {index > 0 && <button type="button" onClick={prev}>{L.prev}</button>}
          <button type="button" className="primary" onClick={next}>{index + 1 < steps.length ? L.next : L.done}</button>
        </div>
      </div>
    );
    companion = {
      pointAt: step.target,
      message,
      mood: step.mood ?? "idle",
      prop: step.prop ?? "none",
      pointDuration: null,
      interruptible: true,
      onDismiss: () => stop(false),
      onPointEnd: undefined,
    };
  }

  return { active, index, start, next, prev, stop: () => stop(false), companion };
}
