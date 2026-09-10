import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConceptsIndex } from "@/features/ux-concepts/concepts-index";
import {
  CollapsedCompletedConcept,
  GoalFocusConcept,
  PastDayDoneConcept,
  PlanClarityIndex,
} from "@/features/ux-concepts/plan-clarity-concept";
import {
  CLARITY_OCCURRENCES,
  focusedOccurrences,
  isPerfectDay,
  occurrencesOnDate,
} from "@/features/ux-concepts/plan-clarity-seed";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(cleanup);

describe("plan clarity seed", () => {
  it("keeps Tempo run on four Plan days and treats Wed 2 as a clear day", () => {
    const tempo = focusedOccurrences("tempo-run");
    expect(tempo.map((item) => item.date)).toEqual(
      expect.arrayContaining([
        "2026-08-30",
        "2026-09-02",
        "2026-09-03",
        "2026-09-07",
      ])
    );
    const completed = new Set(
      CLARITY_OCCURRENCES.filter((item) => item.completed).map((item) => item.id)
    );
    expect(isPerfectDay("2026-09-02", null, completed)).toBe(true);
    expect(isPerfectDay("2026-09-01", null, completed)).toBe(false);
    expect(occurrencesOnDate("2026-09-03", null).map((item) => item.goalId)).toEqual(
      expect.arrayContaining(["tempo-run", "launch-notes", "deep-work"])
    );
  });
});

describe("plan clarity concepts", () => {
  it("lists the three Plan craft shells from the gallery", () => {
    render(<ConceptsIndex />);
    expect(screen.getByRole("link", { name: /plan craft/i })).toHaveAttribute(
      "href",
      "/ux/concepts/plan-clarity"
    );
    expect(screen.getByRole("link", { name: /goal focus/i })).toHaveAttribute(
      "href",
      "/ux/concepts/plan-clarity/focus"
    );
    expect(screen.getByRole("link", { name: /past-day done/i })).toHaveAttribute(
      "href",
      "/ux/concepts/plan-clarity/history"
    );
    expect(screen.getByRole("link", { name: /collapsed completed/i })).toHaveAttribute(
      "href",
      "/ux/concepts/plan-clarity/checklist"
    );
    cleanup();
    render(<PlanClarityIndex />);
    expect(
      screen.getByRole("heading", { name: /calendar and checklist, quieter/i })
    ).toBeInTheDocument();
  });

  it("filters the week to Tempo run placements until All is restored", async () => {
    const user = userEvent.setup();
    render(<GoalFocusConcept />);
    expect(screen.getByRole("heading", { level: 1, name: "Tempo run" })).toBeInTheDocument();
    const agenda = screen.getByRole("list", { name: /week agenda/i });
    expect(within(agenda).getAllByText("Tempo run").length).toBeGreaterThan(0);
    expect(within(agenda).queryByText("Strength")).not.toBeInTheDocument();
    expect(within(agenda).queryByText("Deep work")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^all$/i }));
    expect(screen.getByRole("heading", { name: "All placed work" })).toBeInTheDocument();
    expect(within(agenda).getByText("Strength")).toBeInTheDocument();
    expect(within(agenda).getAllByText("Deep work").length).toBeGreaterThan(0);
  });

  it("folds completed titles on past days and marks a clear Wednesday", async () => {
    const user = userEvent.setup();
    render(<PastDayDoneConcept />);
    const agenda = screen.getByRole("list", { name: /week agenda/i });
    expect(
      within(agenda).getByRole("button", {
        name: /wednesday, sep 2, all placed work done/i,
      })
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^fold$/i }));
    const wednesday = within(agenda).getByRole("button", {
      name: /wednesday, sep 2, all placed work done/i,
    });
    const row = wednesday.closest("li");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).queryByText("Tempo run")).not.toBeInTheDocument();
    expect(within(row as HTMLElement).queryByText("Deep work")).not.toBeInTheDocument();
    await user.click(within(row as HTMLElement).getByRole("button", { name: /2 done/i }));
    expect(within(row as HTMLElement).getByText("Tempo run")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("Deep work")).toBeInTheDocument();
  });

  it("keeps Checklist completed folded until opened", async () => {
    const user = userEvent.setup();
    render(<CollapsedCompletedConcept />);
    expect(screen.getByRole("heading", { name: "Checklist" })).toBeInTheDocument();
    expect(screen.getByText("Tempo run")).toBeInTheDocument();
    expect(screen.getByText("Review offer")).toBeInTheDocument();
    expect(screen.queryByText("Deep work")).not.toBeInTheDocument();
    expect(screen.queryByText("Launch notes")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^completed/i }));
    expect(screen.getByText("Deep work")).toBeInTheDocument();
    expect(screen.getByText("Launch notes")).toBeInTheDocument();
  });
});
