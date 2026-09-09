"use client";

import { useEffect, useMemo, useState } from "react";
import { claimedProgress } from "@/features/achievements/build-showcase";
import {
  AchievementsShowcaseStyles,
  ShowcaseMedalShelf,
  ShowcasePedestal,
  ShowcasePersonalRecords,
  ShowcasePlaqueRail,
} from "@/features/achievements/showcase-presentation";
import type { AchievementsShowcasePayload } from "@/features/achievements/types";

export function AchievementsShowcase({ payload }: { payload: AchievementsShowcasePayload }) {
  const initialFeaturedId =
    payload.collection.featuredAwardId ?? payload.levelAwards[0]?.id ?? "";
  const [featuredId, setFeaturedId] = useState(initialFeaturedId);

  useEffect(() => {
    const serverFeaturedId =
      payload.collection.featuredAwardId ?? payload.levelAwards[0]?.id ?? "";
    setFeaturedId((current) => {
      if (current && payload.levelAwards.some((award) => award.id === current)) {
        return current;
      }
      return serverFeaturedId;
    });
  }, [payload.collection.featuredAwardId, payload.levelAwards]);

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
      <div className="ach-showcase-root rounded-[20px] px-4 py-8 text-[#f3ead8] sm:px-6">
        <AchievementsShowcaseStyles />
        <p className="text-sm text-[#a89880]">No level awards are configured yet.</p>
      </div>
    );
  }

  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 pb-4 pt-6 text-[#f3ead8] sm:-mx-6 sm:px-6">
      <AchievementsShowcaseStyles />

      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c88968]">
              Achievements
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-[#f8f1e3] sm:text-5xl">
              Bests on the wall. Medals on the shelf.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a89880]">
              Your records, level medals, and finished goals — locked mounts stay
              dark until you earn them.
            </p>
          </div>
          <div className="min-w-[13rem]">
            <div className="flex items-baseline justify-between gap-3 font-mono text-xs text-[#a89880]">
              <span>Claimed</span>
              <span className="text-base text-[#f8f1e3]">
                {claimed}/{total} · {fill}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#3a3128]">
              <div
                className="ach-showcase-fill h-full rounded-full"
                style={{ width: `${fill}%` }}
              />
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 text-right font-mono text-sm text-[#d4c4a4]">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">Level</dt>
                <dd className="mt-1 text-lg font-semibold text-[#f8f1e3]">
                  {payload.collection.level}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">Medals</dt>
                <dd className="mt-1 text-lg font-semibold text-[#f8f1e3]">
                  {payload.collection.unlockedAwards}/{payload.collection.totalAwards}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">Goals</dt>
                <dd className="mt-1 text-lg font-semibold text-[#f8f1e3]">
                  {payload.collection.achievedGoals}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        {payload.truncated.goals || payload.truncated.completions ? (
          <p className="text-sm text-[#a89880]">
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
            onSelect={setFeaturedId}
          />
          <div className="ach-showcase-shelf mx-auto mt-6 h-2.5 max-w-4xl rounded-sm opacity-85" />
          <ShowcasePlaqueRail goals={goals} />
        </section>
      </div>
    </div>
  );
}
