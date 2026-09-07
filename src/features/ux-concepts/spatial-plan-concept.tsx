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
import { Button } from "@/components/ui/button";
import {
  CONCEPT_MONTH_LABEL,
  CONCEPT_TODAY,
  STRENGTH_MISSED_DATE,
  conceptItems,
} from "@/features/ux-concepts/seed";
import {
  CoachButton,
  ConceptAppTabs,
  ConceptExploreBar,
  ConceptSheets,
  DesktopKeyHint,
  FabNewGoal,
  GoalRow,
  HintPanel,
  PartnerPulse,
  RecoverBanner,
  TONE_DOT,
} from "@/features/ux-concepts/concept-primitives";
import { useConceptSession } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const TABS = ["plan", "today", "progress", "you"] as const;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function itemsForDate(
  date: string,
  recovered: boolean
) {
  return conceptItems.filter((item) => {
    if (item.id === "strength") {
      if (recovered) {
        return date === CONCEPT_TODAY;
      }
      return date === STRENGTH_MISSED_DATE;
    }
    return item.date === date;
  });
}

export function SpatialPlanConcept() {
  const session = useConceptSession("plan");
  const monthAnchor = CONCEPT_TODAY;
  const cells = eachDayOfInterval({
    start: startOfWeek(startOfMonth(parseISO(monthAnchor)), { weekStartsOn: 0 }),
    end: addDays(
      startOfWeek(startOfMonth(parseISO(monthAnchor)), { weekStartsOn: 0 }),
      41
    ),
  });
  const selectedItems = session.dayItems;
  const openSelected = selectedItems.filter(
    (item) => !session.isComplete(item.id)
  );
  const doneSelected = selectedItems.filter((item) =>
    session.isComplete(item.id)
  );

  const dayPanel = (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">
          {format(parseISO(session.selectedDate), "EEEE, MMM d")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {session.selectedDate === CONCEPT_TODAY ? "Today" : "Selected"}
        </span>
      </div>
      <div className="mt-3 space-y-3">
        {session.selectedDate === CONCEPT_TODAY ||
        session.selectedDate === STRENGTH_MISSED_DATE ? (
          <RecoverBanner
            recovered={session.recovered}
            onOpen={() => session.setRecoverOpen(true)}
          />
        ) : null}
        <PartnerPulse compact />
      </div>
      <div className="mt-2">
        {selectedItems.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No goals or tasks on this date.
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
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ConceptExploreBar direction="B" title="Spatial Plan v1 (archive)" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between px-4 pb-2 pt-5 md:px-0 md:pt-0">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Calendar is Home
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {CONCEPT_MONTH_LABEL}
              </h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <CoachButton onClick={() => session.setCoachOpen(true)} />
              <DesktopKeyHint />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-3 pb-28 md:px-0 md:pb-8">
            {session.activeTab === "plan" ? (
              <>
                <div className="rounded-2xl bg-card p-2 ring-1 ring-foreground/10 md:p-3">
                  <div className="grid grid-cols-7 gap-px text-center text-[11px] font-medium text-muted-foreground">
                    {WEEKDAYS.map((label, index) => (
                      <div key={`${label}-${index}`} className="py-1">
                        {label}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px">
                    {cells.map((day) => {
                      const iso = format(day, "yyyy-MM-dd");
                      const inMonth = isSameMonth(day, parseISO(monthAnchor));
                      const selected = iso === session.selectedDate;
                      const isToday = iso === CONCEPT_TODAY;
                      const missed =
                        iso === STRENGTH_MISSED_DATE && !session.recovered;
                      const dots = itemsForDate(iso, session.recovered);
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => session.setSelectedDate(iso)}
                          className={cn(
                            "flex min-h-[3.4rem] flex-col items-center rounded-lg px-0.5 py-1 text-xs touch-manipulation md:min-h-[4.5rem]",
                            !inMonth && "opacity-35",
                            selected && "bg-primary/10 ring-1 ring-primary/40",
                            missed && !selected && "bg-amber-50"
                          )}
                          aria-current={isToday ? "date" : undefined}
                          aria-pressed={selected}
                        >
                          <span
                            className={cn(
                              "flex size-6 items-center justify-center rounded-full",
                              isToday &&
                                !selected &&
                                "bg-primary text-primary-foreground",
                              isToday && selected && "font-semibold"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                          <span className="mt-1 flex gap-0.5">
                            {dots.slice(0, 3).map((item) => (
                              <span
                                key={item.id}
                                className={cn(
                                  "size-1.5 rounded-full",
                                  TONE_DOT[item.tone]
                                )}
                              />
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <p className="mt-2 px-1 text-xs text-muted-foreground md:hidden">
                  Tap a day for that date’s checklist. Amber is Strength to
                  recover.
                </p>
                <section className="mt-4 md:hidden">{dayPanel}</section>
              </>
            ) : (
              <HintPanel tab={session.activeTab}>
                {session.activeTab === "today" ? (
                  <p className="mt-3 text-sm">
                    Today is the selected-day sheet in this direction, not a
                    sibling product.
                  </p>
                ) : null}
              </HintPanel>
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
                onChange={session.setActiveTab}
              />
            </div>
          </div>
        </div>

        <aside className="hidden w-[24rem] shrink-0 md:flex md:flex-col md:gap-4">
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            {dayPanel}
          </div>
          <ConceptAppTabs
            tabs={[...TABS]}
            active={session.activeTab}
            onChange={session.setActiveTab}
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
