"use client";

import { format, parse } from "date-fns";
import { Link2 } from "lucide-react";
import type { ReactNode } from "react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import { cn } from "@/lib/utils";
import {
  PlannerDraggableEntry,
  PlannerDroppableDay,
  PlannerSortableDayList,
} from "@/features/planner/calendar-dnd";
import {
  getEntryDraftDiffSummary,
  getEntryDraftPillClasses,
} from "@/features/planner/calendar-format";
import {
  planAgendaDayNumberClass,
  planAgendaDayRowClass,
  planFilledChromeMetaClass,
  planHiddenItemCountLabel,
  planMonthDayNumberClass,
  planMonthDaySurfaceClass,
} from "@/features/planner/calendar-day-chrome";
import { planCompletionControlMode } from "@/features/planner/completion-entry-dispatch";
import { getGoalVisual, getWorkPillDraftFillStyle, getWorkPillFillStyle } from "@/features/planner/goal-visuals";
import {
  PLAN_MORPH_CLASS,
  planDayViewTransitionName,
  planEntryViewTransitionName,
} from "@/features/planner/plan-view-transition";

export interface CalendarMonthCellEntryBase {
  key: string;
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
  mutationLoading?: boolean;
  onboardingFirstEntry?: boolean;
}

const DEFAULT_MAX_VISIBLE_ITEMS_PER_DAY_CELL = 2;

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
  mutationLoading = false,
  onboardingFirstEntry = false,
}: CalendarMonthDayCellProps<TEntry, TCompletionFactMarker>) {
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

  const renderEntry = (entry: TEntry, entryIndex: number): ReactNode => {
    const visual = getGoalVisual({
      goalId: entry.originalGoalId,
      color: entry.activeGoal?.color ?? null,
      category: entry.activeGoal?.category ?? null,
    });
    const compactTitle = getEntryDisplayTitle(entry);
    const credited = isEntryCredited(entry);
    const immovable = isEntryImmovableForDraft(entry);
    const draftDiffSummary = getEntryDraftDiffSummary(entry);
    const isDraft = Boolean(entry.draftDiffKind);
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
      layout === "agenda" &&
      !isDraft &&
      (completionMode === "done" || (!completionToggleState && credited));
    return (
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
            className={`flex items-center gap-1.5 rounded-[10px] border px-1.5 py-1 text-[11px] ${PLAN_MORPH_CLASS} ${pillToneClasses} ${
              entry.draftGhost ? "opacity-70 line-through" : ""
            } ${
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
                  completed={completionToggleState.currentlyCredited}
                  pending={mutationLoading}
                  size="sm"
                  chrome="plain"
                  aria-label={
                    completionToggleState.currentlyCredited
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
              <StyleCompletionMark
                done
                className="block size-3.5 shrink-0 self-center"
                label="Completed"
              />
            ) : null}
            <span
              className={cn(
                "flex h-6 min-w-0 items-center truncate font-display leading-none",
                credited && "line-through"
              )}
            >
              {compactTitle}
            </span>
            {entry.hasLinkedTargets ? (
              <Link2
                className="size-3 shrink-0"
                aria-label="Links this subgoal to a main goal"
              />
            ) : null}
          </div>
        )}
      </PlannerDraggableEntry>
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
              className={cn(
                "block font-sans text-[11px] font-medium uppercase tracking-[0.12em]",
                planFilledChromeMetaClass({ inMonth, isToday, isSelected })
              )}
            >
              {weekdayLabel}
            </span>
            <span
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
                  "flex min-h-[2.75rem] min-w-0 flex-1 flex-col gap-1.5 rounded-[10px] px-1 py-0.5",
                  isAnyEntryDragging && isOver && "ring-2 ring-primary/70"
                )}
                data-calendar-week-work="true"
              >
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
                          className="flex items-center gap-1.5 rounded-[10px] border border-primary/35 bg-primary/10 px-1.5 py-1 text-[11px] text-foreground"
                          aria-label={`${marker.goalTitle}. ${statusCopy}`}
                        >
                          <StyleCompletionMark done className="size-3 shrink-0" />
                          <span className="truncate line-through">{marker.goalTitle}</span>
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
                        {planHiddenItemCountLabel(hiddenItemCount)}
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
        <button
          ref={setNodeRef}
          type="button"
          onClick={(event) => onCellClick(event.currentTarget)}
          onDoubleClick={(event) => {
            onCellDoubleClick(event.currentTarget);
          }}
          onMouseEnter={(event) => onCellMouseEnter(event.currentTarget)}
          onMouseLeave={onCellMouseLeave}
          onPointerDown={(event) => {
            const target =
              event.target instanceof Element
                ? event.target
                : event.target instanceof Node
                  ? event.target.parentElement
                  : null;
            if (
              target?.closest('[data-calendar-day-entry="true"]')
            ) {
              return;
            }
            onCellPointerDown(event.pointerType, event.currentTarget);
          }}
          onPointerUp={onCellPointerUp}
          onPointerCancel={onCellPointerCancel}
          onPointerLeave={onCellPointerLeave}
          className={cn(
            PLAN_MORPH_CLASS,
            "relative min-h-24 rounded-[10px] border p-2 text-left transition-colors",
            planMonthDaySurfaceClass({
              inMonth,
              isToday,
              isSelected,
              isPastInMonth,
            }),
            isAnyEntryDragging && isOver && "ring-2 ring-primary/70"
          )}
          aria-label={ariaLabel}
          data-no-swipe="true"
          data-day-cell="true"
          data-day={day}
          data-onboarding={isToday ? "planner.calendar.today" : undefined}
          style={{ viewTransitionName: planDayViewTransitionName(day) }}
        >
          <div className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5">
            <p
              className={`text-xs font-semibold leading-none ${planMonthDayNumberClass({
                inMonth,
                isToday,
                isSelected,
              })}`}
            >
              {day.slice(8, 10)}
            </p>
            {monthContextLabel ? (
              <span
                className="rounded-sm border border-border/70 bg-background/90 px-1 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-foreground/80"
                data-month-context-label={monthContextLabel}
              >
                {monthContextLabel}
              </span>
            ) : null}
          </div>
          {hasVisibleContent ? (
            <div className="mt-4 space-y-1">
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
                  className="flex items-center gap-1.5 rounded-md border border-primary/35 bg-primary/10 px-1.5 py-1 text-[11px] text-foreground"
                  aria-label={`${marker.goalTitle}. ${statusCopy}`}
                >
                  <StyleCompletionMark done className="size-3 shrink-0" />
                  <span className="truncate line-through">{marker.goalTitle}</span>
                </div>
                );
              })}
              {partnerCompletionFactMarkers.map((marker) => (
                <CalendarPartnerChip
                  key={`completion-fact-${marker.key}`}
                  title={marker.goalTitle}
                  completed
                  className="rounded-md"
                />
              ))}
              {hiddenItemCount > 0 ? (
                <p
                  className={cn(
                    "text-[10px]",
                    planFilledChromeMetaClass({ inMonth, isToday, isSelected })
                  )}
                >
                  {planHiddenItemCountLabel(hiddenItemCount)}
                </p>
              ) : null}
            </div>
          ) : null}
        </button>
      )}
    </PlannerDroppableDay>
  );
}

