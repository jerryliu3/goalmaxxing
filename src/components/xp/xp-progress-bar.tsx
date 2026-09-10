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
      href="/achievements"
      ariaLabel="Open achievements and XP details"
      className="max-w-[7.5rem] min-w-0 sm:max-w-none"
    />
  );
}
