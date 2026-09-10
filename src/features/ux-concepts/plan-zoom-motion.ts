export const PLAN_ZOOM_EASE = [0.16, 1, 0.3, 1] as const;

export const PLAN_ZOOM_TRANSITION = {
  type: "tween" as const,
  duration: 0.56,
  ease: PLAN_ZOOM_EASE,
};

export const PLAN_DIVE_TRANSITION = {
  type: "tween" as const,
  duration: 0.64,
  ease: PLAN_ZOOM_EASE,
};

export const PLAN_FADE_TRANSITION = {
  type: "tween" as const,
  duration: 0.32,
  ease: PLAN_ZOOM_EASE,
};

export type PlanZoomRange = "month" | "week" | "day";
export type PlanZoomMotion = "compress" | "dive" | "fade";
