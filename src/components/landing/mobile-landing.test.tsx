import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileLanding } from "./mobile-landing";
import { COMPLETION_HOLD_MS } from "@/components/ui/completion-toggle";

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}));
vi.mock("@/features/goals/tempo-goal-card", () => ({
  TempoGoalCard: ({ fields }: { fields: { target_count: string } }) => (
    <div data-testid="real-card-boundary">{fields.target_count}</div>
  ),
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
function hold(button: HTMLElement) {
  fireEvent.pointerDown(button, { button: 0, pointerType: "touch" });
  act(() => {
    vi.advanceTimersByTime(COMPLETION_HOLD_MS + 20);
  });
  fireEvent.pointerUp(button, { button: 0, pointerType: "touch" });
}

describe("mobile landing journey", () => {
  it("updates the goal and month together, then stages, undoes, and saves one move", () => {
    render(<MobileLanding />);
    fireEvent.click(screen.getByRole("button", { name: /12 days/ }));
    expect(screen.getByTestId("real-card-boundary")).toHaveTextContent("12");
    expect(screen.getByRole("progressbar")).toHaveAttribute("max", "12");
    fireEvent.click(screen.getByRole("button", { name: /Move Thursday/ }));
    expect(
      screen.getByText("Unsaved move · Thursday → Friday"),
    ).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "2");
    fireEvent.click(screen.getByRole("button", { name: "Undo", exact: true }));
    expect(screen.getByText("Thursday · placed work")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Move Thursday/ }));
    fireEvent.click(screen.getByRole("button", { name: "Save example" }));
    expect(
      screen.getByText("Example plan saved. Friday is ready."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Record running session on October 9",
      }),
    ).toBeDisabled();
  });

  it("uses hold completion and preserves a record when its placement leaves the lighter plan", () => {
    vi.useFakeTimers();
    render(<MobileLanding />);
    fireEvent.click(screen.getByRole("button", { name: /12 days/ }));
    hold(
      screen.getByRole("button", {
        name: "Record running session on October 3",
      }),
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "3");
    fireEvent.click(screen.getByRole("button", { name: /8 days/ }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "3");
    hold(
      screen.getByRole("button", { name: "Undo running session on October 3" }),
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "2");
    expect(
      screen.queryByRole("button", {
        name: "Record running session on October 3",
      }),
    ).not.toBeInTheDocument();
  });

  it("shows selected-day work and preserves public destinations", () => {
    render(<MobileLanding />);
    fireEvent.click(
      screen.getByRole("button", { name: /^Friday, October 9\./ }),
    );
    expect(
      screen.getByRole("heading", { name: "Friday, Oct 9" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Room in the plan. No session placed here."),
    ).toBeInTheDocument();
    const journey = within(screen.getByTestId("mobile-landing"));
    expect(journey.getByRole("link", { name: /Get started/ })).toHaveAttribute(
      "href",
      "/signup",
    );
    expect(journey.getByRole("link", { name: "Go to app" })).toHaveAttribute(
      "href",
      "/calendar",
    );
    expect(
      journey.getAllByRole("link", { name: "Try demo" })[0],
    ).toHaveAttribute("href", "/demo");
  });
});
