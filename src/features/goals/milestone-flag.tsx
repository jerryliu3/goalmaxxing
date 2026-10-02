"use client";

import { motion, useReducedMotion } from "motion/react";

/** Pending flags remain visible; earned flags unfurl even after a row remount. */
export function MilestoneFlag({ complete, number, compact = false }: { complete: boolean; number: number; compact?: boolean }) {
  const still = useReducedMotion();
  return <svg width={compact ? 16 : 28} height={compact ? 19 : 32} viewBox="0 0 28 32" className="shrink-0 text-primary" aria-hidden="true" data-milestone-flag={complete ? "earned" : "pending"}>
    <path d="M5 29V3" stroke="currentColor" strokeWidth="1.5" opacity={complete ? 1 : 0.5} />
    <motion.g initial={still ? false : { scaleX: 0.65, opacity: 0.45 }} animate={{ scaleX: complete ? 1 : 0.65, opacity: complete ? 1 : 0.45 }} style={{ transformOrigin: "5px 4px" }} transition={{ duration: still ? 0 : 0.5, ease: [0.22, 0.8, 0.2, 1] }}>
      <path d="M5 4H27L22 12L27 20H5Z" fill="currentColor" />
      <text x="14" y="15" textAnchor="middle" fill="var(--primary-foreground)" fontSize="9">{number}</text>
    </motion.g>
  </svg>;
}
