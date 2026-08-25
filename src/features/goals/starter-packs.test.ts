import { describe, expect, it } from "vitest";
import {
  STARTER_PACKS,
  type StarterPackKey,
  buildStarterPackRows,
  clearAllStarterPacksSeen,
  isStarterPacksSeen,
  markStarterPacksSeen,
  resolveStarterPackKey,
} from "@/features/goals/starter-packs";

function spanDays(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

describe("starter packs", () => {
  it("resolves only supported starter pack keys", () => {
    for (const pack of STARTER_PACKS) {
      expect(resolveStarterPackKey(pack.key)).toBe(pack.key);
    }
    expect(resolveStarterPackKey("finance")).toBeNull();
    expect(resolveStarterPackKey(null)).toBeNull();
  });

  it("offers at least one pack per requested category", () => {
    expect(STARTER_PACKS.map((pack) => pack.key)).toEqual([
      "health",
      "fitness",
      "career",
      "personal",
      "relationships",
    ]);
  });

  it("builds three goals per starter pack with varying targets and deadlines", () => {
    for (const pack of STARTER_PACKS) {
      const rows = buildStarterPackRows(pack.key, "2026-08-01");
      expect(rows).toHaveLength(3);
      expect(rows.every((row) => row.start_date === "2026-08-01")).toBe(true);
      expect(new Set(rows.map((row) => String(row.target_count))).size).toBeGreaterThan(1);
      expect(new Set(rows.map((row) => String(row.end_date))).size).toBe(3);
    }
  });

  it("keeps at most one daily activity per pack and does not pack the calendar", () => {
    for (const pack of STARTER_PACKS) {
      const rows = buildStarterPackRows(pack.key, "2026-08-01");
      const dailyRows = rows.filter(
        (row) =>
          row.frequency_type === "recurring" && row.recurrence_interval === "daily"
      );
      expect(dailyRows.length).toBeLessThanOrEqual(1);

      for (const row of dailyRows) {
        const target = Number(row.target_count);
        const days = spanDays(String(row.start_date), String(row.end_date));
        expect(target).toBeGreaterThan(0);
        expect(target).toBeLessThanOrEqual(10);
        expect(days).toBeGreaterThanOrEqual(60);
        expect(target / days).toBeLessThanOrEqual(1 / 7);
      }
    }
  });

  it("keeps milestone variety where expected", () => {
    const fitnessRows = buildStarterPackRows("fitness", "2026-08-01");
    const careerRows = buildStarterPackRows("career", "2026-08-01");
    const relationshipRows = buildStarterPackRows("relationships", "2026-08-01");

    expect(
      fitnessRows.some((row) => row.frequency_type === "fixed_milestones")
    ).toBe(true);
    expect(
      careerRows.some((row) => row.frequency_type === "fixed_milestones")
    ).toBe(true);
    expect(
      relationshipRows.some((row) => row.category === "Relationships")
    ).toBe(true);
  });

  it("persists first-visit starter pack visibility per user", () => {
    window.localStorage.clear();
    expect(isStarterPacksSeen("user-1")).toBe(false);
    markStarterPacksSeen("user-1");
    expect(isStarterPacksSeen("user-1")).toBe(true);
    expect(isStarterPacksSeen("user-2")).toBe(false);
  });

  it("clears every starter-pack seen key", () => {
    window.localStorage.clear();
    markStarterPacksSeen("user-1");
    markStarterPacksSeen("user-2");
    clearAllStarterPacksSeen();
    expect(isStarterPacksSeen("user-1")).toBe(false);
    expect(isStarterPacksSeen("user-2")).toBe(false);
  });

  it("keeps pack end dates on civil-day arithmetic across DST", () => {
    const rows = buildStarterPackRows("health", "2026-03-08");
    expect(rows[0]?.end_date).toBe("2026-06-06");
  });

  it("rejects unknown starter pack keys", () => {
    expect(() =>
      buildStarterPackRows("finance" as StarterPackKey, "2026-08-01")
    ).toThrow(/Unsupported starter pack/);
  });

  it("uses explicit target basis and counts for every recurring starter-pack row", () => {
    const expectedRecurringTargets: Record<
      StarterPackKey,
      Array<{ title: string; target_basis: string; target_count: string }>
    > = {
      health: [
        { title: "Hydration check-ins", target_basis: "lifetime", target_count: "6" },
        { title: "Meal prep session", target_basis: "lifetime", target_count: "10" },
      ],
      fitness: [
        { title: "Strength training", target_basis: "lifetime", target_count: "12" },
        { title: "Mobility sessions", target_basis: "lifetime", target_count: "8" },
      ],
      career: [
        { title: "Weekly deep work block", target_basis: "lifetime", target_count: "14" },
        { title: "Portfolio update cadence", target_basis: "lifetime", target_count: "4" },
      ],
      personal: [
        { title: "Weekly planning reset", target_basis: "lifetime", target_count: "8" },
        { title: "Life admin sweep", target_basis: "lifetime", target_count: "6" },
      ],
      relationships: [
        { title: "Weekly partner check-in", target_basis: "lifetime", target_count: "10" },
        { title: "Appreciation notes", target_basis: "lifetime", target_count: "8" },
      ],
    };

    for (const pack of STARTER_PACKS) {
      const rows = buildStarterPackRows(pack.key, "2026-08-01");
      const recurringRows = rows.filter((row) => row.frequency_type === "recurring");
      const expectedRows = expectedRecurringTargets[pack.key];

      expect(recurringRows).toHaveLength(expectedRows.length);
      for (const [index, expected] of expectedRows.entries()) {
        expect(recurringRows[index]).toMatchObject(expected);
      }
    }
  });
});
