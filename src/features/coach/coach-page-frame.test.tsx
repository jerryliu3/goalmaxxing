import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ mode: "companion" }));
vi.mock("./coach-provider", () => ({ useCoach: () => state }));
import { CoachPageFrame } from "./coach-page-frame";
describe("expansion preserves the owning page", () => {
  it("keeps unsaved input mounted and makes the covered page inert until contraction", () => {
    const page = <CoachPageFrame><input aria-label="Planner draft" defaultValue="Original" /></CoachPageFrame>;
    const { rerender } = render(page);
    const input = screen.getByLabelText("Planner draft");
    fireEvent.change(input, { target: { value: "Unsaved work" } });
    state.mode = "expanded";
    rerender(<CoachPageFrame><input aria-label="Planner draft" defaultValue="Original" /></CoachPageFrame>);
    expect(screen.getByLabelText("Planner draft")).toBe(input);
    expect((input as HTMLInputElement).value).toBe("Unsaved work");
    expect(input.parentElement?.hasAttribute("inert")).toBe(true);
    state.mode = "companion";
    rerender(page);
    expect(input.parentElement?.hasAttribute("inert")).toBe(false);
    expect((input as HTMLInputElement).value).toBe("Unsaved work");
  });
});
