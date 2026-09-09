"use client";

import "@/features/achievements/showcase-theme.css";
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

const RECORD_ACCENT_CLASS: Record<PersonalRecord["accent"], string> = {
  stamp: "ach-showcase-accent-stamp",
  sage: "ach-showcase-accent-sage",
  gain: "ach-showcase-accent-gain",
  copper: "ach-showcase-accent-copper",
  ink: "ach-showcase-accent-ink",
};

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
        <p className="ach-showcase-kicker text-[10px] font-semibold uppercase tracking-[0.16em]">
          Personal records
        </p>
        <p className="ach-showcase-kicker font-mono text-[11px]">Yours alone · no league shame</p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {records.map((record) => (
          <li
            key={record.id}
            className="ach-showcase-record rounded-[16px] border px-4 py-5"
          >
            <p
              className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${RECORD_ACCENT_CLASS[record.accent]}`}
            >
              {record.label}
            </p>
            <p className="ach-showcase-heading mt-3 font-mono text-4xl font-semibold tracking-tight">
              {record.value}
            </p>
            <p className="ach-showcase-body mt-2 text-xs leading-snug">{record.hint}</p>
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
    <div className="ach-showcase-pedestal mx-auto max-w-md rounded-[16px] border px-6 py-8 text-center">
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
          className={`mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            locked ? "ach-showcase-kicker" : ""
          }`}
          style={locked ? undefined : { color: TIER_METAL[award.tier].glow }}
        >
          {locked ? "Locked" : "On display"}
        </p>
        <Heading className="ach-showcase-heading mt-2 font-display text-2xl font-semibold tracking-tight">
          {locked ? "Still ahead" : award.title}
        </Heading>
        <p className="ach-showcase-body mt-2 max-w-sm text-sm leading-relaxed">
          {locked
            ? "Earn the next altitude before this mount opens. The medal stays hidden until then."
            : award.description}
        </p>
        <p className="ach-showcase-kicker mt-3 font-mono text-xs">
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
      <p className="ach-showcase-kicker text-[10px] font-semibold uppercase tracking-[0.16em]">
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
      <p className="ach-showcase-kicker text-[10px] font-semibold uppercase tracking-[0.16em]">
        Plaque rail · finished goals
      </p>
      {goals.length === 0 ? (
        <p className="ach-showcase-body mt-4 text-sm">No achieved goals yet.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <li
              key={goal.id}
              className="ach-showcase-plaque flex items-start gap-3 rounded-[12px] border px-3 py-3"
            >
              <PlaqueMark category={goal.category} />
              <div className="min-w-0">
                <p className="ach-showcase-heading font-display text-base font-semibold leading-tight tracking-tight">
                  {goal.title}
                </p>
                <p className="ach-showcase-kicker mt-1 font-mono text-[11px]">
                  {formatGoalDate(goal.achievedOn)}
                </p>
                {goal.rewardText ? (
                  <p className="ach-showcase-body mt-1 text-xs leading-snug">{goal.rewardText}</p>
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
        } ${selected ? "is-selected" : ""}`}
      >
        {locked ? (
          <>
            <span
              className="ach-showcase-seal-line pointer-events-none absolute inset-x-3 top-3 h-px"
              aria-hidden
            />
            <SealMark locked tier={award.tier} size={52} />
            <span className="ach-showcase-kicker mt-3 text-[10px] uppercase tracking-[0.14em]">
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
            <span className="ach-showcase-stat-muted mt-2 font-mono text-[11px]">
              Lv {award.level}
            </span>
            <span className="ach-showcase-kicker mt-0.5 text-[10px] uppercase tracking-[0.12em]">
              Earned
            </span>
          </>
        )}
      </button>
    </li>
  );
}
