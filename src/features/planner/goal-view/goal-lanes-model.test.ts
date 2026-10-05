import { describe, expect, it } from "vitest";
import {
  buildLanePlan,
  DESKTOP_LANES,
  leadingAnchor,
  placementOffset,
  placementsInColumns,
  scrollForAnchor,
  visibleColumns,
  visibleKeys,
  type GoalLaneLayout,
} from "./goal-lanes-model";
import type { GoalViewSession } from "./goal-view-model";

const session = (goalId: string, date: string, time = ""): GoalViewSession =>
  ({ key: `${goalId}:${date}:${time}`, goalId, date, time }) as GoalViewSession;
const GOALS = [{ id: "run" }, { id: "gym" }];

const PITCH = DESKTOP_LANES.pitch;
const TODAY = "2026-10-02";
// Monday Sep 28 starts the axis; it runs to the end of the year.
const START = "2026-09-28";
const DAYS = 95;
const SESSIONS = [
  session("run", "2026-10-02"),
  session("run", "2026-10-03"),
  session("run", "2026-10-04"),
  session("gym", "2026-09-30"),
  session("gym", "2026-10-06"),
  session("gym", "2026-10-13"),
];

const plan = (
  layout: GoalLaneLayout,
  { reference = TODAY, cardsFrom = TODAY, sessions = SESSIONS } = {}
) =>
  buildLanePlan({
    goals: GOALS,
    sessions,
    layout,
    geometry: DESKTOP_LANES,
    reference,
    cardsFrom,
    start: START,
    days: DAYS,
  });
const columnOf = (lanes: ReturnType<typeof plan>, key: string) => lanes.byKey.get(key)?.column;

describe("buildLanePlan", () => {
  it("packs each lane's upcoming sessions from the reference date", () => {
    const cards = plan("cards");
    expect(cards.origin).toBe(0);
    expect(columnOf(cards, "gym:2026-09-30:")).toBeUndefined();
    expect(columnOf(cards, "gym:2026-10-06:")).toBe(0);
    expect(columnOf(cards, "run:2026-10-04:")).toBe(2);
    expect(cards.columns).toBe(3);
  });

  it("puts earlier sessions to the left of a later reference", () => {
    const cards = plan("cards", { reference: "2026-10-04" });
    // Run has two sessions before Oct 4, so the shared origin is column 2.
    expect(cards.origin).toBe(2);
    expect(columnOf(cards, "run:2026-10-02:")).toBe(0);
    expect(columnOf(cards, "run:2026-10-04:")).toBe(2);
    expect(columnOf(cards, "gym:2026-10-06:")).toBe(2);
  });

  it("includes past sessions when Cards is asked to", () => {
    const cards = plan("cards", { cardsFrom: "2026-09-01" });
    expect(cards.origin).toBe(1);
    expect(columnOf(cards, "gym:2026-09-30:")).toBe(0);
  });

  it("puts every loaded session on its date column in Calendar", () => {
    const calendar = plan("calendar");
    expect(columnOf(calendar, "gym:2026-09-30:")).toBe(2);
    expect(columnOf(calendar, "run:2026-10-04:")).toBe(6);
    expect(columnOf(calendar, "gym:2026-10-13:")).toBe(15);
    expect(calendar.columns).toBe(DAYS);
    expect(calendar.origin).toBe(4);
  });

  it("stacks two sessions of one goal on a date and sizes the lane for it in both layouts", () => {
    const doubled = [session("run", "2026-10-05", "18:00"), session("run", "2026-10-05", "07:00")];
    const calendar = plan("calendar", { sessions: doubled });
    expect(calendar.byKey.get("run:2026-10-05:07:00")?.stack).toBe(0);
    const evening = calendar.byKey.get("run:2026-10-05:18:00")!;
    expect(evening.stack).toBe(1);
    const { tileHeight, stackGap, padding } = DESKTOP_LANES;
    // Centred in its column: half the gap on each side.
    expect(placementOffset(calendar, evening)).toEqual({
      x: 7 * PITCH + DESKTOP_LANES.gap / 2,
      y: tileHeight + stackGap,
    });
    const cards = plan("cards", { sessions: doubled });
    expect(cards.byKey.get("run:2026-10-05:18:00")?.stack).toBe(0);
    expect(cards.lanes[0].height).toBe(calendar.lanes[0].height);
    expect(calendar.lanes[0].height).toBe(2 * tileHeight + stackGap + 2 * padding);
    expect(calendar.lanes[1].height).toBe(tileHeight + 2 * padding);
  });

  it("builds only the lanes it is given", () => {
    const cards = buildLanePlan({
      goals: [GOALS[0]],
      sessions: SESSIONS,
      layout: "cards",
      geometry: DESKTOP_LANES,
      reference: TODAY,
      cardsFrom: TODAY,
      start: START,
      days: DAYS,
    });
    expect(cards.lanes.map((lane) => lane.goalId)).toEqual(["run"]);
    expect(cards.byKey.has("gym:2026-10-06:")).toBe(false);
  });
});

describe("visible columns", () => {
  it("covers the track with overscan and stays inside the plan", () => {
    const calendar = plan("calendar");
    expect(visibleColumns(calendar, PITCH * 10 + 20, PITCH * 5)).toEqual({
      leading: 10,
      first: 8,
      last: 18,
    });
    expect(visibleColumns(calendar, 0, PITCH * 500).last).toBe(DAYS - 1);
    const gym = calendar.lanes[1].placements;
    expect(placementsInColumns(gym, 3, 15).map((p) => p.session.date)).toEqual([
      "2026-10-06",
      "2026-10-13",
    ]);
    expect(
      placementsInColumns(gym, 0, 3, new Set(["gym:2026-10-13:"])).map((p) => p.session.date)
    ).toEqual(["2026-09-30", "2026-10-13"]);
    expect([...visibleKeys(calendar, 4 * PITCH, 2 * PITCH)].sort()).toEqual([
      "gym:2026-09-30:",
      "gym:2026-10-06:",
      "run:2026-10-02:",
      "run:2026-10-03:",
      "run:2026-10-04:",
    ]);
  });
});

describe("anchoring a layout change", () => {
  it("holds the earliest session at the left edge from Cards to Calendar", () => {
    const anchor = leadingAnchor(plan("cards"), 0, PITCH * 6);
    // Column 0 holds run Oct 2 and gym Oct 6; the earlier date leads.
    expect(anchor).toEqual({ key: "run:2026-10-02:", date: "2026-10-02", offset: 0 });
    expect(scrollForAnchor(plan("calendar"), anchor)).toBe(4 * PITCH);
  });

  it("restarts Cards from the calendar's leading session at the same spot", () => {
    // Scrolled so Oct 6 (column 8) sits 40px into the track.
    const anchor = leadingAnchor(plan("calendar"), 8 * PITCH - 40, PITCH * 6);
    expect(anchor).toMatchObject({ key: "gym:2026-10-06:", offset: 40 });
    const cards = plan("cards", { reference: anchor.date });
    // Every lane now starts from Oct 6: run has none left, gym starts there.
    expect(columnOf(cards, "gym:2026-10-06:")).toBe(cards.origin);
    expect(scrollForAnchor(cards, anchor)).toBe(cards.origin * PITCH - 40);
  });

  it("falls back to the date at the left edge when no session is in view", () => {
    const anchor = leadingAnchor(plan("calendar"), 40 * PITCH, PITCH * 3);
    expect(anchor).toEqual({ key: null, date: "2026-11-07", offset: 0 });
    const cards = plan("cards", { reference: anchor.date });
    expect(scrollForAnchor(cards, anchor)).toBe(cards.origin * PITCH);
  });

  it("round-trips Cards to Calendar and back without moving the leader", () => {
    const anchor = leadingAnchor(plan("cards"), 0, PITCH * 6);
    const calendarScroll = scrollForAnchor(plan("calendar"), anchor);
    const back = leadingAnchor(plan("calendar"), calendarScroll, PITCH * 6);
    expect(back.key).toBe(anchor.key);
    expect(scrollForAnchor(plan("cards", { reference: back.date }), back)).toBe(0);
  });
});
