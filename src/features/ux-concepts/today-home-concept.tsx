"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CONCEPT_PARTNER_NAME,
  CONCEPT_TODAY,
  weekDots,
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
} from "@/features/ux-concepts/concept-primitives";
import { useConceptSession } from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const TABS = ["today", "plan", "progress", "you"] as const;

export function TodayHomeConcept() {
  const session = useConceptSession("today");
  const weekday = format(parseISO(session.selectedDate), "EEEE");
  const dateLine = format(parseISO(session.selectedDate), "MMMM d");
  const remaining = session.dayItems.filter(
    (item) => !session.isComplete(item.id)
  ).length;
  const openItems = session.dayItems.filter(
    (item) => !session.isComplete(item.id)
  );
  const doneItems = session.dayItems.filter((item) =>
    session.isComplete(item.id)
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ConceptExploreBar direction="A" title="Today Home" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="px-4 pb-2 pt-5 md:px-0 md:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dateLine}
                </p>
                <h1 className="text-[2rem] font-semibold leading-none tracking-tight">
                  {weekday}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {remaining} left
                  {session.selectedDate === CONCEPT_TODAY
                    ? " · next is Tempo run"
                    : ""}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <CoachButton onClick={() => session.setCoachOpen(true)} />
                <DesktopKeyHint />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
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
            <WeekPeek selectedDate={session.selectedDate} />
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 md:px-0 md:pb-8">
            {session.activeTab === "today" ? (
              <div className="md:max-w-xl">
                <div className="space-y-3">
                  <RecoverBanner
                    recovered={session.recovered}
                    onOpen={() => session.setRecoverOpen(true)}
                  />
                  <PartnerPulse compact />
                </div>
                <section className="mt-4">
                  {openItems.length === 0 ? (
                    <p className="py-8 text-sm text-muted-foreground">
                      Nothing left on this date. Plan or Progress is a tap away.
                    </p>
                  ) : (
                    openItems.map((item) => (
                      <GoalRow
                        key={item.id}
                        item={item}
                        completed={false}
                        onToggle={() => session.toggleComplete(item.id)}
                        onOpen={() => session.setSelectedItemId(item.id)}
                      />
                    ))
                  )}
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
              </div>
            ) : (
              <HintPanel tab={session.activeTab}>
                {session.activeTab === "plan" ? (
                  <p className="mt-3 text-sm">
                    In this direction the calendar is a mode, not Home. Week
                    peek stays on Today so the month is never the first thing
                    you see.
                  </p>
                ) : null}
              </HintPanel>
            )}
          </main>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex items-end justify-end gap-3">
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

        <aside className="hidden w-[22rem] shrink-0 md:flex md:flex-col md:gap-4">
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            <h2 className="text-sm font-semibold">Inspector</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Desktop split: list stays primary. This pane holds the selected
              row, Duo, or Coach — not another copy of mobile chrome.
            </p>
            {session.selectedItem ? (
              <p className="mt-3 text-sm font-medium">
                {session.selectedItem.title}
              </p>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Select a row. {CONCEPT_PARTNER_NAME} is on Yoga today.
              </p>
            )}
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

function WeekPeek({ selectedDate }: { selectedDate: string }) {
  return (
    <ol className="mt-4 flex gap-1">
      {weekDots.map((dot) => {
        const selected = dot.date === selectedDate;
        return (
          <li key={dot.date} className="flex-1">
            <span
              className={cn(
                "flex h-8 items-center justify-center rounded-full text-[11px] font-medium",
                selected
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
                dot.missed && !selected && "text-amber-700"
              )}
            >
              {format(parseISO(dot.date), "EEEEE")}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
