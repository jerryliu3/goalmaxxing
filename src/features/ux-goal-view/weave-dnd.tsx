"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, KeyboardSensor, useSensor, useSensors, type KeyboardCoordinateGetter } from "@dnd-kit/core";
import { PlannerMouseSensor, PlannerTouchSensor } from "@/features/planner/planner-dnd-sensors";
import { plannerCollisionDetection } from "@/features/planner/planner-dnd-collision";
import { parsePlannerDragTarget, parsePlannerEntryDragId } from "@/features/planner/planner-drag-target";
import { dateLabel } from "./model";
import type { GoalViewStudySession } from "./use-study";
import { studyTheme } from "./theme";

export function WeaveDnd({ children, study, dayWidth }: { children: ReactNode; study: GoalViewStudySession; dayWidth: number }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
    if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return undefined;
    event.preventDefault();
    return { x: currentCoordinates.x + (event.code === "ArrowLeft" ? -dayWidth : dayWidth), y: currentCoordinates.y };
  };
  const sensors = useSensors(
    useSensor(PlannerMouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(PlannerTouchSensor, { activationConstraint: { delay: 250, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );
  const active = study.state.sessions.find(s => s.id === activeId);
  return <DndContext sensors={sensors} collisionDetection={plannerCollisionDetection}
    onDragStart={({ active }) => setActiveId(parsePlannerEntryDragId(active.id))}
    onDragCancel={() => setActiveId(null)}
    onDragEnd={({ active, over }) => {
      setActiveId(null);
      const id = parsePlannerEntryDragId(active.id);
      const target = over ? parsePlannerDragTarget(over.id) : null;
      const session = study.state.sessions.find(s => s.id === id);
      if (session && target?.type === "day") study.dispatch({ type: "edit", id: session.id, date: target.day, time: session.time });
    }}
    accessibility={{ screenReaderInstructions: { draggable: "Press Space to pick up a session. Left and right arrows change its date. Press Space to drop, or Escape to cancel. You can also open the session to use the date editor." }, announcements: {
      onDragStart: ({ active }) => `Picked up ${study.state.sessions.find(s => s.id === parsePlannerEntryDragId(active.id))?.name ?? "session"}.`,
      onDragOver: ({ over }) => { const target = over ? parsePlannerDragTarget(over.id) : null; return target?.type === "day" ? `Move to ${dateLabel(target.day)}.` : "Choose a date column."; },
      onDragEnd: () => "Move finished. Review the date change before saving.",
      onDragCancel: () => "Move cancelled.",
    } }}>
    {children}
    {mounted && createPortal(<DragOverlay dropAnimation={null}>{active && <div className="tw-drag-overlay" style={{ ...studyTheme, width: dayWidth - 12 }}><strong>{active.name}</strong><span>{active.time || "Any time"}</span></div>}</DragOverlay>, document.body)}
  </DndContext>;
}
