import { describe, expect, it, vi } from "vitest";
import { buildGoal } from "@/lib/goals/goal-test-fixtures";
import { growScoreTopPercent } from "@/lib/social/public-profile-model";
import { refreshGrowScoreStandings } from "@/lib/social/grow-score-standings";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const today = new Date().toISOString().slice(0, 10);

function fakeAdmin(tables: Record<string, unknown[]>) {
  const upserts: unknown[][] = [];
  const query = (table: string) => {
    const chain: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "order", "limit", "gt"]) {
      chain[method] = () => chain;
    }
    chain.upsert = (rows: unknown[]) => {
      upserts.push(rows);
      return Promise.resolve({ error: null });
    };
    chain.then = (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: tables[table] ?? [], error: null }).then(resolve);
    return chain;
  };
  return { admin: { from: query } as never, upserts };
}

describe("growScoreTopPercent", () => {
  it("rounds rank over total to a whole percent, never below 1%", () => {
    expect(growScoreTopPercent(3, 100)).toBe(3);
    expect(growScoreTopPercent(1, 1000)).toBe(1);
    expect(growScoreTopPercent(7, 40)).toBe(18);
    expect(growScoreTopPercent(40, 40)).toBe(100);
    expect(growScoreTopPercent(1, 0)).toBeNull();
  });
});

describe("refreshGrowScoreStandings", () => {
  it("stores a current score for every real account and skips synthetic ones", async () => {
    const goal = buildGoal({ id: "goal-1", owner_id: "real-1", start_date: "2026-01-01" });
    const { admin, upserts } = fakeAdmin({
      synthetic_users: [{ user_id: "bot-1" }],
      profiles: [
        { id: "bot-1", timezone: "UTC", week_starts_on: 1, created_at: "2026-01-01T00:00:00Z" },
        { id: "real-1", timezone: "UTC", week_starts_on: 1, created_at: "2026-01-01T00:00:00Z" },
      ],
      goals: [goal],
      completions: [{ id: "c-1", goal_id: "goal-1", user_id: "real-1", completed_on: today, source: "manual" }],
    });

    await expect(refreshGrowScoreStandings(admin)).resolves.toEqual({ refreshed: 1, skipped: 0 });
    const [rows] = upserts as Array<Array<{ user_id: string; score: number; as_of_date: string }>>;
    expect(rows.map((row) => row.user_id)).toEqual(["real-1"]);
    expect(rows[0]!.score).toBeGreaterThan(0);
    expect(rows[0]!.as_of_date).toBe(today);
  });
});
