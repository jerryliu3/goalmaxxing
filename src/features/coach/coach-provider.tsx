"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useCoachController } from "./use-coach-controller";

export type CoachController = ReturnType<typeof useCoachController>;
const CoachContext = createContext<CoachController | null>(null);
export function useCoach() { return useContext(CoachContext); }
export function CoachProvider({ children, userId, enabled, digestEnabled = false }: {
  children: ReactNode; userId: string; enabled: boolean; digestEnabled?: boolean;
}) {
  return enabled ? <EnabledCoachProvider key={userId} userId={userId} digestEnabled={digestEnabled}>{children}</EnabledCoachProvider> : children;
}
function EnabledCoachProvider({ children, userId, digestEnabled }: { children: ReactNode; userId: string; digestEnabled: boolean }) {
  const controller = useCoachController(userId, digestEnabled);
  return <CoachContext.Provider value={controller}>{children}</CoachContext.Provider>;
}
