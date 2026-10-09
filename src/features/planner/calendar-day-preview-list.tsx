"use client";

import { MilestoneTitleEditor } from "@/features/goals/milestone-title-editor";
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { directLinkedGoalIds } from "@/features/planner/calendar-linked-targets";
import { LinkedGoalMarks } from "@/features/planner/linked-goal-marks";
import { usePlannerGoalLinks } from "@/features/planner/planner-goal-links";
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
  getEntryGhostClasses,
} from "@/features/planner/calendar-format";
import { planCompletionControlMode } from "@/features/planner/completion-entry-dispatch";
import {
  type CalendarCompletionFactMarkerBase,
  type CalendarMonthCellEntryBase,
} from "@/features/planner/calendar-month-day-cell";
import { getGoalVisual, getWorkPillDraftFillStyle, getWorkPillFillStyle, getWorkRowEdgeStyle } from "@/features/planner/goal-visuals";
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
  showGoalColorEdge?: boolean;
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
  showGoalColorEdge = false,
  selectedEntryKey = null,
  shareEntryTransition = false,
  onConfirmDraftMove,
  onCancelDraftMove,
}: CalendarDayPreviewListProps<TEntry, TCompletionFactMarker>) {
  const expanded = density === "expanded";
  const links = usePlannerGoalLinks();
  const listRef = useRef<HTMLDivElement>(null);
  const [threadGoalId, setThreadGoalId] = useState<string | null>(null);
  const [thread, setThread] = useState<{
    height: number;
    segments: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  } | null>(null);
  useLayoutEffect(() => {
    const root = listRef.current;
    if (!root || !threadGoalId) {
      setThread(null);
      return;
    }
    const related = directLinkedGoalIds(links, threadGoalId);
    const rows = [...root.querySelectorAll<HTMLElement>("[data-plan-goal-id]")];
    const focusRows = rows.filter((row) => row.dataset.planGoalId === threadGoalId);
    const rootRect = root.getBoundingClientRect();
    const center = (node: HTMLElement) => {
      const mark = node.querySelector<HTMLElement>("[data-plan-link-mark]") ?? node;
      const rect = mark.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2 - rootRect.left + root.scrollLeft,
        y: rect.top + rect.height / 2 - rootRect.top + root.scrollTop,
      };
    };
    const segments = focusRows.flatMap((from) => {
      const start = center(from);
      return rows.flatMap((to) => {
        const goalId = to.dataset.planGoalId;
        if (!goalId || !related.has(goalId)) return [];
        const end = center(to);
        return [{ x1: start.x, y1: start.y, x2: end.x, y2: end.y }];
      });
    });
    setThread(segments.length > 0 ? { height: root.scrollHeight, segments } : null);
  }, [entries, links, threadGoalId]);
  return (
    <div
      ref={listRef}
      className={`relative overflow-x-hidden [&>svg+*]:border-t-0 ${
        expanded
          ? "divide-y"
          : "max-h-44 space-y-1.5 overflow-y-auto overscroll-y-auto text-xs [touch-action:pan-y] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      }`}
    >
      {thread ? (
        <svg
          className="pointer-events-none absolute left-0 top-0 w-full text-muted-foreground"
          height={thread.height}
          aria-hidden="true"
        >
          {thread.segments.map((segment, index) => (
            <line
              key={`${segment.x1}-${segment.y1}-${segment.x2}-${segment.y2}-${index}`}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
              stroke="currentColor"
              strokeWidth="1.5"
            />
          ))}
        </svg>
      ) : null}
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
                : isDraft
                  ? undefined
                  : expanded
                    ? showGoalColorEdge
                      ? getWorkRowEdgeStyle(visual.color)
                      : undefined
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
                            getEntryGhostClasses(entry)
                          } ${
                            immovable ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing"
                          } ${isDragging ? "pointer-events-none opacity-0" : ""}`
                        : `${styles.sessionTile} border ${
                            shareEntryTransition ? PLAN_MORPH_CLASS : ""
                          } ${pillToneClasses} ${
                            getEntryGhostClasses(entry)
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
                    data-plan-goal-id={entry.originalGoalId}
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
                              : "flex min-h-6 min-w-0 items-center truncate type-item leading-snug"
                          }
                        >
                          <CompletionTitle
                            completed={credited || currentlyCredited}
                          >
                            {displayTitle}
                          </CompletionTitle>
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
                            {/^milestone:\d+$/.test(entry.unitKey) ? <>Milestone: <MilestoneTitleEditor goalId={entry.originalGoalId} unitKey={entry.unitKey} label={entry.label ?? "Milestone"} disabled={entry.draftGhost} /></> : subtitle}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <LinkedGoalMarks
                      outgoing={Boolean(entry.hasLinkedTargets)}
                      incoming={Boolean(entry.hasIncomingLinks)}
                      pressed={threadGoalId === entry.originalGoalId}
                      onToggle={
                        entry.hasLinkedTargets || entry.hasIncomingLinks
                          ? () => {
                              setThreadGoalId((current) =>
                                current === entry.originalGoalId ? null : entry.originalGoalId
                              );
                            }
                          : undefined
                      }
                    />
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
                              : "truncate type-item"
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
