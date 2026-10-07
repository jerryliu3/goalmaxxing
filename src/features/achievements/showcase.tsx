"use client";

import { PrismMedal } from "./prism/prism-medal";
import { cardFinish } from "./prism/materials";

import { useMemo, useState } from "react";
import { claimedProgress } from "@/features/achievements/build-showcase";
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

  const { claimed, total, fill } = claimedProgress(payload.collection);

  return (
    <div className="ach-showcase-root -mx-4 rounded-[20px] px-4 pb-4 pt-6 sm:-mx-6 sm:px-6">
      <div className="space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="ach-showcase-heading type-hero text-4xl tracking-tight sm:text-5xl">
              Bests on the wall. Medals on the shelf.
            </h1>
            <p className="ach-showcase-body mt-3 max-w-xl text-sm leading-relaxed">
              Your records, level medals, and finished goals — unstruck blanks wait
              for your next level.
            </p>
          </div>
          <div className="min-w-[13rem]">
            <div className="ach-showcase-body flex items-baseline justify-between gap-3 type-figure text-xs">
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
            <dl className="ach-showcase-stat-muted mt-4 grid grid-cols-3 gap-3 text-right text-sm">
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
        {payload.achievedGoals.length ? (
          <section aria-label="Goal-finish medals">
            <h3 className="type-title text-xl">Finished goals</h3>
            <ul className="mt-4 grid gap-4 sm:grid-cols-3">
              {payload.achievedGoals.map(goal => (
                <li key={goal.goalId} className="ach-showcase-mount flex flex-col items-center rounded-xl border p-4 text-center">
                  <PrismMedal finish={cardFinish(goal.material, goal.color)} numeral="✓" goal size={72} />
                  <h4 className="mt-3 font-medium">{goal.title}</h4>
                  {goal.rewardText ? <p className="mt-1 text-sm text-muted-foreground">{goal.rewardText}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
