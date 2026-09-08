"use client";

import { useMemo, useState } from "react";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import {
  CompletionRings,
  MedalMark,
  PlaqueMark,
} from "@/features/ux-achievements/medals";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  formatAwardDate,
  formatGoalDate,
} from "@/features/ux-achievements/seed";
import { GAZETTEER } from "@/lib/brand/gazetteer";

const concept = getAchievementConcept("rings");

type RingFilter = "awards" | "goals" | "level" | null;

export function RingsConcept() {
  const [filter, setFilter] = useState<RingFilter>(null);
  const awardsPct = COLLECTION.unlockedAwards / COLLECTION.totalAwards;
  const goalsPct = 1;
  const levelPct = COLLECTION.levelProgress;

  const inventory = useMemo(() => {
    if (filter === "goals") {
      return { mode: "goals" as const, items: GOAL_ACHIEVEMENTS };
    }
    if (filter === "level") {
      return {
        mode: "awards" as const,
        items: LEVEL_AWARDS.filter((award) => award.unlockedAt),
        caption: `Level ${COLLECTION.level} · ${Math.round(levelPct * 100)}% to next`,
      };
    }
    return {
      mode: "awards" as const,
      items: LEVEL_AWARDS,
      caption: `${COLLECTION.unlockedAwards} of ${COLLECTION.totalAwards} awards`,
    };
  }, [filter, levelPct]);

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-rings-root min-h-dvh text-[#241c14]"
    >
      <style>{`
        .ach-rings-root {
          background:
            radial-gradient(ellipse 55% 45% at 50% 18%, rgba(154, 79, 44, 0.12), transparent 60%),
            linear-gradient(180deg, #f8f1e3 0%, ${GAZETTEER.page} 50%, #ebe0cb 100%);
        }
        @keyframes ach-rings-settle {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .ach-rings-stage {
          animation: ach-rings-settle 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
      `}</style>
      <div className="space-y-10 pb-4 pt-6">
        <header className="mx-auto max-w-xl text-center">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: GAZETTEER.muted }}
          >
            Completion glance
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Close the rings.
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
            Apple Fitness’s lesson without the watch skin: one composition of
            completion, then the inventory. Tap a ring to filter.
          </p>
        </header>

        <section
          className="ach-rings-stage mx-auto flex max-w-lg flex-col items-center"
          aria-label="Achievement rings"
        >
          <CompletionRings
            awardsPct={awardsPct}
            goalsPct={goalsPct}
            levelPct={levelPct}
            active={filter}
            size={240}
          />
          <ul className="mt-6 grid w-full grid-cols-3 gap-2">
            <RingChip
              label="Awards"
              value={`${COLLECTION.unlockedAwards}/${COLLECTION.totalAwards}`}
              color={GAZETTEER.stamp}
              pressed={filter === "awards"}
              onClick={() => setFilter((c) => (c === "awards" ? null : "awards"))}
            />
            <RingChip
              label="Goals"
              value={`${COLLECTION.achievedGoals}`}
              color={GAZETTEER.gain}
              pressed={filter === "goals"}
              onClick={() => setFilter((c) => (c === "goals" ? null : "goals"))}
            />
            <RingChip
              label="Level"
              value={`${Math.round(levelPct * 100)}%`}
              color={GAZETTEER.sage}
              pressed={filter === "level"}
              onClick={() => setFilter((c) => (c === "level" ? null : "level"))}
            />
          </ul>
        </section>

        <section aria-label="Filtered inventory">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: GAZETTEER.muted }}
          >
            {filter === "goals"
              ? "Goal finishes"
              : filter === "level"
                ? "Level progress"
                : filter === "awards"
                  ? "Award mounts"
                  : "Full collection"}
          </p>
          {inventory.mode === "goals" ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {GOAL_ACHIEVEMENTS.map((goal) => (
                <li
                  key={goal.id}
                  className="flex items-start gap-3 rounded-[12px] border px-3 py-3"
                  style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}
                >
                  <PlaqueMark category={goal.category} />
                  <div>
                    <p className="font-display text-base font-semibold tracking-tight">
                      {goal.title}
                    </p>
                    <p className="mt-1 font-mono text-[11px]" style={{ color: GAZETTEER.muted }}>
                      {formatGoalDate(goal.achievedOn)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <>
              {"caption" in inventory && inventory.caption ? (
                <p className="mt-2 font-mono text-xs" style={{ color: GAZETTEER.muted }}>
                  {inventory.caption}
                </p>
              ) : null}
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {inventory.items.map((award) => {
                  const locked = !award.unlockedAt;
                  return (
                    <li
                      key={award.id}
                      className="flex flex-col items-center rounded-[14px] border px-2 py-4"
                      style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}
                    >
                      <MedalMark
                        level={award.level}
                        tier={award.tier}
                        locked={locked}
                        size={64}
                        markId={`rings-${award.id}`}
                      />
                      <span className="mt-2 font-mono text-[11px]" style={{ color: GAZETTEER.mutedDeep }}>
                        Lv {award.level}
                      </span>
                      <span className="mt-0.5 text-[10px]" style={{ color: GAZETTEER.muted }}>
                        {formatAwardDate(award.unlockedAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}

function RingChip({
  label,
  value,
  color,
  pressed,
  onClick,
}: {
  label: string;
  value: string;
  color: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={pressed}
        onClick={onClick}
        className="w-full rounded-[12px] border px-2 py-3 text-center"
        style={{
          borderColor: pressed ? color : GAZETTEER.rule,
          background: pressed ? `${color}18` : GAZETTEER.paper,
        }}
      >
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>
          {label}
        </span>
        <span className="mt-1 block font-mono text-lg font-semibold">{value}</span>
      </button>
    </li>
  );
}
