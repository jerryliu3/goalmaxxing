import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicProfileSheet } from "@/features/social/public-profile/public-profile-sheet";

const mocks = vi.hoisted(() => ({
  fetchPublicProfileBundle: vi.fn(),
  view: vi.fn(),
}));

vi.mock("@/features/social/public-profile/data", () => ({
  fetchPublicProfileBundle: mocks.fetchPublicProfileBundle,
}));

vi.mock("@/features/goals/goal-route-sheet", () => ({
  GoalRouteSheet: ({ children, title }: { children: ReactNode; title: string }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

vi.mock("@/features/social/public-profile/public-profile-view", () => ({
  PublicProfileView: (props: { variant?: string }) => {
    mocks.view(props);
    return <div>public-profile-view</div>;
  },
}));

const bundle = {
  schemaVersion: "1",
  profile: {
    subjectUserId: "22222222-2222-4222-8222-222222222222",
    username: "visible-user",
    displayName: "Visible User",
    avatarUrl: null,
    isPrivate: false,
  },
  xp: null,
  globalAchievements: [],
  awardCatalogCount: 0,
  overallStats: null,
  yearHeatmap: [],
  growSeries: [],
  growTopPercent: null,
  currentGoals: [],
  bio: null,
  showcase: [],
  showcaseCatalog: null,
};

describe("PublicProfileSheet", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the shared profile view in its compact variant", async () => {
    mocks.fetchPublicProfileBundle.mockResolvedValue(bundle);

    render(<PublicProfileSheet subjectUserId="22222222-2222-4222-8222-222222222222" onClose={vi.fn()} />);

    expect(await screen.findByText("public-profile-view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Visible User" })).toBeInTheDocument();
    expect(mocks.view).toHaveBeenCalledWith(expect.objectContaining({ variant: "compact", bundle }));
  });

  it("shows the load error", async () => {
    mocks.fetchPublicProfileBundle.mockRejectedValue(new Error("Profile was not found."));

    render(<PublicProfileSheet subjectUserId="22222222-2222-4222-8222-222222222222" onClose={vi.fn()} />);

    expect(await screen.findByText("Profile was not found.")).toBeInTheDocument();
  });
});
