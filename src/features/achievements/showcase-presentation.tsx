"use client";

import {
  MedalMark,
  PlaqueMark,
  SealMark,
  TIER_METAL,
} from "@/features/achievements/medals";
import { formatAwardDate, formatGoalDate } from "@/features/achievements/format";
import type {
  AchievementGoalCategory,
  AwardTier,
  PersonalRecord,
} from "@/features/achievements/types";
import { GAZETTEER } from "@/lib/brand/gazetteer";

export const RECORD_ACCENT: Record<PersonalRecord["accent"], string> = {
  stamp: GAZETTEER.stampLight,
  sage: "#A8B8AE",
  gain: "#8FBA7A",
  copper: "#E8B89A",
  ink: GAZETTEER.rule,
};

export function AchievementsShowcaseStyles() {
  return (
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
  );
}

export type ShowcaseLevelAwardView = {
  id: string;
  level: number;
  title: string;
  description: string;
  unlockedAt: string | null;
  tier: AwardTier;
};

export type ShowcaseGoalView = {
  id: string;
  title: string;
  achievedOn: string | null;
  rewardText: string | null;
  category: AchievementGoalCategory;
};

export function ShowcasePersonalRecords({
  records,
}: {
  records: readonly PersonalRecord[];
}) {
  return (
    <section aria-label="Personal records">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a64]">
          Personal records
        </p>
        <p className="font-mono text-[11px] text-[#8a7a64]">Yours alone · no league shame</p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {records.map((record) => (
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
  );
}

export function ShowcasePedestal({
  award,
  headingLevel = "h2",
}: {
  award: ShowcaseLevelAwardView;
  headingLevel?: "h2" | "h3";
}) {
  const locked = !award.unlockedAt;
  const Heading = headingLevel;

  return (
    <div
      className="ach-showcase-pedestal mx-auto max-w-md rounded-[16px] border px-6 py-8 text-center"
      style={{ borderColor: "#5a4a38" }}
    >
      <div key={award.id} className="ach-showcase-hero flex flex-col items-center">
        {locked ? (
          <SealMark locked tier={award.tier} size={88} />
        ) : (
          <MedalMark
            level={award.level}
            tier={award.tier}
            size={128}
            markId={`showcase-hero-${award.id}`}
          />
        )}
        <p
          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{
            color: locked ? "#8a7a64" : TIER_METAL[award.tier].glow,
          }}
        >
          {locked ? "Locked" : "On display"}
        </p>
        <Heading className="mt-2 font-display text-2xl font-semibold tracking-tight text-[#f8f1e3]">
          {locked ? "Still ahead" : award.title}
        </Heading>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#a89880]">
          {locked
            ? "Earn the next altitude before this mount opens. The medal stays hidden until then."
            : award.description}
        </p>
        <p className="mt-3 font-mono text-xs text-[#8a7a64]">
          {locked ? "Locked" : formatAwardDate(award.unlockedAt)}
        </p>
      </div>
    </div>
  );
}

export function ShowcaseMedalShelf({
  awards,
  featuredId,
  onSelect,
}: {
  awards: readonly ShowcaseLevelAwardView[];
  featuredId: string;
  onSelect: (awardId: string) => void;
}) {
  const unlocked = awards.filter((award) => award.unlockedAt);
  const locked = awards.filter((award) => !award.unlockedAt);

  if (awards.length === 0) {
    return null;
  }

  return (
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
            onSelect={() => onSelect(award.id)}
          />
        ))}
      </ul>
    </div>
  );
}

export function ShowcasePlaqueRail({ goals }: { goals: readonly ShowcaseGoalView[] }) {
  return (
    <div className="mt-8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a7a64]">
        Plaque rail · finished goals
      </p>
      {goals.length === 0 ? (
        <p className="mt-4 text-sm text-[#a89880]">No achieved goals yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
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
                  <p className="mt-1 text-xs leading-snug text-[#a89880]">{goal.rewardText}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ShelfMedal({
  award,
  selected,
  onSelect,
}: {
  award: ShowcaseLevelAwardView;
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
