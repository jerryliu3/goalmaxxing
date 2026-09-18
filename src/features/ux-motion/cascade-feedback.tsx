"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Check, Link2 } from "lucide-react";
import type { CompletionState } from "./completion-model";

export function CascadeFeedback({ state, still, onFinish }: {
  state: CompletionState;
  still: boolean;
  onFinish: () => void;
}) {
  const credits = state.receipt?.linked ?? [];
  const active = state.phase === "cascade" ? credits[state.activeIndex] : null;
  return <>
    <AnimatePresence mode="wait">
      {active && !still && <motion.aside
        key={active.goalId}
        className="motion-study-cascade"
        aria-label="Linked goal receiving credit"
        initial={{ y: 16, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -12, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2 }}
      >
        <div className="motion-study-thread" aria-hidden="true"><span /></div>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Link2 size={14} /> Linked from {active.fromTitle}</span>
          <span>{state.activeIndex + 1} / {credits.length}</span>
        </div>
        <h3 className="mt-3 font-display text-2xl">{active.title}</h3>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-mono text-sm">{active.before} → {active.after} / {active.target}</span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="inline-flex items-center gap-1.5 text-sm text-primary">
            {active.achieved && <Check size={15} />}{active.achieved ? "Goal achieved" : "Progress added"}
          </motion.span>
        </div>
        <div className="motion-study-credit-track" aria-hidden="true">
          <motion.span initial={{ scaleX: active.before / active.target }} animate={{ scaleX: active.after / active.target }} transition={{ delay: 0.45, duration: 0.45 }} />
        </div>
        <button type="button" className="mt-3 min-h-9 text-xs text-muted-foreground underline" onClick={onFinish}>Skip animation</button>
      </motion.aside>}
    </AnimatePresence>
    {state.phase === "settled" && credits.length > 0 && <details className="mt-3 rounded-lg border border-border bg-background px-3 py-2" open={still || undefined}>
      <summary className="cursor-pointer text-sm">{credits.length} linked goals updated · view results</summary>
      <ol className="mt-3 space-y-3">
        {credits.map(credit => <li key={credit.goalId} className="flex items-start gap-2 text-sm">
          <ArrowDown size={14} className="mt-1 shrink-0 text-primary" aria-hidden />
          <span><strong className="font-medium">{credit.title}</strong><span className="block text-muted-foreground">{credit.after} / {credit.target} · {credit.achieved ? "Goal achieved" : "Progress added"}</span></span>
        </li>)}
      </ol>
    </details>}
  </>;
}
