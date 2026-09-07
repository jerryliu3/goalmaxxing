import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type Collision,
  type CollisionDetection,
} from "@dnd-kit/core";
import {
  parsePlannerDragTarget,
  parsePlannerEntryDragId,
  PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX,
} from "@/features/planner/planner-drag-target";

function isPreviewEntryDropId(id: Collision["id"]) {
  return (
    typeof id === "string" &&
    id.startsWith(PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX)
  );
}

export function preferNestedPlannerEntryCollisions<T extends { id: Collision["id"] }>(
  collisions: T[]
): T[] {
  const nested = collisions.filter((hit) => isPreviewEntryDropId(hit.id));
  return nested.length > 0 ? nested : collisions;
}

export function excludeActivePlannerEntryCollisions<T extends { id: Collision["id"] }>(
  collisions: T[],
  activeEntryKey: string | null
): T[] {
  if (!activeEntryKey) {
    return collisions;
  }
  return collisions.filter((hit) => {
    const target = parsePlannerDragTarget(hit.id);
    return !(
      target?.type === "preview_entry" && target.entryKey === activeEntryKey
    );
  });
}

export const plannerCollisionDetection: CollisionDetection = (args) => {
  const activeEntryKey = parsePlannerEntryDragId(args.active.id);
  const droppableContainers = args.droppableContainers.filter((container) => {
    const target = parsePlannerDragTarget(container.id);
    return !(
      target?.type === "preview_entry" &&
      activeEntryKey !== null &&
      target.entryKey === activeEntryKey
    );
  });
  const nextArgs = { ...args, droppableContainers };
  const pointerHits = excludeActivePlannerEntryCollisions(
    pointerWithin(nextArgs),
    activeEntryKey
  );
  if (pointerHits.length > 0) {
    return preferNestedPlannerEntryCollisions(pointerHits);
  }
  const rectHits = excludeActivePlannerEntryCollisions(
    rectIntersection(nextArgs),
    activeEntryKey
  );
  if (rectHits.length > 0) {
    return preferNestedPlannerEntryCollisions(rectHits);
  }
  return excludeActivePlannerEntryCollisions(
    closestCenter(nextArgs),
    activeEntryKey
  );
};
