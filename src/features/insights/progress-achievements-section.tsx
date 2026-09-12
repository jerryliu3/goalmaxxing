"use client";

import { AchievementsShowcase } from "@/features/achievements/showcase";
import { useAchievementsShowcase } from "@/features/achievements/use-achievements-showcase";
import { useXpProfile } from "@/components/xp/xp-profile-provider";
import { Button } from "@/components/ui/button";

export function ProgressAchievementsSection() {
  const { profile } = useXpProfile();
  const { loading, error, payload, reload } = useAchievementsShowcase();

  if (!profile) {
    return null;
  }

  return (
    <section
      id="progress-achievements"
      data-testid="progress-achievements"
      className="scroll-mt-24"
    >
      {loading ? (
        <div className="ach-showcase-root rounded-[20px] px-4 py-10">
          <p className="ach-showcase-body text-sm">Loading achievements...</p>
        </div>
      ) : error || !payload ? (
        <div className="ach-showcase-root rounded-[20px] px-4 py-10">
          <p className="ach-showcase-error text-sm">
            {error ?? "Achievements could not be loaded."}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              void reload();
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <AchievementsShowcase payload={payload} />
      )}
    </section>
  );
}
