import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type Collision,
  type CollisionDetection,
  type DroppableContainer,
} from "@dnd-kit/core";
import {
  parsePlannerDragTarget,
  parsePlannerPreviewEntryDropId,
  PLANNER_PREVIEW_ENTRY_DROP_ID_PREFIX,
  type PlannerSortableSurface,
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

export function plannerListItemCollisions<T extends { id: Collision["id"] }>(
  collisions: T[],
  surface: PlannerSortableSurface,
  day: string
): T[] {
  return collisions.filter((hit) => {
    const target = parsePlannerDragTarget(hit.id);
    return (
      target?.type === "preview_entry" &&
      target.surface === surface &&
      target.day === day
    );
  });
}

function listDroppables(
  containers: DroppableContainer[],
  surface: PlannerSortableSurface,
  day: string
) {
  return containers.filter((container) => {
    const target = parsePlannerDragTarget(container.id);
    return (
      target?.type === "preview_entry" &&
      target.surface === surface &&
      target.day === day
    );
  });
}

function dayDroppables(containers: DroppableContainer[]) {
  return containers.filter(
    (container) => parsePlannerDragTarget(container.id)?.type === "day"
  );
}

function closestAmong(
  args: Parameters<CollisionDetection>[0],
  containers: DroppableContainer[]
) {
  if (containers.length === 0) {
    return [];
  }
  return closestCenter({ ...args, droppableContainers: containers });
}

export const plannerCollisionDetection: CollisionDetection = (args) => {
  const activeList = parsePlannerPreviewEntryDropId(args.active.id);
  const pointerHits = pointerWithin(args);

  if (activeList) {
    const sameListPointerHits = plannerListItemCollisions(
      pointerHits,
      activeList.surface,
      activeList.day
    );
    if (sameListPointerHits.length > 0) {
      if (sameListPointerHits.length === 1) {
        return sameListPointerHits;
      }
      return closestAmong(
        args,
        args.droppableContainers.filter((container) =>
          sameListPointerHits.some((hit) => hit.id === container.id)
        )
      );
    }
  }

  const pointerDay = pointerHits
    .map((hit) => parsePlannerDragTarget(hit.id))
    .find((target) => target?.type === "day");

  if (
    pointerDay &&
    activeList &&
    pointerDay.day === activeList.day &&
    activeList.surface === "calendar"
  ) {
    const closestInList = closestAmong(
      args,
      listDroppables(args.droppableContainers, activeList.surface, activeList.day)
    );
    if (closestInList.length > 0) {
      return closestInList;
    }
  }

  if (pointerDay) {
    return pointerHits.filter((hit) => {
      const target = parsePlannerDragTarget(hit.id);
      return target?.type === "day" && target.day === pointerDay.day;
    });
  }

  // Pointer is in a gutter between tiles (or otherwise outside a day).
  // Snap to the nearest day cell instead of the original list items.
  if (activeList?.surface === "calendar") {
    const closestDay = closestAmong(args, dayDroppables(args.droppableContainers));
    if (closestDay.length > 0) {
      return closestDay;
    }
  }

  if (activeList) {
    const closestInList = closestAmong(
      args,
      listDroppables(args.droppableContainers, activeList.surface, activeList.day)
    );
    if (closestInList.length > 0) {
      return closestInList;
    }
  }

  const rectHits = rectIntersection(args);
  const dayRectHits = rectHits.filter((hit) => {
    const target = parsePlannerDragTarget(hit.id);
    return target?.type === "day";
  });
  if (dayRectHits.length > 0) {
    return dayRectHits;
  }
  return closestCenter(args);
};
