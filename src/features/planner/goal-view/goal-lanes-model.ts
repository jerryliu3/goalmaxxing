import { addDaysToDateString, differenceInDateStrings } from "@/lib/goals/periods";
import { byDateTime, type GoalViewSession } from "./goal-view-model";

/**
 * Goal lanes keep one row per goal in both layouts and change only where a
 * session sits along it. `cards` packs a goal's upcoming sessions back to back
 * (the calendar with its empty days removed); `calendar` gives every date its
 * own column and stacks a goal's sessions that share one. Session cards and
 * lane heights keep their size, so switching only slides cards along lanes.
 */
export type GoalLaneLayout = "cards" | "calendar";

/** Sizes shared by both layouts; phone narrows the columns and the label. */
export interface LaneGeometry {
  /** Width of one column: a session card plus the gap after it. */
  pitch: number;
  gap: number;
  /** Pinned goal label column. */
  label: number;
  tileHeight: number;
  /** Gap between sessions of one goal stacked on one date. */
  stackGap: number;
  /** Lane padding above the first session and below the last. */
  padding: number;
  /** Calendar's sticky date header; Cards has none. */
  header: number;
  /** The label has room for the goal card thumbnail. */
  labelCard: boolean;
}

const SHARED = { gap: 12, tileHeight: 76, stackGap: 6, padding: 9, header: 52 };
export const DESKTOP_LANES: LaneGeometry = { ...SHARED, pitch: 144, label: 184, labelCard: true };
export const PHONE_LANES: LaneGeometry = { ...SHARED, pitch: 120, label: 116, labelCard: false };

export interface LanePlacement {
  session: GoalViewSession;
  lane: number;
  column: number;
  /** Position among same-goal sessions sharing a date. */
  stack: number;
}

export interface LanePlan {
  layout: GoalLaneLayout;
  geometry: LaneGeometry;
  /** Cards: the date each lane starts from. */
  reference: string;
  /** Calendar date of column 0. */
  start: string;
  /** Column holding `reference`: each lane's first session from it, or its date. */
  origin: number;
  columns: number;
  lanes: Array<{ goalId: string; height: number; placements: LanePlacement[] }>;
  byKey: Map<string, LanePlacement>;
}

/** Where a layout change should keep the viewer's place. */
export interface LaneAnchor {
  /** A session to hold still, when one is in view. */
  key: string | null;
  date: string;
  /** Its distance from the left edge of the visible track, in pixels. */
  offset: number;
}

export function buildLanePlan({
  goals,
  sessions,
  layout,
  geometry,
  reference,
  cardsFrom,
  start,
  days,
}: {
  /** The layout's lanes, in order. */
  goals: ReadonlyArray<{ id: string }>;
  /** Every loaded session; Calendar places them all. */
  sessions: readonly GoalViewSession[];
  layout: GoalLaneLayout;
  geometry: LaneGeometry;
  reference: string;
  /** Cards leaves out sessions before this date (today: Cards is what's next). */
  cardsFrom: string;
  /** Calendar axis; `start` must not follow the earliest session. */
  start: string;
  days: number;
}): LanePlan {
  const sorted = goals.map((goal) =>
    sessions.filter((session) => session.goalId === goal.id).sort(byDateTime)
  );
  const shown = sorted.map((lane) =>
    layout === "cards" ? lane.filter((session) => session.date >= cardsFrom) : lane
  );
  const before = shown.map(
    (lane) => lane.filter((session) => session.date < reference).length
  );
  const origin =
    layout === "cards"
      ? Math.max(0, ...before)
      : Math.max(0, differenceInDateStrings(reference, start));
  const lanes = shown.map((laneSessions, lane) => {
    const stacks = new Map<string, number>();
    const placements = laneSessions.map((session, index): LanePlacement => {
      const stack = stacks.get(session.date) ?? 0;
      stacks.set(session.date, stack + 1);
      return layout === "cards"
        ? { session, lane, column: origin + index - before[lane], stack: 0 }
        : { session, lane, column: differenceInDateStrings(session.date, start), stack };
    });
    // Sized from every loaded session of the goal, never the layout, so a
    // lane is the same height either way and switching never resizes it.
    // It fits the busiest loaded date.
    const { tileHeight } = geometry;
    const perDate = new Map<string, number>();
    for (const session of sorted[lane]) perDate.set(session.date, (perDate.get(session.date) ?? 0) + 1);
    const deepest = Math.max(1, ...perDate.values());
    const height =
      deepest * tileHeight + (deepest - 1) * geometry.stackGap + geometry.padding * 2;
    return { goalId: goals[lane].id, height, placements };
  });
  const lastColumn = Math.max(
    origin,
    layout === "calendar" ? days - 1 : 0,
    ...lanes.flatMap((lane) => lane.placements.map((placement) => placement.column))
  );
  return {
    layout,
    geometry,
    reference,
    start,
    origin,
    columns: lastColumn + 1,
    lanes,
    byKey: new Map(
      lanes.flatMap((lane) =>
        lane.placements.map((placement) => [placement.session.key, placement] as const)
      )
    ),
  };
}

/** A session card's position inside its lane's date track, centred in its column. */
export function placementOffset(plan: LanePlan, placement: LanePlacement) {
  const { pitch, gap, tileHeight, stackGap } = plan.geometry;
  return {
    x: placement.column * pitch + gap / 2,
    y: placement.stack * (tileHeight + stackGap),
  };
}

/** Columns intersecting the visible track, widened by `overscan` on each side. */
export function visibleColumns(
  plan: LanePlan,
  scrollLeft: number,
  trackWidth: number,
  overscan = 2
) {
  const { pitch } = plan.geometry;
  return {
    /** The column at the track's left edge. */
    leading: Math.max(0, Math.min(plan.columns - 1, Math.floor(scrollLeft / pitch))),
    first: Math.max(0, Math.floor(scrollLeft / pitch) - overscan),
    last: Math.min(plan.columns - 1, Math.ceil((scrollLeft + trackWidth) / pitch) + overscan),
  };
}

/** Placements in `[first, last]`, plus any `extra` keys still on their way out. */
export function placementsInColumns(
  placements: readonly LanePlacement[],
  first: number,
  last: number,
  extra?: ReadonlySet<string>
) {
  return placements.filter(
    (placement) =>
      (placement.column >= first && placement.column <= last) ||
      Boolean(extra?.has(placement.session.key))
  );
}

/** Keys of the sessions a viewer at `scrollLeft` can see, with overscan. */
export function visibleKeys(plan: LanePlan, scrollLeft: number, trackWidth: number) {
  const { first, last } = visibleColumns(plan, scrollLeft, trackWidth);
  const keys = new Set<string>();
  for (const placement of plan.byKey.values()) {
    if (placement.column >= first && placement.column <= last) keys.add(placement.session.key);
  }
  return keys;
}

export function dateAtColumn(plan: LanePlan, column: number) {
  return addDaysToDateString(plan.start, column);
}

export function columnOfDate(plan: LanePlan, date: string) {
  return differenceInDateStrings(date, plan.start);
}

/**
 * The leftmost session in view, earliest first, which a layout change keeps
 * where it is. With no session in view, the date at the left edge stands in.
 */
export function leadingAnchor(
  plan: LanePlan,
  scrollLeft: number,
  trackWidth: number
): LaneAnchor {
  const { pitch } = plan.geometry;
  let best: LanePlacement | null = null;
  for (const placement of plan.byKey.values()) {
    const center = placement.column * pitch + pitch / 2;
    if (center < scrollLeft || center > scrollLeft + trackWidth) continue;
    if (
      !best ||
      placement.column < best.column ||
      (placement.column === best.column &&
        byDateTime(placement.session, best.session) < 0)
    ) {
      best = placement;
    }
  }
  if (best) {
    return {
      key: best.session.key,
      date: best.session.date,
      offset: best.column * pitch - scrollLeft,
    };
  }
  const column =
    plan.layout === "calendar" ? Math.max(0, Math.round(scrollLeft / pitch)) : plan.origin;
  return {
    key: null,
    date: plan.layout === "calendar" ? dateAtColumn(plan, column) : plan.reference,
    offset: column * pitch - scrollLeft,
  };
}

/** The scroll position that puts `anchor` back at its offset in `plan`. */
export function scrollForAnchor(plan: LanePlan, anchor: LaneAnchor) {
  const placed = anchor.key ? plan.byKey.get(anchor.key) : undefined;
  const column = placed
    ? placed.column
    : plan.layout === "calendar"
      ? Math.min(plan.columns - 1, Math.max(0, columnOfDate(plan, anchor.date)))
      : plan.origin;
  return column * plan.geometry.pitch - anchor.offset;
}
