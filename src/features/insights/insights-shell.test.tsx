vi.mock("@/features/coach/use-coach-page-context", () => ({ useCoachPageContext: vi.fn() }));
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { InsightsShell } from "./insights-shell";
import type { Goal } from "@/lib/goals/types";

const useDuoSurfaceMock = vi.fn();
const insightsTabMock = vi.fn();
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
          : ["history", "achievements"]
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

  it("shows history and past goals together while preserving lane ownership", () => {
    useDuoSurfaceMock.mockReturnValue(duoBothSurface());
    render(<InsightsShell />);
    expect(screen.getByRole("heading", { name: "Achieved" })).toBeInTheDocument();
    expect(screen.getAllByTestId("insights-tab-lane").map((lane) => lane.dataset.view)).toEqual(["all", "all"]);
    expect(screen.getAllByTestId("insights-tab-lane").map((lane) => lane.dataset.anchored)).toEqual(["true", "false"]);
    expect(screen.queryByRole("tab", { name: "Past" })).toBeNull();
    expect(screen.getByRole("link", { name: "Past goals" })).toHaveAttribute("href", "#progress-section-past-goals");
  });
});
