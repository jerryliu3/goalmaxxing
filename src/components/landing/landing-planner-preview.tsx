"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import {
  LandingPartnerPhonePreview,
  shouldShowPartnerPhone,
  shouldShowPartnerPhoneNotification,
} from "@/components/landing/landing-partner-phone-preview";
import { LandingTryMeHint } from "@/components/landing/landing-try-me-hint";

export type PlannerDemoPhase =
  | "month"
  | "month-lifting-past"
  | "month-moving-past"
  | "month-settling-past"
  | "month-lifting-future"
  | "month-moving-future"
  | "month-settling-future"
  | "clicking-save"
  | "saving"
  | "saved"
  | "opening-week-menu"
  | "selecting-week"
  | "month-opening-week"
  | "week"
  | "week-tapping"
  | "week-preview"
  | "week-typing"
  | "week-completing"
  | "week-completed"
  | "week-returning-month"
  | "opening-month-menu"
  | "selecting-month";

export type PlannerDemoMode = "solo" | "partner" | "duo";

type TaskTone = "blue" | "emerald" | "violet" | "amber";
type MonthMoveKey = "past" | "future";
type MonthEntryVariant = "default" | "ghost" | "new";
type MonthEntryRole =
  | "past-source"
  | "past-dest"
  | "future-source"
  | "future-dest";

type SeededTask = {
  id: string;
  label: string;
  tone: TaskTone;
  schedule?: string;
  category?: string;
};

type SeededTaskDetail = {
  schedule?: string;
  category?: string;
};

export function getSeededTaskDetail(task: SeededTaskDetail) {
  if (!task.schedule || !task.category) {
    return null;
  }
  return `${task.schedule} · ${task.category}`;
}

export type MonthDemoEntry = SeededTask & {
  variant: MonthEntryVariant;
  hidden?: boolean;
  role?: MonthEntryRole;
};

type FlightGeometry = {
  moveKey: MonthMoveKey;
  left: number;
  top: number;
  width: number;
  height: number;
  deltaX: number;
  deltaY: number;
};

export const plannerDemoViewOptions = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "three-day", label: "3 Day" },
  { value: "day", label: "Day" },
] as const;

const phaseOrder: PlannerDemoPhase[] = [
  "month",
  "month-lifting-past",
  "month-moving-past",
  "month-settling-past",
  "month-lifting-future",
  "month-moving-future",
  "month-settling-future",
  "clicking-save",
  "saving",
  "saved",
  "opening-week-menu",
  "selecting-week",
  "week",
  "week-tapping",
  "week-preview",
  "week-completing",
  "week-completed",
  "opening-month-menu",
  "selecting-month",
];

export const phaseDurationMs: Record<PlannerDemoPhase, number> = {
  month: 1100,
  "month-lifting-past": 280,
  "month-moving-past": 720,
  "month-settling-past": 280,
  "month-lifting-future": 280,
  "month-moving-future": 720,
  "month-settling-future": 280,
  "clicking-save": 500,
  saving: 650,
  saved: 2000,
  "opening-week-menu": 400,
  "selecting-week": 400,
  "month-opening-week": 500,
  week: 1200,
  "week-tapping": 450,
  "week-preview": 900,
  "week-typing": 1200,
  "week-completing": 550,
  "week-completed": 2000,
  "week-returning-month": 500,
  "opening-month-menu": 400,
  "selecting-month": 400,
};

export const SEEDED_TODAY = 15;
export const TEMPO_MOVE_DEST_DAY = 25;
export const STRENGTH_RECURRING_DAYS = [3, 10, 17, 24, 31] as const;
export const STRENGTH_MOVE_SOURCE_DAY = 17;
export const PARTNER_NUDGE_MESSAGE = "You got this!";

export const monthEntries = [
  { id: "focus", day: 4, label: "Deep work", tone: "blue" },
  { id: "tempo", day: 8, label: "Tempo run", tone: "emerald" },
  { id: "plan", day: 12, label: "Plan review", tone: "violet" },
  { id: "launch", day: SEEDED_TODAY, label: "Launch notes", tone: "amber" },
  { id: "review", day: 24, label: "Weekly reset", tone: "blue" },
] as const satisfies ReadonlyArray<{
  id: string;
  day: number;
  label: string;
  tone: TaskTone;
}>;

export const partnerCompletions = [
  { id: "mobility", day: 3, label: "Mobility" },
  { id: "reading", day: 6, label: "Read 20 pages" },
  { id: "meal-prep", day: 11, label: "Meal prep" },
  { id: "evening-walk", day: 16, label: "Evening walk" },
  { id: "long-ride", day: 17, label: "Long ride" },
  { id: "bike", day: 21, label: "Bike commute" },
] as const;

export const PARTNER_WEEK_TODAY = {
  id: "yoga",
  day: SEEDED_TODAY,
  label: "Yoga",
} as const;

export function visibleMonthGoalIds(mode: PlannerDemoMode) {
  const viewerIds = monthEntries.map((entry) => entry.id);
  const partnerIds = [
    ...partnerCompletions.map((entry) => entry.id),
    PARTNER_WEEK_TODAY.id,
  ];
  if (mode === "solo") {
    return [...viewerIds];
  }
  if (mode === "partner") {
    return [...partnerIds];
  }
  return [...viewerIds, ...partnerIds];
}

export function showsViewerPlan(mode: PlannerDemoMode) {
  return mode !== "partner";
}

export function showsPartnerCompletions(mode: PlannerDemoMode) {
  return mode !== "solo";
}

export const WEEK_TODAY_TASKS = [
  {
    id: "tempo-run",
    label: "Tempo run",
    tone: "emerald",
    schedule: "Weekly recurring",
    category: "Health",
  },
  {
    id: "deep-work",
    label: "Deep work",
    tone: "blue",
    schedule: "Daily",
    category: "Career",
  },
  {
    id: "launch-notes",
    label: "Launch notes",
    tone: "amber",
    schedule: "Weekly recurring",
    category: "Career",
  },
  {
    id: "team-sync",
    label: "Team sync",
    tone: "violet",
    schedule: "Weekly recurring",
    category: "Interpersonal",
  },
] as const satisfies ReadonlyArray<SeededTask>;

export const WEEK_CELL_VISIBLE_COUNT = 3;
export const WEEK_PREVIEW_VISIBLE_COUNT = 3;
export const MONTH_DUO_TODAY_VISIBLE_COUNT = 2;

export function moreCountLabel(hiddenCount: number) {
  return hiddenCount > 0 ? `+${hiddenCount} more` : null;
}

export function getDuoMonthTodayLayout(
  viewerEntries: ReadonlyArray<MonthDemoEntry>,
  partnerEntries: ReadonlyArray<{ id: string; day: number; label: string }>,
  options?: { strengthLandedOnToday?: boolean }
) {
  const strengthLandedOnToday = options?.strengthLandedOnToday ?? false;
  const partnerHidden =
    strengthLandedOnToday ||
    viewerEntries.length + partnerEntries.length > MONTH_DUO_TODAY_VISIBLE_COUNT;

  if (!partnerHidden) {
    return {
      viewerVisible: viewerEntries,
      partnerVisible: partnerEntries,
      hiddenCount: 0,
    };
  }

  const viewerVisible = viewerEntries.slice(0, MONTH_DUO_TODAY_VISIBLE_COUNT);
  const hiddenCount =
    viewerEntries.length -
    viewerVisible.length +
    partnerEntries.length;

  return {
    viewerVisible,
    partnerVisible: [],
    hiddenCount,
  };
}

export function isStrengthInFlightToToday(
  phase: PlannerDemoPhase,
  hasFutureDest: boolean,
  planSaved: boolean
) {
  if (planSaved || hasFutureDest) {
    return false;
  }

  const phaseIndex = phaseOrder.indexOf(phase);
  return (
    phaseIndex >= phaseOrder.indexOf("month-lifting-future") &&
    phaseIndex <= phaseOrder.indexOf("month-settling-future")
  );
}

export function getWeekTodayCellLayout(mode: PlannerDemoMode) {
  const viewerTaskCount = WEEK_TODAY_TASKS.length;
  const partnerTaskCount = mode === "solo" ? 0 : 1;
  const viewerVisibleCount = Math.min(viewerTaskCount, WEEK_CELL_VISIBLE_COUNT);
  const hiddenViewerCount = viewerTaskCount - viewerVisibleCount;

  if (mode === "duo") {
    return {
      viewerVisibleCount,
      showPartnerInCell: false,
      hiddenCount: hiddenViewerCount + partnerTaskCount,
    };
  }

  if (mode === "partner") {
    return {
      viewerVisibleCount: 0,
      showPartnerInCell: true,
      hiddenCount: 0,
    };
  }

  return {
    viewerVisibleCount,
    showPartnerInCell: false,
    hiddenCount: hiddenViewerCount,
  };
}

const seededDays: ReadonlyArray<{
  id: string;
  day: string;
  date: string;
  isToday?: boolean;
  tasks: readonly SeededTask[];
}> = [
  {
    id: "mon",
    day: "Mon",
    date: "12",
    tasks: [
      { id: "focus", label: "Focus", tone: "blue" },
      { id: "goal-review", label: "Goal review", tone: "violet" },
    ],
  },
  {
    id: "tue",
    day: "Tue",
    date: "13",
    tasks: [{ id: "roadmap", label: "Roadmap", tone: "amber" }],
  },
  {
    id: "wed",
    day: "Wed",
    date: "14",
    tasks: [{ id: "launch-copy", label: "Launch copy", tone: "violet" }],
  },
  {
    id: "thu",
    day: "Thu",
    date: String(SEEDED_TODAY),
    isToday: true,
    tasks: WEEK_TODAY_TASKS,
  },
  {
    id: "fri",
    day: "Fri",
    date: "16",
    tasks: [{ id: "update", label: "Update", tone: "amber" }],
  },
  { id: "sat", day: "Sat", date: "17", tasks: [{ id: "strength-sat", label: "Strength", tone: "emerald" }] },
  {
    id: "sun",
    day: "Sun",
    date: "18",
    tasks: [{ id: "weekly-review", label: "Weekly review", tone: "blue" }],
  },
];

export function visibleWeekGoalIds(mode: PlannerDemoMode) {
  const viewerIds = seededDays.flatMap((day) =>
    day.tasks.map((task) => task.id)
  );
  const partnerIds = seededDays.flatMap((day) => {
    if (day.date === String(SEEDED_TODAY)) {
      return [PARTNER_WEEK_TODAY.id];
    }
    return partnerCompletions
      .filter((entry) => String(entry.day) === day.date)
      .map((entry) => entry.id);
  });
  if (mode === "solo") {
    return viewerIds;
  }
  if (mode === "partner") {
    return [...partnerIds];
  }
  return [...viewerIds, ...partnerIds];
}

const monthDates = Array.from({ length: 35 }, (_, index) =>
  index < 2 || index > 32 ? null : index - 1
);

const tempoTask: SeededTask = {
  id: "tempo",
  label: "Tempo run",
  tone: "emerald",
};

const strengthTask: SeededTask = {
  id: "strength",
  label: "Strength",
  tone: "emerald",
};

const partnerPhaseOrder: PlannerDemoPhase[] = [
  "month",
  "month-opening-week",
  "week",
  "week-tapping",
  "week-preview",
  "week-typing",
  "week-completing",
  "week-completed",
  "opening-month-menu",
  "selecting-month",
];

function isPartnerWeekPreviewPhase(phase: PlannerDemoPhase) {
  return (
    phase === "week-preview" ||
    phase === "week-typing" ||
    phase === "week-completing" ||
    phase === "week-completed"
  );
}

export function isPartnerPlannerWeekViewPhase(phase: PlannerDemoPhase) {
  return (
    phase === "week" ||
    phase === "week-tapping" ||
    isPartnerWeekPreviewPhase(phase) ||
    phase === "opening-month-menu"
  );
}

function isPartnerWeekSurfacePhase(phase: PlannerDemoPhase) {
  return (
    isPartnerWeekPreviewPhase(phase) || phase === "opening-month-menu"
  );
}

function getActivePhaseOrder(mode: PlannerDemoMode) {
  return mode === "partner" ? partnerPhaseOrder : phaseOrder;
}

export function nextPlannerDemoPhase(
  phase: PlannerDemoPhase,
  reducedMotion: boolean,
  mode: PlannerDemoMode = "solo"
): PlannerDemoPhase {
  if (reducedMotion) {
    return "month";
  }

  const order = mode === "partner" ? partnerPhaseOrder : phaseOrder;
  const index = order.indexOf(phase);
  if (index < 0) {
    return order[0];
  }
  return order[(index + 1) % order.length];
}

export function isBusyPlannerDemoPhase(phase: PlannerDemoPhase) {
  return (
    phase === "week-tapping" ||
    phase === "month-opening-week" ||
    phase === "week-completing" ||
    phase.includes("opening-") ||
    phase.includes("selecting-") ||
    isTravelPhase(phase) ||
    phase === "clicking-save" ||
    phase === "saving"
  );
}

function getStatusNote(phase: PlannerDemoPhase, mode: PlannerDemoMode = "solo") {
  if (mode === "partner") {
    if (phase === "month-opening-week") {
      return "Opening Alex's week";
    }
    if (phase === "opening-month-menu" || phase === "selecting-month") {
      return "Back to Alex's month";
    }
    if (phase === "week-tapping") {
      return "Opening Alex's day";
    }
    if (phase === "week-preview") {
      return "Reviewing Alex's progress";
    }
    if (phase === "week-typing") {
      return "Writing a nudge";
    }
    if (phase === "week-completing") {
      return "Sending a nudge";
    }
    if (phase === "week-completed") {
      return "Nudge sent";
    }
    if (phase.startsWith("week")) {
      return "Alex's week";
    }
    return "Alex's August";
  }

  switch (phase) {
    case "week-tapping":
      return "Opening today";
    case "week-preview":
      return "Reviewing today";
    case "week-completing":
      return "Marking Tempo run done";
    case "week-completed":
      return "Progress updated";
    case "opening-month-menu":
    case "selecting-month":
      return "Switching to Month";
    case "month":
      return "August overview";
    case "month-lifting-past":
    case "month-moving-past":
    case "month-settling-past":
      return "Moving missed Tempo run forward";
    case "month-lifting-future":
    case "month-moving-future":
    case "month-settling-future":
      return "Bringing Strength into today";
    case "clicking-save":
      return "Saving plan";
    case "saving":
      return "Saving 2 plan updates...";
    case "saved":
      return "Plan saved";
    case "opening-week-menu":
    case "selecting-week":
      return "Returning to Week";
    default:
      return "Reviewing this week";
  }
}

function toneClassName(tone: TaskTone) {
  if (tone === "emerald") {
    return "border-gain/40 bg-gain/15 text-foreground";
  }
  if (tone === "violet") {
    return "border-primary/40 bg-primary/15 text-foreground";
  }
  if (tone === "amber") {
    return "border-recover/40 bg-recover/15 text-foreground";
  }
  return "border-primary/40 bg-primary/15 text-foreground";
}

function getActiveMonthMove(phase: PlannerDemoPhase): MonthMoveKey | null {
  if (phase.endsWith("-past")) {
    return "past";
  }
  if (phase.endsWith("-future")) {
    return "future";
  }
  return null;
}

function isTravelPhase(phase: PlannerDemoPhase) {
  return (
    phase.includes("-lifting-") ||
    phase.includes("-moving-") ||
    phase.includes("-settling-")
  );
}

export function getMonthDemoEntries(
  date: number,
  phase: PlannerDemoPhase
): MonthDemoEntry[] {
  const phaseIndex = phaseOrder.indexOf(phase);
  const pastMoved = phaseIndex > phaseOrder.indexOf("month-settling-past");
  const futureMoved = phaseIndex > phaseOrder.indexOf("month-settling-future");
  const planSaved = phaseIndex >= phaseOrder.indexOf("saved");
  const travelingPast = getActiveMonthMove(phase) === "past" && isTravelPhase(phase);
  const travelingFuture =
    getActiveMonthMove(phase) === "future" && isTravelPhase(phase);
  const entries: MonthDemoEntry[] = [];

  for (const entry of monthEntries) {
    if (entry.day !== date) {
      continue;
    }

    if (entry.id === "tempo") {
      if (travelingPast) {
        entries.push({
          ...entry,
          variant: "default",
          hidden: true,
          role: "past-source",
        });
        continue;
      }
      if (pastMoved && planSaved) {
        continue;
      }
      if (pastMoved) {
        entries.push({ ...entry, variant: "ghost", role: "past-source" });
        continue;
      }
    }

    entries.push({ ...entry, variant: "default" });
  }

  if ((STRENGTH_RECURRING_DAYS as readonly number[]).includes(date)) {
    if (date === STRENGTH_MOVE_SOURCE_DAY) {
      if (travelingFuture) {
        entries.push({
          ...strengthTask,
          variant: "default",
          hidden: true,
          role: "future-source",
        });
      } else if (futureMoved && planSaved) {
        // Strength moved to today; leave Saturday empty after save.
      } else if (futureMoved) {
        entries.push({
          ...strengthTask,
          variant: "ghost",
          role: "future-source",
        });
      } else {
        entries.push({ ...strengthTask, variant: "default" });
      }
    } else {
      entries.push({ ...strengthTask, variant: "default" });
    }
  }

  if (date === TEMPO_MOVE_DEST_DAY && pastMoved) {
    entries.push({
      ...tempoTask,
      variant: planSaved ? "default" : "new",
      role: "past-dest",
    });
  }

  if (date === SEEDED_TODAY && futureMoved) {
    entries.push({
      ...strengthTask,
      variant: planSaved ? "default" : "new",
      role: "future-dest",
    });
  }

  return entries;
}

export function isViewerMonthGoalCompleted(
  entry: MonthDemoEntry,
  date: number
): boolean {
  if (entry.variant === "ghost" || entry.variant === "new") {
    return false;
  }
  if (entry.role) {
    return false;
  }
  if (entry.id === "tempo") {
    return false;
  }
  return date < SEEDED_TODAY;
}

export function isViewerWeekTaskCompleted(
  taskId: string,
  dayDate: number,
  isToday: boolean,
  weekSessionCompleted: boolean
): boolean {
  if (isToday) {
    return taskId === "tempo-run" && weekSessionCompleted;
  }
  return dayDate < SEEDED_TODAY;
}

export function isPartnerGoalCompleted(day: number): boolean {
  if (day >= SEEDED_TODAY) {
    return false;
  }
  // Leave one recent past goal unchecked for realism.
  return day !== 11;
}

const taskChipLayoutClassName =
  "flex min-h-7 items-center gap-1 rounded-md border px-1.5 py-1 text-[9px] leading-[1.2] font-medium shadow-[0_1px_1px_rgba(15,23,42,0.06)]";

function TaskTile({
  task,
  completed = false,
}: {
  task: SeededTask;
  completed?: boolean;
}) {
  return (
    <p
      className={`${taskChipLayoutClassName} whitespace-normal ${toneClassName(
        task.tone
      )}`}
    >
      {completed ? <Check className="size-2.5 shrink-0 text-gain" /> : null}
      <span>{task.label}</span>
    </p>
  );
}

function MonthPill({
  task,
  variant = "default",
  completed = false,
}: {
  task: SeededTask;
  variant?: MonthEntryVariant;
  completed?: boolean;
}) {
  return (
    <div
      data-month-entry={task.id}
      data-month-entry-variant={variant}
      title={task.label}
      className={`${taskChipLayoutClassName} overflow-hidden ${
        variant === "ghost"
          ? "border-dashed border-border bg-page text-muted-foreground line-through shadow-none"
          : variant === "new"
            ? "border-primary/40 bg-muted text-foreground"
            : toneClassName(task.tone)
      }`}
    >
      {completed ? <Check className="size-2.5 shrink-0 text-gain" /> : null}
      <span className="min-w-0 truncate">{task.label}</span>
    </div>
  );
}

function WeekPreviewTaskRow({
  task,
  completed,
}: {
  task: SeededTask;
  completed: boolean;
}) {
  const detail = getSeededTaskDetail(task);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-gain/35 bg-background p-2">
      <span
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
          completed
            ? "border-gain bg-gain text-primary-foreground"
            : "border-border text-transparent"
        }`}
      >
        <Check className="size-3" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-medium">{task.label}</p>
        {detail ? (
          <p className="text-[8px] text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

function PartnerNudgeComposer({
  phase,
  reducedMotion,
  sent,
}: {
  phase: PlannerDemoPhase;
  reducedMotion: boolean;
  sent: boolean;
}) {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (phase !== "week-typing" || reducedMotion) {
      return;
    }

    let index = 0;
    const intervalId = window.setInterval(() => {
      index += 1;
      setTypedText(PARTNER_NUDGE_MESSAGE.slice(0, index));
      if (index >= PARTNER_NUDGE_MESSAGE.length) {
        window.clearInterval(intervalId);
      }
    }, 85);

    return () => window.clearInterval(intervalId);
  }, [phase, reducedMotion]);

  const message =
    sent || phase === "week-completing" || phase === "week-completed"
      ? PARTNER_NUDGE_MESSAGE
      : phase === "week-typing"
        ? reducedMotion
          ? PARTNER_NUDGE_MESSAGE
          : typedText
        : "";

  return (
    <div className="mt-3 flex items-center gap-2">
      <div
        className={`min-w-0 flex-1 rounded-lg border bg-background px-2 py-1.5 text-[10px] ${
          message ? "font-medium text-foreground" : "text-muted-foreground"
        }`}
      >
        {message || "Send a nudge..."}
      </div>
      <div
        data-demo-send-nudge
        className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[10px] font-semibold text-primary-foreground shadow-sm transition ${
          phase === "week-completing"
            ? "scale-95 bg-primary"
            : sent
              ? "bg-primary"
              : "bg-primary"
        }`}
      >
        {phase === "week-completing" ? (
          <Loader2 className="size-3 animate-spin" />
        ) : sent ? (
          <Check className="size-3" />
        ) : null}
        {phase === "week-completing"
          ? "Sending..."
          : sent
            ? "Sent"
            : "Send nudge"}
      </div>
    </div>
  );
}

function PartnerPill({
  label,
  completed = false,
}: {
  label: string;
  completed?: boolean;
}) {
  return (
    <div
      data-owner="partner"
      title={label}
      className={`${taskChipLayoutClassName} overflow-hidden ${
        completed
          ? "border-2 border-primary bg-transparent text-primary shadow-none"
          : "border border-primary/40 bg-muted/60 text-foreground shadow-none"
      }`}
      aria-label={
        completed ? `${label}. Partner marked this done.` : `${label}. Planned`
      }
    >
      {completed ? <StyleCompletionMark done className="size-2.5 shrink-0" /> : null}
      <span className="min-w-0 truncate">{label}</span>
    </div>
  );
}

function getPartnerMonthEntries(date: number) {
  const entries = partnerCompletions.filter((entry) => entry.day === date);
  if (date === PARTNER_WEEK_TODAY.day) {
    return [PARTNER_WEEK_TODAY, ...entries];
  }
  return entries;
}

function getPartnerWeekDayEntries(dayDate: string, isToday: boolean) {
  if (isToday) {
    return [PARTNER_WEEK_TODAY];
  }
  return partnerCompletions.filter((entry) => String(entry.day) === dayDate);
}

const plannerDemoModes = [
  { value: "solo", label: "Solo" },
  { value: "partner", label: "Partner" },
  { value: "duo", label: "Duo" },
] as const;

const plannerDemoModeCopy: Record<PlannerDemoMode, string> = {
  solo: "Your plan, your goals. Organized exactly the way you want.",
  partner: "See a teammate's progress and keep them motivated.",
  duo: "Shared interfaces to work on team goals and coordinate plans together.",
};

export function LandingPlannerPreview() {
  const reducedMotion = Boolean(useReducedMotion());
  const [mode, setMode] = useState<PlannerDemoMode>("solo");
  const [phase, setPhase] = useState<PlannerDemoPhase>("month");
  const [isVisible, setIsVisible] = useState(false);
  const [flight, setFlight] = useState<FlightGeometry | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const monthCalendarRef = useRef<HTMLDivElement | null>(null);
  const pastSourceRef = useRef<HTMLDivElement | null>(null);
  const pastDestinationRef = useRef<HTMLDivElement | null>(null);
  const futureSourceRef = useRef<HTMLDivElement | null>(null);
  const futureDestinationRef = useRef<HTMLDivElement | null>(null);

  const displayPhase = reducedMotion ? "month" : phase;
  const activePhaseOrder = getActivePhaseOrder(mode);
  const phaseIndex = activePhaseOrder.indexOf(displayPhase);
  const soloPhaseIndex = phaseOrder.indexOf(displayPhase);
  const activeMove = getActiveMonthMove(displayPhase);
  const travelPhase = isTravelPhase(displayPhase);
  const showWeekRipple = displayPhase === "week-tapping";
  const showMonthTodayRipple =
    mode === "partner" && displayPhase === "month-opening-week";
  const showWeekPreview =
    mode === "partner"
      ? isPartnerWeekSurfacePhase(displayPhase)
      : soloPhaseIndex >= phaseOrder.indexOf("week-preview") &&
        soloPhaseIndex <= phaseOrder.indexOf("selecting-month");
  const showPartnerWeekPreview = mode === "partner" && showWeekPreview;
  const showDuoWeekPreview = mode === "duo" && showWeekPreview;
  const partnerWeekNudgeSent =
    mode === "partner" &&
    (displayPhase === "week-completed" ||
      phaseIndex > activePhaseOrder.indexOf("week-completed"));
  const weekSessionCompleted =
    soloPhaseIndex >= phaseOrder.indexOf("week-completing") &&
    soloPhaseIndex <= phaseOrder.indexOf("selecting-month");
  const isWeekView =
    mode === "partner"
      ? isPartnerPlannerWeekViewPhase(displayPhase)
      : displayPhase.startsWith("week") ||
        displayPhase === "opening-month-menu" ||
        displayPhase === "selecting-month";
  const isMonthView = !isWeekView;
  const showPartnerPhone = shouldShowPartnerPhone(mode, isWeekView);
  const showPartnerPhoneNotification = shouldShowPartnerPhoneNotification(
    mode,
    displayPhase
  );
  const isViewMenuOpen =
    displayPhase === "opening-month-menu" ||
    displayPhase === "selecting-month" ||
    (mode !== "partner" &&
      (displayPhase === "opening-week-menu" ||
        displayPhase === "selecting-week"));
  const isSelectingMonth = displayPhase === "selecting-month";
  const isSelectingWeek = displayPhase === "selecting-week";
  const isBusy = isBusyPlannerDemoPhase(displayPhase);
  const isSuccess = displayPhase === "week-completed" || displayPhase === "saved";
  const pastMoved = soloPhaseIndex > phaseOrder.indexOf("month-settling-past");
  const futureMoved = soloPhaseIndex > phaseOrder.indexOf("month-settling-future");
  const planSaved = soloPhaseIndex >= phaseOrder.indexOf("saved");
  const showViewerPlan = showsViewerPlan(mode);
  const showPartnerCompletions = showsPartnerCompletions(mode);
  const showSavePlan = showViewerPlan && pastMoved && !planSaved;
  const weekTodayCellLayout = getWeekTodayCellLayout(mode);

  const measureFlight = useCallback(() => {
    const calendar = monthCalendarRef.current;
    const source =
      activeMove === "past" ? pastSourceRef.current : futureSourceRef.current;
    const destination =
      activeMove === "past"
        ? pastDestinationRef.current
        : futureDestinationRef.current;
    if (!calendar || !source || !destination || !activeMove) {
      return;
    }

    const calendarRect = calendar.getBoundingClientRect();
    const sourceRect = source.getBoundingClientRect();
    const destinationRect = destination.getBoundingClientRect();
    setFlight({
      moveKey: activeMove,
      left: sourceRect.left - calendarRect.left,
      top: sourceRect.top - calendarRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
      deltaX: destinationRect.left - sourceRect.left,
      deltaY: destinationRect.top - sourceRect.top,
    });
  }, [activeMove]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) {
          return;
        }
        setIsVisible(true);
        observer.disconnect();
      },
      { threshold: 0.1, rootMargin: "120px 0px" }
    );
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || reducedMotion) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPhase((current) => nextPlannerDemoPhase(current, false, mode));
    }, phaseDurationMs[phase]);

    return () => window.clearTimeout(timeoutId);
  }, [isVisible, mode, phase, reducedMotion]);

  useLayoutEffect(() => {
    if (!travelPhase || !activeMove) {
      return;
    }
    measureFlight();
  }, [activeMove, measureFlight, travelPhase]);

  useEffect(() => {
    if (!travelPhase) {
      return;
    }
    window.addEventListener("resize", measureFlight);
    return () => window.removeEventListener("resize", measureFlight);
  }, [measureFlight, travelPhase]);

  const currentView = isMonthView ? "Month" : "Week";
  const statusNote = getStatusNote(displayPhase, mode);
  const planTitle =
    mode === "partner"
      ? "Alex's plan"
      : mode === "duo"
        ? "Your duo plan"
        : "Your plan";

  const selectMode = (nextMode: PlannerDemoMode) => {
    setMode(nextMode);
    setPhase("month");
    setFlight(null);
  };

  const flightPosition = displayPhase.includes("-lifting-")
    ? { x: 0, y: -24, scale: 1.06 }
    : displayPhase.includes("-moving-")
      ? {
          x: flight?.deltaX ?? 0,
          y: (flight?.deltaY ?? 0) - 24,
          scale: 1.06,
        }
      : {
          x: flight?.deltaX ?? 0,
          y: flight?.deltaY ?? 0,
          scale: 1,
        };

  const entryRef = (role: MonthEntryRole | undefined) => {
    if (role === "past-source") {
      return pastSourceRef;
    }
    if (role === "past-dest") {
      return pastDestinationRef;
    }
    if (role === "future-source") {
      return futureSourceRef;
    }
    if (role === "future-dest") {
      return futureDestinationRef;
    }
    return undefined;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col items-end gap-2">
        <div className="relative w-fit pt-3">
          <LandingTryMeHint />
          <div
            role="radiogroup"
            aria-label="Planner demo mode"
            className="inline-flex rounded-lg border bg-muted/80 p-0.5 text-xs"
          >
            {plannerDemoModes.map((option) => {
              const selected = mode === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectMode(option.value)}
                  className={`rounded-md px-2.5 py-1 ${
                    selected
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <p
          aria-live="polite"
          className="max-w-md whitespace-nowrap text-right text-sm text-muted-foreground"
        >
          {plannerDemoModeCopy[mode]}
        </p>
      </div>
    <Card ref={previewRef} className="overflow-hidden border shadow-sm">
      <div className="h-2 w-full bg-gradient-to-r from-primary via-primary/70 to-gain" />
      <CardHeader className="relative z-30 pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <CardTitle className="shrink-0 text-base">{planTitle}</CardTitle>
            <div
              data-demo-status={isBusy ? "busy" : isSuccess ? "success" : "idle"}
              className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground"
            >
              {isBusy ? (
                <Loader2 className="size-3 shrink-0 animate-spin text-primary" />
              ) : isSuccess ? (
                <Check className="size-3 shrink-0 text-gain" />
              ) : (
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              )}
              <p className="truncate text-foreground">{statusNote}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2" aria-hidden="true">
            <div className="flex min-w-[5.75rem] justify-end">
              {showSavePlan ? (
                <div
                  data-demo-save-plan
                  className={`relative inline-flex h-8 items-center overflow-hidden rounded-md bg-primary px-2.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition ${
                    displayPhase === "clicking-save"
                      ? "scale-95 bg-primary ring-2 ring-primary/40 ring-offset-1"
                      : ""
                  }`}
                >
                  {displayPhase === "clicking-save" ? (
                    <motion.span
                      className="pointer-events-none absolute inset-0 bg-background/35"
                      initial={reducedMotion ? false : { opacity: 0.55 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.45 }}
                    />
                  ) : null}
                  {displayPhase === "saving" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    "Save plan"
                  )}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <div
                data-demo-view-selector={currentView.toLowerCase()}
                className="inline-flex h-8 min-w-24 items-center justify-between gap-2 rounded-lg border bg-card px-2.5 text-xs font-medium shadow-sm"
              >
                <span>{currentView}</span>
                <ChevronDown
                  className={`size-3.5 text-muted-foreground transition-transform ${
                    isViewMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              {isViewMenuOpen ? (
                <motion.div
                  data-demo-view-menu
                  initial={reducedMotion ? false : { y: -4 }}
                  animate={{ y: 0 }}
                  className="absolute top-9 right-0 z-40 w-32 rounded-lg border bg-card p-1 text-xs shadow-lg"
                >
                  {plannerDemoViewOptions.map(({ value, label }) => {
                    const selected =
                      (value === "month" && isSelectingMonth) ||
                      (value === "week" && isSelectingWeek) ||
                      (value === "week" &&
                        isViewMenuOpen &&
                        isWeekView &&
                        !isSelectingMonth);
                    return (
                      <div
                        key={value}
                        data-demo-view-option={value}
                        className={`flex items-center justify-between rounded-md px-2 py-1.5 ${
                          selected ? "bg-primary/15 font-medium text-foreground" : ""
                        }`}
                      >
                        <span>{label}</span>
                        {selected ? <Check className="size-3" /> : null}
                      </div>
                    );
                  })}
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
        <p className="sr-only" aria-live="polite">
          {statusNote}. Showing {currentView} view.
        </p>
      </CardHeader>

      <CardContent className="h-[430px] sm:h-[448px]">
        <div
          data-demo-calendar-stage
          className="relative h-full min-h-0 overflow-hidden"
        >
          {isMonthView ? (
            <motion.div
              key="month"
              ref={monthCalendarRef}
              data-calendar-view="month"
              initial={reducedMotion ? false : { y: 6 }}
              animate={{ y: 0 }}
              className="relative flex h-full flex-col"
            >
              <div className="mb-1 grid grid-cols-7 gap-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <p
                    key={day}
                    className="text-center text-[8px] leading-none font-semibold text-muted-foreground sm:text-[9px]"
                  >
                    {day}
                  </p>
                ))}
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-5 gap-1">
                {monthDates.map((date, index) => {
                  const cellEntries =
                    date && showViewerPlan
                      ? getMonthDemoEntries(date, displayPhase)
                      : [];
                  const partnerEntries =
                    date && showPartnerCompletions
                      ? getPartnerMonthEntries(date)
                      : [];
                  const isToday = date === SEEDED_TODAY;
                  const hasPastDest = cellEntries.some(
                    (entry) => entry.role === "past-dest"
                  );
                  const hasFutureDest = cellEntries.some(
                    (entry) => entry.role === "future-dest"
                  );
                  const duoTodayLayout =
                    isToday && mode === "duo" && showViewerPlan && showPartnerCompletions
                      ? getDuoMonthTodayLayout(cellEntries, partnerEntries, {
                          strengthLandedOnToday:
                            futureMoved && date === SEEDED_TODAY && !planSaved,
                        })
                      : null;
                  const visibleCellEntries = duoTodayLayout
                    ? duoTodayLayout.viewerVisible
                    : cellEntries;
                  const visiblePartnerEntries = duoTodayLayout
                    ? duoTodayLayout.partnerVisible
                    : partnerEntries;
                  const monthMoreCount = duoTodayLayout?.hiddenCount ?? 0;
                  const strengthInFlightToToday =
                    isToday &&
                    mode === "duo" &&
                    isStrengthInFlightToToday(
                      displayPhase,
                      hasFutureDest,
                      planSaved
                    );
                  const showFutureDestPlaceholder =
                    showViewerPlan &&
                    date === SEEDED_TODAY &&
                    !hasFutureDest &&
                    !strengthInFlightToToday;
                  return (
                    <div
                      key={`${date ?? "empty"}-${index}`}
                      data-month-day-cell={date ?? undefined}
                      className={`relative flex min-h-0 flex-col overflow-hidden rounded-md border p-0.5 ${
                        date
                          ? isToday
                            ? "border-primary/40 bg-muted/80"
                            : "bg-muted/20"
                          : "border-transparent"
                      }`}
                    >
                      {isToday && showMonthTodayRipple ? (
                        <>
                          <motion.span
                            data-demo-month-day-ripple
                            className="pointer-events-none absolute top-1/2 left-1/2 size-8 rounded-full bg-primary/35"
                            initial={
                              reducedMotion
                                ? false
                                : { opacity: 0.65, scale: 0.35, x: "-50%", y: "-50%" }
                            }
                            animate={{ opacity: 0, scale: 2.4, x: "-50%", y: "-50%" }}
                            transition={{ duration: 0.45, ease: "easeOut" }}
                          />
                          <motion.span
                            data-demo-month-day-ripple-second
                            className="pointer-events-none absolute top-1/2 left-1/2 size-8 rounded-full bg-primary/25"
                            initial={
                              reducedMotion
                                ? false
                                : { opacity: 0.55, scale: 0.35, x: "-50%", y: "-50%" }
                            }
                            animate={{ opacity: 0, scale: 2.4, x: "-50%", y: "-50%" }}
                            transition={{ duration: 0.45, ease: "easeOut", delay: 0.18 }}
                          />
                        </>
                      ) : null}
                      {date ? (
                        <>
                          <div className="flex h-3 shrink-0 items-center justify-between">
                            <span
                              aria-current={isToday ? "date" : undefined}
                              aria-label={
                                isToday ? `${date}, Today` : undefined
                              }
                              className={`inline-flex size-3 items-center justify-center rounded-full text-[8px] ${
                                isToday
                                  ? "bg-primary font-semibold text-primary-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {date}
                            </span>
                            {isToday ? (
                              <span className="hidden text-[7px] font-semibold text-primary sm:inline">
                                Today
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-0.5 min-h-0 flex-1 space-y-0.5">
                            {showViewerPlan
                              ? visibleCellEntries.map((entry) => (
                                  <div
                                    key={`${entry.role ?? "base"}-${entry.id}`}
                                    ref={entryRef(entry.role)}
                                    className={entry.hidden ? "invisible" : ""}
                                  >
                                    <MonthPill
                                      task={entry}
                                      variant={entry.variant}
                                      completed={
                                        date
                                          ? isViewerMonthGoalCompleted(entry, date)
                                          : false
                                      }
                                    />
                                  </div>
                                ))
                              : null}
                            {visiblePartnerEntries.map((entry) => (
                              <div
                                key={entry.id}
                                ref={
                                  strengthInFlightToToday
                                    ? futureDestinationRef
                                    : undefined
                                }
                              >
                                <PartnerPill
                                  label={entry.label}
                                  completed={isPartnerGoalCompleted(entry.day)}
                                />
                              </div>
                            ))}
                            {showFutureDestPlaceholder ? (
                              <div
                                ref={futureDestinationRef}
                                className="min-h-7"
                              />
                            ) : null}
                            {monthMoreCount > 0 ? (
                              <p className="text-[8px] text-muted-foreground">
                                {moreCountLabel(monthMoreCount)}
                              </p>
                            ) : null}
                            {showViewerPlan &&
                            date === TEMPO_MOVE_DEST_DAY &&
                            !hasPastDest ? (
                              <div
                                ref={pastDestinationRef}
                                className="min-h-7"
                              />
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {showViewerPlan &&
              travelPhase &&
              activeMove &&
              flight?.moveKey === activeMove ? (
                <motion.div
                  data-moving-task={activeMove}
                  className={`pointer-events-none absolute z-20 ${taskChipLayoutClassName} shadow-[0_10px_24px_rgba(37,99,235,0.25)] ${toneClassName(
                    activeMove === "past" ? tempoTask.tone : strengthTask.tone
                  )}`}
                  initial={{ x: 0, y: 0, scale: 1 }}
                  animate={flightPosition}
                  transition={{
                    duration: displayPhase.includes("-moving-") ? 0.72 : 0.28,
                    ease: "easeInOut",
                  }}
                  style={{
                    left: flight.left,
                    top: flight.top,
                    width: flight.width,
                    minHeight: flight.height,
                  }}
                >
                  <span className="truncate">
                    {activeMove === "past"
                      ? tempoTask.label
                      : strengthTask.label}
                  </span>
                </motion.div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="week"
              data-calendar-view="week"
              initial={false}
              animate={{ y: 0 }}
              className="flex h-full min-h-0 flex-col"
            >
              <div className="grid shrink-0 grid-cols-7 gap-1.5 sm:gap-2">
                {seededDays.map((day) => (
                  <div
                    key={day.id}
                    className={`relative min-w-0 overflow-hidden rounded-lg border p-1.5 ${
                      day.isToday
                        ? "border-primary/40 bg-muted/80"
                        : "bg-muted/20"
                    }`}
                  >
                    {day.isToday && showWeekRipple ? (
                      <motion.span
                        data-demo-day-ripple
                        className="pointer-events-none absolute top-1/2 left-1/2 size-8 rounded-full bg-primary/35"
                        initial={
                          reducedMotion
                            ? false
                            : { opacity: 0.65, scale: 0.35, x: "-50%", y: "-50%" }
                        }
                        animate={{ opacity: 0, scale: 2.4, x: "-50%", y: "-50%" }}
                        transition={{ duration: 0.45, ease: "easeOut" }}
                      />
                    ) : null}
                    <p
                      className={`text-[9px] font-semibold sm:text-[10px] ${
                        day.isToday ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {day.day}
                    </p>
                    <div className="mb-1 flex min-h-4 items-center">
                      <span
                        className={`inline-flex size-4 items-center justify-center rounded-full text-[9px] ${
                          day.isToday
                            ? "bg-primary font-semibold text-primary-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day.date}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {showViewerPlan
                        ? day.tasks
                            .slice(
                              0,
                              day.isToday
                                ? weekTodayCellLayout.viewerVisibleCount
                                : day.tasks.length
                            )
                            .map((task) => (
                              <TaskTile
                                key={task.id}
                                task={task}
                                completed={isViewerWeekTaskCompleted(
                                  task.id,
                                  Number(day.date),
                                  Boolean(day.isToday),
                                  weekSessionCompleted
                                )}
                              />
                            ))
                        : null}
                      {showPartnerCompletions && weekTodayCellLayout.showPartnerInCell
                        ? getPartnerWeekDayEntries(
                            day.date,
                            Boolean(day.isToday)
                          ).map((entry) => (
                              <PartnerPill
                                key={entry.id}
                                label={entry.label}
                                completed={isPartnerGoalCompleted(entry.day)}
                              />
                            ))
                        : null}
                      {showViewerPlan && day.isToday
                        ? moreCountLabel(weekTodayCellLayout.hiddenCount) && (
                            <p className="text-[10px] text-muted-foreground">
                              {moreCountLabel(weekTodayCellLayout.hiddenCount)}
                            </p>
                          )
                        : null}
                    </div>
                  </div>
                ))}
              </div>

              {showPartnerPhone ? (
                <div className="relative mt-1 min-h-0 flex-1">
                  {showPartnerWeekPreview ? (
                    <motion.div
                      data-demo-partner-day-preview
                      initial={reducedMotion ? false : { y: 6 }}
                      animate={{ y: 0 }}
                      className="absolute top-0 right-0 z-10 max-w-sm rounded-xl border border-border bg-muted/70 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold text-foreground">
                          Thursday, August 15 · Alex
                        </p>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-semibold text-primary-foreground">
                          Today
                        </span>
                      </div>
                      <div className="mt-2">
                        <PartnerPill
                          label={PARTNER_WEEK_TODAY.label}
                          completed={false}
                        />
                      </div>
                      <PartnerNudgeComposer
                        key={displayPhase}
                        phase={displayPhase}
                        reducedMotion={reducedMotion}
                        sent={partnerWeekNudgeSent}
                      />
                    </motion.div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 z-0 flex justify-center">
                    <LandingPartnerPhonePreview
                      notificationEligible={showPartnerPhoneNotification}
                      reducedMotion={reducedMotion}
                      nudgeMessage={PARTNER_NUDGE_MESSAGE}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {showPartnerWeekPreview ? (
                    <motion.div
                      data-demo-partner-day-preview
                      initial={reducedMotion ? false : { y: 6 }}
                      animate={{ y: 0 }}
                      className="mt-3 ml-auto max-w-sm rounded-xl border border-border bg-muted/70 p-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-semibold text-foreground">
                          Thursday, August 15 · Alex
                        </p>
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-semibold text-primary-foreground">
                          Today
                        </span>
                      </div>
                      <div className="mt-2">
                        <PartnerPill
                          label={PARTNER_WEEK_TODAY.label}
                          completed={false}
                        />
                      </div>
                      <PartnerNudgeComposer
                        key={displayPhase}
                        phase={displayPhase}
                        reducedMotion={reducedMotion}
                        sent={partnerWeekNudgeSent}
                      />
                    </motion.div>
                  ) : null}

              {showViewerPlan && showWeekPreview && !showDuoWeekPreview ? (
                <motion.div
                  data-demo-day-preview
                  initial={reducedMotion ? false : { y: 6 }}
                  animate={{ y: 0 }}
                  className="mt-3 ml-auto max-w-sm rounded-xl border border-border bg-muted/70 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold text-foreground">
                      Thursday, August 15
                    </p>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-semibold text-primary-foreground">
                      Today
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {WEEK_TODAY_TASKS.map((task) => (
                      <WeekPreviewTaskRow
                        key={task.id}
                        task={task}
                        completed={
                          task.id === "tempo-run" && weekSessionCompleted
                        }
                      />
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {showDuoWeekPreview ? (
                <motion.div
                  data-demo-duo-day-preview
                  initial={reducedMotion ? false : { y: 6 }}
                  animate={{ y: 0 }}
                  className="mt-3 ml-auto max-w-sm rounded-xl border border-border bg-muted/70 p-3 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold text-foreground">
                      Thursday, August 15
                    </p>
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[8px] font-semibold text-primary-foreground">
                      Today
                    </span>
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {WEEK_TODAY_TASKS.map((task) => (
                      <WeekPreviewTaskRow
                        key={task.id}
                        task={task}
                        completed={
                          task.id === "tempo-run" && weekSessionCompleted
                        }
                      />
                    ))}
                    <div className="rounded-lg border border-border bg-background p-2">
                      <PartnerPill
                        label={PARTNER_WEEK_TODAY.label}
                        completed={false}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : null}
                </>
              )}
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
