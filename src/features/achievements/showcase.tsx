"use client";

import { useMemo, useState } from "react";
import { claimedProgress } from "@/features/achievements/build-showcase";
import {
  ShowcaseMedalShelf,
  ShowcasePedestal,
  ShowcasePersonalRecords,
  ShowcasePlaqueRail,
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

  const { claimed, total, fill } = claimedProgress(payload.collection);
  const goals = payload.achievedGoals.map((goal) => ({
    id: goal.goalId,
    title: goal.title,
    achievedOn: goal.achievedOn,
    rewardText: goal.rewardText,
    category: goal.category,
  }));

  if (!featured) {
    return (
      <div className="ach-showcase-root rounded-[20px] px-4 py-8 sm:px-6">
        <p className="ach-showcase-body text-sm">No level awards are configured yet.</p>
      </div>
    );
  }

  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 pb-4 pt-6 sm:-mx-6 sm:px-6">
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ach-showcase-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em]">
              Achievements
            </p>
            <h1 className="ach-showcase-heading mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Bests on the wall. Medals on the shelf.
            </h1>
            <p className="ach-showcase-body mt-3 max-w-xl text-sm leading-relaxed">
              Your records, level medals, and finished goals — locked mounts stay
              dark until you earn them.
            </p>
          </div>
          <div className="min-w-[13rem]">
            <div className="ach-showcase-body flex items-baseline justify-between gap-3 font-mono text-xs">
              <span>Claimed</span>
              <span className="ach-showcase-stat-value text-base">
                {claimed}/{total} · {fill}%
              </span>
            </div>
            <div className="ach-showcase-track mt-2 h-2 overflow-hidden rounded-full">
              <div
                className="ach-showcase-fill h-full rounded-full"
                style={{ width: `${fill}%` }}
              />
            </div>
            <dl className="ach-showcase-stat-muted mt-4 grid grid-cols-3 gap-3 text-right font-mono text-sm">
              <div>
                <dt className="ach-showcase-stat-label text-[10px] uppercase tracking-[0.14em]">
                  Level
                </dt>
                <dd className="ach-showcase-stat-value mt-1 text-lg font-semibold">
                  {payload.collection.level}
                </dd>
              </div>
              <div>
                <dt className="ach-showcase-stat-label text-[10px] uppercase tracking-[0.14em]">
                  Medals
                </dt>
                <dd className="ach-showcase-stat-value mt-1 text-lg font-semibold">
                  {payload.collection.unlockedAwards}/{payload.collection.totalAwards}
                </dd>
              </div>
              <div>
                <dt className="ach-showcase-stat-label text-[10px] uppercase tracking-[0.14em]">
                  Goals
                </dt>
                <dd className="ach-showcase-stat-value mt-1 text-lg font-semibold">
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

        <section
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
          <div className="ach-showcase-shelf mx-auto mt-6 h-2.5 max-w-4xl rounded-sm opacity-85" />
          <ShowcasePlaqueRail goals={goals} />
        </section>
      </div>
    </div>
  );
}
