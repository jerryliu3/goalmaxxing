"use client";

import { Button } from "@/components/ui/button";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { getEntryDraftDiffSummary, isEntryCredited } from "@/features/planner/calendar-format";
import { LinkedTargetsNote } from "@/features/planner/linked-targets-note";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import { QuestFact, WorkQuestCard } from "@/features/planner/work-quest-card";
import {
  formatQuestSittingDate,
  formatQuestSittingTime,
  projectPlannerEntryWorkQuest,
} from "@/features/planner/work-quest-model";
import type { ChecklistGoalPresentation } from "@/lib/goals/checklist-presentation";
import type { Goal } from "@/lib/goals/types";

export interface PlannerEventDetailDialogCallbacks {
  onOpenChange: (open: boolean) => void;
  onUpdateDraftScheduledDate: (entry: PlannerDayDetailEntry, nextDate: string) => void;
  onUpdateDraftScheduledTimeOverride: (
    entry: PlannerDayDetailEntry,
    nextTime: string
  ) => void;
  onToggleItemLock: (entry: PlannerDayDetailEntry) => void;
  onNavigateToFirstOpenInstance: () => void;
  onNavigateToPreviousOpenInstance: () => void;
  onNavigateToNextOpenInstance: () => void;
  onNavigateToLastOpenInstance: () => void;
}

interface PlannerEventDetailDialogProps {
  selectedEventEntry: PlannerDayDetailEntry | null;
  selectedEventLinkedTargets: Array<{
    sourceGoalId: string;
    targetGoalId: string;
    targetSuppressionKind: "none" | "until" | "indefinite";
    targetResumesOn: string | null;
  }>;
  selectedEventGoal: Goal | null;
  selectedEventPresentation: ChecklistGoalPresentation | null;
  goalTitles: Record<string, string>;
  scopeMonth: string;
  selectedEventBaselineUnit:
    | {
        effectiveScheduledLocalTime?: string | null;
      }
    | null;
  selectedEventDraftScheduledDate: string | null;
  selectedEventDraftTimeInputValue: string;
  mutationLoadingKey: string | null;
  canMutatePlanItems: boolean;
  canNavigateToFirstOpenInstance: boolean;
  canNavigateToPreviousOpenInstance: boolean;
  canNavigateToNextOpenInstance: boolean;
  canNavigateToLastOpenInstance: boolean;
  callbacks: PlannerEventDetailDialogCallbacks;
}

export function PlannerEventDetailDialog({
  selectedEventEntry,
  selectedEventLinkedTargets,
  selectedEventGoal,
  selectedEventPresentation,
  goalTitles,
  scopeMonth,
  selectedEventBaselineUnit,
  selectedEventDraftScheduledDate,
  selectedEventDraftTimeInputValue,
  mutationLoadingKey,
  canMutatePlanItems,
  canNavigateToFirstOpenInstance,
  canNavigateToPreviousOpenInstance,
  canNavigateToNextOpenInstance,
  canNavigateToLastOpenInstance,
  callbacks,
}: PlannerEventDetailDialogProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [factEditor, setFactEditor] = useState<{
    entryKey: string;
    fact: "date" | "time";
  } | null>(null);
  const selectedEntryKey = selectedEventEntry?.key ?? null;
  const editingFact =
    factEditor?.entryKey === selectedEntryKey ? factEditor.fact : null;
  const toggleFactEditor = (fact: "date" | "time") => {
    setFactEditor((current) =>
      current?.entryKey === selectedEntryKey && current.fact === fact
        ? null
        : selectedEntryKey
          ? { entryKey: selectedEntryKey, fact }
          : null
    );
  };
  // Re-resolve when the projected entry changes because editing the date can move
  // the slot to another day's list while the entry key stays the same.
  useLayoutEffect(() => {
    const slot = selectedEntryKey
      ? Array.from(
          document.querySelectorAll<HTMLElement>("[data-plan-checklist-editor-slot]")
        ).find((node) => node.dataset.planChecklistEditorSlot === selectedEntryKey) ??
        null
      : null;
    // The portal target is rendered by the day list in the same commit that opens this
    // editor, so it can only be resolved afterwards. A node owned by a sibling subtree
    // is reachable neither at render time nor through a callback ref.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHost((current) => (current === slot ? current : slot));
  }, [selectedEntryKey, selectedEventEntry]);
  if (!selectedEventEntry) return null;

  const dateLabel =
    formatQuestSittingDate(selectedEventDraftScheduledDate) ?? "an unset date";
  const effectiveTimeInputValue =
    selectedEventDraftTimeInputValue ||
    selectedEventEntry.effectiveScheduledLocalTime ||
    selectedEventBaselineUnit?.effectiveScheduledLocalTime ||
    "";
  const timeLabel = formatQuestSittingTime(effectiveTimeInputValue) ?? "any time";
  const activeItem = selectedEventEntry.activeItem;
  const mutationPending = Boolean(mutationLoadingKey);
  const lockPending = activeItem
    ? mutationLoadingKey === `lock:${activeItem.id}`
    : false;
  const draftDiffSummary = getEntryDraftDiffSummary(selectedEventEntry);

  const leadingNav = (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Go to first open instance"
        onClick={callbacks.onNavigateToFirstOpenInstance}
        disabled={!canNavigateToFirstOpenInstance}
      >
        <ChevronsLeft />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Go to previous open instance"
        onClick={callbacks.onNavigateToPreviousOpenInstance}
        disabled={!canNavigateToPreviousOpenInstance}
      >
        <ChevronLeft />
      </Button>
    </>
  );
  const trailingNav = (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Go to next open instance"
        onClick={callbacks.onNavigateToNextOpenInstance}
        disabled={!canNavigateToNextOpenInstance}
      >
        <ChevronRight />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Go to last open instance"
        onClick={callbacks.onNavigateToLastOpenInstance}
        disabled={!canNavigateToLastOpenInstance}
      >
        <ChevronsRight />
      </Button>
    </>
  );

  const editor = (
    <section
      aria-label="Edit planned session"
      data-plan-entry-editor="true"
      className="plan-row-unfold my-2 min-w-0"
      onKeyDown={(event) => {
        if (event.key !== "Escape") {
          return;
        }
        if (editingFact) {
          event.stopPropagation();
          setFactEditor(null);
          return;
        }
        callbacks.onOpenChange(false);
      }}
    >
      <WorkQuestCard
        quest={projectPlannerEntryWorkQuest({
          entry: selectedEventEntry,
          goal: selectedEventGoal,
          presentation: selectedEventPresentation,
          completed: isEntryCredited(selectedEventEntry),
        })}
        leadingNav={leadingNav}
        trailingNav={trailingNav}
      >
        <div className="min-w-0 space-y-2 text-sm">
          {selectedEventEntry.hasLinkedTargets ? (
            <LinkedTargetsNote
              linkedTargets={selectedEventLinkedTargets}
              goalTitles={goalTitles}
              scopeMonth={scopeMonth}
            />
          ) : null}
          {draftDiffSummary ? (
            <p className="text-sm text-muted-foreground">{draftDiffSummary}</p>
          ) : null}
          {selectedEventEntry.draftGhost ? (
            <p className="text-sm text-muted-foreground">
              This marker shows where the session was originally scheduled before your
              preview move. Edit the moved session on its new date to change or undo the
              move.
            </p>
          ) : (
            <>
              <p className="leading-relaxed">
                Session scheduled for{" "}
                {canMutatePlanItems ? (
                  <QuestFact
                    active={editingFact === "date"}
                    onSelect={() => toggleFactEditor("date")}
                  >
                    {dateLabel}
                  </QuestFact>
                ) : (
                  dateLabel
                )}{" "}
                at{" "}
                {canMutatePlanItems ? (
                  <QuestFact
                    active={editingFact === "time"}
                    onSelect={() => toggleFactEditor("time")}
                  >
                    {timeLabel}
                  </QuestFact>
                ) : (
                  timeLabel
                )}
                {activeItem ? (
                  <>
                    , and is{" "}
                    <QuestFact
                      pressed={activeItem.locked}
                      disabled={mutationPending || !canMutatePlanItems}
                      onSelect={() => {
                        callbacks.onToggleItemLock(selectedEventEntry);
                      }}
                    >
                      {lockPending
                        ? "saving…"
                        : activeItem.locked
                          ? "locked to today"
                          : "not locked to today"}
                    </QuestFact>
                  </>
                ) : null}
                .{" "}
                <Link
                  href={`/goals/${selectedEventEntry.originalGoalId}`}
                  className="font-medium underline underline-offset-4"
                >
                  Edit goal
                </Link>
              </p>
              {canMutatePlanItems && editingFact === "date" ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Date
                  <Input
                    type="date"
                    value={selectedEventDraftScheduledDate ?? ""}
                    onChange={(event) =>
                      callbacks.onUpdateDraftScheduledDate(
                        selectedEventEntry,
                        event.target.value
                      )
                    }
                    className="h-9 text-sm"
                  />
                </label>
              ) : null}
              {canMutatePlanItems && editingFact === "time" ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Time
                  <Input
                    type="time"
                    step={60}
                    value={effectiveTimeInputValue}
                    onChange={(event) =>
                      callbacks.onUpdateDraftScheduledTimeOverride(
                        selectedEventEntry,
                        event.target.value
                      )
                    }
                    className="h-9 text-sm"
                  />
                </label>
              ) : null}
            </>
          )}
        </div>
      </WorkQuestCard>
    </section>
  );

  return host ? createPortal(editor, host) : editor;
}
