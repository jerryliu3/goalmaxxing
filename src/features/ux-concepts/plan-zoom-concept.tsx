"use client";

import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import {
  type PlanZoomMotion,
  type PlanZoomRange,
} from "@/features/ux-concepts/plan-zoom-motion";
import { PlanZoomStage } from "@/features/ux-concepts/plan-zoom-stage";
import { CONCEPT_MONTH_LABEL, CONCEPT_TODAY } from "@/features/ux-concepts/seed";
import {
  useConceptSession,
  type ConceptHomeTab,
} from "@/features/ux-concepts/use-concept-session";
import { cn } from "@/lib/utils";

const TABS = ["plan", "checklist", "progress", "community", "you"] as const;

const MOTION_COPY: Record<
  PlanZoomMotion,
  { label: string; title: string; note: string }
> = {
  compress: {
    label: "Expand / compress",
    title: "The stack is the view",
    note: "Week and day stay one vertical object. The selected day grows; the others squeeze shut. Pills lengthen into rows. Month does the same to weeks.",
  },
  dive: {
    label: "Camera dive",
    title: "Zoom toward the day",
    note: "Same stack, plus a scale/pan so going more specific feels like the camera moves in, and going broader pulls back.",
  },
  fade: {
    label: "Fade (today)",
    title: "Current production swap",
    note: "Control. This is the live calendar transition: unmount and fade. Use it to feel the difference.",
  },
};

export function PlanZoomConcept() {
  const session = useConceptSession("plan");
  const [range, setRange] = useState<PlanZoomRange>("week");
  const [motionMode, setMotionMode] = useState<PlanZoomMotion>("compress");
  const [playing, setPlaying] = useState(false);
  const playToken = useRef(0);
  const weekStart = startOfWeek(parseISO(session.selectedDate), {
    weekStartsOn: 0,
  });
  const weekRangeLabel = `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`;

  const openDay = (iso: string) => {
    session.setSelectedDate(iso);
    setRange("day");
  };

  const onTabChange = (tab: ConceptHomeTab) => {
    session.setActiveTab("plan");
    if (tab !== "plan") {
      return;
    }
  };

  useEffect(() => {
    if (!playing) {
      return;
    }
    const token = ++playToken.current;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
      });
    void (async () => {
      const still = () => playToken.current === token;
      setRange("week");
      await wait(900);
      if (!still()) return;
      setRange("day");
      await wait(1500);
      if (!still()) return;
      setRange("week");
      await wait(1400);
      if (!still()) return;
      setRange("month");
      await wait(1500);
      if (!still()) return;
      setRange("week");
      await wait(1200);
      if (!still()) return;
      setPlaying(false);
    })();
    return () => {
      playToken.current += 1;
    };
  }, [playing]);

  const copy = MOTION_COPY[motionMode];

  return (
    <div className="flex h-dvh flex-col bg-background">
      <ConceptExploreBar
        direction="B"
        title="Plan zoom · expand / compress study"
      />
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col md:flex-row md:gap-8 md:px-6 md:py-6">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
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
                  ? `${weekRangeLabel} · tap a day to zoom in`
                  : range === "month"
                    ? "Tap a day to zoom through the week into it."
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
                    onClick={() => {
                      session.setSelectedDate(CONCEPT_TODAY);
                      setRange("day");
                    }}
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
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-2">
              <DuoModeToggle mode={session.duoMode} onChange={session.setDuoMode} />
              <RangeToggle range={range} onChange={setRange} />
              <CoachButton onClick={() => session.setCoachOpen(true)} />
              <DesktopKeyHint />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-hidden px-3 pb-28 md:px-0 md:pb-8">
            <PlanZoomStage
              session={session}
              range={range}
              motionMode={motionMode}
              onOpenDay={openDay}
            />
          </main>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex justify-end">
              <FabNewGoal onClick={() => session.setNewGoalOpen(true)} />
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

        <aside className="hidden w-[24rem] shrink-0 md:flex md:flex-col md:gap-4">
          <div className="rounded-2xl border bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Motion study
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{copy.note}</p>
            <div className="mt-4 flex flex-col gap-2">
              {(Object.keys(MOTION_COPY) as PlanZoomMotion[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMotionMode(value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-left text-sm touch-manipulation",
                    motionMode === value
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "bg-background"
                  )}
                >
                  {MOTION_COPY[value].label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => setPlaying((current) => !current)}
            >
              {playing ? "Stop demo" : "Play week ↔ day ↔ month"}
            </Button>
          </div>
          <ConceptAppTabs
            tabs={[...TABS]}
            active="plan"
            onChange={onTabChange}
          />
          <Button type="button" onClick={() => session.setNewGoalOpen(true)}>
            New goal
          </Button>
        </aside>
      </div>

      <div className="border-t bg-background px-4 py-3 md:hidden">
        <p className="text-xs font-medium text-muted-foreground">{copy.title}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(MOTION_COPY) as PlanZoomMotion[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setMotionMode(value)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium touch-manipulation",
                motionMode === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {MOTION_COPY[value].label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPlaying((current) => !current)}
            className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground touch-manipulation"
          >
            {playing ? "Stop" : "Play"}
          </button>
        </div>
      </div>

      <ConceptSheets session={session} />
    </div>
  );
}

function RangeToggle({
  range,
  onChange,
}: {
  range: PlanZoomRange;
  onChange: (range: PlanZoomRange) => void;
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
