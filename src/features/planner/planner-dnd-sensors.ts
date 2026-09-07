import {
  MouseSensor,
  TouchSensor,
  type MouseSensorOptions,
  type TouchSensorOptions,
} from "@dnd-kit/core";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";

const PLANNER_DRAG_IGNORE_SELECTOR =
  "[data-plan-completion-hit], [data-motion='completion-toggle']";

export function isPlannerCompletionPointerEvent(event: Event) {
  const target = event.target;
  return (
    target instanceof Element && Boolean(target.closest(PLANNER_DRAG_IGNORE_SELECTOR))
  );
}

export class PlannerMouseSensor extends MouseSensor {
  static activators = [
    {
      eventName: "onMouseDown" as const,
      handler: (
        { nativeEvent: event }: ReactMouseEvent,
        { onActivation }: MouseSensorOptions
      ) => {
        if (event.button === 2) {
          return false;
        }
        if (isPlannerCompletionPointerEvent(event)) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

export class PlannerTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: (
        { nativeEvent: event }: ReactTouchEvent,
        { onActivation }: TouchSensorOptions
      ) => {
        if (event.touches.length > 1) {
          return false;
        }
        if (isPlannerCompletionPointerEvent(event)) {
          return false;
        }
        onActivation?.({ event });
        return true;
      },
    },
  ];
}
