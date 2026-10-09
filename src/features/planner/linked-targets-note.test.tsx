import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LinkedTargetsNote } from "./linked-targets-note";

describe("LinkedTargetsNote", () => {
  afterEach(cleanup);
  it("opens the target goal directly from the credit relationship", () => {
    render(<LinkedTargetsNote linkedTargets={[{ sourceGoalId: "practice", targetGoalId: "fitness" }]} goalTitles={{ fitness: "Improve fitness" }} />);
    expect(screen.getByText("Also counts toward")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Improve fitness" })).toHaveAttribute("href", "/goals/fitness");
    expect(screen.queryByText(/hidden/i)).toBeNull();
  });
});
