"use client";

import { format, isValid, parse } from "date-fns";
import { useCallback } from "react";
import type { PlannerDayDetailEntry } from "@/features/planner/calendar-surface.types";
import type { MoveSourceCandidate } from "@/features/planner/planner-move-source-options";
import type { PlannerDayPreviewInteractions } from "@/features/planner/use-planner-day-preview-interactions";
import { usePlannerMoveSessionDialog } from "@/features/planner/use-planner-move-session-dialog";

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function useCalendarSurfaceMoveSession({
  moveDialogDay,
  setMoveDialogDay,
  setMoveDialogSourceEntryKey,
  effectiveMoveDialogSourceEntryKey,
  moveDialogSourceOptions,
  queueDraftMoveCommand,
  expandedPreviewDay,
  setExpandedPreviewDay,
  dayPreviewInteractions,
}: {
  moveDialogDay: string | null;
  setMoveDialogDay: (day: string | null) => void;
  setMoveDialogSourceEntryKey: (entryKey: string) => void;
  effectiveMoveDialogSourceEntryKey: string;
  moveDialogSourceOptions: MoveSourceCandidate[];
  queueDraftMoveCommand: (args: {
    entry: PlannerDayDetailEntry;
    nextDate: string;
    source: "date_input" | "drag_drop" | "coach";
  }) => boolean;
  expandedPreviewDay: string | null;
  setExpandedPreviewDay: (day: string | null) => void;
  dayPreviewInteractions: PlannerDayPreviewInteractions;
}) {
  const closeMoveDialog = useCallback(() => {
    setMoveDialogDay(null);
    setMoveDialogSourceEntryKey("");
  }, [setMoveDialogDay, setMoveDialogSourceEntryKey]);

  const { submitMoveDialog } = usePlannerMoveSessionDialog({
    moveDialogDay,
    effectiveMoveDialogSourceEntryKey,
    moveDialogSourceOptions,
    queueDraftMoveCommand,
    isValidIsoDate,
    closeMoveDialog,
  });

  const contractExpandedPreview = useCallback(() => {
    if (!expandedPreviewDay) {
      return;
    }
    const day = expandedPreviewDay;
    const dayCell = document.querySelector(
      `[data-day-cell="true"][data-day="${day}"]`
    );
    if (dayCell instanceof HTMLElement) {
      dayPreviewInteractions.openDayPreview({
        day,
        pinned: true,
        target: dayCell,
      });
    }
    setExpandedPreviewDay(null);
  }, [dayPreviewInteractions, expandedPreviewDay, setExpandedPreviewDay]);

  return {
    closeMoveDialog,
    submitMoveDialog,
    contractExpandedPreview,
  };
}
