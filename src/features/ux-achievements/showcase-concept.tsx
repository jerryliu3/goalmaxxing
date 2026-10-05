"use client";

import { useState } from "react";
import {
  ShowcaseMedalShelf,
  ShowcasePedestal,
  ShowcasePersonalRecords,
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

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-showcase-root ach-showcase-root--study min-h-dvh"
    >
      <div className="space-y-8 pb-4 pt-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ach-showcase-eyebrow text-[10px] font-semibold uppercase tracking-[0.2em]">
              Leading hybrid · A1 + A2 + A4
            </p>
            <h2 className="ach-showcase-heading mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Bests on the wall. Medals on the shelf.
            </h2>
            <p className="ach-showcase-body mt-3 max-w-xl text-sm leading-relaxed">
              Case structure, vault metal, and personal records — locked mounts
              stay dark so the next award stays a surprise.
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
                  {COLLECTION.level}
                </dd>
              </div>
              <div>
                <dt className="ach-showcase-stat-label text-[10px] uppercase tracking-[0.14em]">
                  Medals
                </dt>
                <dd className="ach-showcase-stat-value mt-1 text-lg font-semibold">
                  {COLLECTION.unlockedAwards}/{COLLECTION.totalAwards}
                </dd>
              </div>
              <div>
                <dt className="ach-showcase-stat-label text-[10px] uppercase tracking-[0.14em]">
                  Goals
                </dt>
                <dd className="ach-showcase-stat-value mt-1 text-lg font-semibold">
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
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}
