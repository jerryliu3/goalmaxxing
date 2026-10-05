"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PLAN_MORPH_DURATION_MS } from "@/features/planner/plan-view-morph";
import { planMorphEasing } from "@/features/planner/plan-view-transition";
import {
  laneTops,
  placementOffset,
  visibleKeys,
  type LanePlacement,
  type LanePlan,
} from "./goal-lanes-model";

/** A layout change runs at the plan view morph's pace; a moved session settles faster. */
export const LANE_LAYOUT_MORPH_MS = PLAN_MORPH_DURATION_MS;
export const LANE_MOVE_MORPH_MS = 320;

interface Point {
  x: number;
  y: number;
}

/**
 * One plan-to-plan move. Positions are in track coordinates (the visible date
 * track's left edge is 0), so a scroll change between plans is part of the move.
 */
interface Flight {
  from: LanePlan;
  to: LanePlan;
  fromScroll: number;
  toScroll: number;
  /** Where on-screen cards actually were, including any interrupted move. */
  seen: Map<string, Point>;
  start: number;
  duration: number;
  /** Cards already given their part of this flight. */
  launched: Set<string>;
  /** Calendar's header and day rules fade out on screen rather than scrolling away. */
  calendarOut: boolean;
}

export interface LaneMorphRetained {
  /** Cards leaving the viewport, kept mounted so they can travel off screen. */
  keys: ReadonlySet<string>;
  /** The calendar plan whose header and day rules are fading out. */
  calendar: LanePlan | null;
  /** Horizontal scroll that calendar was laid out for. */
  scrollLeft: number;
  /** Vertical scroll its sticky header sat at. */
  scrollTop: number;
}

const NOTHING_RETAINED: LaneMorphRetained = {
  keys: new Set(),
  calendar: null,
  scrollLeft: 0,
  scrollTop: 0,
};

const CALENDAR_LAYERS = "[data-lane-header], [data-lane-grid], [data-lane-leaving]";

function trackPoint(plan: LanePlan, placement: LanePlacement, scrollLeft: number): Point {
  const offset = placementOffset(plan, placement);
  return { x: offset.x - scrollLeft, y: offset.y };
}

/** The translation an interrupted move had reached. */
function currentShift(element: HTMLElement): Point {
  const transform = window.getComputedStyle(element).transform;
  if (!transform || transform === "none" || typeof DOMMatrixReadOnly !== "function") {
    return { x: 0, y: 0 };
  }
  const matrix = new DOMMatrixReadOnly(transform);
  return { x: matrix.m41, y: matrix.m42 };
}

const headerHeight = (plan: LanePlan) => (plan.layout === "calendar" ? plan.geometry.header : 0);

const FADE_IN: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
const FADE_OUT: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];
const slideY = (dy: number): Keyframe[] => [
  { transform: `translateY(${dy}px)` },
  { transform: "translateY(0)" },
];
/** The full move, eased like the plan view morph. */
const glide = (duration: number): KeyframeAnimationOptions => ({
  duration,
  easing: planMorphEasing(),
});
/** Something new appears once the moving cards are mostly on their way. */
const appear = (duration: number): KeyframeAnimationOptions => ({
  duration: duration * 0.55,
  delay: duration * 0.35,
  easing: "ease-out",
  fill: "backwards",
});

/**
 * FLIP for goal lanes. Both endpoints come from pure lane plans, so cards that
 * were virtualized out of view still start from where they would have been and
 * slide in from the edge, and cards mounted mid-flight join on the shared clock.
 * Only `transform` and `opacity` animate, on the compositor; a move that
 * interrupts another starts from the pixels on screen.
 */
export function useLaneMorph(enabled: boolean) {
  const canvas = useRef<HTMLDivElement>(null);
  const flight = useRef<Flight | null>(null);
  const running = useRef(new Map<string, Animation>());
  const layers = useRef<Animation[]>([]);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseAt = useRef(0);
  const [retained, setRetained] = useState<LaneMorphRetained>(NOTHING_RETAINED);

  const cancelAll = useCallback(() => {
    running.current.forEach((animation) => animation.cancel());
    running.current.clear();
    layers.current.forEach((animation) => animation.cancel());
    layers.current = [];
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
  }, []);

  const launch = useCallback((element: HTMLElement, key: string) => {
    const current = flight.current;
    if (!current || current.launched.has(key)) return;
    current.launched.add(key);
    const target = current.to.byKey.get(key);
    const source = current.from.byKey.get(key);
    if (!target) return;
    const elapsed = performance.now() - current.start;
    if (!source) {
      // New to this layout (Calendar's past sessions, a session added): fade in place.
      element.animate(FADE_IN, appear(current.duration)).currentTime = elapsed;
      return;
    }
    // Lanes moving vertically are animated as whole sections; a card only
    // moves within its lane.
    const begin = current.seen.get(key) ?? trackPoint(current.from, source, current.fromScroll);
    const end = trackPoint(current.to, target, current.toScroll);
    const dx = begin.x - end.x;
    const dy = begin.y - end.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    const move = element.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
      glide(current.duration)
    );
    move.currentTime = elapsed;
    running.current.set(key, move);
    move.onfinish = () => {
      if (running.current.get(key) === move) running.current.delete(key);
    };
  }, []);

  const animateLayer = useCallback(
    (element: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions, elapsed = 0) => {
      const animation = element.animate(keyframes, options);
      animation.currentTime = elapsed;
      layers.current.push(animation);
    },
    []
  );

  const exitCalendarLayers = useCallback(
    (root: HTMLElement, current: Flight) => {
      current.calendarOut = false;
      // The retained layers keep calendar coordinates; hold them still on
      // screen while the scroll position changes underneath them.
      const holdX = current.toScroll - current.fromScroll;
      const elapsed = performance.now() - current.start;
      const header = root.querySelector("[data-lane-header]");
      const grid = root.querySelector("[data-lane-grid]");
      // The header slides back up out of the frame as the lanes rise into its room.
      if (header) {
        animateLayer(
          header,
          [
            { transform: `translate(${holdX}px, 0)` },
            { transform: `translate(${holdX}px, ${-current.from.geometry.header}px)` },
          ],
          { ...glide(current.duration), fill: "forwards" },
          elapsed
        );
      }
      const hold = `translateX(${holdX}px)`;
      const quickFade = { duration: current.duration * 0.4, easing: "ease-out", fill: "forwards" } as const;
      if (grid) {
        animateLayer(grid, [{ opacity: 1, transform: hold }, { opacity: 0, transform: hold }], quickFade, elapsed);
      }
      // Lanes that only Calendar shows fade where they were while the lanes
      // below rise; their cards hold still on screen.
      root.querySelectorAll("[data-lane-leaving]").forEach((lane) => {
        animateLayer(lane, FADE_OUT, quickFade, elapsed);
        const track = lane.querySelector("[data-lane-hold]");
        if (track) animateLayer(track, [{ transform: hold }, { transform: hold }], quickFade, elapsed);
      });
    },
    [animateLayer]
  );

  const start = useCallback(
    ({
      from,
      to,
      fromScroll,
      toScroll,
      trackWidth,
      scrollTop,
      instant = false,
    }: {
      from: LanePlan;
      to: LanePlan;
      fromScroll: number;
      toScroll: number;
      trackWidth: number;
      scrollTop: number;
      /** A jump far along the axis or a resize: place everything without motion. */
      instant?: boolean;
    }) => {
      const root = canvas.current;
      if (!enabled || instant || !root || typeof root.animate !== "function") {
        // Settle at once: nothing in flight, nothing held back to leave.
        cancelAll();
        flight.current = null;
        setRetained(NOTHING_RETAINED);
        return;
      }
      const relayout = from.layout !== to.layout || from.reference !== to.reference;
      const tiles = Array.from(root.querySelectorAll<HTMLElement>("[data-lane-tile]"));
      // Read every on-screen position before cancelling anything.
      const seen = new Map<string, Point>();
      for (const element of tiles) {
        const key = element.dataset.laneTile!;
        const source = from.byKey.get(key);
        if (!source) continue;
        const at = trackPoint(from, source, fromScroll);
        const shift = currentShift(element);
        seen.set(key, { x: at.x + shift.x, y: at.y + shift.y });
      }
      const body = root.querySelector<HTMLElement>("[data-lane-body]");
      const bodyShift = body ? currentShift(body).y : 0;
      const sections = Array.from(
        root.querySelectorAll<HTMLElement>("[data-lane-body] > [data-lane-goal]")
      ).map((section) => ({ section, shift: currentShift(section).y }));
      running.current.forEach((animation) => animation.cancel());
      running.current.clear();

      const layoutChanged = from.layout !== to.layout;
      const now = performance.now();
      // Data arriving mid-switch (the planner loading around the new view)
      // finishes on the switch's clock rather than cutting it short.
      const prior = flight.current;
      const remaining = prior ? prior.start + prior.duration - now : 0;
      flight.current = {
        from,
        to,
        fromScroll,
        toScroll,
        seen,
        start: now,
        duration: relayout
          ? LANE_LAYOUT_MORPH_MS
          : Math.max(LANE_MOVE_MORPH_MS, remaining),
        launched: new Set(),
        calendarOut: layoutChanged && from.layout === "calendar",
      };
      const current = flight.current;
      tiles.forEach((element) => launch(element, element.dataset.laneTile!));

      // Lanes glide to their new places when others open or close above them;
      // a lane new to this layout fades in once there is room for it.
      const fromTops = laneTops(from);
      const toTops = laneTops(to);
      for (const { section, shift } of sections) {
        const goalId = section.dataset.laneGoal!;
        const fromTop = fromTops.get(goalId);
        const toTop = toTops.get(goalId);
        if (toTop === undefined) continue;
        const key = `lane:${goalId}`;
        if (fromTop === undefined) {
          running.current.set(key, section.animate(FADE_IN, appear(current.duration)));
          continue;
        }
        const dy = fromTop - toTop + shift;
        if (Math.abs(dy) < 0.5) continue;
        running.current.set(key, section.animate(slideY(dy), glide(current.duration)));
      }

      if (layoutChanged) {
        layers.current.forEach((animation) => animation.cancel());
        layers.current = [];
        // The lanes slide down to make room for Calendar's header, or rise
        // into the room it leaves.
        const dy = headerHeight(from) - headerHeight(to) + bodyShift;
        if (body && dy) animateLayer(body, slideY(dy), glide(current.duration));
        if (to.layout === "calendar") {
          // The header slides down from the frame's top edge in step with
          // the lanes, like a drawer; day rules arrive once the sessions are
          // mostly on their way.
          const header = root.querySelector("[data-lane-header]");
          const grid = root.querySelector("[data-lane-grid]");
          if (header && dy) animateLayer(header, slideY(dy), glide(current.duration));
          if (grid) animateLayer(grid, FADE_IN, appear(current.duration));
        }
      }

      const before = visibleKeys(from, fromScroll, trackWidth);
      const after = visibleKeys(to, toScroll, trackWidth);
      const leaving = new Set([...before].filter((key) => !after.has(key) && to.byKey.has(key)));
      setRetained((previous) =>
        layoutChanged
          ? {
              keys: leaving,
              calendar: current.calendarOut ? from : null,
              scrollLeft: fromScroll,
              scrollTop,
            }
          : { ...previous, keys: relayout ? leaving : new Set([...previous.keys, ...leaving]) }
      );
      // Release what is leaving once every move under way has finished.
      releaseAt.current = relayout
        ? now + current.duration
        : Math.max(releaseAt.current, now + current.duration);
      if (releaseTimer.current) clearTimeout(releaseTimer.current);
      releaseTimer.current = setTimeout(
        () => setRetained(NOTHING_RETAINED),
        releaseAt.current - now
      );
    },
    [enabled, cancelAll, launch, animateLayer]
  );

  // Cards that mount while a flight is under way (scrolled into view, or
  // retained to leave) join it on the same clock, as do Calendar's retained
  // header and day rules.
  useLayoutEffect(() => {
    const current = flight.current;
    const root = canvas.current;
    if (!current || !root || performance.now() - current.start >= current.duration) return;
    root.querySelectorAll<HTMLElement>("[data-lane-tile]").forEach((element) =>
      launch(element, element.dataset.laneTile!)
    );
    if (current.calendarOut && root.querySelector(CALENDAR_LAYERS)) exitCalendarLayers(root, current);
  });

  useEffect(() => cancelAll, [cancelAll]);

  return { canvas, start, retained };
}
