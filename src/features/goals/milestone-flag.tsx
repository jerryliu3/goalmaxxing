"use client";

import { motion, useReducedMotion } from "motion/react";

/** Existing milestones mount in their resting state; only changed credit unfurls. */
export function MilestoneFlag({ complete, number }: { complete: boolean; number: number }) {
  const still = useReducedMotion();
  return <svg width="28" height="32" viewBox="0 0 28 32" className="shrink-0 text-primary" aria-hidden="true" data-milestone-flag={complete ? "earned" : "pending"}>
    <path d="M5 29V3" stroke="currentColor" strokeWidth="1.5" opacity={complete ? 1 : 0.3} />
    <motion.g initial={false} animate={{ scaleX: complete ? 1 : 0, opacity: complete ? 1 : 0 }} style={{ transformOrigin: "5px 4px" }} transition={{ duration: still ? 0 : 0.5, ease: [0.22, 0.8, 0.2, 1] }}>
      <path d="M5 4H27L22 12L27 20H5Z" fill="currentColor" />
      <text x="14" y="15" textAnchor="middle" fill="var(--primary-foreground)" fontSize="9">{number}</text>
    </motion.g>
  </svg>;
}
