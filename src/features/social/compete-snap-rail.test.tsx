import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompeteTile, type CompeteTileModel } from "./compete-snap-rail";

afterEach(() => {
  cleanup();
});

function tile(overrides: Partial<CompeteTileModel> = {}): CompeteTileModel {
  return {
    key: "weekly",
    title: "Weekly XP",
    kicker: "Challenge",
    metric: "1,000 XP",
    detail: "This week",
    joined: false,
    closed: false,
    people: [],
    ...overrides,
  };
}

describe("CompeteTile", () => {
  it("does not expand when Join is pending", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    const onJoin = vi.fn();

    render(
      <CompeteTile
        tile={tile()}
        density="join-only"
        expanded={false}
        joinPending
        onExpand={onExpand}
        onJoin={onJoin}
      />
    );

    await user.click(screen.getByRole("button", { name: "Join" }));

    expect(onJoin).not.toHaveBeenCalled();
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("renders a time-left badge beside the title when provided", () => {
    render(
      <CompeteTile
        tile={tile({ titleBadge: "3 days left" })}
        density="join-only"
        expanded={false}
        onExpand={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Weekly XP" })).toBeInTheDocument();
    expect(screen.getByText("3 days left")).toBeInTheDocument();
  });

  it("joins without expanding when Join is ready", async () => {
    const user = userEvent.setup();
    const onExpand = vi.fn();
    const onJoin = vi.fn();

    render(
      <CompeteTile
        tile={tile()}
        density="join-only"
        expanded={false}
        onExpand={onExpand}
        onJoin={onJoin}
      />
    );

    await user.click(screen.getByRole("button", { name: "Join" }));

    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("renders a paper plaque with stamped ranks when open", () => {
    render(
      <CompeteTile
        tile={tile({
          joined: true,
          people: [
            {
              rank: 1,
              name: "Ada",
              you: true,
              partner: false,
              label: "120",
              percent: 100,
            },
          ],
        })}
        density="ranks"
        expanded
        onExpand={vi.fn()}
      />
    );

    expect(screen.getByTestId("compete-plaque")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Ada · you")).toBeInTheDocument();
  });
});
