"use client";

import { useState } from "react";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import { MedalMark, PlaqueMark, TIER_METAL } from "@/features/ux-achievements/medals";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  PERSONAL_RECORDS,
  formatAwardDate,
  formatGoalDate,
} from "@/features/ux-achievements/seed";
import { GAZETTEER } from "@/lib/brand/gazetteer";

const concept = getAchievementConcept("records");

const ACCENT: Record<(typeof PERSONAL_RECORDS)[number]["accent"], string> = {
  stamp: GAZETTEER.stamp,
  sage: GAZETTEER.sage,
  gain: GAZETTEER.gain,
  copper: GAZETTEER.colRust,
  ink: GAZETTEER.ink,
};

export function RecordsConcept() {
  const [expandedId, setExpandedId] = useState<string | null>(COLLECTION.newestId);

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-records-root min-h-dvh text-[#241c14]"
    >
      <style>{`
        .ach-records-root {
          background:
            radial-gradient(ellipse 70% 40% at 10% 0%, rgba(74, 103, 64, 0.1), transparent 50%),
            linear-gradient(180deg, #f6eee0 0%, ${GAZETTEER.page} 45%, #ebe1cd 100%);
        }
        .ach-records-tile {
          background: linear-gradient(165deg, #fffaf0, ${GAZETTEER.paper});
        }
      `}</style>
      <div className="space-y-10 pb-4 pt-6">
        <header className="max-w-3xl">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: GAZETTEER.muted }}
          >
            Records + Awards
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Bests first. Medals second.
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
            Duolingo’s 2023 split without the owl: Personal Records give early
            pride and near-term targets; Awards stay rare and collectible.
          </p>
        </header>

        <section aria-label="Personal records">
          <div className="flex items-baseline justify-between gap-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: GAZETTEER.muted }}
            >
              Personal records
            </p>
            <p className="font-mono text-[11px]" style={{ color: GAZETTEER.muted }}>
              Yours alone · no league shame
            </p>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONAL_RECORDS.map((record) => (
              <li
                key={record.id}
                className="ach-records-tile rounded-[16px] border px-4 py-5"
                style={{ borderColor: GAZETTEER.rule }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: ACCENT[record.accent] }}
                >
                  {record.label}
                </p>
                <p className="mt-3 font-mono text-4xl font-semibold tracking-tight">
                  {record.value}
                </p>
                <p className="mt-2 text-xs leading-snug" style={{ color: GAZETTEER.mutedDeep }}>
                  {record.hint}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Awards">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: GAZETTEER.muted }}
          >
            Awards · level mounts
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LEVEL_AWARDS.map((award) => {
              const locked = !award.unlockedAt;
              const open = expandedId === award.id;
              return (
                <li key={award.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : award.id)}
                    aria-expanded={open}
                    className="flex w-full flex-col items-center rounded-[14px] border px-2 py-4 text-left"
                    style={{
                      borderColor: open ? GAZETTEER.stamp : GAZETTEER.rule,
                      background: GAZETTEER.paper,
                    }}
                  >
                    <MedalMark
                      level={award.level}
                      tier={award.tier}
                      locked={locked}
                      size={68}
                      markId={`records-${award.id}`}
                    />
                    <span className="mt-2 font-mono text-[11px]" style={{ color: GAZETTEER.mutedDeep }}>
                      Lv {award.level}
                    </span>
                    <span
                      className="mt-0.5 text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: locked ? GAZETTEER.muted : TIER_METAL[award.tier].rim }}
                    >
                      {locked ? "Locked" : "Earned"}
                    </span>
                    {open ? (
                      <span className="mt-3 block w-full border-t pt-3 text-center text-xs leading-snug" style={{ borderColor: GAZETTEER.rule, color: GAZETTEER.mutedDeep }}>
                        {award.description}
                        <span className="mt-1 block font-mono text-[10px]" style={{ color: GAZETTEER.muted }}>
                          {formatAwardDate(award.unlockedAt)}
                        </span>
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <p
            className="mt-8 text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: GAZETTEER.muted }}
          >
            Awards · finished goals
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {GOAL_ACHIEVEMENTS.map((goal) => (
              <li
                key={goal.id}
                className="flex items-start gap-3 rounded-[12px] border px-3 py-3"
                style={{ borderColor: GAZETTEER.rule, background: GAZETTEER.paper }}
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
                    <p className="mt-1 text-xs" style={{ color: GAZETTEER.mutedDeep }}>
                      {goal.rewardText}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}
