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
      className="w-full max-w-xs min-w-0"
    />
  );
}
