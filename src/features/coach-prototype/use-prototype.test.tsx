import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePrototype } from "./use-prototype";

describe("companion response lifecycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("delivers a reply to its original conversation after switching rooms and minimizing", () => {
    const { result, unmount } = renderHook(usePrototype);
    act(() => result.current.send("How is my week going?"));
    act(() => {
      result.current.dispatch({ type: "topic", id: "writing" });
      result.current.dispatch({ type: "mode", value: "minimized" });
    });
    act(() => vi.advanceTimersByTime(950));
    expect(result.current.state.mode).toBe("minimized");
    expect(result.current.state.threadId).toBe("writing-main");
    expect(result.current.state.threads.find(row => row.id === "week-main")?.messages.map(row => row.role)).toEqual(["user", "coach"]);
    expect(result.current.state.threads.find(row => row.id === "writing-main")?.messages).toHaveLength(2);
    expect(result.current.pending).toEqual({});
    unmount();
  });

  it("keeps a starter as a draft while offline and can send it after reconnecting", () => {
    const { result, unmount } = renderHook(usePrototype);
    act(() => result.current.setOffline(true));
    act(() => result.current.send("Make today lighter."));
    expect(result.current.state.threads[0].draft).toBe("Make today lighter.");
    expect(result.current.state.threads[0].messages).toHaveLength(0);
    act(() => result.current.setOffline(false));
    act(() => result.current.send());
    act(() => vi.advanceTimersByTime(950));
    expect(result.current.state.threads[0].draft).toBe("");
    expect(result.current.state.threads[0].messages.at(-1)?.change?.status).toBe("proposed");
    unmount();
  });

  it("stops a reply without losing the next draft and reset cancels pending work", () => {
    const { result, unmount } = renderHook(usePrototype);
    act(() => result.current.send("How is my week going?"));
    act(() => result.current.dispatch({ type: "draft", threadId: "week-main", value: "Another question" }));
    act(() => result.current.stop());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.state.threads[0].messages.at(-1)?.text).toContain("Stopped.");
    expect(result.current.state.threads[0].draft).toBe("Another question");
    act(() => result.current.send());
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.state.threads[0].messages).toHaveLength(0);
    expect(result.current.pending).toEqual({});
    unmount();
  });
});
