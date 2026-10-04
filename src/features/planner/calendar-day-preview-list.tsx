"use client";

import { MilestoneTitleEditor } from "@/features/goals/milestone-title-editor";
import { Fragment } from "react";
import { Check, Link2, X } from "lucide-react";
import { CompletionToggle } from "@/components/ui/completion-toggle";
import { StyleCompletionMark } from "@/components/ui/style-completion-mark";
import { CalendarPartnerChip } from "@/features/planner/calendar-partner-chip";
import styles from "@/features/planner/calendar-surface.module.css";
import {
  PlannerDraggablePreviewEntry,
  PlannerSortableDayList,
} from "@/features/planner/calendar-dnd";
import { planSelectedWorkRowClass, planLedgerTitleClass, planLedgerSubtitleClass } from "@/features/planner/calendar-day-chrome";
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
import { PLAN_MORPH_CLASS, planEntryViewTransitionName } from "@/features/planner/plan-view-transition";
import {
  canCancelDraftMove,
  canConfirmDraftMove,
} from "@/features/planner/draft-move-confirm";
import { cn } from "@/lib/utils";
import { CompletionTitle } from "@/components/ui/completion-title";
import {
  overlayCurrentlyCredited,
  plannerFactMutationKey,
  type OptimisticCompletionFacts,
} from "@/lib/planner/optimistic-completion-facts";

const draftMoveIconButtonClassName = cn(
  "grid size-7 shrink-0 place-items-center rounded-full border border-border text-muted-foreground",
  "transition-[color,background-color,border-color,transform] duration-[var(--motion-duration-fast)] ease-[var(--motion-ease-standard)]",
  "hover:border-primary hover:bg-primary/10 hover:text-primary",
  "active:scale-90 active:border-primary active:bg-primary/20 active:text-primary",
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:opacity-50",
  "motion-reduce:transform-none"
);

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
  mutationLoadingKey: string | null;
  optimisticCompletionFacts?: OptimisticCompletionFacts;
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
  onConfirmDraftMove?: (entry: TEntry, day: string) => void;
  onCancelDraftMove?: (entry: TEntry, day: string) => void;
}

export function CalendarDayPreviewList<
  TEntry extends CalendarMonthCellEntryBase,
  TCompletionFactMarker extends CalendarCompletionFactMarkerBase,
>({
  day,
  entries,
  completionFactMarkers,
  mutationLoadingKey,
  optimisticCompletionFacts,
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
  onConfirmDraftMove,
  onCancelDraftMove,
}: CalendarDayPreviewListProps<TEntry, TCompletionFactMarker>) {
  const expanded = density === "expanded";
  return (
    <div
      className={`overflow-x-hidden ${
        expanded
          ? "divide-y"
          : "max-h-44 space-y-1.5 overflow-y-auto overscroll-y-auto text-xs [touch-action:pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
            const credited = overlayCurrentlyCredited(
              isEntryCredited(entry),
              optimisticCompletionFacts,
              entry.originalGoalId,
              day
            );
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
            const currentlyCredited = overlayCurrentlyCredited(
              completionToggleState.currentlyCredited,
              optimisticCompletionFacts,
              entry.originalGoalId,
              day
            );
            const pending = plannerFactMutationKey(entry.key) === mutationLoadingKey;
            const completionMode = planCompletionControlMode(completionToggleState);
            const isSelectedRow = selectedEntryKey === entry.key;
            const showDraftMoveActions =
              expanded &&
              Boolean(onConfirmDraftMove) &&
              canConfirmDraftMove(entry);
            const draftMoveDirectionLabel =
              entry.draftDiffKind === "moved_from"
                ? "from this day"
                : "to this day";
            return (
              <Fragment key={`preview-entry-${entry.key}`}><PlannerDraggablePreviewEntry
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
                            shareEntryTransition ? PLAN_MORPH_CLASS : ""
                          } ${
                            isDraft
                              ? `${pillToneClasses} my-1 px-1.5`
                              : "bg-transparent"
                          } ${planSelectedWorkRowClass(isSelectedRow)} ${
                            entry.draftGhost ? "opacity-75" : ""
                          } ${
                            immovable ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
                          } ${isDragging ? "pointer-events-none opacity-0" : ""}`
                        : `${styles.sessionTile} border ${
                            shareEntryTransition ? PLAN_MORPH_CLASS : ""
                          } ${pillToneClasses} ${
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
                    {!isDraft && completionMode === "toggle" ? (
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
                          completed={currentlyCredited}
                          pending={pending}
                          size="sm"
                          chrome="plain"
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleCompletion(entry, day, event.currentTarget);
                          }}
                          aria-label={
                            currentlyCredited
                              ? "Mark session not done"
                              : "Mark session done"
                          }
                          title="Hold to change completion"
                        />
                      </div>
                    ) : !isDraft && completionMode === "done" ? (
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
                      data-plan-title-viewport="true"
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
                              ? `flex min-h-6 items-center ${planLedgerTitleClass} leading-none`
                              : "flex min-h-6 min-w-0 items-center truncate font-display font-medium leading-snug"
                          }
                        >
                          <span className="inline-flex items-center gap-1">
                            <CompletionTitle
                              completed={credited || currentlyCredited}
                            >
                              {displayTitle}
                            </CompletionTitle>
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
                            className={`${expanded ? planLedgerSubtitleClass : "truncate text-muted-foreground"}`}
                          >
                            {draftDiffSummary}
                          </p>
                        ) : null}
                        {subtitle || /^milestone:\d+$/.test(entry.unitKey) ? (
                          <p
                            className={`${
                              expanded ? planLedgerSubtitleClass : "truncate text-muted-foreground"
                            }`}
                          >
                            {/^milestone:\d+$/.test(entry.unitKey) ? <>Milestone: <MilestoneTitleEditor goalId={entry.originalGoalId} unitKey={entry.unitKey} label={entry.label ?? "Milestone"} disabled={entry.draftGhost || completionMode !== "toggle"} /></> : subtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {showDraftMoveActions ? (
                      <div
                        className="flex items-center gap-1 py-3 pr-1"
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
                        {onCancelDraftMove && canCancelDraftMove(entry) ? (
                          <button
                            type="button"
                            className={draftMoveIconButtonClassName}
                            disabled={Boolean(mutationLoadingKey)}
                            aria-label={`Cancel moving ${displayTitle} ${draftMoveDirectionLabel}`}
                            title="Undo this move"
                            onClick={(event) => {
                              event.stopPropagation();
                              onCancelDraftMove(entry, day);
                            }}
                          >
                            <X className="size-4" strokeWidth={2.5} aria-hidden />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={draftMoveIconButtonClassName}
                          disabled={Boolean(mutationLoadingKey)}
                          aria-label={`Confirm moving ${displayTitle} ${draftMoveDirectionLabel}`}
                          title="Confirm this move"
                          onClick={(event) => {
                            event.stopPropagation();
                            onConfirmDraftMove?.(entry, day);
                          }}
                        >
                          <Check className="size-4" strokeWidth={2.5} aria-hidden />
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}
              </PlannerDraggablePreviewEntry>
              {expanded || isSelectedRow ? (
                <div data-plan-checklist-editor-slot={entry.key} />
              ) : null}
              </Fragment>
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
                    : cn(styles.sessionTile, "border border-primary/15 bg-primary/5 text-foreground")
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
                              ? planLedgerTitleClass
                              : "truncate font-medium"
                          }
                        >
                          <CompletionTitle completed>{marker.goalTitle}</CompletionTitle>
                        </p>
                  {detail ? (
                    <p
                      className={
                        expanded
                          ? planLedgerSubtitleClass
                          : "truncate text-[11px] text-muted-foreground"
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
