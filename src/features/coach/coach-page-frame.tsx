"use client";
import type { ReactNode } from "react";
import { useCoach } from "./coach-provider";
import s from "./coach.module.css";

export function CoachPageFrame({ children }: { children: ReactNode }) {
  const coach = useCoach();
  return <div className={s.pageFrame} data-mode={coach?.mode ?? "closed"} inert={coach?.mode === "expanded"}>{children}</div>;
}
