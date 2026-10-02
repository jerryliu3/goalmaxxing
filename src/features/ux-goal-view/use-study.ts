"use client";

import { useReducer, useState } from "react";
import { draftCount, initialStudyState, studyReducer } from "./model";

export function useGoalViewStudy() {
  const [state, dispatch] = useReducer(studyReducer, undefined, initialStudyState);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<string | null>(null);
  return { state, dispatch, edits: draftCount(state), editingId, setEditingId, calendarDate, setCalendarDate };
}
export type GoalViewStudySession = ReturnType<typeof useGoalViewStudy>;
