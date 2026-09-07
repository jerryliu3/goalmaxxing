"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type DragCancelEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { plannerCollisionDetection } from "@/features/planner/planner-dnd-collision";
import {
  parsePlannerDragTarget,
  parsePlannerEntryDragId,
  plannerDayDropId,
  plannerEntryDragId,
  plannerPreviewEntryDragId,
  plannerPreviewEntryDropId,
  type PlannerDragTarget,
} from "@/features/planner/planner-drag-target";

export {
  plannerDayDropId,
  plannerEntryDragId,
  plannerPreviewEntryDragId,
  plannerPreviewEntryDropId,
  type PlannerDragTarget,
};

function sortableItemStyle(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
  transition: string | undefined
): CSSProperties {
  return {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
      : undefined,
    transition,
    touchAction: "none",
  };
}

const MOUSE_PRESS_TO_DRAG_DELAY_MS = 120;
const MOUSE_PRESS_TO_DRAG_TOLERANCE_PX = 24;
const TOUCH_PRESS_TO_DRAG_DELAY_MS = 180;
const TOUCH_PRESS_TO_DRAG_TOLERANCE_PX = 10;

interface PlannerDndProviderProps {
  children: ReactNode;
  getEntryLabel: (entryKey: string) => string;
  getDayLabel: (day: string) => string;
  renderDragOverlay?: (entryKey: string) => ReactNode;
  onEntryDragStart: (entryKey: string) => void;
  onEntryDragOverTarget?: (
    entryKey: string,
    target: PlannerDragTarget
  ) => void;
  onEntryDragEnd: (entryKey: string, target: PlannerDragTarget) => void;
  onEntryDragCancel: (entryKey: string | null) => void;
}

export function PlannerDndProvider({
  children,
  getEntryLabel,
  getDayLabel,
  renderDragOverlay,
  onEntryDragStart,
  onEntryDragOverTarget,
  onEntryDragEnd,
  onEntryDragCancel,
}: PlannerDndProviderProps) {
  const [activeEntryKey, setActiveEntryKey] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        delay: MOUSE_PRESS_TO_DRAG_DELAY_MS,
        tolerance: MOUSE_PRESS_TO_DRAG_TOLERANCE_PX,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: TOUCH_PRESS_TO_DRAG_DELAY_MS,
        tolerance: TOUCH_PRESS_TO_DRAG_TOLERANCE_PX,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const announcements = useMemo(
    () => ({
      onDragStart({ active }: DragStartEvent) {
        const entryKey = parsePlannerEntryDragId(active.id);
        return entryKey
          ? `Picked up ${getEntryLabel(entryKey)}.`
          : "Picked up planner session.";
      },
      onDragOver({ active, over }: DragOverEvent) {
        const entryKey = parsePlannerEntryDragId(active.id);
        if (!entryKey) {
          return;
        }
        const target = over ? parsePlannerDragTarget(over.id) : null;
        if (!target) {
          return `${getEntryLabel(entryKey)} is not over a valid target.`;
        }
        if (target.type === "day") {
          return `${getEntryLabel(entryKey)} over ${getDayLabel(target.day)}.`;
        }
        return `${getEntryLabel(entryKey)} over ${getEntryLabel(target.entryKey)} in this day.`;
      },
      onDragEnd({ active, over }: DragEndEvent) {
        const entryKey = parsePlannerEntryDragId(active.id);
        if (!entryKey) {
          return;
        }
        const target = over ? parsePlannerDragTarget(over.id) : null;
        if (!target) {
          return `Dropped ${getEntryLabel(entryKey)} outside a valid target.`;
        }
        if (target.type === "day") {
          return `Dropped ${getEntryLabel(entryKey)} on ${getDayLabel(target.day)}.`;
        }
        return `Dropped ${getEntryLabel(entryKey)} near ${getEntryLabel(target.entryKey)} in this day.`;
      },
      onDragCancel({ active }: DragCancelEvent) {
        const entryKey = parsePlannerEntryDragId(active.id);
        return entryKey
          ? `Cancelled drag for ${getEntryLabel(entryKey)}.`
          : "Cancelled drag.";
      },
    }),
    [getDayLabel, getEntryLabel]
  );

  const handleDragStart = ({ active }: DragStartEvent) => {
    const entryKey = parsePlannerEntryDragId(active.id);
    if (!entryKey) {
      return;
    }
    setActiveEntryKey(entryKey);
    onEntryDragStart(entryKey);
  };

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    const entryKey = parsePlannerEntryDragId(active.id);
    if (!entryKey) {
      return;
    }
    const target = over ? parsePlannerDragTarget(over.id) : null;
    onEntryDragOverTarget?.(entryKey, target);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    const entryKey = parsePlannerEntryDragId(active.id);
    setActiveEntryKey(null);
    if (!entryKey) {
      onEntryDragCancel(null);
      return;
    }
    const target = over ? parsePlannerDragTarget(over.id) : null;
    onEntryDragEnd(entryKey, target);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={plannerCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={({ active }) => {
        setActiveEntryKey(null);
        onEntryDragCancel(parsePlannerEntryDragId(active.id));
      }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Press space to pick up, use arrow keys to move between calendar days, then press space again to drop.",
        },
      }}
    >
      {children}
      <DragOverlay zIndex={4000}>
        {activeEntryKey && renderDragOverlay
          ? renderDragOverlay(activeEntryKey)
          : null}
      </DragOverlay>
    </DndContext>
  );
}

interface PlannerDraggableEntryRenderProps {
  setNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  style: CSSProperties;
  isDragging: boolean;
  isOver: boolean;
}

interface PlannerDraggableEntryProps {
  entryKey: string;
  day?: string;
  disabled?: boolean;
  children: (props: PlannerDraggableEntryRenderProps) => ReactNode;
}

export function PlannerSortableDayList({
  day,
  entryKeys,
  children,
}: {
  day: string;
  entryKeys: readonly string[];
  children: ReactNode;
}) {
  return (
    <SortableContext
      items={entryKeys.map((entryKey) => plannerPreviewEntryDropId(day, entryKey))}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  );
}

export function PlannerDraggableEntry({
  entryKey,
  day,
  disabled = false,
  children,
}: PlannerDraggableEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: day
      ? plannerPreviewEntryDropId(day, entryKey)
      : plannerEntryDragId(entryKey),
    data: { entryKey, day },
    disabled,
  });
  return children({
    setNodeRef,
    attributes,
    listeners,
    style: sortableItemStyle(transform, transition),
    isDragging,
    isOver: isOver && !isDragging,
  });
}

interface PlannerDroppableDayProps {
  day: string;
  children: (props: {
    setNodeRef: (node: HTMLElement | null) => void;
    isOver: boolean;
  }) => ReactNode;
}

export function PlannerDroppableDay({
  day,
  children,
}: PlannerDroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: plannerDayDropId(day),
    data: { day },
  });
  return children({ setNodeRef, isOver });
}

interface PlannerDraggablePreviewEntryProps {
  day: string;
  entryKey: string;
  disabled?: boolean;
  children: (
    props: PlannerDraggableEntryRenderProps & {
      isOver: boolean;
      setActivatorNodeRef: (node: HTMLElement | null) => void;
    }
  ) => ReactNode;
}

export function PlannerDraggablePreviewEntry({
  day,
  entryKey,
  disabled = false,
  children,
}: PlannerDraggablePreviewEntryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: plannerPreviewEntryDropId(day, entryKey),
    data: { entryKey, day },
    disabled,
  });
  return children({
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    style: sortableItemStyle(transform, transition),
    isDragging,
    isOver: isOver && !isDragging,
  });
}

