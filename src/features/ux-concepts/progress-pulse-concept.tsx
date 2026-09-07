"use client";

import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  CONCEPT_PARTNER_NAME,
  CONCEPT_TODAY,
  CONCEPT_WEEK_DONE,
  CONCEPT_WEEK_PLANNED,
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

const TABS = ["progress", "today", "plan", "you"] as const;

export function ProgressPulseConcept() {
  const session = useConceptSession("progress");
  const remaining = session.remainingToday.length;
  const weekRatio = CONCEPT_WEEK_DONE / CONCEPT_WEEK_PLANNED;
  const shownDone = CONCEPT_WEEK_DONE;
  const shownPlanned = CONCEPT_WEEK_PLANNED;

  const remainingForSelected = session.dayItems.filter(
    (item) => !session.isComplete(item.id)
  );
  const remainingList = (
    <section>
      <h2 className="text-sm font-semibold">
        Remaining {session.selectedDate === CONCEPT_TODAY ? "today" : format(parseISO(session.selectedDate), "EEE")}
        <span className="ml-2 font-normal text-muted-foreground">
          {remainingForSelected.length}
        </span>
      </h2>
      {remainingForSelected.length === 0 ? (
        <p className="py-6 text-sm text-muted-foreground">
          Nothing left on this date. The week pulse still stands.
        </p>
      ) : (
        remainingForSelected.map((item) => (
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
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <ConceptExploreBar direction="C" title="Progress Pulse" />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="px-4 pb-2 pt-5 md:px-0 md:pt-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  This week
                </p>
                <h1 className="text-[2rem] font-semibold leading-none tracking-tight">
                  {shownDone} of {shownPlanned}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {format(parseISO(CONCEPT_TODAY), "EEEE")}: {remaining} left.
                  Not a streak threat.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <CoachButton onClick={() => session.setCoachOpen(true)} />
                <DesktopKeyHint />
              </div>
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto px-4 pb-28 md:px-0 md:pb-8">
            {session.activeTab === "progress" ? (
              <div className="md:max-w-xl">
                <div className="rounded-3xl bg-card p-5 ring-1 ring-foreground/10">
                  <div className="flex items-center gap-5">
                    <WeekRing ratio={weekRatio} label={`${shownDone}/${shownPlanned}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">Week vs plan</p>
                      <p className="text-sm text-muted-foreground">
                        A number the product actually computes from planned
                        sessions — not a vanity dashboard.
                      </p>
                    </div>
                  </div>
                  <ol className="mt-5 flex gap-1">
                    {weekDots.map((dot) => (
                      <li key={dot.date} className="flex-1">
                        <button
                          type="button"
                          className="flex w-full flex-col items-center gap-1 touch-manipulation"
                          onClick={() => session.setSelectedDate(dot.date)}
                        >
                          <span
                            className={cn(
                              "h-10 w-full rounded-full",
                              dot.missed
                                ? "bg-amber-200"
                                : dot.count >= 3
                                  ? "bg-emerald-500"
                                  : dot.count === 2
                                    ? "bg-emerald-300"
                                    : dot.count === 1
                                      ? "bg-emerald-200"
                                      : "bg-muted"
                            )}
                            aria-hidden
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(dot.date), "EEEEE")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 space-y-3">
                  <RecoverBanner
                    recovered={session.recovered}
                    onOpen={() => session.setRecoverOpen(true)}
                  />
                  <PartnerPulse />
                </div>

                <div className="mt-6 md:hidden">{remainingList}</div>
              </div>
            ) : (
              <HintPanel tab={session.activeTab}>
                {session.activeTab === "today" ? (
                  <div className="mt-4">{remainingList}</div>
                ) : (
                  <p className="mt-3 text-sm">
                    {CONCEPT_PARTNER_NAME} stays a pulse on Progress, not a
                    Community feed.
                  </p>
                )}
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
            {remainingList}
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

function WeekRing({ ratio, label }: { ratio: number; label: string }) {
  const clamped = Math.min(1, Math.max(0, ratio));
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  return (
    <svg viewBox="0 0 72 72" className="size-[4.5rem] shrink-0" aria-hidden>
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        className="stroke-muted"
        strokeWidth="8"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        className="stroke-emerald-500"
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="40"
        textAnchor="middle"
        className="fill-foreground text-[11px] font-semibold"
      >
        {label}
      </text>
    </svg>
  );
}
