"use client";

import { useCallback, useMemo, useState } from "react";
import {
  CADENCE_CHOICES,
  cloneDayWorkItems,
  DATE_CHOICES,
  formatPrettyDate,
  type DayWorkFact,
  type DayWorkItem,
} from "@/features/ux-day-work/seed";

export function useDayWorkSession(initialSelectedId: string | null = null) {
  const [items, setItems] = useState<DayWorkItem[]>(cloneDayWorkItems);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [editingFact, setEditingFact] = useState<DayWorkFact | null>(null);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const remaining = items.filter((item) => !item.completed).length;

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setEditingFact(null);
  }, []);

  const toggleOpen = useCallback((id: string) => {
    setSelectedId((current) => (current === id ? null : id));
    setEditingFact(null);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: !item.completed,
              periodDone: item.completed
                ? Math.max(0, item.periodDone - 1)
                : Math.min(item.periodTarget, item.periodDone + 1),
            }
          : item,
      ),
    );
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<DayWorkItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const applyFact = useCallback(
    (id: string, fact: DayWorkFact, value: string | null) => {
      setItems((current) =>
        current.map((item) => {
          if (item.id !== id) return item;
          if (fact === "title") return { ...item, title: value ?? item.title };
          if (fact === "time") return { ...item, time: value };
          if (fact === "deadline") return { ...item, endDate: value };
          if (fact === "lock") return { ...item, locked: !item.locked };
          if (fact === "difficulty") {
            return {
              ...item,
              difficulty:
                value === "easy" || value === "hard" || value === "medium"
                  ? value
                  : item.difficulty,
            };
          }
          if (fact === "date") {
            const choice = DATE_CHOICES.find((entry) => entry.value === value);
            const nextInstance = choice
              ? {
                  date: choice.value,
                  weekday: choice.weekday,
                  short: choice.short,
                }
              : value
                ? {
                    date: value,
                    weekday: new Date(`${value}T12:00:00`).toLocaleDateString(
                      "en-US",
                      { weekday: "long" },
                    ),
                    short: formatPrettyDate(value),
                  }
                : item.instances[item.instanceIndex];
            const instances = [...item.instances];
            instances[item.instanceIndex] = nextInstance;
            return {
              ...item,
              instances,
              unplaced: false,
            };
          }
          if (fact === "cadence") {
            const choice = CADENCE_CHOICES.find((entry) => entry.id === value);
            if (!choice) return item;
            if (choice.id === "task") {
              return {
                ...item,
                kind: "task",
                frequencyType: "task",
                recurrence: null,
                targetCount: 1,
                targetBasis: "lifetime",
                periodTarget: 1,
                periodUnit: "total",
              };
            }
            return {
              ...item,
              kind: "goal",
              frequencyType: "recurring",
              recurrence: choice.recurrence,
              targetCount: choice.count,
              targetBasis: "period",
              periodTarget: choice.count,
              periodUnit: choice.recurrence === "daily" ? "day" : "week",
            };
          }
          return item;
        }),
      );
      setEditingFact(null);
    },
    [],
  );

  const shiftInstance = useCallback((id: string, direction: -1 | 1) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = item.instanceIndex + direction;
        if (next < 0 || next >= item.instances.length) return item;
        return { ...item, instanceIndex: next };
      }),
    );
    setEditingFact(null);
  }, []);

  const jumpInstance = useCallback((id: string, to: "first" | "last") => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          instanceIndex: to === "first" ? 0 : Math.max(0, item.instances.length - 1),
        };
      }),
    );
    setEditingFact(null);
  }, []);

  const canShift = useCallback(
    (item: DayWorkItem, direction: -1 | 1) => {
      const next = item.instanceIndex + direction;
      return next >= 0 && next < item.instances.length;
    },
    [],
  );

  return {
    items,
    selected,
    selectedId,
    editingFact,
    remaining,
    setEditingFact,
    select,
    toggleOpen,
    toggleComplete,
    updateItem,
    applyFact,
    shiftInstance,
    jumpInstance,
    canShift,
  };
}

export type DayWorkSession = ReturnType<typeof useDayWorkSession>;
