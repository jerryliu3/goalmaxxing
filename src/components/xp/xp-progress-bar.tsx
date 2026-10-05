"use client";

import { XpProgressCard } from "@/components/xp/xp-progress-card";
import { useXpProfile } from "@/components/xp/xp-profile-provider";

export function XpProgressBar() {
  const { profile, rewardSequence } = useXpProfile();

  if (!profile) {
    return null;
  }

  return (
    <XpProgressCard
      profile={profile}
      rewardSequence={rewardSequence}
      className="h-9 w-full max-w-xs min-w-0 flex-row items-center gap-3 rounded-full border-border bg-background px-3.5 py-0 sm:min-w-[15rem] sm:px-3.5 sm:py-0 [&>[role=progressbar]]:flex-1"
    />
  );
}
