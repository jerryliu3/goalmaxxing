import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GoalViewStudySession } from "./use-study";
import { WeekWeaveStudy } from "./weave-study";

// Keep the real composition, navigation and reducer; substitute the expensive
// material/drag surfaces so this covers state continuity without testing motion.
function StateProbe({ study, anchor }: { study: GoalViewStudySession; anchor: string }) {
  const moved = study.state.sessions.find(s => s.id === "half-2")!;
  const practice = study.state.sessions.find(s => s.goalId === "japanese" && s.date === "2026-10-02")!;
  return <div>
    <output data-testid="anchor">{anchor}</output>
    <output data-testid="placement">{moved.date}</output>
    <output data-testid="practice-complete">{String(study.state.facts.some(f => f.goal_id === practice.goalId && f.completed_on === practice.date))}</output>
    <button onClick={() => study.dispatch({ type: "edit", id: moved.id, date: "2026-10-03", time: moved.time })}>Move sample session</button>
    <button onClick={() => study.dispatch({ type: "complete", id: practice.id })}>Log sample practice</button>
  </div>;
}

vi.mock("motion/react", () => ({
  useReducedMotion: () => true,
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: { div: ({ children }: { children: ReactNode }) => <div>{children}</div> },
}));
vi.mock("./use-stage-width", () => ({ useStageWidth: () => ({ ref: null, width: 1200 }) }));
vi.mock("./study-chrome", async () => {
  const actual = await vi.importActual<typeof import("./study-chrome")>("./study-chrome");
  return { ...actual, StudyChrome: ({ children, controls }: { children: ReactNode; controls: ReactNode }) => <div>{controls}{children}</div> };
});
vi.mock("./weave-timeline", () => ({ WeaveTimeline: ({ study, selectedDate }: { study: GoalViewStudySession; selectedDate: string }) => <StateProbe study={study} anchor={selectedDate} /> }));
vi.mock("./weave-week-agenda", () => ({ WeaveWeekAgenda: StateProbe }));
vi.mock("./goal-weave-panel", () => ({ GoalWeavePanel: ({ study, navigation }: { study: GoalViewStudySession; navigation: { visibleDate: string } }) => <StateProbe study={study} anchor={navigation.visibleDate} /> }));
vi.mock("./weave-day-inspector", () => ({ WeaveDayInspector: () => null }));
vi.mock("./session-editor", () => ({ SessionEditor: () => null }));
vi.mock("./calendar-peek", () => ({ CalendarPeek: () => null }));

afterEach(cleanup);

describe("Time Weave placement comparison", () => {
  it("keeps draft dates and completion facts when changing Week orientation and Goal View placement", () => {
    render(<WeekWeaveStudy />);
    fireEvent.click(screen.getByRole("button", { name: "Move sample session" }));
    expect(screen.getByTestId("placement")).toHaveTextContent("2026-10-03");
    fireEvent.click(screen.getByRole("button", { name: "Week agenda" }));
    expect(screen.getByTestId("placement")).toHaveTextContent("2026-10-03");
    const placements = within(screen.getByRole("group", { name: "Compare Time Weave placement" }));
    fireEvent.click(placements.getByRole("button", { name: "Goal View" }));
    expect(screen.getByTestId("placement")).toHaveTextContent("2026-10-03");
    fireEvent.click(screen.getByRole("button", { name: "Log sample practice" }));
    expect(screen.getByTestId("practice-complete")).toHaveTextContent("true");
    fireEvent.click(placements.getByRole("button", { name: "Week" }));
    expect(screen.getByTestId("practice-complete")).toHaveTextContent("true");
    fireEvent.click(screen.getByRole("button", { name: "Undo changes" }));
    expect(screen.getByTestId("placement")).toHaveTextContent("2026-10-02");
    expect(screen.getByTestId("practice-complete")).toHaveTextContent("true");
  });

  it("uses the week containing a distant date and retains that leading date in Goal View", () => {
    render(<WeekWeaveStudy />);
    fireEvent.change(screen.getByLabelText("Jump to date"), { target: { value: "2026-12-31" } });
    fireEvent.click(screen.getByRole("button", { name: "Week agenda" }));
    expect(screen.getByTestId("anchor")).toHaveTextContent("2026-12-28");
    fireEvent.click(within(screen.getByRole("group", { name: "Compare Time Weave placement" })).getByRole("button", { name: "Goal View" }));
    expect(screen.getByTestId("anchor")).toHaveTextContent("2026-12-31");
  });
});
