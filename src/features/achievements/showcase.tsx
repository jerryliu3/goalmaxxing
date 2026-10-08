"use client";

import { useMemo, useState } from "react";
import {
  ShowcaseMedalShelf,
  ShowcasePedestal,
  ShowcasePersonalRecords,
} from "@/features/achievements/showcase-presentation";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

export function AchievementsShowcase({ payload }: { payload: AchievementsShowcasePayload }) {
  const serverFeaturedId = useMemo(
    () => payload.collection.featuredAwardId ?? payload.levelAwards[0]?.id ?? "",
    [payload.collection.featuredAwardId, payload.levelAwards]
  );
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<string | null>(null);
  const featuredId =
    selectedFeaturedId &&
    payload.levelAwards.some((award) => award.id === selectedFeaturedId)
      ? selectedFeaturedId
      : serverFeaturedId;

  const featured = useMemo(
    () => payload.levelAwards.find((award) => award.id === featuredId) ?? payload.levelAwards[0],
    [featuredId, payload.levelAwards]
  );

  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 pb-4 pt-6 sm:-mx-6 sm:px-6">
      <div className="space-y-6">
        <header>
          <div className="w-fit">
            <dl className="ach-showcase-stat-muted grid grid-cols-3 gap-8 text-sm">
              <div>
                <dt className="ach-showcase-stat-label type-eyebrow text-[10px]">
                  Level
                </dt>
                <dd className="ach-showcase-stat-value mt-1 type-stat text-lg">
                  {payload.collection.level}
                </dd>
              </div>
              <div>
                <dt className="ach-showcase-stat-label type-eyebrow text-[10px]">
                  Medals
                </dt>
                <dd className="ach-showcase-stat-value mt-1 type-stat text-lg">
                  {payload.collection.unlockedAwards}/{payload.collection.totalAwards}
                </dd>
              </div>
              <div>
                <dt className="ach-showcase-stat-label type-eyebrow text-[10px]">
                  Goals
                </dt>
                <dd className="ach-showcase-stat-value mt-1 type-stat text-lg">
                  {payload.collection.achievedGoals}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        {payload.truncated.goals || payload.truncated.completions ? (
          <p className="ach-showcase-body text-sm">
            Showing a bounded achievements snapshot for this account.
          </p>
        ) : null}

        <ShowcasePersonalRecords records={payload.personalRecords} />

        {featured ? <section
          className="ach-showcase-glass overflow-hidden rounded-[22px] px-4 pb-5 pt-8 sm:px-8"
          aria-label="Trophy showcase"
        >
          <ShowcasePedestal award={featured} />
          <div className="ach-showcase-shelf mx-auto mt-2 h-3 max-w-lg rounded-sm opacity-95" />
          <ShowcaseMedalShelf
            awards={payload.levelAwards}
            featuredId={featuredId}
            onSelect={setSelectedFeaturedId}
          />
        </section> : <p className="text-sm text-muted-foreground">No level medals yet.</p>}
      </div>
    </div>
  );
}
