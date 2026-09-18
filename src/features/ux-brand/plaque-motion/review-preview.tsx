"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clampPlaqueTarget } from "@/features/goals/card-material/creation-plaque-target";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";
import { FragmentPlaque } from "./fragment-plaque";
import { REVIEW_BEATS, type PlaquePhase } from "./study-model";
import styles from "./plaque-motion.module.css";

export function ReviewPreview({ fields, target, onTargetChange, still, onContinue }: {
  fields: GoalCreationFields; target: number; onTargetChange: (target: number) => void; still: boolean; onContinue: () => void;
}) {
  const [phase, setPhase] = useState<PlaquePhase>("whole");
  useEffect(() => {
    if (still || !(phase in REVIEW_BEATS)) return;
    const beat = REVIEW_BEATS[phase as keyof typeof REVIEW_BEATS];
    const timer = window.setTimeout(() => setPhase(beat.next), beat.delay);
    return () => window.clearTimeout(timer);
  }, [phase, still]);
  const shownPhase = still ? "ghost" : phase;
  return <section className={styles.review} aria-label="Goal review prototype">
    <div className={styles.reviewCopy}>
      <p className={styles.eyebrow}>04 / Review your goal</p>
      <h2>A little at a time.<br />Entirely yours.</h2>
      <p>Each completion brings one piece back.</p>
      <label className={styles.targetLabel} htmlFor="plaque-target">Completions to earn this plaque</label>
      <div className={styles.targetControls}>
        <Button variant="outline" aria-label="One fewer completion" disabled={target <= 1} onClick={() => { setPhase("ghost"); onTargetChange(target - 1); }}>−</Button>
        <input id="plaque-target" type="number" min={1} max={20} value={target} onChange={event => {
          setPhase("ghost"); onTargetChange(clampPlaqueTarget(event.target.valueAsNumber));
        }} />
        <Button variant="outline" aria-label="One more completion" disabled={target >= 20} onClick={() => { setPhase("ghost"); onTargetChange(target + 1); }}>+</Button>
      </div>
      <p className={styles.targetReadout} role="status">{target} {target === 1 ? "completion · 1 piece" : `completions · ${target} pieces`}</p>
      <div className={styles.actions}>
        <Button onClick={onContinue}>Preview final completion</Button>
        <Button variant="ghost" disabled={still} onClick={() => setPhase("whole")}>Replay sharding</Button>
      </div>
    </div>
    <div className={styles.reviewStage}>
      <FragmentPlaque fields={fields} target={target} phase={shownPhase} still={still} />
      <p className={styles.caption}>{shownPhase === "ghost" ? "Your next chapter starts here." : "A whole worth working toward."}</p>
    </div>
  </section>;
}
