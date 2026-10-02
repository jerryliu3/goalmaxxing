"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { subscribeXpRefresh, type XpRefreshRequestDetail } from "@/lib/xp/events";
import { presentCompletionAchievement } from "@/lib/goals/completion-presentation";
import { triggerLightPressFeedback } from "@/lib/feedback/haptics";
import "./completion-feedback.css";

const SPARKS_MS = 950;
const PARENT_MS = 1700;
type Queued = { id: number; detail: XpRefreshRequestDetail };

function Feedback({ detail, onDone }: { detail: XpRefreshRequestDetail; onDone: () => void }) {
  const still = useReducedMotion();
  const [step, setStep] = useState(-1);
  const goals = detail.feedback?.goals ?? [];
  const parents = goals.filter(goal => goal.goalId !== detail.goalId);
  const source = goals.find(goal => goal.goalId === detail.goalId);
  const parent = parents[step];
  useEffect(() => {
    if (still || !source || !detail.sourceRect) return;
    const impact = window.setTimeout(() => triggerLightPressFeedback(20), 342);
    return () => window.clearTimeout(impact);
  }, [detail.sourceRect, source, still]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (still || step >= parents.length - 1) onDone();
      else setStep(value => value + 1);
    }, still ? 4000 : step < 0 ? SPARKS_MS : PARENT_MS);
    return () => window.clearTimeout(timer);
  }, [step, still, parents.length, onDone]);
  const origin = detail.sourceRect;
  const width = Math.min(340, window.innerWidth - 24);
  const left = Math.max(12, Math.min(window.innerWidth - width - 12, origin?.left ?? (window.innerWidth - width) / 2));
  const top = Math.max(12, Math.min(window.innerHeight - 235, (origin?.top ?? 90) + (origin?.height ?? 32) + 12));
  return createPortal(<>
    {!still && step < 0 && source && origin && <div className="completion-stamp-stage" aria-hidden="true" style={{ left: Math.max(12, Math.min(window.innerWidth - 144, origin.left - 30)), top: Math.max(16, origin.top - 4) }}>
      <motion.div className="completion-stamp" initial={{ y: -75, rotateX: -55, rotate: -14, scale: 1.8, opacity: 0 }}
        animate={{ y: [-75, 0, -5, 0], rotateX: [-55, 0, 0, 0], rotate: -7, scale: [1.8, 0.96, 1.05, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.9, times: [0, 0.38, 0.55, 1] }}>DONE</motion.div>
    </div>}
    {(parent || still) && <aside className="completion-parent-feedback" style={{ left, top, width }} aria-label="Completion results">
      <div role="status">
        {(still ? goals : [parent]).map(goal => goal && <motion.div key={goal.goalId} initial={still ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {goal.fromTitle && <p className="text-xs text-muted-foreground">Linked from {goal.fromTitle}</p>}
          <p className="mt-1 font-display text-xl">{goal.title}</p>
          <p className="mt-1 text-sm">{goal.before} → {goal.after}{goal.target > 0 ? ` / ${goal.target}` : ""} · {goal.achieved ? "Goal achieved" : "Progress recorded"}</p>
          {goal.target > 0 && <div className="completion-credit-track" aria-hidden="true"><motion.span initial={still ? false : { scaleX: Math.min(1, goal.before / goal.target) }} animate={{ scaleX: Math.min(1, goal.after / goal.target) }} transition={{ duration: still ? 0 : 0.7, delay: still ? 0 : 0.2 }} /></div>}
        </motion.div>)}
      </div>
      <button type="button" onClick={onDone} className="mt-2 min-h-9 text-xs underline">Dismiss</button>
    </aside>}
  </>, document.body);
}

/** One bounded queue for confirmed local mutations, independent of row remounts. */
export function CompletionFeedbackProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Queued[]>([]);
  const sequence = useRef(0);
  useEffect(() => subscribeXpRefresh(detail => {
    if (detail?.desiredFactState === "absent") {
      // Reversing a linked source may also revoke ancestors in another entry.
      setQueue([]);
    } else if (detail?.feedback?.goals.length) {
      const entry = { id: ++sequence.current, detail };
      setQueue(current => [...current, entry]);
    }
  }), []);
  const active = queue[0];
  // Stable callback prevents unrelated AppShell rerenders from resetting timers.
  const done = useCallback(() => {
    if (!active) return;
    presentCompletionAchievement(active.detail);
    setQueue(current => current.filter(item => item.id !== active.id));
  }, [active]);
  return <>{children}{active && <Feedback key={active.id} detail={active.detail} onDone={done} />}</>;
}
