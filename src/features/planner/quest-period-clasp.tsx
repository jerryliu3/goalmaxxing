"use client";

import { motion, useReducedMotion } from "motion/react";
import type { WorkQuestProgress } from "./work-quest-model";

export function QuestPeriodClasp({ progress }: { progress: WorkQuestProgress }) {
  const still = useReducedMotion();
  const met = progress.completed >= progress.target;
  const beads = Math.min(7, progress.target);
  return <section className="quest-clasp" aria-label="Period target">
    <p className="text-sm">{progress.label}</p>
    <div className="quest-clasp-band" aria-hidden="true">
      <motion.span className="quest-clasp-left" initial={false} animate={{ x: met ? 0 : -7, rotate: met ? 0 : -6 }} transition={{ duration: still ? 0 : 0.45 }} />
      <motion.span className="quest-clasp-right" initial={false} animate={{ x: met ? 0 : 7, rotate: met ? 0 : 6 }} transition={{ duration: still ? 0 : 0.45 }} />
      {Array.from({ length: beads }, (_, index) => <span key={index} className="quest-clasp-bead" data-done={(index + 1) / beads <= progress.completed / progress.target} />)}
      <motion.span className="quest-clasp-buckle" initial={false} animate={{ scale: met ? 1 : 0 }} transition={{ duration: still ? 0 : 0.25, delay: still ? 0 : 0.4 }} />
    </div>
    <p className="text-xs text-muted-foreground">{met ? "Period target met" : `${Math.max(0, progress.target - progress.completed)} more to meet this period's target`}</p>
  </section>;
}
