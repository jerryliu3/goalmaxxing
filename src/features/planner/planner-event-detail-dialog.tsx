"use client";

import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { TempoGoalCard } from "@/features/goals/tempo-goal-card";
import { getEntryDraftDiffSummary, getEntrySubtitle } from "@/features/planner/calendar-format";
import { LinkedTargetsNote } from "@/features/planner/linked-targets-note";
import {
  formatSittingDate,
  formatSittingTime,
  snapshotToCreationFields,
} from "@/features/planner/planner-folio-fields";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";

export interface PlannerEventDetailDialogCallbacks {
  onOpenChange: (open: boolean) => void;
  onUpdateDraftLabel: (entry: PlannerDayDetailEntry, nextLabel: string) => void;
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

type FolioFact = "title" | "date" | "time";

interface PlannerEventDetailDialogProps {
  selectedEventEntry: PlannerDayDetailEntry | null;
  selectedEventLinkedTargets: Array<{
    sourceGoalId: string;
    targetGoalId: string;
    targetSuppressionKind: "none" | "until" | "indefinite";
    targetResumesOn: string | null;
  }>;
  goalTitles: Record<string, string>;
  scopeMonth: string;
  selectedEventDraftEdit:
    | {
        label?: string | null;
        scheduledDate?: string | null;
        scheduledTimeOverride?: string | null;
      }
    | undefined;
  selectedEventBaselineUnit:
    | {
        effectiveScheduledLocalTime?: string | null;
        scheduledTimeOverride?: string | null;
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
  getEntryGoalFirstTitleWithTime: (entry: PlannerDayDetailEntry) => string;
  callbacks: PlannerEventDetailDialogCallbacks;
}

export function PlannerEventDetailDialog({
  selectedEventEntry,
  selectedEventLinkedTargets,
  goalTitles,
  scopeMonth,
  selectedEventDraftEdit,
  selectedEventBaselineUnit,
  selectedEventDraftScheduledDate,
  selectedEventDraftTimeInputValue,
  mutationLoadingKey,
  canMutatePlanItems,
  canNavigateToFirstOpenInstance,
  canNavigateToPreviousOpenInstance,
  canNavigateToNextOpenInstance,
  canNavigateToLastOpenInstance,
  getEntryGoalFirstTitleWithTime,
  callbacks,
}: PlannerEventDetailDialogProps) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [editingFact, setEditingFact] = useState<FolioFact | null>(null);
  const selectedEntryKey = selectedEventEntry?.key ?? null;
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
    setEditingFact(null);
  }, [selectedEntryKey, selectedEventEntry]);
  if (!selectedEventEntry) return null;

  const title =
    selectedEventDraftEdit?.label ??
    selectedEventEntry.goalTitle ??
    selectedEventEntry.label ??
    "";
  const fields = snapshotToCreationFields(selectedEventEntry.activeGoal, title);
  const sittingTime =
    selectedEventDraftTimeInputValue ||
    selectedEventEntry.effectiveScheduledLocalTime ||
    selectedEventBaselineUnit?.effectiveScheduledLocalTime ||
    null;
  const toggleFact = (fact: FolioFact) =>
    setEditingFact((current) => (current === fact ? null : fact));

  const content = (
    <section
      aria-label="Edit planned session"
      data-plan-entry-editor="true"
      className="plan-row-unfold my-2 min-w-0"
      onKeyDown={(event) => {
        if (event.key === "Escape") callbacks.onOpenChange(false);
      }}
    >
      {selectedEventEntry.hasLinkedTargets ? (
        <LinkedTargetsNote
          linkedTargets={selectedEventLinkedTargets}
          goalTitles={goalTitles}
          scopeMonth={scopeMonth}
        />
      ) : null}
      {getEntryDraftDiffSummary(selectedEventEntry) ? (
        <p className="mb-2 text-xs text-muted-foreground">
          {getEntryDraftDiffSummary(selectedEventEntry)}
        </p>
      ) : null}
      {getEntrySubtitle(selectedEventEntry) ? (
        <p className="mb-2 text-xs text-muted-foreground">
          {getEntrySubtitle(selectedEventEntry)}
        </p>
      ) : null}
      {selectedEventEntry.draftGhost ? (
        <div className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
          This marker shows where the session was originally scheduled before your
          preview move. Edit the moved session on its new date to change or undo the
          move.
        </div>
      ) : (
        <TempoGoalCard
          fields={fields}
          context="inspect"
          density="compact"
          visibility={{
            category: true,
            rhythm: true,
            interval: true,
            count: true,
            schedule: true,
            difficulty: Boolean(selectedEventEntry.activeGoal?.difficulty),
          }}
          titleContent={
            editingFact === "title" ? (
              <Input
                value={title}
                onChange={(event) =>
                  callbacks.onUpdateDraftLabel(selectedEventEntry, event.target.value)
                }
                placeholder="Goal title"
                aria-label="Title"
                className="h-9 bg-transparent text-base"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="tempo-card-fact text-left"
                onClick={() => toggleFact("title")}
              >
                {title.trim() || "Something worth starting."}
              </button>
            )
          }
          kickerEnd={
            <span className="tempo-card-nav flex items-center gap-2">
              <FolioNav
                label="Go to first open instance"
                disabled={!canNavigateToFirstOpenInstance}
                onClick={callbacks.onNavigateToFirstOpenInstance}
              >
                First
              </FolioNav>
              <FolioNav
                label="Go to previous open instance"
                disabled={!canNavigateToPreviousOpenInstance}
                onClick={callbacks.onNavigateToPreviousOpenInstance}
              >
                Prev
              </FolioNav>
              <FolioNav
                label="Go to next open instance"
                disabled={!canNavigateToNextOpenInstance}
                onClick={callbacks.onNavigateToNextOpenInstance}
              >
                Next
              </FolioNav>
              <FolioNav
                label="Go to last open instance"
                disabled={!canNavigateToLastOpenInstance}
                onClick={callbacks.onNavigateToLastOpenInstance}
              >
                Last
              </FolioNav>
            </span>
          }
        />
      )}
      {selectedEventEntry.draftGhost ? null : (
        <div className="mt-3 space-y-2 px-0.5">
          <p className="text-sm leading-relaxed">
            This sitting{" "}
            {editingFact === "date" ? (
              <Input
                type="date"
                aria-label="Date"
                value={selectedEventDraftScheduledDate ?? ""}
                onChange={(event) =>
                  callbacks.onUpdateDraftScheduledDate(
                    selectedEventEntry,
                    event.target.value
                  )
                }
                className="inline-flex h-8 w-auto bg-transparent text-sm"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="tempo-card-fact"
                onClick={() => toggleFact("date")}
              >
                {formatSittingDate(selectedEventDraftScheduledDate)}
              </button>
            )}{" "}
            at{" "}
            {editingFact === "time" ? (
              <Input
                type="time"
                step={60}
                aria-label="Time"
                value={selectedEventDraftTimeInputValue}
                onChange={(event) =>
                  callbacks.onUpdateDraftScheduledTimeOverride(
                    selectedEventEntry,
                    event.target.value
                  )
                }
                className="inline-flex h-8 w-auto bg-transparent text-sm"
                autoFocus
              />
            ) : (
              <button
                type="button"
                className="tempo-card-fact"
                onClick={() => toggleFact("time")}
              >
                {formatSittingTime(sittingTime)}
              </button>
            )}
            {selectedEventEntry.activeItem ? (
              <>
                {" · "}
                <button
                  type="button"
                  className="tempo-card-fact"
                  onClick={() => {
                    if (!canMutatePlanItems || mutationLoadingKey) return;
                    callbacks.onToggleItemLock(selectedEventEntry);
                  }}
                  disabled={Boolean(mutationLoadingKey) || !canMutatePlanItems}
                >
                  {mutationLoadingKey === `lock:${selectedEventEntry.activeItem.id}`
                    ? "Saving..."
                    : selectedEventEntry.activeItem.locked
                      ? "Locked"
                      : "Unlocked"}
                </button>
              </>
            ) : null}
          </p>
          {selectedEventEntry.activeItem ? (
            <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
              Tap a fact to change this sitting ·{" "}
              <Link
                href={`/goals/${selectedEventEntry.originalGoalId}`}
                className="underline-offset-4 hover:underline"
              >
                Edit goal
              </Link>
            </p>
          ) : (
            <p className="text-[0.68rem] uppercase tracking-[0.12em] text-muted-foreground">
              Tap a fact to change this sitting
            </p>
          )}
        </div>
      )}
      <span className="sr-only">{getEntryGoalFirstTitleWithTime(selectedEventEntry)}</span>
    </section>
  );
  return host ? createPortal(content, host) : content;
}

function FolioNav({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="opacity-70 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
