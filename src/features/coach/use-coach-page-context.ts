"use client";
import { useEffect, useId } from "react";
import { usePathname } from "next/navigation";
import type { CoachPage } from "@cadence/shared/coach";
import { useCoach } from "./coach-provider";

export function useCoachPageContext(page: Partial<CoachPage> | null, priority = 0) {
  const id = useId();
  const path = usePathname();
  const register = useCoach()?.registerPage;
  const value = JSON.stringify(page);
  useEffect(() => {
    register?.(id, path, JSON.parse(value), priority);
    return () => register?.(id, path, null, priority);
  }, [id, path, value, priority, register]);
}
