import { act, fireEvent, renderHook, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { useCalendarTaskCapture } from "./calendar-task-capture";
const mocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/tasks/client", () => ({ createPlannerTask: mocks.create }));
vi.mock("@/lib/api/client", () => ({ getApiErrorMessage: (_: unknown, fallback: string) => fallback }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("calendar task capture", () => {
  it("reveals tasks, saves on Enter, and guards duplicate submissions", async () => {
    let resolve!: () => void;
    mocks.create.mockReturnValue(new Promise<void>(done => { resolve = done; }));
    const revealTasks = vi.fn();
    const { result } = renderHook(() => useCalendarTaskCapture({ today: "2026-10-04", readOnly: false, revealTasks }));
    act(() => result.current.open("2026-10-05"));
    expect(revealTasks).toHaveBeenCalledOnce();
    render(result.current.render("2026-10-05"));
    const input = screen.getByRole("textbox", { name: "Task name" });
    fireEvent.change(input, { target: { value: " Call dentist " } });
    fireEvent.submit(input.closest("form")!);
    fireEvent.submit(input.closest("form")!);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.create).toHaveBeenCalledWith("Call dentist", "2026-10-05");
    await act(async () => resolve());
    expect(result.current.render("2026-10-05")).toBeNull();
  });
  it("rejects capture on past days and partner views", () => {
    const { result, rerender } = renderHook(({ readOnly }) => useCalendarTaskCapture({ today: "2026-10-04", readOnly, revealTasks: vi.fn() }), { initialProps: { readOnly: false } });
    act(() => result.current.open("2026-10-03"));
    expect(result.current.render("2026-10-03")).toBeNull();
    rerender({ readOnly: true });
    act(() => result.current.open("2026-10-05"));
    expect(result.current.render("2026-10-05")).toBeNull();
  });
  it("cancels outside the cell but keeps the draft when clicking inside it", () => {
    const { result } = renderHook(() => useCalendarTaskCapture({ today: "2026-10-04", readOnly: false, revealTasks: vi.fn() }));
    act(() => result.current.open("2026-10-05"));
    render(<div data-day-cell="true">{result.current.render("2026-10-05")}<button>Inside cell</button></div>);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Inside cell" }));
    expect(result.current.render("2026-10-05")).not.toBeNull();
    fireEvent.pointerDown(document.body);
    expect(result.current.render("2026-10-05")).toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("keeps the text on a failed save and Escape cancels without writing", async () => {
    mocks.create.mockRejectedValue(new Error("offline"));
    const { result } = renderHook(() => useCalendarTaskCapture({ today: "2026-10-04", readOnly: false, revealTasks: vi.fn() }));
    act(() => result.current.open("2026-10-04"));
    render(result.current.render("2026-10-04"));
    const input = screen.getByRole("textbox", { name: "Task name" });
    fireEvent.change(input, { target: { value: "Dentist" } });
    fireEvent.submit(input.closest("form")!);
    await waitFor(() => expect(input).not.toHaveAttribute("readonly"));
    expect(input).toHaveValue("Dentist");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(result.current.render("2026-10-04")).toBeNull();
  });
});
