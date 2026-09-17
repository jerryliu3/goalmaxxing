import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { InsightsShell } from "./insights-shell";
import type { Goal } from "@/lib/goals/types";

const useDuoSurfaceMock = vi.fn();
const insightsTabMock = vi.fn();
const invalidatePlannerRelatedTabCachesMock = vi.fn();

vi.mock("@/lib/cache/planner-tab-cache", () => ({
  invalidatePlannerRelatedTabCaches: () => invalidatePlannerRelatedTabCachesMock(),
}));

function goal(id: string, title: string, endDate: string): Goal {
  return {
    id,
    owner_id: id,
    title,
    description: null,
    category: "health",
    color: null,
    frequency_type: "recurring",
    recurrence_interval: "daily",
    target_count: null,
    milestone_names: null,
    start_date: "2026-01-01",
    end_date: endDate,
    photo_path: null,
    team_id: null,
    is_deleted: false,
    archived_at: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    target_basis: "period",
  };
}

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

vi.mock("@/features/social/duo/use-duo-surface", () => ({
  useDuoSurface: (...args: unknown[]) => useDuoSurfaceMock(...args),
}));

vi.mock("@/features/planner/completion-credit-move", () => ({
  CompletionCreditMoveProvider: ({
    onMoved,
    children,
  }: {
    onMoved?: () => void;
    children: React.ReactNode;
  }) => (
    <div>
      <button type="button" onClick={() => onMoved?.()}>
        Simulate move saved
      </button>
      {children}
    </div>
  ),
  useCompletionCreditMove: () => null,
}));

vi.mock("@/features/insights/insights-tab", () => ({
  InsightsTab: (props: {
    contentMode?: string;
    subjectUserId?: string;
    readOnly?: boolean;
    progressView?: string;
    anchorSections?: boolean;
    onSectionsChange?: (ids: string[]) => void;
    onPersonalGoalsChange?: (goals: Goal[]) => void;
  }) => {
    insightsTabMock(props);
    const onPersonalGoalsChange = props.onPersonalGoalsChange;
    const onSectionsChange = props.onSectionsChange;
    const subjectUserId = props.subjectUserId;
    const isPartner = subjectUserId === "partner-1";
    useEffect(() => {
      onPersonalGoalsChange?.(
        isPartner
          ? [goal("partner-goal", "Partner lift", "2026-11-30")]
          : [goal("viewer-goal", "Viewer run", "2026-06-30")]
      );
    }, [isPartner, onPersonalGoalsChange]);
    useEffect(() => {
      onSectionsChange?.(
        isPartner
          ? ["history", "week", "past-goals"]
          : ["score", "history", "achievements"]
      );
    }, [isPartner, onSectionsChange]);
    return (
      <div
        data-testid={`insights-tab-${String(props.contentMode ?? "full")}`}
        data-view={props.progressView}
        data-anchored={String(props.anchorSections ?? true)}
      />
    );
  },
}));

function duoBothSurface() {
  return {
    scope: "both",
    activePartner: {
      partnerId: "partner-1",
      partnerUsername: "partner",
      partnerDisplayName: "Partner",
    },
    viewer: { id: "viewer", label: "Solo", userId: "viewer-1", readOnly: false },
    partner: {
      id: "partner",
      label: "Partner",
      userId: "partner-1",
      readOnly: true,
    },
  };
}

describe("InsightsShell", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/insights");
    insightsTabMock.mockClear();
    invalidatePlannerRelatedTabCachesMock.mockClear();
    useDuoSurfaceMock.mockReset();
    useDuoSurfaceMock.mockReturnValue({
      scope: "me",
      activePartner: null,
      viewer: { id: "viewer", label: "Solo", readOnly: false },
      partner: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("invalidates planner caches after a progress credit move saves", async () => {
    render(<InsightsShell />);

    await screen.getByRole("button", { name: "Simulate move saved" }).click();
    expect(invalidatePlannerRelatedTabCachesMock).toHaveBeenCalledTimes(1);
  });

  it("renders one full insights lane outside duo-both scope", () => {
    render(<InsightsShell />);

    expect(screen.getAllByTestId("insights-tab-full")).toHaveLength(1);
    expect(insightsTabMock.mock.calls[0]?.[0]).toMatchObject({
      readOnly: false,
    });
    expect(screen.queryByRole("button", { name: "Previous period" })).not.toBeInTheDocument();
  });

  it("renders shared tracker above duo lanes of heatmap, goals, and stats", () => {
    useDuoSurfaceMock.mockReturnValue(duoBothSurface());

    render(<InsightsShell />);

    expect(screen.getAllByTestId("insights-tab-lane")).toHaveLength(2);
    expect(insightsTabMock.mock.calls[0]?.[0]).toMatchObject({
      contentMode: "lane",
      readOnly: false,
    });
    expect(
      insightsTabMock.mock.calls.some(
        (call) =>
          (call[0] as { contentMode?: string; readOnly?: boolean }).contentMode ===
            "lane" && (call[0] as { readOnly?: boolean }).readOnly === true
      )
    ).toBe(true);
    const tracker = screen.getByTestId("insights-tracker-header");
    const lanes = screen.getByTestId("duo-lanes-scroll");
    expect(tracker.compareDocumentPosition(lanes) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(screen.queryByTestId("insights-tab-goal-stats-only")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Progress Tracker" })).toBeInTheDocument();
  });

  it("indexes the sections both lanes report and anchors only the first lane", () => {
    useDuoSurfaceMock.mockReturnValue(duoBothSurface());

    render(<InsightsShell />);

    const index = screen.getByTestId("progress-section-index");
    expect(
      within(index)
        .getAllByRole("button")
        .map((button) => button.textContent)
    ).toEqual([
      "Goalmaxxing score",
      "Completion history",
      "This week",
      "Past goals",
      "Achievements",
    ]);

    const lanes = screen.getAllByTestId("insights-tab-lane");
    expect(lanes.map((lane) => lane.dataset.anchored)).toEqual(["true", "false"]);
  });

  it("moves every lane to the past view from the view tabs", async () => {
    const user = userEvent.setup();
    useDuoSurfaceMock.mockReturnValue(duoBothSurface());

    render(<InsightsShell />);

    await user.click(screen.getByRole("tab", { name: "Past" }));

    expect(
      screen.getAllByTestId("insights-tab-lane").map((lane) => lane.dataset.view)
    ).toEqual(["past", "past"]);
    expect(screen.queryByTestId("insights-tracker-header")).not.toBeInTheDocument();
  });
});
