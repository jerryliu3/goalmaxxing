import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProfileMedalShelf } from "@/features/achievements/profile-medal-shelf";

describe("ProfileMedalShelf", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows empty copy when there are no earned medals", () => {
    render(<ProfileMedalShelf achievements={[]} awardCatalogCount={0} />);
    expect(screen.getByText("No medals yet.")).toBeInTheDocument();
  });

  it("renders earned medals and claimed progress", () => {
    render(
      <ProfileMedalShelf
        awardCatalogCount={4}
        achievements={[
          {
            id: "award-1",
            unlockedAt: "2026-01-01T00:00:00.000Z",
            revokedAt: null,
            level: 2,
            code: "lv2",
            title: "Level 2",
            description: "Reached level 2",
          },
          {
            id: "award-2",
            unlockedAt: "2026-02-01T00:00:00.000Z",
            revokedAt: "2026-03-01T00:00:00.000Z",
            level: 3,
            code: "lv3",
            title: "Level 3",
            description: "Revoked",
          },
        ]}
      />
    );

    expect(screen.getByText("1/4 · 25%")).toBeInTheDocument();
    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.queryByText("Level 3")).not.toBeInTheDocument();
  });
});
