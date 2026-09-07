"use client";

import { addDays, eachDayOfInterval, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import {
  CONCEPT_MONTH_LABEL,
  CONCEPT_TODAY,
  CONCEPT_WEEK_DONE,
  CONCEPT_WEEK_PLANNED,
  weekDots,
} from "@/features/ux-concepts/seed";
import { DestinationFrame } from "@/features/ux-concepts/destination-frame";
import { PROGRESS_CONCEPTS, PROGRESS_LOCK } from "@/features/ux-concepts/destination-catalog";
import {
  conceptCompletionCounts,
  conceptCompletionsOnDate,
  conceptGoalCompletionDates,
  conceptGoalStats,
  partnerGoalRates,
  weekPulseLabel,
} from "@/features/ux-concepts/destination-seed";
import { RecoverBanner, TONE_DOT } from "@/features/ux-concepts/concept-primitives";
import { useConceptSession } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const pulse = PROGRESS_CONCEPTS[0];
const ledger = PROGRESS_CONCEPTS[1];
const map = PROGRESS_CONCEPTS[2];

export function ProgressPulseDestination() {
  const session = useConceptSession("progress");
  const [monthOpen, setMonthOpen] = useState(false);

  return (
    <DestinationFrame
      family="progress"
      concept={pulse}
      siblings={PROGRESS_CONCEPTS}
      session={session}
      kicker="This week"
      heading={weekPulseLabel}
      subtitle="Thursday: 3 left. Not a streak threat."
      extraHeader={
        !session.recovered ? (
          <button
            type="button"
            className="mt-2 text-left text-xs font-medium text-amber-800 touch-manipulation"
            onClick={() => session.setRecoverOpen(true)}
          >
            1 to reschedule
          </button>
        ) : null
      }
      aside={
        <div>
          <p className="text-sm font-medium">Why this direction</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Recycle C as Progress, not Home. One number the product computes
            from planned sessions. Completing still lives on Day.
          </p>
        </div>
      }
    >
      <div className="md:max-w-xl">
        <RecoverBanner
          recovered={session.recovered}
          onOpen={() => session.setRecoverOpen(true)}
        />
        <ol className="mt-5 flex gap-1" aria-label="Week completions">
          {weekDots.map((dot) => (
            <li key={dot.date} className="flex-1">
              <span
                className={cn(
                  "block h-10 w-full rounded-full",
                  dot.date === CONCEPT_TODAY && "ring-2 ring-primary ring-offset-2",
                  dot.missed
                    ? "bg-amber-200"
                    : dot.count >= 3
                      ? "bg-emerald-500"
                      : dot.count === 2
                        ? "bg-emerald-300"
                        : dot.count === 1
                          ? "bg-blue-200"
                          : "bg-muted"
                )}
                title={`${dot.date}: ${dot.count}`}
              />
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">
          {CONCEPT_WEEK_DONE} completed of {CONCEPT_WEEK_PLANNED} planned this
          week. Tuesday is amber because Strength is unplaced.
        </p>
        <ul className="mt-6 divide-y border-y">
          {conceptGoalStats.slice(0, 3).map((stat) => (
            <li key={stat.id} className="flex items-center justify-between py-3">
              <span className="text-sm font-medium">{stat.title}</span>
              <span className="text-sm text-muted-foreground">
                {stat.unplaced ? "unplaced" : `${stat.done} of ${stat.planned}`}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="mt-4 text-sm font-medium text-primary touch-manipulation"
          onClick={() => setMonthOpen((open) => !open)}
        >
          {monthOpen ? "Hide September" : "See September"}
        </button>
        {monthOpen ? (
          <div className="mt-4">
            <ContinuityGrid
              selected={CONCEPT_TODAY}
              onSelect={() => undefined}
            />
          </div>
        ) : null}
      </div>
    </DestinationFrame>
  );
}

function seedGoalDates(): Record<string, Set<string>> {
  const next: Record<string, Set<string>> = {};
  for (const stat of conceptGoalStats) {
    next[stat.id] = new Set(conceptGoalCompletionDates[stat.id] ?? []);
  }
  return next;
}

export function ProgressLedgerDestination({
  leading = false,
}: {
  leading?: boolean;
}) {
  const session = useConceptSession("progress");
  const [selectedId, setSelectedId] = useState("tempo-run");
  const [datesByGoal, setDatesByGoal] = useState(seedGoalDates);
  const selected =
    conceptGoalStats.find((item) => item.id === selectedId) ?? conceptGoalStats[0];
  const selectedDates = datesByGoal[selected.id] ?? new Set<string>();
  const stats = conceptGoalStats.map((stat) => ({
    ...stat,
    done: datesByGoal[stat.id]?.size ?? stat.done,
  }));
  const selectedStat = stats.find((item) => item.id === selectedId) ?? stats[0];
  const partner = partnerGoalRates[selected.id];

  const toggleDate = (iso: string) => {
    if (iso > CONCEPT_TODAY) {
      return;
    }
    setDatesByGoal((current) => {
      const next = { ...current };
      const dates = new Set(next[selected.id] ?? []);
      if (dates.has(iso)) {
        dates.delete(iso);
      } else {
        dates.add(iso);
      }
      next[selected.id] = dates;
      return next;
    });
  };

  const inspector = (
    <GoalInspector
      title={selectedStat.title}
      done={selectedStat.done}
      planned={selectedStat.planned}
      unplaced={Boolean(selected.unplaced) && !session.recovered}
      dates={selectedDates}
      onToggle={toggleDate}
      partner={session.duoMode === "duo" ? partner : undefined}
    />
  );

  return (
    <DestinationFrame
      family="progress"
      concept={leading ? PROGRESS_LOCK : ledger}
      siblings={PROGRESS_CONCEPTS}
      session={session}
      showSiblings={!leading}
      kicker="September"
      heading="Goals"
      subtitle="Plan places work. This calendar logs completions — including days you never scheduled."
      extraHeader={
        !session.recovered ? (
          <button
            type="button"
            className="mt-2 text-left text-xs font-medium text-amber-800 touch-manipulation"
            onClick={() => session.setRecoverOpen(true)}
          >
            Strength is unplaced on Plan
          </button>
        ) : null
      }
      aside={inspector}
    >
      <div className="md:max-w-xl">
        <RecoverBanner
          recovered={session.recovered}
          onOpen={() => session.setRecoverOpen(true)}
        />
        <ul className="mt-2">
          {stats.map((stat) => {
            const unplaced = Boolean(stat.unplaced) && !session.recovered;
            const selectedRow = stat.id === selectedId;
            return (
              <li key={stat.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(stat.id)}
                  className={cn(
                    "flex w-full items-center gap-3 border-b border-border/50 py-3 text-left touch-manipulation",
                    selectedRow && "bg-primary/5"
                  )}
                >
                  <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[stat.tone])} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold tracking-tight">
                      {stat.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {unplaced
                        ? `${stat.period} · ${stat.done} of ${stat.planned} · unplaced on Plan`
                        : `${stat.period} · ${stat.done} of ${stat.planned}`}
                    </span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {`${Math.round((stat.done / stat.planned) * 100)}%`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 md:hidden">{inspector}</div>
      </div>
    </DestinationFrame>
  );
}

export function ProgressMapDestination() {
  const session = useConceptSession("progress");
  const selected = session.selectedDate;
  const completions = conceptCompletionsOnDate[selected] ?? [];
  const count = conceptCompletionCounts[selected] ?? 0;

  return (
    <DestinationFrame
      family="progress"
      concept={map}
      siblings={PROGRESS_CONCEPTS}
      session={session}
      kicker="History"
      heading={CONCEPT_MONTH_LABEL}
      subtitle="Completions, not the plan. Home still owns the week."
      aside={
        <DayCompletions
          date={selected}
          count={count}
          completions={completions}
        />
      }
    >
      <div className="md:max-w-xl">
        <ContinuityGrid
          selected={selected}
          onSelect={session.setSelectedDate}
        />
        <div className="mt-6 md:hidden">
          <DayCompletions
            date={selected}
            count={count}
            completions={completions}
          />
        </div>
      </div>
    </DestinationFrame>
  );
}

function GoalInspector({
  title,
  done,
  planned,
  unplaced,
  dates,
  onToggle,
  partner,
}: {
  title: string;
  done: number;
  planned: number;
  unplaced?: boolean;
  dates: ReadonlySet<string>;
  onToggle: (iso: string) => void;
  partner?: { done: number; planned: number };
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {done} of {planned} logged in September.
        {unplaced ? " Strength still needs a day on Plan." : ""}
      </p>
      {partner ? (
        <p className="mt-1 text-sm text-violet-900">
          Maya · {partner.done} of {partner.planned}
        </p>
      ) : null}
      <GoalHeatmap dates={dates} onToggle={onToggle} />
      <p className="mt-3 text-xs text-muted-foreground">
        Tap a past day or today to add or remove a completion. Future days stay
        closed. This is not the Plan calendar.
      </p>
    </div>
  );
}

function GoalHeatmap({
  dates,
  onToggle,
}: {
  dates: ReadonlySet<string>;
  onToggle: (iso: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(parseISO(CONCEPT_TODAY)), {
      weekStartsOn: 0,
    });
    return eachDayOfInterval({ start, end: addDays(start, 34) });
  }, []);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-px text-center text-[11px] font-medium text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <div key={`${label}-${index}`} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px" aria-label="Goal completion heatmap">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, parseISO(CONCEPT_TODAY));
          const completed = dates.has(iso);
          const future = iso > CONCEPT_TODAY;
          const isToday = iso === CONCEPT_TODAY;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onToggle(iso)}
              disabled={future}
              aria-label={`${format(day, "EEEE, MMM d")}${completed ? ", completed" : ", not completed"}`}
              aria-pressed={completed}
              aria-current={isToday ? "date" : undefined}
              className={cn(
                "flex min-h-[2.75rem] flex-col items-center rounded-lg py-1 text-xs touch-manipulation",
                !inMonth && "opacity-35",
                completed && "bg-emerald-50",
                isToday && "ring-1 ring-primary/40",
                future && "cursor-not-allowed opacity-40"
              )}
            >
              <span>{format(day, "d")}</span>
              <span
                className={cn(
                  "mt-1 size-1.5 rounded-full",
                  completed ? "bg-emerald-500" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayCompletions({
  date,
  count,
  completions,
}: {
  date: string;
  count: number;
  completions: readonly { title: string; who: "self" | "partner" }[];
}) {
  const missed = date === "2026-09-01";
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">
        {format(parseISO(date), "EEEE, MMM d")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {missed
          ? "No completions. Strength is unplaced — recover on Plan."
          : `${count} completion${count === 1 ? "" : "s"}`}
      </p>
      {completions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing logged this day.
        </p>
      ) : (
        <ul className="mt-4 divide-y border-y">
          {completions.map((item) => (
            <li key={`${item.title}-${item.who}`} className="py-3 text-sm">
              <span className="font-medium">{item.title}</span>
              <span className="ml-2 text-muted-foreground">
                {item.who === "partner" ? "Maya" : "You"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ContinuityGrid({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (iso: string) => void;
}) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(parseISO(CONCEPT_TODAY)), {
      weekStartsOn: 0,
    });
    return eachDayOfInterval({ start, end: addDays(start, 34) });
  }, []);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-px text-center text-[11px] font-medium text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <div key={`${label}-${index}`} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, parseISO(CONCEPT_TODAY));
          const count = conceptCompletionCounts[iso] ?? 0;
          const missed = iso === "2026-09-01";
          const isSelected = iso === selected;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              aria-label={format(day, "EEEE, MMM d")}
              aria-pressed={isSelected}
              aria-current={iso === CONCEPT_TODAY ? "date" : undefined}
              className={cn(
                "flex min-h-[2.75rem] flex-col items-center rounded-lg py-1 text-xs touch-manipulation",
                !inMonth && "opacity-35",
                isSelected && "ring-1 ring-primary/40 bg-primary/10",
                missed && !isSelected && "bg-amber-50"
              )}
            >
              <span>{format(day, "d")}</span>
              <span
                className={cn(
                  "mt-1 size-1.5 rounded-full",
                  missed
                    ? "bg-amber-400"
                    : count >= 3
                      ? "bg-emerald-500"
                      : count === 2
                        ? "bg-emerald-300"
                        : count === 1
                          ? "bg-blue-400"
                          : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
