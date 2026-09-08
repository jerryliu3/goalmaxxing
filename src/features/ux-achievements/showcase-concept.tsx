"use client";

import { useState } from "react";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import {
  MedalMark,
  PlaqueMark,
  SealMark,
  TIER_METAL,
} from "@/features/ux-achievements/medals";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  PERSONAL_RECORDS,
  formatAwardDate,
  formatGoalDate,
  type SeedLevelAward,
} from "@/features/ux-achievements/seed";
import { GAZETTEER } from "@/lib/brand/gazetteer";

const concept = getAchievementConcept("showcase");

const RECORD_ACCENT: Record<(typeof PERSONAL_RECORDS)[number]["accent"], string> = {
  stamp: GAZETTEER.stampLight,
  sage: "#A8B8AE",
  gain: "#8FBA7A",
  copper: "#E8B89A",
  ink: GAZETTEER.rule,
};

export function ShowcaseConcept() {
  const [featuredId, setFeaturedId] = useState(COLLECTION.newestId);
  const featured =
    LEVEL_AWARDS.find((award) => award.id === featuredId) ?? LEVEL_AWARDS[3];
  const featuredLocked = !featured.unlockedAt;
  const unlocked = LEVEL_AWARDS.filter((award) => award.unlockedAt);
  const locked = LEVEL_AWARDS.filter((award) => !award.unlockedAt);
  const claimed = COLLECTION.unlockedAwards + COLLECTION.achievedGoals;
  const total = COLLECTION.totalAwards + GOAL_ACHIEVEMENTS.length;
  const fill = Math.round((claimed / total) * 100);

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-showcase-root min-h-dvh text-[#f3ead8]"
    >
      <style>{`
        .ach-showcase-root {
          background:
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(154, 79, 44, 0.28), transparent 52%),
            radial-gradient(ellipse 50% 35% at 90% 20%, rgba(212, 168, 75, 0.12), transparent 45%),
            linear-gradient(180deg, #1a1510 0%, #241c14 42%, #18140f 100%);
        }
        .ach-showcase-glass {
          background: linear-gradient(180deg, #2c241c 0%, #1f1914 100%);
          border: 1px solid #3f3429;
          box-shadow:
            inset 0 1px 0 rgba(248, 241, 227, 0.08),
            inset 0 -24px 48px rgba(0, 0, 0, 0.35);
        }
        .ach-showcase-shelf {
          background: linear-gradient(180deg, #6a5338 0%, #4a3a28 45%, #32281c 100%);
        }
        .ach-showcase-pedestal {
          background:
            radial-gradient(ellipse at 50% 0%, rgba(212, 168, 75, 0.28), transparent 58%),
            linear-gradient(165deg, #3a2f24, #2a221a);
        }
        .ach-showcase-record {
          background:
            radial-gradient(ellipse at 20% 0%, rgba(240, 215, 138, 0.12), transparent 55%),
            linear-gradient(160deg, #3a2f24, #2a221a);
        }
        .ach-showcase-mount {
          background:
            radial-gradient(ellipse at 30% 20%, rgba(240, 215, 138, 0.14), transparent 55%),
            linear-gradient(160deg, #3a2f24, #2a221a);
        }
        .ach-showcase-mount-locked {
          background: linear-gradient(160deg, #1c1712, #14100c);
        }
        .ach-showcase-fill {
          background: linear-gradient(90deg, ${GAZETTEER.stamp}, ${GAZETTEER.stampLight} 55%, #d4a84b);
        }
        @keyframes ach-showcase-rise {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ach-showcase-hero {
          animation: ach-showcase-rise 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>

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

        <section aria-label="Personal records">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a64]">
              Personal records
            </p>
            <p className="font-mono text-[11px] text-[#8a7a64]">Yours alone · no league shame</p>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAL_RECORDS.map((record) => (
              <li
                key={record.id}
                className="ach-showcase-record rounded-[16px] border px-4 py-5"
                style={{ borderColor: "#5a4a38" }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: RECORD_ACCENT[record.accent] }}
                >
                  {record.label}
                </p>
                <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-[#f8f1e3]">
                  {record.value}
                </p>
                <p className="mt-2 text-xs leading-snug text-[#a89880]">{record.hint}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="ach-showcase-glass overflow-hidden rounded-[22px] px-4 pb-5 pt-8 sm:px-8"
          aria-label="Trophy showcase"
        >
          <div
            className="ach-showcase-pedestal mx-auto max-w-md rounded-[16px] border px-6 py-8 text-center"
            style={{ borderColor: "#5a4a38" }}
          >
            <div key={featured.id} className="ach-showcase-hero flex flex-col items-center">
              {featuredLocked ? (
                <SealMark locked tier={featured.tier} size={88} />
              ) : (
                <MedalMark
                  level={featured.level}
                  tier={featured.tier}
                  size={128}
                  markId={`showcase-hero-${featured.id}`}
                />
              )}
              <p
                className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{
                  color: featuredLocked ? "#8a7a64" : TIER_METAL[featured.tier].glow,
                }}
              >
                {featuredLocked ? "Locked" : "On display"}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#f8f1e3]">
                {featuredLocked ? "Still ahead" : featured.title}
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#a89880]">
                {featuredLocked
                  ? "Earn the next altitude before this mount opens. The medal stays hidden until then."
                  : featured.description}
              </p>
              <p className="mt-3 font-mono text-xs text-[#8a7a64]">
                {featuredLocked ? "Locked" : formatAwardDate(featured.unlockedAt)}
              </p>
            </div>
          </div>

          <div className="ach-showcase-shelf mx-auto mt-2 h-3 max-w-lg rounded-sm opacity-95" />

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a64]">
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

          <div className="ach-showcase-shelf mx-auto mt-6 h-2.5 max-w-4xl rounded-sm opacity-85" />

          <div className="mt-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a64]">
              Plaque rail · finished goals
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {GOAL_ACHIEVEMENTS.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-start gap-3 rounded-[12px] border px-3 py-3"
                  style={{
                    borderColor: "#5a4a38",
                    background: "linear-gradient(160deg, #32281f, #241c14)",
                  }}
                >
                  <PlaqueMark category={goal.category} />
                  <div className="min-w-0">
                    <p className="font-display text-base font-semibold leading-tight tracking-tight text-[#f8f1e3]">
                      {goal.title}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-[#8a7a64]">
                      {formatGoalDate(goal.achievedOn)}
                    </p>
                    {goal.rewardText ? (
                      <p className="mt-1 text-xs leading-snug text-[#a89880]">
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
        aria-label={locked ? "Locked award" : `Lv ${award.level}`}
        className={`relative flex min-h-[8.5rem] w-full flex-col items-center justify-center rounded-[14px] border px-2 py-4 transition ${
          locked ? "ach-showcase-mount-locked" : "ach-showcase-mount"
        }`}
        style={{
          borderColor: selected ? GAZETTEER.stampLight : locked ? "#2e261e" : "#5a4a38",
          boxShadow: selected ? `0 0 0 1px ${GAZETTEER.stampLight}` : undefined,
        }}
      >
        {locked ? (
          <>
            <span
              className="pointer-events-none absolute inset-x-3 top-3 h-px"
              style={{ background: "#3a3128" }}
              aria-hidden
            />
            <SealMark locked tier={award.tier} size={52} />
            <span className="mt-3 text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">
              Locked
            </span>
          </>
        ) : (
          <>
            <MedalMark
              level={award.level}
              tier={award.tier}
              size={72}
              markId={`showcase-shelf-${award.id}`}
            />
            <span className="mt-2 font-mono text-[11px] text-[#d4c4a4]">
              Lv {award.level}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[#8a7a64]">
              Earned
            </span>
          </>
        )}
      </button>
    </li>
  );
}
