import { describe, expect, it } from "vitest";
import {
  buildWeekdayLabels,
  getEntryCompactTitle,
  getEntryGoalFirstTitleWithTime,
  getEntryDraftDiffSummary,
  getEntryDraftPillClasses,
  getEntryMilestoneFirstTitle,
  getEntrySubtitle,
  isEntryImmovableForDraft,
  normalizeWeekStartsOn,
} from "@/features/planner/calendar-format";
import { toPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import { buildPlannerDayEntry } from "@/features/planner/test-fixtures";

describe("calendar format week start helpers", () => {
  it("defaults invalid week start values to Monday", () => {
    expect(normalizeWeekStartsOn(undefined)).toBe(1);
    expect(normalizeWeekStartsOn(null)).toBe(1);
    expect(normalizeWeekStartsOn(-1)).toBe(1);
    expect(normalizeWeekStartsOn(9)).toBe(1);
  });

  it("builds weekday headers from a configured start day", () => {
    expect(buildWeekdayLabels(1)).toEqual([
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ]);
    expect(buildWeekdayLabels(0)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
  });
});

describe("calendar entry subtitles", () => {
  it("shows the goal title above a named first milestone", () => {
    const entry = {
      goalTitle: "Grow social media account to 1000 followers",
      label: "100",
      unitKey: "milestone:1",
      effectiveScheduledLocalTime: null,
    };
    expect(getEntryGoalFirstTitleWithTime(entry)).toBe(entry.goalTitle);
    expect(
      getEntryGoalFirstTitleWithTime({ ...entry, effectiveScheduledLocalTime: "07:30" })
    ).toBe(`${entry.goalTitle} · 07:30`);
    expect(getEntrySubtitle(entry)).toBe("Milestone: 100");
  });
  it("omits subtitles for recurring completion units", () => {
    expect(
      getEntrySubtitle({
        goalTitle: "Run",
        label: "total:2",
        unitKey: "total:2",
      })
    ).toBeNull();
  });

  it("keeps the next named milestone subtitle", () => {
    expect(
      getEntrySubtitle({
        goalTitle: "Launch",
        label: "Publish beta",
        unitKey: "milestone:2",
      })
    ).toBe("Milestone: Publish beta");
  });

  it("hides canonical default milestone subtitles", () => {
    expect(
      getEntrySubtitle({
        goalTitle: "Launch",
        label: "Milestone 2",
        unitKey: "milestone:2",
      })
    ).toBeNull();
  });

  it("keeps non-canonical milestone-like labels in subtitles", () => {
    expect(
      getEntrySubtitle({
        goalTitle: "Launch",
        label: "Milestone 3",
        unitKey: "milestone:2",
      })
    ).toBe("Milestone: Milestone 3");
  });

  it("omits subtitles when no goal title is available", () => {
    expect(
      getEntrySubtitle({
        goalTitle: null,
        label: "Milestone custom",
        unitKey: "milestone:2",
      })
    ).toBeNull();
  });
});

describe("calendar compact entry titles", () => {
  it("prefers meaningful labels over goal title in compact contexts", () => {
    expect(
      getEntryCompactTitle({
        goalTitle: "5k training block",
        label: "Tempo run 4x800",
        unitKey: "milestone:2",
      })
    ).toBe("Tempo run 4x800");
  });

  it("uses the goal title for canonical default milestone labels", () => {
    expect(
      getEntryCompactTitle({
        goalTitle: "5k training block",
        label: "Milestone 2",
        unitKey: "milestone:2",
      })
    ).toBe("5k training block");
  });

  it("uses the goal title when the milestone label is absent", () => {
    expect(
      getEntryCompactTitle({
        goalTitle: "5k training block",
        label: null,
        unitKey: "milestone:2",
      })
    ).toBe("5k training block");
  });

  it("keeps a default-looking label assigned to a different ordinal", () => {
    expect(
      getEntryCompactTitle({
        goalTitle: "5k training block",
        label: "Milestone 3",
        unitKey: "milestone:2",
      })
    ).toBe("Milestone 3");
  });

  it("keeps the default label when no goal title is available", () => {
    expect(
      getEntryCompactTitle({
        goalTitle: null,
        label: "Milestone 2",
        unitKey: "milestone:2",
      })
    ).toBe("Milestone 2");
  });

  it("falls back to canonical title for derived counter labels", () => {
    expect(
      getEntryCompactTitle({
        goalTitle: "Read",
        label: "total:3",
        unitKey: "total:3",
      })
    ).toBe("Read");
  });
});

describe("calendar feed entry titles", () => {
  it("uses a milestone label in feed items when available", () => {
    expect(
      getEntryMilestoneFirstTitle({
        goalTitle: "5k training block",
        label: "Tempo run 4x800",
        unitKey: "milestone:2",
      })
    ).toBe("Tempo run 4x800");
  });

  it("falls back to goal title for milestone entries with blank labels", () => {
    expect(
      getEntryMilestoneFirstTitle({
        goalTitle: "5k training block",
        label: "   ",
        unitKey: "milestone:2",
      })
    ).toBe("5k training block");
  });

  it("falls back to goal title for canonical default milestone labels", () => {
    expect(
      getEntryMilestoneFirstTitle({
        goalTitle: "5k training block",
        label: "Milestone 2",
        unitKey: "milestone:2",
      })
    ).toBe("5k training block");
  });

  it("keeps non-milestone feed titles on goal title", () => {
    expect(
      getEntryMilestoneFirstTitle({
        goalTitle: "Hydration",
        label: "Drink two liters",
        unitKey: "total:1",
      })
    ).toBe("Hydration");
  });
});

describe("calendar task immovability", () => {
  it("lets incomplete tasks move while completed tasks stay put", () => {
    const openTask = toPlannerTaskCalendarEntry({
      updatedAt: "2026-09-02T12:00:00.000Z",
      taskId: "11111111-1111-4111-8111-111111111111",
      title: "Buy groceries",
      scheduledDate: "2026-09-02",
      scheduledTime: null,
      completedAt: null,
    });
    const doneTask = toPlannerTaskCalendarEntry({
      updatedAt: "2026-09-02T12:00:00.000Z",
      taskId: "22222222-2222-4222-8222-222222222222",
      title: "Done already",
      scheduledDate: "2026-09-02",
      scheduledTime: null,
      completedAt: "2026-09-02T12:00:00.000Z",
    });

    expect(isEntryImmovableForDraft(openTask)).toBe(false);
    expect(isEntryImmovableForDraft(doneTask)).toBe(true);
    expect(isEntryImmovableForDraft(buildPlannerDayEntry())).toBe(false);
  });
});

describe("draft pill classes", () => {
  it("keeps moved-from and moved-to copy in sentence case", () => {
    expect(
      getEntryDraftDiffSummary({
        draftDiffKind: "moved_to",
        draftDiffFromDate: "2026-08-20",
        draftDiffToDate: "2026-08-12",
      })
    ).toBe("Moved from 2026-08-20.");
    expect(
      getEntryDraftDiffSummary({
        draftDiffKind: "moved_from",
        draftDiffFromDate: "2026-08-20",
        draftDiffToDate: "2026-08-12",
      })
    ).toBe("Moved to 2026-08-12.");
  });

  it("uses structural draft classes so goal color can darken in the fill", () => {
    expect(getEntryDraftPillClasses({ draftDiffKind: "moved_from" })).toContain(
      "rounded-[10px]"
    );
    expect(getEntryDraftPillClasses({ draftDiffKind: "moved_to" })).toContain("border-2");
    expect(getEntryDraftPillClasses({ draftDiffKind: "moved_to" })).not.toContain(
      "bg-primary"
    );
    expect(getEntryDraftPillClasses({ draftDiffKind: "new" })).toContain("border-2");
    expect(getEntryDraftPillClasses({ draftDiffKind: "new" })).not.toContain(
      "bg-foreground"
    );
    expect(getEntryDraftPillClasses({ draftDiffKind: null })).toContain(
      "border-border"
    );
  });
});
