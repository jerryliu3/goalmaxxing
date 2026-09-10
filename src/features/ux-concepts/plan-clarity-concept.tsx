"use client";

import {
  addDays,
  eachDayOfInterval,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Check, ChevronDown, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { Button } from "@/components/ui/button";
import {
  CoachButton,
  ConceptAppTabs,
  ConceptExploreBar,
  ConceptSheets,
  DesktopKeyHint,
  FabNewGoal,
  GoalRow,
  RecoverBanner,
  TONE_DOT,
  TONE_PILL,
} from "@/features/ux-concepts/concept-primitives";
import {
  PLAN_CLARITY_CONCEPTS,
  type PlanClarityConcept,
} from "@/features/ux-concepts/plan-clarity-catalog";
import {
  CHECKLIST_INITIAL_DONE,
  CLARITY_FOCUS_GOALS,
  CLARITY_OCCURRENCES,
  focusedOccurrences,
  isPerfectDay,
  occurrenceDate,
  occurrenceItem,
  occurrencesOnDate,
  type ClarityOccurrence,
} from "@/features/ux-concepts/plan-clarity-seed";
import {
  CONCEPT_MONTH_LABEL,
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
} from "@/features/ux-concepts/seed";
import {
  useConceptSession,
  type ConceptHomeTab,
  type ConceptSession,
} from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const TABS = ["plan", "checklist", "progress", "community", "you"] as const;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

type CalendarRange = "week" | "month" | "day";
type DoneTreatment = "strike" | "quiet" | "fold" | "marks";
type DateMark = "off" | "nest" | "star";

function monthDays(anchor: string) {
  const start = startOfWeek(startOfMonth(parseISO(anchor)), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: addDays(start, 41) });
}

function weekDays(anchor: string) {
  const start = startOfWeek(parseISO(anchor), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

function useClarityCompletions() {
  const [completedIds, setCompletedIds] = useState(
    () =>
      new Set(
        CLARITY_OCCURRENCES.filter((item) => item.completed).map((item) => item.id)
      )
  );
  const isComplete = (id: string) => completedIds.has(id);
  const toggleComplete = (id: string) => {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  return { completedIds, isComplete, toggleComplete };
}

export function PlanClarityIndex() {
  return (
    <div className="min-h-dvh bg-slate-50">
      <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          Exploratory · Plan craft · not production
        </p>
        <h1 className="mt-2 text-[2rem] font-semibold leading-[1.1] tracking-tight">
          Calendar and checklist, quieter.
        </h1>
        <p className="mt-4 text-base text-muted-foreground">
          Still Spatial Home. These shells try three crafts the live calendar
          does not have: isolate one goal’s placements, stop treating past
          completions as cancelled work, and keep Checklist a queue.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Steal the one-goal select from{" "}
          <Link href="/ux/concepts/progress" className="font-medium text-primary">
            Goal Ledger
          </Link>
          , the spatial month from{" "}
          <Link href="/ux/concepts/progress/map" className="font-medium text-primary">
            Continuity Map
          </Link>
          , and Nest from Gazetteer. Progress still owns the completion log.
          This calendar still owns placed work.{" "}
          <Link href="/ux/concepts" className="font-medium text-primary">
            Gallery
          </Link>
        </p>
        <ol className="mt-8 space-y-4">
          {PLAN_CLARITY_CONCEPTS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-2xl border bg-card p-5 ring-1 ring-foreground/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {item.letter}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm">{item.bet}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.firstViewport}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      </main>
    </div>
  );
}

export function GoalFocusConcept() {
  const session = useConceptSession("plan");
  const completions = useClarityCompletions();
  const [range, setRange] = useState<CalendarRange>("week");
  const [focusGoalId, setFocusGoalId] = useState<string | null>("tempo-run");
  const visible = focusedOccurrences(focusGoalId);
  const focus = CLARITY_FOCUS_GOALS.find((goal) => goal.id === focusGoalId);
  const placementDates = useMemo(() => {
    const dates = [
      ...new Set(
        visible.map((item) => occurrenceDate(item, session.recoveredTo))
      ),
    ].sort();
    return dates;
  }, [session.recoveredTo, visible]);

  return (
    <ClarityFrame
      concept={PLAN_CLARITY_CONCEPTS[0]}
      session={session}
      range={range}
      onRangeChange={setRange}
      kicker={range === "month" ? CONCEPT_MONTH_LABEL : "This week"}
      heading={focus ? focus.title : "All placed work"}
      subtitle={
        focus
          ? `${placementDates.length} days on Plan this month. Progress still logs days you never scheduled.`
          : "Pick a goal to see only its placed days."
      }
      extraHeader={
        <FocusChips value={focusGoalId} onChange={setFocusGoalId} />
      }
      aside={
        <FocusInspector
          title={focus?.title ?? "All goals"}
          goalId={focusGoalId}
          dates={placementDates}
          recoveredTo={session.recoveredTo}
          isComplete={completions.isComplete}
        />
      }
    >
      <ClarityCalendar
        session={session}
        range={range}
        onRangeChange={setRange}
        occurrences={visible}
        completedIds={completions.completedIds}
        isComplete={completions.isComplete}
        toggleComplete={completions.toggleComplete}
        treatment="quiet"
        dateMark="off"
      />
    </ClarityFrame>
  );
}

export function PastDayDoneConcept() {
  const session = useConceptSession("plan");
  const completions = useClarityCompletions();
  const [range, setRange] = useState<CalendarRange>("week");
  const [treatment, setTreatment] = useState<DoneTreatment>("quiet");
  const [dateMark, setDateMark] = useState<DateMark>("nest");

  return (
    <ClarityFrame
      concept={PLAN_CLARITY_CONCEPTS[1]}
      session={session}
      range={range}
      onRangeChange={setRange}
      kicker="Past days"
      heading="How done looks"
      subtitle="Strike is what ships today. Quiet keeps the color. Fold and marks get titles out of the way. Nest is Gazetteer’s completion mark on a clear day."
      extraHeader={
        <div className="mt-3 flex flex-col gap-2">
          <TreatmentToggle value={treatment} onChange={setTreatment} />
          <DateMarkToggle value={dateMark} onChange={setDateMark} />
        </div>
      }
      aside={
        <div>
          <p className="text-sm font-medium">Why each treatment</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Strike</span> — live
              calendar. Reads as cancelled.
            </li>
            <li>
              <span className="font-medium text-foreground">Quiet</span> — same
              pill, no line. A check is enough.
            </li>
            <li>
              <span className="font-medium text-foreground">Fold</span> — hide
              by default. Expand that day for titles.
            </li>
            <li>
              <span className="font-medium text-foreground">Marks</span> —
              replace the pill with a nest. Titles stay one tap away.
            </li>
          </ul>
        </div>
      }
    >
      <ClarityCalendar
        session={session}
        range={range}
        onRangeChange={setRange}
        occurrences={CLARITY_OCCURRENCES}
        completedIds={completions.completedIds}
        isComplete={completions.isComplete}
        toggleComplete={completions.toggleComplete}
        treatment={treatment}
        dateMark={dateMark}
      />
    </ClarityFrame>
  );
}

export function CollapsedCompletedConcept() {
  const session = useConceptSession("checklist");
  const [doneIds, setDoneIds] = useState(
    () => new Set<string>(CHECKLIST_INITIAL_DONE)
  );
  const [completedOpen, setCompletedOpen] = useState(false);
  const openItems = session.applicableItems.filter(
    (item) => !doneIds.has(item.id)
  );
  const doneItems = session.applicableItems.filter((item) =>
    doneIds.has(item.id)
  );
  const toggle = (id: string) => {
    setDoneIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <ClarityFrame
      concept={PLAN_CLARITY_CONCEPTS[2]}
      session={session}
      activeTab="checklist"
      kicker={format(parseISO(session.selectedDate), "MMMM d")}
      heading="Checklist"
      subtitle={`${openItems.length} open · completed stays folded until you want it`}
      aside={
        <div>
          <p className="text-sm font-medium">Queue, then archive</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Spatial Home already files Done under open work, but expanded. This
            keeps the section, closed. Rows inside do not strike — the toggle
            already said it landed.
          </p>
        </div>
      }
    >
      <div className="md:max-w-xl">
        {!session.recovered ? (
          <RecoverBanner
            recovered={session.recovered}
            onOpen={() => session.setRecoverOpen(true)}
          />
        ) : null}
        <section className="mt-4">
          {openItems.map((item) => (
            <GoalRow
              key={item.id}
              item={item}
              completed={false}
              onToggle={() => toggle(item.id)}
              onOpen={() => session.setSelectedItemId(item.id)}
            />
          ))}
        </section>
        {doneItems.length > 0 ? (
          <section className="mt-6 border-t border-border/60 pt-2">
            <button
              type="button"
              aria-expanded={completedOpen}
              onClick={() => setCompletedOpen((open) => !open)}
              className="flex min-h-11 w-full items-center justify-between gap-3 py-2 text-left touch-manipulation"
            >
              <span className="text-sm font-medium">
                Completed
                <span className="ml-2 text-muted-foreground">
                  {doneItems.length}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  completedOpen && "rotate-180"
                )}
              />
            </button>
            {completedOpen
              ? doneItems.map((item) => (
                  <QuietCompletedRow
                    key={item.id}
                    title={item.title}
                    meta={`${item.cadence} · ${item.category}`}
                    toneClass={TONE_DOT[item.tone]}
                    onToggle={() => toggle(item.id)}
                    onOpen={() => session.setSelectedItemId(item.id)}
                  />
                ))
              : null}
          </section>
        ) : null}
      </div>
    </ClarityFrame>
  );
}

function ClarityFrame({
  concept,
  session,
  kicker,
  heading,
  subtitle,
  extraHeader,
  aside,
  children,
  range,
  onRangeChange,
  activeTab = "plan",
}: {
  concept: PlanClarityConcept;
  session: ConceptSession;
  kicker: string;
  heading: string;
  subtitle: string;
  extraHeader?: ReactNode;
  aside: ReactNode;
  children: ReactNode;
  range?: CalendarRange;
  onRangeChange?: (range: CalendarRange) => void;
  activeTab?: "plan" | "checklist";
}) {
  const router = useRouter();
  const onTabChange = (tab: ConceptHomeTab) => {
    if (tab === "plan") {
      router.push("/ux/concepts/plan-clarity/focus");
      return;
    }
    if (tab === "checklist") {
      router.push("/ux/concepts/plan-clarity/checklist");
      return;
    }
    if (tab === "progress") {
      router.push("/ux/concepts/progress");
      return;
    }
    if (tab === "community") {
      router.push("/ux/concepts/community");
      return;
    }
    if (tab === "you") {
      router.push("/ux/concepts/you");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ConceptExploreBar
        direction="B"
        title={`${concept.letter} · ${concept.title}`}
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="px-4 pb-2 pt-5 md:px-0 md:pt-0">
            <SiblingToggle current={concept.href} />
            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {kicker}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {heading}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                {extraHeader}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {onRangeChange && range ? (
                  <RangeToggle range={range} onChange={onRangeChange} />
                ) : null}
                <CoachButton onClick={() => session.setCoachOpen(true)} />
                <DesktopKeyHint />
              </div>
            </div>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 md:px-0 md:pb-8">
            {children}
          </main>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex justify-end">
              <FabNewGoal onClick={() => session.setNewGoalOpen(true)} />
            </div>
            <div className="pointer-events-auto mt-3">
              <ConceptAppTabs
                tabs={[...TABS]}
                active={activeTab}
                onChange={onTabChange}
              />
            </div>
          </div>
        </div>
        <aside className="hidden w-[24rem] shrink-0 md:flex md:flex-col md:gap-4">
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            {aside}
          </div>
          <ConceptAppTabs
            tabs={[...TABS]}
            active={activeTab}
            onChange={onTabChange}
          />
          <Button type="button" onClick={() => session.setNewGoalOpen(true)}>
            New goal
          </Button>
        </aside>
      </div>
      <ConceptSheets session={session} />
    </div>
  );
}

function SiblingToggle({ current }: { current: string }) {
  return (
    <div
      role="group"
      aria-label="Plan craft alternatives"
      className="inline-flex max-w-full flex-wrap rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {PLAN_CLARITY_CONCEPTS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.href === current ? "page" : undefined}
          className={cn(
            "min-h-8 rounded-full px-3 leading-8 touch-manipulation",
            item.href === current
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {item.title}
        </Link>
      ))}
    </div>
  );
}

function RangeToggle({
  range,
  onChange,
}: {
  range: CalendarRange;
  onChange: (range: CalendarRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Calendar range"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(["week", "month", "day"] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={range === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-8 rounded-full px-3 capitalize touch-manipulation",
            range === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {value === "week" ? "Week" : value === "month" ? "Month" : "Day"}
        </button>
      ))}
    </div>
  );
}

function FocusChips({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Focus one goal"
      className="mt-3 flex gap-1.5 overflow-x-auto pb-1"
    >
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={cn(
          "min-h-8 shrink-0 rounded-full px-3 text-xs font-medium touch-manipulation",
          value === null
            ? "bg-foreground text-background"
            : "bg-muted text-muted-foreground"
        )}
      >
        All
      </button>
      {CLARITY_FOCUS_GOALS.map((goal) => (
        <button
          key={goal.id}
          type="button"
          aria-pressed={value === goal.id}
          onClick={() => onChange(goal.id)}
          className={cn(
            "min-h-8 shrink-0 rounded-full px-3 text-xs font-medium touch-manipulation",
            value === goal.id
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          )}
        >
          {goal.title}
        </button>
      ))}
    </div>
  );
}

function TreatmentToggle({
  value,
  onChange,
}: {
  value: DoneTreatment;
  onChange: (value: DoneTreatment) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Completed treatment"
      className="inline-flex max-w-full flex-wrap rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(
        [
          ["strike", "Strike"],
          ["quiet", "Quiet"],
          ["fold", "Fold"],
          ["marks", "Marks"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "min-h-8 rounded-full px-3 touch-manipulation",
            value === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function DateMarkToggle({
  value,
  onChange,
}: {
  value: DateMark;
  onChange: (value: DateMark) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Clear-day mark"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(
        [
          ["off", "No mark"],
          ["nest", "Nest"],
          ["star", "Star"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          className={cn(
            "min-h-8 rounded-full px-3 touch-manipulation",
            value === id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FocusInspector({
  title,
  goalId,
  dates,
  recoveredTo,
  isComplete,
}: {
  title: string;
  goalId: string | null;
  dates: string[];
  recoveredTo: string | null;
  isComplete: (id: string) => boolean;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Placed days only. This is not the Progress heatmap.
      </p>
      {dates.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nothing placed for this goal in the seed month.
        </p>
      ) : (
        <ol className="mt-4 divide-y border-y">
          {dates.map((iso) => {
            const items = occurrencesOnDate(iso, recoveredTo).filter((item) =>
              goalId ? item.goalId === goalId : true
            );
            const done =
              items.length > 0 && items.every((item) => isComplete(item.id));
            return (
              <li key={iso} className="flex items-center justify-between py-2.5 text-sm">
                <span>{format(parseISO(iso), "EEE d")}</span>
                <span className="text-muted-foreground">
                  {iso > CONCEPT_TODAY
                    ? "upcoming"
                    : done
                      ? "done"
                      : iso === CONCEPT_TODAY
                        ? "today"
                        : "open"}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function ClarityCalendar({
  session,
  range,
  onRangeChange,
  occurrences,
  completedIds,
  isComplete,
  toggleComplete,
  treatment,
  dateMark,
}: {
  session: ConceptSession;
  range: CalendarRange;
  onRangeChange: (range: CalendarRange) => void;
  occurrences: readonly ClarityOccurrence[];
  completedIds: ReadonlySet<string>;
  isComplete: (id: string) => boolean;
  toggleComplete: (id: string) => void;
  treatment: DoneTreatment;
  dateMark: DateMark;
}) {
  const weekCells = useMemo(
    () => weekDays(session.selectedDate),
    [session.selectedDate]
  );
  const monthCells = useMemo(() => monthDays(CONCEPT_TODAY), []);
  const openDay = (iso: string) => {
    session.setSelectedDate(iso);
    onRangeChange("day");
  };

  if (range === "month") {
    return (
      <MonthGrid
        session={session}
        days={monthCells}
        occurrences={occurrences}
        completedIds={completedIds}
        isComplete={isComplete}
        treatment={treatment}
        dateMark={dateMark}
        onOpenDay={openDay}
      />
    );
  }
  if (range === "day") {
    return (
      <div className="md:max-w-xl">
        <DayPane
          session={session}
          occurrences={occurrences}
          isComplete={isComplete}
          toggleComplete={toggleComplete}
          treatment={treatment}
          dateMark={dateMark}
        />
      </div>
    );
  }
  return (
    <WeekAgenda
      session={session}
      days={weekCells}
      occurrences={occurrences}
      completedIds={completedIds}
      isComplete={isComplete}
      treatment={treatment}
      dateMark={dateMark}
      onOpenDay={openDay}
    />
  );
}

function WeekAgenda({
  session,
  days,
  occurrences,
  completedIds,
  isComplete,
  treatment,
  dateMark,
  onOpenDay,
}: {
  session: ConceptSession;
  days: Date[];
  occurrences: readonly ClarityOccurrence[];
  completedIds: ReadonlySet<string>;
  isComplete: (id: string) => boolean;
  treatment: DoneTreatment;
  dateMark: DateMark;
  onOpenDay: (iso: string) => void;
}) {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const toggleDay = (iso: string) => {
    setExpandedDays((current) => {
      const next = new Set(current);
      if (next.has(iso)) {
        next.delete(iso);
      } else {
        next.add(iso);
      }
      return next;
    });
  };

  return (
    <ol aria-label="Week agenda" className="flex flex-col">
      {days.map((day) => {
        const iso = format(day, "yyyy-MM-dd");
        const selected = iso === session.selectedDate;
        const isToday = iso === CONCEPT_TODAY;
        const missed = iso === STRENGTH_MISSED_DATE && !session.recovered;
        const items = occurrencesOnDate(iso, session.recoveredTo, occurrences);
        const openItems = items.filter((item) => !isComplete(item.id));
        const doneItems = items.filter((item) => isComplete(item.id));
        const perfect = isPerfectDay(
          iso,
          session.recoveredTo,
          completedIds,
          occurrences
        );
        const expanded = expandedDays.has(iso);
        const hideDone = (treatment === "fold" || treatment === "marks") && !expanded;
        const visibleItems = hideDone ? openItems : items;
        return (
          <li
            key={iso}
            className={cn(
              "border-b border-border/60 last:border-b-0",
              selected && "bg-primary/5",
              missed && "bg-amber-50/80"
            )}
          >
            <div className="flex items-start gap-2 py-3">
              <button
                type="button"
                onClick={() => onOpenDay(iso)}
                className="w-14 shrink-0 px-1 text-left touch-manipulation"
                aria-label={
                  perfect && dateMark !== "off"
                    ? `${format(day, "EEEE, MMM d")}, all placed work done`
                    : format(day, "EEEE, MMM d")
                }
                aria-current={isToday ? "date" : undefined}
                aria-pressed={selected}
              >
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <DateNum
                  day={day}
                  isToday={isToday}
                  selected={selected}
                  perfect={perfect}
                  mark={dateMark}
                />
              </button>
              <div className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5">
                {items.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenDay(iso)}
                    className="min-h-[2.75rem] w-full rounded-lg px-2 text-left text-sm text-muted-foreground touch-manipulation"
                  >
                    No work this day
                  </button>
                ) : (
                  <>
                    {treatment === "marks" && hideDone && doneItems.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {doneItems.map((item) => (
                          <DoneMark
                            key={item.id}
                            occurrence={item}
                            onClick={() => toggleDay(iso)}
                          />
                        ))}
                      </div>
                    ) : null}
                    {visibleItems.map((item) => {
                      const completed = isComplete(item.id);
                      const needsRecover =
                        item.goalId === "strength" && !session.recovered;
                      return (
                        <ClarityPill
                          key={item.id}
                          occurrence={item}
                          completed={completed}
                          unplaced={needsRecover}
                          treatment={treatment}
                          onClick={() => {
                            if (needsRecover) {
                              session.setSelectedDate(iso);
                              session.setRecoverOpen(true);
                              return;
                            }
                            onOpenDay(iso);
                          }}
                        />
                      );
                    })}
                    {hideDone && treatment === "fold" && doneItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleDay(iso)}
                        className="self-start rounded-md px-2 py-1 text-xs font-medium text-muted-foreground touch-manipulation"
                      >
                        {doneItems.length} done
                      </button>
                    ) : null}
                    {expanded && hideDone === false && (treatment === "fold" || treatment === "marks") && doneItems.length > 0 && openItems.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => toggleDay(iso)}
                        className="self-start px-2 text-xs text-muted-foreground touch-manipulation"
                      >
                        Hide done
                      </button>
                    ) : null}
                  </>
                )}
                {openItems.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {openItems.length} left
                    {missed ? " · recover Strength" : ""}
                  </p>
                ) : items.length > 0 ? (
                  <p className="text-xs text-muted-foreground">Clear day</p>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function MonthGrid({
  session,
  days,
  occurrences,
  completedIds,
  isComplete,
  treatment,
  dateMark,
  onOpenDay,
}: {
  session: ConceptSession;
  days: Date[];
  occurrences: readonly ClarityOccurrence[];
  completedIds: ReadonlySet<string>;
  isComplete: (id: string) => boolean;
  treatment: DoneTreatment;
  dateMark: DateMark;
  onOpenDay: (iso: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-card p-2 ring-1 ring-foreground/10 md:p-3">
      <div className="grid grid-cols-7 gap-px text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAYS.map((label, index) => (
          <div key={`${label}-${index}`} className="py-1">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, parseISO(CONCEPT_TODAY));
          const selected = iso === session.selectedDate;
          const isToday = iso === CONCEPT_TODAY;
          const missed = iso === STRENGTH_MISSED_DATE && !session.recovered;
          const items = occurrencesOnDate(iso, session.recoveredTo, occurrences);
          const openItems = items.filter((item) => !isComplete(item.id));
          const doneItems = items.filter((item) => isComplete(item.id));
          const perfect = isPerfectDay(
            iso,
            session.recoveredTo,
            completedIds,
            occurrences
          );
          const dots =
            treatment === "fold" || treatment === "marks" ? openItems : items;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onOpenDay(iso)}
              className={cn(
                "flex min-h-[3.4rem] flex-col items-center rounded-lg px-0.5 py-1 text-xs touch-manipulation md:min-h-[4.5rem]",
                !inMonth && "opacity-35",
                selected && "bg-primary/10 ring-1 ring-primary/40",
                missed && !selected && "bg-amber-50"
              )}
              aria-label={
                perfect && dateMark !== "off"
                  ? `${format(day, "EEEE, MMM d")}, all placed work done`
                  : format(day, "EEEE, MMM d")
              }
              aria-current={isToday ? "date" : undefined}
              aria-pressed={selected}
            >
              <DateNum
                day={day}
                isToday={isToday}
                selected={selected}
                perfect={perfect}
                mark={dateMark}
                compact
              />
              <span className="mt-1 flex gap-0.5">
                {treatment === "marks"
                  ? doneItems.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="flex size-2 items-center justify-center rounded-[3px] ring-1 ring-emerald-400/80"
                      >
                        <span className="size-1 rounded-[1px] bg-emerald-500" />
                      </span>
                    ))
                  : dots.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          isComplete(item.id) && treatment === "strike"
                            ? "bg-muted-foreground/50"
                            : TONE_DOT[occurrenceItem(item).tone]
                        )}
                      />
                    ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayPane({
  session,
  occurrences,
  isComplete,
  toggleComplete,
  treatment,
  dateMark,
}: {
  session: ConceptSession;
  occurrences: readonly ClarityOccurrence[];
  isComplete: (id: string) => boolean;
  toggleComplete: (id: string) => void;
  treatment: DoneTreatment;
  dateMark: DateMark;
}) {
  const items = occurrencesOnDate(
    session.selectedDate,
    session.recoveredTo,
    occurrences
  );
  const openItems = items.filter((item) => !isComplete(item.id));
  const doneItems = items.filter((item) => isComplete(item.id));
  const [completedOpen, setCompletedOpen] = useState(false);
  const collapseDone = treatment === "fold" || treatment === "marks";
  const showRecover =
    !session.recovered &&
    (session.selectedDate === CONCEPT_TODAY ||
      session.selectedDate === STRENGTH_MISSED_DATE);
  const perfect = isPerfectDay(
    session.selectedDate,
    session.recoveredTo,
    new Set(items.filter((item) => isComplete(item.id)).map((item) => item.id)),
    occurrences
  );

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            {format(parseISO(session.selectedDate), "EEEE, MMM d")}
            {perfect && dateMark !== "off" ? (
              <span className="text-xs font-medium text-emerald-800">
                Clear day
              </span>
            ) : null}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {openItems.length} left
            {openItems[0]
              ? ` · next is ${occurrenceItem(openItems[0]).title}`
              : ""}
          </p>
        </div>
      </div>
      {showRecover ? (
        <div className="mt-3">
          <RecoverBanner
            recovered={session.recovered}
            onOpen={() => session.setRecoverOpen(true)}
          />
        </div>
      ) : null}
      <div className="mt-2">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No work placed on this day.
          </p>
        ) : (
          <>
            {openItems.map((item) => {
              const concept = occurrenceItem(item);
              return (
                <GoalRow
                  key={item.id}
                  item={{ ...concept, id: item.goalId }}
                  completed={false}
                  onToggle={() => toggleComplete(item.id)}
                  onOpen={() => session.setSelectedItemId(item.goalId)}
                />
              );
            })}
            {doneItems.length > 0 && collapseDone ? (
              <section className="mt-6 border-t border-border/60 pt-2">
                <button
                  type="button"
                  aria-expanded={completedOpen}
                  onClick={() => setCompletedOpen((open) => !open)}
                  className="flex min-h-11 w-full items-center justify-between py-2 text-left touch-manipulation"
                >
                  <span className="text-sm font-medium">
                    Completed
                    <span className="ml-2 text-muted-foreground">
                      {doneItems.length}
                    </span>
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground",
                      completedOpen && "rotate-180"
                    )}
                  />
                </button>
                {completedOpen
                  ? doneItems.map((item) => {
                      const concept = occurrenceItem(item);
                      return (
                        <QuietCompletedRow
                          key={item.id}
                          title={concept.title}
                          meta={`${concept.cadence} · ${concept.category}`}
                          toneClass={TONE_DOT[concept.tone]}
                          onToggle={() => toggleComplete(item.id)}
                          onOpen={() => session.setSelectedItemId(item.goalId)}
                        />
                      );
                    })
                  : null}
              </section>
            ) : null}
            {doneItems.length > 0 && !collapseDone ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Done
                </h3>
                {doneItems.map((item) => {
                  const concept = occurrenceItem(item);
                  if (treatment === "quiet") {
                    return (
                      <QuietCompletedRow
                        key={item.id}
                        title={concept.title}
                        meta={`${concept.cadence} · ${concept.category}`}
                        toneClass={TONE_DOT[concept.tone]}
                        onToggle={() => toggleComplete(item.id)}
                        onOpen={() => session.setSelectedItemId(item.goalId)}
                      />
                    );
                  }
                  return (
                    <GoalRow
                      key={item.id}
                      item={{ ...concept, id: item.goalId }}
                      completed
                      dimmed
                      onToggle={() => toggleComplete(item.id)}
                      onOpen={() => session.setSelectedItemId(item.goalId)}
                    />
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function DateNum({
  day,
  isToday,
  selected,
  perfect,
  mark,
  compact = false,
}: {
  day: Date;
  isToday: boolean;
  selected: boolean;
  perfect: boolean;
  mark: DateMark;
  compact?: boolean;
}) {
  const num = format(day, "d");
  const size = compact ? "size-6" : "size-8";
  const type = compact ? "text-xs" : "text-lg";
  if (mark === "star" && perfect) {
    return (
      <span
        className={cn(
          "relative mt-0.5 inline-flex items-center justify-center",
          size
        )}
      >
        <Star
          className="absolute size-[1.85em] text-emerald-700/70"
          strokeWidth={1.4}
          aria-hidden
        />
        <span className={cn("relative font-semibold leading-none", type)}>
          {num}
        </span>
      </span>
    );
  }
  if (mark === "nest" && perfect) {
    return (
      <span
        className={cn(
          "mt-0.5 inline-flex items-center justify-center rounded-md ring-[1.5px] ring-emerald-700/70",
          size
        )}
      >
        <span
          className={cn(
            "flex items-center justify-center rounded-sm bg-emerald-50 font-semibold leading-none",
            compact ? "size-4 text-[11px]" : "size-6 text-sm"
          )}
        >
          {num}
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        "mt-0.5 inline-flex items-center justify-center rounded-full font-semibold leading-none",
        size,
        type,
        isToday && "bg-primary text-primary-foreground",
        !isToday && selected && "text-primary"
      )}
    >
      {num}
    </span>
  );
}

function ClarityPill({
  occurrence,
  completed,
  unplaced,
  treatment,
  onClick,
}: {
  occurrence: ClarityOccurrence;
  completed: boolean;
  unplaced: boolean;
  treatment: DoneTreatment;
  onClick: () => void;
}) {
  const item = occurrenceItem(occurrence);
  const strike = completed && treatment === "strike";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left ring-1 touch-manipulation",
        completed && treatment === "strike"
          ? "bg-muted/70 ring-border/60"
          : TONE_PILL[item.tone],
        completed && treatment === "quiet" && "opacity-90",
        unplaced && "ring-amber-400/80"
      )}
    >
      {completed && treatment !== "strike" ? (
        <Check className="size-3.5 shrink-0 text-emerald-700" aria-hidden />
      ) : (
        <span className={cn("size-1.5 shrink-0 rounded-full", TONE_DOT[item.tone])} />
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm font-medium",
          strike && "text-muted-foreground line-through"
        )}
      >
        {item.title}
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground">
        {unplaced ? "unplaced" : completed ? "done" : item.kind === "task" ? "task" : item.cadence}
      </span>
    </button>
  );
}

function DoneMark({
  occurrence,
  onClick,
}: {
  occurrence: ClarityOccurrence;
  onClick: () => void;
}) {
  const item = occurrenceItem(occurrence);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${item.title}, done. Show title`}
      className={cn(
        "flex size-6 items-center justify-center rounded-md ring-1 touch-manipulation",
        TONE_PILL[item.tone]
      )}
    >
      <span className="flex size-3.5 items-center justify-center rounded-[3px] ring-1 ring-emerald-700/70">
        <span className="size-1.5 rounded-[2px] bg-emerald-700" />
      </span>
    </button>
  );
}

function QuietCompletedRow({
  title,
  meta,
  toneClass,
  onToggle,
  onOpen,
}: {
  title: string;
  meta: string;
  toneClass: string;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/50 py-3 last:border-b-0">
      <CompletionToggle
        completed
        size="lg"
        onClick={onToggle}
        aria-label={`Remove completion for ${title}`}
      />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 touch-manipulation text-left"
      >
        <span className="truncate text-[15px] font-semibold tracking-tight">
          {title}
        </span>
        <p className="truncate text-xs text-muted-foreground">{meta}</p>
      </button>
      <span className={cn("size-2 shrink-0 rounded-full", toneClass)} />
    </div>
  );
}
