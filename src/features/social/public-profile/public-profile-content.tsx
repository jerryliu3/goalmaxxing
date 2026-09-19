"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import type { PublicProfileBundle } from "@cadence/shared/social/public-profile";
import { UserAvatar } from "@/components/user-avatar";
import { XpProgressCard } from "@/components/xp/xp-progress-card";
import { ProfileMedalShelf } from "@/features/achievements/profile-medal-shelf";
import { InsightsOverallStatsCard } from "@/features/insights/insights-overall-stats-card";
import { ProfileMembershipCard } from "@/features/social/profile-membership-card";
import { ProfilePresenceSection } from "@/features/social/profile-presence";
import { PublicProfileCurrentGoals } from "@/features/social/public-profile/public-profile-current-goals";
import { resolvePublicProfileLabel } from "@/features/social/public-profile/resolve-profile-label";
import { getHeatmapScaleClass } from "@/lib/goals/heatmap";

export function PublicProfileContent({
  bundle,
  selectedYear,
  variant,
  xpEnabled = true,
  headerActions,
  afterPresence,
}: {
  bundle: PublicProfileBundle;
  selectedYear: number;
  variant: "sheet" | "page";
  xpEnabled?: boolean;
  headerActions?: ReactNode;
  afterPresence?: ReactNode;
}) {
  const heatmapRef = useRef<HTMLDivElement | null>(null);
  const title = resolvePublicProfileLabel(bundle.profile);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar
            avatarUrl={bundle.profile.avatarUrl}
            displayName={bundle.profile.displayName}
            username={bundle.profile.username}
            size="lg"
            alt={`${title} avatar`}
          />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold">{title}</p>
            {bundle.profile.username ? (
              <p className="text-sm text-muted-foreground">@{bundle.profile.username}</p>
            ) : null}
          </div>
        </div>
        {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
      </div>

      {bundle.profile.isPrivate ? (
        <p className="text-sm text-muted-foreground">This account is private</p>
      ) : variant === "page" ? (
        <>
          <ProfileMembershipCard
            profile={bundle.profile}
            overallStats={bundle.overallStats}
            currentLevel={bundle.xp?.currentLevel ?? null}
          />
          <ProfilePresenceSection
            growSeries={bundle.growSeries}
            heatmap={bundle.yearHeatmap}
            selectedYear={selectedYear}
          />
          {afterPresence}
          <PublicProfileCurrentGoals goals={bundle.currentGoals} />
        </>
      ) : (
        <>
          {xpEnabled && bundle.xp ? <XpProgressCard profile={bundle.xp} /> : null}
          {xpEnabled ? (
            <ProfileMedalShelf
              achievements={bundle.globalAchievements}
              awardCatalogCount={bundle.awardCatalogCount}
            />
          ) : null}
          <InsightsOverallStatsCard
            heatmapRef={heatmapRef}
            selectedYearStart={new Date(`${selectedYear}-01-01`)}
            selectedYearEnd={new Date(`${selectedYear}-12-31`)}
            values={bundle.yearHeatmap}
            overallCompletion={0}
            overallStats={bundle.overallStats}
            classForValue={(value) => getHeatmapScaleClass(value?.count ?? 0)}
            titleForValue={(value) =>
              `${value?.date ?? "N/A"}: ${value?.count ?? 0} completion${
                (value?.count ?? 0) === 1 ? "" : "s"
              }`
            }
            onDayClick={() => undefined}
            showMoreLink={false}
          />
        </>
      )}
    </div>
  );
}
