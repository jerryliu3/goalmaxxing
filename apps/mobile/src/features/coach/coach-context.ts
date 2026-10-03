import { createContext, useContext } from "react";
import type { NativeCoachController } from "./CoachProvider";

export const NativeCoachContext = createContext<NativeCoachController | null>(null);
export function useNativeCoach() { return useContext(NativeCoachContext); }
