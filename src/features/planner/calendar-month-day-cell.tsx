"use client";

import { format, parse } from "date-fns";
import { Check } from "lucide-react";
import { CalendarMonthMapSummary } from "@/features/planner/calendar-month-map-summary";
import { LinkedGoalMarks } from "@/features/planner/linked-goal-marks";
import { Fragment, useRef, type PointerEvent, type ReactNode } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import { cn } from "@/lib/utils";
import { CompletionTitle } from "@/components/ui/completion-title";
import { MilestoneFlag } from "@/features/goals/milestone-flag";
import styles from "@/features/planner/calendar-surface.module.css";
import {
  overlayCurrentlyCredited,
  plannerFactMutationKey,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";
import {
  PlannerDraggableEntry,
  PlannerDroppableDay,
  PlannerSortableDayList,
} from "@/features/planner/calendar-dnd";
import {
  getEntryDraftDiffSummary,
  getEntryDraftPillClasses,
  getEntrySelectedPillClasses,
} from "@/features/planner/calendar-format";
import { isPlannerTaskCalendarEntry } from "@/features/planner/calendar-task-entries";
import {
  planAgendaDayNumberClass,
  planAgendaDayRowClass,
  planFilledChromeMetaClass,
  planHiddenItemCountLabel,
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
} from "@/features/planner/calendar-day-chrome";
import { planCompletionControlMode } from "@/features/planner/completion-entry-dispatch";
import type { PlannerCalendarEntryKind } from "@/features/planner/calendar-surface.types";
import { getGoalVisual, getWorkPillDraftFillStyle, getWorkPillFillStyle } from "@/features/planner/goal-visuals";
import {
  PLAN_MORPH_CLASS,
  planDayViewTransitionName,
  planEntryViewTransitionName,
} from "@/features/planner/plan-view-transition";

export interface CalendarMonthCellEntryBase {
  key: string;
  entryKind?: PlannerCalendarEntryKind;
  originalGoalId: string;
  goalTitle: string | null;
  unitKey: string;
  label: string | null;
  classification: string;
  creditState: string;
  activeGoal: { color: string | null; category?: string | null } | null;
  activeItem: { id?: string } | null;
  draftDiffKind: "moved_from" | "moved_to" | "new" | null;
  draftDiffFromDate: string | null;
  draftDiffToDate: string | null;
  draftGhost: boolean;
  hasLinkedTargets?: boolean;
  hasIncomingLinks?: boolean;
}

export interface CalendarCompletionFactMarkerBase {
  key: string;
  goalTitle: string;
  scheduledDate: string | null;
  owner?: "viewer" | "partner";
}

interface CalendarMonthDayCellProps<
  TEntry extends CalendarMonthCellEntryBase,
  TCompletionFactMarker extends CalendarCompletionFactMarkerBase,
> {
  day: string;
  taskComposer?: ReactNode;
  inMonth: boolean;
  monthContextLabel?: string | null;
  isToday: boolean;
  isPastInMonth: boolean;
  isSelected?: boolean;
  layout?: "month" | "agenda";
  ariaLabel: string;
  entriesForDay: TEntry[];
  completionFactMarkersForDay: TCompletionFactMarker[];
  maxVisibleItems?: number;
  isAnyEntryDragging: boolean;
  getEntryDisplayTitle: (entry: TEntry) => string;
  isEntryCredited: (entry: TEntry) => boolean;
  isEntryImmovableForDraft: (entry: TEntry) => boolean;
  onEntryClick: (
    day: string,
    entry: TEntry,
    target: EventTarget & HTMLElement
  ) => void;
  onCellClick: (target: EventTarget & HTMLElement) => void;
  onCellDoubleClick: (target: EventTarget & HTMLElement) => void;
  onCellMouseEnter: (target: EventTarget & HTMLElement) => void;
  onCellMouseLeave: () => void;
  onCellPointerDown: (
    pointerType: string,
    target: EventTarget & HTMLElement
  ) => void;
  onCellPointerUp: () => void;
  onCellPointerCancel: () => void;
  onCellPointerLeave: () => void;
  onEntryPointerStart: (immovable: boolean) => void;
  onEntryPointerEnd: () => void;
  onToggleCompletion?: (
    entry: TEntry,
    day: string,
    sourceElement: HTMLButtonElement
  ) => void;
  getCompletionToggleState?: (
    entry: TEntry,
    day: string
  ) => {
    currentlyCredited: boolean;
    disabledReasonCopy: string | null;
  };
  mutationLoadingKey?: string | null;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
  onboardingFirstEntry?: boolean;
  focusedGoalId?: string | null;
  selectedEntryKey?: string | null;
}

/** Compact month grid: goals shown before "+N more" (pairs with `.monthCell` min-height). */
export const COMPACT_MONTH_MAX_VISIBLE_GOALS = 3;

const DEFAULT_MAX_VISIBLE_ITEMS_PER_DAY_CELL = COMPACT_MONTH_MAX_VISIBLE_GOALS;

function shouldSelectAgendaDayFromTarget(target: EventTarget | null) {
  return !(
    target instanceof Element &&
    target.closest("button, [data-calendar-day-entry='true']")
  );
}

function agendaDayCellFromRow(row: HTMLElement) {
  return row.querySelector<HTMLElement>("[data-day-cell='true']") ?? row;
}

export function CalendarMonthDayCell<
  TEntry extends CalendarMonthCellEntryBase,
  TCompletionFactMarker extends CalendarCompletionFactMarkerBase,
>({
  day,
  taskComposer,
  inMonth,
  monthContextLabel = null,
  isToday,
  isPastInMonth,
  isSelected = false,
  layout = "month",
  ariaLabel,
  entriesForDay,
  completionFactMarkersForDay,
  maxVisibleItems = DEFAULT_MAX_VISIBLE_ITEMS_PER_DAY_CELL,
  isAnyEntryDragging,
  getEntryDisplayTitle,
  isEntryCredited,
  isEntryImmovableForDraft,
  onEntryClick,
  onCellClick,
  onCellDoubleClick,
  onCellMouseEnter,
  onCellMouseLeave,
  onCellPointerDown,
  onCellPointerUp,
  onCellPointerCancel,
  onCellPointerLeave,
  onEntryPointerStart,
  onEntryPointerEnd,
  onToggleCompletion,
  getCompletionToggleState,
  mutationLoadingKey = null,
  optimisticCompletionFacts,
  onboardingFirstEntry = false,
  focusedGoalId = null,
  selectedEntryKey = null,
}: CalendarMonthDayCellProps<TEntry, TCompletionFactMarker>) {
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const startPress = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0 || (event.target instanceof Element &&
      event.target.closest('[data-calendar-day-entry="true"], [data-task-composer="true"]'))) return;
    pressOrigin.current = { x: event.clientX, y: event.clientY };
    onCellPointerDown(event.pointerType, event.currentTarget);
  };
  const movePress = (event: PointerEvent<HTMLElement>) => {
    if (pressOrigin.current && Math.hypot(event.clientX - pressOrigin.current.x, event.clientY - pressOrigin.current.y) > 8) {
      pressOrigin.current = null;
      onCellPointerCancel();
    }
  };
  const endPress = () => { pressOrigin.current = null; onCellPointerUp(); };
  const hasVisibleContent =
    entriesForDay.length > 0 || completionFactMarkersForDay.length > 0;
  const maxVisibleItemsPerCell = Number.isFinite(maxVisibleItems)
    ? Math.max(0, Math.floor(maxVisibleItems))
    : entriesForDay.length + completionFactMarkersForDay.length;
  const viewerCompletionFactMarkers = completionFactMarkersForDay.filter(
    (marker) => marker.owner !== "partner"
  );
  const partnerCompletionFactMarkers = completionFactMarkersForDay.filter(
    (marker) => marker.owner === "partner"
  );
  const visibleEntries = entriesForDay.slice(0, maxVisibleItemsPerCell);
  const remainingSlots = Math.max(
    0,
    maxVisibleItemsPerCell - visibleEntries.length
  );
  const visibleCompletionFactMarkers = viewerCompletionFactMarkers.slice(
    0,
    remainingSlots
  );
  const hiddenItemCount =
    entriesForDay.length +
    viewerCompletionFactMarkers.length -
    visibleEntries.length -
    visibleCompletionFactMarkers.length;
  const hiddenItemCountLabel = planHiddenItemCountLabel(hiddenItemCount);
  const monthOverflowLabel = (
    <p
      className={cn(
        "text-[10px]",
        hiddenItemCount > 0
          ? planFilledChromeMetaClass({ inMonth, isToday, isSelected })
          : "invisible"
      )}
      aria-hidden={hiddenItemCount === 0}
    >
      {hiddenItemCountLabel}
    </p>
  );

  const renderEntry = (entry: TEntry, entryIndex: number): ReactNode => {
    const visual = getGoalVisual({
      goalId: entry.originalGoalId,
      color: entry.activeGoal?.color ?? null,
      category: entry.activeGoal?.category ?? null,
    });
    const compactTitle = getEntryDisplayTitle(entry);
    const credited = overlayCurrentlyCredited(
      isEntryCredited(entry),
      optimisticCompletionFacts,
      entry.originalGoalId,
      day
    );
    const immovable = isEntryImmovableForDraft(entry);
    const draftDiffSummary = getEntryDraftDiffSummary(entry);
    const isDraft = Boolean(entry.draftDiffKind);
    const isCompleted = credited && !isDraft;
    const isGoalFocusDimmed =
      focusedGoalId &&
      entry.originalGoalId !== focusedGoalId &&
      !isPlannerTaskCalendarEntry(entry);
    const selectedPillClasses = getEntrySelectedPillClasses({
      selected: Boolean(selectedEntryKey) && entry.key === selectedEntryKey,
    });
    const pillToneClasses = getEntryDraftPillClasses({
      draftDiffKind: entry.draftDiffKind,
    });
    const pillFillStyle =
      entry.draftDiffKind === "moved_to" || entry.draftDiffKind === "new"
        ? getWorkPillDraftFillStyle(visual.color, entry.draftDiffKind)
        : isDraft
          ? undefined
          : getWorkPillFillStyle(visual.color, credited);
    const completionToggleState = getCompletionToggleState?.(entry, day);
    const currentlyCredited = overlayCurrentlyCredited(
      completionToggleState?.currentlyCredited ?? credited,
      optimisticCompletionFacts,
      entry.originalGoalId,
      day
    );
    const pending = plannerFactMutationKey(entry.key) === mutationLoadingKey;
    const completionMode = completionToggleState
      ? planCompletionControlMode(completionToggleState)
      : "hidden";
    const showCompletionToggle = Boolean(
      layout === "agenda" &&
        onToggleCompletion &&
        completionMode === "toggle" &&
        !isDraft
    );
    const showStaticDoneMark =
      !isDraft &&
      !showCompletionToggle &&
      (completionMode === "done" || currentlyCredited);
    return (
      <Fragment key={`cell-entry-wrap-${entry.key}`}>
      <PlannerDraggableEntry
        key={`cell-entry-${entry.key}`}
        entryKey={entry.key}
        day={day}
        disabled={immovable}
      >
        {({ setNodeRef, setActivatorNodeRef, attributes, listeners, style, isDragging }) => (
          <div
            ref={(node) => {
              setNodeRef(node);
              setActivatorNodeRef(node);
            }}
            style={{
              ...style,
              ...pillFillStyle,
              viewTransitionName: planEntryViewTransitionName(entry.key),
              ...(selectedPillClasses
                ? ({
                    ["--plan-selected-shimmer-color" as string]: visual.color,
                  } as const)
                : {}),
            }}
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest(
                  "[data-motion='completion-toggle'], [data-plan-completion-hit]"
                )
              ) {
                return;
              }
              event.stopPropagation();
              if (isDragging) {
                return;
              }
              onEntryClick(day, entry, event.currentTarget);
            }}
            onPointerDownCapture={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest(
                  "[data-motion='completion-toggle'], [data-plan-completion-hit]"
                )
              ) {
                return;
              }
              onEntryPointerStart(immovable);
            }}
            onPointerUpCapture={() => {
              onEntryPointerEnd();
            }}
            onPointerCancelCapture={() => {
              onEntryPointerEnd();
            }}
            className={`${styles.sessionTile} border ${PLAN_MORPH_CLASS} ${pillToneClasses} ${selectedPillClasses} ${
              entry.draftGhost ? "opacity-70 line-through" : ""
            } ${isGoalFocusDimmed ? "opacity-45" : ""} ${
              immovable
                ? "cursor-not-allowed"
                : "cursor-grab active:cursor-grabbing"
            } ${isDragging ? "pointer-events-none opacity-0" : ""}`}
            title={
              `${draftDiffSummary ? `${draftDiffSummary} ` : ""}${
                immovable
                  ? "Completed or historical sessions can't be moved in draft."
                  : "Drag to rearrange in this day, or drop on another day to move."
              }`
            }
            data-calendar-day-entry="true"
            data-onboarding={
              onboardingFirstEntry && entryIndex === 0
                ? "planner.calendar.item"
                : undefined
            }
            data-planner-entry-key={entry.key}
            data-planner-goal-id={entry.originalGoalId}
            data-planner-unit-key={entry.unitKey}
            {...attributes}
            {...(immovable ? {} : listeners)}
          >
            {showCompletionToggle && completionToggleState ? (
              <div
                className="flex items-center self-center"
                data-plan-completion-hit="true"
                onClick={(event) => {
                  event.stopPropagation();
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                }}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onTouchStart={(event) => {
                  event.stopPropagation();
                }}
              >
                <CompletionToggle
                  completed={currentlyCredited}
                  pending={pending}
                  size="sm"
                  chrome="plain"
                  completedMark="check"
                  renderMark={/^milestone:\d+$/.test(entry.unitKey)
                    ? complete => <MilestoneFlag compact complete={complete} number={Number(entry.unitKey.split(":")[1])} />
                    : undefined}
                  aria-label={
                    currentlyCredited
                      ? "Mark session not done"
                      : "Mark session done"
                  }
                  title="Hold to change completion"
                  onClick={(event) => {
                    event.stopPropagation();
                    onToggleCompletion?.(entry, day, event.currentTarget);
                  }}
                />
              </div>
            ) : showStaticDoneMark ? (
              /^milestone:\d+$/.test(entry.unitKey) ? <MilestoneFlag compact complete number={Number(entry.unitKey.split(":")[1])} /> : <Check
                role="img"
                className="block size-3.5 shrink-0 self-center"
                aria-label="Completed"
              />
            ) : null}
            <CompletionTitle
              completed={isCompleted}
              treatment="quiet"
              className="flex min-h-5 min-w-0 items-center truncate type-item leading-snug"
            >
              {compactTitle}
            </CompletionTitle>
            <LinkedGoalMarks
              outgoing={Boolean(entry.hasLinkedTargets)}
              incoming={Boolean(entry.hasIncomingLinks)}
              compact
            />
          </div>
        )}
      </PlannerDraggableEntry>
      </Fragment>
    );
  };

  const parsedDay = parse(day, "yyyy-MM-dd", new Date());
  const weekdayLabel = format(parsedDay, "EEE");
  const dayNumber = format(parsedDay, "d");

  if (layout === "agenda") {
    return (
      <li
        className={cn(
          PLAN_MORPH_CLASS,
          planAgendaDayRowClass({ inMonth, isToday, isSelected }),
          "cursor-pointer"
        )}
        data-day={day}
        data-calendar-week-row="true"
        onPointerDown={startPress} onPointerMove={movePress} onPointerUp={endPress}
        onPointerCancel={onCellPointerCancel} onPointerLeave={onCellPointerLeave}
        onContextMenu={(event) => { if (pressOrigin.current) event.preventDefault(); }}
        style={{ viewTransitionName: planDayViewTransitionName(day) }}
        onClick={(event) => {
          if (!shouldSelectAgendaDayFromTarget(event.target)) {
            return;
          }
          onCellClick(agendaDayCellFromRow(event.currentTarget));
        }}
        onDoubleClick={(event) => {
          if (!shouldSelectAgendaDayFromTarget(event.target)) {
            return;
          }
          onCellDoubleClick(agendaDayCellFromRow(event.currentTarget));
        }}
      >
        <div className="flex items-start gap-2 py-3">
          <button
            type="button"
            className="w-14 shrink-0 px-1 text-left touch-manipulation"
            aria-label={ariaLabel}
            aria-current={isToday ? "date" : undefined}
            aria-pressed={isSelected}
            data-day-cell="true"
            data-day={day}
            data-onboarding={isToday ? "planner.calendar.today" : undefined}
            onClick={(event) => onCellClick(event.currentTarget)}
            onDoubleClick={(event) => onCellDoubleClick(event.currentTarget)}
          >
            <span
              data-plan-weekday="true"
              className={cn(
                "block type-eyebrow text-[11px]",
                planFilledChromeMetaClass({ inMonth, isToday, isSelected })
              )}
            >
              {weekdayLabel}
            </span>
            <span
              data-plan-day-number="true"
              className={cn(
                "font-display",
                planAgendaDayNumberClass({ isToday, isSelected })
              )}
            >
              {dayNumber}
            </span>
          </button>
          <PlannerDroppableDay day={day}>
            {({ setNodeRef, isOver }) => (
              <div
                ref={setNodeRef}
                className={cn(
                  "flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5 rounded-[10px] px-1 py-0.5 transition-[background-color,box-shadow] motion-reduce:transition-none",
                  isAnyEntryDragging && isOver && "bg-primary/5 ring-2 ring-inset ring-primary/50"
                )}
                data-calendar-week-work="true"
              >
                {taskComposer}
                {hasVisibleContent ? (
                  <>
                    <PlannerSortableDayList
                      day={day}
                      surface="calendar"
                      entryKeys={visibleEntries.map((entry) => entry.key)}
                    >
                      {visibleEntries.map((entry, entryIndex) =>
                        renderEntry(entry, entryIndex)
                      )}
                    </PlannerSortableDayList>
                    {visibleCompletionFactMarkers.map((marker) => {
                      const statusCopy =
                        marker.scheduledDate && marker.scheduledDate !== day
                          ? `Marked done here, currently credited from the ${marker.scheduledDate} scheduled session.`
                          : "Marked done on this date.";
                      return (
                        <div
                          key={`completion-fact-${marker.key}`}
                          className={cn(styles.sessionTile, "border border-primary/15 bg-primary/5 text-foreground")}
                          aria-label={`${marker.goalTitle}. ${statusCopy}`}
                        >
                          <Check className="size-3 shrink-0" aria-hidden="true" />
                          <CompletionTitle completed treatment="quiet" className="truncate">{marker.goalTitle}</CompletionTitle>
                        </div>
                      );
                    })}
                    {partnerCompletionFactMarkers.map((marker) => (
                      <CalendarPartnerChip
                        key={`completion-fact-${marker.key}`}
                        title={marker.goalTitle}
                        completed
                      />
                    ))}
                    {hiddenItemCount > 0 ? (
                      <p
                        className={cn(
                          "text-[10px]",
                          planFilledChromeMetaClass({ inMonth, isToday, isSelected })
                        )}
                      >
                        {hiddenItemCountLabel}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "min-h-[2.75rem] w-full rounded-[10px] px-2 text-left text-sm touch-manipulation",
                      planFilledChromeMetaClass({ inMonth, isToday, isSelected })
                    )}
                    onClick={(event) => onCellClick(event.currentTarget)}
                  >
                    No work this day
                  </button>
                )}
              </div>
            )}
          </PlannerDroppableDay>
        </div>
      </li>
    );
  }

  return (
    <PlannerDroppableDay day={day}>
      {({ setNodeRef, isOver }) => (
        <div
          ref={setNodeRef}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
              event.preventDefault(); onCellClick(event.currentTarget);
            }
          }}
          onClick={(event) => onCellClick(event.currentTarget)}
          onDoubleClick={(event) => {
            onCellDoubleClick(event.currentTarget);
          }}
          onMouseEnter={(event) => onCellMouseEnter(event.currentTarget)}
          onMouseLeave={onCellMouseLeave}
          onPointerDown={startPress} onPointerMove={movePress} onPointerUp={endPress}
          onPointerCancel={onCellPointerCancel}
          onPointerLeave={onCellPointerLeave}
          onContextMenu={(event) => { if (pressOrigin.current) event.preventDefault(); }}
          className={cn(
            PLAN_MORPH_CLASS,
            styles.monthCell,
            planMonthDaySurfaceClass({
              inMonth,
              isToday,
              isSelected,
              isPastInMonth,
            }),
            isAnyEntryDragging && isOver && "ring-2 ring-inset ring-primary/50"
          )}
          aria-label={ariaLabel}
          aria-current={isToday ? "date" : undefined}
          aria-pressed={isSelected}
          data-no-swipe="true"
          data-day-cell="true"
          data-day={day}
          data-onboarding={isToday ? "planner.calendar.today" : undefined}
          style={{ viewTransitionName: planDayViewTransitionName(day) }}
        >
          <div className={styles.dateHeader}>
            <p
              data-plan-day-number="true"
              className={`${styles.dayNumber} font-display ${planMonthDayNumberClass({
                inMonth,
                isToday,
                isSelected,
              })}`}
            >
              {dayNumber}
            </p>
            {monthContextLabel ? (
              <span
                className="type-eyebrow text-[9px] leading-none text-muted-foreground"
                data-month-context-label={monthContextLabel}
              >
                {monthContextLabel}
              </span>
            ) : null}
          </div>
          <CalendarMonthMapSummary
            entries={entriesForDay}
            recordedCount={completionFactMarkersForDay.length}
            isEntryCredited={(entry) => overlayCurrentlyCredited(
              isEntryCredited(entry), optimisticCompletionFacts, entry.originalGoalId, day
            )}
          />
          <div className={styles.monthCellWork}>
          {taskComposer}
          {hasVisibleContent ? (
            <div className="space-y-1.5">
              <PlannerSortableDayList
                day={day}
                surface="calendar"
                entryKeys={visibleEntries.map((entry) => entry.key)}
              >
                {visibleEntries.map((entry, entryIndex) =>
                  renderEntry(entry, entryIndex)
                )}
              </PlannerSortableDayList>
              {visibleCompletionFactMarkers.map((marker) => {
                const statusCopy =
                  marker.scheduledDate && marker.scheduledDate !== day
                    ? `Marked done here, currently credited from the ${marker.scheduledDate} scheduled session.`
                    : "Marked done on this date.";
                return (
                <div
                  key={`completion-fact-${marker.key}`}
                  className={cn(styles.sessionTile, "border border-primary/15 bg-primary/5 text-foreground")}
                  aria-label={`${marker.goalTitle}. ${statusCopy}`}
                >
                  <Check className="size-3 shrink-0" aria-hidden="true" />
                  <CompletionTitle completed treatment="quiet" className="truncate">{marker.goalTitle}</CompletionTitle>
                </div>
                );
              })}
              {partnerCompletionFactMarkers.map((marker) => (
                <CalendarPartnerChip
                  key={`completion-fact-${marker.key}`}
                  title={marker.goalTitle}
                  completed
                />
              ))}
              {monthOverflowLabel}
            </div>
          ) : (
            <div>{monthOverflowLabel}</div>
          )}
          </div>
        </div>
      )}
    </PlannerDroppableDay>
  );
}
