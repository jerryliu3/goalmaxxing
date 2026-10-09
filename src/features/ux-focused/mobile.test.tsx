import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MobileStudy } from "./mobile";
import { LandingStudy } from "./landing";
import { appSessions, INITIAL_COMPLETED, storyPlan } from "./mobile-model";

describe("focused mobile plan", () => {
  it("keeps completions independent of planning date changes", () => {
    const sessions = appSessions({ f2: "2026-10-09" }, [
      ...INITIAL_COMPLETED,
      "r6",
    ]);
    expect(sessions.find((s) => s.id === "f2")).toMatchObject({
      date: "2026-10-09",
      done: false,
    });
    expect(sessions.find((s) => s.id === "r6")).toMatchObject({
      date: "2026-10-08",
      done: true,
    });
  });
  it("stages a date move and lets Undo restore it", () => {
    render(<MobileStudy variant={0} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Build the rough cut" }),
    );
    fireEvent.change(screen.getByLabelText("Move session to"), {
      target: { value: "2026-10-09" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Use this date" }));
    expect(screen.getByLabelText("Planning changes")).toHaveTextContent(
      "unsaved move",
    );
    expect(screen.getByRole("button", { name: "Fri, Oct 9" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "Undo changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Thu, Oct 8" }));
    expect(
      screen.getByRole("button", { name: "Build the rough cut" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Planning changes")).not.toBeInTheDocument();
  });
});
describe("mobile marketing proof", () => {
  it("changes the example rhythm and only the moved session's date", () => {
    expect(storyPlan(true, false)).toHaveLength(2);
    expect(storyPlan(false, true).find((s) => s.id === "thu")?.date).toBe(
      "2026-10-09",
    );
    expect(storyPlan(false, true).find((s) => s.id === "mon")?.date).toBe(
      "2026-10-05",
    );
  });
  it("shows proposal, undo and explicit save before the example is saved", () => {
    render(<LandingStudy variant={1} />);
    fireEvent.click(screen.getByRole("button", { name: /See example plan/ }));
    fireEvent.click(
      screen.getByRole("button", { name: /Move Thursday's run/ }),
    );
    expect(
      screen.getByRole("button", { name: "Save example plan" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo move" }));
    expect(
      screen.queryByRole("button", { name: "Save example plan" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: /Move Thursday's run/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save example plan" }));
    expect(screen.getByRole("status")).toHaveTextContent("Example saved");
    expect(
      within(screen.getByLabelText("Example running plan")).getByText("Saved"),
    ).toBeInTheDocument();
  });
});
