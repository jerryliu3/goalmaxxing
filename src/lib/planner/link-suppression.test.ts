import { describe, expect, it } from "vitest";
import { resolveGoalPlanningEndDate } from "@/lib/goals/definition-validation";
import type { Goal } from "@/lib/goals/types";
import { getScopeDateRange } from "@/lib/planner/dates";
import {
  getLinkResumeDate,
  isFullySuppressedForWindow,
  isLinkedTargetSuppressedOnDate,
  isSuppressedOnDate,
  linkSuppressionFromSummary,
  resolveLinkSuppression,
  selectSuppressedGoalIdsOnDate,
  toLinkSuppressionSource,
  type LinkSuppressionSource,
} from "@/lib/planner/link-suppression";

function source(overrides: Partial<LinkSuppressionSource>): LinkSuppressionSource {
  const hasEndDate = Object.prototype.hasOwnProperty.call(overrides, "endDate");
  const hasTargetCount = Object.prototype.hasOwnProperty.call(
    overrides,
    "targetCount"
  );
  return {
    id: overrides.id ?? "source-a",
    ownerId: overrides.ownerId ?? "owner-a",
    isDeleted: overrides.isDeleted ?? false,
    archivedAt: overrides.archivedAt ?? null,
    startDate: overrides.startDate ?? "2026-01-01",
    endDate: hasEndDate ? (overrides.endDate as string | null) : "2026-12-31",
    frequencyType: overrides.frequencyType ?? "recurring",
    targetCount: hasTargetCount ? (overrides.targetCount as number | null) : null,
  };
}

describe("toLinkSuppressionSource", () => {
  it("maps goal shape to suppression source fields", () => {
    const goal: Goal = {
      id: "goal-a",
      owner_id: "owner-a",
      title: "Goal A",
      description: null,
      category: "Health",
      color: "#ffffff",
      frequency_type: "recurring",
      recurrence_interval: "weekly",
      target_count: 20,
      target_basis: "lifetime",
      milestone_names: null,
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    expect(toLinkSuppressionSource(goal)).toEqual({
      id: "goal-a",
      ownerId: "owner-a",
      isDeleted: false,
      archivedAt: null,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      frequencyType: "recurring",
      targetCount: 20,
    });
  });
});

describe("resolveLinkSuppression", () => {
  const ownerId = "owner-a";
  const asOfDate = "2026-08-15";
  const goalId = "target-a";

  it("returns none with no inbound links", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "source-a", targetGoalId: "other-target" }],
        sourcesById: new Map([["source-a", source({})]]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "none" });
  });

  it("returns none when the source is missing", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "missing-source", targetGoalId: goalId }],
        sourcesById: new Map(),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "none" });
  });

  it("returns none when source owner does not match", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "source-a", targetGoalId: goalId }],
        sourcesById: new Map([
          ["source-a", source({ ownerId: "owner-b" })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "none" });
  });

  it("returns none when source is deleted or archived", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [
          { sourceGoalId: "source-a", targetGoalId: goalId },
          { sourceGoalId: "source-b", targetGoalId: goalId },
        ],
        sourcesById: new Map([
          ["source-a", source({ id: "source-a", isDeleted: true })],
          ["source-b", source({ id: "source-b", archivedAt: "2026-08-01T00:00:00Z" })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "none" });
  });

  it("returns none when effective end falls before source start", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "source-a", targetGoalId: goalId }],
        sourcesById: new Map([
          [
            "source-a",
            source({
              startDate: "2026-02-01",
              endDate: "2026-01-01",
              targetCount: 10,
            }),
          ],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "none" });
  });

  it("returns until for finite covering source", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "source-a", targetGoalId: goalId }],
        sourcesById: new Map([
          ["source-a", source({ endDate: "2026-11-20" })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-11-20" });
  });

  it("uses the latest finite through date across inbound sources", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [
          { sourceGoalId: "source-a", targetGoalId: goalId },
          { sourceGoalId: "source-b", targetGoalId: goalId },
        ],
        sourcesById: new Map([
          ["source-a", source({ id: "source-a", endDate: "2026-10-20" })],
          ["source-b", source({ id: "source-b", endDate: "2026-11-15" })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-11-15" });
  });

  it("is deterministic across inbound link order for finite fan-in", () => {
    const links = [
      { sourceGoalId: "source-a", targetGoalId: goalId },
      { sourceGoalId: "source-b", targetGoalId: goalId },
    ];
    const sourcesById = new Map([
      ["source-a", source({ id: "source-a", endDate: "2026-10-20" })],
      ["source-b", source({ id: "source-b", endDate: "2026-11-15" })],
    ]);
    expect(
      resolveLinkSuppression({
        goalId,
        links,
        sourcesById,
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-11-15" });
    expect(
      resolveLinkSuppression({
        goalId,
        links: [...links].reverse(),
        sourcesById,
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-11-15" });
  });

  it("returns indefinite for open-ended cadence sources", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "source-a", targetGoalId: goalId }],
        sourcesById: new Map([
          [
            "source-a",
            source({
              endDate: null,
              frequencyType: "recurring",
              targetCount: null,
            }),
          ],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "indefinite" });
  });

  it("prefers indefinite over finite suppression regardless of link order", () => {
    const links = [
      { sourceGoalId: "source-a", targetGoalId: goalId },
      { sourceGoalId: "source-b", targetGoalId: goalId },
    ];
    const sourcesById = new Map([
      ["source-a", source({ id: "source-a", endDate: "2026-10-20" })],
      [
        "source-b",
        source({
          id: "source-b",
          endDate: null,
          frequencyType: "recurring",
          targetCount: null,
        }),
      ],
    ]);
    expect(
      resolveLinkSuppression({
        goalId,
        links,
        sourcesById,
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "indefinite" });
    expect(
      resolveLinkSuppression({
        goalId,
        links: [...links].reverse(),
        sourcesById,
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "indefinite" });
  });

  it("uses soft horizon for ordinal goals without stored end date", () => {
    const suppression = resolveLinkSuppression({
      goalId,
      links: [{ sourceGoalId: "source-a", targetGoalId: goalId }],
      sourcesById: new Map([
        [
          "source-a",
          source({
            endDate: null,
            frequencyType: "fixed_milestones",
            targetCount: 20,
            startDate: "2026-01-01",
          }),
        ],
      ]),
      ownerId,
      asOfDate,
    });
    const expectedEnd = resolveGoalPlanningEndDate({
      frequencyType: "fixed_milestones",
      targetCount: 20,
      startDate: "2026-01-01",
      endDate: null,
      asOfDate,
    });
    expect(suppression).toEqual({ kind: "until", through: expectedEnd });
  });

  it("walks transitive ancestors when an intermediate source is deleted", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [
          { sourceGoalId: "source-a", targetGoalId: "source-b" },
          { sourceGoalId: "source-b", targetGoalId: goalId },
        ],
        sourcesById: new Map([
          ["source-a", source({ id: "source-a", endDate: "2026-11-20" })],
          ["source-b", source({ id: "source-b", isDeleted: true })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-11-20" });
  });

  it("walks transitive ancestors when an intermediate source row is missing", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [
          { sourceGoalId: "source-a", targetGoalId: "source-b" },
          { sourceGoalId: "source-b", targetGoalId: goalId },
        ],
        sourcesById: new Map([
          ["source-a", source({ id: "source-a", endDate: "2026-11-20" })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-11-20" });
  });

  it("still suppresses when the source has not started yet", () => {
    expect(
      resolveLinkSuppression({
        goalId,
        links: [{ sourceGoalId: "source-a", targetGoalId: goalId }],
        sourcesById: new Map([
          [
            "source-a",
            source({ startDate: "2026-10-01", endDate: "2026-12-31" }),
          ],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "until", through: "2026-12-31" });
  });

  it("does not self-suppress through ancestry cycles", () => {
    expect(
      resolveLinkSuppression({
        goalId: "source-a",
        links: [
          { sourceGoalId: "source-a", targetGoalId: "source-b" },
          { sourceGoalId: "source-b", targetGoalId: "source-a" },
        ],
        sourcesById: new Map([
          ["source-a", source({ id: "source-a", endDate: "2026-11-20" })],
          ["source-b", source({ id: "source-b", isDeleted: true })],
        ]),
        ownerId,
        asOfDate,
      })
    ).toEqual({ kind: "none" });
  });
});

describe("suppression helpers", () => {
  it("treats targets as fully suppressed only when resume is after the window end", () => {
    expect(
      isFullySuppressedForWindow(
        { kind: "until", through: "2026-12-31" },
        getScopeDateRange("2026-08")
      )
    ).toBe(true);
    expect(
      isFullySuppressedForWindow(
        { kind: "until", through: "2026-08-31" },
        getScopeDateRange("2026-08")
      )
    ).toBe(true);
    expect(
      isFullySuppressedForWindow(
        { kind: "until", through: "2026-07-31" },
        getScopeDateRange("2026-08")
      )
    ).toBe(false);
    expect(
      isFullySuppressedForWindow(
        { kind: "until", through: "2026-08-31" },
        { start: "2026-08-01", end: "2026-10-31" }
      )
    ).toBe(false);
    expect(
      isFullySuppressedForWindow(
        { kind: "indefinite" },
        getScopeDateRange("2026-08")
      )
    ).toBe(true);
  });

  it("reports suppression on a specific date", () => {
    expect(
      isSuppressedOnDate({ kind: "until", through: "2026-08-20" }, "2026-08-20")
    ).toBe(true);
    expect(
      isSuppressedOnDate({ kind: "until", through: "2026-08-20" }, "2026-08-21")
    ).toBe(false);
    expect(isSuppressedOnDate({ kind: "indefinite" }, "2026-08-21")).toBe(true);
  });

  it("computes resume date only for finite suppression", () => {
    expect(
      getLinkResumeDate({ kind: "until", through: "2026-08-31" })
    ).toBe("2026-09-01");
    expect(getLinkResumeDate({ kind: "none" })).toBeNull();
    expect(getLinkResumeDate({ kind: "indefinite" })).toBeNull();
  });

  it("round-trips planner link summaries through isSuppressedOnDate", () => {
    const until = linkSuppressionFromSummary({
      targetSuppressionKind: "until",
      targetResumesOn: "2026-10-01",
    });
    expect(until).toEqual({ kind: "until", through: "2026-09-30" });
    expect(getLinkResumeDate(until)).toBe("2026-10-01");
    expect(
      isLinkedTargetSuppressedOnDate({
        goalId: "other-goal",
        date: "2026-09-04",
        linkSummaries: [
          {
            targetGoalId: "target-b",
            targetSuppressionKind: "until",
            targetResumesOn: "2026-10-01",
          },
        ],
      })
    ).toBe(false);
    expect(
      isLinkedTargetSuppressedOnDate({
        goalId: "target-b",
        date: "2026-09-30",
        linkSummaries: [
          {
            targetGoalId: "target-b",
            targetSuppressionKind: "until",
            targetResumesOn: "2026-10-01",
          },
        ],
      })
    ).toBe(true);
    expect(
      isLinkedTargetSuppressedOnDate({
        goalId: "target-b",
        date: "2026-10-01",
        linkSummaries: [
          {
            targetGoalId: "target-b",
            targetSuppressionKind: "until",
            targetResumesOn: "2026-10-01",
          },
        ],
      })
    ).toBe(false);
  });
});

describe("selectSuppressedGoalIdsOnDate", () => {
  const ownerId = "owner-a";

  function goal(overrides: Partial<Goal> & Pick<Goal, "id" | "title">): Goal {
    return {
      owner_id: ownerId,
      description: null,
      category: "health",
      color: null,
      frequency_type: "recurring",
      recurrence_interval: "daily",
      target_count: null,
      milestone_names: null,
      start_date: "2026-09-01",
      end_date: "2026-09-30",
      photo_path: null,
      team_id: null,
      is_deleted: false,
      archived_at: null,
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
      target_basis: "period",
      ...overrides,
    };
  }

  it("hides linked targets while upstream suppression is active", () => {
    const goals = [
      goal({ id: "source-a", title: "Create videos" }),
      goal({
        id: "target-b",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];
    const links = [
      { source_goal_id: "source-a", target_goal_id: "target-b" },
    ];

    expect(
      selectSuppressedGoalIdsOnDate({
        goals,
        links,
        ownerId,
        date: "2026-09-04",
      })
    ).toEqual(new Set(["target-b"]));
    expect(
      selectSuppressedGoalIdsOnDate({
        goals,
        links,
        ownerId,
        date: "2026-10-01",
      })
    ).toEqual(new Set());
  });

  it("hides transitive targets in a linked chain", () => {
    const goals = [
      goal({ id: "source-a", title: "Create videos" }),
      goal({
        id: "target-b",
        title: "Edit videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
      goal({
        id: "target-c",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];

    expect(
      selectSuppressedGoalIdsOnDate({
        goals,
        links: [
          { sourceGoalId: "source-a", targetGoalId: "target-b" },
          { sourceGoalId: "target-b", targetGoalId: "target-c" },
        ],
        ownerId,
        date: "2026-09-04",
      })
    ).toEqual(new Set(["target-b", "target-c"]));
  });

  it("does not hide targets after the source has ended", () => {
    const goals = [
      goal({
        id: "source-a",
        title: "Create videos",
        end_date: "2026-08-31",
      }),
      goal({
        id: "target-b",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];

    expect(
      selectSuppressedGoalIdsOnDate({
        goals,
        links: [{ sourceGoalId: "source-a", targetGoalId: "target-b" }],
        ownerId,
        date: "2026-09-04",
      })
    ).toEqual(new Set());
  });

  it("hides targets indefinitely for open-ended sources", () => {
    const goals = [
      goal({
        id: "source-a",
        title: "Create videos",
        end_date: null,
        target_count: null,
      }),
      goal({
        id: "target-b",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];

    expect(
      selectSuppressedGoalIdsOnDate({
        goals,
        links: [{ sourceGoalId: "source-a", targetGoalId: "target-b" }],
        ownerId,
        date: "2026-09-04",
      })
    ).toEqual(new Set(["target-b"]));
  });

  it("walks past a deleted intermediate source", () => {
    const goals = [
      goal({ id: "source-a", title: "Create videos" }),
      goal({
        id: "source-b",
        title: "Edit videos",
        start_date: "2026-01-01",
        end_date: null,
        is_deleted: true,
      }),
      goal({
        id: "target-c",
        title: "Post videos",
        start_date: "2026-01-01",
        end_date: null,
      }),
    ];

    expect(
      selectSuppressedGoalIdsOnDate({
        goals,
        links: [
          { sourceGoalId: "source-a", targetGoalId: "source-b" },
          { sourceGoalId: "source-b", targetGoalId: "target-c" },
        ],
        ownerId,
        date: "2026-09-04",
      })
    ).toEqual(new Set(["source-b", "target-c"]));
  });
});
