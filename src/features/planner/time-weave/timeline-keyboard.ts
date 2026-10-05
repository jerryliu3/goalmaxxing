import type { KeyboardCoordinateGetter } from "@dnd-kit/core";
import { parsePlannerDragTarget } from "@/features/planner/planner-drag-target";

export const timelineKeyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates, context }) => {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") return undefined;
  const day = context.droppableContainers.getEnabled().find((container) => parsePlannerDragTarget(container.id)?.type === "day");
  const width = day ? context.droppableRects.get(day.id)?.width : undefined;
  if (!width) return undefined;
  event.preventDefault();
  return { x: currentCoordinates.x + (event.code === "ArrowLeft" ? -width : width), y: currentCoordinates.y };
};
