import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMonthDemoEntries,
  getDuoMonthTodayLayout,
  getSeededTaskDetail,
  getWeekTodayCellLayout,
  isStrengthInFlightToToday,
  isBusyPlannerDemoPhase,
  isPartnerPlannerWeekViewPhase,
  LandingPlannerPreview,
  moreCountLabel,
  monthEntries,
  nextPlannerDemoPhase,
  partnerCompletions,
  phaseDurationMs,
  plannerDemoViewOptions,
  SEEDED_TODAY,
  STRENGTH_MOVE_SOURCE_DAY,
  STRENGTH_RECURRING_DAYS,
  TEMPO_MOVE_DEST_DAY,
  visibleMonthGoalIds,
  visibleWeekGoalIds,
  WEEK_CELL_VISIBLE_COUNT,
  WEEK_PREVIEW_VISIBLE_COUNT,
  WEEK_TODAY_TASKS,
  type PlannerDemoPhase,
} from "@/components/landing/landing-planner-preview";

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => true,
  };
});

afterEach(cleanup);

describe("nextPlannerDemoPhase", () => {
  it("starts on month, saves through a clicked Save plan control, then completes a week session", () => {
    const phases: PlannerDemoPhase[] = [];
    let phase: PlannerDemoPhase = "month";

    for (let index = 0; index < 19; index += 1) {
      phase = nextPlannerDemoPhase(phase, false);
      phases.push(phase);
    }

    expect(phases).toEqual([
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
      "month",
    ]);
  });

  it("holds one understandable month state with reduced motion", () => {
    expect(nextPlannerDemoPhase("month", true)).toBe("month");
    expect(nextPlannerDemoPhase("week", true)).toBe("month");
  });

  it("gives every month entry text and marks one seeded current day", () => {
    expect(monthEntries.every((entry) => entry.label.trim().length > 0)).toBe(
      true
    );
    expect(SEEDED_TODAY).toBe(15);
  });

  it("pauses about two seconds before opening the view menu", () => {
    expect(phaseDurationMs["week-completed"]).toBeGreaterThanOrEqual(2000);
    expect(phaseDurationMs.saved).toBeGreaterThanOrEqual(2000);
  });

  it("includes the same view modes as the live planner", () => {
    expect(plannerDemoViewOptions.map((option) => option.label)).toEqual([
      "Month",
      "Week",
      "3 Day",
      "Day",
    ]);
  });
});

describe("isPartnerPlannerWeekViewPhase", () => {
  it("keeps week view through the open menu step, then switches on month select", () => {
    expect(isPartnerPlannerWeekViewPhase("week-completed")).toBe(true);
    expect(isPartnerPlannerWeekViewPhase("opening-month-menu")).toBe(true);
    expect(isPartnerPlannerWeekViewPhase("selecting-month")).toBe(false);
    expect(isPartnerPlannerWeekViewPhase("month")).toBe(false);
  });
});

describe("planner demo status", () => {
  it("treats switching, moving, and saving as busy work", () => {
    expect(isBusyPlannerDemoPhase("opening-month-menu")).toBe(true);
    expect(isBusyPlannerDemoPhase("month-moving-past")).toBe(true);
    expect(isBusyPlannerDemoPhase("month-lifting-future")).toBe(true);
    expect(isBusyPlannerDemoPhase("clicking-save")).toBe(true);
    expect(isBusyPlannerDemoPhase("saving")).toBe(true);
    expect(isBusyPlannerDemoPhase("week")).toBe(false);
    expect(isBusyPlannerDemoPhase("saved")).toBe(false);
  });
});

describe("getMonthDemoEntries", () => {
  it("shows draft ghosts while moving, then commits after save", () => {
    expect(
      getMonthDemoEntries(8, "saving").map((entry) => entry.variant)
    ).toEqual(["ghost"]);
    expect(
      getMonthDemoEntries(24, "saving").map((entry) => ({
        id: entry.id,
        variant: entry.variant,
      }))
    ).toEqual([
      { id: "review", variant: "default" },
      { id: "strength", variant: "default" },
    ]);
    expect(
      getMonthDemoEntries(TEMPO_MOVE_DEST_DAY, "saving").map((entry) => ({
        id: entry.id,
        variant: entry.variant,
      }))
    ).toEqual([{ id: "tempo", variant: "new" }]);

    expect(getMonthDemoEntries(8, "saved")).toEqual([]);
    expect(
      getMonthDemoEntries(24, "saved").map((entry) => ({
        id: entry.id,
        variant: entry.variant,
      }))
    ).toEqual([
      { id: "review", variant: "default" },
      { id: "strength", variant: "default" },
    ]);
    expect(
      getMonthDemoEntries(TEMPO_MOVE_DEST_DAY, "saved").map((entry) => ({
        id: entry.id,
        variant: entry.variant,
      }))
    ).toEqual([{ id: "tempo", variant: "default" }]);
    expect(
      getMonthDemoEntries(STRENGTH_MOVE_SOURCE_DAY, "saved").map(
        (entry) => entry.id
      )
    ).toEqual([]);
    expect(
      getMonthDemoEntries(SEEDED_TODAY, "saved").map((entry) => entry.id)
    ).toEqual(["launch", "strength"]);
  });
});

describe("LandingPlannerPreview copy", () => {
  it("does not strike completed week sessions or repeat Today's plan", () => {
    render(<LandingPlannerPreview />);

    expect(screen.queryByText("Today's plan")).not.toBeInTheDocument();
    for (const label of screen.getAllByText("Tempo run")) {
      expect(label).not.toHaveClass("line-through");
    }
  });

  it("gives the selected week day a compact today list", () => {
    expect(WEEK_TODAY_TASKS).toHaveLength(4);
    expect(
      moreCountLabel(WEEK_TODAY_TASKS.length - WEEK_PREVIEW_VISIBLE_COUNT)
    ).toBe("+1 more");
    expect(
      moreCountLabel(WEEK_TODAY_TASKS.length - WEEK_CELL_VISIBLE_COUNT)
    ).toBe("+1 more");
  });
});

describe("seeded task details", () => {
  it("uses goal-specific schedule and category labels", () => {
    expect(getSeededTaskDetail(WEEK_TODAY_TASKS[0])).toBe(
      "Weekly recurring · Health"
    );
    expect(getSeededTaskDetail(WEEK_TODAY_TASKS[1])).toBe("Daily · Career");
    expect(getSeededTaskDetail(WEEK_TODAY_TASKS[3])).toBe(
      "Weekly recurring · Relationships"
    );
    expect(getSeededTaskDetail({})).toBeNull();
  });
});

describe("duo month today overflow", () => {
  it("folds the partner goal into +1 more when today has three items", () => {
    const layout = getDuoMonthTodayLayout(
      [
        { id: "launch", label: "Launch notes", tone: "amber", variant: "default" },
        { id: "strength", label: "Strength", tone: "emerald", variant: "default" },
      ],
      [{ id: "yoga", day: 15, label: "Yoga" }]
    );

    expect(layout.viewerVisible.map((entry) => entry.id)).toEqual([
      "launch",
      "strength",
    ]);
    expect(layout.partnerVisible).toEqual([]);
    expect(layout.hiddenCount).toBe(1);
    expect(moreCountLabel(layout.hiddenCount)).toBe("+1 more");
  });

  it("hides the partner goal only after strength lands on today", () => {
    const layout = getDuoMonthTodayLayout(
      [{ id: "launch", label: "Launch notes", tone: "amber", variant: "default" }],
      [{ id: "yoga", day: 15, label: "Yoga" }],
      { strengthLandedOnToday: true }
    );

    expect(layout.viewerVisible.map((entry) => entry.id)).toEqual(["launch"]);
    expect(layout.partnerVisible).toEqual([]);
    expect(layout.hiddenCount).toBe(1);
  });

  it("keeps the partner goal visible while strength is still in flight", () => {
    const layout = getDuoMonthTodayLayout(
      [{ id: "launch", label: "Launch notes", tone: "amber", variant: "default" }],
      [{ id: "yoga", day: 15, label: "Yoga" }],
      { strengthLandedOnToday: false }
    );

    expect(layout.partnerVisible.map((entry) => entry.id)).toEqual(["yoga"]);
    expect(layout.hiddenCount).toBe(0);
  });
});

describe("duo strength flight", () => {
  it("treats the partner pill as the in-flight drop target on today", () => {
    expect(
      isStrengthInFlightToToday("month-moving-future", false, false)
    ).toBe(true);
    expect(
      isStrengthInFlightToToday("month-moving-future", true, false)
    ).toBe(false);
    expect(isStrengthInFlightToToday("month", false, false)).toBe(false);
  });
});

describe("week today overflow", () => {
  it("shows +1 more in solo and +2 more in duo", () => {
    expect(getWeekTodayCellLayout("solo").hiddenCount).toBe(1);
    expect(getWeekTodayCellLayout("duo").hiddenCount).toBe(2);
    expect(getWeekTodayCellLayout("partner").showPartnerInCell).toBe(true);
  });
});

describe("strength recurring demo", () => {
  it("shows strength on every Saturday before one occurrence moves", () => {
    for (const day of STRENGTH_RECURRING_DAYS) {
      expect(
        getMonthDemoEntries(day, "month").some((entry) => entry.id === "strength")
      ).toBe(true);
    }
  });
});

describe("planner demo modes", () => {
  it("makes Duo the exact union of Solo and Partner goals", () => {
    const soloMonth = visibleMonthGoalIds("solo");
    const partnerMonth = visibleMonthGoalIds("partner");
    const duoMonth = visibleMonthGoalIds("duo");
    const soloWeek = visibleWeekGoalIds("solo");
    const partnerWeek = visibleWeekGoalIds("partner");
    const duoWeek = visibleWeekGoalIds("duo");

    expect(soloMonth.length).toBeGreaterThan(0);
    expect(partnerMonth.length).toBeGreaterThan(0);
    expect(soloMonth.filter((id) => partnerMonth.includes(id))).toEqual([]);
    expect(duoMonth).toEqual([...soloMonth, ...partnerMonth]);
    expect(duoWeek).toEqual([...soloWeek, ...partnerWeek]);
    expect(partnerCompletions.every((entry) => entry.label.trim().length > 0)).toBe(
      true
    );
  });

  it("jump-cuts Solo, Partner, and Duo without mixing ownership", async () => {
    const user = userEvent.setup();
    render(<LandingPlannerPreview />);

    expect(
      screen.getByText(
        "Your plan, your goals. Organized exactly the way you want."
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("landing-try-me")).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Solo" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.queryByText("Yoga")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Partner" }));
    expect(screen.getByRole("radio", { name: "Partner" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.queryByText("Alex's phone")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "See a teammate's progress and keep them motivated."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Yoga")).toBeInTheDocument();
    expect(screen.queryByText("Deep work")).not.toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Duo" }));
    expect(
      screen.getByText(
        "Shared interfaces to work on team goals and coordinate plans together."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.getByText("Yoga")).toBeInTheDocument();
  });
});
