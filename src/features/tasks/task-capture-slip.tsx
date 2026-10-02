"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { captureViewportRect, type ViewportRectSnapshot } from "@/lib/xp/events";

export interface TaskCaptureSlipState {
  taskId: string;
  title: string;
  origin: ViewportRectSnapshot;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  paddingLeft: number;
}

export function captureTaskSlip(input: HTMLInputElement, taskId: string, title: string): TaskCaptureSlipState {
  const style = getComputedStyle(input);
  return {
    taskId, title, origin: captureViewportRect(input),
    fontFamily: style.fontFamily,
    fontSize: parseFloat(style.fontSize),
    fontWeight: style.fontWeight,
    paddingLeft: parseFloat(style.paddingLeft),
  };
}

/** The submitted text stays opaque as its paper peels out of the input and lands. */
export function TaskCaptureSlip({ capture, targetRef, onDone }: {
  capture: TaskCaptureSlipState;
  targetRef: RefObject<HTMLSpanElement | null>;
  onDone: () => void;
}) {
  const still = useReducedMotion();
  const [landing, setLanding] = useState<ViewportRectSnapshot | null>(null);
  useLayoutEffect(() => {
    const target = targetRef.current;
    if (still || !target || capture.origin.width === 0) {
      onDone();
      return;
    }
    setLanding(captureViewportRect(target));
  }, [capture, onDone, still, targetRef]);

  if (!landing || still) return null;
  const { origin, paddingLeft } = capture;
  const height = Math.max(origin.height, landing.height + 8);
  return createPortal(
    <motion.div
      aria-hidden="true"
      className="task-capture-slip"
      data-task-capture-slip={capture.taskId}
      style={{ fontFamily: capture.fontFamily, fontSize: capture.fontSize, fontWeight: capture.fontWeight, paddingLeft }}
      initial={{ x: origin.left, y: origin.top, width: origin.width, height: origin.height, rotate: 0 }}
      animate={{
        x: [origin.left, origin.left + 5, landing.left - paddingLeft],
        y: [origin.top, origin.top + 8, landing.top - (height - landing.height) / 2],
        width: [origin.width, origin.width, landing.width + paddingLeft + 8],
        height: [origin.height, origin.height, height],
        rotate: [0, -3, 0],
        boxShadow: ["0 0 0 transparent", "0 10px 18px #0002", "0 0 0 transparent"],
      }}
      transition={{ duration: 0.9, times: [0, 0.28, 1], ease: [0.22, 0.8, 0.2, 1] }}
      onAnimationComplete={onDone}
    >
      <span className="task-capture-slip-text">{capture.title}</span>
    </motion.div>,
    document.body
  );
}
