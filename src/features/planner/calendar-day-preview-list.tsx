"use client";

import { Link2 } from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import {
  PlannerDraggablePreviewEntry,
} from "@/features/planner/calendar-dnd";
import {
  getEntryDraftDiffSummary,
  getEntryDraftPillClasses,
} from "@/features/planner/calendar-format";
import {
  type CalendarCompletionFactMarkerBase,
  type CalendarMonthCellEntryBase,
} from "@/features/planner/calendar-month-day-cell";
import { getGoalVisual, getWorkPillFillStyle } from "@/features/planner/goal-visuals";

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
}: CalendarDayPreviewListProps<TEntry, TCompletionFactMarker>) {
  const expanded = density === "expanded";
  return (
    <div
      className={`overflow-y-auto overflow-x-hidden text-xs [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
        expanded ? "max-h-[min(32rem,70dvh)] divide-y" : "max-h-44 space-y-1"
      }`}
    >
      {entries.length === 0 && completionFactMarkers.length === 0 ? (
        <p className="text-muted-foreground">No planned sessions.</p>
      ) : (
        <>
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
              isDraft || expanded
                ? undefined
                : getWorkPillFillStyle(visual.color, credited);
            const completionToggleState = getCompletionToggleState(entry, day);
            return (
              <PlannerDraggablePreviewEntry
                key={`preview-entry-${entry.key}`}
                day={day}
                entryKey={entry.key}
                disabled={immovable}
              >
                {({
                  setNodeRef,
                  setActivatorNodeRef,
                  attributes,
                  listeners,
                  style,
                  isDragging,
                  isOver,
                }) => (
                  <div
                    ref={setNodeRef}
                    style={{ ...style, ...pillFillStyle }}
                    className={
                      expanded
                        ? `flex items-stretch transition-colors ${
                            isDraft ? pillToneClasses : "bg-transparent"
                          } ${entry.draftGhost ? "opacity-75" : ""} ${
                            isOver ? "bg-primary/5" : ""
                          } ${
                            immovable ? "cursor-not-allowed" : ""
                          } ${isDragging ? "pointer-events-none opacity-0" : ""}`
                        : `flex items-stretch rounded-[10px] border transition-colors ${pillToneClasses} ${
                            entry.draftGhost ? "opacity-75" : ""
                          } ${
                            isOver
                              ? "border-primary/70 ring-1 ring-primary/60"
                              : "hover:border-primary/60"
                          } ${
                            immovable ? "cursor-not-allowed" : ""
                          } ${isDragging ? "pointer-events-none opacity-0" : ""}`
                    }
                    title={
                      `${draftDiffSummary ? `${draftDiffSummary} ` : ""}${
                        immovable
                          ? "Completed or historical sessions can't be moved in draft."
                          : "Click to view details or drag to move this session."
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
                  >
                    {!entry.draftGhost ? (
                      <div
                        className={
                          expanded
                            ? "flex items-center py-3"
                            : "flex items-center p-1.5 pr-0"
                        }
                        data-plan-completion-hit="true"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                        onPointerDown={(event) => {
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
                          disabled={
                            mutationLoading ||
                            completionToggleState.disabledReasonCopy !== null
                          }
                          aria-label={
                            completionToggleState.currentlyCredited
                              ? "Mark session not done"
                              : "Mark session done"
                          }
                          title={
                            completionToggleState.disabledReasonCopy ??
                            "Toggle completion for this session"
                          }
                        />
                      </div>
                    ) : null}
                    <div
                      ref={setActivatorNodeRef}
                      className={
                        immovable
                          ? `flex min-w-0 flex-1 items-center text-left ${
                              expanded ? "py-3 pl-3" : "p-1.5 pl-2"
                            }`
                          : `flex min-w-0 flex-1 cursor-grab items-center text-left touch-none active:cursor-grabbing ${
                              expanded ? "py-3 pl-3" : "p-1.5 pl-2"
                            }`
                      }
                      data-plan-drag-handle="true"
                      {...attributes}
                      {...listeners}
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
                              ? "font-display text-base font-medium tracking-tight"
                              : "truncate font-medium"
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
          {completionFactMarkers.map((marker) => {
            const detail =
              marker.owner === "partner"
                ? "Partner marked this done."
                : marker.scheduledDate && marker.scheduledDate !== day
                  ? `Marked done here; credited from the ${marker.scheduledDate} scheduled session.`
                  : null;
            return (
              <div
                key={`preview-completion-fact-${marker.key}`}
                className={
                  expanded
                    ? `flex items-center gap-3 py-3 ${
                        marker.owner === "partner" ? "text-primary" : "text-foreground"
                      }`
                    : `rounded-[10px] ${
                        marker.owner === "partner"
                          ? "border-2 border-primary bg-transparent text-primary"
                          : "border border-primary/35 bg-primary/10 text-foreground"
                      } p-1.5`
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

