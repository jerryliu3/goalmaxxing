"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  draftCommandReducer,
  initialDraftCommandState,
  type DraftCommandAction,
  type DraftCommandState,
} from "@/features/planner/draft-command-reducer";
import type { PlannerContextPayload } from "@/features/planner/calendar-surface.types";
import type { PlannerPolicy } from "@/lib/planner/policy";

export function useCalendarDraftState() {
  const [draftPolicy, setDraftPolicy] = useState<PlannerPolicy | null>(null);
  const [draftPreview, setDraftPreview] = useState<
    NonNullable<PlannerContextPayload["preview"]> | null
  >(null);
  const [draftPreviewWindow, setDraftPreviewWindow] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [draftCommandState, dispatchDraftCommand] = useReducer(
    draftCommandReducer,
    initialDraftCommandState
  );
  const draftPolicyRef = useRef<PlannerPolicy | null>(null);

  useEffect(() => {
    draftPolicyRef.current = draftPolicy;
  }, [draftPolicy]);

  const clearDraftSession = useCallback(() => {
    setDraftPolicy(null);
    setDraftPreview(null);
    setDraftPreviewWindow(null);
    dispatchDraftCommand({
      type: "clear",
    });
  }, []);

  return {
    draftPolicy,
    setDraftPolicy,
    draftPreview,
    setDraftPreview,
    draftPreviewWindow,
    setDraftPreviewWindow,
    draftCommandState,
    dispatchDraftCommand: dispatchDraftCommand as React.Dispatch<DraftCommandAction>,
    draftPolicyRef,
    clearDraftSession,
  };
}

export type CalendarDraftCommandState = DraftCommandState;
