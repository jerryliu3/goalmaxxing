// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  queryResult: vi.fn(),
  queryState: {
    table: "",
    filters: [] as Array<Record<string, unknown>>,
    orders: [] as Array<Record<string, unknown>>,
    limit: null as number | null,
  },
}));

function createQuery() {
  const query = {
    select() {
      return query;
    },
    eq(column: string, value: unknown) {
      mocks.queryState.filters.push({ op: "eq", column, value });
      return query;
    },
    or(value: string) {
      mocks.queryState.filters.push({ op: "or", value });
      return query;
    },
    gte(column: string, value: unknown) {
      mocks.queryState.filters.push({ op: "gte", column, value });
      return query;
    },
    lte(column: string, value: unknown) {
      mocks.queryState.filters.push({ op: "lte", column, value });
      return query;
    },
    order(column: string, options?: Record<string, unknown>) {
      mocks.queryState.orders.push({ column, ...options });
      return query;
    },
    limit(value: number) {
      mocks.queryState.limit = value;
      return query;
    },
    then<TResult1 = unknown, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: unknown; error: unknown }) => TResult1)
        | null,
      onrejected?: ((reason: unknown) => TResult2) | null
    ) {
      return Promise.resolve(mocks.queryResult()).then(onfulfilled, onrejected);
    },
  };
  return query;
}

vi.mock("@/lib/supabase/route", () => ({
  createRouteClient: async (request: Request) => {
    const authHeader = request.headers.get("authorization");
    const accessToken =
      authHeader && authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : undefined;

    return {
      accessToken,
      supabase: {
        auth: {
          getUser: mocks.getUser,
        },
        from: (table: string) => {
          mocks.queryState.table = table;
          mocks.queryState.filters = [];
          mocks.queryState.orders = [];
          mocks.queryState.limit = null;
          return createQuery();
        },
      },
    };
  },
}));

vi.mock("@/lib/observability/report-error", () => ({
  reportError: vi.fn(),
}));

import { GET } from "./route";

function request(query: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/planner/tasks");
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return new Request(url, { method: "GET" });
}

describe("GET /api/planner/tasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "11111111-1111-4111-8111-111111111111" } },
      error: null,
    });
    mocks.queryResult.mockReturnValue({
      data: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          title: "File taxes",
          scheduled_date: "2026-09-02",
          scheduled_time: "08:00",
          completed_at: null,
          created_at: "2026-09-01T00:00:00.000Z",
          updated_at: "2026-09-01T00:00:00.000Z",
        },
      ],
      error: null,
    });
  });

  it("returns authentication_required for unauthenticated requests", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const response = await GET(request({ from: "2026-09-01", to: "2026-09-30" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      code: "authentication_required",
    });
  });

  it("rejects missing and inverted date windows", async () => {
    const missing = await GET(request());
    expect(missing.status).toBe(400);
    await expect(missing.json()).resolves.toMatchObject({
      code: "validation_failed",
    });

    const inverted = await GET(request({ from: "2026-09-30", to: "2026-09-01" }));
    expect(inverted.status).toBe(400);
  });

  it("lists owner-visible tasks in the requested date window", async () => {
    const response = await GET(request({ from: "2026-09-01", to: "2026-09-30" }));

    expect(response.status).toBe(200);
    expect(mocks.queryState.table).toBe("planner_tasks");
    expect(mocks.queryState.filters).toEqual([
      { op: "eq", column: "is_deleted", value: false },
      { op: "or", value: "scheduled_date.gte.2026-09-01,completed_at.is.null" },
      { op: "lte", column: "scheduled_date", value: "2026-09-30" },
    ]);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "1",
      tasks: [
        {
          taskId: "22222222-2222-4222-8222-222222222222",
          title: "File taxes",
          scheduledDate: "2026-09-02",
          scheduledTime: "08:00",
          completedAt: null,
        },
      ],
      correlationId: expect.any(String),
    });
  });

  it("returns calendar_tasks_load_failed when the query errors", async () => {
    mocks.queryResult.mockReturnValue({
      data: null,
      error: { message: "boom" },
    });

    const response = await GET(request({ from: "2026-09-01", to: "2026-09-30" }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      code: "calendar_tasks_load_failed",
    });
  });
});
