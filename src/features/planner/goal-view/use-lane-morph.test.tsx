import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Goal } from "@/lib/goals/types";
import { GoalLanes } from "./goal-lanes";
import { DESKTOP_LANES, PHONE_LANES, type LaneGeometry } from "./goal-lanes-model";
import type { GoalViewSession } from "./goal-view-model";
import { LANE_LAYOUT_MORPH_MS } from "./use-lane-morph";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("motion/react", () => ({ useReducedMotion: () => motion.reduced }));
vi.mock("next/navigation", () => ({ usePathname: () => "/calendar" }));
vi.mock("./goal-view-card", () => ({
  GoalViewCard: () => <div />,
}));

const PITCH = DESKTOP_LANES.pitch;
const TODAY = "2026-10-02";
// The axis opens a year before the week of Sep 28, so Oct 2 is column 369.
const TODAY_COLUMN = 365 + 4;
const GOALS = [
  { id: "run", title: "Run" },
  { id: "gym", title: "Gym" },
] as Goal[];
// A goal that ended last week: only Calendar gives it a lane.
const ENDED = { id: "old", title: "Old" } as Goal;
const session = (goalId: string, date: string) =>
  ({ key: `${goalId}:${date}`, goalId, date, time: "", label: goalId, entry: {} }) as GoalViewSession;
const SESSIONS = [
  session("run", TODAY),
  session("run", "2026-10-09"),
  session("gym", "2026-09-30"),
  session("gym", "2026-10-03"),
  session("old", "2026-09-29"),
];

interface Call {
  element: Element;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}
let calls: Call[];

function lanes(
  layout: "cards" | "calendar",
  calendarGoals = GOALS,
  geometry: LaneGeometry = DESKTOP_LANES
) {
  return (
    <GoalLanes
      cardGoals={GOALS}
      calendarGoals={calendarGoals}
      progressByGoalId={new Map()}
      sessions={SESSIONS}
      calendar={layout === "calendar"}
      calendarSwitch={null}
      geometry={geometry}
      today={TODAY}
      weekStartsOn={1}
      loading={false}
      onVisibleDate={() => {}}
      onInspectDate={() => {}}
      renderTile={(s) => <article data-day={s.date}>{s.label}</article>}
    />
  );
}
const tile = (key: string) => document.querySelector<HTMLElement>(`[data-lane-tile="${key}"]`);
const callsOn = (element: Element | null) => calls.filter((call) => call.element === element);
const moveOf = (key: string) =>
  callsOn(tile(key)).find((call) => "transform" in call.keyframes[0])?.keyframes[0].transform;

describe("useLaneMorph", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    calls = [];
    Element.prototype.animate = function (this: Element, keyframes, options) {
      calls.push({
        element: this,
        keyframes: keyframes as Keyframe[],
        options: options as KeyframeAnimationOptions,
      });
      return { currentTime: 0, cancel: vi.fn(), onfinish: null } as unknown as Animation;
    };
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    motion.reduced = false;
    // @ts-expect-error jsdom has no WAAPI; remove the stub again.
    delete Element.prototype.animate;
  });

  it("slides cards to their dates around the session that holds still", () => {
    const view = render(lanes("cards"));
    view.rerender(lanes("calendar"));

    // Today's run session leads, so it holds still at the left edge.
    expect(moveOf(`run:${TODAY}`)).toBeUndefined();
    // Gym (Oct 3) was beside it in Cards and spreads one day to the right.
    expect(moveOf("gym:2026-10-03")).toBe(`translate(${-PITCH}px, 0px)`);
    // Oct 9 leaves the view: it stays mounted and slides out from its card slot.
    expect(tile("run:2026-10-09")).not.toBeNull();
    expect(moveOf("run:2026-10-09")).toBe(`translate(${-6 * PITCH}px, 0px)`);
    expect(callsOn(tile("gym:2026-10-03"))[0].options.duration).toBe(LANE_LAYOUT_MORPH_MS);
    // Calendar adds the past session in place.
    expect(callsOn(tile("gym:2026-09-30"))[0].keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);

    // The header slides down from the frame's top with the lanes; day rules
    // fade in once the cards are on their way.
    const drop = { transform: `translateY(${-DESKTOP_LANES.header}px)` };
    expect(callsOn(document.querySelector("[data-lane-body]"))[0].keyframes[0]).toEqual(drop);
    expect(callsOn(document.querySelector("[data-lane-header]"))[0].keyframes[0]).toEqual(drop);
    const grid = callsOn(document.querySelector("[data-lane-grid]"))[0];
    expect(grid.keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    expect(grid.options.delay).toBeGreaterThan(0);

    // Off-screen cards unmount once the move has finished.
    act(() => vi.advanceTimersByTime(LANE_LAYOUT_MORPH_MS));
    expect(tile("run:2026-10-09")).toBeNull();
  });

  it("holds the leaving header and day rules still on screen while the lanes rise", () => {
    const view = render(lanes("cards"));
    view.rerender(lanes("calendar"));
    calls = [];
    view.rerender(lanes("cards"));

    const body = callsOn(document.querySelector("[data-lane-body]"))[0];
    expect(body.keyframes[0]).toEqual({ transform: `translateY(${DESKTOP_LANES.header}px)` });
    // Calendar sat at today's column; Cards scrolls back to 0, so the layers
    // hold their horizontal screen position by moving with the scroll change.
    const holdX = -TODAY_COLUMN * PITCH;
    expect(callsOn(document.querySelector("[data-lane-header]"))[0].keyframes).toEqual([
      { transform: `translate(${holdX}px, 0)` },
      { transform: `translate(${holdX}px, ${-DESKTOP_LANES.header}px)` },
    ]);
    expect(callsOn(document.querySelector("[data-lane-grid]"))[0].keyframes).toEqual([
      { opacity: 1, transform: `translateX(${holdX}px)` },
      { opacity: 0, transform: `translateX(${holdX}px)` },
    ]);
    act(() => vi.advanceTimersByTime(LANE_LAYOUT_MORPH_MS));
    expect(document.querySelector("[data-lane-header]")).toBeNull();
    expect(document.querySelector("[data-lane-grid]")).toBeNull();
  });

  it("holds the canvas height and glides it, so closing Calendar doesn't clip the lanes", () => {
    const canvas = () => document.querySelector("[data-plan-scroll-clip]")?.firstElementChild ?? null;
    const measure = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      return { height: this === canvas() ? 240 : 0 } as DOMRect;
    });
    const view = render(lanes("calendar"));
    calls = [];
    view.rerender(lanes("cards"));
    const frame = callsOn(canvas()).find((call) => "height" in call.keyframes[0])!;
    expect(frame.keyframes).toEqual([{ height: `${240 + DESKTOP_LANES.header}px` }, { height: "240px" }]);
    expect(frame.options.duration).toBe(LANE_LAYOUT_MORPH_MS);
    measure.mockRestore();
  });

  it("lets data that arrives mid-switch finish on the switch's clock", () => {
    const view = render(lanes("cards"));
    view.rerender(lanes("calendar"));
    act(() => vi.advanceTimersByTime(200));
    // The planner reloads around the new view: same sessions, new objects.
    view.rerender(
      <GoalLanes
        {...lanes("calendar").props}
        sessions={SESSIONS.map((s) => ({ ...s }))}
      />
    );
    // Leaving cards stay until the switch would have finished.
    act(() => vi.advanceTimersByTime(LANE_LAYOUT_MORPH_MS - 250));
    expect(tile("run:2026-10-09")).not.toBeNull();
    act(() => vi.advanceTimersByTime(100));
    expect(tile("run:2026-10-09")).toBeNull();
  });

  it("opens Calendar-only lanes and glides the lanes below out of the way", () => {
    // Old sits between Run and Gym in the planner's order.
    const withEnded = [GOALS[0], ENDED, GOALS[1]];
    const lane = (goalId: string) => document.querySelector(`[data-lane-goal="${goalId}"]`);
    const view = render(lanes("cards", withEnded));
    expect(lane("old")).toBeNull();
    view.rerender(lanes("calendar", withEnded));

    expect(callsOn(lane("old"))[0].keyframes).toEqual([{ opacity: 0 }, { opacity: 1 }]);
    // Gym moves down by Old's height; Run, above it, stays put.
    const oldHeight = parseFloat((lane("old") as HTMLElement).style.height);
    expect(callsOn(lane("gym"))[0].keyframes[0]).toEqual({ transform: `translateY(${-oldHeight}px)` });
    expect(callsOn(lane("run"))).toHaveLength(0);

    calls = [];
    view.rerender(lanes("cards", withEnded));
    // Old fades where it was while Gym rises into its room.
    const leaving = document.querySelector("[data-lane-leaving]");
    expect(leaving).toHaveAttribute("aria-hidden", "true");
    expect(callsOn(leaving)[0].keyframes).toEqual([{ opacity: 1 }, { opacity: 0 }]);
    expect(callsOn(lane("gym"))[0].keyframes[0]).toEqual({ transform: `translateY(${oldHeight}px)` });
    act(() => vi.advanceTimersByTime(LANE_LAYOUT_MORPH_MS));
    expect(document.querySelector("[data-lane-leaving]")).toBeNull();
  });

  it("starts an interrupted move from the pixels on screen", () => {
    const view = render(lanes("cards"));
    view.rerender(lanes("calendar"));
    const getComputedStyle = window.getComputedStyle.bind(window);
    // Partway back from Calendar, the gym card is 68px short of its slot.
    vi.spyOn(window, "getComputedStyle").mockImplementation((element) =>
      element === tile("gym:2026-10-03")
        ? ({ transform: "matrix(1, 0, 0, 1, -68, 0)" } as CSSStyleDeclaration)
        : getComputedStyle(element)
    );
    vi.stubGlobal(
      "DOMMatrixReadOnly",
      class {
        m41 = -68;
        m42 = 0;
      }
    );
    calls = [];
    view.rerender(lanes("cards"));
    // It was drawn one column right of the leader, less 68px; Cards puts it
    // in the leader's column.
    expect(moveOf("gym:2026-10-03")).toBe(`translate(${PITCH - 68}px, 0px)`);
  });

  it("drops what is still leaving when a resize interrupts the switch", () => {
    const view = render(lanes("cards"));
    view.rerender(lanes("calendar"));
    view.rerender(lanes("cards"));
    expect(document.querySelector("[data-lane-header]")).not.toBeNull();
    view.rerender(lanes("cards", GOALS, PHONE_LANES));
    expect(document.querySelector("[data-lane-header]")).toBeNull();
    expect(document.querySelector("[data-lane-grid]")).toBeNull();
  });

  it("switches instantly with reduced motion", () => {
    motion.reduced = true;
    const view = render(lanes("cards"));
    view.rerender(lanes("calendar"));
    expect(calls).toHaveLength(0);
    expect(tile("run:2026-10-09")).toBeNull();
  });
});
