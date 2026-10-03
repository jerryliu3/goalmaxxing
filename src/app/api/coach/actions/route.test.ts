// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/coach/api", () => ({
  withCoachRoute: async (_request: Request, handler: (context: unknown) => unknown) => Response.json(await handler({ userId: "11111111-1111-4111-8111-111111111111", admin: { from: mocks.from } })),
  coachDatabaseError: (error: unknown) => { if (error) throw error; },
}));
import { GET } from "./route";
const owner = "11111111-1111-4111-8111-111111111111";
const timestamp = "2026-10-02T12:00:00+00:00";
const action = (index: number) => ({
  id: `22222222-2222-4222-8222-${String(index).padStart(12, "0")}`, owner_id: owner, thread_id: owner, run_id: owner,
  kind: "task_move", title: "Move task", preview: {}, status: "proposed", result: null, created_at: timestamp, applied_at: null, inverse_of: null,
});
function query(rows: ReturnType<typeof action>[]) {
  const builder = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    then: (resolve: (result: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(resolve),
  };
  mocks.from.mockReturnValue(builder);
  return builder;
}
beforeEach(() => vi.clearAllMocks());
describe("owner-wide coach change history", () => {
  it("scopes history to the authenticated owner and exposes only reviewable fields", async () => {
    const builder = query([action(1)]);
    const result = await (await GET(new Request("https://example.com/api/coach/actions"))).json();
    expect(builder.eq).toHaveBeenCalledWith("owner_id", owner);
    expect(builder.select.mock.calls[0][0]).not.toContain("command");
    expect(result).toMatchObject({ actions: [action(1)], next: null });
  });
  it("uses both timestamp and id so tied timestamps do not skip changes", async () => {
    query(Array.from({ length: 51 }, (_, index) => action(100 - index)));
    const result = await (await GET(new Request("https://example.com/api/coach/actions"))).json();
    expect(result.actions).toHaveLength(50);
    expect(result.next).toEqual({ createdAt: timestamp, id: action(51).id });
    const builder = query([action(50)]);
    await GET(new Request(`https://example.com/api/coach/actions?before=${encodeURIComponent(JSON.stringify(result.next))}`));
    expect(builder.or).toHaveBeenCalledWith(`created_at.lt.${timestamp},and(created_at.eq.${timestamp},id.lt.${action(51).id})`);
  });
  it("rejects malformed cursors before reading storage", async () => {
    await expect(GET(new Request('https://example.com/api/coach/actions?before=%7B%22id%22%3A%22unsafe%22%7D'))).rejects.toMatchObject({ status: 400 });
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
