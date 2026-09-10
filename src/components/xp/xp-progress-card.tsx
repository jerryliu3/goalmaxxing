"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { bandForTotalXp } from "@/lib/xp/altitude";
import { cn } from "@/lib/utils";

interface XpProfileSummary {
  totalXp: number;
  currentLevel: number;
  currentLevelMinXp: number;
  nextLevel: number | null;
  nextLevelMinXp: number | null;
}

function formatNumber(value: number) {
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

function XpProgressCardContents({ profile }: { profile: XpProfileSummary }) {
  const band = bandForTotalXp(profile.totalXp);
  const progressPercent = resolveProgressPercent(profile);
  const levelLabel = `Lv ${profile.currentLevel} · ${formatNumber(profile.totalXp)} XP`;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{band.name}</span>
        <span className="font-mono text-xs text-muted-foreground">{levelLabel}</span>
      </div>
      <Progress
        value={progressPercent}
        className="h-2 bg-muted"
        data-xp-reward-target="true"
      />
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
  rewardSequence: _rewardSequence = 0,
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
        <XpProgressCardContents profile={profile} />
      </Link>
    );
  }

  return (
    <div className={resolvedClassName} aria-label={ariaLabel}>
      <XpProgressCardContents profile={profile} />
    </div>
  );
}
