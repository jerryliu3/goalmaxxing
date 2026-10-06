"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AchievementChrome, ConceptNote } from "@/features/ux-achievements/chrome";
import { MedalMark, PlaqueMark, TIER_METAL } from "@/features/ux-achievements/medals";
import { getAchievementConcept } from "@/features/ux-achievements/model";
import {
  COLLECTION,
  GOAL_ACHIEVEMENTS,
  LEVEL_AWARDS,
  formatAwardDate,
  formatGoalDate,
} from "@/features/ux-achievements/seed";
import { GAZETTEER, GAZETTEER_CATEGORY_COLORS } from "@cadence/shared/brand/gazetteer";

const concept = getAchievementConcept("gallery");

export function GalleryConcept() {
  const medalRailRef = useRef<HTMLUListElement>(null);
  const certRailRef = useRef<HTMLUListElement>(null);
  const [activeMedal, setActiveMedal] = useState<string>(COLLECTION.newestId);
  const medals = LEVEL_AWARDS;
  const active = medals.find((item) => item.id === activeMedal) ?? medals[3];

  return (
    <AchievementChrome
      concept={concept}
      stageClassName="ach-gallery-root min-h-dvh text-[#241c14]"
    >
      <style>{`
        .ach-gallery-root {
          background:
            linear-gradient(180deg, #efe6d4 0%, ${GAZETTEER.page} 35%, #e7dcc8 100%);
        }
        .ach-gallery-rail {
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
        }
        .ach-gallery-rail::-webkit-scrollbar { display: none; }
        .ach-gallery-poster {
          scroll-snap-align: start;
          background:
            linear-gradient(165deg, #fffaf0 0%, #f3ead8 55%, #e8dcc4 100%);
        }
        .ach-gallery-matte {
          background:
            radial-gradient(ellipse at 40% 25%, rgba(255,255,255,0.55), transparent 55%),
            linear-gradient(180deg, #f8f1e3, #efe4cf);
        }
        .ach-gallery-cert {
          scroll-snap-align: start;
        }
        @keyframes ach-gallery-in {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .ach-gallery-caption {
          animation: ach-gallery-in 360ms ease-out both;
        }
      `}</style>
      <div className="space-y-10 pb-4 pt-6">
        <header className="max-w-3xl">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: GAZETTEER.muted }}
          >
            Awards library
          </p>
          <h2 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Hang what you earned.
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
            Level unlocks get the wall — stage-sized frames with the next piece
            peeking. Finished goals hang as certificates underneath.
          </p>
        </header>

        <section aria-label="Medal gallery">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: GAZETTEER.muted }}
            >
              Medal wall · {COLLECTION.unlockedAwards} hung / {COLLECTION.totalAwards} commissioned
            </p>
            <RailControls
              label="medal wall"
              onPrev={() => scrollRail(medalRailRef.current, -1)}
              onNext={() => scrollRail(medalRailRef.current, 1)}
            />
          </div>

          <ul
            ref={medalRailRef}
            className="ach-gallery-rail flex gap-4 overflow-x-auto pb-2"
          >
            {medals.map((award) => {
              const locked = !award.unlockedAt;
              const metal = TIER_METAL[award.tier];
              const selected = award.id === activeMedal;
              return (
                <li
                  key={award.id}
                  className="ach-gallery-poster w-[min(88vw,28rem)] shrink-0 rounded-[18px] border p-4 sm:p-5"
                  style={{
                    borderColor: selected ? GAZETTEER.stamp : GAZETTEER.rule,
                    boxShadow: selected
                      ? `0 0 0 1px ${GAZETTEER.stamp}`
                      : `inset 0 0 0 8px ${locked ? "#e5d9c4" : metal.glow}33`,
                  }}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setActiveMedal(award.id)}
                    aria-pressed={selected}
                  >
                    <div
                      className="ach-gallery-matte flex min-h-[16rem] flex-col items-center justify-center rounded-[12px] border px-4 py-8"
                      style={{
                        borderColor: GAZETTEER.rule,
                        opacity: locked ? 0.72 : 1,
                      }}
                    >
                      <MedalMark
                        level={award.level}
                        tier={award.tier}
                        locked={locked}
                        size={120}
                        markId={`gallery-${award.id}`}
                      />
                      <p
                        className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em]"
                        style={{ color: locked ? GAZETTEER.muted : metal.rim }}
                      >
                        {locked ? "Commission pending" : `Level ${award.level}`}
                      </p>
                      <h3 className="mt-2 text-center font-display text-2xl font-semibold tracking-tight">
                        {award.title}
                      </h3>
                    </div>
                    <div className="mt-4 flex items-start justify-between gap-3">
                      <p className="text-sm leading-relaxed" style={{ color: GAZETTEER.mutedDeep }}>
                        {award.description}
                      </p>
                      <p className="shrink-0 font-mono text-[11px]" style={{ color: GAZETTEER.muted }}>
                        {formatAwardDate(award.unlockedAt)}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>

          <div key={active.id} className="ach-gallery-caption mt-4 max-w-2xl">
            <p className="font-mono text-xs" style={{ color: GAZETTEER.muted }}>
              Now facing · {active.title}
            </p>
          </div>
        </section>

        <section aria-label="Goal certificates">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: GAZETTEER.muted }}
            >
              Certificate rail · {COLLECTION.achievedGoals} finished
            </p>
            <RailControls
              label="certificate rail"
              onPrev={() => scrollRail(certRailRef.current, -1)}
              onNext={() => scrollRail(certRailRef.current, 1)}
            />
          </div>
          <ul
            ref={certRailRef}
            className="ach-gallery-rail flex gap-3 overflow-x-auto pb-2"
          >
            {GOAL_ACHIEVEMENTS.map((goal) => (
              <li
                key={goal.id}
                className="ach-gallery-cert w-[min(78vw,20rem)] shrink-0 rounded-[14px] border p-4"
                style={{
                  borderColor: GAZETTEER.rule,
                  background: GAZETTEER.paper,
                  borderTopWidth: 4,
                  borderTopColor: GAZETTEER_CATEGORY_COLORS[goal.category],
                }}
              >
                <div className="flex items-start gap-3">
                  <PlaqueMark category={goal.category} size={48} />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold leading-tight tracking-tight">
                      {goal.title}
                    </p>
                    <p className="mt-1 font-mono text-[11px]" style={{ color: GAZETTEER.muted }}>
                      {formatGoalDate(goal.achievedOn)}
                    </p>
                  </div>
                </div>
                {goal.rewardText ? (
                  <p
                    className="mt-4 border-t pt-3 text-sm leading-relaxed"
                    style={{ borderColor: GAZETTEER.rule, color: GAZETTEER.mutedDeep }}
                  >
                    {goal.rewardText}
                  </p>
                ) : (
                  <p
                    className="mt-4 border-t pt-3 text-sm"
                    style={{ borderColor: GAZETTEER.rule, color: GAZETTEER.muted }}
                  >
                    No reward text — the finish is the prize.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <ConceptNote concept={concept} />
    </AchievementChrome>
  );
}

function RailControls({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex gap-1" role="group" aria-label={`Scroll ${label}`}>
      <button
        type="button"
        onClick={onPrev}
        className="grid size-9 place-items-center rounded-full border"
        style={{ borderColor: GAZETTEER.rule, color: GAZETTEER.mutedDeep }}
        aria-label={`Previous on ${label}`}
      >
        <ChevronLeft aria-hidden className="size-4" />
      </button>
      <button
        type="button"
        onClick={onNext}
        className="grid size-9 place-items-center rounded-full border"
        style={{ borderColor: GAZETTEER.rule, color: GAZETTEER.mutedDeep }}
        aria-label={`Next on ${label}`}
      >
        <ChevronRight aria-hidden className="size-4" />
      </button>
    </div>
  );
}

function scrollRail(node: HTMLUListElement | null, direction: -1 | 1) {
  if (!node) return;
  const amount = Math.max(280, Math.round(node.clientWidth * 0.8));
  node.scrollBy({ left: direction * amount, behavior: "smooth" });
}
