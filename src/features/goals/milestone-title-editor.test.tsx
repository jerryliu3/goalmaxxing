import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MilestoneTitleEditor } from "./milestone-title-editor";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), single: vi.fn(), invalidate: vi.fn(), error: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({
  from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }),
  rpc: mocks.rpc,
}) }));
vi.mock("@/lib/cache/planner-tab-cache", () => ({ invalidatePlannerRelatedTabCaches: mocks.invalidate }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.single.mockResolvedValue({ data: { frequency_type: "fixed_milestones", target_count: 2, milestone_names: ["Fresh first name", "Second"] }, error: null });
  mocks.rpc.mockResolvedValue({ error: null });
});
describe("milestone title editor", () => {
  it("renames the selected ordinal using the latest names and invalidates projections", async () => {
    render(<MilestoneTitleEditor goalId="goal" unitKey="milestone:2" label="Second" />);
    fireEvent.click(screen.getByRole("button", { name: "Rename milestone Second" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Milestone name" }), { target: { value: "  Publish  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalledWith("set_goal_milestone_names", { p_goal_id: "goal", p_milestone_names: ["Fresh first name", "Publish"] }));
    await waitFor(() => expect(mocks.invalidate).toHaveBeenCalledOnce());
  });
  it("cancels without a write and leaves recurring sessions read-only", () => {
    const { rerender } = render(<MilestoneTitleEditor goalId="goal" unitKey="milestone:1" label="First" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(mocks.rpc).not.toHaveBeenCalled();
    rerender(<MilestoneTitleEditor goalId="goal" unitKey="cadence:1" label="Run" />);
    expect(screen.queryByRole("button")).toBeNull();
  });
  it("keeps failed edits open and does not invalidate cached data", async () => {
    mocks.rpc.mockResolvedValue({ error: new Error("Save failed") });
    render(<MilestoneTitleEditor goalId="goal" unitKey="milestone:2" label="Second" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Publish" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith("Save failed"));
    expect(screen.getByRole("textbox")).toHaveValue("Publish");
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});
