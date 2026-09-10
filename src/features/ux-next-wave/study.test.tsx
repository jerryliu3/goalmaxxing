import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  renderHook,
  render,
  screen,
  fireEvent,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useStudy } from "./use-study";
import { SEED, lightenDay } from "./model";
import { NextWaveStudy } from "./study";

afterEach(cleanup);

describe("Next Wave concept study", () => {
  it("reviews plan moves without changing completion records and supports save/undo", () => {
    const { result } = renderHook(useStudy);
    act(() => result.current.move("run", 4));
    expect(result.current.items.find((x) => x.id === "run")?.day).toBe(1);
    expect(
      result.current.changes.map((x) => [x.item.id, x.from, x.to]),
    ).toEqual([["run", 1, 4]]);
    act(() => result.current.save());
    expect(result.current.items.find((x) => x.id === "run")?.day).toBe(4);
    expect(result.current.done).toBe(3);
    act(() => result.current.undo());
    expect(result.current.items.find((x) => x.id === "run")?.day).toBe(1);
  });

  it("records reversible date-specific completion and never completes unplanned work", () => {
    const { result } = renderHook(useStudy);
    act(() => result.current.toggle("strength"));
    expect(result.current.done).toBe(3);
    act(() => result.current.toggle("run"));
    expect(result.current.done).toBe(4);
    expect(result.current.items.find((x) => x.id === "run")?.day).toBe(1);
    act(() => result.current.move("run", 5));
    expect(result.current.changes).toHaveLength(0);
    act(() => result.current.setDraft(null));
    act(() => result.current.undo());
    expect(result.current.done).toBe(3);
  });

  it("lightens the day without shortening sessions or moving completed work", () => {
    const after = lightenDay(SEED, 1, 60);
    expect(
      after
        .filter((x) => x.day === 1 && !x.done)
        .reduce((a, x) => a + x.minutes, 0),
    ).toBe(45);
    expect(after.filter((x) => x.done)).toEqual(SEED.filter((x) => x.done));
    expect(after.find((x) => x.id === "notes")?.day).toBe(2);
    expect(after.find((x) => x.id === "read")?.day).toBe(2);
    expect(after.map((x) => x.minutes)).toEqual(SEED.map((x) => x.minutes));
  });

  it("leaves excess work unplanned when the sample week ends", () => {
    const sunday = SEED.map((x) => (x.id === "run" ? { ...x, day: 6 } : x));
    expect(
      lightenDay(sunday, 6, 30).find((x) => x.id === "run")?.day,
    ).toBeNull();
  });

  it("carries state across all five concepts and through planner → progress → community", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Complete Tempo run" }));
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Progress" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(
      screen.getByRole("heading", { name: /Look what/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Tempo run.*45m.*SEP 8/ }),
    ).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Community" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Challenges" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Join demo challenge" }),
    );
    expect(
      screen.getByText("4 of 10 sessions · Updated from your demo plan"),
    ).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Planner" }), {
      button: 0,
      ctrlKey: false,
    });
    for (const name of ["Tempo", "Weave", "Mosaic", "Script", "Prism"]) {
      fireEvent.click(
        within(
          screen.getByRole("navigation", { name: "Design concepts" }),
        ).getByRole("button", { name: new RegExp(name) }),
      );
      expect(screen.getByRole("tab", { name: "Planner" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    }
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Community" }), {
      button: 0,
      ctrlKey: false,
    });
    fireEvent.mouseDown(screen.getByRole("tab", { name: "Challenges" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(
      screen.getByRole("button", { name: "Leave demo challenge" }),
    ).toBeInTheDocument();
  });

  it("keeps command changes in a draft until the user saves", () => {
    render(<NextWaveStudy />);
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Design concepts" }),
      ).getByRole("button", { name: /Script/ }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Move Tempo run to Friday" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Tue, Sep 8/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Fri, Sep 11/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save plan" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Plan saved for this demo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByText("Last change undone")).toBeInTheDocument();
  });
});

describe("distinct goal creation studies", () => {
  it("keeps each concept's own creation surface inside a dialog", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    expect(screen.getByRole("dialog")).toHaveClass("goal-prism");
    expect(
      screen.getByText("Give your next chapter a center."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close goal builder"));
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Design concepts" }),
      ).getByRole("button", { name: /Tempo/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    expect(screen.getByText("How often feels true?")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close goal builder"));
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Design concepts" }),
      ).getByRole("button", { name: /Weave/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    expect(screen.getByText("GOAL THREAD")).toBeInTheDocument();
  });

  it("creates a prism preview and starts a fresh draft after close", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.change(screen.getByLabelText("Name your goal"), {
      target: { value: "A draft I will abandon" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create in demo" }));
    expect(screen.getByText("Preview created")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create another" }));
    fireEvent.click(screen.getByLabelText("Close goal builder"));
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    expect(screen.getByLabelText("Name your goal")).toHaveValue("");
  });

  it("lets Weave name milestones and Script turn a sentence into a plan", () => {
    render(<NextWaveStudy />);
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Design concepts" }),
      ).getByRole("button", { name: /Weave/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "A thread with milestones" }),
    );
    fireEvent.change(screen.getByLabelText("Milestone 1"), {
      target: { value: "Publish" },
    });
    expect(screen.getByLabelText("Milestone 1")).toHaveValue("Publish");
    fireEvent.click(screen.getByLabelText("Close goal builder"));
    fireEvent.click(
      within(
        screen.getByRole("navigation", { name: "Design concepts" }),
      ).getByRole("button", { name: /Script/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.click(screen.getByRole("button", { name: "Read more books" }));
    expect(
      screen.getByText("will be completed 3 times each week."),
    ).toBeInTheDocument();
  });
});
