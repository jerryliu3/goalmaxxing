import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";
import { MonthHeatmap } from "@/features/insights/month-heatmap";

describe("MonthHeatmap", () => {
  afterEach(() => {
    cleanup();
  });

  it("disables future days when the parent marks them closed", () => {
    render(
      <MonthHeatmap
        month={new Date(2026, 8, 1)}
        countsByDate={{ "2026-09-01": 1, "2026-09-07": 0 }}
        interactive
        isDayDisabled={(date) => date > "2026-09-06"}
        onDayClick={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "1" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "7" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "1" })).toHaveClass("rounded-[8px]");
    expect(screen.queryByLabelText("Previous month")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next month")).not.toBeInTheDocument();
    expect(screen.getByText("September 2026")).toBeInTheDocument();
  });

  it("can hide the redundant month label", () => {
    render(
      <MonthHeatmap
        month={new Date(2026, 8, 1)}
        countsByDate={{ "2026-09-01": 1 }}
        showMonthLabel={false}
      />
    );

    expect(screen.queryByText("September 2026")).not.toBeInTheDocument();
  });

  it("commits an interactive day only after a hold", () => {
    vi.useFakeTimers();
    const onDayClick = vi.fn();
    render(
      <MonthHeatmap
        month={new Date(2026, 8, 1)}
        countsByDate={{ "2026-09-01": 0 }}
        interactive
        onDayClick={onDayClick}
      />
    );

    const day = screen.getByTitle("2026-09-01: 0 completions");
    fireEvent.click(day);
    expect(onDayClick).not.toHaveBeenCalled();
    expect(day.querySelector("[data-completion-mark]")).not.toBeInTheDocument();

    fireEvent.pointerDown(day);
    expect(day.querySelector("[data-fill-progress='1']")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(COMPLETION_HOLD_MS);
    });
    expect(onDayClick).toHaveBeenCalledWith("2026-09-01", day);
    vi.useRealTimers();
  });

  it("marks milestone days with a quiet pin", () => {
    render(
      <MonthHeatmap
        month={new Date(2026, 8, 1)}
        countsByDate={{ "2026-09-01": 1 }}
        milestoneDates={["2026-09-01"]}
      />
    );

    expect(screen.getByTestId("milestone-pin-2026-09-01")).toBeInTheDocument();
    expect(screen.queryByTestId("milestone-pin-2026-09-02")).not.toBeInTheDocument();
  });
});
