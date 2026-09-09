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

describe("goal creation interaction", () => {
  it("builds a recurring goal and uses the shared review before demo creation", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.change(screen.getByLabelText("I want to…"), {
      target: { value: "Run regularly" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "More completions" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(screen.getByRole("button", { name: "Review goals" }));
    expect(screen.getByLabelText("Goal name")).toHaveValue("Run regularly");
    expect(screen.getByText("4 completions per week")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Create goal in demo" }),
    );
    expect(screen.getByText("1 goal created in the demo")).toBeInTheDocument();
  });
  it("sends multiple names to the same editable review cards", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.click(screen.getByRole("button", { name: "Multiple goals" }));
    fireEvent.change(screen.getByLabelText("One goal on each line"), {
      target: { value: "Read books\nBuild a portfolio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Review goals" }));
    expect(screen.getAllByLabelText("Goal name")).toHaveLength(2);
    fireEvent.change(screen.getAllByLabelText("Goal name")[0], {
      target: { value: "" },
    });
    expect(
      screen.getByRole("button", { name: "Create 2 goals in demo" }),
    ).toBeDisabled();
  });

  it("lets milestone goals be reordered before the shared review", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.change(screen.getByLabelText("I want to…"), {
      target: { value: "Launch my portfolio" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    fireEvent.click(
      screen.getByRole("button", { name: /Reach milestones/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Move milestone 2 up" }));
    expect(screen.getByLabelText("Milestone 1")).toHaveValue("Build momentum");
    expect(screen.getByLabelText("Milestone 2")).toHaveValue("First step");
  });

  it("starts a fresh draft after closing the builder", () => {
    render(<NextWaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    fireEvent.change(screen.getByLabelText("I want to…"), {
      target: { value: "A draft I will abandon" },
    });
    fireEvent.click(screen.getByLabelText("Close goal builder"));
    fireEvent.click(screen.getByRole("button", { name: /Create goal/ }));
    expect(screen.getByLabelText("I want to…")).toHaveValue("");
  });
});
