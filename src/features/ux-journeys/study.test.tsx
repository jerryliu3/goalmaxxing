import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Creation } from "./creation";
import { History } from "./history";
import { draftErrors, newDraft } from "./model";

afterEach(cleanup);
const next = () =>
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));

describe("complete creation study", () => {
  it.each(["tempo", "weave", "script"] as const)(
    "preserves detailed configuration through %s creation",
    (concept) => {
      const created = vi.fn();
      render(
        <Creation
          concept={concept}
          open
          onOpenChange={() => {}}
          onCreated={created}
        />,
      );
      next();
      next();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Add a name and a category",
      );
      fireEvent.change(screen.getByLabelText("Goal name"), {
        target: { value: "Run 24 times" },
      });
      fireEvent.change(screen.getByLabelText("Category · required"), {
        target: { value: "custom" },
      });
      fireEvent.change(screen.getByLabelText("Custom category"), {
        target: { value: "Endurance" },
      });
      next();
      fireEvent.change(screen.getByLabelText("Measure the target"), {
        target: { value: "lifetime" },
      });
      fireEvent.change(screen.getByRole("spinbutton"), {
        target: { value: "24" },
      });
      next();
      fireEvent.click(screen.getByText(/change start date/));
      fireEvent.change(screen.getByLabelText("Start date"), {
        target: { value: "2026-09-12" },
      });
      fireEvent.change(screen.getByLabelText(/Completion date/), {
        target: { value: "2026-12-31" },
      });
      fireEvent.click(screen.getByText(/Time of day · any time/));
      fireEvent.change(screen.getByLabelText(/Time of day · optional/), {
        target: { value: "07:30" },
      });
      fireEvent.click(screen.getByText(/Advanced settings · difficulty/));
      fireEvent.change(screen.getByLabelText("Difficulty"), {
        target: { value: "hard" },
      });
      fireEvent.click(screen.getByLabelText("Make this goal private"));
      fireEvent.change(screen.getByLabelText(/Link to a main goal/), {
        target: { value: "health" },
      });
      fireEvent.change(screen.getByLabelText(/Achievement reward/), {
        target: { value: "A weekend away" },
      });
      next();
      fireEvent.click(screen.getByRole("button", { name: "Add goal" }));
      expect(created).toHaveBeenCalledWith([
        expect.objectContaining({
          title: "Run 24 times",
          custom_category: "Endurance",
          target_basis: "lifetime",
          target_count: "24",
          default_local_time: "07:30",
          difficulty: "hard",
          is_private: true,
          linked_target_goal_id: "health",
          reward_text: "A weekend away",
        }),
      ]);
    },
  );
  it("reviews every assisted draft and can turn a suggestion into named milestones", () => {
    const created = vi.fn();
    render(
      <Creation
        concept="weave"
        open
        onOpenChange={() => {}}
        onCreated={created}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Shape it with AI/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Preview suggestions" }),
    );
    next();
    fireEvent.click(screen.getByRole("button", { name: /Milestones.*A set/ }));
    fireEvent.change(screen.getByLabelText("Number of milestones"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByText(/Name the milestones/));
    fireEvent.change(screen.getByLabelText("Milestone 1"), {
      target: { value: "First 5K" },
    });
    fireEvent.change(screen.getByLabelText("Milestone 2"), {
      target: { value: "Race day" },
    });
    next();
    next();
    fireEvent.click(screen.getByRole("button", { name: "Add 2 goals" }));
    expect(created.mock.calls[0][0]).toHaveLength(2);
    expect(created.mock.calls[0][0][0]).toMatchObject({
      kind: "fixed_milestones",
      milestone_names: ["First 5K", "Race day"],
    });
  });
  it("uses canonical validation for impossible period targets and reversed dates", () => {
    const d = {
      ...newDraft(),
      title: "Run",
      start_date: "2026-09-12",
      end_date: "2026-09-01",
    };
    expect(draftErrors(d).length).toBeGreaterThan(0);
    expect(
      draftErrors({ ...d, end_date: "", target_count: "8" }).length,
    ).toBeGreaterThan(0);
  });
});

it("keeps ended work distinct from achieved goals and opens its exact record", () => {
  render(<History concept="script" />);
  fireEvent.click(screen.getByRole("button", { name: "Goals" }));
  fireEvent.click(screen.getByRole("button", { name: "Ended" }));
  expect(
    screen.queryByRole("button", { name: /Run a first 10K/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /A summer of reading/ }));
  const record = screen.getByRole("dialog");
  expect(within(record).getByText(/Ended · 2026-08-31/)).toBeInTheDocument();
  expect(within(record).getByText("of 12 completions")).toBeInTheDocument();
});

it("creates a dated task without inheriting goal scheduling requirements", () => {
  const created = vi.fn();
  render(
    <Creation
      concept="tempo"
      open
      onOpenChange={() => {}}
      onCreated={created}
    />,
  );
  next();
  fireEvent.change(screen.getByLabelText("Goal name"), {
    target: { value: "Book race entry" },
  });
  next();
  fireEvent.click(screen.getByRole("button", { name: /Task.*One thing/ }));
  next();
  fireEvent.change(screen.getByLabelText("Task date"), {
    target: { value: "2026-10-01" },
  });
  next();
  fireEvent.click(screen.getByRole("button", { name: "Add task" }));
  expect(created).toHaveBeenCalledWith([
    expect.objectContaining({
      kind: "planner_task",
      task_scheduled_date: "2026-10-01",
    }),
  ]);
});

it("distinguishes the inspected session date from the goal achievement date", () => {
  render(<History concept="weave" />);
  fireEvent.click(
    screen.getByRole("button", {
      name: "Run a first 10K, completed September 7",
    }),
  );
  expect(
    within(screen.getByRole("dialog")).getByText(
      /Session completed 2026-09-07/,
    ),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("dialog")).getByText(/Achieved · 2026-09-10/),
  ).toBeInTheDocument();
});
