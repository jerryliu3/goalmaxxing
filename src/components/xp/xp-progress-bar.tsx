"use client";

import { Popover } from "radix-ui";
import { XpMeter } from "@/components/xp/xp-progress-card";
import { useXpProfile } from "@/components/xp/xp-profile-provider";

const formatXp = (value: number) => new Intl.NumberFormat("en-US").format(value);

/**
 * Header XP: a 36px pill with the level and a thick bar. Exact numbers stay out of the
 * header; tapping the pill opens a small popover with total XP and what's left to level up.
 */
export function XpProgressBar() {
  const { profile, rewardSequence } = useXpProfile();

  if (!profile) {
    return null;
  }

  const toNextLevel = profile.nextLevelMinXp === null ? null : Math.max(0, profile.nextLevelMinXp - profile.totalXp);

  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`Level ${profile.currentLevel} progress`}
        className="flex h-9 w-full max-w-xs min-w-0 items-center gap-3 rounded-full border border-border bg-background px-3.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50 data-[state=open]:bg-muted/60 sm:min-w-[15rem] [&>[role=progressbar]]:flex-1"
      >
        <XpMeter profile={profile} rewardSequence={rewardSequence} compact />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 rounded-xl border border-border bg-popover px-3 py-2 font-mono text-xs text-popover-foreground shadow-[0_8px_24px_rgb(0_0_0/0.1)]"
        >
          <p>{formatXp(profile.totalXp)} XP</p>
          <p className="mt-0.5 text-muted-foreground">
            {toNextLevel === null
              ? "Top level reached"
              : `${formatXp(toNextLevel)} XP to Level ${profile.nextLevel ?? profile.currentLevel + 1}`}
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
