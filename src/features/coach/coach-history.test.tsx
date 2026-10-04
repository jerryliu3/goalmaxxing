import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCoachActionHistory } from "@cadence/shared/coach/use-action-history";
describe("change history lifecycle", () => {
  it("ignores a response from a closed view when a newer refresh has completed", async () => {
    let finish!: (value: unknown) => void;
    const delayed = new Promise(resolve => { finish = resolve; });
    const client = { getJson: vi.fn().mockReturnValueOnce(delayed).mockResolvedValue({ actions: [], next: null }) };
    const { result, rerender } = renderHook(({ visible }) => useCoachActionHistory(client, visible), { initialProps: { visible: true } });
    rerender({ visible: false });
    rerender({ visible: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => finish({ invalid: "outdated response" }));
    expect(result.current.error).toBeNull();
    expect(result.current.actions).toEqual([]);
  });
});
