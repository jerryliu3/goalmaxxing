"use client";

import { useState } from "react";
import {
  AchievementsShowcaseStyles,
  ShowcaseMedalShelf,
  ShowcasePedestal,
  ShowcasePersonalRecords,
  ShowcasePlaqueRail,
} from "@/features/achievements/showcase-presentation";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  PERSONAL_RECORDS,
} from "@/features/ux-achievements/seed";

const concept = getAchievementConcept("showcase");

export function ShowcaseConcept() {
  const [featuredId, setFeaturedId] = useState<string>(COLLECTION.newestId);
  const featured =
    LEVEL_AWARDS.find((award) => award.id === featuredId) ?? LEVEL_AWARDS[3];
  const claimed = COLLECTION.unlockedAwards + COLLECTION.achievedGoals;
  const total = COLLECTION.totalAwards + GOAL_ACHIEVEMENTS.length;
  const fill = Math.round((claimed / total) * 100);
  const goals = GOAL_ACHIEVEMENTS.map((goal) => ({
    id: goal.id,
    title: goal.title,
    achievedOn: goal.achievedOn,
    rewardText: goal.rewardText,
    category: goal.category,
  }));

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-showcase-root min-h-dvh text-[#f3ead8]"
    >
      <AchievementsShowcaseStyles />

      <div className="space-y-8 pb-4 pt-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c88968]">
              Leading hybrid · A1 + A2 + A4
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-[#f8f1e3] sm:text-5xl">
              Bests on the wall. Medals on the shelf.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a89880]">
              Case structure, vault metal, and personal records — locked mounts
              stay dark so the next award stays a surprise.
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
                <dd className="mt-1 text-lg font-semibold text-[#f8f1e3]">{COLLECTION.level}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">Medals</dt>
                <dd className="mt-1 text-lg font-semibold text-[#f8f1e3]">
                  {COLLECTION.unlockedAwards}/{COLLECTION.totalAwards}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">Goals</dt>
                <dd className="mt-1 text-lg font-semibold text-[#f8f1e3]">
                  {COLLECTION.achievedGoals}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <ShowcasePersonalRecords records={PERSONAL_RECORDS} />

        <section
          className="ach-showcase-glass overflow-hidden rounded-[22px] px-4 pb-5 pt-8 sm:px-8"
          aria-label="Trophy showcase"
        >
          <ShowcasePedestal award={featured} headingLevel="h3" />
          <div className="ach-showcase-shelf mx-auto mt-2 h-3 max-w-lg rounded-sm opacity-95" />
          <ShowcaseMedalShelf
            awards={LEVEL_AWARDS}
            featuredId={featuredId}
            onSelect={setFeaturedId}
          />
          <div className="ach-showcase-shelf mx-auto mt-6 h-2.5 max-w-4xl rounded-sm opacity-85" />
          <ShowcasePlaqueRail goals={goals} />
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}
