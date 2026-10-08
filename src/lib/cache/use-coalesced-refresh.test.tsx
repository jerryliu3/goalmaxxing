import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useCoalescedRefresh } from "./use-coalesced-refresh";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

it("retains one trailing read for multiple completions arriving mid-refresh", async () => {
  const first = deferred();
  const last = deferred();
  const refresh = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(last.promise);
  const { result, unmount } = renderHook(() => useCoalescedRefresh(refresh));
  act(() => { result.current(); result.current(); result.current(); });
  expect(refresh).toHaveBeenCalledTimes(1);
  await act(async () => { first.resolve(); await first.promise; });
  expect(refresh).toHaveBeenCalledTimes(2);
  await act(async () => { last.resolve(); await last.promise; });
  expect(refresh).toHaveBeenCalledTimes(2);
  unmount();
});

it("does not start a queued refresh after leaving the surface", async () => {
  const first = deferred();
  const refresh = vi.fn(() => first.promise);
  const { result, unmount } = renderHook(() => useCoalescedRefresh(refresh));
  act(() => { result.current(); result.current(); });
  unmount();
  await act(async () => { first.resolve(); await first.promise; });
  expect(refresh).toHaveBeenCalledTimes(1);
});

it("uses the latest date-window loader for the trailing refresh", async () => {
  const first = deferred();
  const old = vi.fn(() => first.promise);
  const latest = vi.fn(async () => undefined);
  const { result, rerender, unmount } = renderHook(({ refresh }) => useCoalescedRefresh(refresh), { initialProps: { refresh: old as () => Promise<void> } });
  act(() => { result.current(); result.current(); });
  rerender({ refresh: latest });
  await act(async () => { first.resolve(); await first.promise; });
  expect(latest).toHaveBeenCalledTimes(1);
  unmount();
});
