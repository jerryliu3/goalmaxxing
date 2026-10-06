"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { progressionForTotalXp } from "@/lib/xp/progression";
import { cn } from "@/lib/utils";

interface XpProfileSummary {
  totalXp: number;
  currentLevel: number;
  currentLevelMinXp: number;
  nextLevel: number | null;
  nextLevelMinXp: number | null;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function resolveProgressPercent(profile: XpProfileSummary) {
  const currentLevelMin = profile.currentLevelMinXp;
  const nextLevelMin = profile.nextLevelMinXp;
  if (nextLevelMin === null || nextLevelMin <= currentLevelMin) {
    return 100;
  }
  return Math.max(
    0,
    Math.min(
      ((profile.totalXp - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100,
      100
    )
  );
}

/**
 * Animated level label and bar. `compact` (the header pill) shows only the level and a
 * thicker bar; exact XP lives in the header's popover.
 */
export function XpMeter({ profile, rewardSequence, compact = false }: { profile: XpProfileSummary; rewardSequence: number; compact?: boolean }) {
  const still = useReducedMotion();
  const [displayXp, setDisplayXp] = useState(profile.totalXp);
  const current = useRef(profile.totalXp);
  useEffect(() => {
    if (still) { current.current = profile.totalXp; setDisplayXp(profile.totalXp); return; }
    const controls = animate(current.current, profile.totalXp, { duration: 0.95, ease: "easeInOut",
      onUpdate: value => { current.current = value; setDisplayXp(Math.round(value)); } });
    return () => controls.stop();
  }, [profile.totalXp, still]);
  const display = { totalXp: displayXp, ...progressionForTotalXp(displayXp) };
  const progressPercent = resolveProgressPercent(display);
  const levelLabel = compact ? `Lv ${display.currentLevel}` : `Lv ${display.currentLevel} · ${formatNumber(displayXp)} XP`;

  return (
    <>
      <span className="flex shrink-0 items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{levelLabel}</span>
      </span>
      <motion.span key={rewardSequence} initial={false} animate={!still && rewardSequence > 0 ? { scaleY: [1, 1.65, 1] } : { scaleY: 1 }} transition={{ duration: 0.95, times: [0, 0.35, 1] }}
        role="progressbar" aria-label="XP toward next level" aria-valuemin={0} aria-valuemax={100}
        aria-valuenow={resolveProgressPercent(profile)} aria-valuetext={`Level ${profile.currentLevel}, ${profile.totalXp} XP`}
        className={cn("relative block overflow-hidden rounded-full bg-muted", compact ? "h-2.5 flex-1" : "h-2")} data-xp-reward-target="true">
        <span className="block size-full origin-left rounded-full bg-primary" style={{ transform: `scaleX(${progressPercent / 100})` }} />
      </motion.span>
    </>
  );
}

interface XpProgressCardProps {
  profile: XpProfileSummary;
  rewardSequence?: number;
  href?: string;
  className?: string;
  ariaLabel?: string;
}

const baseClassName =
  "group flex min-w-0 flex-col gap-1 rounded-lg border border-border/70 bg-background/70 px-2 py-1.5 text-left transition-colors sm:min-w-[12rem] sm:px-3 sm:py-2";

export function XpProgressCard({
  profile,
  rewardSequence = 0,
  href,
  className,
  ariaLabel,
}: XpProgressCardProps) {
  const resolvedClassName = cn(
    baseClassName,
    href && "hover:border-primary/40",
    className
  );

  if (href) {
    return (
      <Link href={href} className={resolvedClassName} aria-label={ariaLabel}>
        <XpMeter profile={profile} rewardSequence={rewardSequence} />
      </Link>
    );
  }

  return (
    <div className={resolvedClassName} aria-label={ariaLabel}>
      <XpMeter profile={profile} rewardSequence={rewardSequence} />
    </div>
  );
}
