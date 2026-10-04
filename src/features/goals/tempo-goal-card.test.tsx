import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import type { GoalCreationFields } from "@/features/goals/goal-creation-model";

const baseFields: GoalCreationFields = {
  title: "Build momentum",
  description: "",
  category_selection: "career",
  custom_category: "",
  color: "#6366f1",
  frequency_type: "recurring",
  recurrence_interval: "weekly",
  target_count: "3",
  target_basis: "period",
  milestone_names: [],
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  default_local_time: "",
  difficulty: "medium",
  is_private: false,
  linked_target_goal_id: "none",
};

const fullVisibility = {
  category: true,
  rhythm: true,
  interval: true,
  count: true,
  schedule: true,
  difficulty: true,
};

function renderCard(props: Partial<Parameters<typeof TempoGoalCard>[0]> = {}) {
  render(<TempoGoalCard fields={baseFields} {...props} />);
  return screen.getByRole("article", { name: "Goal card preview" });
}

describe("TempoGoalCard materials", () => {
  afterEach(() => {
    cleanup();
  });

  it("maps easy goals to liquid glass", () => {
    expect(
      renderCard({ fields: { ...baseFields, difficulty: "easy" } })
    ).toHaveAttribute("data-material", "glass");
  });

  it("renders every production card inside the canonical scalable face", () => {
    const card = renderCard();
    expect(card).toHaveAttribute("data-tempo-goal-card", "");
    expect(card.parentElement).toHaveClass("tempo-card-frame");
  });

  it("maps medium goals to anodized alloy", () => {
    expect(
      renderCard({ fields: { ...baseFields, difficulty: "medium" } })
    ).toHaveAttribute("data-material", "alloy");
  });

  it("maps hard goals to chromatic foil", () => {
    expect(
      renderCard({ fields: { ...baseFields, difficulty: "hard" } })
    ).toHaveAttribute("data-material", "chromatic");
  });

  it("embosses material card lettering at the production depth", () => {
    const { container } = render(
      <TempoGoalCard fields={{ ...baseFields, difficulty: "hard" }} />,
    );
    expect(container.querySelector(".tempo-card-surface")).toHaveAttribute(
      "data-material",
      "chromatic",
    );
    expect(
      container.querySelectorAll("[data-lettering-solid]").length,
    ).toBeGreaterThan(0);
    expect(
      container.querySelector('[data-lettering-solid="display"]'),
    ).not.toBeNull();
  });

  it("falls back to liquid glass when a goal has no difficulty", () => {
    expect(
      renderCard({
        fields: {
          ...baseFields,
          difficulty: undefined,
        } as unknown as GoalCreationFields,
      })
    ).toHaveAttribute("data-material", "glass");
  });

  it("keeps planner tasks on the neutral glass finish", () => {
    expect(
      renderCard({
        fields: { ...baseFields, difficulty: "hard" },
        isTask: true,
        taskSchedule: { date: "Jan 1", time: "08:00" },
      })
    ).toHaveAttribute("data-material", "glass");
  });

  it("withholds the material until difficulty is disclosed", () => {
    expect(
      renderCard({ visibility: { ...fullVisibility, difficulty: false } })
    ).not.toHaveAttribute("data-material");
  });

  it("renders no material when a study opts out of the production surface", () => {
    expect(renderCard({ surface: "plain" })).not.toHaveAttribute(
      "data-material"
    );
  });

  it("gives a material card a posed surface carrying the goal color", () => {
    const surface = renderCard().closest(".tempo-card-surface");

    expect(surface).toHaveAttribute("data-material", "alloy");
    expect(surface).toHaveStyle({ "--goal-color": baseFields.color });
  });

  it("does not wrap a card that has no material", () => {
    expect(
      renderCard({ surface: "plain" }).closest(".tempo-card-surface")
    ).toBeNull();
  });
});

describe("TempoGoalCard rotation", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] });
    // jsdom has no native PointerEvent; keep the fields pointer capture reads.
    vi.stubGlobal(
      "PointerEvent",
      class extends MouseEvent {
        pointerId: number;
        pointerType: string;
        isPrimary: boolean;
        constructor(type: string, init: PointerEventInit = {}) {
          super(type, init);
          this.pointerId = init.pointerId ?? 1;
          this.pointerType = init.pointerType ?? "mouse";
          this.isPrimary = init.isPrimary ?? true;
        }
      }
    );
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function renderPosed() {
    const card = renderCard();
    const object = screen.getByRole("group", { name: "Build momentum rotation" });

    return { object, surface: card.closest<HTMLElement>(".tempo-card-surface")! };
  }

  it("captures a drag past a half turn and holds the inspected pose", () => {
    const { object, surface } = renderPosed();
    const capture = vi.spyOn(object, "setPointerCapture");

    fireEvent.pointerDown(object, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    expect(capture).toHaveBeenCalledWith(1);
    expect(surface).toHaveAttribute("data-dragging", "true");

    // Captured events target the object and bubble to the single stage handler.
    fireEvent.pointerMove(object, { pointerId: 1, clientX: 450, clientY: 380 });
    act(() => vi.advanceTimersByTime(16));
    expect(parseFloat(surface.style.getPropertyValue("--ry"))).toBeGreaterThan(180);
    expect(parseFloat(surface.style.getPropertyValue("--rx"))).toBeLessThan(-180);

    fireEvent.pointerUp(surface, { pointerId: 1 });
    const held = surface.style.getPropertyValue("--ry");
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 120, clientY: 120 });

    expect(surface.style.getPropertyValue("--ry")).toBe(held);
    expect(surface).toHaveAttribute("data-inspecting", "true");
    expect(surface).not.toHaveAttribute("data-dragging");
  });

  it("returns a turned card to rest once the pointer leaves", () => {
    const { object, surface } = renderPosed();

    fireEvent.pointerDown(object, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 300, clientY: 200 });
    fireEvent.pointerUp(surface, { pointerId: 1 });
    fireEvent.pointerLeave(surface);

    expect(surface).toHaveAttribute("data-inspecting", "false");
  });

  it("turns fragmented cards directly with touch and releases capture when deactivated", () => {
    const props = { fields: baseFields, assembly: { completed: 29, target: 30 } };
    const { rerender } = render(<TempoGoalCard {...props} rotatable />);
    const object = screen.getByRole("group", { name: "Build momentum rotation" });
    const surface = object.closest<HTMLElement>(".tempo-card-surface")!;
    vi.spyOn(object, "hasPointerCapture").mockReturnValue(true);
    const release = vi.spyOn(object, "releasePointerCapture");

    fireEvent.pointerDown(object, { pointerId: 2, pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(object, { pointerId: 2, pointerType: "touch", clientX: 200, clientY: 150 });
    act(() => vi.advanceTimersByTime(16));
    expect(parseFloat(surface.style.getPropertyValue("--ry"))).toBeGreaterThan(0);
    expect(surface.querySelector("[data-flat-shards]")).not.toBeInTheDocument();
    expect(surface.querySelector("[data-reward-piece]")).toBeInTheDocument();

    // Queue another drag update; disabling rotation must cancel it as well.
    fireEvent.pointerMove(object, { pointerId: 2, pointerType: "touch", clientX: 300, clientY: 150 });
    rerender(<TempoGoalCard {...props} rotatable={false} />);
    act(() => vi.advanceTimersByTime(16));
    expect(release).toHaveBeenCalledWith(2);
    expect(surface).not.toHaveAttribute("data-dragging");
    expect(surface).toHaveAttribute("data-still", "true");
    expect(surface.style.getPropertyValue("--ry")).toBe("0deg");
  });

  it("leaves the drag gesture to a host that owns swiping", () => {
    const card = renderCard({ rotatable: false });
    const surface = card.closest<HTMLElement>(".tempo-card-surface")!;
    const object = surface.querySelector<HTMLElement>(".tempo-card-object")!;
    const capture = vi.spyOn(object, "setPointerCapture");

    expect(
      screen.queryByRole("group", { name: /rotation$/ })
    ).not.toBeInTheDocument();

    fireEvent.pointerDown(object, {
      pointerId: 1,
      button: 0,
      clientX: 100,
      clientY: 100,
    });
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 450, clientY: 380 });

    expect(capture).not.toHaveBeenCalled();
    expect(surface).not.toHaveAttribute("data-dragging");
    expect(surface).toHaveAttribute("data-rotatable", "false");
    expect(surface).toHaveAttribute("data-still", "true");
    expect(surface.style.getPropertyValue("--rx")).toBe("0deg");
    expect(surface.style.getPropertyValue("--ry")).toBe("0deg");
  });

  it("rotates and flips from the keyboard", () => {
    const { object, surface } = renderPosed();

    expect(object).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(object, { key: "Enter" });
    expect(surface).toHaveAttribute("data-inspecting", "true");

    fireEvent.keyDown(object, { key: "Home" });
    expect(surface).toHaveAttribute("data-inspecting", "false");
  });
});


describe("material card reassembly", () => {
  afterEach(cleanup);

  it.each([3, 30, 300])("keeps static masks lightweight without filling fragment gaps for target %i", (target) => {
    const { container } = render(<TempoGoalCard fields={baseFields} assembly={{ completed: target - 1, target }} flat rotatable />);
    expect(screen.queryByRole("group", { name: "Build momentum rotation" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(container.querySelectorAll("[data-card-solid]")).toHaveLength(0);
    expect(container.querySelectorAll(".tempo-card")).toHaveLength(3);
    expect(container.querySelector("[data-flat-shards]")).toBeInTheDocument();
    expect(container.querySelector("[data-reward-piece]")).not.toBeInTheDocument();
  });

  it("leaves noninteractive gallery masks without an extruded body", () => {
    const { container } = render(<TempoGoalCard fields={baseFields} assembly={{ completed: 2, target: 3 }} flat rotatable={false} />);
    expect(container.querySelector("[data-card-solid]")).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /rotation$/ })).not.toBeInTheDocument();
  });

  it("shares one material surface and hides duplicate faces from accessibility", () => {
    const { container } = render(<TempoGoalCard fields={{ ...baseFields, difficulty: "hard" }} assembly={{ completed: 2, target: 3 }} rotatable={false} />);
    expect(container.querySelectorAll(".tempo-card-surface")).toHaveLength(1);
    expect(container.querySelector(".tempo-card-surface")).toHaveAttribute("data-material", "chromatic");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    for (const face of container.querySelectorAll(".tempo-card")) expect(face).toHaveAttribute("data-material", "chromatic");
    expect(container.querySelector('[data-reward-piece="0"]')).toHaveAttribute("data-arriving", "false");
  });
});
