"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  useDndContext,
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
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { plannerCollisionDetection } from "@/features/planner/planner-dnd-collision";
import {
  PlannerMouseSensor,
  PlannerTouchSensor,
} from "@/features/planner/planner-dnd-sensors";
import {
  parsePlannerDragTarget,
  parsePlannerEntryDragId,
  plannerDayDropId,
  plannerEntryDragId,
  plannerPreviewEntryDragId,
  plannerPreviewEntryDropId,
  type PlannerDragTarget,
  type PlannerSortableSurface,
} from "@/features/planner/planner-drag-target";

export {
  plannerDayDropId,
  plannerEntryDragId,
  plannerPreviewEntryDragId,
  plannerPreviewEntryDropId,
  type PlannerDragTarget,
  type PlannerSortableSurface,
};

function sortableItemStyle(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
  transition: string | undefined,
  isDragging: boolean
): CSSProperties {
  // Keep the source in its original slot while DragOverlay follows the pointer.
  // That hole stays a valid droppable so the item can be returned home.
  if (isDragging) {
    return { touchAction: "none" };
  }
  return {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0) scaleX(${transform.scaleX}) scaleY(${transform.scaleY})`
      : undefined,
    transition,
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
  const lastDragOverIdRef = useRef<string | number | null>(null);
  const sensors = useSensors(
    useSensor(PlannerMouseSensor, {
      activationConstraint: {
        delay: MOUSE_PRESS_TO_DRAG_DELAY_MS,
        tolerance: MOUSE_PRESS_TO_DRAG_TOLERANCE_PX,
      },
    }),
    useSensor(PlannerTouchSensor, {
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

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const entryKey = parsePlannerEntryDragId(active.id);
      if (!entryKey) {
        return;
      }
      lastDragOverIdRef.current = null;
      setActiveEntryKey(entryKey);
      onEntryDragStart(entryKey);
    },
    [onEntryDragStart]
  );

  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      const entryKey = parsePlannerEntryDragId(active.id);
      if (!entryKey) {
        return;
      }
      const overId = over?.id ?? null;
      if (overId === lastDragOverIdRef.current) {
        return;
      }
      lastDragOverIdRef.current = overId;
      const target = over ? parsePlannerDragTarget(over.id) : null;
      onEntryDragOverTarget?.(entryKey, target);
    },
    [onEntryDragOverTarget]
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      const entryKey = parsePlannerEntryDragId(active.id);
      lastDragOverIdRef.current = null;
      setActiveEntryKey(null);
      if (!entryKey) {
        onEntryDragCancel(null);
        return;
      }
      const target = over ? parsePlannerDragTarget(over.id) : null;
      onEntryDragEnd(entryKey, target);
    },
    [onEntryDragCancel, onEntryDragEnd]
  );

  const handleDragCancel = useCallback(
    ({ active }: DragCancelEvent) => {
      lastDragOverIdRef.current = null;
      setActiveEntryKey(null);
      onEntryDragCancel(parsePlannerEntryDragId(active.id));
    },
    [onEntryDragCancel]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={plannerCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  style: CSSProperties;
  isDragging: boolean;
  isOver: boolean;
}

interface PlannerDraggableEntryProps {
  entryKey: string;
  day?: string;
  surface?: PlannerSortableSurface;
  disabled?: boolean;
  children: (props: PlannerDraggableEntryRenderProps) => ReactNode;
}

export function PlannerSortableDayList({
  day,
  entryKeys,
  surface,
  children,
}: {
  day: string;
  entryKeys: readonly string[];
  surface: PlannerSortableSurface;
  children: ReactNode;
}) {
  const entryKeyList = entryKeys.join("\u0001");
  const items = useMemo(() => {
    const keys = entryKeyList === "" ? [] : entryKeyList.split("\u0001");
    return keys.map((entryKey) =>
      plannerPreviewEntryDropId(day, entryKey, surface)
    );
  }, [day, entryKeyList, surface]);
  return (
    <SortableContext items={items} strategy={verticalListSortingStrategy}>
      {children}
    </SortableContext>
  );
}

export function PlannerDraggableEntry({
  entryKey,
  day,
  surface = "calendar",
  disabled = false,
  children,
}: PlannerDraggableEntryProps) {
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
    id: day
      ? plannerPreviewEntryDropId(day, entryKey, surface)
      : plannerEntryDragId(entryKey),
    data: { entryKey, day, surface },
    disabled,
  });
  return children({
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    style: sortableItemStyle(transform, transition, isDragging),
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
  const { setNodeRef } = useDroppable({
    id: plannerDayDropId(day),
    data: { day },
  });
  const { active, over } = useDndContext();
  const target = over ? parsePlannerDragTarget(over.id) : null;
  const isOver = Boolean(
    active &&
      ((target?.type === "day" && target.day === day) ||
        (target?.type === "preview_entry" &&
          target.surface === "calendar" &&
          target.day === day))
  );
  return children({ setNodeRef, isOver });
}

interface PlannerDraggablePreviewEntryProps {
  day: string;
  entryKey: string;
  surface?: PlannerSortableSurface;
  disabled?: boolean;
  children: (
    props: PlannerDraggableEntryRenderProps
  ) => ReactNode;
}

export function PlannerDraggablePreviewEntry({
  day,
  entryKey,
  surface = "checklist",
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
    id: plannerPreviewEntryDropId(day, entryKey, surface),
    data: { entryKey, day, surface },
    disabled,
  });
  return children({
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    style: sortableItemStyle(transform, transition, isDragging),
    isDragging,
    isOver: isOver && !isDragging,
  });
}

