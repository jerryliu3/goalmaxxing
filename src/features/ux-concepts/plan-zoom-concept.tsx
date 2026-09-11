"use client";

import { addDays, format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CoachButton,
  ConceptAppTabs,
  ConceptExploreBar,
  ConceptSheets,
  DesktopKeyHint,
  DuoModeToggle,
  FabNewGoal,
} from "@/features/ux-concepts/concept-primitives";
import { PlanZoomGoals } from "@/features/ux-concepts/plan-zoom-goals";
import {
  clampSeptemberIso,
  PLAN_ZOOM_DURATION_MS,
  PLAN_ZOOM_MONTH_END,
  PLAN_ZOOM_MONTH_START,
  type CalendarMotion,
  type GoalExperience,
  type PlanZoomLevel,
  type PlanZoomStudy,
} from "@/features/ux-concepts/plan-zoom-motion";
import {
  PlanZoomStage,
  type CalendarMeta,
  type CalendarStageHandle,
} from "@/features/ux-concepts/plan-zoom-stage";
import { CONCEPT_TODAY } from "@/features/ux-concepts/seed";
import {
  useConceptSession,
  type ConceptHomeTab,
} from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const TABS = ["plan", "checklist", "progress", "community", "you"] as const;

const CALENDAR_COPY: Record<
  CalendarMotion,
  { label: string; title: string; note: string; why: string }
> = {
  anchor: {
    label: "Anchor · carried pills",
    title: "The same named pills fly with the date",
    note: "Dates and items are separate layers. Each occurrence keeps one pill and one title from month through vertical week into day. Named pills follow continuous paths into stacked week rows; their width grows so truncated text is revealed, not swapped.",
    why: "Month/week pills must not disappear and reappear as checklist rows. The title never fades. Only the completion control and duration fade in once there is room.",
  },
  ribbon: {
    label: "Ribbon · carried tickets",
    title: "Dates gather; tickets keep their width",
    note: "Month dates collect onto a narrow vertical spine, but the item tickets do not squeeze into that spine. They keep their own width, then the week surface widens around them. Week to day expands those same tickets into checklist rows.",
    why: "The failure mode to avoid: labels crushed into the date spine. Text stays upright and readable while the calendar geometry changes.",
  },
};

const GOAL_COPY: Record<
  GoalExperience,
  { label: string; title: string; note: string; why: string }
> = {
  constellation: {
    label: "Goal constellation",
    title: "Trace actual links, not a force layout",
    note: "Goals keep stable positions. Tempo run and Strength both contribute to Move regularly. Select a node, follow its link, inspect incoming goals, or log a child session to see counts change on both nodes. Independent goals stay unconnected.",
    why: "A goal experience, not a calendar skin. Production must use real relationships and canonical linked completion. This fixture only demonstrates presentation of those links.",
  },
  folio: {
    label: "Living folio",
    title: "Each goal is a volume you can open",
    note: "All goals are personal volumes with per-period session marks. Open a cover to read why, monthly progress, next milestone, and recent sessions. Log or undo today’s session to add or remove a mark, then return to the collection. Covers animate into the opened folio.",
    why: "Proposed entry: tapping the title of a checklist goal opens the folio. The checkbox still completes. Edit stays secondary. Not production routing.",
  },
};

export function PlanZoomConcept() {
  const session = useConceptSession("plan");
  const [study, setStudy] = useState<PlanZoomStudy>("calendar");
  const [calendarMotion, setCalendarMotion] = useState<CalendarMotion>("anchor");
  const [goalExperience, setGoalExperience] =
    useState<GoalExperience>("constellation");
  const [meta, setMeta] = useState<CalendarMeta>({
    depth: 0,
    level: 0,
    heading: "September 2026",
    caption: "Tap a date to open its week",
    status: "September 3 · Month",
  });
  const [intent, setIntent] = useState({ level: 0 as PlanZoomLevel, id: 0 });
  const [playing, setPlaying] = useState(false);
  const calendarRef = useRef<CalendarStageHandle>(null);
  const playToken = useRef(0);

  const onMeta = useCallback((next: CalendarMeta) => {
    setMeta(next);
  }, []);

  const onTabChange = (tab: ConceptHomeTab) => {
    session.setActiveTab("plan");
    if (tab !== "plan") {
      return;
    }
  };

  const goLevel = (level: PlanZoomLevel) => {
    setPlaying(false);
    setIntent((current) => ({ level, id: current.id + 1 }));
  };

  const shiftSelected = (delta: number) => {
    const next = format(addDays(parseISO(session.selectedDate), delta), "yyyy-MM-dd");
    calendarRef.current?.selectIso(
      clampSeptemberIso(next),
      meta.level
    );
  };

  useEffect(() => {
    if (!playing || study !== "calendar") {
      return;
    }
    const token = ++playToken.current;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });
    void (async () => {
      const still = () => playToken.current === token;
      calendarRef.current?.go(0);
      await wait(700);
      if (!still()) return;
      setIntent((current) => ({ level: 1, id: current.id + 1 }));
      await wait(PLAN_ZOOM_DURATION_MS + 900);
      if (!still()) return;
      setIntent((current) => ({ level: 2, id: current.id + 1 }));
      await wait(PLAN_ZOOM_DURATION_MS + 1100);
      if (!still()) return;
      setIntent((current) => ({ level: 1, id: current.id + 1 }));
      await wait(PLAN_ZOOM_DURATION_MS + 800);
      if (!still()) return;
      setIntent((current) => ({ level: 0, id: current.id + 1 }));
      await wait(PLAN_ZOOM_DURATION_MS + 400);
      if (!still()) return;
      setPlaying(false);
    })();
    return () => {
      playToken.current += 1;
    };
  }, [playing, study]);

  const copy =
    study === "calendar"
      ? CALENDAR_COPY[calendarMotion]
      : GOAL_COPY[goalExperience];

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ConceptExploreBar
        direction="B"
        title="Plan zoom · carried pills and tickets"
      />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex items-start justify-between gap-3 px-4 pb-2 pt-5 md:px-0 md:pt-0">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {study === "calendar"
                  ? meta.level === 0
                    ? "Month"
                    : meta.level === 1
                      ? "Vertical week"
                      : "Day"
                  : GOAL_COPY[goalExperience].label}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {study === "calendar" ? meta.heading : GOAL_COPY[goalExperience].title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {study === "calendar"
                  ? meta.caption
                  : "Sample data · stays in this demo"}
              </p>
              {study === "calendar" && meta.level === 2 ? (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Previous date"
                    disabled={session.selectedDate <= PLAN_ZOOM_MONTH_START}
                    onClick={() => shiftSelected(-1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      session.setSelectedDate(CONCEPT_TODAY);
                      calendarRef.current?.selectIso(CONCEPT_TODAY, 2);
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Next date"
                    disabled={session.selectedDate >= PLAN_ZOOM_MONTH_END}
                    onClick={() => shiftSelected(1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              {study === "calendar" ? (
                <>
                  <DuoModeToggle mode={session.duoMode} onChange={session.setDuoMode} />
                  <LevelToggle level={meta.level} onChange={goLevel} />
                  <CoachButton onClick={() => session.setCoachOpen(true)} />
                  <DesktopKeyHint />
                </>
              ) : (
                <GoalToggle
                  experience={goalExperience}
                  onChange={setGoalExperience}
                />
              )}
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-28 md:px-0 md:pb-8">
            {study === "calendar" ? (
              <PlanZoomStage
                ref={calendarRef}
                session={session}
                mode={calendarMotion}
                intent={intent}
                onMeta={onMeta}
              />
            ) : (
              <PlanZoomGoals key={goalExperience} experience={goalExperience} />
            )}
          </main>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex justify-end">
              {study === "calendar" ? (
                <FabNewGoal onClick={() => session.setNewGoalOpen(true)} />
              ) : null}
            </div>
            <div className="pointer-events-auto mt-3">
              <ConceptAppTabs
                tabs={[...TABS]}
                active="plan"
                onChange={onTabChange}
              />
            </div>
          </div>
        </div>

        <aside className="hidden w-[24rem] shrink-0 overflow-y-auto md:flex md:flex-col md:gap-4">
          <StudySwitch study={study} onChange={setStudy} />
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {study === "calendar" ? "Item continuity" : "Goal experience"}
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">{copy.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.note}</p>
            <p className="mt-2 text-sm">{copy.why}</p>
            <div className="mt-4 flex flex-col gap-2">
              {study === "calendar"
                ? (Object.keys(CALENDAR_COPY) as CalendarMotion[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setPlaying(false);
                        setIntent({ level: 0, id: 0 });
                        setCalendarMotion(value);
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm touch-manipulation",
                        calendarMotion === value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "bg-background"
                      )}
                    >
                      {CALENDAR_COPY[value].label}
                    </button>
                  ))
                : (Object.keys(GOAL_COPY) as GoalExperience[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setGoalExperience(value)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-left text-sm touch-manipulation",
                        goalExperience === value
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "bg-background"
                      )}
                    >
                      {GOAL_COPY[value].label}
                    </button>
                  ))}
            </div>
            {study === "calendar" ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setPlaying((current) => !current)}
              >
                {playing ? "Stop demo" : "Play month → week → day"}
              </Button>
            ) : null}
          </div>
          <ConceptAppTabs
            tabs={[...TABS]}
            active="plan"
            onChange={onTabChange}
          />
          {study === "calendar" ? (
            <Button type="button" onClick={() => session.setNewGoalOpen(true)}>
              New goal
            </Button>
          ) : null}
        </aside>
      </div>

      <div className="border-t bg-background px-4 py-3 md:hidden">
        <StudySwitch study={study} onChange={setStudy} />
        <p className="mt-2 text-xs font-medium text-muted-foreground">{copy.title}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {study === "calendar"
            ? (Object.keys(CALENDAR_COPY) as CalendarMotion[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setIntent({ level: 0, id: 0 });
                    setCalendarMotion(value);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium touch-manipulation",
                    calendarMotion === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {CALENDAR_COPY[value].label}
                </button>
              ))
            : (Object.keys(GOAL_COPY) as GoalExperience[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGoalExperience(value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium touch-manipulation",
                    goalExperience === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {GOAL_COPY[value].label}
                </button>
              ))}
          {study === "calendar" ? (
            <button
              type="button"
              onClick={() => setPlaying((current) => !current)}
              className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground touch-manipulation"
            >
              {playing ? "Stop" : "Play"}
            </button>
          ) : null}
        </div>
      </div>

      <ConceptSheets session={session} />
    </div>
  );
}

function StudySwitch({
  study,
  onChange,
}: {
  study: PlanZoomStudy;
  onChange: (study: PlanZoomStudy) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Study"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(
        [
          ["calendar", "Item continuity"],
          ["goals", "Goal experiences"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={study === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-8 rounded-full px-3 touch-manipulation",
            study === value
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

function LevelToggle({
  level,
  onChange,
}: {
  level: PlanZoomLevel;
  onChange: (level: PlanZoomLevel) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Calendar range"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(
        [
          [0, "Month"],
          [1, "Week"],
          [2, "Day"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={level === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-8 rounded-full px-3 touch-manipulation",
            level === value
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

function GoalToggle({
  experience,
  onChange,
}: {
  experience: GoalExperience;
  onChange: (experience: GoalExperience) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Goal experience"
      className="inline-flex rounded-full bg-muted p-0.5 text-xs font-medium"
    >
      {(
        [
          ["constellation", "Constellation"],
          ["folio", "Folio"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={experience === value}
          onClick={() => onChange(value)}
          className={cn(
            "min-h-8 rounded-full px-3 touch-manipulation",
            experience === value
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
