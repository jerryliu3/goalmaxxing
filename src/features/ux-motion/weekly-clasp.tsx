"use client";

import { motion } from "motion/react";

/** Compact period feedback in the expanded quest, not a lifetime achievement. */
export function WeeklyClasp({ completed, still }: { completed: boolean; still: boolean }) {
  return <section className="motion-study-clasp" aria-label="Weekly target">
    <div className="flex items-center justify-between gap-3 text-sm">
      <span>This week</span><span className="font-mono">{completed ? 3 : 2} / 3</span>
    </div>
    <div className="motion-study-band" data-closed={completed} aria-hidden="true">
      <motion.span className="motion-study-band-left" initial={false}
        animate={{ x: completed ? 0 : -7, rotate: completed ? 0 : -6 }} transition={{ duration: still ? 0 : 0.45, delay: still ? 0 : 0.2 }} />
      <motion.span className="motion-study-band-right" initial={false}
        animate={{ x: completed ? 0 : 7, rotate: completed ? 0 : 6 }} transition={{ duration: still ? 0 : 0.45, delay: still ? 0 : 0.2 }} />
      {[0, 1, 2].map(index => <span key={index} className="motion-study-beat" data-done={index < (completed ? 3 : 2)} />)}
      <motion.i className="motion-study-buckle" initial={false} animate={{ scale: completed ? 1 : 0 }} transition={{ duration: still ? 0 : 0.25, delay: still ? 0 : 0.55 }} />
    </div>
    <p className="mt-2 text-xs text-muted-foreground">{completed ? "Weekly target met. Your recurring goal continues." : "One more day of running to meet this week's target."}</p>
  </section>;
}
