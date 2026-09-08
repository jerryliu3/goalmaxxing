"use client";

import { useState } from "react";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import { SealMark, TIER_METAL } from "@/features/ux-achievements/medals";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  formatAwardDate,
  formatGoalDate,
  type SeedGoalAchievement,
  type SeedLevelAward,
} from "@/features/ux-achievements/seed";
import { GAZETTEER, GAZETTEER_CATEGORY_COLORS } from "@/lib/brand/gazetteer";

const concept = getAchievementConcept("vault");

type VaultItem =
  | { kind: "award"; award: SeedLevelAward }
  | { kind: "goal"; goal: SeedGoalAchievement };

export function VaultConcept() {
  const cells: VaultItem[] = [
    ...LEVEL_AWARDS.map((award) => ({ kind: "award" as const, award })),
    ...GOAL_ACHIEVEMENTS.map((goal) => ({ kind: "goal" as const, goal })),
  ];
  const [activeKey, setActiveKey] = useState("award:award-level-8");
  const active = cells.find((cell) => cellKey(cell) === activeKey) ?? cells[3];
  const claimed = COLLECTION.unlockedAwards + COLLECTION.achievedGoals;
  const total = COLLECTION.totalAwards + GOAL_ACHIEVEMENTS.length;
  const fill = Math.round((claimed / total) * 100);

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-vault-root min-h-dvh text-[#f3ead8]"
    >
      <style>{`
        .ach-vault-root {
          background:
            radial-gradient(ellipse 70% 45% at 50% 0%, rgba(154, 79, 44, 0.22), transparent 50%),
            linear-gradient(180deg, #1a1510 0%, #241c14 45%, #18140f 100%);
        }
        .ach-vault-door {
          background: linear-gradient(180deg, #2c241c 0%, #1f1914 100%);
          border: 1px solid #3f3429;
        }
        .ach-vault-cell-open {
          background:
            radial-gradient(ellipse at 30% 20%, rgba(240, 215, 138, 0.18), transparent 55%),
            linear-gradient(160deg, #3a2f24, #2a221a);
        }
        .ach-vault-cell-shut {
          background: linear-gradient(160deg, #1c1712, #14100c);
        }
        .ach-vault-fill {
          background: linear-gradient(90deg, ${GAZETTEER.stamp}, ${GAZETTEER.stampLight} 55%, #d4a84b);
        }
        @keyframes ach-vault-glow {
          from { opacity: 0.4; }
          to { opacity: 1; }
        }
        .ach-vault-lit {
          animation: ach-vault-glow 420ms ease-out both;
        }
      `}</style>
      <div className="space-y-8 pb-4 pt-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c88968]">
              Private vault
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight text-[#f8f1e3] sm:text-5xl">
              Sealed until earned.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a89880]">
              Locked compartments stay dark. Unlocks light the metal. The door
              fill is how much of the vault you have claimed.
            </p>
          </div>
          <div className="min-w-[12rem]">
            <div className="flex items-baseline justify-between gap-3 font-mono text-xs text-[#a89880]">
              <span>Claimed</span>
              <span className="text-base text-[#f8f1e3]">
                {claimed}/{total} · {fill}%
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#3a3128]">
              <div className="ach-vault-fill h-full rounded-full" style={{ width: `${fill}%` }} />
            </div>
          </div>
        </header>

        <section className="ach-vault-door rounded-[22px] p-4 sm:p-6" aria-label="Award vault">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cells.map((cell) => {
              const key = cellKey(cell);
              const open = isOpen(cell);
              const selected = key === activeKey;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setActiveKey(key)}
                    aria-pressed={selected}
                    className={`relative flex min-h-[9.5rem] w-full flex-col items-center justify-center rounded-[16px] border px-3 py-4 transition ${
                      open ? "ach-vault-cell-open" : "ach-vault-cell-shut"
                    } ${selected ? "ach-vault-lit" : ""}`}
                    style={{
                      borderColor: selected
                        ? GAZETTEER.stampLight
                        : open
                          ? "#5a4a38"
                          : "#2e261e",
                    }}
                  >
                    {cell.kind === "award" ? (
                      <>
                        <SealMark locked={!open} tier={cell.award.tier} size={52} />
                        <span className="mt-3 font-mono text-xs text-[#d4c4a4]">
                          Lv {cell.award.level}
                        </span>
                        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">
                          {open ? "Unsealed" : "Sealed"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className="grid size-12 place-items-center rounded-full"
                          style={{
                            background: open
                              ? GAZETTEER_CATEGORY_COLORS[cell.goal.category]
                              : "#2a221a",
                            border: `1px solid ${open ? "transparent" : "#3a3128"}`,
                          }}
                          aria-hidden
                        >
                          {open ? (
                            <svg width="18" height="18" viewBox="0 0 18 18">
                              <path
                                d="M4 9.5 L7.2 12.5 L14 5.5"
                                fill="none"
                                stroke={GAZETTEER.paper}
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          ) : (
                            <span className="size-1.5 rounded-full bg-[#5c4e3f]" />
                          )}
                        </span>
                        <span className="mt-3 line-clamp-2 text-center text-xs leading-snug text-[#d4c4a4]">
                          {cell.goal.title}
                        </span>
                        <span className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[#8a7a64]">
                          Goal
                        </span>
                      </>
                    )}
                    {!open ? (
                      <span
                        className="pointer-events-none absolute inset-x-3 top-3 h-px"
                        style={{ background: "#3a3128" }}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div
            className="mt-6 rounded-[16px] border px-5 py-5"
            style={{ borderColor: "#4a3c2e", background: "#1c1712" }}
          >
            {active.kind === "award" ? (
              <InspectionAward award={active.award} />
            ) : (
              <InspectionGoal goal={active.goal} />
            )}
          </div>
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}

function cellKey(cell: VaultItem) {
  return cell.kind === "award" ? `award:${cell.award.id}` : `goal:${cell.goal.id}`;
}

function isOpen(cell: VaultItem) {
  return cell.kind === "award" ? Boolean(cell.award.unlockedAt) : true;
}

function InspectionAward({ award }: { award: SeedLevelAward }) {
  const open = Boolean(award.unlockedAt);
  return (
    <div className="flex flex-wrap items-start gap-5">
      <SealMark locked={!open} tier={award.tier} size={64} />
      <div className="min-w-0 flex-1">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: open ? TIER_METAL[award.tier].face : "#8a7a64" }}
        >
          {open ? "Unsealed award" : "Still sealed"}
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#f8f1e3]">
          {award.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#a89880]">{award.description}</p>
        <p className="mt-3 font-mono text-xs text-[#8a7a64]">
          {formatAwardDate(award.unlockedAt)}
        </p>
      </div>
    </div>
  );
}

function InspectionGoal({ goal }: { goal: SeedGoalAchievement }) {
  return (
    <div>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: GAZETTEER_CATEGORY_COLORS[goal.category] }}
      >
        Goal certificate
      </p>
      <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#f8f1e3]">
        {goal.title}
      </h3>
      {goal.rewardText ? (
        <p className="mt-2 text-sm leading-relaxed text-[#a89880]">{goal.rewardText}</p>
      ) : null}
      <p className="mt-3 font-mono text-xs text-[#8a7a64]">{formatGoalDate(goal.achievedOn)}</p>
    </div>
  );
}
