import { describe, expect, it } from "vitest";
import {
  INITIAL_MONTH_STATE,
  MONTH_WORK,
  monthReducer,
  monthSessions,
  monthWeeks,
  shiftMonth,
  visibleMonthWork,
} from "./month-model";
describe("full mobile month study", () => {
  it("retains all dates with correct Monday alignment, including adjacent month navigation", () => {
    const weeks = monthWeeks("2026-10");
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0].date).toBe("2026-09-28");
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(31);
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  });
  it("does not save a move until Save; Undo preserves completion records", () => {
    const draft = monthReducer(INITIAL_MONTH_STATE, {
      type: "move",
      id: "film-8",
      date: "2026-10-09",
    });
    expect(draft.saved).toEqual({});
    expect(monthSessions(draft).find((s) => s.id === "film-8")?.date).toBe(
      "2026-10-09",
    );
    expect(monthReducer(draft, { type: "undo" })).toEqual(INITIAL_MONTH_STATE);
    const saved = monthReducer(draft, { type: "save" });
    expect(saved.saved["film-8"]).toBe("2026-10-09");
    expect(monthReducer(saved, { type: "undo" }).saved).toEqual(saved.saved);
  });
  it("retains moves across month/filter changes and allows crossing only within the goal lifetime", () => {
    const moved = monthReducer(INITIAL_MONTH_STATE, {
      type: "move",
      id: "film-31",
      date: "2026-11-02",
    });
    expect(
      visibleMonthWork(monthSessions(moved), "Solo", "run").some(
        (s) => s.id === "film-31",
      ),
    ).toBe(false);
    expect(monthReducer(moved, { type: "save" }).saved["film-31"]).toBe(
      "2026-11-02",
    );
    expect(
      monthReducer(INITIAL_MONTH_STATE, {
        type: "move",
        id: "run-31",
        date: "2026-11-02",
      }),
    ).toBe(INITIAL_MONTH_STATE);
    expect(
      monthReducer(INITIAL_MONTH_STATE, {
        type: "move",
        id: "film-8",
        date: "invalid",
      }),
    ).toBe(INITIAL_MONTH_STATE);
  });
  it("cannot move or complete partner work, complete future work, or record a staged session", () => {
    expect(
      monthReducer(INITIAL_MONTH_STATE, { type: "toggle", id: "alex-8" }),
    ).toBe(INITIAL_MONTH_STATE);
    expect(
      monthReducer(INITIAL_MONTH_STATE, {
        type: "move",
        id: "alex-8",
        date: "2026-10-09",
      }),
    ).toBe(INITIAL_MONTH_STATE);
    expect(
      monthReducer(INITIAL_MONTH_STATE, { type: "toggle", id: "film-15" }),
    ).toBe(INITIAL_MONTH_STATE);
    const moved = monthReducer(INITIAL_MONTH_STATE, {
      type: "move",
      id: "film-15",
      date: "2026-10-08",
    });
    expect(monthReducer(moved, { type: "toggle", id: "film-15" })).toBe(moved);
  });
  it("can undo a completion without altering dates or linked-work placement", () => {
    const done = monthReducer(INITIAL_MONTH_STATE, {
      type: "toggle",
      id: "linked-8",
    });
    expect(monthSessions(done).find((s) => s.id === "linked-8")?.done).toBe(
      true,
    );
    expect(monthReducer(done, { type: "toggle", id: "linked-8" })).toEqual(
      INITIAL_MONTH_STATE,
    );
    expect(MONTH_WORK.filter((s) => s.id === "linked-8")).toHaveLength(1);
  });
  it("only applies a missed lifetime session after Review; recovery saves immediately and never creates completion credit", () => {
    const recovered = monthReducer(INITIAL_MONTH_STATE, {
      type: "recover",
      id: "missed-film",
      date: "2026-10-09",
    });
    expect(recovered.saved["missed-film"]).toBe("2026-10-09");
    expect(recovered.completed).toEqual(INITIAL_MONTH_STATE.completed);
    const letGo = monthReducer(INITIAL_MONTH_STATE, {
      type: "let-go",
      id: "missed-film",
    });
    expect(monthSessions(letGo).some((s) => s.id === "missed-film")).toBe(
      false,
    );
    expect(letGo.completed).toEqual(INITIAL_MONTH_STATE.completed);
    const draft = monthReducer(INITIAL_MONTH_STATE, {
      type: "move",
      id: "film-8",
      date: "2026-10-09",
    });
    expect(
      monthReducer(draft, {
        type: "recover",
        id: "missed-film",
        date: "2026-10-09",
      }),
    ).toBe(draft);
  });
});
