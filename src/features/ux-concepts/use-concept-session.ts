"use client";

import { addDays, format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CONCEPT_TODAY,
  conceptItems,
  itemsOnDate,
  applicableItems as applicableItemsForDate,
  type ConceptItem,
} from "@/features/ux-concepts/seed";

export type ConceptHomeTab =
  | "today"
  | "plan"
  | "checklist"
  | "progress"
  | "community"
  | "you";

export function useConceptSession(homeTab: ConceptHomeTab) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    () =>
      new Set(conceptItems.filter((item) => item.completed).map((item) => item.id))
  );
  const [selectedDate, setSelectedDate] = useState<string>(CONCEPT_TODAY);
  const [recoveredTo, setRecoveredTo] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [coachOpen, setCoachOpen] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [newGoalOpen, setNewGoalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ConceptHomeTab>(homeTab);
  const [duoMode, setDuoMode] = useState<"solo" | "duo">("solo");

  const recovered = recoveredTo !== null;

  const dayItems = useMemo(
    () => itemsOnDate(selectedDate, recoveredTo),
    [recoveredTo, selectedDate]
  );

  const todayItems = useMemo(
    () => itemsOnDate(CONCEPT_TODAY, recoveredTo),
    [recoveredTo]
  );

  const applicableItems = useMemo(
    () => applicableItemsForDate(selectedDate, recoveredTo),
    [recoveredTo, selectedDate]
  );

  const remainingToday = useMemo(
    () => todayItems.filter((item) => !completedIds.has(item.id)),
    [completedIds, todayItems]
  );

  const remainingApplicable = useMemo(
    () => applicableItems.filter((item) => !completedIds.has(item.id)),
    [applicableItems, completedIds]
  );

  const remainingApplicableToday = useMemo(
    () =>
      applicableItemsForDate(CONCEPT_TODAY, recoveredTo).filter(
        (item) => !completedIds.has(item.id)
      ),
    [completedIds, recoveredTo]
  );

  const selectedItem = useMemo(
    () => conceptItems.find((item) => item.id === selectedItemId) ?? null,
    [selectedItemId]
  );

  const isComplete = useCallback(
    (id: string) => completedIds.has(id),
    [completedIds]
  );

  const toggleComplete = useCallback((id: string) => {
    setCompletedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const recoverStrengthToToday = useCallback(() => {
    setRecoveredTo(CONCEPT_TODAY);
    setSelectedDate(CONCEPT_TODAY);
    setRecoverOpen(false);
  }, []);

  const recoverStrengthToDate = useCallback((date: string) => {
    setRecoveredTo(date);
    setSelectedDate(date);
    setRecoverOpen(false);
  }, []);

  const shiftDate = useCallback((days: number) => {
    setSelectedDate((current) =>
      format(addDays(parseISO(current), days), "yyyy-MM-dd")
    );
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      if (event.key === "j" || event.key === "J") {
        shiftDate(1);
      } else if (event.key === "k" || event.key === "K") {
        shiftDate(-1);
      } else if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        setNewGoalOpen(true);
      } else if (event.key === "Escape") {
        setSelectedItemId(null);
        setCoachOpen(false);
        setRecoverOpen(false);
        setNewGoalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shiftDate]);

  return {
    activeTab,
    applicableItems,
    coachOpen,
    dayItems,
    duoMode,
    isComplete,
    newGoalOpen,
    recoverOpen,
    recovered,
    recoveredTo,
    remainingApplicable,
    remainingApplicableToday,
    remainingToday,
    selectedDate,
    selectedItem,
    selectedItemId,
    setActiveTab,
    setCoachOpen,
    setDuoMode,
    setNewGoalOpen,
    setRecoverOpen,
    setSelectedDate,
    setSelectedItemId,
    shiftDate,
    todayItems,
    toggleComplete,
    recoverStrengthToToday,
    recoverStrengthToDate,
  };
}

export type ConceptSession = ReturnType<typeof useConceptSession>;

export function itemKindLabel(item: ConceptItem) {
  return item.kind === "task" ? "Task" : "Goal";
}
