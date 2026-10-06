"use client";

import { useState } from "react";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import { MedalMark, PlaqueMark, TIER_METAL } from "@/features/ux-achievements/medals";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  formatAwardDate,
  formatGoalDate,
  type SeedLevelAward,
} from "@/features/ux-achievements/seed";
import { GAZETTEER } from "@cadence/shared/brand/gazetteer";

const concept = getAchievementConcept("case");

export function CaseConcept() {
  const [featuredId, setFeaturedId] = useState<string>(COLLECTION.newestId);
  const featured =
    LEVEL_AWARDS.find((award) => award.id === featuredId) ?? LEVEL_AWARDS[3];
  const unlocked = LEVEL_AWARDS.filter((award) => award.unlockedAt);
  const locked = LEVEL_AWARDS.filter((award) => !award.unlockedAt);

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-case-root min-h-dvh text-[#241c14]"
    >
      <style>{`
        .ach-case-root {
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(154, 79, 44, 0.14), transparent 55%),
            linear-gradient(180deg, #f7efe0 0%, ${GAZETTEER.page} 40%, #ebe0cb 100%);
        }
        .ach-case-glass {
          background: linear-gradient(180deg, rgba(248, 241, 227, 0.92), rgba(243, 234, 216, 0.88));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.65),
            inset 0 -18px 40px rgba(36, 28, 20, 0.06);
        }
        .ach-case-shelf {
          background: linear-gradient(180deg, #c4a882 0%, #a88962 45%, #8f7250 100%);
        }
        .ach-case-pedestal {
          background:
            radial-gradient(ellipse at 50% 0%, rgba(212, 168, 75, 0.35), transparent 60%),
            linear-gradient(180deg, #f8f1e3, #efe4cf);
        }
        @keyframes ach-case-rise {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ach-case-hero {
          animation: ach-case-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
      <div className="space-y-8 pb-4 pt-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: GAZETTEER.muted }}
            >
              Your trophy case
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Proof on the shelf.
            </h2>
          </div>
          <dl className="grid grid-cols-3 gap-4 text-right font-mono text-sm">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em]" style={{ color: GAZETTEER.muted }}>
                Level
              </dt>
              <dd className="mt-1 text-xl font-semibold">{COLLECTION.level}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em]" style={{ color: GAZETTEER.muted }}>
                Medals
              </dt>
              <dd className="mt-1 text-xl font-semibold">
                {COLLECTION.unlockedAwards}/{COLLECTION.totalAwards}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.14em]" style={{ color: GAZETTEER.muted }}>
                Goals
              </dt>
              <dd className="mt-1 text-xl font-semibold">{COLLECTION.achievedGoals}</dd>
            </div>
          </dl>
        </header>

        <section
          className="ach-case-glass overflow-hidden rounded-[20px] border px-4 pb-5 pt-8 sm:px-8"
          style={{ borderColor: GAZETTEER.rule }}
          aria-label="Trophy case"
        >
          <div
            className="ach-case-pedestal mx-auto max-w-md rounded-[16px] border px-6 py-8 text-center"
            style={{ borderColor: GAZETTEER.rule }}
          >
            <div key={featured.id} className="ach-case-hero flex flex-col items-center">
              <MedalMark
                level={featured.level}
                tier={featured.tier}
                locked={!featured.unlockedAt}
                size={128}
                markId={`hero-${featured.id}`}
              />
              <p
                className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: TIER_METAL[featured.tier].rim }}
              >
                {featured.unlockedAt ? "On display" : "Empty mount"}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                {featured.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
                {featured.description}
              </p>
              <p className="mt-3 font-mono text-xs" style={{ color: GAZETTEER.muted }}>
                {formatAwardDate(featured.unlockedAt)}
              </p>
            </div>
          </div>

          <div className="ach-case-shelf mx-auto mt-2 h-3 max-w-lg rounded-sm opacity-90" />

          <div className="mt-8">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: GAZETTEER.muted }}
            >
              Medal shelf · XP levels
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...unlocked, ...locked].map((award) => (
                <ShelfMedal
                  key={award.id}
                  award={award}
                  selected={award.id === featuredId}
                  onSelect={() => setFeaturedId(award.id)}
                />
              ))}
            </ul>
          </div>

          <div className="ach-case-shelf mx-auto mt-6 h-2.5 max-w-4xl rounded-sm opacity-80" />

          <div className="mt-8">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: GAZETTEER.muted }}
            >
              Plaque rail · finished goals
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GOAL_ACHIEVEMENTS.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-start gap-3 rounded-[12px] border px-3 py-3"
                  style={{
                    borderColor: GAZETTEER.rule,
                    background: GAZETTEER.paper,
                  }}
                >
                  <PlaqueMark category={goal.category} />
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold leading-tight tracking-tight">
                      {goal.title}
                    </p>
                    <p className="mt-1 font-mono text-[11px]" style={{ color: GAZETTEER.muted }}>
                      {formatGoalDate(goal.achievedOn)}
                    </p>
                    {goal.rewardText ? (
                      <p className="mt-1 text-xs leading-snug" style={{ color: GAZETTEER.mutedDeep }}>
                        {goal.rewardText}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}

function ShelfMedal({
  award,
  selected,
  onSelect,
}: {
  award: SeedLevelAward;
  selected: boolean;
  onSelect: () => void;
}) {
  const locked = !award.unlockedAt;
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full flex-col items-center rounded-[14px] border px-2 py-4 transition"
        style={{
          borderColor: selected ? GAZETTEER.stamp : GAZETTEER.rule,
          background: selected ? "#fff8ec" : GAZETTEER.paper,
          boxShadow: selected ? `0 0 0 1px ${GAZETTEER.stamp}` : undefined,
        }}
      >
        <MedalMark
          level={award.level}
          tier={award.tier}
          locked={locked}
          size={72}
          markId={`shelf-${award.id}`}
        />
        <span className="mt-2 font-mono text-[11px]" style={{ color: GAZETTEER.mutedDeep }}>
          Lv {award.level}
        </span>
        <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em]" style={{ color: GAZETTEER.muted }}>
          {locked ? "Mount" : "Earned"}
        </span>
      </button>
    </li>
  );
}
