"use client";

import {
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "motion/react";
import type { ProgressContextSummary } from "@cadence/shared/goals/progress-context";
import { startOfWeekDateString } from "@/lib/goals/periods";
import type { Goal } from "@/lib/goals/types";
import { cn } from "@/lib/utils";
import { GoalLaneGridlines, GoalLaneHeader } from "./goal-lane-grid";
import { GoalLaneLabel, LANE_CHROME } from "./goal-lane-label";
import { GoalLanesToolbar } from "./goal-lanes-toolbar";
import {
  buildLanePlan,
  columnOfDate,
  dateAtColumn,
  leadingAnchor,
  placementOffset,
  placementsInColumns,
  scrollForAnchor,
  visibleColumns,
  visibleKeys,
  type GoalLaneLayout,
  type LaneAnchor,
  type LaneGeometry,
  type LanePlacement,
  type LanePlan,
} from "./goal-lanes-model";
import type { GoalViewSession } from "./goal-view-model";
import { extendTimelineSpan, initialTimelineSpan, isInsideTimelineSpan } from "./timeline-axis";
import { useLaneViewport } from "./use-lane-viewport";

interface LaneView {
  layout: GoalLaneLayout;
  reference: string;
}

/**
 * Goal View's lanes: one row per goal, its label pinned at the left, the same
 * session cards whether or not Calendar is on. Off, each goal's next sessions
 * sit back to back; on, they spread over a continuous date axis under a sticky
 * header. Switching keeps the leading session where it is.
 */
export function GoalLanes({
  cardGoals,
  calendarGoals,
  progressByGoalId,
  sessions,
  calendar: calendarOn,
  calendarSwitch,
  geometry,
  today,
  weekStartsOn,
  loading,
  onVisibleDate,
  onInspectDate,
  renderTile,
}: {
  /** Lanes without Calendar: goals with sessions still to come. */
  cardGoals: Goal[];
  /** Lanes with Calendar: also goals whose loaded sessions are all past. */
  calendarGoals: Goal[];
  progressByGoalId: ReadonlyMap<string, ProgressContextSummary>;
  /** Every loaded session; without Calendar, those from today on show. */
  sessions: GoalViewSession[];
  calendar: boolean;
  calendarSwitch: ReactNode;
  geometry: LaneGeometry;
  today: string;
  weekStartsOn: number;
  loading: boolean;
  /** Reports the date in view, so the planner can load around it. */
  onVisibleDate: (date: string) => void;
  onInspectDate: (date: string) => void;
  renderTile: (session: GoalViewSession) => ReactNode;
}) {
  const layout: GoalLaneLayout = calendarOn ? "calendar" : "cards";
  const reduceMotion = useReducedMotion();
  const { scroller, viewport, exact, scrollTo } = useLaneViewport(geometry);
  const weekStart = startOfWeekDateString(today, weekStartsOn);
  const [span, setSpan] = useState(() => initialTimelineSpan(weekStart));
  const [focusedGoalId, setFocusedGoalId] = useState<string | null>(null);
  const [view, setView] = useState<LaneView>({ layout, reference: today });
  // Set by whatever changes the layout or its start, and consumed by the next
  // placement; without one, the leading session holds its place.
  const pendingAnchor = useRef<LaneAnchor | null>(null);
  const placed = useRef<{ plan: LanePlan; key: string } | null>(null);

  // The layout is the parent's; adopt a change here so the anchor is read
  // from the lanes as they were drawn.
  if (layout !== view.layout) {
    const current = placed.current?.plan;
    const anchor = current
      ? leadingAnchor(current, exact.current.scrollLeft, exact.current.trackWidth)
      : null;
    pendingAnchor.current = anchor;
    setView({
      layout,
      // Cards restart every lane from the date that led the calendar.
      reference:
        layout === "cards" && anchor ? (anchor.date > today ? anchor.date : today) : view.reference,
    });
  }

  const laneGoals = view.layout === "calendar" ? calendarGoals : cardGoals;
  const goalsById = useMemo(
    () => new Map(calendarGoals.concat(cardGoals).map((goal) => [goal.id, goal])),
    [calendarGoals, cardGoals]
  );
  const plan = useMemo(
    () =>
      buildLanePlan({
        goals: laneGoals,
        sessions,
        layout: view.layout,
        geometry,
        reference: view.reference,
        cardsFrom: today,
        start: span.start,
        days: span.days,
      }),
    [laneGoals, sessions, view.layout, view.reference, geometry, today, span]
  );

  // Keep the viewer's place when the layout, its start, the axis or the
  // column width changes. Data changes (a moved or completed session) keep
  // scroll.
  const placeKey = `${view.layout}|${view.reference}|${span.start}|${geometry.pitch}`;
  useLayoutEffect(() => {
    const previous = placed.current;
    if (previous?.plan === plan) return;
    placed.current = { plan, key: placeKey };
    if (!previous) {
      scrollTo(
        (plan.layout === "calendar" ? columnOfDate(plan, weekStart) : plan.origin) *
          geometry.pitch
      );
    } else if (previous.key !== placeKey) {
      const { scrollLeft, trackWidth } = exact.current;
      const anchor = pendingAnchor.current ?? leadingAnchor(previous.plan, scrollLeft, trackWidth);
      scrollTo(scrollForAnchor(plan, anchor));
    }
    pendingAnchor.current = null;
  }, [plan, placeKey, exact, scroller, scrollTo, weekStart, geometry.pitch]);

  const columns = visibleColumns(plan, viewport.scrollLeft, viewport.trackWidth);
  const calendar = view.layout === "calendar";
  const leadingDate = calendar ? dateAtColumn(plan, columns.leading) : view.reference;

  // Grow the calendar axis as scrolling nears either end. Read the live
  // position: the render that switched layouts still had the old one.
  useEffect(() => {
    if (!calendar || placed.current?.plan !== plan) return;
    const { first, last } = visibleColumns(plan, exact.current.scrollLeft, exact.current.trackWidth);
    const extended = extendTimelineSpan(span, first, last);
    if (extended !== span) setSpan(extended);
  }, [calendar, plan, span, exact, columns.first, columns.last]);

  // Report the date in view once placement has settled; the render that
  // switched layouts still had the old scroll position.
  const reportVisible = useEffectEvent((date: string) => onVisibleDate(date));
  const reported = useRef<string | null>(null);
  useEffect(() => {
    if (placed.current?.plan !== plan) return;
    const date = calendar
      ? dateAtColumn(plan, visibleColumns(plan, exact.current.scrollLeft, exact.current.trackWidth).leading)
      : view.reference;
    if (date === reported.current) return;
    reported.current = date;
    reportVisible(date);
  }, [calendar, plan, exact, view.reference, leadingDate]);

  const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";
  const rebaseCards = (date: string) => {
    pendingAnchor.current = { key: null, date, offset: 0 };
    setView({ layout: "cards", reference: date });
  };
  const scrollToDate = (date: string) => {
    const index = columnOfDate(plan, date);
    if (isInsideTimelineSpan(span, index)) {
      scroller.current?.scrollTo({ left: index * geometry.pitch, behavior });
    } else {
      pendingAnchor.current = { key: null, date, offset: 0 };
      setSpan(initialTimelineSpan(date));
    }
  };
  // Page to the first date that isn't fully in view, so a step never skips
  // one: forward, the date cut off at the right edge leads; back, the date cut
  // off at the left edge ends the view.
  const step = (direction: -1 | 1) => {
    const { pitch } = geometry;
    const { scrollLeft, trackWidth } = exact.current;
    // The right edge of the column cut off (or just hidden) at the left.
    const cutLeftEnd = Math.ceil(scrollLeft / pitch) * pitch;
    let left =
      direction > 0
        ? Math.floor((scrollLeft + trackWidth) / pitch) * pitch
        : Math.ceil((cutLeftEnd - trackWidth) / pitch) * pitch;
    if (direction > 0 ? left <= scrollLeft : left >= scrollLeft) {
      left = (Math.round(scrollLeft / pitch) + direction) * pitch;
    }
    left = Math.max(0, left);
    const column = Math.round(left / pitch);
    if (calendar && !isInsideTimelineSpan(span, column)) {
      scrollToDate(dateAtColumn(plan, column));
    } else {
      scroller.current?.scrollTo({ left, behavior });
    }
  };
  const goToday = () => {
    if (calendar) scrollToDate(weekStart);
    else if (view.reference !== today) rebaseCards(today);
    else scroller.current?.scrollTo({ left: plan.origin * geometry.pitch, behavior });
  };
  const jump = (date: string) => (calendar ? scrollToDate(date) : rebaseCards(date));

  // The commit that changes the plan still has the old scroll position, so
  // cards on screen may fall outside these columns until placement scrolls.
  // Keep them mounted (with their focus) meanwhile.
  const outgoing = placed.current?.plan;
  const carried =
    outgoing && outgoing !== plan
      ? visibleKeys(outgoing, viewport.scrollLeft, viewport.trackWidth)
      : undefined;
  const bodyHeight = plan.lanes.reduce((total, lane) => total + lane.height, 0);

  return (
    <div className="space-y-3" data-testid="goal-lanes">
      <GoalLanesToolbar
        calendarSwitch={calendarSwitch}
        leadingDate={leadingDate}
        onStep={step}
        onToday={goToday}
        onJump={jump}
      />
      <div
        ref={scroller}
        role="region"
        tabIndex={0}
        aria-busy={loading}
        data-plan-scroll-clip="true"
        aria-label="Goal lanes, scroll across dates"
        className={cn(
          "relative max-h-[70dvh] min-h-[200px] overflow-auto overscroll-x-contain rounded-xl border [scrollbar-width:thin] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
          // Lanes are Calendar's grid; without it the cards float in a line.
          LANE_CHROME,
          calendar ? "border-border bg-card" : "border-transparent bg-transparent"
        )}
      >
        <div
          // Clip, not hidden: nothing outside the lanes may widen the scroll
          // range, and the goal labels must stay sticky to the scroller. At
          // least the viewport wide, so lane rules span it.
          className="relative overflow-clip"
          style={{ width: geometry.label + plan.columns * geometry.pitch, minWidth: "100%" }}
        >
          {calendar ? (
            <GoalLaneHeader
              plan={plan}
              first={columns.first}
              last={columns.last}
              today={today}
              weekStartsOn={weekStartsOn}
              loading={loading}
              onInspectDate={onInspectDate}
            />
          ) : null}
          <div data-lane-body="" className="relative">
            {plan.lanes.length === 0 ? (
              <p className="sticky left-0 inline-block px-4 py-10 text-sm text-muted-foreground">
                {loading
                  ? "Loading saved sessions…"
                  : calendar
                    ? "No scheduled sessions around these dates."
                    : "No upcoming sessions in this window."}
              </p>
            ) : null}
            {calendar ? (
              <GoalLaneGridlines
                plan={plan}
                first={columns.first}
                last={columns.last}
                today={today}
                height={bodyHeight}
              />
            ) : null}
            {plan.lanes.map(({ goalId, height, placements }) => {
              const goal = goalsById.get(goalId)!;
              const muted = Boolean(focusedGoalId && focusedGoalId !== goalId);
              return (
                <section
                  key={goalId}
                  data-lane-goal={goalId}
                  aria-label={`${goal.title} scheduled dates`}
                  className={cn(
                    "relative flex border-b",
                    LANE_CHROME,
                    calendar ? "border-border" : "border-transparent"
                  )}
                  style={{ height }}
                >
                  <GoalLaneLabel
                    goal={goal}
                    progress={progressByGoalId.get(goalId)}
                    geometry={geometry}
                    lane={calendar}
                    focused={focusedGoalId === goalId}
                    onFocusToggle={() =>
                      setFocusedGoalId((current) => (current === goalId ? null : goalId))
                    }
                  />
                  <div
                    className={cn(
                      "relative flex-1 transition-opacity motion-reduce:transition-none",
                      muted && "opacity-45"
                    )}
                  >
                    {placements.length === 0 && !calendar ? (
                      <p
                        className="sticky inline-block px-3 text-sm text-muted-foreground"
                        style={{ left: geometry.label, lineHeight: `${height}px` }}
                      >
                        No upcoming sessions.
                      </p>
                    ) : (
                      placementsInColumns(placements, columns.first, columns.last, carried).map(
                        (placement) => (
                          <LaneTile key={placement.session.key} plan={plan} placement={placement} tracked>
                            {renderTile(placement.session)}
                          </LaneTile>
                        )
                      )
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** A session card's slot in its lane; `tracked` slots take part in the morph. */
function LaneTile({
  plan,
  placement,
  tracked = false,
  children,
}: {
  plan: LanePlan;
  placement: LanePlacement;
  tracked?: boolean;
  children: ReactNode;
}) {
  const { padding, pitch, gap, tileHeight } = plan.geometry;
  const offset = placementOffset(plan, placement);
  return (
    <div
      data-lane-tile={tracked ? placement.session.key : undefined}
      className="absolute"
      style={{ left: offset.x, top: padding + offset.y, width: pitch - gap, height: tileHeight }}
    >
      {children}
    </div>
  );
}
