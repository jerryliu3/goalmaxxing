"use client";

import { createContext, useContext } from "react";

// Standalone surfaces have no shell loading screen or navigation intro.
export const PageOnboardingReadyContext = createContext(true);

export function usePageOnboardingReady() {
  return useContext(PageOnboardingReadyContext);
}
