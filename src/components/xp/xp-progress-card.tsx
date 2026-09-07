"use client";

import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import { bandForTotalXp } from "@/lib/xp/altitude";

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

function resolveProgressLabel(profile: XpProfileSummary) {
  const currentLevelMin = profile.currentLevelMinXp;
  const nextLevelMin = profile.nextLevelMinXp;
  if (nextLevelMin === null) {
    return "Top level unlocked";
  }
  return `${formatNumber(profile.totalXp - currentLevelMin)} / ${formatNumber(
    nextLevelMin - currentLevelMin
  )} XP to Lv ${profile.nextLevel}`;
}

interface XpProgressCardContentsProps {
  profile: XpProfileSummary;
  compact?: boolean;
}

function XpProgressCardContents({
  profile,
  compact = false,
}: XpProgressCardContentsProps) {
  const band = bandForTotalXp(profile.totalXp);
  const progressPercent = resolveProgressPercent(profile);
  const progressLabel = resolveProgressLabel(profile);
  const levelProgress = formatNumber(profile.totalXp - profile.currentLevelMinXp);
  const levelLabel = `Lv ${profile.currentLevel} · ${levelProgress} XP`;

  if (compact) {
    return (
      <>
        <div className="flex items-baseline justify-end gap-2">
          <span className="text-[11px] font-medium text-muted-foreground">{band.name}</span>
          <span className="text-xs font-semibold tracking-tight">{levelLabel}</span>
        </div>
        <Progress
          value={progressPercent}
          className="h-1.5 w-28 bg-muted sm:w-36"
          data-xp-reward-target="true"
        />
        <span className="sr-only">{progressLabel}</span>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{band.name}</span>
        <span className="text-xs text-muted-foreground">{levelLabel}</span>
      </div>
      <Progress
        value={progressPercent}
        className="h-2 bg-muted"
        data-xp-reward-target="true"
      />
      <span className="text-[11px] text-muted-foreground">{progressLabel}</span>
    </>
  );
}

interface XpProgressCardProps {
  profile: XpProfileSummary;
  rewardSequence?: number;
  href?: string;
  className?: string;
  ariaLabel?: string;
  compact?: boolean;
}

const baseClassName =
  "group flex min-w-[12rem] flex-col gap-1 rounded-lg border border-border/70 bg-background/70 px-3 py-2 transition-colors";
const compactClassName =
  "group flex min-w-0 flex-col items-end gap-1 rounded-md px-1 py-0.5 transition-colors";

export function XpProgressCard({
  profile,
  rewardSequence: _rewardSequence = 0,
  href,
  className,
  ariaLabel,
  compact = false,
}: XpProgressCardProps) {
  const resolvedClassName = `${compact ? compactClassName : baseClassName} ${
    href ? "hover:border-primary/40" : ""
  } ${className ?? ""}`.trim();

  if (href) {
    return (
      <Link href={href} className={resolvedClassName} aria-label={ariaLabel}>
        <XpProgressCardContents profile={profile} compact={compact} />
      </Link>
    );
  }

  return (
    <div className={resolvedClassName} aria-label={ariaLabel}>
      <XpProgressCardContents profile={profile} compact={compact} />
    </div>
  );
}
