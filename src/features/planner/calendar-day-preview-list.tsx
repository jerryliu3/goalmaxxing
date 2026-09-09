"use client";

import { Link2 } from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import {
  PlannerDraggablePreviewEntry,
  PlannerSortableDayList,
} from "@/features/planner/calendar-dnd";
import { planSelectedWorkRowClass } from "@/features/planner/calendar-day-chrome";
import {
  getEntryDraftDiffSummary,
  getEntryDraftPillClasses,
} from "@/features/planner/calendar-format";
import { planCompletionControlMode } from "@/features/planner/completion-entry-dispatch";
import {
  type CalendarCompletionFactMarkerBase,
  type CalendarMonthCellEntryBase,
} from "@/features/planner/calendar-month-day-cell";
import { getGoalVisual, getWorkPillDraftFillStyle, getWorkPillFillStyle } from "@/features/planner/goal-visuals";
import { planEntryViewTransitionName } from "@/features/planner/plan-view-transition";

interface PreviewCompletionToggleState {
  currentlyCredited: boolean;
  disabledReasonCopy: string | null;
}

interface CalendarDayPreviewListProps<
  TEntry extends CalendarMonthCellEntryBase,
  TCompletionFactMarker extends CalendarCompletionFactMarkerBase,
> {
  day: string;
  entries: TEntry[];
  completionFactMarkers: TCompletionFactMarker[];
  mutationLoading: boolean;
  getEntryDisplayTitle: (entry: TEntry) => string;
  getEntrySubtitle: (entry: TEntry) => string | null;
  isEntryCredited: (entry: TEntry) => boolean;
  isEntryImmovableForDraft: (entry: TEntry) => boolean;
  getCompletionToggleState: (entry: TEntry, day: string) => PreviewCompletionToggleState;
  onEntryOpen: (entryKey: string) => void;
  onToggleCompletion: (
    entry: TEntry,
    day: string,
    sourceElement: HTMLButtonElement
  ) => void;
  onEntryPointerStart: (immovable: boolean) => void;
  onEntryPointerEnd: () => void;
  density?: "compact" | "expanded";
  selectedEntryKey?: string | null;
  shareEntryTransition?: boolean;
}

export function CalendarDayPreviewList<
  TEntry extends CalendarMonthCellEntryBase,
  TCompletionFactMarker extends CalendarCompletionFactMarkerBase,
>({
  day,
  entries,
  completionFactMarkers,
  mutationLoading,
  getEntryDisplayTitle,
  getEntrySubtitle,
  isEntryCredited,
  isEntryImmovableForDraft,
  getCompletionToggleState,
  onEntryOpen,
  onToggleCompletion,
  onEntryPointerStart,
  onEntryPointerEnd,
  density = "compact",
  selectedEntryKey = null,
  shareEntryTransition = false,
}: CalendarDayPreviewListProps<TEntry, TCompletionFactMarker>) {
  const expanded = density === "expanded";
  return (
    <div
      className={`overflow-x-hidden text-xs ${
        expanded ? "divide-y" : "max-h-44 space-y-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      }`}
    >
      {entries.length === 0 && completionFactMarkers.length === 0 ? (
        <p className="text-muted-foreground">No planned sessions.</p>
      ) : (
        <>
          <PlannerSortableDayList
            day={day}
            surface="checklist"
            entryKeys={entries.map((entry) => entry.key)}
          >
          {entries.map((entry) => {
            const visual = getGoalVisual({
              goalId: entry.originalGoalId,
              color: entry.activeGoal?.color ?? null,
              category: entry.activeGoal?.category ?? null,
            });
            const displayTitle = getEntryDisplayTitle(entry);
            const subtitle = getEntrySubtitle(entry);
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
                : isDraft || expanded
                  ? undefined
                  : getWorkPillFillStyle(visual.color, credited);
            const completionToggleState = getCompletionToggleState(entry, day);
            const completionMode = planCompletionControlMode(completionToggleState);
            const isSelectedRow = selectedEntryKey === entry.key;
            return (
              <PlannerDraggablePreviewEntry
                key={`preview-entry-${entry.key}`}
                day={day}
                entryKey={entry.key}
                surface="checklist"
                disabled={immovable}
              >
                {({
                  setNodeRef,
                  setActivatorNodeRef,
                  attributes,
                  listeners,
                  style,
                  isDragging,
                }) => (
                  <div
                    ref={(node) => {
                      setNodeRef(node);
                      setActivatorNodeRef(node);
                    }}
                    style={{
                      ...style,
                      ...pillFillStyle,
                      ...(shareEntryTransition
                        ? { viewTransitionName: planEntryViewTransitionName(entry.key) }
                        : {}),
                    }}
                    className={
                      expanded
                        ? `flex items-start transition-colors ${
                            isDraft ? pillToneClasses : "bg-transparent"
                          } ${planSelectedWorkRowClass(isSelectedRow)} ${
                            entry.draftGhost ? "opacity-75" : ""
                          } ${
                            immovable ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
                          } ${isDragging ? "pointer-events-none opacity-0" : ""}`
                        : `flex items-start rounded-[10px] border px-1.5 py-1 transition-colors ${pillToneClasses} ${
                            entry.draftGhost ? "opacity-75" : ""
                          } hover:border-primary/60 ${
                            immovable ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
                          } ${isDragging ? "pointer-events-none opacity-0" : ""}`
                    }
                    aria-current={isSelectedRow ? "true" : undefined}
                    title={
                      `${draftDiffSummary ? `${draftDiffSummary} ` : ""}${
                        immovable
                          ? "Completed or historical sessions can't be moved in draft."
                          : "Click to view details or drag to rearrange in this day."
                      }`
                    }
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
                    data-planner-entry-key={entry.key}
                    data-plan-work-row={expanded ? "ledger" : "pill"}
                    {...attributes}
                    {...(immovable ? {} : listeners)}
                  >
                    {!entry.draftGhost && completionMode === "toggle" ? (
                      <div
                        className={
                          expanded
                            ? "flex items-center py-3"
                            : "flex h-6 items-center"
                        }
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
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleCompletion(entry, day, event.currentTarget);
                          }}
                          disabled={mutationLoading}
                          aria-label={
                            completionToggleState.currentlyCredited
                              ? "Mark session not done"
                              : "Mark session done"
                          }
                          title="Hold to change completion"
                        />
                      </div>
                    ) : !entry.draftGhost && completionMode === "done" ? (
                      <div
                        className={
                          expanded
                            ? "flex items-center py-3"
                            : "flex h-6 items-center"
                        }
                      >
                        <StyleCompletionMark
                          done
                          className="size-6 shrink-0"
                          label="Completed"
                        />
                      </div>
                    ) : null}
                    <div
                      className={`flex min-w-0 flex-1 flex-col justify-center text-left leading-none ${
                        expanded ? "py-3 pl-3" : "pl-2"
                      } ${immovable ? "" : "touch-none"}`}
                      data-plan-drag-handle="true"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (isDragging) {
                          return;
                        }
                        onEntryOpen(entry.key);
                      }}
                    >
                      <div className="min-w-0">
                        <p
                          className={
                            expanded
                              ? "flex min-h-6 items-center font-display text-base font-medium leading-none tracking-tight"
                              : "flex h-6 min-w-0 items-center truncate font-display font-medium leading-none"
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            <span
                              className={
                                credited || completionToggleState.currentlyCredited
                                  ? "line-through"
                                  : undefined
                              }
                            >
                              {displayTitle}
                            </span>
                            {entry.hasLinkedTargets ? (
                              <Link2
                                className="size-3 shrink-0 text-muted-foreground"
                                aria-label="Links this subgoal to a main goal"
                              />
                            ) : null}
                          </span>
                        </p>
                        {draftDiffSummary ? (
                          <p
                            className={`${expanded ? "text-[11px] uppercase tracking-[0.12em]" : "truncate"} text-muted-foreground`}
                          >
                            {draftDiffSummary}
                          </p>
                        ) : null}
                        {subtitle ? (
                          <p
                            className={`${
                              expanded
                                ? "text-[11px] uppercase tracking-[0.12em]"
                                : "truncate"
                            } text-muted-foreground`}
                          >
                            {subtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
              </PlannerDraggablePreviewEntry>
            );
          })}
          </PlannerSortableDayList>
          {completionFactMarkers.map((marker) => {
            const partnerOwned = marker.owner === "partner";
            const detail = partnerOwned
              ? "Partner marked this done."
              : marker.scheduledDate && marker.scheduledDate !== day
                ? `Marked done here; credited from the ${marker.scheduledDate} scheduled session.`
                : null;
            if (partnerOwned) {
              return (
                <CalendarPartnerChip
                  key={`preview-completion-fact-${marker.key}`}
                  title={marker.goalTitle}
                  completed
                  density={expanded ? "expanded" : "compact"}
                  description={expanded ? detail : null}
                />
              );
            }
            return (
              <div
                key={`preview-completion-fact-${marker.key}`}
                className={
                  expanded
                    ? "flex items-center gap-3 py-3 text-foreground"
                    : "rounded-[10px] border border-primary/35 bg-primary/10 p-1.5 text-foreground"
                }
                aria-label={detail ? `${marker.goalTitle}. ${detail}` : marker.goalTitle}
              >
                {expanded ? (
                  <StyleCompletionMark done className="size-4 shrink-0" />
                ) : null}
                <div className="min-w-0">
                        <p
                          className={
                            expanded
                              ? "font-display text-base font-medium tracking-tight line-through"
                              : "truncate font-medium line-through"
                          }
                        >
                    {marker.goalTitle}
                  </p>
                  {detail ? (
                    <p
                      className={
                        expanded
                          ? "text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
                          : "truncate text-[11px]"
                      }
                    >
                      {detail}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

