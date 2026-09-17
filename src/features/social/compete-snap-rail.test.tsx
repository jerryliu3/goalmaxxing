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

  it("numbers every requirement mark before the viewer joins", () => {
    render(
      <CompeteTile
        tile={tile({
          requirement: { progress: 0, target: 5, unitLabel: "sessions" },
        })}
        density="join-only"
        onExpand={vi.fn()}
      />
    );

    expect(screen.getByText("What you’ll need to do")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "0 of 5 sessions complete" })
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("requirement-mark")).toHaveLength(5);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("05")).toBeInTheDocument();
  });

  it("stamps completed requirement marks once the viewer has progress", () => {
    render(
      <CompeteTile
        tile={tile({
          joined: true,
          requirement: { progress: 2, target: 5, unitLabel: "sessions" },
        })}
        density="peek"
        onExpand={vi.fn()}
      />
    );

    expect(screen.getByText("Your progress")).toBeInTheDocument();
    expect(screen.getByText("2 of 5 sessions")).toBeInTheDocument();
    // First two marks are checked, so only 03 onward keep their number.
    expect(screen.queryByText("01")).not.toBeInTheDocument();
    expect(screen.getByText("03")).toBeInTheDocument();
  });

  it("numbers a two-row grid at the cutoff and switches to a readout one step over", () => {
    const { rerender } = render(
      <CompeteTile
        tile={tile({
          requirement: { progress: 0, target: 10, unitLabel: "active days" },
        })}
        density="join-only"
      />
    );

    expect(screen.getAllByTestId("requirement-mark")).toHaveLength(10);

    rerender(
      <CompeteTile
        tile={tile({
          requirement: { progress: 0, target: 11, unitLabel: "active days" },
        })}
        density="join-only"
      />
    );

    expect(screen.queryByTestId("requirement-marks")).not.toBeInTheDocument();
    expect(screen.getByText("11 active days to go")).toBeInTheDocument();
  });

  it("falls back to a single readout when the target is too large to number", () => {
    render(
      <CompeteTile
        tile={tile({
          joined: true,
          requirement: { progress: 250, target: 1000, unitLabel: "XP" },
        })}
        density="peek"
        onExpand={vi.fn()}
      />
    );

    expect(screen.queryByTestId("requirement-marks")).not.toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("750 XP to go")).toBeInTheDocument();
  });

  it("offers Leave without needing the tile expanded", async () => {
    const user = userEvent.setup();
    const onJoin = vi.fn();

    render(
      <CompeteTile
        tile={tile({ joined: true, leaveLabel: "Leave challenge" })}
        density="peek"
        onJoin={onJoin}
      />
    );

    await user.click(screen.getByRole("button", { name: "Leave challenge" }));

    expect(onJoin).toHaveBeenCalledTimes(1);
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
