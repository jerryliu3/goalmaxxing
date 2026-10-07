"use client";

import "@/features/achievements/showcase-theme.css";
import { MedalMark } from "./medals";
import { levelFinish } from "./prism/materials";
import { formatAwardDate } from "@/features/achievements/format";
import type {
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
};

export function ShowcasePersonalRecords({
  records,
}: {
  records: readonly PersonalRecord[];
}) {
  return (
    <section aria-label="Personal records">
      <div className="flex items-baseline justify-between gap-3">
        <p className="ach-showcase-kicker type-eyebrow text-[10px]">
          Personal records
        </p>
        <p className="ach-showcase-kicker type-figure text-[11px]">Yours alone · no league shame</p>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {records.map((record) => (
          <li
            key={record.id}
            className="ach-showcase-record rounded-[16px] border px-4 py-5"
          >
            <p
              className={`type-eyebrow text-[10px] ${RECORD_ACCENT_CLASS[record.accent]}`}
            >
              {record.label}
            </p>
            <p className="ach-showcase-heading mt-3 type-stat text-4xl tracking-tight">
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
        <MedalMark level={award.level} locked={locked} size={128} />
        <p
          className={`type-eyebrow mt-4 text-[10px] ${
            locked ? "ach-showcase-kicker" : ""
          }`}
          style={locked ? undefined : { color: levelFinish(award.level).type }}
        >
          {locked ? "Locked" : "On display"}
        </p>
        <Heading className="ach-showcase-heading mt-2 type-title text-2xl tracking-tight">
          {locked ? "Still ahead" : award.title}
        </Heading>
        <p className="ach-showcase-body mt-2 max-w-sm text-sm leading-relaxed">
          {locked
            ? "Earn the next altitude before this mount opens. The unstruck blank waits for your next level."
            : award.description}
        </p>
        <p className="ach-showcase-kicker mt-3 type-figure text-xs">
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
      <p className="ach-showcase-kicker type-eyebrow text-[10px]">
        Medal shelf · XP levels
      </p>
      {/* Auto-fit so every earned and locked medal shares one row instead of orphaning the last. */}
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
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
        <MedalMark level={award.level} locked={locked} size={72} />
        <span className="ach-showcase-stat-muted mt-2 type-figure text-[11px]">Lv {award.level}</span>
        <span className="ach-showcase-kicker type-eyebrow mt-0.5 text-[10px]">{locked ? "Locked" : "Earned"}</span>
      </button>
    </li>
  );
}
