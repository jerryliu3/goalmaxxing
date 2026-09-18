"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { MILESTONE_NAMES } from "./milestone-model";

export function MilestoneFlags({ completed, selected, newest, still, onSelect }: {
  completed: readonly boolean[];
  selected: number;
  newest: number | null;
  still: boolean;
  onSelect: (index: number) => void;
}) {
  return <ol className="motion-study-milestones" aria-label="Portfolio milestones">
    {MILESTONE_NAMES.map((name, index) => <li key={name}>
      <button type="button" className="motion-study-stop" aria-pressed={selected === index}
        aria-label={`${name}, ${completed[index] ? "completed" : "not completed"}`} onClick={() => onSelect(index)}>
        <span className="motion-study-flag-space" aria-hidden="true">
          {completed[index] && <motion.span className="motion-study-flagpole"
            initial={still || newest !== index ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: still ? 0 : 0.25 }}>
            <motion.span className="motion-study-flag"
              initial={still || newest !== index ? false : { rotateY: -95, scaleX: 0.1 }}
              animate={{ rotateY: 0, scaleX: 1 }} transition={{ duration: still ? 0 : 0.6, delay: still ? 0 : 0.15, type: "spring", bounce: 0.22 }}>
              {String(index + 1).padStart(2, "0")}
            </motion.span>
          </motion.span>}
        </span>
        <span className="motion-study-stop-dot" data-done={completed[index]} aria-hidden="true">{completed[index] && <Check size={13} />}</span>
        <span className="mt-2 block text-sm">{name}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{completed[index] ? "Complete" : "Not completed"}</span>
      </button>
    </li>)}
  </ol>;
}
