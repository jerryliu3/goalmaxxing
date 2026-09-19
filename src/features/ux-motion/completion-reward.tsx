"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { progressionForTotalXp } from "@/lib/xp/progression";

export const SAMPLE_XP_BEFORE = 320;
export const SAMPLE_XP_REWARD = 24;
export const SAMPLE_XP_AFTER = SAMPLE_XP_BEFORE + SAMPLE_XP_REWARD;

const sparkOffsets = [
  { x: -64, y: -38, rotate: -18 },
  { x: -39, y: -70, rotate: -8 },
  { x: -8, y: -84, rotate: 6 },
  { x: 27, y: -74, rotate: 16 },
  { x: 58, y: -42, rotate: 28 },
  { x: 75, y: -8, rotate: 42 },
];

function progressPercent(totalXp: number) {
  const progression = progressionForTotalXp(totalXp);
  if (progression.nextLevelMinXp === null) return 100;
  return ((totalXp - progression.currentLevelMinXp) /
    (progression.nextLevelMinXp - progression.currentLevelMinXp)) * 100;
}

function AnimatedXpValue({ active, still }: { active: boolean; still: boolean }) {
  const [value, setValue] = React.useState(SAMPLE_XP_BEFORE);

  React.useEffect(() => {
    if (!active || still) {
      setValue(active ? SAMPLE_XP_AFTER : SAMPLE_XP_BEFORE);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / 900);
      setValue(Math.round(SAMPLE_XP_BEFORE + SAMPLE_XP_REWARD * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, still]);

  return <span className="font-mono text-xs tabular-nums">{value} XP</span>;
}

export function CompletionXpBar({ active, still }: { active: boolean; still: boolean }) {
  const before = progressPercent(SAMPLE_XP_BEFORE);
  const after = progressPercent(SAMPLE_XP_AFTER);
  const progression = progressionForTotalXp(SAMPLE_XP_AFTER);
  return <div className="motion-study-xp-bar" aria-label="Experience progress">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">XP · Level {progression.currentLevel}</span>
      <AnimatedXpValue active={active} still={still} />
    </div>
    <div className="motion-study-xp-track" role="progressbar" aria-label="XP toward next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={active ? after : before}>
      <motion.span initial={false} animate={{ scaleX: active ? after / 100 : before / 100 }} transition={{ duration: still ? 0 : 0.9, ease: [0.22, 0.8, 0.2, 1] }} />
    </div>
    <span className="mt-1 block text-[11px] text-muted-foreground">Complete the goal to send {SAMPLE_XP_REWARD} XP upward.</span>
  </div>;
}

export function CompletionXpFlight({ active, still }: { active: boolean; still: boolean }) {
  return <AnimatePresence>
    {active && !still && <div className="motion-study-xp-flight" aria-hidden="true">
      {sparkOffsets.map((offset, index) => <motion.span key={index} className="motion-study-xp-star" initial={{ x: 0, y: 0, scale: 0.35, opacity: 0 }} animate={{ x: offset.x, y: offset.y, scale: [0.35, 1.25, 0.7], opacity: [0, 1, 0.2] }} transition={{ duration: 1.15, delay: index * 0.07, ease: [0.22, 0.8, 0.2, 1] }} style={{ "--star-rotate": `${offset.rotate}deg` } as React.CSSProperties}>✦</motion.span>)}
    </div>}
  </AnimatePresence>;
}

export function CompletionStamp({ active, still }: { active: boolean; still: boolean }) {
  return <AnimatePresence>
    {active && <motion.div className="motion-study-stamp" initial={still ? false : { y: -90, rotateX: -58, rotateZ: -14, scale: 1.35, opacity: 0 }} animate={{ y: 0, rotateX: 0, rotateZ: -7, scale: 1, opacity: 1 }} transition={{ duration: still ? 0 : 0.56, ease: [0.18, 0.82, 0.2, 1] }} aria-label="Completed stamp">COMPLETE<span>18 SEP · +{SAMPLE_XP_REWARD} XP</span></motion.div>}
  </AnimatePresence>;
}
