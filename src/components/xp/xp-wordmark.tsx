"use client";

import { Popover } from "radix-ui";
import { formatNumber, XpMeter } from "@/components/xp/xp-progress-card";
import { useXpProfile } from "@/components/xp/xp-profile-provider";

type XpWordmarkProfile = Parameters<typeof XpMeter>[0]["profile"];

const wordmarkClassName = "type-wordmark text-xl leading-none tracking-tight whitespace-nowrap sm:text-2xl";

export function Wordmark() {
  return <p className={wordmarkClassName}>Goalmaxxing</p>;
}

/**
 * Header wordmark carrying XP: a level chip beside it and the XP bar as its underline.
 * The bar keeps the reward bulge and is the target XP rewards fly to. Tapping opens a
 * small popover with total XP and what's left to level up.
 */
export function XpWordmark() {
  const { profile, rewardSequence } = useXpProfile();
  return profile ? <XpWordmarkMeter profile={profile} rewardSequence={rewardSequence} /> : <Wordmark />;
}

export function XpWordmarkMeter({ profile, rewardSequence }: { profile: XpWordmarkProfile; rewardSequence: number }) {
  const { nextLevel, nextLevelMinXp } = profile;

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Level ${profile.currentLevel} progress`}
        className="-mx-1.5 grid w-fit grid-cols-[auto_auto] items-center gap-x-2 gap-y-2 rounded-xl px-1.5 pt-1.5 pb-1 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/60"
      >
        <span className={wordmarkClassName}>Goalmaxxing</span>
        <XpMeter profile={profile} rewardSequence={rewardSequence} wordmark />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 rounded-xl border border-border bg-popover px-3 py-2 font-mono text-xs text-popover-foreground shadow-[0_8px_24px_rgb(0_0_0/0.1)]"
        >
          <p>{formatNumber(profile.totalXp)} XP</p>
          <p className="mt-0.5 text-muted-foreground">
            {nextLevel === null || nextLevelMinXp === null
              ? "Top level reached"
              : `${formatNumber(Math.max(0, nextLevelMinXp - profile.totalXp))} XP to Level ${nextLevel}`}
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
