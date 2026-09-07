"use client";

import { addDays, eachDayOfInterval, format, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CONCEPT_MONTH_LABEL,
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  itemsOnDate,
} from "@/features/ux-concepts/seed";
import {
  CoachButton,
  ConceptAppTabs,
  ConceptExploreBar,
  ConceptSheets,
  DesktopKeyHint,
  DuoModeToggle,
  FabNewGoal,
  GoalRow,
  HintPanel,
  PartnerPulse,
  RecoverBanner,
  TONE_DOT,
  WorkPill,
} from "@/features/ux-concepts/concept-primitives";
import { SharedWeekBoard } from "@/features/ux-concepts/shared-week-board";
import {
  useConceptSession,
  type ConceptHomeTab,
  type ConceptSession,
} from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const TABS = ["plan", "checklist", "progress", "community", "you"] as const;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

type CalendarRange = "week" | "month" | "day";

function monthDays(anchor: string) {
  const start = startOfWeek(startOfMonth(parseISO(anchor)), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: addDays(start, 41) });
}

function weekDays(anchor: string) {
  const start = startOfWeek(parseISO(anchor), { weekStartsOn: 0 });
  return eachDayOfInterval({ start, end: addDays(start, 6) });
}

export function SpatialHomeConcept() {
  const session = useConceptSession("plan");
  const router = useRouter();
  const [range, setRange] = useState<CalendarRange>("week");
  const weekCells = useMemo(
    () => weekDays(session.selectedDate),
    [session.selectedDate]
  );
  const monthCells = useMemo(() => monthDays(CONCEPT_TODAY), []);
  const weekStart = startOfWeek(parseISO(session.selectedDate), {
    weekStartsOn: 0,
  });
  const weekRangeLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`;
  const duoWeek = session.duoMode === "duo" && range === "week";

  const openDay = (iso: string) => {
    session.setSelectedDate(iso);
    setRange("day");
  };

  const onTabChange = (tab: ConceptHomeTab) => {
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
      return;
    }
    session.setActiveTab(tab);
  };

  const calendar =
    range === "week" ? (
      duoWeek ? (
        <SharedWeekBoard session={session} days={weekCells} onOpenDay={openDay} />
      ) : (
        <WeekAgenda session={session} days={weekCells} onOpenDay={openDay} />
      )
    ) : range === "month" ? (
      <MonthGrid session={session} days={monthCells} onOpenDay={openDay} />
    ) : (
      <div className="md:max-w-xl">
        <DayPane session={session} />
      </div>
    );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ConceptExploreBar
        locked
        direction="B"
        title="Spatial Home v8 · Solo/Duo week"
      />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          {session.activeTab === "plan" ? (
            <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-5 md:px-0 md:pt-0">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {range === "day" ? "Day" : range === "month" ? "Month" : "Week"}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {range === "week"
                    ? "This week"
                    : range === "month"
                      ? CONCEPT_MONTH_LABEL
                      : format(parseISO(session.selectedDate), "EEEE")}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {range === "week"
                    ? duoWeek
                      ? `${weekRangeLabel} · you and Maya`
                      : `${weekRangeLabel} · pills you can drag later`
                    : range === "month"
                      ? "Tap a day to open its dedicated view."
                      : format(parseISO(session.selectedDate), "MMMM d")}
                </p>
                {range === "day" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Previous day"
                      onClick={() => session.shiftDate(-1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => session.setSelectedDate(CONCEPT_TODAY)}
                    >
                      Today
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Next day"
                      onClick={() => session.shiftDate(1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                ) : !session.recovered ? (
                  <button
                    type="button"
                    className="mt-2 text-left text-xs font-medium text-amber-800 touch-manipulation"
                    onClick={() => session.setRecoverOpen(true)}
                  >
                    1 to reschedule
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <DuoModeToggle mode={session.duoMode} onChange={session.setDuoMode} />
                <RangeToggle range={range} onChange={setRange} />
                <CoachButton onClick={() => session.setCoachOpen(true)} />
                <DesktopKeyHint />
              </div>
            </header>
          ) : session.activeTab === "checklist" ? (
            <header className="px-4 pb-2 pt-5 md:px-0 md:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {format(parseISO(session.selectedDate), "MMMM d")}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Checklist
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {session.remainingApplicable.length} applicable
                    {session.remainingApplicable[0]
                      ? ` · next is ${session.remainingApplicable[0].title}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <DuoModeToggle mode={session.duoMode} onChange={session.setDuoMode} />
                  <CoachButton onClick={() => session.setCoachOpen(true)} />
                </div>
              </div>
            </header>
          ) : null}

          <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 md:px-0 md:pb-8">
            {session.activeTab === "plan" ? (
              calendar
            ) : session.activeTab === "checklist" ? (
              <div className="md:max-w-xl">
                <ChecklistPane session={session} />
              </div>
            ) : (
              <HintPanel tab={session.activeTab} />
            )}
          </main>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex justify-end">
              <FabNewGoal onClick={() => session.setNewGoalOpen(true)} />
            </div>
            <div className="pointer-events-auto mt-3">
              <ConceptAppTabs
                tabs={[...TABS]}
                active={session.activeTab}
                onChange={onTabChange}
              />
            </div>
          </div>
        </div>

        <aside className="hidden w-[24rem] shrink-0 md:flex md:flex-col md:gap-4">
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            {session.activeTab === "plan" && range !== "day" ? (
              <DayPane session={session} />
            ) : session.activeTab === "plan" ? (
              <p className="text-sm text-muted-foreground">
                Day is a first-class Plan view. Checklist is still the loose
                list — Review offer never sits here.
              </p>
            ) : session.activeTab === "checklist" ? (
              <p className="text-sm text-muted-foreground">
                Checklist is the loose list: Review offer never sits on the
                week. Day view is placed work only.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Destinations, not another copy of mobile chrome.
              </p>
            )}
          </div>
          <ConceptAppTabs
            tabs={[...TABS]}
            active={session.activeTab}
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

function WeekAgenda({
  session,
  days,
  onOpenDay,
}: {
  session: ConceptSession;
  days: Date[];
  onOpenDay: (iso: string) => void;
}) {
  return (
    <ol aria-label="Week agenda" className="flex flex-col">
      {days.map((day) => {
        const iso = format(day, "yyyy-MM-dd");
        const selected = iso === session.selectedDate;
        const isToday = iso === CONCEPT_TODAY;
        const missed = iso === STRENGTH_MISSED_DATE && !session.recovered;
        const items = itemsOnDate(iso, session.recoveredTo);
        const openItems = items.filter((item) => !session.isComplete(item.id));
        const nextTitle = openItems[0]?.title;
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
                aria-label={format(day, "EEEE, MMM d")}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={selected}
              >
                <span className="block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {format(day, "EEE")}
                </span>
                <span
                  className={cn(
                    "mt-0.5 inline-flex size-8 items-center justify-center rounded-full text-lg font-semibold leading-none",
                    isToday && "bg-primary text-primary-foreground",
                    !isToday && selected && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </span>
              </button>
              <div
                className="flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const itemId = event.dataTransfer.getData(
                    "text/goalmaxxing-item"
                  );
                  if (itemId === "strength" && !session.recovered) {
                    session.recoverStrengthToDate(iso);
                  }
                }}
              >
                {items.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onOpenDay(iso)}
                    className="min-h-[2.75rem] w-full rounded-lg px-2 text-left text-sm text-muted-foreground touch-manipulation"
                  >
                    No work this day
                  </button>
                ) : (
                  items.map((item) => {
                    const completed = session.isComplete(item.id);
                    const needsRecover =
                      item.id === "strength" && !session.recovered;
                    return (
                      <WorkPill
                        key={item.id}
                        item={item}
                        completed={completed}
                        unplaced={needsRecover}
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
                  })
                )}
                {openItems.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {openItems.length} left
                    {nextTitle ? ` · next ${nextTitle}` : ""}
                    {missed ? " · recover Strength" : ""}
                  </p>
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
  onOpenDay,
}: {
  session: ConceptSession;
  days: Date[];
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
          const dots = itemsOnDate(iso, session.recoveredTo);
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
              aria-label={format(day, "EEEE, MMM d")}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={selected}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full",
                  isToday && !selected && "bg-primary text-primary-foreground",
                  isToday && selected && "font-semibold"
                )}
              >
                {format(day, "d")}
              </span>
              <span className="mt-1 flex gap-0.5">
                {dots.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className={cn("size-1.5 rounded-full", TONE_DOT[item.tone])}
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

function DayPane({ session }: { session: ConceptSession }) {
  const openSelected = session.dayItems.filter(
    (item) => !session.isComplete(item.id)
  );
  const doneSelected = session.dayItems.filter((item) =>
    session.isComplete(item.id)
  );
  const remaining = openSelected.length;
  const nextTitle = openSelected[0]?.title;
  const showRecover =
    !session.recovered &&
    (session.selectedDate === CONCEPT_TODAY ||
      session.selectedDate === STRENGTH_MISSED_DATE);

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {format(parseISO(session.selectedDate), "EEEE, MMM d")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {remaining} left
            {nextTitle ? ` · next is ${nextTitle}` : ""}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {session.selectedDate === CONCEPT_TODAY ? "Today" : "This day"}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {showRecover ? (
          <RecoverBanner
            recovered={session.recovered}
            onOpen={() => session.setRecoverOpen(true)}
          />
        ) : null}
        <PartnerPulse compact />
      </div>
      <div className="mt-2">
        {session.dayItems.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No work placed on this day.
          </p>
        ) : (
          <>
            {openSelected.map((item) => (
              <GoalRow
                key={item.id}
                item={item}
                completed={false}
                onToggle={() => session.toggleComplete(item.id)}
                onOpen={() => session.setSelectedItemId(item.id)}
              />
            ))}
            {doneSelected.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Done
                </h3>
                {doneSelected.map((item) => (
                  <GoalRow
                    key={item.id}
                    item={item}
                    completed
                    dimmed
                    onToggle={() => session.toggleComplete(item.id)}
                    onOpen={() => session.setSelectedItemId(item.id)}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function ChecklistPane({ session }: { session: ConceptSession }) {
  const openItems = session.applicableItems.filter(
    (item) => !session.isComplete(item.id)
  );
  const doneItems = session.applicableItems.filter((item) =>
    session.isComplete(item.id)
  );
  const showRecover = !session.recovered;

  return (
    <div>
      <div className="space-y-3">
        {showRecover ? (
          <RecoverBanner
            recovered={session.recovered}
            onOpen={() => session.setRecoverOpen(true)}
          />
        ) : null}
        <PartnerPulse />
      </div>
      <section className="mt-4">
        {openItems.map((item) => (
          <GoalRow
            key={item.id}
            item={item}
            completed={false}
            onToggle={() => session.toggleComplete(item.id)}
            onOpen={() => session.setSelectedItemId(item.id)}
          />
        ))}
      </section>
      {doneItems.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Done
          </h2>
          {doneItems.map((item) => (
            <GoalRow
              key={item.id}
              item={item}
              completed
              dimmed
              onToggle={() => session.toggleComplete(item.id)}
              onOpen={() => session.setSelectedItemId(item.id)}
            />
          ))}
        </section>
      ) : null}
      <p className="mt-8 text-xs text-muted-foreground">
        Later this week: Team sync Fri · Long ride Sun. Those stay on the
        calendar until they become applicable.
      </p>
    </div>
  );
}
